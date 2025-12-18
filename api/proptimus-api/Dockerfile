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

# Přidání kondy do PATH pro build proces
ENV PATH="/opt/miniconda3/bin:${PATH}"

# 3. Kopírování definice prostředí
COPY environment.yml .

# 4. Vytvoření prostředí
# Předpokládám, že v environment.yml máte definované jméno (např. 'myenv')
ENV CONDA_PLUGINS_AUTO_ACCEPT_TOS=yes
RUN conda env create -f environment.yml && \
    conda clean -afy

# 5. Nastavení automatické aktivace prostředí
# Místo složitého 'conda activate' v Dockeru prostě nastavíme cesty natvrdo do PATH.
# Změňte 'myenv' na název prostředí, který máte v environment.yml
ENV CONDA_DEFAULT_ENV=myenv
ENV PATH="/opt/miniconda3/envs/myenv/bin:${PATH}"

# 6. Kopírování aplikace
COPY app/ ./app/
WORKDIR /app/app

RUN mkdir -p calculated_structures && chmod 777 calculated_structures

# 7. Prostředí a cesty k binárkám (nyní směřují do konkrétního environmentu)
ENV FLASK_APP=routes.py
ENV PYTHONUNBUFFERED=1
ENV XTB_PATH=/opt/miniconda3/envs/myenv/bin/xtb
ENV OBABEL_PATH=/opt/miniconda3/envs/myenv/bin/obabel

EXPOSE 80

# Spuštění přímo přes flask (díky PATH v kroku 5 se použije ten z environmentu)
CMD ["flask", "run", "--host=0.0.0.0", "--port=80"]
