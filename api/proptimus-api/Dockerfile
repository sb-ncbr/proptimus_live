FROM ubuntu:24.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    git \
    bzip2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Miniforge (includes libmamba solver and conda-forge by default)
RUN mkdir -p /opt/miniforge3 && \
    wget https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh -O /tmp/miniforge.sh && \
    bash /tmp/miniforge.sh -b -u -p /opt/miniforge3 && \
    rm /tmp/miniforge.sh

# Install xtb and openbabel via conda-forge only.
# Explicitly specify python=3.11 to avoid the solver picking an incompatible version (like 3.13)
RUN /opt/miniforge3/bin/conda install -y python=3.11 xtb openbabel=3.1.1 pdb2pqr && \
    /opt/miniforge3/bin/conda clean -afy

# Add conda binaries to PATH
ENV PATH="/opt/miniforge3/bin:${PATH}"

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

WORKDIR /app/app

# Create calculated_structures directory
RUN mkdir -p calculated_structures && \
    chmod 777 calculated_structures

# Environment variables
ENV FLASK_APP=routes.py
ENV PYTHONUNBUFFERED=1
ENV XTB_PATH=/opt/miniforge3/bin/xtb
ENV OBABEL_PATH=/opt/miniforge3/bin/obabel

EXPOSE 80

# Run Flask app
CMD ["flask", "run", "--host=0.0.0.0", "--port=80"]