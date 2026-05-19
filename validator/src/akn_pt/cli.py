# SPDX-License-Identifier: EUPL-1.2
"""CLI for the akn-pt validator."""
from __future__ import annotations

import sys
from pathlib import Path

import click

from . import __version__
from .core import Phase, validate
from .report import render_json, render_text


@click.group()
@click.version_option(__version__, prog_name="akn-pt")
def main() -> None:
    """akn-pt — reference validator for the AKN-PT profile."""


@main.command()
@click.argument("input_path", type=click.Path(exists=True, dir_okay=False, path_type=Path))
@click.option(
    "--phase",
    type=click.Choice([p.value for p in Phase], case_sensitive=False),
    default=Phase.PUBLICATION.value,
    show_default=True,
    help="Validation phase.",
)
@click.option(
    "--lang",
    type=click.Choice(["pt", "en"], case_sensitive=False),
    default="pt",
    show_default=True,
    help="Language for validator labels.",
)
@click.option("--json", "as_json", is_flag=True, help="Output JSON instead of text.")
@click.option("--quiet", is_flag=True, help="Print only OK/FAIL.")
@click.option("-v", "--verbose", is_flag=True, help="Show pattern/rule details.")
def validate_cmd(input_path: Path, phase: str, lang: str, as_json: bool,
                 quiet: bool, verbose: bool) -> None:
    """Validate one AKN-PT document."""
    report = validate(input_path, phase=phase, lang=lang)
    if as_json:
        click.echo(render_json(report))
    else:
        click.echo(render_text(report, quiet=quiet, verbose=verbose))
    sys.exit(0 if report.valid else 1)


# Click sees the function name; rename for CLI as "validate"
validate_cmd.name = "validate"


@main.command()
@click.argument("input_dir", type=click.Path(exists=True, file_okay=False, path_type=Path))
@click.option("--phase",
              type=click.Choice([p.value for p in Phase], case_sensitive=False),
              default=Phase.PUBLICATION.value,
              show_default=True)
@click.option("--lang", type=click.Choice(["pt", "en"]), default="pt", show_default=True)
@click.option("--pattern", default="*.akn.xml", show_default=True,
              help="Glob pattern for files to validate.")
def batch(input_dir: Path, phase: str, lang: str, pattern: str) -> None:
    """Validate all AKN-PT files in a directory."""
    files = sorted(input_dir.rglob(pattern))
    if not files:
        click.echo(f"No files matching {pattern!r} found in {input_dir}", err=True)
        sys.exit(2)

    n_ok = 0
    n_fail = 0
    for f in files:
        rep = validate(f, phase=phase, lang=lang)
        status = "OK  " if rep.valid else "FAIL"
        click.echo(f"  {status}  {f.relative_to(input_dir)}")
        if rep.valid:
            n_ok += 1
        else:
            n_fail += 1
            for e in rep.errors[:3]:
                click.echo(f"        - {e.message[:140]}")

    click.echo()
    click.echo(f"Summary: {n_ok}/{len(files)} OK, {n_fail} failed")
    sys.exit(0 if n_fail == 0 else 1)


@main.command("schema-path")
def schema_path() -> None:
    """Print the path to bundled schemas."""
    from .core import _data_path
    click.echo(str(_data_path("akn-pt.xsd").parent))


if __name__ == "__main__":  # pragma: no cover
    main()
