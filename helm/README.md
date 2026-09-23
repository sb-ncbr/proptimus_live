# PROPTIMUS Helm chart

This chart deploys three execution roles:

- a long-running UI Deployment,
- a long-running API Deployment,
- one short-lived Kubernetes Job for every submitted optimisation.

The API validates and stores the input, creates the worker Job, and serves its
results. The worker performs the scientific calculation and exits. Both roles
mount the same persistent volume at `/app/app/calculated_structures`.

## Architecture constraints

- Keep `api.replicaCount` equal to `1`. Job state is persisted, but submission
  locking and writes to an individual result directory are not yet coordinated
  between multiple API replicas.
- The API ServiceAccount can only create and read Jobs in its namespace. The UI
  and worker ServiceAccounts do not receive Kubernetes API credentials.
- Shared storage must support `ReadWriteMany`, because the API and worker Jobs
  may be scheduled on different nodes.
- The generated PVC is annotated with `helm.sh/resource-policy: keep` by
  default, so uninstalling the release does not delete calculated structures.
- API restarts do not stop active worker Jobs. Job state and completed files are
  persisted on the shared volume.
- The API must have outbound HTTPS access to RCSB PDB and AlphaFold DB.
- Worker Job objects are removed after `worker.ttlSecondsAfterFinished`; their
  result files remain on the PVC.

## Install

Generic installation without Ingress:

```bash
helm upgrade --install proptimus ./helm \
  --namespace proptimus
```

Production installation for `proptimus.ceitec.cz`:

```bash
helm upgrade --install proptimus ./helm \
  --namespace proptimus
  --values ./helm/values-production.yaml
```

The production values assume a Traefik IngressClass and a cert-manager
ClusterIssuer named `letsencrypt-prod`. Change `ingress.className`, remove or
replace the cert-manager annotation, and set the TLS Secret names to match the
target cluster.

If the GitLab container registry requires authentication, create a registry
Secret in the release namespace and reference it as follows:

```yaml
global:
  imagePullSecrets:
    - name: proptimus-registry
```

## Existing storage

To reuse an existing PVC:

```yaml
persistence:
  enabled: true
  existingClaim: proptimus-calculated-structures
```

The existing claim must be writable by the API and worker containers and must
provide `ReadWriteMany` access with POSIX advisory locking.

## Worker image

By default, workers use the API image with a different command:

```text
python -m app.worker <job-id>
```

Rebuild and publish the API image from this repository before deploying chart
version 0.2.0. It must contain `app/worker.py`, `app/job_state.py`,
`app/kubernetes_jobs.py`, and the Kubernetes Python dependency. A separate
worker image can be configured when it contains the same application and
scientific dependencies:

```yaml
worker:
  image:
    repository: registry.example.org/proptimus-worker
    tag: "1.1.0"
```

## Frontend API URL

The browser must reach the API through a public URL; a Kubernetes Service DNS
name cannot be used. Set both values consistently:

```yaml
ui:
  publicApiUrl: https://api.proptimus.example.org

api:
  corsOrigins:
    - https://proptimus.example.org
```

The UI image is built with `NEXT_PUBLIC_*` placeholders. Its startup script
replaces them with the Helm values before starting Next.js, so the same image
can be used with different public API and AlphaFind endpoints.

## Compute sizing

Each worker Job creates a configurable RAPHAN process pool. CPU throttling will
increase calculation time. Match `worker.processCount`, resource limits, and
node placement to the available compute nodes.

```yaml
worker:
  processCount: 60
  resources:
    requests:
      cpu: "60"
      memory: 32Gi
    limits:
      cpu: "60"
      memory: 64Gi
  nodeSelector:
    workload: compute
```

Kubernetes naturally leaves Jobs pending when no node satisfies their resource
request. This replaces the process-local API queue.

Inspect running computations with:

```bash
kubectl get jobs -n proptimus \
  -l app.kubernetes.io/instance=proptimus,app.kubernetes.io/component=worker
kubectl logs -n proptimus job/<worker-job-name>
```

## Verification

```bash
helm lint ./helm
helm template proptimus ./helm \
  --namespace proptimus \
  --values ./helm/values-production.yaml
helm test proptimus --namespace proptimus
```
