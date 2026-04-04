from __future__ import annotations

import importlib
import sys
from pathlib import Path

SIBLING_DATAFORGE_SRC = Path(__file__).resolve().parents[3] / "dataForge" / "src"


def load_dataforge_module(module_name: str):
    qualified_name = f"dataForge.{module_name}"
    try:
        return importlib.import_module(qualified_name)
    except ModuleNotFoundError as error:
        if error.name and not error.name.startswith("dataForge"):
            raise
        if SIBLING_DATAFORGE_SRC.exists():
            sibling_src = str(SIBLING_DATAFORGE_SRC)
            if sibling_src not in sys.path:
                sys.path.insert(0, sibling_src)
            return importlib.import_module(qualified_name)
        raise ModuleNotFoundError(
            "dashForge data generation has moved to the sibling dataForge project. "
            "Install dataForge or ensure /Users/lee/projects/dataForge/src is available."
        ) from error
