import os
import django

# Configurar el entorno de Django antes de importar modelos
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from voluntariado.models import Perfil, Anuncio, Pedania
from django.utils import timezone
from datetime import timedelta

User.objects.filter(username='teamtfg').delete()

org_user = User.objects.create_user(username='teamtfg', email='team@tfg.com', password='teamtfg123', first_name='Team', last_name='TFG')
Perfil.objects.create(user=org_user, rol='organizacion', nombre_entidad='TeamTFG')

pedania = Pedania.objects.first()
if not pedania:
    pedania = Pedania.objects.create(nombre='Mazarrón')

Anuncio.objects.create(
    titulo='defensa TFG',
    descripcion='Defensa final del proyecto.',
    cupo_maximo=10,
    usuario=org_user,
    pedanias=pedania,
    fecha_evento=timezone.now() + timedelta(days=7),
    estado='publicado'
)

print("Organización TeamTFG y actividad 'defensa TFG' creadas exitosamente.")
