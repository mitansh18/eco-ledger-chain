# EcoLedger Backend Services Dockerfile

FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for data
RUN mkdir -p /app/uploads /app/data

# Expose ports for all services
EXPOSE 5001 5002 5003 5004 5005 5006

# Default command (can be overridden in docker-compose)
CMD ["python", "ai_apis/tree_detection_api.py"]