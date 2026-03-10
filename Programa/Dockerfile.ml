FROM python:3.11-slim

WORKDIR /workspace

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Eliminamos el CMD de aquí para que el contenedor no haga nada por defecto
# al iniciar, permitiendo que el 'command' del compose.yaml tome el control total.