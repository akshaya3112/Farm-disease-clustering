# Use lightweight Python 3.12 slim image
FROM python:3.12-slim

# Prevent Python from writing .pyc files and buffer output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

# Set working directory
WORKDIR /app

# Install system dependencies if required for compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files, data, precomputed outputs, templates, and static assets
COPY . /app/

# Expose the application port
EXPOSE 5000

# Run with Gunicorn production WSGI server
CMD exec gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:app

