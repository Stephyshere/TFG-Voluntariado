"""
Script to generate multiple activities (Anuncios) in the database.
It guarantees at least one activity per 'pedania' and downloads a unique
image for each activity using an external service.
"""

import os
import random
import urllib.request
from urllib.error import URLError, HTTPError
from datetime import timedelta

import django
from django.utils import timezone
from django.core.files.base import ContentFile

# Configuración del entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from voluntariado.models import Perfil, Pedania, Anuncio

def download_random_image(seed: str) -> bytes:
    """
    Descarga una imagen aleatoria desde picsum.photos asegurando
    que sea única mediante el uso de una semilla (seed).

    Args:
        seed (str): Cadena de texto única para generar una imagen específica.

    Returns:
        bytes: El contenido binario de la imagen.
        
    Raises:
        URLError: Si hay un problema de red o DNS al contactar al servidor.
        HTTPError: Si el servidor responde con un código de error HTTP.
    """
    url = f"https://picsum.photos/seed/{seed}/800/600"
    # Se añade un User-Agent para evitar rechazos del servidor
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        return response.read()

def generate_activities() -> None:
    """
    Crea un lote masivo de actividades en la base de datos.
    
    Asegura que haya actividades en todas las pedanías, completa todos los
    campos requeridos del modelo Anuncio y asigna una imagen distinta a cada una.
    """
    print("Iniciando la generación masiva de actividades...")

    # 1. Crear o recuperar un usuario organizador
    user_org, _ = User.objects.get_or_create(
        username='org_generador',
        defaults={'email': 'org@generador.com'}
    )
    if not user_org.has_usable_password():
        user_org.set_password('1234')
        user_org.save()
    
    Perfil.objects.update_or_create(
        user=user_org,
        defaults={'rol': 'organizacion', 'nombre_entidad': 'Organización Global'}
    )

    # 2. Asegurarnos de que existan las pedanías
    nombres_pedanias = [
        'Mazarrón', 'Puerto de Mazarrón', 'Bolnuevo', 'Pastrana', 
        'Morata', 'Ifre-Pastrana', 'Cañadas del Romero', 'Gañuelas', 'La Majada'
    ]
    for nombre_p in nombres_pedanias:
        Pedania.objects.get_or_create(nombre=nombre_p)
    
    pedanias_db = Pedania.objects.all()
    
    # 3. Datos de prueba para variabilidad
    etiquetas_disponibles = [etiqueta[0] for etiqueta in Anuncio.ETIQUETAS]
    estados_disponibles = ['publicado', 'en_curso']
    
    actividades_por_pedania = 3
    total_creadas = 0

    # 4. Generar los anuncios
    for pedania in pedanias_db:
        print(f"Generando actividades para la pedanía: {pedania.nombre}...")
        
        for indice in range(actividades_por_pedania):
            etiqueta_elegida = random.choice(etiquetas_disponibles)
            titulo = f"Actividad de {etiqueta_elegida.replace('_', ' ').title()} en {pedania.nombre} ({indice+1})"
            descripcion = (
                f"Esta es una descripción detallada para la actividad '{titulo}'. "
                "Necesitamos voluntarios comprometidos para llevar a cabo esta labor "
                "tan importante para nuestra comunidad. ¡Anímate a participar y ayudar!"
            )
            requerimientos = "Ser mayor de edad, llevar ropa cómoda, botella de agua y muchas ganas."
            fecha_evento = timezone.now() + timedelta(days=random.randint(2, 60))
            
            anuncio = Anuncio(
                titulo=titulo,
                descripcion=descripcion,
                fecha_evento=fecha_evento,
                etiqueta=etiqueta_elegida,
                estado=random.choice(estados_disponibles),
                cupo_maximo=random.randint(10, 50),
                requerimientos=requerimientos,
                pedanias=pedania,
                usuario=user_org
            )

            # Generar semilla única para que picsum devuelva una imagen distinta siempre
            semilla_imagen = f"ped_{pedania.id}_ind_{indice}_rnd_{random.randint(1000, 9999)}"
            print(f"  - Obteniendo imagen para: {titulo}")
            
            try:
                contenido_imagen = download_random_image(semilla_imagen)
                nombre_archivo = f"img_{semilla_imagen}.jpg"
                # Save=False porque luego llamamos a anuncio.save() manualmente
                anuncio.imagen.save(nombre_archivo, ContentFile(contenido_imagen), save=False)
            except HTTPError as http_err:
                print(f"    [!] Error HTTP al descargar imagen para {titulo}: {http_err.code}")
            except URLError as url_err:
                print(f"    [!] Error de conexión al descargar imagen para {titulo}: {url_err.reason}")
            except OSError as os_err:
                print(f"    [!] Error de sistema de archivos al guardar imagen: {os_err}")
            
            anuncio.save()
            total_creadas += 1

    print(f"\n¡Proceso finalizado! Se han creado exitosamente {total_creadas} actividades con imágenes.")

if __name__ == '__main__':
    generate_activities()
