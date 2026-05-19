import os
import django

# Forzar la configuracion correcta de Django
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient

def check_login():
    username = 'admin'
    password = 'admin123'
    
    print(f"Checking user: {username}")
    
    try:
        user = User.objects.get(username=username)
        print(f"Usuario encontrado. Activo: {user.is_active}")
        if user.check_password(password):
            print("Contraseña coincide.")
        else:
            print("La contraseña NO coincide.")
            user.set_password(password)
            user.save()
            print("Contraseña restablecida a 'admin123'.")
    except User.DoesNotExist:
        print("Usuario no encontrado.")
        User.objects.create_superuser(username, 'admin@test.com', password)
        print("Usuario creado.")

    # Probar via API Client (simula una peticion HTTP)
    client = APIClient()
    response = client.post('/api/login/', {'username': username, 'password': password}, format='json')
    
    print(f"API Login Response Status: {response.status_code}")
    print(f"API Login Response Body: {response.data}")

if __name__ == '__main__':
    check_login()
