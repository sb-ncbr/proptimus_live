import json
import os
import fcntl
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


STATE_FILE = "status.json"


def read_job_state(data_dir: str | Path) -> dict:
    """Read a persisted job state, returning an empty mapping if unavailable."""
    path = Path(data_dir) / STATE_FILE
    try:
        with path.open("r", encoding="utf-8") as state_file:
            state = json.load(state_file)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}
    return state if isinstance(state, dict) else {}


def write_job_state(data_dir: str | Path, status: str | None, **fields) -> dict:
    """Atomically merge and persist job state on the shared result volume."""
    directory = Path(data_dir)
    directory.mkdir(parents=True, exist_ok=True)

    # Serialize API and worker updates on the shared POSIX filesystem. This
    # prevents a fast-starting worker from having its running state overwritten
    # when the API records the Kubernetes Job name.
    with (directory / f".{STATE_FILE}.lock").open("a+") as lock_file:
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
        state = read_job_state(directory)
        state.update(fields)
        if status is not None:
            state["status"] = status
        state["updated_at"] = datetime.now(timezone.utc).isoformat()

        temporary_path = directory / f".{STATE_FILE}.{os.getpid()}.{uuid4().hex}.tmp"
        with temporary_path.open("w", encoding="utf-8") as state_file:
            json.dump(state, state_file, indent=2, sort_keys=True)
            state_file.flush()
            os.fsync(state_file.fileno())
        os.replace(temporary_path, directory / STATE_FILE)
        return state

