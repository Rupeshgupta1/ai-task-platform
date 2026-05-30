FROM python:3.11-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 workergroup && \
    adduser --system --uid 1001 --ingroup workergroup workeruser
COPY --from=builder /root/.local /home/workeruser/.local
COPY --chown=workeruser:workergroup worker.py .
USER workeruser
ENV PATH=/home/workeruser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
CMD ["python", "-u", "worker.py"]
