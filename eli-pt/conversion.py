# SPDX-License-Identifier: EUPL-1.2
# Copyright (c) 2026 SGGOV / DAPL
"""
ELI-PT — conversor bidirecional entre URLs legacy do dre.pt e URIs ELI-PT.

Suporta os tipos de ato no escopo do AKN-PT v0.1.0.

Uso:
    from conversion import dre_to_eli, eli_to_dre_legacy

    eli = dre_to_eli("https://dre.pt/dre/detalhe/decreto-lei/22-2026-100000000")
    # 'https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt'

    dre = eli_to_dre_legacy("https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt")
    # 'https://dre.pt/dre/detalhe/decreto-lei/22-2026'   (hash não é recuperável sem lookup)
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

ELI_DOMAIN_DEFAULT = "eli.gov.pt"
DRE_DOMAIN = "dre.pt"

# Mapeamento entre o slug usado no dre.pt e o slug canónico ELI-PT.
# Mantém-se 1:1 onde possível; algumas diferenças de naming legacy são absorvidas aqui.
DRE_TO_ELI_TYPE = {
    "decreto-lei": "dec-lei",
    "lei": "lei",
    "decreto-da-assembleia-da-republica": "decreto-ar",
    "resolucao-da-assembleia-da-republica": "res-ar",
    "portaria": "portaria",
    "resolucao-do-conselho-de-ministros": "res-cm",
    "despacho-normativo": "despacho-normativo",
    "decreto-legislativo-regional": "dlr",
    "decreto-regulamentar-regional": "drr",
}
ELI_TO_DRE_TYPE = {v: k for k, v in DRE_TO_ELI_TYPE.items()}

# Tipos regionais — slug ELI é igual em Açores/Madeira; jurisdiction distingue.
REGIONAL_TYPES = {"dlr", "drr"}


# ---------------------------------------------------------------------------
# Dataclass de identificação canónica
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class EliId:
    """Identificação canónica de um ato em ELI-PT."""

    jurisdiction: str          # 'pt', 'pt-20', 'pt-30'
    act_type: str              # 'dec-lei', 'lei', ...
    year: int
    number: int
    language: str = "pt"
    point_in_time: Optional[str] = None   # ISO 8601 'YYYY-MM-DD'
    fmt: Optional[str] = None             # 'xml', 'html', 'json', 'pdf'
    fragment: Optional[str] = None        # eId interno

    def to_uri(self, domain: str = ELI_DOMAIN_DEFAULT) -> str:
        """Constrói o URI canónico ELI-PT."""
        uri = (
            f"https://{domain}/eli/{self.jurisdiction}/{self.act_type}"
            f"/{self.year}/{self.number}/{self.language}"
        )
        if self.point_in_time:
            uri += f"/{self.point_in_time}"
        if self.fmt:
            uri += f".{self.fmt}"
        if self.fragment:
            uri += f"#{self.fragment}"
        return uri


# ---------------------------------------------------------------------------
# Parse e conversão
# ---------------------------------------------------------------------------
_DRE_RE = re.compile(
    r"^https?://(?:www\.)?dre\.pt/dre/detalhe/"
    r"(?P<type>[a-z-]+)/"
    r"(?P<number>\d+)-(?P<year>\d{4})"
    r"(?:-(?P<hash>\d+))?/?$"
)

_ELI_RE = re.compile(
    r"^https?://(?P<domain>[a-z0-9.-]+)/eli/"
    r"(?P<jurisdiction>pt(?:-\d{2})?)/"
    r"(?P<type>[a-z-]+)/"
    r"(?P<year>\d{4})/(?P<number>\d+)/"
    r"(?P<language>[a-z]{2,3})"
    r"(?:/(?P<pit>\d{4}-\d{2}-\d{2}))?"
    r"(?:\.(?P<fmt>xml|html|json|pdf))?"
    r"(?:#(?P<fragment>[a-zA-Z0-9_]+))?$"
)


def parse_dre(url: str) -> EliId:
    """Converte URL legacy do dre.pt em EliId.

    Limitação: a jurisdição não está presente na URL legacy nacional; assumimos `pt`.
    Para atos regionais o legacy não distingue Açores/Madeira no path — uma
    implementação de produção consultaria a tabela INCM.
    """
    m = _DRE_RE.match(url.strip())
    if not m:
        raise ValueError(f"URL dre.pt não reconhecido: {url!r}")
    dre_type = m.group("type")
    if dre_type not in DRE_TO_ELI_TYPE:
        raise ValueError(f"Tipo dre.pt desconhecido: {dre_type!r}")
    act_type = DRE_TO_ELI_TYPE[dre_type]
    return EliId(
        jurisdiction="pt",
        act_type=act_type,
        year=int(m.group("year")),
        number=int(m.group("number")),
    )


def parse_eli(uri: str) -> EliId:
    """Converte um URI ELI-PT em EliId."""
    m = _ELI_RE.match(uri.strip())
    if not m:
        raise ValueError(f"URI ELI-PT não reconhecido: {uri!r}")
    return EliId(
        jurisdiction=m.group("jurisdiction"),
        act_type=m.group("type"),
        year=int(m.group("year")),
        number=int(m.group("number")),
        language=m.group("language"),
        point_in_time=m.group("pit"),
        fmt=m.group("fmt"),
        fragment=m.group("fragment"),
    )


def dre_to_eli(url: str, domain: str = ELI_DOMAIN_DEFAULT) -> str:
    """Converte URL legacy do dre.pt em URI ELI-PT canónico."""
    return parse_dre(url).to_uri(domain=domain)


def eli_to_dre_legacy(uri: str) -> str:
    """Converte URI ELI-PT em URL legacy do dre.pt (sem o hash).

    O hash legacy não é recuperável a partir do ELI-PT sem consulta à tabela
    INCM; o URL devolvido é a forma curta `https://dre.pt/dre/detalhe/{type}/{number}-{year}`
    que dre.pt actualmente aceita como redireccionável.
    """
    eli = parse_eli(uri)
    if eli.act_type not in ELI_TO_DRE_TYPE:
        raise ValueError(f"Tipo ELI desconhecido para mapeamento dre.pt: {eli.act_type!r}")
    dre_type = ELI_TO_DRE_TYPE[eli.act_type]
    return f"https://{DRE_DOMAIN}/dre/detalhe/{dre_type}/{eli.number}-{eli.year}"


# ---------------------------------------------------------------------------
# CLI de conveniência
# ---------------------------------------------------------------------------
def _main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(
            "Uso:\n"
            "  python conversion.py to-eli <url-dre>\n"
            "  python conversion.py to-dre <uri-eli>\n",
            flush=True,
        )
        return 2
    cmd, arg = argv[0], argv[1]
    try:
        if cmd == "to-eli":
            print(dre_to_eli(arg))
        elif cmd == "to-dre":
            print(eli_to_dre_legacy(arg))
        else:
            print(f"Comando desconhecido: {cmd!r}", flush=True)
            return 2
    except ValueError as exc:
        print(f"erro: {exc}", flush=True)
        return 1
    return 0


if __name__ == "__main__":  # pragma: no cover
    import sys

    raise SystemExit(_main(sys.argv[1:]))
