from django.core.mail import send_mail
from django.conf import settings
from urllib.parse import quote
from datetime import timedelta
import os

def send_welcome_email(user_email, username, is_organization=False):
    """
    Envía un correo de bienvenida al usuario u organización tras registrarse.
    """
    if not user_email:
        return

    subject = '¡Bienvenido a Voluntariado!'
    if is_organization:
        message = f'Hola {username},\n\nGracias por registrar tu organización en nuestra plataforma. ¡Esperamos que encuentres muchos voluntarios!'
    else:
        message = f'Hola {username},\n\nGracias por registrarte en nuestra plataforma de voluntariado. ¡Esperamos que participes en muchas actividades!'

    try:
        send_mail(
            subject,
            message,
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@voluntariado.com'),
            [user_email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"Error enviando correo de bienvenida: {e}")


def generate_google_calendar_link(anuncio):
    """
    Genera un enlace para añadir el evento a Google Calendar.
    """
    # Formato de fecha para Google Calendar: YYYYMMDDTHHMMSSZ
    # Asumimos que fecha_evento está en UTC o usamos su formato natural
    # Si dura 2 horas por defecto:
    start_time = anuncio.fecha_evento
    end_time = start_time + timedelta(hours=2)

    start_str = start_time.strftime('%Y%m%dT%H%M%SZ')
    end_str = end_time.strftime('%Y%m%dT%H%M%SZ')

    title = quote(anuncio.titulo)
    description = quote(anuncio.descripcion)
    
    # Asumimos que pedanias.nombre es el lugar
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


def send_inscription_email(user_email, username, anuncio):
    """
    Envía un correo cuando un usuario se inscribe en una actividad, 
    incluyendo un botón (enlace) para añadirlo a Google Calendar.
    """
    if not user_email:
        return

    subject = f'Inscripción confirmada: {anuncio.titulo}'
    calendar_link = generate_google_calendar_link(anuncio)

    message = (
        f'Hola {username},\n\n'
        f'Te has inscrito correctamente en la actividad "{anuncio.titulo}".\n'
        f'Fecha del evento: {anuncio.fecha_evento.strftime("%d/%m/%Y %H:%M")}\n\n'
        f'Puedes añadir este evento a tu Google Calendar usando el siguiente enlace:\n'
        f'{calendar_link}\n\n'
        f'¡Gracias por participar!'
    )
    
    html_message = (
        f'<p>Hola {username},</p>'
        f'<p>Te has inscrito correctamente en la actividad <strong>"{anuncio.titulo}"</strong>.</p>'
        f'<p>Fecha del evento: {anuncio.fecha_evento.strftime("%d/%m/%Y %H:%M")}</p>'
        f'<p><a href="{calendar_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Añadir a Google Calendar</a></p>'
        f'<p>¡Gracias por participar!</p>'
    )

    try:
        send_mail(
            subject,
            message,
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@voluntariado.com'),
            [user_email],
            fail_silently=True,
            html_message=html_message
        )
        print(f"Error enviando correo de inscripción: {e}")

def send_password_reset_email(user_email, username, reset_url):
    """
    Envía un correo con el enlace para restablecer la contraseña.
    """
    if not user_email:
        return

    subject = 'Restablecer contraseña - Voluntariado'
    message = (
        f'Hola {username},\n\n'
        f'Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:\n'
        f'{reset_url}\n\n'
        f'Si no has sido tú, ignora este correo.'
    )
    
    html_message = (
        f'<p>Hola {username},</p>'
        f'<p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p>'
        f'<p><a href="{reset_url}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer contraseña</a></p>'
        f'<p>Si no has solicitado este cambio, ignora este correo.</p>'
    )

    try:
        send_mail(
            subject,
            message,
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@voluntariado.com'),
            [user_email],
            fail_silently=True,
            html_message=html_message
        )
    except Exception as e:
        print(f"Error enviando correo de recuperación de contraseña: {e}")

