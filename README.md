[PROPTIMUS LIVE](https://proptimus.ceitec.cz/) is a freely available application for the constrained α-carbons optimisation of (but not limited to) ML-predicted protein structures. 
It is powered by the [GFN-Force-Field](https://onlinelibrary.wiley.com/doi/full/10.1002/anie.202004239), accelerated by a divide-and-conquer [RAPHAN](https://www.biorxiv.org/content/10.1101/2025.11.24.690085v1.full) approach. 
The details about the methodology and usage are described in the [manual](https://github.com/sb-ncbr/proptimus_live/wiki).
This website is free and open to all users, with no login requirement.


## How to run

To run PROPTIMUS LIVE locally, you will need to have [Python 3.11](https://www.python.org/downloads/), 
[pip](https://pip.pypa.io/en/stable/installing/), optimisation software [xtb](https://xtb-docs.readthedocs.io/en/latest/index.html) and toolkit [bun](https://bun.com/) installed.

Start the backend by running the commands:

```bash
cd proptimus_live/api/proptimus-api
python3.11 -m venv venv
. venv/bin/activate
pip install -r requirements.txt  # this step is essential only on the first start
cd app/
export FLASK_APP=routes.py
flask run
```
Start the backend by running the commands:

```bash
cd proptimus_live/ui/proptimus-ui
bun install  # this step is essential only on the first start
bun run dev
```
Point your browser to localhost:3000/.

## License
MIT
