from django.db import models
from django.contrib.auth.models import User


class Perfil(models.Model):
    """
    Representa el perfil extendido de un voluntario, organización o administrador.

    Contiene información adicional que complementa el modelo User de Django.
    """

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

    def __str__(self) -> str:
        """
        Retorna la representación legible del perfil.

        Returns:
            str: Nombre de usuario seguido de su rol.
        """
        return f"{self.user.username} - {self.rol}"
    
    @property
    def asistencias_confirmadas(self) -> int:
        """
        Obtiene el número de inscripciones en las que el usuario ha asistido.

        Returns:
            int: Cantidad de asistencias marcadas como verdaderas.
        """
        return self.user.inscripciones_realizadas.filter(asistido=True).count()

    @property
    def marco(self) -> str:
        """
        Retorna la insignia o tipo de marco del usuario basado en sus asistencias.

        Las organizaciones tienen la insignia 'organizacion'. Los voluntarios ganan
        bronce (1 a 4), plata (5 a 15) u oro (16 o más asistencias confirmadas).

        Returns:
            str: Nombre de la medalla o rango ('ninguno', 'bronce', 'plata', 'oro', 'organizacion').
        """
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
    """
    Representa una división administrativa territorial o pedanía de Mazarrón.
    """

    nombre = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Pedanía"
        verbose_name_plural = "Pedanías"

    def __str__(self) -> str:
        """
        Retorna el nombre de la pedanía.

        Returns:
            str: Nombre de la pedanía.
        """
        return self.nombre


class Anuncio(models.Model):
    """
    Modelo nuclear de la aplicación. Representa tanto actividades de voluntariado
    activas como noticias/reseñas sobre eventos finalizados.
    """

    ETIQUETAS = [
        ('medio_ambiente', 'Medio Ambiente'),
        ('educacion', 'Educación'),
        ('salud', 'Salud'),
        ('comunidad', 'Comunidad'),
        ('animales', 'Animales'),
        ('otros', 'Otros'),
    ]

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

    noticia_resumen = models.TextField(blank=True, null=True, help_text="Resumen de lo logrado en la actividad")
    noticia_imagen = models.ImageField(upload_to='noticias/', blank=True, null=True, help_text="Imagen opcional para la noticia")

    requerimientos = models.TextField(blank=True, null=True, help_text="Requisitos para participar (ej: traer agua, guantes, mayor de edad...)")

    pedanias = models.ForeignKey(Pedania, on_delete=models.CASCADE, related_name='anuncios')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='anuncios_creados')

    class Meta:
        verbose_name = "Anuncio"
        verbose_name_plural = "Anuncios"
    
    def __str__(self) -> str: 
        """
        Retorna el título del anuncio.

        Returns:
            str: Título de la actividad.
        """
        return self.titulo
        
    @property
    def plazas_disponibles(self) -> int:
        """
        Calcula de forma dinámica las plazas libres que restan para la actividad.

        Returns:
            int: Cantidad de vacantes libres, o 999 si no hay cupo máximo.
        """
        if self.cupo_maximo > 0:
            return max(0, self.cupo_maximo - self.inscripciones.count())
        return 999
    

class Inscripcion(models.Model):
    """
    Registra la postulación o inscripción de un voluntario en una actividad.
    """

    anuncio = models.ForeignKey(Anuncio, on_delete=models.CASCADE, related_name='inscripciones')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inscripciones_realizadas')
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)
    asistido = models.BooleanField(default=False)

    class Meta:
        unique_together = ('anuncio', 'usuario')
        verbose_name = "Inscripción"
        verbose_name_plural = "Inscripciones"

    def __str__(self) -> str:
        """
        Retorna la representación de la inscripción.

        Returns:
            str: Mensaje descriptivo con el voluntario y el anuncio.
        """
        return f"Inscripción de {self.usuario.username} en {self.anuncio.titulo}"
    

class Comentario(models.Model):
    """
    Representa las opiniones o consultas públicas vertidas por voluntarios en actividades.
    """

    anuncio = models.ForeignKey(Anuncio, on_delete=models.CASCADE, related_name='comentarios')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comentarios_realizados')
    contenido = models.TextField()
    fecha_comentario = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Comentario"
        verbose_name_plural = "Comentarios"

    def __str__(self) -> str:
        """
        Retorna la representación del comentario.

        Returns:
            str: Mensaje descriptivo indicando autor e hilo de la actividad.
        """
        return f"Comentario de {self.usuario.username} en {self.anuncio.titulo}"
    

class Patrocinadores(models.Model):
    """
    Representa a los patrocinadores o entidades colaboradoras de la plataforma.
    """

    nombre = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to='patrocinadores/', blank=True, null=True)
    sitio_web = models.URLField(blank=True, null=True, help_text="Link a la web del patrocinador")
    anuncios = models.ManyToManyField('Anuncio', related_name='patrocinadores', blank=True)

    class Meta:
        verbose_name = "Patrocinador"
        verbose_name_plural = "Patrocinadores"


