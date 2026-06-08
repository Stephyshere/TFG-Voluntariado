"""
Script to generate multiple users (volunteers and organizations) and
simulate enrollments to achieve various ranks (Bronze, Silver, Gold).
"""

import os
import random

import django

# Configuración del entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from django.db import transaction, DatabaseError, IntegrityError
from voluntariado.models import Perfil, Anuncio, Inscripcion

def generate_users_and_enrollments() -> None:
    """
    Genera aproximadamente 30 usuarios y los inscribe en actividades.
    
    Se asegura de crear organizaciones y voluntarios, inscribiendo a estos últimos
    en suficientes actividades con la marca de "asistido" en verdadero para que
    alcancen los distintos rangos previstos en el sistema (Bronce, Plata, Oro).
    
    Raises:
        IntegrityError: Si ocurren problemas de unicidad al crear usuarios o inscripciones.
        DatabaseError: Si ocurren fallos en la conexión a la base de datos durante la transacción.
    """
    print("Iniciando la generación masiva de usuarios e inscripciones...")
    
    anuncios_disponibles = list(Anuncio.objects.all())
    if len(anuncios_disponibles) < 16:
        print("Advertencia: No hay suficientes anuncios (se necesitan al menos 16 para alcanzar el rango Oro).")
        return

    # Configuramos el volumen de usuarios y sus asistencias objetivo
    configuracion_rangos = {
        'oro': {'cantidad': 5, 'asistencias': 16},
        'plata': {'cantidad': 10, 'asistencias': 7},
        'bronce': {'cantidad': 10, 'asistencias': 2},
        'sin_rango': {'cantidad': 3, 'asistencias': 0}
    }
    
    organizaciones_cantidad = 5
    usuarios_procesados = 0

    try:
        # Usamos transaction.atomic para asegurar que todo se guarda de forma íntegra
        with transaction.atomic():
            # 1. Crear organizaciones
            for indice in range(organizaciones_cantidad):
                username = f'org_ficticia_{indice+1}'
                user, created = User.objects.get_or_create(
                    username=username,
                    defaults={'email': f'{username}@test.com'}
                )
                if created:
                    user.set_password('1234')
                    user.save()
                    Perfil.objects.create(
                        user=user,
                        rol='organizacion',
                        nombre_entidad=f'Asociación Colaboradora {indice+1}',
                        telefono=f'60010020{indice}'
                    )
                    usuarios_procesados += 1

            # 2. Crear voluntarios y asignar inscripciones para conseguir los rangos
            for rango_nombre, configuracion in configuracion_rangos.items():
                cantidad_voluntarios = configuracion['cantidad']
                asistencias_requeridas = configuracion['asistencias']
                
                for indice in range(cantidad_voluntarios):
                    username = f'voluntario_{rango_nombre}_{indice+1}'
                    user, created = User.objects.get_or_create(
                        username=username,
                        defaults={'email': f'{username}@test.com'}
                    )
                    
                    if created:
                        user.set_password('1234')
                        user.save()
                        Perfil.objects.create(
                            user=user,
                            rol='voluntario',
                            telefono=f'61120030{indice}'
                        )
                        usuarios_procesados += 1
                        
                        # Inscribir en actividades elegidas al azar para lograr el rango
                        if asistencias_requeridas > 0:
                            anuncios_seleccionados = random.sample(anuncios_disponibles, asistencias_requeridas)
                            for anuncio in anuncios_seleccionados:
                                inscripcion, _ = Inscripcion.objects.get_or_create(
                                    anuncio=anuncio,
                                    usuario=user,
                                    defaults={'asistido': True}
                                )
                                # Forzar la asistencia por si la inscripción ya existía
                                if not inscripcion.asistido:
                                    inscripcion.asistido = True
                                    inscripcion.save()
                        
                        # Añadir un par de inscripciones pendientes (asistido=False) para dar realismo
                        inscripciones_actuales = Inscripcion.objects.filter(usuario=user).values_list('anuncio_id', flat=True)
                        anuncios_restantes = [a for a in anuncios_disponibles if a.id not in inscripciones_actuales]
                        
                        if anuncios_restantes:
                            extra_anuncios = random.sample(anuncios_restantes, min(2, len(anuncios_restantes)))
                            for extra_anuncio in extra_anuncios:
                                Inscripcion.objects.get_or_create(
                                    anuncio=extra_anuncio,
                                    usuario=user,
                                    defaults={'asistido': False}
                                )
                                
        print(f"Proceso finalizado. Se han creado {usuarios_procesados} perfiles nuevos con sus respectivas inscripciones.")
    
    except IntegrityError as integrity_err:
        print(f"Error de integridad en la base de datos al guardar inscripciones: {integrity_err}")
        raise
    except DatabaseError as db_err:
        print(f"Error general de base de datos durante la transacción: {db_err}")
        raise

if __name__ == '__main__':
    generate_users_and_enrollments()
