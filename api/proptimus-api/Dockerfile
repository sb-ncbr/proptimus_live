FROM ubuntu:24.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    git \
    bzip2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Miniconda
RUN mkdir -p /opt/miniconda3 && \
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh && \
    bash /tmp/miniconda.sh -b -u -p /opt/miniconda3 && \
    rm /tmp/miniconda.sh

# Recommended fix: Set the environment variable to automatically accept Conda TOS in non-interactive environments
ENV CONDA_PLUGINS_AUTO_ACCEPT_TOS=yes

# Configure conda to use only conda-forge
RUN /opt/miniconda3/bin/conda config --set channel_priority strict && \
    /opt/miniconda3/bin/conda config --remove channels defaults 2>/dev/null || true && \
    /opt/miniconda3/bin/conda config --add channels conda-forge

# Install xtb and openbabel via conda-forge only.
# Split into separate installs to reduce peak memory usage of the conda solver.
RUN /opt/miniconda3/bin/conda install -y -c conda-forge python=3.11 && \
    /opt/miniconda3/bin/conda clean -afy

RUN /opt/miniconda3/bin/conda install -y -c conda-forge xtb && \
    /opt/miniconda3/bin/conda clean -afy

RUN /opt/miniconda3/bin/conda install -y -c conda-forge openbabel=3.1.1 pdb2pqr && \
    /opt/miniconda3/bin/conda clean -afy

# Add conda binaries to PATH
ENV PATH="/opt/miniconda3/bin:${PATH}"

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

WORKDIR /app

# Create calculated_structures directory
RUN mkdir -p app/calculated_structures && \
    groupadd --gid 10001 proptimus && \
    useradd --uid 10001 --gid 10001 --create-home --no-log-init proptimus && \
    chown -R proptimus:proptimus /app

# Environment variables
ENV FLASK_APP=app.routes:application
ENV PYTHONUNBUFFERED=1
ENV XTB_PATH=/opt/miniconda3/bin/xtb
ENV OBABEL_PATH=/opt/miniconda3/bin/obabel
ENV PROPTIMUS_EXECUTION_MODE=local

EXPOSE 80

# The same image is used by the API Deployment and on-demand worker Jobs.
# Worker Jobs override this command with: python -m app.worker <job-id>
USER 10001:10001
CMD ["gunicorn", "--workers", "1", "--bind", "0.0.0.0:80", "app.routes:application"]
