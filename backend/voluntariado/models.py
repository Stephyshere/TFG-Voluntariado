from django.db import models
from django.contrib.auth.models import User

class Perfil(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')

    ROLES = [       
        ('voluntario', 'Voluntario'),
        ('organizacion', 'Organizacion / Entidad'),
        ('Administrador', 'Administrador de la plataforma'),
        
    ]

    rol = models.CharField(max_length=20, choices=ROLES, default='voluntario')
    telefono = models.CharField(max_length=15, blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    foto = models.ImageField(upload_to='fotos_perfil/', blank=True, null=True)
    nombre_entidad = models.CharField(max_length=100, blank=True, null=True, help_text="Rellenar solo si es organización (ej: Cruz Roja)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Perfil"
        verbose_name_plural = "Perfiles"

    def __str__(self):
        return f"{self.user.username} - {self.rol}"
    
    @property
    def asistencias_confirmadas(self):
        """Retorna el número de inscripciones donde el usuario ha asistido."""
        return self.user.inscripciones_realizadas.filter(asistido=True).count()

    @property
    def marco(self):
        """Retorna el tipo de marco basado en el rol y asistencias."""
        if self.rol == 'organizacion':
            return 'organizacion'
        
        count = self.asistencias_confirmadas
        if count >= 16:
            return 'oro'
        elif count >= 5:
            return 'plata'
        elif count >= 1:
            return 'bronce'
        return 'ninguno'
    

class Pedania(models.Model):


    nombre = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Pedanía"
        verbose_name_plural = "Pedanías"

    def __str__(self):
        return self.nombre

class Anuncio(models.Model):

    ETIQUETAS = [
        ('medio_ambiente', 'Medio Ambiente'),
        ('educacion', 'Educación'),
        ('salud', 'Salud'),
        ('comunidad', 'Comunidad'),
        ('animales', 'Animales'),
        ('otros', 'Otros'),]

    # Los borradores no se muestran publicamente
    ESTADO = [  
        ('borrador', 'Borrador'),
        ('publicado', 'Publicado'),
        ('en_curso', 'En Curso'),
        ('finalizado', 'Finalizado'),
        ('cancelado', 'Cancelado'),
    ]

    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='anuncios/', blank=True, null=True)

    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    fecha_evento = models.DateTimeField()

    etiqueta = models.CharField(max_length=50, choices=ETIQUETAS, default='otros')
    estado = models.CharField(max_length=20, choices=ESTADO, default='borrador')

    cupo_maximo = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    # Campos para la "Noticia" una vez finalizada
    noticia_resumen = models.TextField(blank=True, null=True, help_text="Resumen de lo logrado en la actividad")
    noticia_imagen = models.ImageField(upload_to='noticias/', blank=True, null=True, help_text="Imagen opcional para la noticia")

    requerimientos = models.TextField(blank=True, null=True, help_text="Requisitos para participar (ej: traer agua, guantes, mayor de edad...)")


    pedanias = models.ForeignKey(Pedania, on_delete=models.CASCADE, related_name='anuncios')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='anuncios_creados')

    class Meta:
        verbose_name = "Anuncio"
        verbose_name_plural = "Anuncios"
    
    def __str__(self): 
        return self.titulo
        
    @property
    def plazas_disponibles(self):
        if self.cupo_maximo > 0:
            return max(0, self.cupo_maximo - self.inscripciones.count())
        return 999  # Ilimitado o valor grande por defecto
    
class Inscripcion(models.Model):

    anuncio = models.ForeignKey(Anuncio, on_delete=models.CASCADE, related_name='inscripciones')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inscripciones_realizadas')
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)
    asistido = models.BooleanField(default=False)

    # Clase "Meta" para definir restricciones únicas y que no se pueda inscribir un usuario más de una vez al mismo anuncio
    class Meta:
        unique_together = ('anuncio', 'usuario')
        verbose_name = "Inscripción"
        verbose_name_plural = "Inscripciones"

    def __str__(self):
        return f"Inscripción de {self.usuario.username} en {self.anuncio.titulo}"
    
class Comentario(models.Model):

    # Comentarios que se podrán poner en los anuncios
    anuncio = models.ForeignKey(Anuncio, on_delete=models.CASCADE, related_name='comentarios')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comentarios_realizados')
    contenido = models.TextField()
    fecha_comentario = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Comentario"
        verbose_name_plural = "Comentarios"

    def __str__(self):
        return f"Comentario de {self.usuario.username} en {self.anuncio.titulo}"
    
class Patrocinadores(models.Model):

    nombre = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to='patrocinadores/', blank=True, null=True)
    sitio_web = models.URLField(blank=True, null=True, help_text="Link a la web del patrocinador")
    anuncios = models.ManyToManyField('Anuncio', related_name='patrocinadores', blank=True)

    class Meta:
        verbose_name = "Patrocinador"
        verbose_name_plural = "Patrocinadores"

