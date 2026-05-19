import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from voluntariado.models import Perfil

# Eliminar organizaciones existentes
org_profiles = Perfil.objects.filter(rol='organizacion')
count = 0
for p in org_profiles:
    if p.user:
        p.user.delete()
        count += 1
print(f"Se eliminaron {count} organizaciones existentes.")

# Crear una nueva organizacion de prueba
username = 'org_test'
password = 'password123'
try:
    user = User.objects.get(username=username)
    user.delete()
except User.DoesNotExist:
    pass

user = User.objects.create_user(username=username, email='org@test.com', password=password)
profile, created = Perfil.objects.get_or_create(user=user)
profile.rol = 'organizacion'
profile.nombre_entidad = 'Organización de Prueba'
profile.save()

print(f"Organizacion creada: {username} / {password}")
