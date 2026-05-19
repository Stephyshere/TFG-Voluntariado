import os
import django
from django.utils import timezone
from datetime import timedelta
import random

# Configurar el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from voluntariado.models import Pedania, Anuncio, Perfil

def populate():
    print("Iniciando script de población de datos...")

    # 1. Crear Pedanías (Lugares de Mazarrón)
    pedanias_nombres = [
        "Mazarrón (Casco Urbano)", "Puerto de Mazarrón", "Bolnuevo", 
        "Camposol", "Cañada de Gallego", "Pastrana", "Saladillo", "Ifre"
    ]
    
    pedanias_objs = []
    for nombre in pedanias_nombres:
        p, created = Pedania.objects.get_or_create(nombre=nombre)
        pedanias_objs.append(p)
        if created:
            print(f"Pedanía creada: {nombre}")

    # 2. Crear Usuarios (Organizador y Voluntarios)
    # Organizador (Admin/Staff)
    if not User.objects.filter(username='organizador').exists():
        admin = User.objects.create_superuser('organizador', 'admin@voluntadmazarron.com', 'admin123')
        Perfil.objects.create(user=admin, rol='organizacion', nombre_entidad="Ayuntamiento de Mazarrón")
        print("Usuario administrador creado: organizador")
    else:
        admin = User.objects.get(username='organizador')

    # 3. Crear Actividades FUTURAS (para el Home/Carrusel)
    actividades_futuras = [
        {
            "titulo": "Limpieza de Playa en Bolnuevo",
            "descripcion": "Únete a nosotros para una jornada de limpieza en las calas de Bolnuevo. Protegeremos la flora local y retiraremos plásticos. ¡Trae ropa cómoda y ganas de ayudar!",
            "etiqueta": "medio_ambiente",
            "imagen": "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?q=80&w=2070&auto=format&fit=crop", # Playa limpia
            "dias_futuro": 5,
            "pedania": "Bolnuevo"
        },
        {
            "titulo": "Taller de Lectura para Mayores",
            "descripcion": "Buscamos voluntarios para leer y acompañar a nuestros mayores en el centro de día de Puerto de Mazarrón. Una tarde de historias y compañía.",
            "etiqueta": "comunidad",
            "imagen": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2070&auto=format&fit=crop", # Lectura mayores
            "dias_futuro": 12,
            "pedania": "Puerto de Mazarrón"
        },
        {
            "titulo": "Reforestación Sierra de las Moreras",
            "descripcion": "Ayúdanos a plantar 100 nuevos árboles autóctonos en la Sierra. Una actividad perfecta para familias y amantes de la naturaleza.",
            "etiqueta": "medio_ambiente",
            "imagen": "https://images.unsplash.com/photo-1542601906990-b4d3fb7d5afa?q=80&w=2070&auto=format&fit=crop", # Plantar arboles
            "dias_futuro": 20,
            "pedania": "Mazarrón (Casco Urbano)"
        }
    ]

    for act in actividades_futuras:
        pedania = Pedania.objects.get(nombre=act['pedania'])
        fecha = timezone.now() + timedelta(days=act['dias_futuro'])
        
        # fecha_publicacion es auto_now_add, Django la asigna automaticamente
        Anuncio.objects.get_or_create(
            titulo=act['titulo'],
            defaults={
                'descripcion': act['descripcion'],
                'etiqueta': act['etiqueta'],
                'fecha_evento': fecha,
                'estado': 'publicado',
                'cupo_maximo': 50,
                'pedanias': pedania,
                'usuario': admin,
                # ImageField no acepta URLs, el frontend usa imagenes de fallback si es null
            }
        )
        print(f"Actividad futura creada: {act['titulo']}")

    # 4. Crear Actividades PASADAS (para Noticias)
    actividades_pasadas = [
        {
            "titulo": "Éxito en la Recogida de Alimentos",
            "descripcion": "Gracias a los más de 200 voluntarios, recolectamos 5 toneladas de alimentos para las familias más necesitadas. ¡Mazarrón es solidario!",
            "etiqueta": "comunidad",
            "dias_pasado": 10,
            "pedania": "Mazarrón (Casco Urbano)"
        },
        {
            "titulo": "Torneo Benéfico de Fútbol Playa",
            "descripcion": "Una jornada deportiva inolvidable donde recaudamos fondos para la protectora de animales local. Diversión y solidaridad bajo el sol.",
            "etiqueta": "otros",
            "dias_pasado": 45,
            "pedania": "Puerto de Mazarrón"
        },
        {
            "titulo": "Jornada de Adopción Canina",
            "descripcion": "15 perritos encontraron un nuevo hogar este fin de semana. Gracias a todos los que vinisteis a conocerlos y a darles una segunda oportunidad.",
            "etiqueta": "animales",
            "dias_pasado": 60,
            "pedania": "Camposol"
        }
    ]

    for act in actividades_pasadas:
        pedania = Pedania.objects.get(nombre=act['pedania'])
        fecha = timezone.now() - timedelta(days=act['dias_pasado'])
        
        # Para que aparezcan en noticias, deben estar 'finalizados' o tener fecha pasada
        Anuncio.objects.get_or_create(
            titulo=act['titulo'],
            defaults={
                'descripcion': act['descripcion'],
                'etiqueta': act['etiqueta'],
                'fecha_evento': fecha,
                'estado': 'finalizado',
                'cupo_maximo': 100,
                'pedanias': pedania,
                'usuario': admin,
            }
        )
        print(f"Noticia (actividad pasada) creada: {act['titulo']}")

    print("--- POBLACIÓN DE DATOS COMPLETADA ---")

if __name__ == '__main__':
    populate()
