# Python Agentic Worker — Production Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

ENV PYTHONPATH=/app

# Agentic worker runs the queue poller — no public port needed
CMD ["python", "-m", "agentic.workers.queue_worker"]
