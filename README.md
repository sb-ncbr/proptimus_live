[PROPTIMUS LIVE](https://proptimus.ceitec.cz/) is a freely available application for the local optimisation of protein structures with constrained α-carbons. 
It is powered by the [GFN-Force-Field](https://onlinelibrary.wiley.com/doi/full/10.1002/anie.202004239), accelerated by a divide-and-conquer [RAPHAN](https://www.biorxiv.org/content/10.1101/2025.11.24.690085v1.full) approach. 
The details about the methodology and usage are described in the [manual](https://github.com/sb-ncbr/proptimus_live/wiki).


## How to run

To run PROPTIMUS LIVE locally, you will need to have [Python 3.11](https://www.python.org/downloads/), 
[Anaconda](https://www.anaconda.com/docs/getting-started/miniconda/install#quickstart-install-instructions) and toolkit [bun](https://bun.com/) installed.

Start the backend by running the commands:

```bash
cd proptimus_live/api/proptimus-api
conda env create -f environment.yml  # this step is essential only on the first start
conda activate proptimus-api
flask --app app.routes:application --debug run
```
Start the frontend by running the commands:

```bash
cd proptimus_live/ui/proptimus-ui
bun install  # this step is essential only on the first start
bun run dev
```
Point your browser to localhost:3000/.

## License
MIT
