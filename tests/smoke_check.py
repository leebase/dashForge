"""Deterministic smoke check for Python slices under src/dashForge.

Run by Agent-Orch's smoke_runner via tests/smoke_manifest.json. Executes the
slice test files plus the dataForge compatibility suite and returns pytest's
exit status. Browser-level smoke (tests/browser_smoke_manifest.json) is
reserved for slices that change the rendered frontend.
"""

from __future__ import annotations

import subprocess
import sys

TEST_FILES = [
    "tests/test_dataforge_compat.py",
    "tests/test_package_snapshot.py",
    "tests/test_snowflake_cost_pack.py",
]


def main() -> int:
    completed = subprocess.run(
        [sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider", *TEST_FILES],
        env={**__import__("os").environ, "PYTHONDONTWRITEBYTECODE": "1"},
        check=False,
    )
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
