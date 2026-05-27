from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from urllib.parse import quote
from datetime import timedelta, timezone as py_timezone
from smtplib import SMTPException
import logging
from .models import Anuncio

# Configuración del registrador de logs para rastrear errores de envío
logger = logging.getLogger(__name__)


def _wrap_email_html(
    title: str,
    preheader: str,
    body_content: str,
    button_text: str = None,
    button_url: str = None
) -> str:
    """
    Envuelve el contenido del correo en una plantilla HTML con el diseño
    y colores de marca de la plataforma (Violeta #7c3aed y Fucsia #d946ef).

    Parameters:
        title (str): Título principal del correo.
        preheader (str): Texto corto de vista previa del correo.
        body_content (str): Contenido principal en formato HTML.
        button_text (str, optional): Texto del botón de llamada a la acción.
        button_url (str, optional): URL del botón de llamada a la acción.

    Returns:
        str: Cadena HTML con la plantilla estructurada completa.
    """
    button_html = ""
    if button_text and button_url:
        button_html = f'''
        <div style="text-align: center; margin: 30px 0;">
            <a href="{button_url}" style="background-color: #7c3aed; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2); font-size: 16px; border: 2px solid #7c3aed; transition: all 0.3s ease;">
                {button_text}
            </a>
        </div>
        '''

    html_template = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td, a {{ font-family: Arial, sans-serif !important; }}
    </style>
    <![endif]-->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f3ff;
            color: #1e1b4b;
            -webkit-font-smoothing: antialiased;
        }}
        table {{
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }}
        img {{
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }}
    </style>
</head>
<body style="background-color: #f5f3ff; font-family: 'Inter', Arial, sans-serif; color: #1e1b4b; margin: 0; padding: 0;">
    <span style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        {preheader}
    </span>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f3ff; padding: 20px 0;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: #7c3aed; padding: 40px 20px; border-bottom: 4px solid #d946ef;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Voluntariado</h1>
                            <p style="color: #ede9fe; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Conectando personas, transformando comunidades</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px; background-color: #ffffff;">
                            <h2 style="color: #7c3aed; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: 700; border-bottom: 2px solid #ede9fe; padding-bottom: 10px;">{title}</h2>
                            <div style="font-size: 16px; line-height: 1.6; color: #374151;">
                                {body_content}
                            </div>
                            {button_html}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #faf5ff; padding: 30px 20px; border-top: 1px solid #f3e8ff;">
                            <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0; line-height: 1.5;">Este es un correo automatico de la plataforma de Voluntariado.</p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; 2026 Voluntariado. Todos los derechos reservados.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'''
    return html_template


def _send_html_email(
    subject: str,
    text_message: str,
    html_message: str,
    recipient_email: str
) -> None:
    """
    Envía de forma segura un correo electrónico con versión de texto plano y HTML.

    Parameters:
        subject (str): Asunto del correo.
        text_message (str): Mensaje en texto plano.
        html_message (str): Mensaje en formato HTML con estilos.
        recipient_email (str): Dirección de correo del destinatario.
    """
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@voluntariado.com')
    try:
        send_mail(
            subject=subject,
            message=text_message,
            from_email=from_email,
            recipient_list=[recipient_email],
            fail_silently=False,
            html_message=html_message
        )
    except (SMTPException, ConnectionError) as e:
        logger.error(
            f"Fallo en la comunicacion con el servidor SMTP al enviar correo a {recipient_email}: {e}"
        )
    except Exception as e:
        logger.error(
            f"Error inesperado al enviar correo a {recipient_email}: {e}"
        )


def send_welcome_email(
    user_email: str,
    username: str,
    is_organization: bool = False
) -> None:
    """
    Envía un correo HTML de bienvenida al usuario u organización tras registrarse.

    Parameters:
        user_email (str): Correo del usuario registrado.
        username (str): Nombre de usuario registrado.
        is_organization (bool): Indica si el perfil es de tipo organizacion.
    """
    if not user_email:
        return

    subject = "¡Bienvenido a Voluntariado!"
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    login_url = f"{frontend_url}/login"

    if is_organization:
        preheader = "Gracias por registrar tu organizacion en nuestra plataforma."
        body_content = f'''
        <p>Hola, <strong>{username}</strong>:</p>
        <p>Te damos la bienvenida a nuestra plataforma de voluntariado. Agradecemos enormemente tu iniciativa al registrar a tu entidad en nuestra comunidad.</p>
        <p>Tu compromiso social y liderazgo son fundamentales para coordinar esfuerzos significativos en nuestras pedanias. A partir de ahora, podras:</p>
        <ul style="padding-left: 20px; color: #4b5563;">
            <li style="margin-bottom: 8px;">Publicar ofertas y convocatorias de actividades de voluntariado.</li>
            <li style="margin-bottom: 8px;">Gestionar de forma integral las inscripciones de las personas voluntarias.</li>
            <li style="margin-bottom: 8px;">Llevar un control en tiempo real de la asistencia y participacion en cada evento.</li>
        </ul>
        <p>Estamos deseando conocer y dar visibilidad a vuestras iniciativas y causas solidarias. ¡Mucho exito!</p>
        '''
        text_message = (
            f"Hola {username},\n\n"
            f"Gracias por registrar tu organizacion en nuestra plataforma. "
            f"¡Esperamos que encuentres muchos voluntarios!\n\n"
            f"Inicia sesion aqui: {login_url}"
        )
    else:
        preheader = "Gracias por registrarte en nuestra plataforma de voluntariado."
        body_content = f'''
        <p>Hola, <strong>{username}</strong>:</p>
        <p>Te damos la bienvenida a nuestra plataforma de voluntariado. Queremos agradecerte sinceramente tu deseo de unirte a esta red solidaria.</p>
        <p>Tu tiempo, empatia y ganas de ayudar son el motor de cambio que nuestras pedanias necesitan para prosperar. Desde tu cuenta podras:</p>
        <ul style="padding-left: 20px; color: #4b5563;">
            <li style="margin-bottom: 8px;">Explorar actividades adaptadas a tus intereses y disponibilidad.</li>
            <li style="margin-bottom: 8px;">Inscribirte en actividades comunitarias de forma rapida y sencilla.</li>
            <li style="margin-bottom: 8px;">Hacer un seguimiento de tus colaboraciones y acumular reconocimientos.</li>
        </ul>
        <p>¡Comienza hoy mismo a explorar actividades y a transformar tu entorno!</p>
        '''
        text_message = (
            f"Hola {username},\n\n"
            f"Gracias por registrarte en nuestra plataforma de voluntariado. "
            f"¡Esperamos que participes en muchas actividades!\n\n"
            f"Inicia sesion aqui: {login_url}"
        )

    html_message = _wrap_email_html(
        title="¡Te damos la bienvenida!",
        preheader=preheader,
        body_content=body_content,
        button_text="Comenzar ahora",
        button_url=login_url
    )

    _send_html_email(subject, text_message, html_message, user_email)


def generate_google_calendar_link(anuncio: Anuncio) -> str:
    """
    Genera un enlace para añadir el evento de la actividad a Google Calendar.

    Parameters:
        anuncio (Anuncio): Instancia del modelo Anuncio/Actividad.

    Returns:
        str: Enlace URL estructurado para Google Calendar.
    """
    # Se convierte la fecha del evento a UTC para evitar desfases horarios
    event_utc = anuncio.fecha_evento.astimezone(py_timezone.utc)
    end_time = event_utc + timedelta(hours=2)

    start_str = event_utc.strftime('%Y%m%dT%H%M%SZ')
    end_str = end_time.strftime('%Y%m%dT%H%M%SZ')

    title = quote(anuncio.titulo)
    description = quote(anuncio.descripcion)
    location = quote(anuncio.pedanias.nombre if anuncio.pedanias else "Desconocido")

    link = (
        f"https://calendar.google.com/calendar/render"
        f"?action=TEMPLATE"
        f"&text={title}"
        f"&dates={start_str}/{end_str}"
        f"&details={description}"
        f"&location={location}"
    )
    return link


def send_inscription_email(
    user_email: str,
    username: str,
    anuncio: Anuncio
) -> None:
    """
    Envía un correo HTML cuando un usuario se inscribe en una actividad,
    incluyendo un botón de atajo para agregarlo a su Google Calendar.

    Parameters:
        user_email (str): Correo del voluntario inscrito.
        username (str): Nombre de usuario del voluntario.
        anuncio (Anuncio): Instancia de la actividad en la que se inscribio.
    """
    if not user_email:
        return

    subject = f"Inscripción confirmada: {anuncio.titulo}"
    calendar_link = generate_google_calendar_link(anuncio)
    fecha_evento_str = anuncio.fecha_evento.strftime("%d/%m/%Y %H:%M")
    pedania_nombre = anuncio.pedanias.nombre if anuncio.pedanias else "Sin ubicacion especifica"
    requerimientos = anuncio.requerimientos if anuncio.requerimientos else "No se requieren requisitos previos."

    body_content = f'''
    <p>Hola, <strong>{username}</strong>:</p>
    <p>Tu inscripcion en la actividad <strong>"{anuncio.titulo}"</strong> ha sido confirmada con éxito. ¡Muchisimas gracias por tu valiosa iniciativa de colaborar!</p>
    <p>A continuacion, te presentamos los detalles clave del evento para tu planificacion:</p>
    
    <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin: 20px 0; font-size: 15px; color: #1e1b4b;">
        <p style="margin: 0 0 10px 0;"><strong>Actividad:</strong> {anuncio.titulo}</p>
        <p style="margin: 0 0 10px 0;"><strong>Fecha y Hora:</strong> {fecha_evento_str}</p>
        <p style="margin: 0 0 10px 0;"><strong>Lugar (Pedania):</strong> {pedania_nombre}</p>
        <p style="margin: 0;"><strong>Requisitos:</strong> {requerimientos}</p>
    </div>

    <p>Para facilitar tu organizacion, puedes usar el boton de abajo para guardar este evento directamente en tu Google Calendar y programar un recordatorio.</p>
    <p>¡Nos vemos pronto en la actividad!</p>
    '''

    text_message = (
        f"Hola {username},\n\n"
        f"Te has inscrito correctamente en la actividad \"{anuncio.titulo}\".\n"
        f"Fecha del evento: {fecha_evento_str}\n"
        f"Lugar: {pedania_nombre}\n\n"
        f"Puedes añadir este evento a tu Google Calendar usando el siguiente enlace:\n"
        f"{calendar_link}\n\n"
        f"¡Gracias por participar!"
    )

    html_message = _wrap_email_html(
        title="Inscripción Confirmada",
        preheader=f"Tu inscripcion para {anuncio.titulo} ha sido registrada.",
        body_content=body_content,
        button_text="Añadir a Google Calendar",
        button_url=calendar_link
    )

    _send_html_email(subject, text_message, html_message, user_email)


def send_password_reset_email(
    user_email: str,
    username: str,
    reset_url: str
) -> None:
    """
    Envía un correo HTML con el enlace seguro para restablecer la contraseña.

    Parameters:
        user_email (str): Correo del usuario solicitante.
        username (str): Nombre del usuario solicitante.
        reset_url (str): Enlace seguro generado para el cambio de contrasenna.
    """
    if not user_email:
        return

    subject = "Restablecer contraseña - Voluntariado"

    body_content = f'''
    <p>Hola, <strong>{username}</strong>:</p>
    <p>Hemos recibido una solicitud para restablecer la contrasena asociada a tu cuenta en la plataforma de Voluntariado.</p>
    <p>Para configurar una nueva clave de acceso, por favor haz clic en el boton que encontraras a continuacion. Por motivos de seguridad, este enlace expirara en unas horas.</p>
    <p>Si tu no has realizado esta solicitud, puedes ignorar este mensaje de forma segura. Tu clave actual permanecera intacta.</p>
    '''

    text_message = (
        f"Hola {username},\n\n"
        f"Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:\n"
        f"{reset_url}\n\n"
        f"Si no has sido tú, ignora este correo."
    )

    html_message = _wrap_email_html(
        title="Recuperar Contraseña",
        preheader="Instrucciones para restablecer tu contrasena de acceso.",
        body_content=body_content,
        button_text="Restablecer contraseña",
        button_url=reset_url
    )

    _send_html_email(subject, text_message, html_message, user_email)


def send_attendance_email(
    user_email: str,
    username: str,
    anuncio: Anuncio
) -> None:
    """
    Envía un correo HTML de agradecimiento a un voluntario cuando se confirma
    su asistencia y participacion activa en una actividad de voluntariado.

    Parameters:
        user_email (str): Correo del voluntario asistente.
        username (str): Nombre de usuario del voluntario.
        anuncio (Anuncio): Instancia de la actividad en la que colaboro.
    """
    if not user_email:
        return

    subject = f"¡Gracias por asistir a {anuncio.titulo}! - Voluntariado"
    fecha_evento_str = anuncio.fecha_evento.strftime("%d/%m/%Y")
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    profile_url = f"{frontend_url}/perfil"

    body_content = f'''
    <p>Hola, <strong>{username}</strong>:</p>
    <p>Queremos expresarte nuestro <strong>agradecimiento mas sincero</strong> por haber asistido y colaborado con entusiasmo en la actividad <strong>"{anuncio.titulo}"</strong> que tuvo lugar el pasado {fecha_evento_str}.</p>
    <p>Tu implicacion activa, tiempo y dedicacion son de un valor incalculable para mejorar el dia a dia de nuestras pedanias. Gracias a personas comprometidas como tu, logramos construir una comunidad mas unida, solidaria y fuerte.</p>
    <p>Ademas, te recordamos que al registrar asistencias confirmadas en la plataforma, avanzas en tu historial y sumas puntos para desbloquear reconocimientos y medallas (bronce, plata u oro) visibles en tu perfil publico.</p>
    <p>¡Esperamos coincidir contigo en proximas iniciativas! Tu ayuda marca la diferencia.</p>
    '''

    text_message = (
        f"Hola {username},\n\n"
        f"Queremos darte las gracias de todo corazon por haber asistido y colaborado activamente "
        f"en la actividad \"{anuncio.titulo}\" celebrada el {fecha_evento_str}.\n\n"
        f"Tu participacion marca una gran diferencia. Puedes ver tu historial de medallas y "
        f"actividades en tu perfil:\n"
        f"{profile_url}\n\n"
        f"¡Gracias de nuevo!"
    )

    html_message = _wrap_email_html(
        title="¡Gracias por tu colaboración!",
        preheader=f"Agradecemos sinceramente tu asistencia en {anuncio.titulo}.",
        body_content=body_content,
        button_text="Ver mi perfil",
        button_url=profile_url
    )

    _send_html_email(subject, text_message, html_message, user_email)
