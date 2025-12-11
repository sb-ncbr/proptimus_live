import os
import zipfile
from datetime import datetime
from glob import glob
from multiprocessing import Process, Manager
from random import random

import gemmi
import requests
from flask import jsonify, request, send_from_directory, redirect, url_for, Response, Flask
from flask_cors import CORS

from raphan import Raphan

application = Flask(__name__)

# Configure CORS to allow requests from your Next.js frontend
# In production, replace '*' with your specific frontend URL
cors_config = {
    "origins": os.environ.get('CORS_ORIGINS', 'http://147.251.245.48,http://localhost:3000').split(','),
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "Accept"],
    "supports_credentials": False,
    "max_age": 3600
}
CORS(application, resources={r"/*": cors_config})

application.jinja_env.trim_blocks = True
application.jinja_env.lstrip_blocks = True
application.config['SECRET_KEY'] = str(random())
root_dir = os.path.dirname(os.path.abspath(__file__))

queue = Manager().list()
running = Manager().list()
optimisers = []
number_of_processes = 1
number_of_cpu = 63


def optimise_structures():
    while len(queue):
        ID = queue.pop(0)
        running.append(ID)
        code, ph = ID.split('_')
        data_dir = f'{root_dir}/calculated_structures/{ID}'
        pdb_file = f'{data_dir}/{code}.pdb'
        pdb_file_with_hydrogens = f'{data_dir}/{code}_added_H.pdb'

        # protonate structure
        os.system(f'pdb2pqr30 --titration-state-method propka '
                  f'--with-ph {ph} --pdb-output {pdb_file_with_hydrogens} {pdb_file} '
                  f'{data_dir}/{code}.pqr > {data_dir}/propka.log 2>&1 ')

        # optimise structure
        Raphan(data_dir=data_dir,
               PDB_file=pdb_file_with_hydrogens,
               cpu=number_of_cpu,
               delete_auxiliary_files=True).optimise()

        running.remove(ID)



@application.route('/', methods=['GET', 'POST'])
def main_site():
    if request.method == 'POST':
        # load user input

        code = request.form['code'].strip().upper()  # UniProt code, not case-sensitive
        ph = request.form['ph']
        if "." not in ph:
            ph = ph + ".0"
        ID = f'{code}_{ph}'

        # log access
        with open(f'{root_dir}/calculated_structures/logs.txt', 'a') as log_file:
            log_file.write(f'{request.remote_addr} {code} {ph} {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}\n')

        # download pdb
        response = requests.get(f'https://alphafold.ebi.ac.uk/files/AF-{code}-F1-model_v6.pdb')
        data_dir = f'{root_dir}/calculated_structures/{ID}'
        os.mkdir(data_dir)
        with open(f'{data_dir}/{code}.pdb', 'w') as pdb:
            pdb.write(response.text)

        # create and submit job
        global optimisers
        optimisers = [optimiser for optimiser in optimisers if optimiser.is_alive()]
        queue.append(ID)
        if len(optimisers) < number_of_processes:
            optimiser = Process(target=optimise_structures)
            optimiser.start()
            optimisers.append(optimiser)
        return redirect(url_for('results', ID=ID))

    return jsonify({"running": len(running),
                    "queued": len(queue),
                    "calculated": len(glob(f'{root_dir}/calculated_structures/*_*/*_added_H_optimised.pdb'))})


@application.route('/results')
def results():
    ID = request.args.get('ID')

    try:
        code, ph = ID.split('_')
    except:
        return redirect(url_for('main_site'))

    return jsonify({"ID": ID,
                    "code": code,
                    "ph": ph,
                    "hbonds original": 1000,
                    "hbonds optimised": 1200,
                    "pipi original": 10,
                    "pipi optimised": 12,
                    "catpi original": 10,
                    "catpi optimised": 12})


@application.route('/api/running_progress', methods=['GET'])
def running_progress():

    ID = request.args.get('ID')
    remaining_time = ""
    message = ""
    url = ""

    # check status
    if os.path.isfile(f'{root_dir}/calculated_structures/{ID}/{ID.split("_")[0]}_added_H_optimised.pdb'):
        status = "finished"
        url = url_for('results', ID=ID)
    elif os.path.isdir(f'{root_dir}/calculated_structures/{ID}'):
        if ID in queue:
            status = "queued"
        elif ID in running:
            status = "running"
            remaining_time = "10 seconds"
    else:
        try:
            code, _ = ID.split('_')
        except:
            status = "not applicable"
            message = "The ID was entered in the wrong format. The ID should be of the form <UniProt code>_<pH>."
        else:
            response = requests.head(f'https://alphafold.ebi.ac.uk/files/AF-{code}-F1-model_v6.pdb')
            if response.status_code != 200:
                status = "not applicable"
                message = (f'The structure with code {code} '
                           f'is either not found in AlphaFold DB or the code is entered in the wrong format. '
                           f'UniProt code is allowed only in its short form (e.g. A0A1P8BEE7, B7ZW16). '
                           f'Other notations (e.g. A0A159JYF7_9DIPT, Q8WZ42-F2) are not supported. ')
            else:
                status = "unsubmitted"

    return jsonify({"status": status,
                    "message": message,
                    "url": url,
                    "remaining_time": remaining_time})
    

@application.route('/download_files')
def download_files():
    ID = request.args.get('ID')
    code, _ = ID.split("_")
    data_dir = f'{root_dir}/calculated_structures/{ID}'
    with zipfile.ZipFile(f'{data_dir}/{ID}.zip', 'w') as zip:
        zip.write(f'{data_dir}/{code}_added_H_optimised.pdb',f'{code}_optimised.pdb')
        zip.write(f'{data_dir}/{code}.pdb', f'{code}_original.pdb')
    return send_from_directory(data_dir, f'{ID}.zip', as_attachment=True)


@application.route('/optimised_structure/<ID>')
def get_optimised_structure(ID: str):
    filepath = f'{root_dir}/calculated_structures/{ID}/{ID.split("_")[0]}_added_H_optimised.pdb'
    return Response(open(filepath, 'r').read(), mimetype='text/plain')


@application.route('/original_structure/<ID>')
def get_original_structure(ID: str):
    filepath = f'{root_dir}/calculated_structures/{ID}/{ID.split("_")[0]}_added_H.pdb'
    return Response(open(filepath, 'r').read(), mimetype='text/plain')


@application.route('/residues_logs/<ID>')
def get_residues_logs(ID: str):
    filepath = f'{root_dir}/calculated_structures/{ID}/residues.logs'
    return Response(open(filepath, 'r').read(), mimetype='text/plain')


@application.errorhandler(404)
def page_not_found(error):
    return jsonify({})
