FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema para PostgreSQL/MySQL
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copiamos e instalamos dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto del código (incluyendo el .env si existe ahí)
COPY . .

EXPOSE 8000

# Ajusta "app.main:app" según el nombre de tu archivo principal
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]