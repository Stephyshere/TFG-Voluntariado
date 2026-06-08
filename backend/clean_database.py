"""
Script to clean all data from the database.
It removes all records but keeps the table structures intact.
"""

import os
import django

# Configuramos el entorno de Django antes de importar componentes
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import DatabaseError

def clean_database() -> None:
    """
    Limpia todos los datos de la base de datos configurada en Django.

    Esta función ejecuta el comando 'flush' de Django sin interacción
    del usuario para vaciar las tablas, dejándolas sin datos pero
    conservando su estructura original.

    Raises:
        CommandError: Si el comando de Django falla al ejecutarse.
        DatabaseError: Si existe un problema de conexión o ejecución a nivel
            de la base de datos.
    """
    print("Iniciando el proceso de limpieza de la base de datos...")
    
    try:
        # Se invoca 'flush' con interactive=False para evitar prompts de confirmación
        call_command('flush', interactive=False)
        print("Proceso completado. La base de datos está ahora vacía y lista para usarse.")
    except CommandError as command_error:
        print(f"Error al ejecutar el comando de Django: {command_error}")
        raise
    except DatabaseError as db_error:
        print(f"Error de base de datos durante la limpieza: {db_error}")
        raise

if __name__ == '__main__':
    clean_database()
