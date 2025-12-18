FROM ubuntu:24.04

# 1. Instalace systémových závislostí
RUN apt-get update && apt-get install -y \
    wget \
    git \
    bzip2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Instalace Miniconda
RUN mkdir -p /opt/miniconda3 && \
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh && \
    bash /tmp/miniconda.sh -b -u -p /opt/miniconda3 && \
    rm /tmp/miniconda.sh

# Přidání kondy do PATH
ENV PATH="/opt/miniconda3/bin:${PATH}"

# 3. Klonování repozitáře a vytvoření prostředí
# Klonujeme přímo do složky proptimus_raphan
RUN git clone https://github.com/sb-ncbr/proptimus_raphan

# Vytvoření prostředí z environment.yml v repozitáři
# Poznámka: prostředí v tomto yml se jmenuje 'proptimus-raphan'
ENV CONDA_PLUGINS_AUTO_ACCEPT_TOS=yes
RUN conda env create -f proptimus_raphan/environment.yml && \
    conda install -n proptimus-raphan anaconda::flask anaconda::flask-cors conda-forge::biotite conda-forge::scikit-learn tabulate conda-forge::pdb2pqr conda-forge::gemmi --freeze-installed && \
    conda clean -afy

# 4. Nastavení cest pro nové prostředí
# Tímto krokem zajistíme, že 'python' a 'flask' budou brány z proptimus-raphan
ENV CONDA_DEFAULT_ENV=proptimus-raphan
ENV PATH="/opt/miniconda3/envs/proptimus-raphan/bin:${PATH}"

# 5. Kopírování tvé lokální aplikace (pokud ji máš separátně)
# Pokud je tvá aplikace součástí toho staženého repa, WORKDIR nastav tam.
# Předpokládám, že tvůj kód kopíruješ k tomu staženému:
COPY app/ ./app/
WORKDIR /app/app

RUN mkdir -p calculated_structures && chmod 777 calculated_structures

# 6. Prostředí a cesty k binárkám
ENV FLASK_APP=routes.py
ENV PYTHONUNBUFFERED=1
ENV XTB_PATH=/opt/miniconda3/envs/proptimus-raphan/bin/xtb
ENV OBABEL_PATH=/opt/miniconda3/envs/proptimus-raphan/bin/obabel

EXPOSE 80


# Spuštění aplikace
CMD ["flask", "run", "--host=0.0.0.0", "--port=80"]
