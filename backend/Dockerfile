FROM python:3.12-slim

# Evitar que Python escriba archivos .pyc y habilitar salida directa de logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema necesarias para psycopg2 y Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el codigo del proyecto
COPY . .

# Recopilar archivos estaticos
RUN python manage.py collectstatic --no-input

# Exponer el puerto de la aplicacion
EXPOSE 8000

# Comando de inicio: gunicorn sirviendo la aplicacion Django
CMD ["gunicorn", "core.wsgi", "--bind", "0.0.0.0:8000"]
