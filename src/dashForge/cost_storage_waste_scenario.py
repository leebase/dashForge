"""Cost Management Storage Waste scenario implementation for DashForge.

Provides scenario constants, data generation, presentation models, and governance
validation for the storage-waste scenario in snowflakeCost.
"""

from __future__ import annotations

from typing import Any

from dashForge import cost_storage_waste

# Re-export canonical constants and schemas
DEFAULT_SEED = cost_storage_waste.DEFAULT_SEED
DEFAULT_TEMPLATE_ID = cost_storage_waste.DEFAULT_TEMPLATE_ID
EXPECTED_DATASET_SCHEMAS = cost_storage_waste.EXPECTED_DATASET_SCHEMAS
EXPECTED_SIX_DATASETS = cost_storage_waste.EXPECTED_SIX_DATASETS
EXPECTED_SIX_GOVERNANCE_FIELDS = cost_storage_waste.EXPECTED_SIX_GOVERNANCE_FIELDS
EXPECTED_STALE_TABLES_COLUMNS = cost_storage_waste.EXPECTED_STALE_TABLES_COLUMNS
EXPECTED_STORAGE_SUMMARY_COLUMNS = cost_storage_waste.EXPECTED_STORAGE_SUMMARY_COLUMNS
EXPECTED_STORAGE_USAGE_HISTORY_COLUMNS = cost_storage_waste.EXPECTED_STORAGE_USAGE_HISTORY_COLUMNS
EXPECTED_TABLE_STORAGE_METRICS_COLUMNS = cost_storage_waste.EXPECTED_TABLE_STORAGE_METRICS_COLUMNS
EXPECTED_UNCOMPRESSED_STORAGE_COLUMNS = cost_storage_waste.EXPECTED_UNCOMPRESSED_STORAGE_COLUMNS
PACK_ID = cost_storage_waste.PACK_ID
SCENARIO_ID = cost_storage_waste.SCENARIO_ID
STORY_CONTRACT_PATH = cost_storage_waste.STORY_CONTRACT_PATH
SYNTHETIC_DISCLOSURE_TEXT = cost_storage_waste.SYNTHETIC_DISCLOSURE_TEXT

# Re-export operational generators, definitions, and validators
generate_storage_waste_assets = cost_storage_waste.generate_storage_waste_assets
generate_storage_waste_database = cost_storage_waste.generate_storage_waste_database
get_default_seed = cost_storage_waste.get_default_seed
get_expected_datasets = cost_storage_waste.get_expected_datasets
get_pack_id = cost_storage_waste.get_pack_id
get_scenario_id = cost_storage_waste.get_scenario_id
get_storage_waste_scenario_definition = cost_storage_waste.get_storage_waste_scenario_definition
get_storage_waste_scenarios = cost_storage_waste.get_storage_waste_scenarios
validate_storage_waste_database = cost_storage_waste.validate_storage_waste_database

__all__ = [
    "DEFAULT_SEED",
    "DEFAULT_TEMPLATE_ID",
    "EXPECTED_DATASET_SCHEMAS",
    "EXPECTED_SIX_DATASETS",
    "EXPECTED_SIX_GOVERNANCE_FIELDS",
    "EXPECTED_STALE_TABLES_COLUMNS",
    "EXPECTED_STORAGE_SUMMARY_COLUMNS",
    "EXPECTED_STORAGE_USAGE_HISTORY_COLUMNS",
    "EXPECTED_TABLE_STORAGE_METRICS_COLUMNS",
    "EXPECTED_UNCOMPRESSED_STORAGE_COLUMNS",
    "PACK_ID",
    "SCENARIO_ID",
    "STORY_CONTRACT_PATH",
    "SYNTHETIC_DISCLOSURE_TEXT",
    "generate_storage_waste_assets",
    "generate_storage_waste_database",
    "get_default_seed",
    "get_expected_datasets",
    "get_pack_id",
    "get_scenario_id",
    "get_storage_waste_scenario_definition",
    "get_storage_waste_scenarios",
    "validate_storage_waste_database",
]
