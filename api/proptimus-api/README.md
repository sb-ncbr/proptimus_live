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

## Execution modes

`PROPTIMUS_EXECUTION_MODE=local` retains the process-local queue for
development. Kubernetes sets the permanent API container to `kubernetes`, so
each new calculation creates a short-lived Job. A worker container executes
exactly one calculation and exits:

```bash
PROPTIMUS_EXECUTION_MODE=worker \
python -m app.worker A0A1P8BEE7_7.0
```

The API and worker containers must mount the same
`/app/app/calculated_structures` directory. The Helm chart in `../../helm`
configures a shared ReadWriteMany volume and the required Job RBAC.
