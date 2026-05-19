import os
import django
from rest_framework.test import APIClient
from django.contrib.auth.models import User

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_login():
    username = 'admin'
    password = 'admin123'
    
    print(f"Testing login for user: {username}")
    
    # 1. Comprobar si el usuario existe y la contraseña es correcta internamente
    try:
        user = User.objects.get(username=username)
        print(f"Usuario encontrado: {user}")
        if user.check_password(password):
            print("Verificacion de contraseña correcta.")
        else:
            print("Verificacion de contraseña FALLIDA.")
            # Reinicio forzado para asegurar
            user.set_password(password)
            user.save()
            print("Contraseña restablecida forzosamente.")
    except User.DoesNotExist:
        print("El usuario no existe.")
        return

    # 2. Simular una peticion a la API
    from rest_framework.authtoken.models import Token
    token, _ = Token.objects.get_or_create(user=user)
    print(f"Token del usuario: {token.key}")

if __name__ == '__main__':
    test_login()
