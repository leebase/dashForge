"""
Main entry point for dashForge.

Created on 2026-03-31 by Lee Harrington.
"""

import argparse


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        prog="dashForge",
        description="dashForge - AI-agent project",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s 0.1.0",
    )
    parser.add_argument(
        "name",
        nargs="?",
        default="World",
        help="Name to greet (default: World)",
    )

    args = parser.parse_args()
    print(f"Hello from dashForge, {args.name}!")


if __name__ == "__main__":
    main()
