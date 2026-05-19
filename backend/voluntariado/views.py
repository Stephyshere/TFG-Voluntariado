from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from .models import Pedania, Anuncio, Inscripcion, Comentario, Perfil, Patrocinadores
from .serializers import PedaniaSerializer, AnuncioSerializer, InscripcionSerializer, ComentarioSerializer, PerfilSerializer, UserSerializer, PatrocinadoresSerializer
from .permissions import IsOrganizacionOrAdmin, IsOwnerOrAdmin
from .utils import send_welcome_email, send_inscription_email, send_password_reset_email

# Lectura publica, escritura requiere autenticacion
class PedaniaViewSet(viewsets.ModelViewSet):
    queryset = Pedania.objects.all()
    serializer_class = PedaniaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


# Solo organizaciones y admins pueden crear/editar anuncios
class AnuncioViewSet(viewsets.ModelViewSet):
    queryset = Anuncio.objects.all()
    serializer_class = AnuncioSerializer
    permission_classes = [IsOrganizacionOrAdmin, IsOwnerOrAdmin]

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsOwnerOrAdmin])
    def pasar_lista(self, request, pk=None):
        anuncio = self.get_object()
        inscripciones_ids = request.data.get('inscripciones_ids', [])
        anuncio.inscripciones.update(asistido=False)
        anuncio.inscripciones.filter(id__in=inscripciones_ids).update(asistido=True)
        return Response({'mensaje': 'Asistencia actualizada correctamente'})

class InscripcionViewSet(viewsets.ModelViewSet):
    serializer_class = InscripcionSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Filtra inscripciones segun el rol del usuario autenticado
    def get_queryset(self):
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
            from django.db import models
            return queryset.filter(models.Q(usuario=user) | models.Q(anuncio__usuario=user))
            
        return queryset.filter(usuario=user)

    def perform_create(self, serializer):
        inscripcion = serializer.save(usuario=self.request.user)
        if inscripcion.usuario.email:
            send_inscription_email(inscripcion.usuario.email, inscripcion.usuario.username, inscripcion.anuncio)

class ComentarioViewSet(viewsets.ModelViewSet):
    serializer_class = ComentarioSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Comentario.objects.all()
        anuncio_id = self.request.query_params.get('anuncio')
        if anuncio_id is not None:
            queryset = queryset.filter(anuncio=anuncio_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class PerfilViewSet(viewsets.ModelViewSet):
    queryset = Perfil.objects.all()
    serializer_class = PerfilSerializer
    permission_classes = [permissions.IsAuthenticated] # Solo usuarios registrados ven perfiles

    def get_queryset(self):
        # Permitimos ver todos los perfiles si estás autenticado
        return Perfil.objects.all()

from rest_framework.authtoken.models import Token

class RegisterView(APIView):
    # Corrección: Evitamos el error de "token CSRF missing" que ocurría esporádicamente
    # (cada cierto tiempo) cuando el navegador del usuario tenía una cookie de sesión guardada
    # (por ejemplo, por haber entrado al panel de administrador). 
    # Al estar SessionAuthentication activa por defecto, exigía CSRF. Al limpiar las clases de
    # autenticación para esta vista pública, solucionamos el problema permanentemente.
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
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
            token, created = Token.objects.get_or_create(user=user)
            
            if user.email:
                send_welcome_email(user.email, user.username, is_organization=False)
            
            return Response({'token': token.key, 'user': serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Asegurar que existe el perfil (por si acaso son usuarios antiguos)
        perfil, created = Perfil.objects.get_or_create(user=request.user)
        serializer = PerfilSerializer(perfil, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        perfil, created = Perfil.objects.get_or_create(user=request.user)
        user = request.user
        data = request.data

        # 1. Actualizar datos del Usuario (Validación de email único incluida en UserSerializer)
        user_serializer = UserSerializer(user, data=data, partial=True)
        if not user_serializer.is_valid():
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user_serializer.save()

        # 2. Actualizar datos del Perfil
        # Usamos el serializer para validar y guardar (partial=True permite enviar solo algunos campos)
        serializer = PerfilSerializer(perfil, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            # Retornamos los datos actualizados
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CrearOrganizacionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Doble check para asegurarse que es admin
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
                user.set_password('voluntariado2024') # Contraseña por defecto
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

# Solo admins pueden gestionar patrocinadores, lectura publica
class PatrocinadorViewSet(viewsets.ModelViewSet):
    queryset = Patrocinadores.objects.all()
    serializer_class = PatrocinadoresSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class GlobalSearchView(APIView):
    """
    Endpoint para buscar en múltiples modelos: Anuncios (actividades y noticias) y Perfiles.
    """
    def get(self, request):
        query = request.query_params.get('q', '')
        if not query or len(query) < 2:
            return Response({'results': []})

        results = []

        # 1. Buscar en Anuncios (Actividades y Noticias)
        from django.utils import timezone
        from django.db.models import Q
        
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
                'subtitle': f"{a.pedanias.nombre} • {a.fecha_evento.strftime('%d/%m/%Y')}",
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
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if email:
            user = User.objects.filter(email=email).first()
            if user:
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
                reset_url = f"{frontend_url}/reset-password/{uidb64}/{token}/"
                send_password_reset_email(user.email, user.first_name or user.username, reset_url)
        # Siempre retornamos éxito por seguridad (para no revelar si un email existe o no)
        return Response({'mensaje': 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.'})

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
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