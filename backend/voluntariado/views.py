from django.db.models import QuerySet, Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.serializers import Serializer
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from .models import Pedania, Anuncio, Inscripcion, Comentario, Perfil, Patrocinadores
from .serializers import PedaniaSerializer, AnuncioSerializer, InscripcionSerializer, ComentarioSerializer, PerfilSerializer, UserSerializer, PatrocinadoresSerializer
from .permissions import IsOrganizacionOrAdmin, IsOwnerOrAdmin
from .utils import (
    send_welcome_email,
    send_inscription_email,
    send_password_reset_email,
    send_attendance_email
)
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate


class PedaniaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Pedania.

    Permite la lectura pública de las pedanías de Mazarrón,
    mientras que las operaciones de escritura requieren autenticación.
    """
    queryset: QuerySet[Pedania] = Pedania.objects.all()
    serializer_class = PedaniaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class AnuncioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los Anuncios de actividades y noticias.

    Solo las organizaciones y administradores pueden crear o editar anuncios.
    Los borradores se ocultan dinámicamente según los permisos del usuario.
    """
    serializer_class = AnuncioSerializer
    permission_classes = [IsOrganizacionOrAdmin, IsOwnerOrAdmin]

    def get_queryset(self) -> QuerySet[Anuncio]:
        """
        Obtiene el conjunto de anuncios filtrado según el rol y la propiedad de los borradores.

        Los administradores pueden ver todos los anuncios (incluyendo borradores).
        Las organizaciones pueden ver anuncios que no sean borradores, además de sus propios borradores.
        Los voluntarios y usuarios anónimos únicamente pueden visualizar anuncios publicados, en curso,
        finalizados o cancelados (no borradores).

        Returns:
            QuerySet[Anuncio]: Conjunto de anuncios que el usuario actual está autorizado a visualizar.
        """
        user = self.request.user

        # Si el usuario no está autenticado, solo ve anuncios que no sean borradores
        if not user or user.is_anonymous:
            return Anuncio.objects.exclude(estado='borrador')

        # Los administradores tienen acceso a la totalidad de los anuncios
        if user.is_staff or getattr(getattr(user, 'perfil', None), 'rol', '').lower() == 'administrador':
            return Anuncio.objects.all()

        # Las organizaciones ven todos los anuncios que no sean borradores más sus propios borradores
        if getattr(getattr(user, 'perfil', None), 'rol', '').lower() in ['organización', 'organizacion']:
            return Anuncio.objects.filter(Q(usuario=user) | ~Q(estado='borrador'))

        # Los voluntarios únicamente pueden ver anuncios que no sean borradores
        return Anuncio.objects.exclude(estado='borrador')

    def perform_create(self, serializer: Serializer) -> None:
        """
        Guarda un nuevo anuncio asociándolo al usuario autenticado actual.

        Parameters:
            serializer (Serializer): Serializador del anuncio con los datos validados.
        """
        serializer.save(usuario=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsOwnerOrAdmin])
    def pasar_lista(self, request: Request, pk: str = None) -> Response:
        """
        Registra la asistencia de los voluntarios inscritos en la actividad.

        Identifica a los nuevos asistentes y les envía un correo electrónico de agradecimiento,
        evitando envíos duplicados si se vuelve a guardar la misma lista de asistencia.

        Parameters:
            request (Request): Solicitud HTTP con la lista 'inscripciones_ids'.
            pk (str, optional): Clave primaria de la actividad/anuncio.

        Returns:
            Response: Objeto de respuesta JSON confirmando la actualización.
        """
        anuncio = self.get_object()
        inscripciones_ids = request.data.get('inscripciones_ids', [])

        # Obtenemos de forma proactiva las inscripciones que van a ser marcadas
        # como asistidas pero que aún no tenían dicho estado activo. Esto previene
        # el envío redundante de correos si el organizador realiza modificaciones.
        nuevos_asistentes = list(
            anuncio.inscripciones.filter(
                id__in=inscripciones_ids,
                asistido=False
            ).select_related('usuario')
        )

        # Actualizamos masivamente el estado de asistencia de todas las inscripciones
        anuncio.inscripciones.update(asistido=False)
        anuncio.inscripciones.filter(id__in=inscripciones_ids).update(asistido=True)

        # Notificamos por correo a cada voluntario cuya asistencia ha sido confirmada
        for inscripcion in nuevos_asistentes:
            if inscripcion.usuario.email:
                send_attendance_email(
                    user_email=inscripcion.usuario.email,
                    username=inscripcion.usuario.username,
                    anuncio=anuncio
                )

        return Response({'mensaje': 'Asistencia actualizada correctamente'})


class InscripcionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las Inscripciones a actividades de voluntariado.

    Las operaciones requieren autenticación. Las inscripciones visibles varían
    según el rol (los voluntarios ven las suyas, las organizaciones las de sus anuncios,
    y los administradores ven todas).
    """
    serializer_class = InscripcionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> QuerySet[Inscripcion]:
        """
        Filtra las inscripciones según el rol del usuario autenticado y filtros opcionales.

        Permite filtrar opcionalmente por la clave del anuncio mediante el parámetro 'anuncio'.

        Returns:
            QuerySet[Inscripcion]: Conjunto de inscripciones permitidas para el usuario.
        """
        user = self.request.user
        queryset = Inscripcion.objects.all()
        
        # Filtro opcional por anuncio
        anuncio_id = self.request.query_params.get('anuncio')
        if anuncio_id is not None:
            queryset = queryset.filter(anuncio=anuncio_id)

        if user.is_staff or getattr(getattr(user, 'perfil', None), 'rol', '').lower() == 'administrador':
            return queryset
            
        # Si es organizacion, puede ver las inscripciones de sus propios anuncios
        if getattr(getattr(user, 'perfil', None), 'rol', '').lower() in ['organización', 'organizacion']:
            return queryset.filter(Q(usuario=user) | Q(anuncio__usuario=user))
            
        return queryset.filter(usuario=user)

    def perform_create(self, serializer: Serializer) -> None:
        """
        Registra una nueva inscripción para el usuario autenticado actual
        y envía una notificación por correo electrónico.

        Parameters:
            serializer (Serializer): Serializador con los datos de inscripción validados.
        """
        inscripcion = serializer.save(usuario=self.request.user)
        if inscripcion.usuario.email:
            send_inscription_email(inscripcion.usuario.email, inscripcion.usuario.username, inscripcion.anuncio)


class ComentarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los comentarios en anuncios.

    La lectura es pública y la escritura requiere autenticación.
    """
    serializer_class = ComentarioSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self) -> QuerySet[Comentario]:
        """
        Filtra los comentarios según el anuncio especificado en los parámetros.

        Returns:
            QuerySet[Comentario]: Conjunto de comentarios filtrados.
        """
        queryset = Comentario.objects.all()
        anuncio_id = self.request.query_params.get('anuncio')
        if anuncio_id is not None:
            queryset = queryset.filter(anuncio=anuncio_id)
        return queryset

    def perform_create(self, serializer: Serializer) -> None:
        """
        Crea un nuevo comentario asociado al usuario autenticado actual.

        Parameters:
            serializer (Serializer): Serializador con los datos validados del comentario.
        """
        serializer.save(usuario=self.request.user)


class PerfilViewSet(viewsets.ModelViewSet):
    """
    ViewSet para ver perfiles de usuarios.

    Requiere estar autenticado en la plataforma.
    """
    queryset: QuerySet[Perfil] = Perfil.objects.all()
    serializer_class = PerfilSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> QuerySet[Perfil]:
        """
        Retorna la lista de todos los perfiles de la plataforma.

        Returns:
            QuerySet[Perfil]: Todos los perfiles registrados.
        """
        return Perfil.objects.all()


class LoginView(APIView):
    """
    Vista personalizada de login que reemplaza a obtain_auth_token.

    Se establece authentication_classes=[] para evitar que SessionAuthentication
    exija un token CSRF cuando el navegador tiene una cookie de sesion activa
    (por ejemplo, tras visitar /admin/). Esto elimina el error intermitente
    de 'CSRF token missing' que bloqueaba el login desde el frontend React.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        """
        Autentica al usuario y retorna su token de acceso.

        Parameters:
            request (Request): Peticion HTTP con 'username' y 'password' en el body.

        Returns:
            Response: Token de acceso si las credenciales son validas, o error 400.
        """
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'non_field_errors': ['Debes proporcionar usuario y contrasena.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request=request, username=username, password=password)

        if user is None:
            return Response(
                {'non_field_errors': ['No se ha podido iniciar sesion con las credenciales proporcionadas.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        token, _created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})


class RegisterView(APIView):
    """
    Vista de registro de nuevos usuarios voluntarios.

    Se establece authentication_classes=[] para evitar que SessionAuthentication
    exija un token CSRF en esta vista publica accesible sin autenticacion.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        """
        Registra a un nuevo usuario voluntario y genera su token de acceso.

        Parameters:
            request (Request): Petición con los datos del usuario en el body.

        Returns:
            Response: Token del usuario y sus datos si el registro es exitoso.
        """
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            password = request.data.get('password')
            if not password:
                return Response({'password': ['Este campo es obligatorio.']}, status=status.HTTP_400_BAD_REQUEST)
                
            user = serializer.save()
            user.set_password(password)
            user.save()
            
            # Crear perfil automáticamente usando el valor correcto del choice ('voluntario')
            Perfil.objects.create(user=user, rol='voluntario') 
            
            # Generar token real
            token, _created = Token.objects.get_or_create(user=user)
            
            if user.email:
                send_welcome_email(user.email, user.username, is_organization=False)
            
            return Response({'token': token.key, 'user': serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    """
    Vista para recuperar o actualizar la información del perfil del usuario autenticado actual.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        """
        Retorna la información del perfil del usuario autenticado actual.

        Parameters:
            request (Request): Petición HTTP GET.

        Returns:
            Response: Datos del perfil del usuario.
        """
        perfil, _created = Perfil.objects.get_or_create(user=request.user)
        serializer = PerfilSerializer(perfil, context={'request': request})
        return Response(serializer.data)

    def put(self, request: Request) -> Response:
        """
        Actualiza parcialmente el perfil o el usuario base autenticado actual.

        Parameters:
            request (Request): Petición HTTP PUT con los datos a actualizar.

        Returns:
            Response: Datos actualizados del perfil, o errores de validación.
        """
        perfil, _created = Perfil.objects.get_or_create(user=request.user)
        user = request.user
        data = request.data

        # 1. Actualizar datos del Usuario
        user_serializer = UserSerializer(user, data=data, partial=True)
        if not user_serializer.is_valid():
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user_serializer.save()

        # 2. Actualizar datos del Perfil
        serializer = PerfilSerializer(perfil, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CrearOrganizacionView(APIView):
    """
    Vista para que los administradores creen nuevos usuarios de tipo Organización.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        """
        Valida los permisos del administrador y registra la nueva organización.

        Parameters:
            request (Request): Petición POST con los datos del nuevo usuario organizativo.

        Returns:
            Response: Mensaje de éxito y datos del usuario creado, o error de permisos o validación.
        """
        is_admin = bool(request.user and request.user.is_authenticated and 
                        (request.user.is_staff or getattr(getattr(request.user, 'perfil', None), 'rol', '').lower() == 'administrador'))
        if not is_admin:
            return Response({'error': 'No tienes permisos para crear una organización'}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            if 'password' in data:
                user.set_password(data['password'])
            else:
                user.set_password('voluntariado2024')
            user.save()
            
            # Crear perfil automáticamente
            Perfil.objects.create(
                user=user, 
                rol='organizacion',
                nombre_entidad=data.get('nombre_entidad', '')
            )
            
            if user.email:
                send_welcome_email(user.email, user.username, is_organization=True)
                
            return Response({'mensaje': 'Organización creada exitosamente', 'user': serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatrocinadorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la administración de Patrocinadores.

    Los administradores pueden realizar cualquier operación. La lectura es pública.
    """
    queryset: QuerySet[Patrocinadores] = Patrocinadores.objects.all()
    serializer_class = PatrocinadoresSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class GlobalSearchView(APIView):
    """
    Endpoint para realizar una búsqueda global en múltiples modelos.

    Busca en Anuncios (actividades y noticias) y en Perfiles de la comunidad.
    """
    def get(self, request: Request) -> Response:
        """
        Ejecuta la consulta de búsqueda contra los modelos Anuncio y Perfil.

        Parameters:
            request (Request): Petición GET con el parámetro 'q' de consulta.

        Returns:
            Response: Lista con un máximo de 5 resultados por tipo de coincidencia.
        """
        query = request.query_params.get('q', '')
        if not query or len(query) < 2:
            return Response({'results': []})

        results = []

        # 1. Buscar en Anuncios (Actividades y Noticias)
        anuncios = Anuncio.objects.filter(
            Q(titulo__icontains=query) | 
            Q(descripcion__icontains=query) |
            Q(etiqueta__icontains=query) |
            Q(pedanias__nombre__icontains=query)
        ).filter(estado__in=['publicado', 'finalizado'])[:5]

        for a in anuncios:
            is_news = a.estado == 'finalizado' or a.fecha_evento < timezone.now()
            
            results.append({
                'id': a.id,
                'type': 'noticia' if is_news else 'actividad',
                'title': a.titulo,
                'subtitle': f"{a.pedanias.nombre} | {a.fecha_evento.strftime('%d/%m/%Y')}",
                'image': a.imagen.url if a.imagen else None,
                'url': f"/actividades/{a.id}"
            })

        # 2. Buscar en Perfiles (Organizaciones y Voluntarios)
        perfiles = Perfil.objects.filter(
            Q(nombre_entidad__icontains=query) | 
            Q(user__username__icontains=query) |
            Q(user__first_name__icontains=query) |
            Q(user__last_name__icontains=query) |
            Q(rol__icontains=query)
        )[:5]

        for p in perfiles:
            results.append({
                'id': p.id,
                'type': 'organizacion' if p.rol == 'organizacion' else 'voluntario',
                'title': p.nombre_entidad if p.rol == 'organizacion' else f"{p.user.first_name} {p.user.last_name}".strip() or p.user.username,
                'subtitle': p.rol.capitalize(),
                'image': p.foto.url if p.foto else None,
                'url': "/perfil" if p.user == request.user else f"/perfil/{p.id}"
            })

        return Response({'results': results})


class PasswordResetRequestView(APIView):
    """
    Vista para solicitar el envío de un correo de recuperación de contraseña.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        """
        Recibe el correo y genera un token único y seguro para restablecer el acceso.

        Parameters:
            request (Request): Petición POST con el campo 'email'.

        Returns:
            Response: Mensaje informativo confirmando el envío de ser registrado el email.
        """
        email = request.data.get('email')
        if email:
            user = User.objects.filter(email=email).first()
            if user:
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
                reset_url = f"{frontend_url}/reset-password/{uidb64}/{token}/"
                send_password_reset_email(user.email, user.first_name or user.username, reset_url)
        return Response({'mensaje': 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.'})


class PasswordResetConfirmView(APIView):
    """
    Vista para confirmar el cambio de contraseña usando el token de recuperación seguro.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        """
        Verifica el token y la expiración y actualiza la contraseña del usuario.

        Parameters:
            request (Request): Petición con 'uidb64', 'token' y 'password' en el body.

        Returns:
            Response: Confirmación del cambio de clave, o error de validación/token inválido.
        """
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        password = request.data.get('password')

        if not (uidb64 and token and password):
            return Response({'error': 'Faltan datos requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(password)
            user.save()
            return Response({'mensaje': 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'})
        else:
            return Response({'error': 'El enlace de recuperación es inválido o ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)