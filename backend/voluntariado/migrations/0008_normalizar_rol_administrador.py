"""
Migración de datos para normalizar el valor del rol 'Administrador' a minúsculas.

Antes de esta migración, el choice de administrador se almacenaba como 'Administrador'
(con mayúscula inicial). Se unifica a 'administrador' para ser consistente con los
demás valores ('voluntario', 'organizacion') y evitar errores sutiles al comparar
con .lower().
"""
from django.db import migrations, models


def normalizar_rol_administrador(apps, schema_editor):
    """
    Actualiza todos los perfiles con rol 'Administrador' a 'administrador'.

    Parameters:
        apps: Registro de aplicaciones de Django para la migración.
        schema_editor: Editor de esquema de la base de datos.
    """
    Perfil = apps.get_model('voluntariado', 'Perfil')
    actualizados = Perfil.objects.filter(rol='Administrador').update(rol='administrador')
    if actualizados:
        print(f"  Normalizados {actualizados} perfil(es) de 'Administrador' a 'administrador'")


def revertir_rol_administrador(apps, schema_editor):
    """
    Revierte la normalización del rol en caso de deshacer la migración.

    Parameters:
        apps: Registro de aplicaciones de Django para la migración.
        schema_editor: Editor de esquema de la base de datos.
    """
    Perfil = apps.get_model('voluntariado', 'Perfil')
    Perfil.objects.filter(rol='administrador').update(rol='Administrador')


class Migration(migrations.Migration):

    dependencies = [
        ('voluntariado', '0007_alter_anuncio_estado'),
    ]

    operations = [
        migrations.AlterField(
            model_name='perfil',
            name='rol',
            field=models.CharField(
                choices=[
                    ('voluntario', 'Voluntario'),
                    ('organizacion', 'Organizacion / Entidad'),
                    ('administrador', 'Administrador de la plataforma'),
                ],
                default='voluntario',
                max_length=20,
            ),
        ),
        migrations.RunPython(
            normalizar_rol_administrador,
            revertir_rol_administrador,
        ),
    ]
