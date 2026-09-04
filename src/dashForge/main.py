import argparse
from pathlib import Path
import sys

from dashForge.diagnostics import DiagnosticTimer, is_diagnostics_enabled
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
        help="Generate a bounded SQLite mock-data database.",
    )
    generate_parser.add_argument(
        "--pack",
        default="healthcare",
        choices=["healthcare", "financial", "saas", "snowflakeCost"],
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
    generate_parser.add_argument(
        "--diagnostics",
        action="store_true",
        default=False,
        help="Enable diagnostic timing telemetry on stderr.",
    )

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command != "generate":
        parser.error(f"Unknown command: {args.command}")

    diagnostics_enabled = getattr(args, "diagnostics", False) or is_diagnostics_enabled()
    timer = DiagnosticTimer(enabled=diagnostics_enabled)

    with timer:
        with timer.phase("cli_initialization"):
            pack = args.pack
            scenario = args.scenario
            output_path = args.output
            snapshot_output_path = args.snapshot_output
            seed = args.seed
            force = args.force

        try:
            result = package_snapshot(
                pack=pack,
                scenario=scenario,
                output_path=output_path,
                snapshot_output_path=snapshot_output_path,
                seed=seed,
                force=force,
                diagnostics=diagnostics_enabled,
            )
        except (FileExistsError, ValueError) as error:
            parser.error(str(error))

    print(
        "Generated "
        f'{result["packId"]}/{result["scenarioId"]} '
        f'seed {result["seed"]} -> {result["outputPath"]}'
    )
    if result.get("snapshotOutputPath"):
        print(f'Snapshot -> {result["snapshotOutputPath"]}')

    if diagnostics_enabled:
        timer.report(sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
