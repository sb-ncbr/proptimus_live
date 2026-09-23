import json
import tempfile
import unittest
from pathlib import Path

from app.kubernetes_jobs import JOB_ID_TOKEN, build_job_manifest


class KubernetesJobManifestTests(unittest.TestCase):
    def test_job_id_is_inserted_without_changing_template(self):
        template = {
            "apiVersion": "batch/v1",
            "kind": "Job",
            "metadata": {"generateName": "proptimus-worker-"},
            "spec": {
                "template": {
                    "metadata": {"labels": {"app": "proptimus"}},
                    "spec": {
                        "containers": [{"name": "worker", "args": [JOB_ID_TOKEN]}],
                        "restartPolicy": "Never",
                    },
                }
            },
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "worker-job.json"
            path.write_text(json.dumps(template))
            manifest = build_job_manifest("A0A1_7.0", path)

        self.assertEqual(
            ["A0A1_7.0"],
            manifest["spec"]["template"]["spec"]["containers"][0]["args"],
        )
        self.assertEqual(
            "A0A1_7.0",
            manifest["metadata"]["annotations"]["proptimus.ceitec.cz/job-id"],
        )
        self.assertEqual(
            manifest["metadata"]["labels"]["proptimus.ceitec.cz/job-hash"],
            manifest["spec"]["template"]["metadata"]["labels"]["proptimus.ceitec.cz/job-hash"],
        )


if __name__ == "__main__":
    unittest.main()


