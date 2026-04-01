import argparse
from pathlib import Path

from .generate import (
    generate_financial_database,
    generate_healthcare_database,
    generate_saas_database,
)


GENERATORS = {
    "healthcare": generate_healthcare_database,
    "financial": generate_financial_database,
    "saas": generate_saas_database,
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="dashForge",
        description="dashForge generation utilities",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s 0.1.0",
    )

    subparsers = parser.add_subparsers(dest="command")

    generate_parser = subparsers.add_parser(
        "generate",
        help="Generate a bounded SQLite mock-data database.",
    )
    generate_parser.add_argument(
        "--pack",
        default="healthcare",
        choices=["healthcare", "financial", "saas"],
        help="Mock-data pack to generate.",
    )
    generate_parser.add_argument(
        "--scenario",
        required=True,
        help="Scenario id within the selected pack.",
    )
    generate_parser.add_argument(
        "--seed",
        type=int,
        help="Optional deterministic seed override.",
    )
    generate_parser.add_argument(
        "--output",
        required=True,
        help="Filesystem path for the generated SQLite database.",
    )
    generate_parser.add_argument(
        "--snapshot-output",
        help="Optional path for a SQLite-derived JSON snapshot export.",
    )
    generate_parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing output files.",
    )

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command != "generate":
        parser.print_help()
        return 0

    output_path = Path(args.output)
    snapshot_path = Path(args.snapshot_output) if args.snapshot_output else None
    existing_paths = [path for path in [output_path, snapshot_path] if path and path.exists()]
    if existing_paths and not args.force:
        parser.error(
            "Output path already exists. Pass --force to overwrite: "
            + ", ".join(str(path) for path in existing_paths)
        )

    try:
        generate_database = GENERATORS[args.pack]
    except KeyError:
        parser.error(f'Unknown pack "{args.pack}".')

    try:
        result = generate_database(
            scenario_id=args.scenario,
            output_path=output_path,
            seed=args.seed,
            snapshot_output_path=snapshot_path,
        )
    except ValueError as error:
        parser.error(str(error))
    print(
        "Generated "
        f'{result["packId"]}/{result["scenarioId"]} '
        f'seed {result["seed"]} -> {result["outputPath"]}'
    )
    if result["snapshotOutputPath"]:
        print(f'Snapshot -> {result["snapshotOutputPath"]}')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
