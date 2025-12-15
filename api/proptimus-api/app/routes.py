import os
import zipfile
from datetime import datetime
from glob import glob
from multiprocessing import Process, Manager
from random import random
from time import time
import json

import biotite
import biotite.structure as struc
import biotite.structure.io as strucio
import gemmi
import requests
from Bio.PDB import PDBParser, NeighborSearch
from flask import jsonify, request, send_from_directory, redirect, url_for, Response, Flask
from flask_cors import CORS

from raphan import Raphan

application = Flask(__name__)

# configure CORS to allow requests from your Next.js frontend
# in production, replace '*' with your specific frontend URL
cors_config = {
    "origins": os.environ.get('CORS_ORIGINS', 'http://147.251.245.48,http://localhost:3000').split(','),
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "Accept"],
    "supports_credentials": False,
    "max_age": 3600
}
CORS(application, resources={r"/*": cors_config})

# set up application variables
application.jinja_env.trim_blocks = True
application.jinja_env.lstrip_blocks = True
application.config['SECRET_KEY'] = str(random())

root_dir = os.path.dirname(os.path.abspath(__file__))
queue = Manager().list()
running = Manager().list()
optimisers = []
number_of_processes = 1
number_of_cpu = 64


def get_interresidual_interactions(PDB_file):
    inter_residual_interactions = {}
    biotite_structure = strucio.load_structure(PDB_file,
                                                extra_fields=["charge"],
                                                include_bonds=True)
    biopython_structure = PDBParser(QUIET=True).get_structure("structure", PDB_file)
    inter_residual_interactions["H-bonds"] = len(struc.hbond(biotite_structure))
    inter_residual_interactions["pi-pi interactions"] = len(struc.find_stacking_interactions(biotite_structure))
    kdtree = NeighborSearch(list(biopython_structure.get_atoms()))
    for atom in biopython_structure.get_atoms():
        atom.chg = 0
        if atom.name == "N":
            near_atoms = [near_atom for near_atom in kdtree.search(center=atom.coord, radius=1.75, level="A") if
                          atom.get_parent() == near_atom.get_parent()]
            if len(near_atoms) == 5:
                atom.chg = 1
        elif atom.name == "NZ" and atom.get_parent().resname == "LYS":
            near_atoms = [near_atom for near_atom in kdtree.search(center=atom.coord, radius=1.75, level="A") if
                          atom.get_parent() == near_atom.get_parent()]
            if len(near_atoms) == 5:
                atom.chg = 1
        elif atom.name == "CZ" and atom.get_parent().resname == "ARG":
            bonded_hydrogens = [near_atom for near_atom in kdtree.search(center=atom.coord, radius=2.25, level="A") if
                                atom.get_parent() == near_atom.get_parent() and near_atom.element == "H"]
            if len(bonded_hydrogens) == 5:
                atom.chg = 1
        elif atom.name == "CE1" and atom.get_parent().resname == "HIS":
            bonded_hydrogens = [near_atom for near_atom in kdtree.search(center=atom.coord, radius=2.25, level="A") if
                                atom.get_parent() == near_atom.get_parent() and near_atom.element == "H"]
            if len(bonded_hydrogens) == 3:
                atom.chg = 1
    charges = []
    for coord in biotite_structure.coord:
        charges.append(kdtree.search(coord, radius=0.1, level="A")[0].chg)
    biotite_structure.charge = charges
    inter_residual_interactions["pi-cation interactions"] = len(struc.find_pi_cation_interactions(biotite_structure))
    return inter_residual_interactions


def optimise_structures():
    while len(queue):
        ID = queue.pop(0)
        running.append(ID)
        code, ph = ID.split('_')
        data_dir = f'{root_dir}/calculated_structures/{ID}'
        pdb_file = f'{data_dir}/{code}.pdb'
        pdb_file_with_hydrogens = f'{data_dir}/{code}_added_H.pdb'

        # estimate calculation time
        structure = PDBParser(QUIET=True).get_structure(id="structure",
                                                        file=pdb_file)
        num_of_atoms = len(list(structure.get_atoms())) * 2
        estimated_time = num_of_atoms / number_of_cpu + num_of_atoms / 1000 + 30
        with open(f"{data_dir}/estimated_time.txt", 'w') as timefile:
            timefile.write(str(time() + estimated_time))

        # protonate structure
        os.system(f'pdb2pqr30 --titration-state-method propka '
                  f'--with-ph {ph} --pdb-output {pdb_file_with_hydrogens} {pdb_file} '
                  f'{data_dir}/{code}.pqr > {data_dir}/propka.log 2>&1 ')

        # optimise structure
        Raphan(data_dir=data_dir,
               PDB_file=pdb_file_with_hydrogens,
               cpu=number_of_cpu,
               delete_auxiliary_files=True).optimise()

        with open(f"{data_dir}/interrezidual_interacitons.json", 'w') as inter_residual_interactions_file:
            json.dump({"original structure": get_interresidual_interactions(pdb_file_with_hydrogens),
                       "optimised structure": get_interresidual_interactions(f"{data_dir}/{code}_added_H_optimised.pdb")},
                      inter_residual_interactions_file,
                      indent=4)

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

    try:
        with open(f"{root_dir}/calculated_structures/{ID}/interrezidual_interacitons.json", 'r') as inter_residual_interactions_file:
            inter_residual_interactions = json.load(inter_residual_interactions_file)
    except FileNotFoundError:
        return jsonify({"ID": ID,
                        "code": code,
                        "ph": ph})

    return jsonify({"ID": ID,
                    "code": code,
                    "ph": ph,
                    "hbonds original": inter_residual_interactions["original structure"]["H-bonds"],
                    "hbonds optimised": inter_residual_interactions["optimised structure"]["H-bonds"],
                    "pipi original": inter_residual_interactions["original structure"]["pi-pi interactions"],
                    "pipi optimised": inter_residual_interactions["optimised structure"]["pi-pi interactions"],
                    "catpi original": inter_residual_interactions["original structure"]["pi-cation interactions"],
                    "catpi optimised": inter_residual_interactions["optimised structure"]["pi-cation interactions"]})


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
            with open(f"{root_dir}/calculated_structures/{ID}/estimated_time.txt", 'r') as timefile:
                remaining_seconds = float(timefile.read()) - time()
                if remaining_seconds < 0:
                    remaining_time = "The calculation is taking longer than usual. If the calculation does not finish soon, please contact us."
                if remaining_seconds < 60:
                    remaining_time = "less then 1 minute"
                else:
                    remaining_time = f"{round(remaining_seconds / 60)} minutes"

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
