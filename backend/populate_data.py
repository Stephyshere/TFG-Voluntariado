"""
Script independiente para la población de la base de datos de voluntariado.

Este script configura el entorno de Django y ejecuta la población de datos
de calidad premium a través del módulo seed_data.
"""

import os
import django

# 1. Configurar el entorno de Django antes de realizar cualquier importación de modelos
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# 2. Importar la función poblar_datos_premium del módulo voluntariado
from voluntariado.seed_data import poblar_datos_premium


def main() -> None:
    """
    Función de entrada principal que ejecuta la población de datos.
    """
    poblar_datos_premium()


if __name__ == '__main__':
    main()
