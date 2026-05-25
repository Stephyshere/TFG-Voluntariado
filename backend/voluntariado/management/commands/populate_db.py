"""
Comando personalizado de Django para poblar la base de datos.

Este comando permite ejecutar la población de datos de calidad premium a través de:
python manage.py populate_db
"""

from typing import Any
from django.core.management.base import BaseCommand
from voluntariado.seed_data import poblar_datos_premium


class Command(BaseCommand):
    """
    Clase que representa el comando de gestión para poblar la base de datos.
    """
    help = 'Pobla la base de datos con actividades de alta calidad para todas las pedanías.'

    def handle(self, *args: Any, **options: Any) -> None:
        """
        Ejecuta la lógica de población de datos de voluntariado premium.

        Args:
            *args: Argumentos posicionales adicionales.
            **options: Opciones y modificadores del comando.
        """
        self.stdout.write(self.style.NOTICE("Iniciando comando populate_db desde Django..."))
        
        try:
            poblar_datos_premium()
            self.stdout.write(self.style.SUCCESS("¡La base de datos se ha poblado con éxito!"))
        except Exception as error:
            self.stdout.write(self.style.ERROR(f"Error crítico durante la población de datos: {error}"))
