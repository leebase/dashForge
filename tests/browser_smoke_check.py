"""Operator-runnable companion to tests/browser_smoke_manifest.json.

The browser_smoke_runner drives the manifest itself; this script lets a human
confirm the served build carries the idle-warehouse-waste UI contract without
a browser: the standalone index must be served and the built assets must
reference the scenario id and the synthetic-demo-data disclosure marker.
"""

from __future__ import annotations

import glob
import sys
import urllib.request

URL = "http://127.0.0.1:4173/?scenario=idle-warehouse-waste"
MARKERS = ("idle-warehouse-waste", "synthetic-demo-data", "open-recommendation-queue", "recommendation-queue")


def main() -> int:
    try:
        with urllib.request.urlopen(URL, timeout=10) as response:  # noqa: S310 - local server
            index = response.read().decode("utf-8", "replace")
    except Exception as error:  # pragma: no cover - operator diagnostics
        print(f"browser smoke check: cannot fetch {URL}: {error}")
        return 2
    if "<div id=\"root\"" not in index and "<div id='root'" not in index:
        print("browser smoke check: served index has no #root mount")
        return 3
    bundle = "".join(open(path, encoding="utf-8", errors="replace").read() for path in glob.glob("frontend/dist/assets/*.js"))
    missing = [marker for marker in MARKERS if marker not in bundle]
    if missing:
        print(f"browser smoke check: built assets lack markers: {missing}")
        return 4
    print("browser smoke check: idle-warehouse-waste contract markers present")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
