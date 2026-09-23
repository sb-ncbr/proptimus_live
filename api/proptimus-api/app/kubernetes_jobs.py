import hashlib
import json
import os
from pathlib import Path


JOB_ID_TOKEN = "__PROPTIMUS_JOB_ID__"


def _replace_token(value, job_id: str):
    if isinstance(value, dict):
        return {key: _replace_token(item, job_id) for key, item in value.items()}
    if isinstance(value, list):
        return [_replace_token(item, job_id) for item in value]
    if isinstance(value, str):
        return value.replace(JOB_ID_TOKEN, job_id)
    return value


def build_job_manifest(job_id: str, template_path: str | Path) -> dict:
    """Load the Helm-generated Job template and specialize it for one job."""
    with Path(template_path).open("r", encoding="utf-8") as template_file:
        manifest = json.load(template_file)

    manifest = _replace_token(manifest, job_id)
    job_hash = hashlib.sha256(job_id.encode("utf-8")).hexdigest()[:16]

    metadata = manifest.setdefault("metadata", {})
    metadata.setdefault("annotations", {})["proptimus.ceitec.cz/job-id"] = job_id
    metadata.setdefault("labels", {})["proptimus.ceitec.cz/job-hash"] = job_hash

    pod_metadata = manifest.setdefault("spec", {}).setdefault("template", {}).setdefault("metadata", {})
    pod_metadata.setdefault("labels", {})["proptimus.ceitec.cz/job-hash"] = job_hash
    return manifest


def _load_kubernetes_config(config_module) -> None:
    try:
        config_module.load_incluster_config()
    except config_module.ConfigException:
        config_module.load_kube_config()


def submit_job(job_id: str) -> str:
    """Create a Kubernetes Job from the mounted worker template."""
    try:
        from kubernetes import client, config
    except ImportError as exc:
        raise RuntimeError("The kubernetes Python package is required for Job execution") from exc

    template_path = os.environ.get("PROPTIMUS_JOB_TEMPLATE", "/etc/proptimus/worker-job.json")
    namespace = os.environ.get("POD_NAMESPACE", "default")
    manifest = build_job_manifest(job_id, template_path)

    _load_kubernetes_config(config)
    created_job = client.BatchV1Api().create_namespaced_job(
        namespace=namespace,
        body=manifest,
    )
    return created_job.metadata.name


def get_job_failure(job_name: str) -> str | None:
    """Return the Kubernetes failure reason for a Job, if it has failed."""
    try:
        from kubernetes import client, config
    except ImportError:
        return None

    namespace = os.environ.get("POD_NAMESPACE", "default")
    _load_kubernetes_config(config)
    job = client.BatchV1Api().read_namespaced_job_status(
        name=job_name,
        namespace=namespace,
    )
    for condition in job.status.conditions or []:
        if condition.type == "Failed" and condition.status == "True":
            return condition.message or condition.reason or "The Kubernetes worker Job failed."
    return None
