import json
import os
import uuid
import zipfile
from collections import defaultdict
from datetime import datetime
from glob import glob
from multiprocessing import Process, Manager
from pathlib import Path
from random import random
from time import time
import traceback

import hydride
import biotite.structure as struc
import biotite.structure.io as strucio
import requests
from Bio.PDB import PDBParser, NeighborSearch, Polypeptide
from flask import jsonify, request, send_from_directory, redirect, url_for, Response, Flask
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from app.prime import PrimaryIntegrityMeasuresTaker
from app.raphan import Raphan

application = Flask(__name__)
application.wsgi_app = ProxyFix(application.wsgi_app, x_for=1, x_proto=1, x_host=1)

# configure CORS to allow requests from your Next.js frontend
# in production, replace '*' with your specific frontend URL
cors_config = {
    "origins": os.environ.get('CORS_ORIGINS', 'http://147.251.245.48,https://147.251.245.48,http://proptimus.ceitec.cz,https://proptimus.ceitec.cz,http://proptimus.biodata.ceitec.cz,https://proptimus.biodata.ceitec.cz,http://localhost:3000,https://147.251.245.48').split(','),
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
number_of_cpu = 60


def residue_id(biotite_structure, atom_index):
    return (str(biotite_structure.chain_id[atom_index]),
            int(biotite_structure.res_id[atom_index]),
            str(biotite_structure.res_name[atom_index]))


def _external_scheme() -> str:
    forwarded_proto = request.headers.get("X-Forwarded-Proto", "")
    if forwarded_proto:
        return forwarded_proto.split(",")[0].strip()
    return request.scheme


def write_additional_info(original_PDB_file,
                          optimised_PDB_file,
                          unconverged_residues_ids,
                          data_dir):
    # interresidual interactions
    sum_interactions = {}
    interactions = {}
    biopython_structures = {}
    biotite_structures = {}
    for PDB_file, tag in zip([original_PDB_file, optimised_PDB_file], ["original", "optimised"]):
        biotite_structure = strucio.load_structure(PDB_file,
                                                   extra_fields=["charge"],
                                                   include_bonds=True,
                                                   model=1)
        biotite_structures[tag] = biotite_structure
        biopython_structure = PDBParser(QUIET=True).get_structure("structure", PDB_file)[0]
        biopython_structures[tag] = biopython_structure
        hbonds = struc.hbond(biotite_structure)
        sum_interactions[f"hbonds {tag}"] = len(hbonds)
        interactions[f"hbonds {tag}"] = set(tuple(residue_id(biotite_structure, atom_index) for atom_index in sorted([hbond[0], hbond[2]])) for hbond in hbonds)
        pipi_interactions = struc.find_stacking_interactions(biotite_structure)
        sum_interactions[f"pipi {tag}"] = len(pipi_interactions)
        interactions[f"pipi {tag}"] = set(tuple(residue_id(biotite_structure, atom_index) for atom_index in sorted([pipi[0][0], pipi[1][0]])) for pipi in pipi_interactions)
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
        catpi_interactions = struc.find_pi_cation_interactions(biotite_structure)
        sum_interactions[f"catpi {tag}"] = len(catpi_interactions)
        interactions[f"catpi {tag}"] = set(tuple(residue_id(biotite_structure, atom_index) for atom_index in sorted([catpi[0][0], catpi[1]])) for catpi in catpi_interactions)
    sum_interactions["number of atoms"] = len(list(biopython_structure.get_atoms()))
    with open(f"{data_dir}/interrezidual_interactions.json", 'w') as interresidual_interactions_file:
        json.dump(sum_interactions,
                  interresidual_interactions_file,
                  indent = 4)

    # coloring structure according change during optimisation
    differences = []
    for atom1, atom2 in zip(biopython_structures["original"].get_atoms(),
                            biopython_structures["optimised"].get_atoms()):
        differences.append({"chain_id": atom1.get_parent().get_parent().id,
                            "residue_id": atom1.get_parent().id[1],
                            "atom_id": atom1.id,
                            "value": float(atom1 - atom2)})
    with open(f"{data_dir}/differences.json", 'w') as differences_file:
        json.dump(differences,
                  differences_file,
                  indent = 4)

    # data for tables with logs
    # repair of residues
    repair_logs = {}
    try:
        with open(f"{data_dir}/prime_log.json", 'r', encoding='utf-8') as prime_log_file:
            prime_logs = json.load(prime_log_file)
            residues = list(biopython_structure.get_residues())
            for side_chain_error in prime_logs["side_chain_errors"]["list"]:
                for residue_index in side_chain_error["affected_residues"]:
                    if side_chain_error["repaired"]:
                        message = "Residue was repaired."
                    else:
                        message = "Residue was not repaired."
                    repair_logs[residue_index] = {"chain_id": residues[residue_index].get_parent().id,
                                                  "residue_id": residue_index,
                                                  "residue_name": residues[residue_index].resname,
                                                  "message": message}
            for backbone_error in prime_logs["backbone_errors"]["list"]:
                residue_index = backbone_error["affected_residues"][0]
                repair_logs[residue_index] = {"chain_id": residues[residue_index].get_parent().id,
                                              "residue_id": residue_index,
                                              "residue_name": residues[residue_index].resname,
                                              "message": "Residue was not repaired."}
    except FileNotFoundError:
        pass
    repair_logs = sorted(repair_logs.values(), key=lambda x: x["residue_id"])
    # optimisation issues
    for unconverged_residue_id in unconverged_residues_ids:
        unconverged_residue_id["message"] = "Optimisation of residue was not converged."
    # interactions
    interactions_messages = defaultdict(list)
    for added_hydrogen_bond in interactions["hbonds optimised"] - interactions["hbonds original"]:
        interactions_messages[added_hydrogen_bond].append("Hydrogen bond(s) was formed.")
    for added_pipi in interactions["pipi optimised"] - interactions["pipi original"]:
        interactions_messages[added_pipi].append("π-π interaction was formed.")
    for added_pipi in interactions["catpi optimised"] - interactions["catpi original"]:
        interactions_messages[added_pipi].append("Cation-π interaction was formed.")
    for broken_hydrogen_bond in interactions["hbonds original"] - interactions["hbonds optimised"]:
        interactions_messages[broken_hydrogen_bond].append("Hydrogen bond(s) was broken.")
    for broken_pipi in interactions["pipi original"] - interactions["pipi optimised"]:
        interactions_messages[broken_pipi].append("π-π interaction was broken.")
    for broken_pipi in interactions["catpi original"] - interactions["catpi optimised"] :
        interactions_messages[broken_pipi].append("Cation-π interaction was broken.")
    interactions_logs = []
    for ((chain_id_1, res_id_1, res_name_1), (chain_id_2, res_id_2, res_name_2)), messages in interactions_messages.items():
        interactions_logs.append({"chain_id_1": chain_id_1,
                                  "residue_id_1": res_id_1,
                                  "residue_name_1": res_name_1,
                                  "chain_id_2": chain_id_2,
                                  "residue_id_2": res_id_2,
                                  "residue_name_2": res_name_2,
                                  "message": " ".join(messages)})
    interactions_logs.sort(key=lambda x: (x['chain_id_1'], x['residue_id_1']))

    tables_logs = {"repair":       {"title": "residue repair",
                                    "no_data_message": "No non-physically predicted atoms detected.",
                                    "data": repair_logs},
                   "optimisation": {"title": "Optimisation issues",
                                    "no_data_message": "No optimisation issues.",
                                    "data": unconverged_residues_ids},
                   "interactions": {"title": "Interresidual interactions",
                                    "no_data_message": "No change.",
                                    "data": interactions_logs}}
    with open(f"{data_dir}/tables.json", 'w') as tables_logs_file:
        json.dump(tables_logs,
                  tables_logs_file,
                  indent = 4)


def optimise_structures():
    while len(queue):
        try:
            ID = queue.pop(0).upper()
            running.append(ID)
            code, ph = ID.split('_')
            data_dir = f'{root_dir}/calculated_structures/{ID}'
            pdb_file = f'{data_dir}/original.pdb'
            prepared_pdb_file = f'{data_dir}/prepared.pdb'
            optimised_pdb_file = f'{data_dir}/optimised.pdb'

            # get original pdb header
            with open(pdb_file, "r") as f:
                original_pdb_header = ""
                for line in f.readlines():
                    if line.split()[0] in ["ATOM", "HETATM"]:
                        break
                    original_pdb_header += line

            structure = PDBParser(QUIET=True).get_structure(id="structure", file=pdb_file)[0]
            if all(atom.element != "H" for atom in structure.get_atoms()):

                # if structure is downloaded from AlphaFold DB, correct it first
                if 4 < len(code) < 30:
                    try:
                        PrimaryIntegrityMeasuresTaker(Path(pdb_file),
                                                      json_logs_dir=Path(f"{data_dir}")).process_structure()
                        if Path(f"{data_dir}/correction_sicc_af").exists():
                            pdb_file = glob(f"{data_dir}/correction_sicc_af/original_corrected.pdb")[0]
                    except KeyError:
                        pass

                # if structure contain only standard aminoacids, pdb2pqr can be used
                if all(Polypeptide.is_aa(res.resname, standard=True) for res in structure.get_residues()):
                    os.system(f'pdb2pqr30 --titration-state-method propka '
                              f'--with-ph {ph} --pdb-output {prepared_pdb_file} {pdb_file} '
                              f'{data_dir}/{code}.pqr > {data_dir}/propka.log 2>&1 ')

                # if structure contain heteroresidues, less accurate but more universal hydride is used
                else:
                    molecule = strucio.load_structure(file_path=pdb_file,
                                                      model=1,
                                                      extra_fields=["charge"],
                                                      include_bonds=True)
                    charges = hydride.estimate_amino_acid_charges(molecule, ph=float(ph))
                    molecule.set_annotation("charge", charges)
                    molecule_with_hydrogens, _ = hydride.add_hydrogen(molecule)
                    molecule_with_hydrogens.coord = hydride.relax_hydrogen(molecule_with_hydrogens)
                    strucio.save_structure(file_path=prepared_pdb_file,
                                           array=molecule_with_hydrogens)
                pdb_file = prepared_pdb_file

            # estimate calculation time
            structure = PDBParser(QUIET=True).get_structure(id="structure", file=pdb_file)[0]
            num_of_atoms = len(list(structure.get_atoms()))
            estimated_time = num_of_atoms / 15 + 100
            if not all(Polypeptide.is_aa(res.resname, standard=True) for res in structure.get_residues()):
                estimated_time *= 2
            with open(f"{data_dir}/estimated_time.txt", 'w') as timefile:
                timefile.write(str(time() + estimated_time))

            # optimise structure
            raphan = Raphan(data_dir=data_dir,
                            PDB_file=pdb_file,
                            cpu=number_of_cpu,
                            delete_auxiliary_files=True)
            raphan.optimise()

            write_additional_info(original_PDB_file=pdb_file,
                                  optimised_PDB_file=optimised_pdb_file,
                                  unconverged_residues_ids=raphan.unconverged_residues_ids,
                                  data_dir=data_dir)

            # add header back because of Mol*
            optimised_pdb_str = original_pdb_header
            with open(optimised_pdb_file, "r") as f:
                for line in f.readlines():
                    optimised_pdb_str += line
            with open(optimised_pdb_file, "w") as f:
                f.write(optimised_pdb_str)
        except Exception as e:
            print(f"Optimisation failed: {e}")
            with open(f"{data_dir}/failed.txt", 'w') as f:
                f.write(traceback.format_exc())
        finally:
            running.remove(ID)


@application.route('/', methods=['GET', 'POST'])
def main_site():
    if request.method == 'POST':
        ph = request.form.get('ph')

        # if file was uploaded
        if 'file' in request.files and request.files['file'].filename:
            # get calculation data
            code = uuid.uuid4()
            pdb_str = request.files['file'].read().decode('utf-8')

        else:
            code = request.form.get('code', '').strip()
            if len(code) == 4: # structure from PDB
                pdb_str = requests.get(f'https://files.rcsb.org/download/{code}.pdb').text
            else:
                pdb_str = requests.get(f'https://alphafold.ebi.ac.uk/files/AF-{code}-F1-model_v6.pdb').text

        # create data dir and save pdb file
        ID = f'{code}_{ph}'.upper()
        data_dir = f'{root_dir}/calculated_structures/{ID}'
        os.makedirs(data_dir, exist_ok=True)
        with open(f'{data_dir}/original.pdb', 'w') as pdb:
            pdb.write(pdb_str)

        # log access
        with open(f'{root_dir}/calculated_structures/logs.txt', 'a') as log_file:
            log_file.write(f'{request.remote_addr} {ID} {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}\n')

        # validate PDB file
        try:
            PDBParser(QUIET=True).get_structure("structure", f'{data_dir}/original.pdb')
        except:
            return jsonify({"status": "not applicable",
                            "message": "The uploaded PDB file is not valid."}), 406

        # create and submit job (common for both paths)
        global optimisers
        optimisers = [optimiser for optimiser in optimisers if optimiser.is_alive()]
        queue.append(ID)
        if len(optimisers) < number_of_processes:
            optimiser = Process(target=optimise_structures)
            optimiser.start()
            optimisers.append(optimiser)
        
        return jsonify({"ID": ID, "status": "submitted"}), 200

    return jsonify({"running": len(running),
                    "queued": len(queue),
                    "calculated": len(glob(f'{root_dir}/calculated_structures/*_*/optimised.pdb'))})


@application.route('/results')
def results():
    ID = request.args.get('ID')

    try:
        code, ph = ID.split('_')
    except:
        return redirect(url_for('main_site'))

    data_dir = f'{root_dir}/calculated_structures/{ID.upper()}'
    if not os.path.isdir(data_dir):
        return jsonify({"status": "not applicable",
                        "message": f"No results for ID {ID.upper()}."}), 406

    pdb_files = {}
    scheme = _external_scheme()
    for file_type in ["optimised", "original", "trajectory", "prepared"]:
        filepath = os.path.join(data_dir, f"{file_type}.pdb")
        if os.path.isfile(filepath):
            pdb_files[file_type] = url_for(
                "get_pdb_file", ID=ID.upper(), file_type=file_type, _external=True, _scheme=scheme
            )
        else:
            pdb_files[file_type] = None

    return jsonify({"id": ID.upper(), "code": code, "ph": ph, "pdb_files": pdb_files})


@application.route('/api/available_results', methods=['GET'])
def available_results():
    ID = request.args.get('ID').upper()
    if Path(f"{root_dir}/calculated_structures/{ID}").exists():
        available = True
    else:
        available = False
    return jsonify({"available": available})




@application.route('/api/running_progress', methods=['GET'])
def running_progress():

    ID = request.args.get('ID').upper()
    remaining_time = ""
    message = ""
    url = ""
    status = ""

    if Path(f"{root_dir}/calculated_structures/{ID}/failed.txt").exists():
        status = "running"
        remaining_time = f"∞ (Optimization failed. Please contact us and provide the ID={ID} so we can fix this issue."

    # check status
    elif os.path.isfile(f'{root_dir}/calculated_structures/{ID}/optimised.pdb') and os.path.isfile(f'{root_dir}/calculated_structures/{ID}/tables.json'):
        status = "finished"
        url = url_for('results', ID=ID)
    elif os.path.isdir(f'{root_dir}/calculated_structures/{ID}'):
        if ID in queue:
            status = "queued"
        elif ID in running:
            status = "running"
            try:
                with open(f"{root_dir}/calculated_structures/{ID}/estimated_time.txt", 'r') as timefile:
                    remaining_seconds = float(timefile.read()) - time()
                    if remaining_seconds < 0:
                        remaining_time = "The calculation is taking longer than usual. If the calculation does not finish soon, please contact us."
                    elif remaining_seconds < 60:
                        remaining_time = "less then 1 minute"
                    elif remaining_seconds < 120:
                        remaining_time = "1 minute"
                    else:
                        remaining_time = f"{round(remaining_seconds / 60)} minutes"
            except FileNotFoundError:
                remaining_time = ""

    else:
        try:
            code, _ = ID.split('_')
        except:
            status = "not applicable"
            message = "The ID was entered in the wrong format. The ID should be of the form <UniProt code>_<pH>."
        else:
            if len(code) == 4:
                response = requests.head(f'https://files.rcsb.org/download/{code}.pdb')
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

    status_code = 200
    if status == "not applicable":
        status_code = 406

    return jsonify({"status": status,
                    "message": message,
                    "url": url,
                    "remaining_time": remaining_time}), status_code
    

@application.route('/api/interactions/<ID>', methods=['GET'])
def get_interactions(ID: str):
    try:
        with open(f"{root_dir}/calculated_structures/{ID.upper()}/interrezidual_interactions.json", 'r') as interactions_file:
            interactions = json.load(interactions_file)
        return jsonify(interactions)
    except FileNotFoundError:
        return jsonify({"status": "not applicable",
                        "message": f"No results for ID {ID.upper()}."}), 406



@application.route('/download_files')
def download_files():
    ID = request.args.get('ID').upper()
    code, ph = ID.split('_')
    if len(code) == 36:
        code = "structure"
    data_dir = f'{root_dir}/calculated_structures/{ID}'
    with zipfile.ZipFile(f'{data_dir}/{ID}.zip', 'w') as zip:
        zip.write(f'{data_dir}/original.pdb', f'original.pdb')
        zip.write(f'{data_dir}/trajectory.pdb', f'trajectory.pdb')
        zip.write(f'{data_dir}/optimised.pdb',f'optimised.pdb')
        if Path(f"{data_dir}/prepared.pdb").exists():
            zip.write(f'{data_dir}/prepared.pdb', f'prepared.pdb')

    return send_from_directory(data_dir, f'{ID}.zip', as_attachment=True)


@application.route('/optimised_structure/<ID>')
def get_optimised_structure(ID: str):
    filepath = f'{root_dir}/calculated_structures/{ID.upper()}/optimised.pdb'
    return Response(open(filepath, 'r').read(), mimetype='text/plain')


@application.route('/original_structure/<ID>')
def get_original_structure(ID: str):
    filepath = f'{root_dir}/calculated_structures/{ID.upper()}/original.pdb'
    return Response(open(filepath, 'r').read(), mimetype='text/plain')


@application.route('/residues_logs/<ID>')
def get_residues_logs(ID: str):
    filepath = f'{root_dir}/calculated_structures/{ID.upper()}/residues.logs'
    return Response(open(filepath, 'r').read(), mimetype='text/plain')


@application.route('/differences/<ID>')
def get_differences(ID: str):
    filepath = f"{root_dir}/calculated_structures/{ID.upper()}/differences.json"
    try:
        return Response(open(filepath, "r").read(), mimetype="text/json")
    except FileNotFoundError:
        return jsonify({"status": "not applicable",
                        "message": f"No differences data for ID {ID.upper()}."}), 406


@application.route('/warnings/<ID>')
def get_tables(ID: str):
    filepath = f"{root_dir}/calculated_structures/{ID.upper()}/tables.json"
    try:
        return Response(open(filepath, "r").read(), mimetype="text/json")
    except FileNotFoundError:
        return jsonify({"status": "not applicable",
                        "message": f"No warnings data for ID {ID.upper()}."}), 406


@application.errorhandler(404)
def page_not_found(error):
    return jsonify({})


@application.route('/pdb_file/<ID>/<file_type>')
def get_pdb_file(ID: str, file_type: str):
    file_mapping = {
        "optimised": "optimised.pdb",
        "original": "original.pdb",
        "trajectory": "trajectory.pdb",
        "prepared": "prepared.pdb",
    }
    if file_type not in file_mapping:
        return jsonify(
            {"status": "not applicable", "message": f"Unknown file type: {file_type}"}
        ), 404
    filepath = f"{root_dir}/calculated_structures/{ID.upper()}/{file_mapping[file_type]}"
    if not os.path.isfile(filepath):
        return jsonify(
            {"status": "not applicable", "message": f"File not found: {file_type}"}
        ), 404
    return Response(open(filepath, "r").read(), mimetype="text/plain")
