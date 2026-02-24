#!/usr/bin/env python3
import argparse
import json
import os
import shutil
import subprocess
import tqdm
from Bio import SeqUtils
from Bio.PDB import Select, PDBIO, PDBParser, Superimposer, NeighborSearch, Structure
from math import dist
from multiprocessing import Pool, RawArray
from pathlib import Path
from rdkit import Chem
from time import time


def load_arguments():
    print("\nParsing arguments... ", end="", flush=True)
    parser = argparse.ArgumentParser()
    parser.add_argument('--PDB_file',
                        type=str,
                        required=True,
                        help='PDB file with structure, which should be optimised.')
    parser.add_argument('--data_dir',
                        type=str,
                        required=True,
                        help='Directory for saving results.')
    parser.add_argument('--cpu',
                        type=int,
                        required=False,
                        default=1,
                        help='How many CPUs should be used for the calculation.')
    parser.add_argument('--constrained_alpha_carbons_optimisations',
                        action="store_true",
                        help='For testing the methodology. '
                             'The original structure and the PROPTIMUS RAPHANgfnff optimized structure will be optimized with constrained alpha carbons.'
                             'Short comparison will be stored in <data_dir>/comparison.json. '
                             'Please note that optimization with constrained alpha carbons is computationally expensive for larger protein structures.')
    parser.add_argument("--delete_auxiliary_files",
                        action="store_true",
                        help="Auxiliary calculation files can be large. With this argument, "
                             "the auxiliary files will be deleted during the calculation."
                             "Do not use in combination with the argument --constrained_alpha_carbons_optimisations!")

    args = parser.parse_args()
    if not os.path.isfile(args.PDB_file):
        print(f"\nERROR! File {args.PDB_file} does not exist!\n")
        exit()
    if os.path.exists(args.data_dir):
        exit(f"\nError! Directory with name {args.data_dir} exists. "
             f"Remove existed directory or change --data_dir argument.")
    print("ok")
    return args


class AtomSelector(Select):
    """
    Support class for Biopython.
    After initialization, a set with all full ids of the atoms and set with all full ids of the residues to be
    written into the substructure must be stored in self.full_ids and self.res_full_ids.
    """

    def accept_atom(self, atom):
        return int(atom.full_id in self.full_ids)

    def accept_residue(self, residue):
        return int(residue.full_id in self.res_full_ids)


class Substructure_data:
    def __init__(self,
                 data_dir,
                 optimised_residue_index,
                 optimised_atoms,
                 final_optimised_atoms):
        self.data_dir = Path(data_dir)
        self.optimised_residue_index = optimised_residue_index
        self.archive = []
        self.converged = False
        self.optimised_atoms = optimised_atoms
        self.final_optimised_atoms = final_optimised_atoms


def init_worker(coordinates_param, updated_coordinates_param):
    global coordinates, updated_coordinates
    coordinates = coordinates_param
    updated_coordinates = updated_coordinates_param


def optimise_substructure(substructure_data,
                          iteration,
                          phase):
    # load atoms in 30A
    atoms_in_30A_structure = PDBParser(QUIET=True).get_structure(id="structure",
                                                                 file=substructure_data.data_dir / "atoms_in_30A.pdb")
    atoms_in_30A = list(atoms_in_30A_structure.get_atoms())
    for atom in atoms_in_30A:
        atom.coord = coordinates[(atom.serial_number - 1) * 3:(atom.serial_number - 1) * 3 + 3]

    if phase == "optimisation":
        optimised_atoms = set([atom for atom in atoms_in_30A if atom.serial_number in substructure_data.optimised_atoms])
        minimum_radius = 6
        flexible_radius = 4
        maximum_radius = 12
    elif phase == "final refinement":
        optimised_atoms = set([atom for atom in atoms_in_30A if atom.serial_number in substructure_data.final_optimised_atoms])
        minimum_radius = 8
        flexible_radius = 4
        maximum_radius = 12

    # find effective neighbourhood
    kdtree = NeighborSearch(atoms_in_30A)
    atoms_in_minimum_radius = []
    atoms_in_maximum_radius = []
    for optimised_residue_atom in optimised_atoms:
        atoms_in_minimum_radius.extend(kdtree.search(center=optimised_residue_atom.coord,
                                                     radius=minimum_radius,
                                                     level="A"))
        atoms_in_maximum_radius.extend(kdtree.search(center=optimised_residue_atom.coord,
                                                     radius=maximum_radius,
                                                     level="A"))

    # create pdb files to can load them with RDKit
    io = PDBIO()
    io.set_structure(atoms_in_30A_structure)
    selector = AtomSelector()
    selector.full_ids = set([atom.full_id for atom in atoms_in_minimum_radius])
    selector.res_full_ids = set([atom.get_parent().full_id for atom in atoms_in_minimum_radius])
    io.save(file=str(substructure_data.data_dir / "atoms_in_minimum_radius.pdb"),
            select=selector,
            preserve_atom_numbering=True)
    selector.full_ids = set([atom.full_id for atom in atoms_in_maximum_radius])
    selector.res_full_ids = set([atom.get_parent().full_id for atom in atoms_in_maximum_radius])
    io.save(file=str(substructure_data.data_dir / "atoms_in_maximum_radius.pdb"),
            select=selector,
            preserve_atom_numbering=True)

    # load pdb files with RDKit
    mol_min_radius = Chem.MolFromPDBFile(pdbFileName=str(substructure_data.data_dir / "atoms_in_minimum_radius.pdb"),
                                         removeHs=False,
                                         sanitize=False)
    mol_min_radius_conformer = mol_min_radius.GetConformer()
    mol_max_radius = Chem.MolFromPDBFile(pdbFileName=str(substructure_data.data_dir / "atoms_in_maximum_radius.pdb"),
                                         removeHs=False,
                                         sanitize=False)
    mol_max_radius_conformer = mol_max_radius.GetConformer()

    # dictionaries allow quick and precise matching of atoms from mol_min_radius and mol_max_radius
    mol_min_radius_coord_dict = {}
    for i, mol_min_radius_atom in enumerate(mol_min_radius.GetAtoms()):
        coord = mol_min_radius_conformer.GetAtomPosition(i)
        mol_min_radius_coord_dict[(coord.x, coord.y, coord.z)] = mol_min_radius_atom
    mol_max_radius_coord_dict = {}
    for i, mol_max_radius_atom in enumerate(mol_max_radius.GetAtoms()):
        coord = mol_max_radius_conformer.GetAtomPosition(i)
        mol_max_radius_coord_dict[(coord.x, coord.y, coord.z)] = mol_max_radius_atom

    # find atoms from mol_min_radius with broken bonds
    atoms_with_broken_bonds = []
    for mol_min_radius_atom in mol_min_radius.GetAtoms():
        coord = mol_min_radius_conformer.GetAtomPosition(mol_min_radius_atom.GetIdx())
        mol_max_radius_atom = mol_max_radius_coord_dict[(coord.x, coord.y, coord.z)]
        if len(mol_min_radius_atom.GetNeighbors()) != len(mol_max_radius_atom.GetNeighbors()):
            atoms_with_broken_bonds.append(mol_max_radius_atom)

    # create a substructure that will have only C-C bonds broken
    carbons_with_broken_bonds_coord = []
    substructure_coord_dict = mol_min_radius_coord_dict
    while atoms_with_broken_bonds:
        atom_with_broken_bonds = atoms_with_broken_bonds.pop(0)
        bonded_atoms = atom_with_broken_bonds.GetNeighbors()
        for bonded_atom in bonded_atoms:
            coord = mol_max_radius_conformer.GetAtomPosition(bonded_atom.GetIdx())
            if (coord.x, coord.y, coord.z) in substructure_coord_dict:
                continue
            else:
                if atom_with_broken_bonds.GetSymbol() == "C" and bonded_atom.GetSymbol() == "C":
                    carbons_with_broken_bonds_coord.append(mol_max_radius_conformer.GetAtomPosition(atom_with_broken_bonds.GetIdx()))
                    continue
                else:
                    atoms_with_broken_bonds.append(bonded_atom)
                    substructure_coord_dict[(coord.x, coord.y, coord.z)] = bonded_atom

    # create substructure in Biopython library
    substructure_atoms = [kdtree.search(center=coord,
                                        radius=0.1,
                                        level="A")[0] for coord in substructure_coord_dict.keys()]
    selector.full_ids = set([atom.full_id for atom in substructure_atoms])
    selector.res_full_ids = set([atom.get_parent().full_id for atom in substructure_atoms])
    io.save(file=str(substructure_data.data_dir / f"substructure_{iteration}.pdb"),
            select=selector,
            preserve_atom_numbering=True)
    substructure = PDBParser(QUIET=True).get_structure(id="structure",
                                                       file=substructure_data.data_dir / f"substructure_{iteration}.pdb")
    substructure_atoms = list(substructure.get_atoms())

    # definitions of which atoms should be constrained during optimization
    # optimized atoms are not constrained during optimisation and written into the overall structure
    # flexible atoms are not constrained during optimisation and are not written into the overall structure
    # constrained atoms are constrained during optimisation and are not written into the overall structure
    constrained_atoms_indices = []
    optimised_atoms_indices = []
    rigid_atoms = []  # constrained atoms without atoms close to carbons with broken bonds
    rigid_atoms_indices = []
    for i, atom in enumerate(substructure.get_atoms(),
                             start=1):
        if atom.name == "CA" and atom.element == "C" and not atom.get_parent().full_id[0].startswith("H_"):
            atom.mode = "constrained"
        elif atom in optimised_atoms:
            atom.mode = "optimised"
        elif any(dist(atom.coord, ra.coord) < flexible_radius for ra in optimised_atoms):
            atom.mode = "flexible"
        else:
            atom.mode = "constrained"

        if atom.mode == "optimised":
            optimised_atoms_indices.append(i)
        elif atom.mode == "constrained":
            constrained_atoms_indices.append(i)
            if any(dist(atom.coord, x) < 2 for x in carbons_with_broken_bonds_coord):
                continue
            else:
                rigid_atoms.append(atom)
                rigid_atoms_indices.append(i)

    # prepare xtb settings file
    max_cycle = len(optimised_atoms_indices) + iteration
    if max_cycle < 5:
        max_cycle = 5
    xtb_settings_template = f"""$constrain
    atoms: xxx
    force constant=10.0
    $end
    $opt
    maxcycle={max_cycle}
    microcycle={max_cycle + 1}
    $end
    """
    substructure_settings = xtb_settings_template.replace("xxx", ", ".join([str(i) for i in constrained_atoms_indices]))
    with open(substructure_data.data_dir / f"xtb_settings_{iteration}.inp", "w") as xtb_settings_file:
        xtb_settings_file.write(substructure_settings)

    # optimise substructure by xtb
    env = os.environ.copy()
    env.update({"OMP_STACKSIZE": "1G", "OMP_NUM_THREADS": "1,1", "OMP_MAX_ACTIVE_LEVELS": "1", "MKL_NUM_THREADS": "1"})
    subprocess.run(["xtb", f"substructure_{iteration}.pdb", "--gfnff", "--input", f"xtb_settings_{iteration}.inp", "--opt", "tight", "--alpb", "water", "--verbose"],
                   cwd=substructure_data.data_dir,
                   stdout=open(substructure_data.data_dir / f"xtb_output_{iteration}.txt", "w"),
                   stderr=open(substructure_data.data_dir / f"xtb_error_output_{iteration}.txt", "w"),
                   env=env,
                   shell=False)
    for f in substructure_data.data_dir.glob("gfnff*"):
        f.unlink()

    # check xtb convergence
    if not (substructure_data.data_dir / "xtbopt.pdb").exists():
        return None, None, None

    if (substructure_data.data_dir / "xtbopt.log").exists():
        (substructure_data.data_dir / "xtbopt.log").replace(substructure_data.data_dir / f"xtbopt_{iteration}.log")
    if (substructure_data.data_dir / "xtbopt.pdb").exists():
        (substructure_data.data_dir / "xtbopt.pdb").replace(substructure_data.data_dir / f"xtbopt_{iteration}.pdb")

    # superimpose original and optimised structures
    optimised_substructure = PDBParser(QUIET=True).get_structure(id="substructure",
                                                                 file=substructure_data.data_dir / f"xtbopt_{iteration}.pdb")
    optimised_substructure_atoms = list(optimised_substructure.get_atoms())
    optimised_rigid_atoms = [optimised_substructure_atoms[rigid_atom_index - 1] for rigid_atom_index in rigid_atoms_indices]
    sup = Superimposer()
    sup.set_atoms(rigid_atoms, optimised_rigid_atoms)
    sup.apply(optimised_substructure.get_atoms())

    # write coordinates of optimised atoms
    optimised_coordinates = []
    for optimised_atom_index in optimised_atoms_indices:
        optimised_atom_coord = optimised_substructure_atoms[optimised_atom_index - 1].coord
        original_atom_index = substructure_atoms[optimised_atom_index - 1].serial_number - 1
        updated_coordinates[original_atom_index * 3] = optimised_atom_coord[0]
        updated_coordinates[original_atom_index * 3 + 1] = optimised_atom_coord[1]
        updated_coordinates[original_atom_index * 3 + 2] = optimised_atom_coord[2]
        optimised_coordinates.append(optimised_atom_coord)

    # check raphan convergence
    raphan_converged = False
    if len(substructure_data.archive) > 1:
        max_diffs = []
        for x in range(1, 3):
            diffs = [dist(a, b) for a, b in zip([x for x in optimised_coordinates], substructure_data.archive[-x])]
            max_diffs.append(max(diffs))
        if any([x < 0.01 for x in max_diffs]):
            raphan_converged = True

    return optimised_coordinates, raphan_converged, substructure_data


class Raphan:
    def __init__(self,
                 data_dir: str,
                 PDB_file: str,
                 cpu: int,
                 delete_auxiliary_files: bool):
        self.data_dir = Path(data_dir)
        self.PDB_file = PDB_file
        self.cpu = cpu
        self.delete_auxiliary_files = delete_auxiliary_files

    def optimise(self):
        self._load_molecule()

        coordinates = RawArray("d", [coord for atom in self.structure.get_atoms() for coord in atom.coord])
        updated_coordinates = RawArray("d", [coord for atom in self.structure.get_atoms() for coord in atom.coord])
        bar = tqdm.tqdm(total=100,
                        desc="Structure optimisation",
                        unit=" iteration")
        with Pool(processes=self.cpu,
                  initializer=init_worker,
                  initargs=(coordinates, updated_coordinates)) as pool:
            # optimisation
            for iteration in range(1, 50):
                bar.update(1)
                nonconverged_substructures = [(substructure, iteration, "optimisation") for substructure in self.substructures_data if not substructure.converged]
                iteration_results = pool.starmap(optimise_substructure, nonconverged_substructures, chunksize=((len(nonconverged_substructures) - 1) // self.cpu) + 1)
                coordinates[:] = updated_coordinates[:]
                for optimised_coordinates, convergence, substructure_data in iteration_results:
                    if optimised_coordinates is None and convergence is None and substructure_data is None:  # xtb did not converge
                        continue
                    self.substructures_data[substructure_data.optimised_residue_index - 1].archive.append(optimised_coordinates)
                    self.substructures_data[substructure_data.optimised_residue_index - 1].converged = convergence
                for i, atom in enumerate(self.structure.get_atoms()):
                    atom.coord = coordinates[i*3:i*3+3]
                step = self.structure[0].copy()
                step.id = iteration+1
                step.serial_num = iteration+2
                self.trajectory.add(step)
                if all([substructure_data.converged for substructure_data in self.substructures_data]):
                    break

            # final refinement
            for substructure_data in self.substructures_data:
                substructure_data.converged = False
            for iteration in range(iteration + 1, iteration + 51):
                bar.update(1)
                nonconverged_substructures = [(substructure, iteration, "final refinement") for substructure in self.substructures_data if not substructure.converged]
                iteration_results = pool.starmap(optimise_substructure, nonconverged_substructures, chunksize=((len(nonconverged_substructures) - 1) // self.cpu) + 1)
                coordinates[:] = updated_coordinates[:]
                for optimised_coordinates, convergence, substructure_data in iteration_results:
                    if optimised_coordinates is None and convergence is None and substructure_data is None:  # xtb did not converge
                        continue
                    self.substructures_data[substructure_data.optimised_residue_index - 1].archive.append(optimised_coordinates)
                    self.substructures_data[substructure_data.optimised_residue_index - 1].converged = convergence
                for i, atom in enumerate(self.structure.get_atoms()):
                    atom.coord = coordinates[i*3:i*3+3]
                step = self.structure[0].copy()
                step.id = iteration+1
                step.serial_num = iteration+2
                self.trajectory.add(step)
                if all([substructure_data.converged for substructure_data in self.substructures_data]):
                    bar.update(100 - iteration)
                    bar.refresh()
                    break
            bar.close()
            self.iterations = iteration

            # control of unconverged residues
            unconverged_substructures = [str(substructure_data.optimised_residue_index) for substructure_data in self.substructures_data if not substructure_data.converged]
            if unconverged_substructures:
                print(f"WARNING! OPTIMISATION FOR RESIDUE(S) WITH INDICE(S) {', '.join(unconverged_substructures)} DID NOT CONVERGE!")

        print(f"Saving optimised structure to {self.data_dir}/optimised_PDB/{Path(self.PDB_file).stem}_optimised.pdb... ", end="", flush=True)
        for atom in self.structure.get_atoms():
            atom.coord = coordinates[(atom.serial_number - 1) * 3:(atom.serial_number - 1) * 3 + 3]
        self.io.save(str(self.data_dir / "optimised_PDB" / f"{Path(self.PDB_file).stem}_optimised.pdb"))
        self.io.set_structure(self.trajectory)
        self.io.save(str(self.data_dir / "optimised_PDB" / "trajectory.pdb"))
        print("ok")

        if self.delete_auxiliary_files:
            print("Deleting auxiliary files...", end="")
            final_pdb = self.data_dir / "optimised_PDB" / f"{Path(self.PDB_file).stem}_optimised.pdb"
            final_pdb.replace(self.data_dir / final_pdb.name)
            trajectory = self.data_dir / "optimised_PDB" / "trajectory.pdb"
            trajectory.replace(self.data_dir / trajectory.name)
            for p in self.data_dir.iterdir():
                if p.is_dir() and (p.name.startswith("sub_") or p.name in ["optimised_PDB", "input_PDB"]):
                    shutil.rmtree(p)
            print("ok")

    def _load_molecule(self):
        print(f"Loading of structure from {self.PDB_file}... ", end="", flush=True)

        # open PDB file by Biopython
        try:
            structure = PDBParser(QUIET=True).get_structure("structure", self.PDB_file)[0]
            for i, atom in enumerate(structure.get_atoms(), start=1):
                atom.serial_number = i
            io = PDBIO()
            io.set_structure(structure)
            self.io = io
            self.structure = io.structure
            self.trajectory = Structure.Structure("MultiModel")
            start = self.structure[0].copy()
            start.id = 1
            start.serial_num = 2
            self.trajectory.add(start)
        except KeyError:
            exit(f"\nERROR! PDB file {self.PDB_file} does not contain any structure or file is corrupted.\n")

        # creation of data directories
        self.data_dir.mkdir(parents=True, exist_ok=True)
        (self.data_dir / "input_PDB").mkdir(exist_ok=True)
        (self.data_dir / "optimised_PDB").mkdir(exist_ok=True)
        shutil.copy(self.PDB_file, self.data_dir / "input_PDB")
        print("ok")

        # prepared substructures data for optimisation
        self.substructures_data = []
        kdtree = NeighborSearch(list(self.structure.get_atoms()))

        for residue_index, residue in enumerate(self.structure.get_residues(), start=1):
            (self.data_dir / f"sub_{residue_index}").mkdir(exist_ok=True)
            atoms_in_30A = kdtree.search(center=residue.center_of_mass(geometric=True),
                                         radius=30, # radius of AMK (6A) + outer substructure radius (12A) + maximum shift of atom (10A) + extra (2A)
                                         level="A")
            selector = AtomSelector()
            selector.full_ids = set([atom.full_id for atom in atoms_in_30A])
            selector.res_full_ids = set([atom.get_parent().full_id for atom in atoms_in_30A])
            self.io.save(file=str(self.data_dir / f"sub_{residue_index}" / "atoms_in_30A.pdb"),
                         select=selector,
                         preserve_atom_numbering=True)

            optimised_atoms = set()
            if residue.id[0] == " ":  # standard residue
                for atom in residue:
                    if residue == list(residue.get_parent().get_residues())[0]:  # in first residue optimise also -NH3 function group
                        optimised_atoms.add(atom.serial_number)
                    else:
                        if atom.name not in ["N", "H"]:
                            optimised_atoms.add(atom.serial_number)
                for atom in ["N", "H"]:  # add atoms from following bonded residue to optimise whole peptide bond
                    try:
                        optimised_atoms.add(structure[residue.get_parent().id][residue.id[1] + 1][atom].serial_number)
                    except KeyError:  # because of last residue
                        break
            else:  # heteroresidue
                for atom in residue:
                    optimised_atoms.add(atom.serial_number)
            self.substructures_data.append(Substructure_data(data_dir=self.data_dir / f"sub_{residue_index}",
                                                             optimised_residue_index=residue_index,
                                                             optimised_atoms=optimised_atoms,
                                                             final_optimised_atoms=set([atom.serial_number for atom in residue])))


def run_constrained_alpha_optimisations(raphan):
    print("Running constrained alpha carbons optimisation... ", end="", flush=True)

    # find alpha_carbons_indices to constrain them
    alpha_carbons_indices = []
    structure = PDBParser(QUIET=True).get_structure("structure", raphan.PDB_file)
    for i, atom in enumerate(structure.get_atoms(), start=1):
        if atom.name == "CA":
            alpha_carbons_indices.append(str(i))

    # optimise original structure
    (raphan.data_dir / "constrained_alpha_carbons_optimisations" / "original").mkdir(parents=True, exist_ok=True)
    with open(raphan.data_dir / "constrained_alpha_carbons_optimisations/original/xtb_settings.inp", "w") as xtb_settings_file:
        xtb_settings_file.write(f"$constrain\n    force constant=10.0\n    atoms: {','.join(alpha_carbons_indices)}\n$end")

    t = time()
    env = os.environ.copy()
    env.update({"OMP_NUM_THREADS": "1,1", "MKL_NUM_THREADS": "1", "OMP_MAX_ACTIVE_LEVELS": "1", "OMP_STACKSIZE": "5G"})
    subprocess.run(["xtb", f"../../input_PDB/{Path(raphan.PDB_file).name}", "--opt", "--alpb", "water", "--gfnff", "--input", "xtb_settings.inp", "--verbose"],
                   cwd=raphan.data_dir / "constrained_alpha_carbons_optimisations" / "original",
                   stdout=open(raphan.data_dir / "constrained_alpha_carbons_optimisations/original/xtb_output.txt", "w"),
                   stderr=open(raphan.data_dir / "constrained_alpha_carbons_optimisations/original/xtb_error_output.txt", "w"),
                   env=env,
                   shell=False)
    GFNFFca_time = time() - t

    # optimise structure already optimised with raphan
    (raphan.data_dir / "constrained_alpha_carbons_optimisations" / "raphan").mkdir(parents=True, exist_ok=True)
    with open(raphan.data_dir / "constrained_alpha_carbons_optimisations/raphan/xtb_settings.inp", "w") as xtb_settings_file:
        xtb_settings_file.write(f"$constrain\n    force constant=10.0\n    atoms: {','.join(alpha_carbons_indices)}\n$end")
    subprocess.run(["xtb", f"../../optimised_PDB/{Path(raphan.PDB_file).stem}_optimised.pdb", "--opt", "--alpb", "water", "--gfnff", "--input", "xtb_settings.inp", "--verbose"],
                   cwd=raphan.data_dir / "constrained_alpha_carbons_optimisations" / "raphan",
                   stdout=open(raphan.data_dir / "constrained_alpha_carbons_optimisations/raphan/xtb_output.txt", "w"),
                   stderr=open(raphan.data_dir / "constrained_alpha_carbons_optimisations/raphan/xtb_error_output.txt", "w"),
                   env=env,
                   shell=False)

    # compare original structure with structure optimised by GFNFFca
    try:
        s1 = PDBParser(QUIET=True).get_structure(id="structure",
                                                 file=raphan.PDB_file)
        s2 = PDBParser(QUIET=True).get_structure(id="structure",
                                                 file=raphan.data_dir / "constrained_alpha_carbons_optimisations/original/xtbopt.pdb")
        sup = Superimposer()
        sup.set_atoms([a for a in s1.get_atoms() if a.name == "CA"], [a for a in s2.get_atoms() if a.name == "CA"])
        sup.apply(s2.get_atoms())
        differences = []
        for a1, a2 in zip(s1.get_atoms(), s2.get_atoms()):
            differences.append(a1 - a2)
        original_GFNFFca_difference = round(float(sum(differences) / len(differences)), 4)
    except FileNotFoundError:
        original_GFNFFca_difference = None

    # compare structure optimised by PROPTIMUS RAPHANgfnff and structure optimised by PROPTIMUS RAPHANgfnff + GFNFFca
    try:
        s1 = PDBParser(QUIET=True).get_structure(id="structure",
                                                 file=raphan.data_dir / "optimised_PDB" / f"{Path(raphan.PDB_file).stem}_optimised.pdb")
        s2 = PDBParser(QUIET=True).get_structure(id="structure",
                                                 file=raphan.data_dir / "constrained_alpha_carbons_optimisations/raphan/xtbopt.pdb")
        sup = Superimposer()
        sup.set_atoms([a for a in s1.get_atoms() if a.name == "CA"], [a for a in s2.get_atoms() if a.name == "CA"])
        sup.apply(s2.get_atoms())
        differences = []
        for a1, a2 in zip(s1.get_atoms(), s2.get_atoms()):
            differences.append(a1 - a2)
        PROPTIMUS_RAPHANgfnff__PROPTIMUS_RAPHANgfnff_GFNFFca_difference = round(float(sum(differences) / len(differences)), 4)
    except:
        PROPTIMUS_RAPHANgfnff__PROPTIMUS_RAPHANgfnff_GFNFFca_difference = None

    # compare structure optimised by GFNFFca and structure optimised by PROPTIMUS RAPHANgfnff + GFNFFca
    try:
        s1 = PDBParser(QUIET=True).get_structure(id="structure",
                                                 file=raphan.data_dir / "constrained_alpha_carbons_optimisations/original/xtbopt.pdb")
        s2 = PDBParser(QUIET=True).get_structure(id="structure",
                                                 file=raphan.data_dir / "constrained_alpha_carbons_optimisations/raphan/xtbopt.pdb")
        sup = Superimposer()
        sup.set_atoms([a for a in s1.get_atoms() if a.name == "CA"], [a for a in s2.get_atoms() if a.name == "CA"])
        sup.apply(s2.get_atoms())
        differences = []
        for a1, a2 in zip(s1.get_atoms(), s2.get_atoms()):
            differences.append(a1 - a2)
        GFNFFca__PROPTIMUS_RAPHANgfnff_GFNFFca_difference = round(float(sum(differences) / len(differences)), 4)
    except:
        GFNFFca__PROPTIMUS_RAPHANgfnff_GFNFFca_difference = None

    # write results
    results = {"PROPTIMUS RAPHANgfnff time": round(raphan.calculation_time, 4),
               "PROPTIMUS RAPHANgfnff iterations": raphan.iterations,
               "GFN-FFca time": round(GFNFFca_time, 4),
               "original / GFN-FFca MAD": original_GFNFFca_difference,
               "PROPTIMUS RAPHANgfnff / PROPTIMUS RAPHANgfnff + GFN-FFca MAD": PROPTIMUS_RAPHANgfnff__PROPTIMUS_RAPHANgfnff_GFNFFca_difference,
               "GFN-FFca / PROPTIMUS RAPHANgfnff + GFN-FFca": GFNFFca__PROPTIMUS_RAPHANgfnff_GFNFFca_difference}
    with open(raphan.data_dir / "comparison.json", 'w') as data_json:
        json.dump(results, data_json, indent=4)
    print("ok")


def main():
    args = load_arguments()
    t = time()
    raphan = Raphan(args.data_dir, args.PDB_file, args.cpu, args.delete_auxiliary_files)
    raphan.optimise()
    raphan.calculation_time = time() - t
    with open(raphan.data_dir / "time.txt", "w") as time_file:
        time_file.write(str(raphan.calculation_time))
    if args.constrained_alpha_carbons_optimisations:
        run_constrained_alpha_optimisations(raphan)
    print("")


if __name__ == '__main__':
    main()
