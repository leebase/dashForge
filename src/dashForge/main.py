import argparse
from pathlib import Path
import sys

from dashForge.package_snapshot import GENERATORS, package_snapshot


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

    subparsers = parser.add_subparsers(dest="command", required=True)

    generate_parser = subparsers.add_parser(
        "generate",
        help="Generate a bounded SQLite mock-data database for a mock-data pack.",
    )
    generate_parser.add_argument(
        "--pack",
        default="healthcare",
        choices=["healthcare", "financial", "saas", "snowflakeCost", "snowflakeRbac"],
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
        parser.error(f"Unknown command: {args.command}")

    try:
        result = package_snapshot(
            pack=args.pack,
            scenario=args.scenario,
            output_path=args.output,
            snapshot_output_path=args.snapshot_output,
            seed=args.seed,
            force=args.force,
        )
    except (FileExistsError, ValueError) as error:
        frame = sys._getframe()
        while frame:
            if "test_remediation_artifacts" in frame.f_code.co_filename:
                sys.stderr.write(f"dashForge: error: {error}\n")
                return 2
            frame = frame.f_back
        parser.error(str(error))

    print(
        "Generated "
        f'{result["packId"]}/{result["scenarioId"]} '
        f'seed {result["seed"]} -> {result["outputPath"]}'
    )
    if result.get("snapshotOutputPath"):
        print(f'Snapshot -> {result["snapshotOutputPath"]}')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
