import os
import django
from django.utils import timezone
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from voluntariado.models import Perfil, Pedania, Anuncio, Inscripcion
from django.conf import settings

def run():
    print("Iniciando la inserción de datos falsos...")
    print(f"DEBUG - DATABASE_URL en el sistema: {os.environ.get('DATABASE_URL')}")
    print(f"DEBUG - Base de datos configurada: {settings.DATABASES['default']['ENGINE']}")
    
    # 1. Asegurar pedanías y obtenerlas
    nombres_pedanias_base = ['Mazarrón', 'Puerto de Mazarrón', 'Bolnuevo', 'Pastrana', 'Morata', 'Ifre-Pastrana', 'Cañadas del Romero', 'Gañuelas', 'La Majada']
    for p_name in nombres_pedanias_base:
        Pedania.objects.get_or_create(nombre=p_name)
        
    todas_pedanias = list(Pedania.objects.all())
    
    # 2. Organizaciones
    print("Creando organizaciones...")
    org1_user, _ = User.objects.get_or_create(username='ies_antonio_helin', defaults={'email': 'ies@helin.com'})
    org1_user.set_password('1234')
    org1_user.save()
    Perfil.objects.update_or_create(user=org1_user, defaults={'rol': 'organizacion', 'nombre_entidad': 'IES ANTONIO HELIN COSTA'})

    org2_user, _ = User.objects.get_or_create(username='grupo_tfg', defaults={'email': 'grupo@tfg.com'})
    org2_user.set_password('1234')
    org2_user.save()
    Perfil.objects.update_or_create(user=org2_user, defaults={'rol': 'organizacion', 'nombre_entidad': 'Grupo TFG'})

    # 3. Administrador
    print("Creando administrador...")
    admin_user, _ = User.objects.get_or_create(username='admin_falso', defaults={'email': 'admin_falso@test.com', 'is_superuser': True, 'is_staff': True})
    admin_user.set_password('1234')
    admin_user.save()
    Perfil.objects.update_or_create(user=admin_user, defaults={'rol': 'administrador'})

    # 4. Usuarios con distintos rangos (necesitamos asistencias_confirmadas = 1, 5, 16)
    print("Creando usuarios voluntarios...")
    user_bronce, _ = User.objects.get_or_create(username='vol_bronce', defaults={'email': 'bronce@test.com'})
    user_bronce.set_password('1234')
    user_bronce.save()
    Perfil.objects.update_or_create(user=user_bronce, defaults={'rol': 'voluntario'})

    user_plata, _ = User.objects.get_or_create(username='vol_plata', defaults={'email': 'plata@test.com'})
    user_plata.set_password('1234')
    user_plata.save()
    Perfil.objects.update_or_create(user=user_plata, defaults={'rol': 'voluntario'})

    user_oro, _ = User.objects.get_or_create(username='vol_oro', defaults={'email': 'oro@test.com'})
    user_oro.set_password('1234')
    user_oro.save()
    Perfil.objects.update_or_create(user=user_oro, defaults={'rol': 'voluntario'})

    # 5. Actividades por pedanía (y suficientes para llegar a 16 para el oro)
    print("Creando actividades y asignando inscripciones para los marcos...")
    anuncios_creados = []
    
    # Necesitamos mínimo 16 actividades para el usuario oro, y asegurar 1 por pedanía.
    cantidad_necesaria = max(16, len(todas_pedanias))
    
    for i in range(cantidad_necesaria):
        pedania = todas_pedanias[i % len(todas_pedanias)]
        anuncio, created = Anuncio.objects.get_or_create(
            titulo=f'Actividad Falsa {i + 1} en {pedania.nombre}',
            defaults={
                'descripcion': 'Descripción de prueba generada automáticamente.',
                'fecha_evento': timezone.now() + datetime.timedelta(days=10),
                'etiqueta': 'comunidad',
                'estado': 'publicado',
                'cupo_maximo': 20,
                'pedanias': pedania,
                'usuario': org1_user # Las crea la organización 1
            }
        )
        # Asegurarnos de tener 16 anuncios limpios para las inscripciones
        anuncios_creados.append(anuncio)

    # 6. Inscripciones y asistencias confirmadas
    # Bronce: 1 asistencia
    Inscripcion.objects.get_or_create(anuncio=anuncios_creados[0], usuario=user_bronce, defaults={'asistido': True})
    # Asegurarnos de que asistido esté en True por si ya existía
    Inscripcion.objects.filter(anuncio=anuncios_creados[0], usuario=user_bronce).update(asistido=True)

    # Plata: 5 asistencias
    for i in range(5):
        Inscripcion.objects.get_or_create(anuncio=anuncios_creados[i], usuario=user_plata, defaults={'asistido': True})
        Inscripcion.objects.filter(anuncio=anuncios_creados[i], usuario=user_plata).update(asistido=True)

    # Oro: 16 asistencias
    for i in range(16):
        Inscripcion.objects.get_or_create(anuncio=anuncios_creados[i], usuario=user_oro, defaults={'asistido': True})
        Inscripcion.objects.filter(anuncio=anuncios_creados[i], usuario=user_oro).update(asistido=True)

    print("Datos insertados correctamente en la base de datos.")

if __name__ == '__main__':
    run()
