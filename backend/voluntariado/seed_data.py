"""
Módulo para la definición y población de datos iniciales de calidad premium en la base de datos.

Este módulo contiene la lista consolidada de pedanías de Mazarrón,
así como un conjunto de actividades y noticias detalladas para
hacer pruebas realistas del buscador y los filtros de la aplicación.
"""

import os
import urllib.request
from datetime import timedelta
from io import BytesIO
from typing import Dict, List, Any
from django.utils import timezone
from django.core.files.base import ContentFile
from django.contrib.auth.models import User
from voluntariado.models import Pedania, Anuncio, Perfil, Inscripcion


# Lista consolidada y normalizada de pedanías de Mazarrón
PEDANIAS_LIST: List[str] = [
    "Atalaya",
    "Balsicas",
    "Bolnuevo",
    "Camposol",
    "Cañadas del Romero",
    "Gañuelas",
    "Garrobo",
    "Ifre - Cañada de Gallego",
    "Ifre - Pastrana",
    "Leiva",
    "Majada",
    "Mazarrón (Casco Urbano)",
    "Mingrano",
    "Moreras",
    "Puerto de Mazarrón",
    "Rincones",
    "Saladillo"
]

# Actividades de voluntariado futuro realistas
ACTIVITIES_DATA: List[Dict[str, Any]] = [
    {
        "titulo": "Recuperación de la Arquitectura del Agua Tradicional",
        "descripcion": "Taller práctico de restauración de antiguos aljibes, canales de riego y abrevaderos tradicionales de piedra en seco. Aprende técnicas ancestrales y pon en valor el patrimonio etnográfico local.",
        "requerimientos": "Calzado de seguridad o botas de montaña, guantes de trabajo. Interés en la historia rural y la bioconstrucción.",
        "etiqueta": "otros",
        "cupo_maximo": 15,
        "dias_futuro": 10,
        "pedania": "Atalaya",
        "imagen_url": "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Acondicionamiento y Pintura Creativa de la Ermita",
        "descripcion": "Jornada festiva para pintar y embellecer las zonas comunes y los jardines aledaños a la histórica Ermita de Balsicas. Crearemos un espacio de reunión más alegre e integrado con la naturaleza.",
        "requerimientos": "Ropa vieja para pintar. Ganas de trabajar en equipo. Trae tu pincel favorito si tienes.",
        "etiqueta": "comunidad",
        "cupo_maximo": 20,
        "dias_futuro": 15,
        "pedania": "Balsicas",
        "imagen_url": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Limpieza y Conservación de las Gredas de Bolnuevo",
        "descripcion": "Jornada de voluntariado ambiental para la conservación del entorno natural de las Gredas de Bolnuevo. Retiraremos microplásticos, colillas y otros residuos de las calas y acantilados adyacentes para proteger la fauna marina.",
        "requerimientos": "Ropa y calzado deportivo, crema solar, gorra y agua. Proporcionaremos guantes, bolsas y herramientas de recogida.",
        "etiqueta": "medio_ambiente",
        "cupo_maximo": 40,
        "dias_futuro": 5,
        "pedania": "Bolnuevo",
        "imagen_url": "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Integración Multicultural y Taller de Español para Residentes",
        "descripcion": "Ayuda a integrar a la comunidad de residentes extranjeros a través de talleres de conversación en español y dinámicas de intercambio cultural. Una forma amena de tender puentes y hacer vecindario.",
        "requerimientos": "Habilidad para comunicarse en inglés básico, simpatía y entusiasmo. Ganas de aprender sobre otras culturas.",
        "etiqueta": "comunidad",
        "cupo_maximo": 25,
        "dias_futuro": 12,
        "pedania": "Camposol",
        "imagen_url": "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Plantación de Setos Cortavientos y Conservación del Suelo",
        "descripcion": "Actividad comunitaria de agricultura sostenible y forestación. Plantaremos setos y arbustos autóctonos para evitar la erosión del viento y mejorar la biodiversidad agrícola de la zona.",
        "requerimientos": "Ropa de trabajo que se pueda manchar, calzado resistente y guantes de jardinería si dispone de ellos.",
        "etiqueta": "medio_ambiente",
        "cupo_maximo": 30,
        "dias_futuro": 25,
        "pedania": "Cañadas del Romero",
        "imagen_url": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Taller Práctico de Hoteles de Insectos para Control Biológico",
        "descripcion": "Construiremos e instalaremos hoteles de insectos en las huertas tradicionales de Gañuelas. Estos refugios favorecen la presencia de polinizadores y depredadores naturales de plagas, impulsando la biodiversidad agrícola.",
        "requerimientos": "Ganas de manualidades y carpintería básica. Ideal para familias y aficionados a la entomología.",
        "etiqueta": "medio_ambiente",
        "cupo_maximo": 18,
        "dias_futuro": 8,
        "pedania": "Gañuelas",
        "imagen_url": "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Ruta de Senderismo Cardiosaludable para Mayores",
        "descripcion": "Buscamos voluntarios para guiar y acompañar a personas mayores en una caminata adaptada por los senderos de Garrobo. Fomentaremos el ejercicio físico suave al aire libre y la conversación amigable.",
        "requerimientos": "Carácter dinámico, conocimientos básicos de orientación e interés por el cuidado de la salud de nuestros mayores.",
        "etiqueta": "salud",
        "cupo_maximo": 12,
        "dias_futuro": 14,
        "pedania": "Garrobo",
        "imagen_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Limpieza y Reforestación de Dunas Costeras en Calnegre",
        "descripcion": "Conservación del frágil ecosistema de dunas en la zona marítima de Cañada de Gallego. Plantaremos especies dunares autóctonas para frenar el retroceso de la costa y retiraremos basura marina.",
        "requerimientos": "Gorra, calzado que se pueda mojar o zapatillas deportivas, protector solar. Agua fría será provista.",
        "etiqueta": "medio_ambiente",
        "cupo_maximo": 35,
        "dias_futuro": 7,
        "pedania": "Ifre - Cañada de Gallego",
        "imagen_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Taller Infantil de Reciclaje y Concienciación Ecológica",
        "descripcion": "Impartición de divertidos talleres prácticos de manualidades con materiales reciclados para los niños. Fomentaremos los valores de reducir, reutilizar y reciclar a través del juego educativo.",
        "requerimientos": "Facilidad para tratar con niños, creatividad y ganas de divertirse compartiendo buenos hábitos medioambientales.",
        "etiqueta": "educacion",
        "cupo_maximo": 15,
        "dias_futuro": 18,
        "pedania": "Ifre - Pastrana",
        "imagen_url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Recuperación del Patrimonio Oral de Leiva",
        "descripcion": "Proyecto cultural intergeneracional. Los voluntarios entrevistarán y grabarán en audio/video los testimonios, leyendas, recetas tradicionales y cantares de los vecinos más antiguos para crear un archivo digital público.",
        "requerimientos": "Sensibilidad para escuchar, manejo básico de teléfonos inteligentes o grabadoras de audio. Mucho respeto.",
        "etiqueta": "comunidad",
        "cupo_maximo": 10,
        "dias_futuro": 22,
        "pedania": "Leiva",
        "imagen_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Campaña de Conservación de Aves Esteparias y Cajas Nido",
        "descripcion": "Colabora en la concienciación y protección de las aves de secano. Construiremos y colgaremos cajas nido y comederos para ayudar en la nidificación de especies protegidas de nuestro interior.",
        "requerimientos": "Destreza manual básica para ensamblar madera. No apto para personas con vértigo severo ya que se subirán escaleras.",
        "etiqueta": "animales",
        "cupo_maximo": 14,
        "dias_futuro": 20,
        "pedania": "Majada",
        "imagen_url": "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Refuerzo Escolar y Apoyo Digital para Jóvenes",
        "descripcion": "Impartición de clases de apoyo escolar, técnicas de estudio y alfabetización digital para niños y adolescentes en riesgo de exclusión social. Ayúdanos a reducir la brecha educativa compartiendo tus conocimientos.",
        "requerimientos": "Paciencia, empatía y compromiso mínimo de una tarde a la semana. No se requiere titulación docente previa.",
        "etiqueta": "educacion",
        "cupo_maximo": 30,
        "dias_futuro": 6,
        "pedania": "Mazarrón (Casco Urbano)",
        "imagen_url": "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Inventario de Flora Silvestre y Detección de Especies Invasoras",
        "descripcion": "Salida guiada para catalogar las plantas nativas del paraje silvestre. Identificaremos y registraremos especies invasoras que amenazan los endemismos del sureste ibérico utilizando aplicaciones de ciencia ciudadana.",
        "requerimientos": "Móvil con batería cargada y conexión a internet para descargar app de mapeo, calzado adecuado para senderismo rural.",
        "etiqueta": "medio_ambiente",
        "cupo_maximo": 16,
        "dias_futuro": 28,
        "pedania": "Mingrano",
        "imagen_url": "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Reforestación Forestal y Siembra en Sierra de las Moreras",
        "descripcion": "Colabora en la plantación de especies forestales autóctonas como el pino carrasco y el lentisco en las zonas afectadas por la erosión en la Sierra. Ayúdanos a devolverle el color a nuestro pulmón verde.",
        "requerimientos": "Botas de montaña, ropa cómoda y agua abundante. Las herramientas de plantación y plantones serán facilitados.",
        "etiqueta": "medio_ambiente",
        "cupo_maximo": 50,
        "dias_futuro": 30,
        "pedania": "Moreras",
        "imagen_url": "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Apoyo en el Puesto de Socorro y Primeros Auxilios",
        "descripcion": "Colabora con el equipo de emergencias en el paseo marítimo. Ayudarás en labores de información preventiva a los bañistas, reparto de pulseras identificativas para niños y apoyo logístico en el puesto asistencial.",
        "requerimientos": "Mayor de edad, actitud proactiva y certificado básico de primeros auxilios (deseable, pero no obligatorio).",
        "etiqueta": "salud",
        "cupo_maximo": 10,
        "dias_futuro": 4,
        "pedania": "Puerto de Mazarrón",
        "imagen_url": "https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Mercado Agroecológico Solidario y Consumo Responsable",
        "descripcion": "Apoya en la organización del mercado de productores ecológicos locales. Ayudaremos en el montaje de puestos, atención informativa al público y distribución de material sobre agricultura sostenible.",
        "requerimientos": "Carácter amable y colaborador. Capacidad para estar de pie y ganas de interactuar con vecinos y productores.",
        "etiqueta": "comunidad",
        "cupo_maximo": 15,
        "dias_futuro": 9,
        "pedania": "Rincones",
        "imagen_url": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Cuidado y Socialización en el Refugio de Animales",
        "descripcion": "Ayúdanos en las instalaciones de la protectora de animales del Saladillo. Los animales rescatados necesitan paseos, cepillado y cariño para prepararse para su futura adopción y mejorar su bienestar.",
        "requerimientos": "Amor por los animales, ropa cómoda y zapatillas. Los menores de edad deben venir acompañados de un tutor legal.",
        "etiqueta": "animales",
        "cupo_maximo": 12,
        "dias_futuro": 11,
        "pedania": "Saladillo",
        "imagen_url": "https://images.unsplash.com/photo-1444212477490-ca407925329e?q=80&w=1200&auto=format&fit=crop"
    }
]

# Actividades pasadas (Noticias) con logros concretos
PAST_ACTIVITIES_DATA: List[Dict[str, Any]] = [
    {
        "titulo": "Éxito Absoluto en la Campaña de Recogida de Alimentos",
        "descripcion": "Gracias al extraordinario trabajo de los voluntarios y las generosas donaciones de los vecinos, hemos conseguido recaudar más de cinco toneladas de alimentos no perecederos. Todo lo recolectado ya está siendo distribuido.",
        "etiqueta": "comunidad",
        "dias_pasado": 10,
        "pedania": "Mazarrón (Casco Urbano)",
        "noticia_resumen": "Se recolectaron 5.200 kg de alimentos esenciales beneficiando a más de 300 familias vulnerables del municipio.",
        "imagen_url": "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Torneo Deportivo Benéfico de Fútbol Playa",
        "descripcion": "Una jornada deportiva y solidaria inmejorable en el paseo marítimo. El torneo de fútbol playa reunió a decenas de equipos y a cientos de espectadores, logrando recaudar fondos vitales para el refugio animal.",
        "etiqueta": "otros",
        "dias_pasado": 25,
        "pedania": "Puerto de Mazarrón",
        "noticia_resumen": "Recaudados 1.800 euros destinados íntegramente a tratamientos médicos y alimentación para perros sin hogar.",
        "imagen_url": "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1200&auto=format&fit=crop"
    },
    {
        "titulo": "Jornada Extraordinaria de Adopción Canina",
        "descripcion": "El evento de adopción celebrado el fin de semana fue todo un éxito. Agradecemos enormemente a todos los voluntarios que colaboraron en el montaje y a los vecinos que abrieron sus corazones a un nuevo amigo.",
        "etiqueta": "animales",
        "dias_pasado": 40,
        "pedania": "Camposol",
        "noticia_resumen": "Quince perros y siete gatos del refugio municipal encontraron familias adoptivas definitivas durante el evento.",
        "imagen_url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1200&auto=format&fit=crop"
    }
]


def _download_and_save_image(anuncio: Anuncio, url: str, filename_prefix: str) -> None:
    """
    Descarga una imagen desde una URL de Unsplash y la asocia al anuncio.

    Utiliza la biblioteca estándar urllib para no requerir dependencias externas.

    Args:
        anuncio (Anuncio): El objeto Anuncio de Django al que se asignará la imagen.
        url (str): La dirección URL pública de la imagen a descargar.
        filename_prefix (str): El prefijo que se utilizará para nombrar el archivo de imagen.
    """
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        )
        # Realizamos la petición HTTP de descarga de la imagen con un tiempo de espera prudente
        with urllib.request.urlopen(req, timeout=15) as response:
            image_bytes = response.read()
            
        filename = f"{filename_prefix}_{anuncio.id}.jpg"
        if filename_prefix == "noticia":
            anuncio.noticia_imagen.save(filename, ContentFile(image_bytes), save=True)
        else:
            anuncio.imagen.save(filename, ContentFile(image_bytes), save=True)
        print(f"    Imagen descargada y guardada correctamente: {filename}")
    except Exception as error:
        # Se captura la excepción específica y se imprime para no interrumpir el flujo de población
        print(f"    No se pudo descargar la imagen para '{anuncio.titulo}': {error}")


def poblar_datos_premium() -> None:
    """
    Función principal encargada de limpiar y poblar la base de datos local
    con las pedanías consolidadas, las actividades y las noticias de prueba.
    """
    print("Iniciando la población de datos de calidad premium...")

    # 1. Crear o recuperar el usuario administrador organizador
    try:
        if not User.objects.filter(username="organizador").exists():
            admin_user = User.objects.create_superuser(
                username="organizador",
                email="organizador@voluntadmazarron.com",
                password="admin123",
                first_name="Organizador",
                last_name="Municipal"
            )
            # Aseguramos el rol correcto de organización en su perfil
            Perfil.objects.update_or_create(
                user=admin_user,
                defaults={
                    "rol": "organizacion",
                    "nombre_entidad": "Ayuntamiento de Mazarrón",
                    "telefono": "968590012"
                }
            )
            print("Usuario administrador 'organizador' creado de forma exitosa.")
        else:
            admin_user = User.objects.get(username="organizador")
            # Forzamos la existencia de un perfil válido
            Perfil.objects.get_or_create(
                user=admin_user,
                defaults={
                    "rol": "organizacion",
                    "nombre_entidad": "Ayuntamiento de Mazarrón",
                    "telefono": "968590012"
                }
            )
            print("Usuario administrador 'organizador' cargado correctamente.")
    except Exception as error:
        print(f"Error al inicializar el usuario administrador: {error}")
        return

    # 2. Sincronizar y limpiar Pedanías
    # Para evitar confusión con nombres en mayúsculas duplicados del pasado,
    # primero eliminamos las pedanías que no tienen anuncios.
    # Las que sí tengan anuncios se actualizarán o mantendrán con cuidado.
    print("Optimizando y saneando el listado de Pedanías...")
    existing_pedanias = list(Pedania.objects.all())
    
    # Creamos un mapa de nombres normalizados a sus objetos correspondientes en la DB
    pedanias_map: Dict[str, Pedania] = {}
    
    for nombre in PEDANIAS_LIST:
        p, created = Pedania.objects.get_or_create(nombre=nombre)
        pedanias_map[nombre] = p
        if created:
            print(f"  Pedanía añadida: {nombre}")

    # Eliminamos las pedanías sobrantes que no pertenecen a la lista oficial y tienen cero anuncios
    for p in existing_pedanias:
        if p.nombre not in PEDANIAS_LIST:
            anuncios_asociados = p.anuncios.count()
            if anuncios_asociados == 0:
                print(f"  Eliminando pedanía redundante/obsoleta: {p.nombre}")
                p.delete()
            else:
                # Si tuviera anuncios, la mapeamos a la versión limpia más parecida
                matching_name = next(
                    (name for name in PEDANIAS_LIST if name.lower() == p.nombre.lower()),
                    None
                )
                if matching_name:
                    target_pedania = pedanias_map[matching_name]
                    print(f"  Migrando {anuncios_asociados} anuncios de '{p.nombre}' a '{matching_name}'...")
                    p.anuncios.all().update(pedanias=target_pedania)
                    p.delete()

    print(f"Sincronización completa. {Pedania.objects.count()} pedanías listas en base de datos.")

    # 3. Eliminar anuncios antiguos de prueba para no saturar y mantener los textos limpios
    # Mantenemos solo aquellos anuncios que tengan inscripciones de usuarios, el resto se limpian
    print("Limpiando anuncios de prueba antiguos sin inscripciones activas...")
    anuncios_a_borrar = Anuncio.objects.filter(inscripciones__isnull=True)
    count_borrados = anuncios_a_borrar.count()
    anuncios_a_borrar.delete()
    print(f"Se eliminaron {count_borrados} anuncios de prueba obsoletos.")

    # 4. Crear Actividades Futuras (1 por cada Pedanía)
    print("Creando 17 actividades premium personalizadas...")
    for index, act in enumerate(ACTIVITIES_DATA, start=1):
        pedania_obj = pedanias_map.get(act["pedania"])
        if not pedania_obj:
            continue

        fecha_evento = timezone.now() + timedelta(days=act["dias_futuro"])
        
        # get_or_create para no duplicar en ejecuciones consecutivas
        anuncio, creada = Anuncio.objects.get_or_create(
            titulo=act["titulo"],
            defaults={
                "descripcion": act["descripcion"],
                "requerimientos": act["requerimientos"],
                "etiqueta": act["etiqueta"],
                "fecha_evento": fecha_evento,
                "estado": "publicado",
                "cupo_maximo": act["cupo_maximo"],
                "pedanias": pedania_obj,
                "usuario": admin_user
            }
        )

        if creada:
            print(f"[{index}/17] Actividad creada: '{anuncio.titulo}' en {act['pedania']}")
            # Descargar la imagen real de Unsplash
            _download_and_save_image(anuncio, act["imagen_url"], "actividad")
        else:
            print(f"[{index}/17] La actividad ya existía: '{anuncio.titulo}'")
            if not anuncio.imagen:
                print(f"    Imagen faltante para actividad existente. Descargando...")
                _download_and_save_image(anuncio, act["imagen_url"], "actividad")

    # 5. Crear Noticias (Actividades pasadas con logros)
    print("Creando noticias y testimonios de actividades finalizadas...")
    for index, news in enumerate(PAST_ACTIVITIES_DATA, start=1):
        pedania_obj = pedanias_map.get(news["pedania"])
        if not pedania_obj:
            continue

        fecha_evento = timezone.now() - timedelta(days=news["dias_pasado"])
        
        anuncio, creada = Anuncio.objects.get_or_create(
            titulo=news["titulo"],
            defaults={
                "descripcion": news["descripcion"],
                "requerimientos": "Completado satisfactoriamente.",
                "etiqueta": news["etiqueta"],
                "fecha_evento": fecha_evento,
                "estado": "finalizado",
                "cupo_maximo": 100,
                "pedanias": pedania_obj,
                "usuario": admin_user,
                "noticia_resumen": news["noticia_resumen"]
            }
        )

        if creada:
            print(f"Noticia creada: '{anuncio.titulo}' en {news['pedania']}")
            _download_and_save_image(anuncio, news["imagen_url"], "noticia")
        else:
            print(f"La noticia ya existía: '{anuncio.titulo}'")
            if not anuncio.noticia_imagen:
                print(f"    Imagen faltante para noticia existente. Descargando...")
                _download_and_save_image(anuncio, news["imagen_url"], "noticia")

    # 6. Crear los usuarios voluntarios de prueba con diferentes marcos de nivel
    crear_usuarios_con_marcos()

    print("--- POBLACIÓN DE DATOS PREMIUM COMPLETADA CON ÉXITO ---")


def crear_usuarios_con_marcos() -> None:
    """
    Crea tres usuarios voluntarios con diferentes niveles de asistencia confirmada
    para asignarles dinámicamente los marcos de bronce, plata y oro.
    """
    print("Creando y configurando usuarios de prueba con marcos (bronce, plata, oro)...")

    # Configuración de los usuarios a crear
    user_configs = [
        {
            "username": "voluntario_bronce",
            "email": "bronce@voluntadmazarron.com",
            "first_name": "Luis",
            "last_name": "Bronce",
            "asistencias_objetivo": 3  # Bronce: 1 a 4 asistencias
        },
        {
            "username": "voluntario_plata",
            "email": "plata@voluntadmazarron.com",
            "first_name": "Marta",
            "last_name": "Plata",
            "asistencias_objetivo": 8  # Plata: 5 a 15 asistencias
        },
        {
            "username": "voluntario_oro",
            "email": "oro@voluntadmazarron.com",
            "first_name": "Sofía",
            "last_name": "Oro",
            "asistencias_objetivo": 18  # Oro: 16+ asistencias
        }
    ]

    all_anuncios = list(Anuncio.objects.all())
    if not all_anuncios:
        print("  Error: No hay anuncios en la base de datos para simular asistencias.")
        return

    for config in user_configs:
        username = config["username"]
        email = config["email"]
        
        # Crear o recuperar el usuario
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "first_name": config["first_name"],
                "last_name": config["last_name"]
            }
        )
        
        if created:
            user.set_password("password123")
            user.save()
            print(f"  Usuario '{username}' creado de forma exitosa.")
        else:
            print(f"  Usuario '{username}' cargado correctamente.")

        # Asegurar el perfil con rol voluntario
        Perfil.objects.update_or_create(
            user=user,
            defaults={
                "rol": "voluntario",
                "telefono": "600123456"
            }
        )

        # Limpiar inscripciones anteriores de este usuario para asegurar idempotencia
        Inscripcion.objects.filter(usuario=user).delete()

        # Crear inscripciones con asistencia confirmada (asistido=True)
        asistencias = min(config["asistencias_objetivo"], len(all_anuncios))
        for i in range(asistencias):
            anuncio = all_anuncios[i]
            Inscripcion.objects.create(
                anuncio=anuncio,
                usuario=user,
                asistido=True
            )
            
        # Imprimir resultado de marco calculado
        user.refresh_from_db()
        print(f"    Marco asignado para '{username}': {user.perfil.marco.upper()} ({asistencias} asistencias confirmadas)")

    print("--- USUARIOS CON MARCOS CONFIGURADOS ---")
