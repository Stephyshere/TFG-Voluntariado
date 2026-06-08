import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from voluntariado.models import Perfil

def create_admin():
    username = 'admin'
    password = '1234'
    email = 'admin@example.com'

    if User.objects.filter(username=username).exists():
        print(f"El usuario {username} ya existe. Restableciendo contraseña.")
        user = User.objects.get(username=username)
        user.set_password(password)
        user.save()
    else:
        print(f"Creando usuario {username}...")
        user = User.objects.create_superuser(username=username, email=email, password=password)
        
    # Asegurar que el perfil exista
    Perfil.objects.get_or_create(user=user, rol='administrador', nombre_entidad='Ayuntamiento de Mazarrón')
    
    print(f"Usuario '{username}' configurado correctamente con contraseña '{password}'")

if __name__ == '__main__':
    create_admin()
