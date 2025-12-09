import gemmi
import os
import requests
import zipfile
from datetime import datetime
from flask import  jsonify, render_template, flash, request, send_from_directory, redirect, url_for, Response, Flask, Markup
from flask_cors import CORS
from multiprocessing import Process, Manager
from random import random
from glob import glob
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
number_of_cpu = 6


def optimise_structures():
    while len(queue):
        ID = queue.pop(0)
        running.append(ID)
        code, ph = ID.split('_')
        data_dir = f'{root_dir}/calculated_structures/{ID}'
        pdb_file = f'{data_dir}/{code}.pdb'
        pdb_file_with_hydrogens = f'{data_dir}/{code}_added_H.pdb'

        # protonate structure
        os.system(f'/opt/miniconda3/bin/pdb2pqr30 --titration-state-method propka '
                  f'--with-ph {ph} --pdb-output {pdb_file_with_hydrogens} {pdb_file} '
                  f'{data_dir}/{code}.pqr > {data_dir}/propka.log 2>&1 ')

        # optimise structure
        Raphan(data_dir=data_dir,
               PDB_file=pdb_file_with_hydrogens,
               cpu=number_of_cpu,
               delete_auxiliary_files=True).optimise()

        running.remove(ID)


def job_status(ID: str):
    if os.path.isfile(f'{root_dir}/calculated_structures/{ID}/{ID.split("_")[0]}_added_H_optimised.pdb'):
        return "finished"
    elif os.path.isdir(f'{root_dir}/calculated_structures/{ID}'):
        if ID in queue:
            return "queued"
        else:
            return "running"
    return "unsubmitted"

@application.route('/', methods=['GET', 'POST'])
def main_site():

    if request.method == 'POST':
        # load user input
        code = request.form['code'].strip().upper()  # UniProt code, not case-sensitive
        print(code)
        ph = request.form['ph']
        if "." not in ph:
            ph = ph + ".0"
        ID = f'{code}_{ph}'

        # log access
        with open(f'{root_dir}/calculated_structures/logs.txt', 'a') as log_file:
            log_file.write(f'{request.remote_addr} {code} {ph} {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}\n')

        status = job_status(ID)

        if status == "finished":
            return redirect(url_for('results', ID=ID))

        elif status in ["queued", "running"]:
            flash(Markup(f'Optimisation of structure <strong>{code}</strong> with pH <strong>{ph}</strong> is already submitted. '
                         f'For job status visit <a href="https://fffold.biodata.ceitec.cz/results?ID={ID}" class="alert-link"'
                         f'target="_blank" rel="noreferrer">https://fffold.biodata.ceitec.cz/results?ID={ID}</a>.'), 'info')
            return jsonify({"running": len(running),
                            "queued": len(queue),
                            "calculated": len(glob(f'{root_dir}/calculated_structures/*'))})

        elif status == "unsubmitted":

            # download pdb
            response = requests.get(f'https://alphafold.ebi.ac.uk/files/AF-{code}-F1-model_v6.pdb')
            if response.status_code != 200:
                flash(Markup(f'The structure with code <strong>{code}</strong> '
                             f'is either not found in AlphaFold DB or the code is entered in the wrong format. '
                             f'UniProt code is allowed only in its short form (e.g. A0A1P8BEE7, B7ZW16). '
                             f'Other notations (e.g. A0A159JYF7_9DIPT, Q8WZ42-F2) are not supported. '
                             f'An alternative option is AlpfaFold DB Identifier (e.g. AF-L8BU87-F1).'), 'warning')
                return jsonify({"running": len(running),
                                "queued": len(queue),
                                "calculated": len(glob(f'{root_dir}/calculated_structures/*'))})
            data_dir = f'{root_dir}/calculated_structures/{ID}'
            try:
                os.mkdir(data_dir)
                with open(f'{data_dir}/{code}.pdb', 'w') as pdb:
                    pdb.write(response.text)
            except (OSError, PermissionError) as e:
                print(f"ERROR: Failed to create directory or write file: {e}")
                flash(Markup(f'Server error: Unable to create job directory. Please contact administrator.'), 'danger')
                return jsonify({"error": "Permission denied",
                                "running": len(running),
                                "queued": len(queue)})

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
                    "calculated": len(glob(f'{root_dir}/calculated_structures/*_*'))})


@application.route('/results')
def results():
    ID = request.args.get('ID')

    try:
        code, ph = ID.split('_')
    except:
        flash(Markup('The ID was entered in the wrong format. '
                     'The ID should be of the form <strong>&ltUniProt code&gt_&ltph&gt.'), 'danger')
        return redirect(url_for('main_site'))

    status = job_status(ID)

    if status == "unsubmitted":
        flash(Markup(f'There are no results for structure with UniProt <strong>{code}</strong> and pH <strong>{ph}</strong>.'), 'danger')
        return redirect(url_for('main_site'))

    if status == "queued":
        return jsonify({"code": code,
                        "ph": ph})

    elif status == "running":
        return jsonify({"ID": ID,
                        "code": code,
                        "ph": ph})

    return jsonify({"ID": ID,
                    "code": code,
                    "ph": ph})


@application.route('/api/running_progress', methods=['GET'])
def running_progress():
    ID = request.args.get('ID')

    try:
        code, _ = ID.split('_')
    except:
        return Response('The ID was entered in the wrong format. '
                     'The ID should be of the form <strong>&ltUniProt code&gt_&ltph&gt.',
                     status=404,
                     mimetype='text/plain')
    
    status = job_status(ID)
    response = { 'status': status }
    
    if status == 'unsubmitted':
        return jsonify(response)
    if status == 'queued':
        return jsonify(response)

    if status == 'finished':
        response.update({
            'url': url_for('results', ID=ID)
        })
        return jsonify(response)

    iterations = len(glob(f'{root_dir}/calculated_structures/{ID}/optimised_PDB/*.pdb'))
    percent_value = round(iterations / 50)
    percent_text = f"{iterations}/50"

    response.update({
        'percent_value': percent_value,
        'percent_text': percent_text,
        'remaining_time': 100
    })
    
    return jsonify(response)
    

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
