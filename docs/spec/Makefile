# AKN-PT specification build
# Requires: pandoc 3.x + XeLaTeX (TeX Live)

PANDOC ?= pandoc
PANDOC_FLAGS = --from markdown+pipe_tables+raw_html --pdf-engine=xelatex --metadata-file=pandoc-metadata.yaml

PT_CHAPTERS = pt/01-introducao.md pt/02-conformidade.md pt/03-modelo-documental.md \
              pt/04-tipologia-atos.md pt/05-estrutura-documento.md \
              pt/06-mapeamento-estrutural.md pt/07-referencias-citacoes.md \
              pt/08-identificadores.md pt/09-metadados.md pt/10-multilinguismo.md \
              pt/11-ciclo-vida.md pt/12-pegada-legislativa.md pt/13-validacao.md \
              pt/14-extensoes-proibicoes.md pt/15-exemplos.md pt/16-glossario.md \
              pt/17-referencias.md pt/18-changelog.md

EN_CHAPTERS = en/executive-summary.md en/technical-overview.md en/implementation-guide.md

OUTPUT_PT = AKN-PT-Specification-v0.1.0-pt.pdf
OUTPUT_EN = AKN-PT-Specification-v0.1.0-en.pdf

.PHONY: all pt en clean check

all: pt en

pt: $(OUTPUT_PT)

en: $(OUTPUT_EN)

$(OUTPUT_PT): $(PT_CHAPTERS) pandoc-metadata.yaml
	$(PANDOC) $(PANDOC_FLAGS) -o $@ $(PT_CHAPTERS)

$(OUTPUT_EN): $(EN_CHAPTERS) pandoc-metadata.yaml
	$(PANDOC) $(PANDOC_FLAGS) --metadata=lang:en --metadata=title:"AKN-PT Executive Summary" -o $@ $(EN_CHAPTERS)

check:
	@for f in $(PT_CHAPTERS) $(EN_CHAPTERS); do \
		test -f $$f && echo "  OK   $$f" || echo "  MISS $$f"; \
	done

clean:
	rm -f $(OUTPUT_PT) $(OUTPUT_EN) *.aux *.log *.out *.toc

.PHONY: word
word:
	$(PANDOC) -o AKN-PT-Specification-v0.1.0-pt.docx $(PT_CHAPTERS) --reference-doc=pandoc-reference.docx 2>/dev/null || \
	$(PANDOC) -o AKN-PT-Specification-v0.1.0-pt.docx $(PT_CHAPTERS)
