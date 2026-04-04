from __future__ import annotations

import importlib
import os
import sys
from pathlib import Path

SIBLING_DATAFORGE_SRC = Path(__file__).resolve().parents[3] / "dataForge" / "src"
DATAFORGE_SRC_ENV_VAR = "DATAFORGE_SRC"


def candidate_dataforge_src_paths() -> list[Path]:
    paths: list[Path] = []
    configured_src = os.environ.get(DATAFORGE_SRC_ENV_VAR)

    if configured_src:
        paths.append(Path(configured_src).expanduser())

    paths.append(SIBLING_DATAFORGE_SRC)

    unique_paths: list[Path] = []
    seen: set[Path] = set()
    for path in paths:
        resolved = path.resolve(strict=False)
        if resolved in seen:
            continue
        seen.add(resolved)
        unique_paths.append(resolved)

    return unique_paths


def load_dataforge_module(module_name: str):
    qualified_name = f"dataForge.{module_name}"
    try:
        return importlib.import_module(qualified_name)
    except ModuleNotFoundError as error:
        if error.name and not error.name.startswith("dataForge"):
            raise
        for candidate_src in candidate_dataforge_src_paths():
            if not candidate_src.exists():
                continue
            candidate_src_str = str(candidate_src)
            if candidate_src_str not in sys.path:
                sys.path.insert(0, candidate_src_str)
            return importlib.import_module(qualified_name)
        checked_paths = ", ".join(str(path) for path in candidate_dataforge_src_paths())
        raise ModuleNotFoundError(
            "dashForge data generation has moved to the sibling dataForge project. "
            f"Install dataForge or ensure one of these paths is available: {checked_paths}. "
            f"You can override the lookup with {DATAFORGE_SRC_ENV_VAR}."
        ) from error
