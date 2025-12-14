FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN groupadd -r policy && useradd -r -g policy policy

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chown -R policy:policy /app

USER policy

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

ENV HOST=0.0.0.0 \
    PORT=3002 \
    WORKERS=1

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3002", "--workers", "1"]
