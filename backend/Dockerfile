# ─── Build stage ─────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies into a separate location so we can copy them
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── Runtime stage ───────────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Runtime system deps only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy source code
COPY . .

# ── Permissions setup (all in one layer as root) ──────────────────────────────
# 1. Strip Windows CRLF from entrypoint so Linux sh can execute it
# 2. Create staticfiles + media dirs so collectstatic can write to them
#    even when Docker mounts a named volume there (volume seeded from image)
# 3. Create non-root user and hand over full ownership
RUN sed -i 's/\r$//' /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh && \
    mkdir -p /app/staticfiles /app/media && \
    addgroup --system django && \
    adduser --system --ingroup django django && \
    chown -R django:django /app

USER django

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
