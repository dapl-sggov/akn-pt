# SPDX-License-Identifier: EUPL-1.2
# Copyright (c) 2026 SGGOV / DAPL
"""
ELI-PT — conversor de identificadores de legislação portuguesa.

A partir de v0.2 (alinhamento com a INCM, 2026-06-22) o ELI-PT CANÓNICO é o
template de produção do Diário da República (data.dre.pt):

    https://data.dre.pt/eli/{tipo}/{nº}/{ano}/{mês}/{dia}[/{p|data}/dre/{lang}[/{fmt}]][#{frag}]
    ex.: https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/html

CONSTRUTIBILIDADE: o template canónico exige a data completa (ano/mês/dia).
Essa data está presente na CITAÇÃO LEGÍSTICA COMPLETA em português — ex.
"Decreto-Lei n.º 43-B/2024, de 2 de julho" — pelo que o URI canónico É
construível a partir de uma citação completa: basta extrair a componente
", de {dia} de {mês} [de {ano}]" e mapear o mês para o seu número (ver
parse_citation / citation_to_eli). Casos insuficientes (não por falha do
esquema, mas por falta de dados na origem): uma citação ABREVIADA
("Decreto-Lei n.º 22/2026", sem a data) ou um URL de detalhe do portal
(.../detalhe/decreto-lei/22-2026-HASH) não trazem a data — aí o conversor cai
na forma "proposta" (eli.gov.pt, ano+número), construível sem data.

Uso:
    from conversion import EliId, citation_to_eli, dre_to_eli, eli_to_dre_legacy

    # citação completa → canónico (a data vem da própria citação):
    citation_to_eli("Decreto-Lei n.º 43-B/2024, de 2 de julho")
    # 'https://data.dre.pt/eli/dec-lei/43-B/2024/07/02'

    # canónico a partir de EliId:
    EliId('dec-lei', 2016, '83', pub_date='2016-12-16').to_uri()
    # 'https://data.dre.pt/eli/dec-lei/83/2016/12/16'

    # a partir do URL de detalhe (sem data) → forma proposta construível:
    dre_to_eli("https://dre.pt/dre/detalhe/decreto-lei/22-2026-100000000")
    # 'https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt'
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

DRE_ELI_DOMAIN = "data.dre.pt"          # domínio canónico (produção INCM)
ELI_PROPOSED_DOMAIN = "eli.gov.pt"      # forma proposta DAPL (ano+número)
DRE_DOMAIN = "dre.pt"                   # portal de detalhe (legacy)

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
REGIONAL_TYPES = {"dlr", "drr"}


@dataclass(frozen=True)
class EliId:
    """Identificação canónica de um ato em ELI-PT."""

    act_type: str                          # 'dec-lei', 'lei', ...
    year: int
    number: str                            # str: aceita '205-B', '442-A'
    jurisdiction: str = "pt"               # 'pt', 'pt-20', 'pt-30' (só na forma proposta)
    pub_date: Optional[str] = None         # ISO 'YYYY-MM-DD' — exigido para a forma canónica
    language: str = "pt"
    point_in_time: Optional[str] = None    # data de consolidação (ISO)
    fmt: Optional[str] = None              # 'xml', 'html', 'json', 'pdf'
    fragment: Optional[str] = None         # eId interno

    def to_uri(self, scheme: str = "dre", domain: Optional[str] = None) -> str:
        """Constrói o URI ELI-PT.

        scheme='dre'      → canónico data.dre.pt (exige pub_date).
        scheme='proposed' → forma DAPL anterior eli.gov.pt (ano+número).
        """
        if scheme == "proposed":
            dom = domain or ELI_PROPOSED_DOMAIN
            uri = (
                f"https://{dom}/eli/{self.jurisdiction}/{self.act_type}"
                f"/{self.year}/{self.number}/{self.language}"
            )
            if self.point_in_time:
                uri += f"/{self.point_in_time}"
            if self.fmt:
                uri += f".{self.fmt}"
            if self.fragment:
                uri += f"#{self.fragment}"
            return uri

        # canónico (data.dre.pt)
        if not self.pub_date:
            raise ValueError(
                "forma canónica data.dre.pt exige pub_date (data de publicação "
                "completa); use scheme='proposed' ou faça lookup ao DRE."
            )
        dom = domain or DRE_ELI_DOMAIN
        y, m, d = self.pub_date.split("-")
        uri = f"https://{dom}/eli/{self.act_type}/{self.number}/{y}/{m}/{d}"
        # Work = até {dia}. Expression/Manifestation só se pit/fmt pedido.
        if self.point_in_time or self.fmt:
            verseg = self.point_in_time or "p"
            uri += f"/{verseg}/dre/{self.language}"
            if self.fmt:
                uri += f"/{self.fmt}"
        if self.fragment:
            uri += f"#{self.fragment}"
        return uri


# ---------------------------------------------------------------------------
# Regex de parsing
# ---------------------------------------------------------------------------
_DRE_RE = re.compile(
    r"^https?://(?:www\.)?dre\.pt/dre/detalhe/"
    r"(?P<type>[a-z-]+)/"
    r"(?P<number>\d+(?:-[A-Za-z0-9]+)?)-(?P<year>\d{4})"
    r"(?:-(?P<hash>\d+))?/?$"
)

# Canónico data.dre.pt: /eli/{type}/{number}/{Y}/{M}/{D}[/{p|date}/dre/{lang}[/{fmt}]][#frag]
_ELI_DRE_RE = re.compile(
    r"^https?://(?P<domain>[a-z0-9.-]+)/eli/"
    r"(?P<type>[a-z-]+)/"
    r"(?P<number>\d+(?:-[A-Za-z0-9]+)?)/"
    r"(?P<y>\d{4})/(?P<m>\d{2})/(?P<d>\d{2})"
    r"(?:/(?P<verseg>p|\d{4}-\d{2}-\d{2})/dre/(?P<lang>[a-z]{2,3})"
    r"(?:/(?P<fmt>xml|html|json|pdf))?)?"
    r"(?:#(?P<fragment>[a-zA-Z0-9_]+))?$"
)

# Proposta eli.gov.pt: /eli/{jur}/{type}/{year}/{number}/{lang}[/{pit}][.{fmt}][#frag]
_ELI_PROPOSED_RE = re.compile(
    r"^https?://(?P<domain>[a-z0-9.-]+)/eli/"
    r"(?P<jurisdiction>pt(?:-\d{2})?)/"
    r"(?P<type>[a-z-]+)/"
    r"(?P<year>\d{4})/(?P<number>\d+(?:-[A-Za-z0-9]+)?)/"
    r"(?P<language>[a-z]{2,3})"
    r"(?:/(?P<pit>\d{4}-\d{2}-\d{2}))?"
    r"(?:\.(?P<fmt>xml|html|json|pdf))?"
    r"(?:#(?P<fragment>[a-zA-Z0-9_]+))?$"
)


def parse_dre(url: str) -> EliId:
    """Converte URL de detalhe do dre.pt em EliId (sem data — só number/year)."""
    m = _DRE_RE.match(url.strip())
    if not m:
        raise ValueError(f"URL dre.pt não reconhecido: {url!r}")
    dre_type = m.group("type")
    if dre_type not in DRE_TO_ELI_TYPE:
        raise ValueError(f"Tipo dre.pt desconhecido: {dre_type!r}")
    return EliId(
        act_type=DRE_TO_ELI_TYPE[dre_type],
        year=int(m.group("year")),
        number=m.group("number"),
        jurisdiction="pt",
    )


def parse_eli(uri: str) -> EliId:
    """Converte um URI ELI-PT (canónico data.dre.pt OU proposto) em EliId."""
    s = uri.strip()
    m = _ELI_DRE_RE.match(s)
    if m:
        return EliId(
            act_type=m.group("type"),
            year=int(m.group("y")),
            number=m.group("number"),
            jurisdiction="pt",
            pub_date=f"{m.group('y')}-{m.group('m')}-{m.group('d')}",
            language=m.group("lang") or "pt",
            point_in_time=(m.group("verseg") if m.group("verseg") and m.group("verseg") != "p" else None),
            fmt=m.group("fmt"),
            fragment=m.group("fragment"),
        )
    m = _ELI_PROPOSED_RE.match(s)
    if m:
        return EliId(
            act_type=m.group("type"),
            year=int(m.group("year")),
            number=m.group("number"),
            jurisdiction=m.group("jurisdiction"),
            language=m.group("language"),
            point_in_time=m.group("pit"),
            fmt=m.group("fmt"),
            fragment=m.group("fragment"),
        )
    raise ValueError(f"URI ELI-PT não reconhecido: {uri!r}")


def dre_to_eli(url: str, pub_date: Optional[str] = None) -> str:
    """Converte URL de detalhe do dre.pt em URI ELI-PT.

    Com `pub_date` → forma canónica data.dre.pt. Sem ela (este conversor recebe
    um URL de detalhe, que não inclui a data; uma citação COMPLETA já a
    incluiria — ver `citation_to_eli`) → forma proposta eli.gov.pt como
    fallback construível, a resolver via DRE.
    """
    eid = parse_dre(url)
    if pub_date:
        eid = EliId(act_type=eid.act_type, year=eid.year, number=eid.number, pub_date=pub_date)
        return eid.to_uri(scheme="dre")
    return eid.to_uri(scheme="proposed")


# ---------------------------------------------------------------------------
# Citação legística → ELI (a citação COMPLETA traz a data)
# ---------------------------------------------------------------------------
MONTHS = {
    "janeiro": 1, "fevereiro": 2, "marco": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11,
    "dezembro": 12,
}

_CITATION_RE = re.compile(
    r"(?P<tipo>Decreto-Lei|Lei\s+Org[âa]nica|Lei|Portaria|"
    r"Resolu[çc][ãa]o\s+do\s+Conselho\s+de\s+Ministros|"
    r"Resolu[çc][ãa]o\s+da\s+Assembleia\s+da\s+Rep[úu]blica|"
    r"Decreto\s+da\s+Assembleia\s+da\s+Rep[úu]blica|"
    r"Despacho\s+normativo|"
    r"Decreto\s+Legislativo\s+Regional|"
    r"Decreto\s+Regulamentar\s+Regional)"
    r"\s+n\.?[ºo°]?\s*(?P<num>\d+(?:-[A-Za-z0-9]+)?)\s*/\s*(?P<ano>\d{4})"
    r"(?:,?\s+de\s+(?P<dia>\d{1,2})\s+de\s+(?P<mes>[A-Za-zçÇ]+)"
    r"(?:\s+de\s+(?P<ano2>\d{4}))?)?",
    re.IGNORECASE,
)

_CITATION_TYPE = {
    "decreto-lei": "dec-lei",
    "lei organica": "lei",
    "lei": "lei",
    "portaria": "portaria",
    "resolucao do conselho de ministros": "res-cm",
    "resolucao da assembleia da republica": "res-ar",
    "decreto da assembleia da republica": "decreto-ar",
    "despacho normativo": "despacho-normativo",
    "decreto legislativo regional": "dlr",
    "decreto regulamentar regional": "drr",
}


def _norm(s: str) -> str:
    """Minúsculas, sem acentos, espaços colapsados — para chavear tipos/meses."""
    for a, b in (("ç", "c"), ("ã", "a"), ("á", "a"), ("â", "a"), ("é", "e"),
                 ("ê", "e"), ("í", "i"), ("ó", "o"), ("ô", "o"), ("ú", "u")):
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s.lower()).strip()


def parse_citation(text: str) -> EliId:
    """Extrai um EliId de uma citação legística PT COMPLETA.

    A citação completa inclui a data — "Decreto-Lei n.º 43-B/2024, de 2 de
    julho" — fornecendo tipo, número, ano, dia e mês; o EliId resultante tem
    `pub_date`, logo `to_uri()` produz a forma canónica data.dre.pt.

    Levanta ValueError se a citação for ABREVIADA (sem ", de {dia} de {mês}"):
    aí falta a data e o canónico não é construível — use scheme="proposed" ou
    um lookup ao DRE. (Isto é uma citação incompleta por padrão legístico, não
    uma falha do esquema da INCM.)
    """
    m = _CITATION_RE.search(text)
    if not m:
        raise ValueError(f"citação não reconhecida: {text!r}")
    act_type = _CITATION_TYPE.get(_norm(m.group("tipo")))
    if not act_type:
        raise ValueError(f"tipo de acto não mapeado: {m.group('tipo')!r}")
    dia, mes = m.group("dia"), m.group("mes")
    if not (dia and mes):
        raise ValueError(
            "citação incompleta: falta a data ('de {dia} de {mês}') — citação "
            'abreviada por padrão legístico; use scheme="proposed" ou lookup ao DRE'
        )
    mo = MONTHS.get(_norm(mes))
    if not mo:
        raise ValueError(f"mês não reconhecido: {mes!r}")
    pub_year = int(m.group("ano2") or m.group("ano"))
    return EliId(
        act_type=act_type,
        year=int(m.group("ano")),
        number=m.group("num"),
        pub_date=f"{pub_year:04d}-{mo:02d}-{int(dia):02d}",
    )


def citation_to_eli(text: str, scheme: str = "dre") -> str:
    """URI ELI-PT a partir de uma citação legística.

    scheme='dre' (default) → canónico data.dre.pt (exige citação COMPLETA).
    scheme='proposed' → forma eli.gov.pt (basta tipo+número+ano da citação).
    """
    if scheme == "proposed":
        m = _CITATION_RE.search(text)
        if not m:
            raise ValueError(f"citação não reconhecida: {text!r}")
        act_type = _CITATION_TYPE.get(_norm(m.group("tipo")))
        if not act_type:
            raise ValueError(f"tipo de acto não mapeado: {m.group('tipo')!r}")
        return EliId(act_type=act_type, year=int(m.group("ano")),
                     number=m.group("num")).to_uri(scheme="proposed")
    return parse_citation(text).to_uri(scheme="dre")


def eli_to_dre_legacy(uri: str) -> str:
    """Converte URI ELI-PT (qualquer forma) em URL de detalhe do dre.pt (sem hash)."""
    eli = parse_eli(uri)
    if eli.act_type not in ELI_TO_DRE_TYPE:
        raise ValueError(f"Tipo ELI desconhecido para mapeamento dre.pt: {eli.act_type!r}")
    dre_type = ELI_TO_DRE_TYPE[eli.act_type]
    return f"https://{DRE_DOMAIN}/dre/detalhe/{dre_type}/{eli.number}-{eli.year}"


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def _main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(
            "Uso:\n"
            "  python conversion.py to-eli <url-dre> [data-publicacao YYYY-MM-DD]\n"
            "  python conversion.py to-dre <uri-eli>\n"
            '  python conversion.py cite-to-eli "Decreto-Lei n.º 43-B/2024, de 2 de julho"\n',
            flush=True,
        )
        return 2
    cmd, arg = argv[0], argv[1]
    try:
        if cmd == "to-eli":
            pub = argv[2] if len(argv) > 2 else None
            print(dre_to_eli(arg, pub_date=pub))
        elif cmd == "to-dre":
            print(eli_to_dre_legacy(arg))
        elif cmd == "cite-to-eli":
            print(citation_to_eli(arg))
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
