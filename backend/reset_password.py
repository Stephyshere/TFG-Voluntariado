import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

def reset_admin():
    try:
        user = User.objects.get(username='admin')
        user.set_password('admin123')
        user.save()
        
        # Asegurar que el token exista
        token, _ = Token.objects.get_or_create(user=user)
        
        print(f"Contraseña del usuario 'admin' establecida a 'admin123'.")
        print(f"Token: {token.key}")
        
    except User.DoesNotExist:
        print("Usuario 'admin' no encontrado. Creando...")
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Usuario 'admin' creado con contraseña 'admin123'")

if __name__ == '__main__':
    reset_admin()
