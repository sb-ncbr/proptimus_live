import json
import math
import os
import re
import subprocess
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

import requests
from Bio.PDB import PDBParser
from flask import jsonify, request, send_from_directory, redirect, url_for, Response, Flask
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from app.job_state import read_job_state, write_job_state
from app.kubernetes_jobs import get_job_failure, submit_job

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
application.config['MAX_CONTENT_LENGTH'] = int(os.environ.get('MAX_UPLOAD_BYTES', 50 * 1024 * 1024))

root_dir = os.path.dirname(os.path.abspath(__file__))
execution_mode = os.environ.get("PROPTIMUS_EXECUTION_MODE", "local").lower()
if execution_mode not in {"local", "kubernetes", "worker"}:
    raise RuntimeError(f"Unsupported PROPTIMUS_EXECUTION_MODE: {execution_mode}")

if execution_mode == "local":
    process_manager = Manager()
    queue = process_manager.list()
    running = process_manager.list()
else:
    queue = []
    running = []
optimisers = []
number_of_processes = max(1, int(os.environ.get("PROPTIMUS_LOCAL_OPTIMISERS", "1")))
number_of_cpu = max(1, int(os.environ.get("PROPTIMUS_WORKER_PROCESSES", "60")))
code_pattern = re.compile(r"^[A-Za-z0-9]{4,30}$")


def normalise_ph(raw_ph: str | None) -> str:
    try:
        ph_value = float(raw_ph)
    except (TypeError, ValueError):
        raise ValueError("pH must be a number between 0 and 14.")
    if not math.isfinite(ph_value) or not 0 <= ph_value <= 14:
        raise ValueError("pH must be a number between 0 and 14.")
    normalised = f"{ph_value:.3f}".rstrip("0").rstrip(".")
    return normalised if "." in normalised else f"{normalised}.0"


def normalise_code(raw_code: str | None) -> str:
    code = (raw_code or "").strip().upper()
    if not code_pattern.fullmatch(code):
        raise ValueError("Use a four-character PDB ID or a short alphanumeric UniProt accession.")
    return code


def normalise_job_id(raw_id: str | None) -> str:
    try:
        raw_code, raw_ph = (raw_id or "").rsplit("_", 1)
    except ValueError:
        raise ValueError("The job ID must have the form <structure>_<pH>.")

    try:
        code = str(uuid.UUID(raw_code))
    except ValueError:
        code = normalise_code(raw_code)
    return f"{code}_{normalise_ph(raw_ph)}".upper()


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
    import biotite.structure as struc
    import biotite.structure.io as strucio
    from Bio.PDB import NeighborSearch

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


def optimise_structure(ID: str, track_running: bool = False):
    """Run one optimisation in the current process.

    Kubernetes workers call this function directly. The local development mode
    wraps it with the historical in-process queue.
    """
    ID = normalise_job_id(ID)
    import hydride
    import biotite.structure.io as strucio
    from Bio.PDB import Polypeptide
    from app.prime import PrimaryIntegrityMeasuresTaker
    from app.raphan import Raphan

    data_dir = f'{root_dir}/calculated_structures/{ID}'
    if track_running:
        running.append(ID)
    Path(f"{data_dir}/failed.txt").unlink(missing_ok=True)
    write_job_state(data_dir, "running", worker=os.environ.get("HOSTNAME", "local"))

    try:
        code, ph = ID.rsplit('_', 1)
        ph = normalise_ph(ph)
        pdb_file = f'{data_dir}/original.pdb'
        prepared_pdb_file = f'{data_dir}/prepared.pdb'
        optimised_pdb_file = f'{data_dir}/optimised.pdb'

        # get original pdb header
        with open(pdb_file, "r") as f:
            original_pdb_header = ""
            for line in f.readlines():
                fields = line.split()
                if fields and fields[0] in ["ATOM", "HETATM"]:
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
                with open(f'{data_dir}/propka.log', 'w') as propka_log:
                    subprocess.run(
                        [
                            'pdb2pqr30',
                            '--titration-state-method', 'propka',
                            '--with-ph', ph,
                            '--pdb-output', prepared_pdb_file,
                            pdb_file,
                            f'{data_dir}/{code}.pqr',
                        ],
                        stdout=propka_log,
                        stderr=subprocess.STDOUT,
                        check=True,
                    )

            # if structure contain heteroresidues, less accurate but more universal hydride is used
            else:
                molecule = strucio.load_structure(file_path=pdb_file,
                                                  model=1,
                                                  extra_fields=["charge"],
                                                  include_bonds=True)
                charges = hydride.estimate_amino_acid_charges(molecule, ph=float(ph))
                molecule.set_annotation("charge", charges)
                molecule_with_hydrogens, _ = hydride.add_hydrogen(molecule)
                molecule_with_hydrogens.coord = hydride.relax_hydrogen(molecule_with_hydrogens, iterations=100)
                strucio.save_structure(file_path=prepared_pdb_file,
                                       array=molecule_with_hydrogens)
            pdb_file = prepared_pdb_file

        # estimate calculation time
        structure = PDBParser(QUIET=True).get_structure(id="structure", file=pdb_file)[0]
        num_of_atoms = len(list(structure.get_atoms()))
        estimated_time = num_of_atoms / 10 + 100
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

        write_job_state(data_dir, "finished")
    except Exception as error:
        failure_traceback = traceback.format_exc()
        print(f"Optimisation failed: {error}")
        with open(f"{data_dir}/failed.txt", 'w') as f:
            f.write(failure_traceback)
        write_job_state(data_dir, "error", message=str(error))
        raise
    finally:
        if track_running and ID in running:
            running.remove(ID)


def optimise_structures():
    while len(queue):
        ID = queue.pop(0).upper()
        try:
            optimise_structure(ID, track_running=True)
        except Exception:
            # The failure is persisted by optimise_structure(). Continue with
            # the next local-development job instead of terminating the queue.
            continue


@application.route('/', methods=['GET', 'POST'])
def main_site():
    if request.method == 'POST':
        try:
            ph = normalise_ph(request.form.get('ph'))
        except ValueError as error:
            return jsonify({"status": "not applicable", "message": str(error)}), 406

        # if file was uploaded
        if 'file' in request.files and request.files['file'].filename:
            # get calculation data
            code = str(uuid.uuid4())
            try:
                pdb_str = request.files['file'].read().decode('utf-8')
            except UnicodeDecodeError:
                return jsonify({"status": "not applicable",
                                "message": "The uploaded PDB file must be UTF-8 text."}), 406

        else:
            try:
                code = normalise_code(request.form.get('code'))
            except ValueError as error:
                return jsonify({"status": "not applicable", "message": str(error)}), 406

        ID = f'{code}_{ph}'.upper()
        data_dir = f'{root_dir}/calculated_structures/{ID}'
        existing_state = read_job_state(data_dir)
        if (Path(data_dir) / "optimised.pdb").exists() and (Path(data_dir) / "tables.json").exists():
            return jsonify({"ID": ID, "status": "finished"}), 200
        if existing_state.get("status") in {"queued", "running"}:
            return jsonify({"ID": ID, "status": existing_state["status"]}), 200

        if 'file' not in request.files or not request.files['file'].filename:
            try:
                if len(code) == 4: # structure from PDB
                    response = requests.get(f'https://files.rcsb.org/download/{code}.pdb', timeout=(5, 30))
                else:
                    response = requests.get(f'https://alphafold.ebi.ac.uk/files/AF-{code}-F1-model_v6.pdb', timeout=(5, 30))
                response.raise_for_status()
                pdb_str = response.text
            except requests.RequestException:
                return jsonify({"status": "not applicable",
                                "message": f"No structure could be downloaded for {code}."}), 406

        # create data dir and save pdb file
        os.makedirs(data_dir, exist_ok=True)
        with open(f'{data_dir}/original.pdb', 'w') as pdb:
            pdb.write(pdb_str)

        # log access
        with open(f'{root_dir}/calculated_structures/logs.txt', 'a') as log_file:
            log_file.write(f'{request.remote_addr} {ID} {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}\n')

        # validate PDB file
        try:
            structure = PDBParser(QUIET=True).get_structure("structure", f'{data_dir}/original.pdb')
            if next(structure.get_atoms(), None) is None:
                raise ValueError("PDB file has no atoms")
        except Exception:
            return jsonify({"status": "not applicable",
                            "message": "The uploaded PDB file is not valid."}), 406

        Path(f"{data_dir}/failed.txt").unlink(missing_ok=True)
        write_job_state(data_dir, "queued", message="", worker="")

        if execution_mode == "kubernetes":
            try:
                kubernetes_job = submit_job(ID)
                # The pod may start before the create call returns. Merge the
                # Job name without overwriting a worker-written state.
                write_job_state(data_dir, None, kubernetes_job=kubernetes_job)
            except Exception:
                failure_traceback = traceback.format_exc()
                with open(f"{data_dir}/failed.txt", 'w') as failed_file:
                    failed_file.write(failure_traceback)
                write_job_state(data_dir, "error", message="The worker Job could not be created.")
                application.logger.exception("Kubernetes Job submission failed")
                return jsonify({"status": "error",
                                "message": "The worker Job could not be created."}), 503
        elif execution_mode == "local":
            # Local development fallback using the historical process queue.
            global optimisers
            optimisers = [optimiser for optimiser in optimisers if optimiser.is_alive()]
            queue.append(ID)
            if len(optimisers) < number_of_processes:
                optimiser = Process(target=optimise_structures)
                optimiser.start()
                optimisers.append(optimiser)
        else:
            return jsonify({"status": "error",
                            "message": "This container is configured as a computation worker."}), 503
        
        return jsonify({"ID": ID, "status": "submitted"}), 200

    job_states = [read_job_state(path).get("status")
                  for path in Path(f'{root_dir}/calculated_structures').glob('*_*')
                  if path.is_dir()]
    return jsonify({"running": job_states.count("running"),
                    "queued": job_states.count("queued"),
                    "calculated": len(glob(f'{root_dir}/calculated_structures/*_*/optimised.pdb'))})


@application.route('/results')
def results():
    try:
        ID = normalise_job_id(request.args.get('ID'))
        code, ph = ID.split('_')
    except (ValueError, AttributeError):
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
    try:
        ID = normalise_job_id(request.args.get('ID'))
    except ValueError:
        return jsonify({"available": False})
    data_dir = Path(root_dir) / "calculated_structures" / ID
    available = (data_dir / "optimised.pdb").is_file() and (data_dir / "tables.json").is_file()
    return jsonify({"available": available})




@application.route('/api/running_progress', methods=['GET'])
def running_progress():

    try:
        ID = normalise_job_id(request.args.get('ID'))
    except ValueError as error:
        return jsonify({"status": "not applicable",
                        "message": str(error),
                        "url": "",
                        "remaining_time": ""}), 406
    remaining_time = ""
    message = ""
    url = ""
    status = ""
    data_dir = Path(f"{root_dir}/calculated_structures/{ID}")
    persisted_state = read_job_state(data_dir)

    if persisted_state.get("status") == "error" or (data_dir / "failed.txt").exists():
        status = "error"
        message = persisted_state.get("message") or f"Optimization failed for ID={ID}."

    # check status
    elif (data_dir / "optimised.pdb").is_file() and (data_dir / "tables.json").is_file():
        status = "finished"
        url = url_for('results', ID=ID)
    elif data_dir.is_dir():
        status = persisted_state.get("status", "")
        if not status:
            if ID in queue:
                status = "queued"
            elif ID in running:
                status = "running"
            else:
                status = "queued"

        if status in {"queued", "running"} and execution_mode == "kubernetes":
            kubernetes_job = persisted_state.get("kubernetes_job")
            if kubernetes_job:
                try:
                    failure_message = get_job_failure(kubernetes_job)
                except Exception:
                    application.logger.exception("Could not query Kubernetes Job %s", kubernetes_job)
                    failure_message = None
                if failure_message:
                    status = "error"
                    message = failure_message
                    write_job_state(data_dir, "error", message=failure_message)

        if status == "running":
            try:
                with open(data_dir / "estimated_time.txt", 'r') as timefile:
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
            try:
                if len(code) == 4:
                    response = requests.head(f'https://files.rcsb.org/download/{code}.pdb', timeout=(5, 15))
                else:
                    response = requests.head(f'https://alphafold.ebi.ac.uk/files/AF-{code}-F1-model_v6.pdb', timeout=(5, 15))
            except requests.RequestException:
                application.logger.exception("Could not query the structure source for %s", code)
                return jsonify({"status": "error",
                                "message": "The structure source is temporarily unavailable.",
                                "url": "",
                                "remaining_time": ""}), 503
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
        ID = normalise_job_id(ID)
    except ValueError as error:
        return jsonify({"status": "not applicable", "message": str(error)}), 406
    try:
        with open(f"{root_dir}/calculated_structures/{ID}/interrezidual_interactions.json", 'r') as interactions_file:
            interactions = json.load(interactions_file)
        return jsonify(interactions)
    except FileNotFoundError:
        return jsonify({"status": "not applicable",
                        "message": f"No results for ID {ID.upper()}."}), 406



@application.route('/download_files')
def download_files():
    try:
        ID = normalise_job_id(request.args.get('ID'))
    except ValueError as error:
        return jsonify({"status": "not applicable", "message": str(error)}), 406
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
    try:
        ID = normalise_job_id(ID)
    except ValueError as error:
        return jsonify({"status": "not applicable", "message": str(error)}), 406
    filepath = f'{root_dir}/calculated_structures/{ID}/optimised.pdb'
    return Response(open(filepath, 'r').read(), mimetype='text/plain')


@application.route('/original_structure/<ID>')
def get_original_structure(ID: str):
    try:
        ID = normalise_job_id(ID)
    except ValueError as error:
        return jsonify({"status": "not applicable", "message": str(error)}), 406
    filepath = f'{root_dir}/calculated_structures/{ID}/original.pdb'
    return Response(open(filepath, 'r').read(), mimetype='text/plain')


@application.route('/residues_logs/<ID>')
def get_residues_logs(ID: str):
    try:
        ID = normalise_job_id(ID)
    except ValueError as error:
        return jsonify({"status": "not applicable", "message": str(error)}), 406
    filepath = f'{root_dir}/calculated_structures/{ID}/residues.logs'
    return Response(open(filepath, 'r').read(), mimetype='text/plain')


@application.route('/differences/<ID>')
def get_differences(ID: str):
    try:
        ID = normalise_job_id(ID)
    except ValueError as error:
        return jsonify({"status": "not applicable", "message": str(error)}), 406
    filepath = f"{root_dir}/calculated_structures/{ID}/differences.json"
    try:
        return Response(open(filepath, "r").read(), mimetype="text/json")
    except FileNotFoundError:
        return jsonify({"status": "not applicable",
                        "message": f"No differences data for ID {ID.upper()}."}), 406


@application.route('/warnings/<ID>')
def get_tables(ID: str):
    try:
        ID = normalise_job_id(ID)
    except ValueError as error:
        return jsonify({"status": "not applicable", "message": str(error)}), 406
    filepath = f"{root_dir}/calculated_structures/{ID}/tables.json"
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
    try:
        ID = normalise_job_id(ID)
    except ValueError as error:
        return jsonify({"status": "not applicable", "message": str(error)}), 406
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
    filepath = f"{root_dir}/calculated_structures/{ID}/{file_mapping[file_type]}"
    if not os.path.isfile(filepath):
        return jsonify(
            {"status": "not applicable", "message": f"File not found: {file_type}"}
        ), 404
    return Response(open(filepath, "r").read(), mimetype="text/plain")
