from __future__ import annotations

import importlib
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from dashForge import _dataforge_compat as compat


def test_load_dataforge_module_reports_checked_paths_dynamically(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    configured_src = tmp_path / "custom-dataforge" / "src"
    sibling_src = tmp_path / "workspace-sibling" / "src"

    def raise_missing(_: str):
        raise ModuleNotFoundError("No module named 'dataForge.generate'", name="dataForge.generate")

    monkeypatch.setattr(
        compat,
        "candidate_dataforge_src_paths",
        lambda: [configured_src, sibling_src],
    )
    monkeypatch.setattr(importlib, "import_module", raise_missing)

    with pytest.raises(ModuleNotFoundError) as error_info:
        compat.load_dataforge_module("generate")

    message = str(error_info.value)
    assert str(configured_src) in message
    assert str(sibling_src) in message
    assert "/Users/lee/projects/dataForge/src" not in message
    assert "DATAFORGE_SRC" in message
