import os
import django

# 1. Conectar este script con tu proyecto Django
# Tu settings.py está dentro de la carpeta 'core'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Arrancar el motor de Django
django.setup()

# 2. Importar tu modelo
# Tu app se llama 'voluntariado'
from voluntariado.models import Pedania

def insertar_datos():
    pedanias_mazarron = [
        "ATALAYA",
        "BALSICAS",
        "BOLNUEVO",
        "CAÑADAS DEL ROMERO",
        "GAÑUELAS",
        "GARROBO",
        "IFRE - CAÑADA DE GALLEGO",
        "IFRE – PASTRANA",
        "LEIVA",
        "MAJADA",
        "MAZARRON",
        "MINGRANO",
        "MORERAS",
        "PUERTO DE MAZARRON",
        "RINCONES",
        "SALADILLO"
    ]

    print("Iniciando la carga de pedanías de Mazarrón...")
    contador = 0

    for nombre in pedanias_mazarron:
        # get_or_create evita que se dupliquen si ejecutas el script dos veces
        pedania, creada = Pedania.objects.get_or_create(nombre=nombre)
        
        if creada:
            print(f"Se ha añadido: {nombre}")
            contador += 1
        else:
            print(f"Ya existía: {nombre}")

    print("-" * 30)
    print(f"¡Proceso terminado! Se han insertado {contador} nuevas pedanías.")

if __name__ == '__main__':
    insertar_datos()