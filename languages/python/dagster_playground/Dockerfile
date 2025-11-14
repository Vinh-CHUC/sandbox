FROM ghcr.io/astral-sh/uv:alpine

WORKDIR /project

RUN apk add gdal-dev proj-dev geos-dev py3-pip build-base
RUN apk add python3-dev

COPY uv.lock .
COPY pyproject.toml .
COPY src/dagster_playground ./dagster_playground

RUN uv sync


ENV VIRTUAL_ENV=/project/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

EXPOSE 80
