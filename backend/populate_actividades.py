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

def download_random_image(seed: str, keyword: str) -> bytes:
    """
    Descarga una imagen aleatoria desde loremflickr asegurando
    que sea única mediante el uso de una semilla (seed) y relacionándola con el tema.

    Args:
        seed (str): Cadena de texto única para generar una imagen específica.
        keyword (str): Palabra clave (ej: ecology, animal) para filtrar la temática.

    Returns:
        bytes: El contenido binario de la imagen.
        
    Raises:
        URLError: Si hay un problema de red o DNS al contactar al servidor.
        HTTPError: Si el servidor responde con un código de error HTTP.
    """
    import hashlib
    # Convertimos la semilla a un número entero para usar el parámetro lock de loremflickr
    int_seed = int(hashlib.md5(seed.encode('utf-8')).hexdigest(), 16) % 100000
    
    url = f"https://loremflickr.com/800/600/{keyword}?lock={int_seed}"
    
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

    # Banco de textos realistas asociados a cada etiqueta
    textos_realistas = {
        'medio_ambiente': [
            ("Limpieza de costas y playas", "Únete a nuestra jornada de recogida de plásticos y residuos en la costa para proteger el ecosistema marino local. ¡Cuidemos nuestro entorno!"),
            ("Reforestación del monte bajo", "Vamos a plantar especies autóctonas en las zonas afectadas por la sequía. Tu ayuda es vital para recuperar la flora de la región."),
            ("Taller de reciclaje y concienciación", "Ayúdanos a organizar e impartir charlas prácticas sobre la correcta separación de residuos en el centro comunitario.")
        ],
        'educacion': [
            ("Apoyo escolar para menores", "Buscamos voluntarios para ayudar con los deberes y dar apoyo académico a niños de familias vulnerables durante las tardes."),
            ("Campaña de fomento de la lectura", "Colabora en la biblioteca organizando cuentacuentos y dinámicas de lectura para despertar el interés de los más pequeños."),
            ("Alfabetización digital para adultos", "Enseña el uso básico de ordenadores y teléfonos móviles a personas mayores con el objetivo de reducir la brecha digital.")
        ],
        'salud': [
            ("Acompañamiento en el hospital", "Acompaña a personas mayores que se encuentran solas durante su estancia en el hospital. Tu simple compañía marca una gran diferencia."),
            ("Apoyo logístico en donación de sangre", "Necesitamos voluntarios para la unidad móvil de donación. Informaremos a los vecinos, organizaremos las colas y repartiremos refrigerios."),
            ("Jornada de primeros auxilios", "Ayuda a preparar el material, gestionar inscripciones y acomodar el espacio para el curso intensivo impartido por profesionales sanitarios.")
        ],
        'comunidad': [
            ("Reparto solidario de alimentos", "Colabora en la organización, clasificación y entrega equitativa de los lotes del banco de alimentos a las familias más necesitadas del barrio."),
            ("Renovación del centro cívico", "El centro vecinal necesita una mano de pintura y pequeñas reparaciones en su mobiliario. Tráete ropa de trabajo y ganas de colaborar en equipo."),
            ("Organización de fiestas vecinales", "Ayúdanos a montar las carpas, preparar los juegos infantiles tradicionales y coordinar las distintas actividades de nuestras fiestas locales.")
        ],
        'animales': [
            ("Paseo y socialización de perros", "Ven al refugio a pasear a los perros rescatados. Esta actividad les ayuda enormemente a rebajar su estrés y mejorar su sociabilidad para encontrar una familia."),
            ("Mantenimiento de refugio felino", "Necesitamos manos dispuestas para limpiar instalaciones, arreglar casetas y asegurar que las colonias controladas de gatos tienen alimento fresco."),
            ("Stand de concienciación sobre adopción", "Apóyanos gestionando el stand informativo para promover la adopción responsable de animales, repartiendo folletos y resolviendo dudas de los viandantes.")
        ],
        'otros': [
            ("Asistencia en carrera solidaria", "Únete como voluntario apoyando en los puntos de avituallamiento, entrega de dorsales y control de cruces de nuestra carrera benéfica anual."),
            ("Recogida masiva de ropa de abrigo", "Ayuda a recibir, clasificar por tallas y empaquetar abrigos y mantas donadas para personas sin recursos de cara a la llegada del invierno."),
            ("Gestión de mercadillo benéfico", "Colabora atendiendo los puestos de nuestro mercadillo artesanal solidario durante este fin de semana. Todo lo recaudado irá a buenas causas.")
        ]
    }

    # 4. Generar los anuncios
    for pedania in pedanias_db:
        print(f"Generando actividades para la pedanía: {pedania.nombre}...")
        
        for indice in range(actividades_por_pedania):
            etiqueta_elegida = random.choice(etiquetas_disponibles)
            titulo_base, descripcion_base = random.choice(textos_realistas.get(etiqueta_elegida, textos_realistas['otros']))
            
            titulo = f"{titulo_base} en {pedania.nombre}"
            descripcion = descripcion_base
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
            
            # Asociamos un keyword de búsqueda según la etiqueta de la actividad
            mapa_keywords = {
                'medio_ambiente': 'nature,ecology',
                'educacion': 'education,school,reading',
                'salud': 'hospital,health',
                'comunidad': 'community,teamwork',
                'animales': 'animal,dog,cat,pet',
                'otros': 'charity,event,volunteer'
            }
            keyword_imagen = mapa_keywords.get(etiqueta_elegida, 'community')

            try:
                contenido_imagen = download_random_image(semilla_imagen, keyword_imagen)
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
