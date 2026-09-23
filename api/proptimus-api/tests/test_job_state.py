import json
import tempfile
import unittest
from pathlib import Path

from app.job_state import read_job_state, write_job_state


class JobStateTests(unittest.TestCase):
    def test_state_is_written_and_merged_atomically(self):
        with tempfile.TemporaryDirectory() as directory:
            data_dir = Path(directory) / "A0A1_7.0"
            write_job_state(data_dir, "queued", kubernetes_job="worker-abc")
            write_job_state(data_dir, "running", worker="pod-1")
            write_job_state(data_dir, None, kubernetes_job="worker-final")

            state = read_job_state(data_dir)
            self.assertEqual("running", state["status"])
            self.assertEqual("worker-final", state["kubernetes_job"])
            self.assertEqual("pod-1", state["worker"])
            self.assertIn("updated_at", state)
            self.assertEqual(state, json.loads((data_dir / "status.json").read_text()))

    def test_missing_or_invalid_state_returns_empty_mapping(self):
        with tempfile.TemporaryDirectory() as directory:
            data_dir = Path(directory)
            self.assertEqual({}, read_job_state(data_dir))
            (data_dir / "status.json").write_text("not-json")
            self.assertEqual({}, read_job_state(data_dir))


if __name__ == "__main__":
    unittest.main()

