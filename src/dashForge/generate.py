"""Compatibility wrapper for the extracted dataForge generator module."""

from ._dataforge_compat import load_dataforge_module

_generate = load_dataforge_module("generate")

DATASET_EXPORTS_BY_PACK = _generate.DATASET_EXPORTS_BY_PACK
clamp = _generate.clamp
default_seed_for = _generate.default_seed_for
export_sqlite_snapshot = _generate.export_sqlite_snapshot
generate_financial_database = _generate.generate_financial_database
generate_healthcare_database = _generate.generate_healthcare_database
generate_saas_database = _generate.generate_saas_database
get_pack_scenario = _generate.get_pack_scenario
humanize_label = _generate.humanize_label
infer_column_role = _generate.infer_column_role
infer_column_type = _generate.infer_column_type
load_pack = _generate.load_pack
resolve_dataset_exports = _generate.resolve_dataset_exports
stable_factor = _generate.stable_factor
stable_fraction = _generate.stable_fraction

__all__ = [
    "DATASET_EXPORTS_BY_PACK",
    "clamp",
    "default_seed_for",
    "export_sqlite_snapshot",
    "generate_financial_database",
    "generate_healthcare_database",
    "generate_saas_database",
    "get_pack_scenario",
    "humanize_label",
    "infer_column_role",
    "infer_column_type",
    "load_pack",
    "resolve_dataset_exports",
    "stable_factor",
    "stable_fraction",
]
