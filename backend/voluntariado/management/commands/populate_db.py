import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.models import User
from voluntariado.models import Pedania, Anuncio, Perfil
from faker import Faker

class Command(BaseCommand):
    help = 'Poblar la base de datos con datos de prueba'

    def handle(self, *args, **kwargs):
        fake = Faker('es_ES')

        # 1. Crear pedanias si no existen
        pedanias_names = [
            "Mazarrón", "Puerto de Mazarrón", "Bolnuevo", "Cañada de Gallego", 
            "Pastrana", "Saladillo", "Ifre-Cañada de Gallego", "Leiva", 
            "La Majada", "Gañuelas", "Garrobo", "Balsicas", "Atalaya"
        ]
        
        pedanias = []
        for name in pedanias_names:
            pedania, created = Pedania.objects.get_or_create(nombre=name)
            pedanias.append(pedania)
        
        self.stdout.write(self.style.SUCCESS(f'Checked/Created {len(pedanias)} Pedanías.'))

        # 2. Crear usuarios para ser autores de anuncios
        users = []
        for _ in range(5):
            username = fake.user_name()
            # Asegurar nombre de usuario unico
            while User.objects.filter(username=username).exists():
                username = fake.user_name() + str(random.randint(1, 999))
                
            user = User.objects.create_user(
                username=username,
                email=fake.email(),
                password='password123',
                first_name=fake.first_name(),
                last_name=fake.last_name()
            )
            # Crear perfil para el usuario
            Perfil.objects.create(
                user=user,
                rol=random.choice(['voluntario', 'organizacion']),
                telefono=fake.phone_number()[:15],
                fecha_nacimiento=fake.date_of_birth(minimum_age=18, maximum_age=80),
                nombre_entidad=fake.company() if random.choice([True, False]) else None
            )
            users.append(user)
        
        # Asegurar que haya usuarios disponibles
        if not users and User.objects.exists():
            users = list(User.objects.all())

        self.stdout.write(self.style.SUCCESS(f'Created/Loaded {len(users)} Users.'))

        # 3. Crear al menos 1 actividad FUTURA por pedania
        for pedania in pedanias:
            Anuncio.objects.create(
                titulo=fake.sentence(nb_words=6),
                descripcion=fake.paragraph(nb_sentences=5),
                fecha_evento=timezone.now() + timedelta(days=random.randint(1, 60)),
                etiqueta=random.choice(['medio_ambiente', 'educacion', 'salud', 'comunidad', 'animales']),
                estado='publicado',
                cupo_maximo=random.randint(5, 50),
                pedanias=pedania, # Assign specific pedania
                usuario=random.choice(users),
            )
        
        # Anadir algunas mas aleatorias
        for _ in range(5):
             Anuncio.objects.create(
                titulo=fake.sentence(nb_words=6),
                descripcion=fake.paragraph(nb_sentences=5),
                fecha_evento=timezone.now() + timedelta(days=random.randint(1, 60)),
                etiqueta=random.choice(['medio_ambiente', 'educacion', 'salud', 'comunidad', 'animales']),
                estado='publicado',
                cupo_maximo=random.randint(5, 50),
                pedanias=random.choice(pedanias),
                usuario=random.choice(users),
            )

        self.stdout.write(self.style.SUCCESS(f'Created {len(pedanias) + 5} Future Activities (1 per Pedania + 5 random).'))

        # 4. Crear 5 actividades PASADAS (Noticias)
        for _ in range(5):
             Anuncio.objects.create(
                titulo=fake.sentence(nb_words=6),
                descripcion=fake.paragraph(nb_sentences=5),
                fecha_evento=timezone.now() - timedelta(days=random.randint(1, 60)), # Past date
                etiqueta=random.choice(['medio_ambiente', 'educacion', 'salud', 'comunidad']),
                estado='finalizado', # Marked as finished
                cupo_maximo=random.randint(5, 50),
                pedanias=random.choice(pedanias),
                usuario=random.choice(users),
            )

        self.stdout.write(self.style.SUCCESS('Created 5 Past Activities (News).'))
