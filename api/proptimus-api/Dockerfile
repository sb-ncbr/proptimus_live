FROM ubuntu:24.04

# Instalace systémových závislostí
RUN apt-get update && apt-get install -y \
    wget \
    git \
    bzip2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalace Miniconda
RUN mkdir -p /opt/miniconda3 && \
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh && \
    bash /tmp/miniconda.sh -b -u -p /opt/miniconda3 && \
    rm /tmp/miniconda.sh

ENV PATH="/opt/miniconda3/bin:${PATH}"
ENV CONDA_PLUGINS_AUTO_ACCEPT_TOS=yes

# Konfigurace Conda kanálů
RUN conda config --add channels conda-forge && \
    conda config --set channel_priority flexible

# Kopírování seznamu závislostí
COPY requirements.txt .

# KLÍČOVÁ ZMĚNA: Instalace Pythonu, xtb, openbabel a requirements najednou
# Tímto zajistíte, že solver najde kompatibilní verze pro všechno dohromady
RUN conda install -y python=3.13.9 --file requirements.txt && \
    conda clean -afy

# Kopírování aplikace
COPY app/ ./app/
WORKDIR /app/app

RUN mkdir -p calculated_structures && chmod 777 calculated_structures

# Prostředí
ENV FLASK_APP=routes.py
ENV PYTHONUNBUFFERED=1
ENV XTB_PATH=/opt/miniconda3/bin/xtb
ENV OBABEL_PATH=/opt/miniconda3/bin/obabel

EXPOSE 80

CMD ["flask", "run", "--host=0.0.0.0", "--port=80"]
