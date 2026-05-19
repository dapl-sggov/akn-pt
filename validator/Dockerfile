# SPDX-License-Identifier: EUPL-1.2
# AKN-PT reference validator — Docker image
#
# Build:
#   docker build -t akn-pt:0.1.0 -f validator/Dockerfile validator/
#
# Run:
#   docker run --rm -v "$(pwd):/work" akn-pt:0.1.0 validate /work/my-doc.akn.xml
#   docker run --rm -v "$(pwd):/work" akn-pt:0.1.0 batch /work/corpus
#

FROM python:3.14-slim AS builder
WORKDIR /build
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install --no-cache-dir --upgrade pip build && \
    python -m build --wheel --outdir /dist

FROM python:3.14-slim
LABEL org.opencontainers.image.title="akn-pt"
LABEL org.opencontainers.image.description="Reference validator for AKN-PT (Portuguese Akoma Ntoso profile)"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.licenses="EUPL-1.2"
LABEL org.opencontainers.image.source="https://github.com/SGGoverno/akn-pt"

# lxml needs libxml2 / libxslt at runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends libxml2 libxslt1.1 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /dist/*.whl /tmp/
RUN pip install --no-cache-dir /tmp/*.whl && rm /tmp/*.whl

# Non-root user
RUN useradd --create-home --shell /bin/bash akn-pt
USER akn-pt
WORKDIR /work

ENTRYPOINT ["akn-pt"]
CMD ["--help"]
