# PROPTIMUS API

## Setup

```bash
# Up
conda env create -f environment.yml
conda activate proptimus-api

# Down
conda deactivate
conda env remove -n proptimus-api
```

## Run

```bash
flask --app app.routes:application --debug run
```
