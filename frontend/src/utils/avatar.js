/**
 * Utilidades para la gestión de avatares y fotos de perfil de los usuarios.
 */

// Lista de 5 imágenes divertidas y de alta calidad de Unsplash para avatares por defecto
const FUNNY_AVATARS = [
    "https://images.unsplash.com/photo-1574873568924-e1dcd48a5763?q=80&w=400&auto=format&fit=crop", // Alpaca mirando fijamente
    "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=400&auto=format&fit=crop", // León bostezando / rugiendo gracioso
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=400&auto=format&fit=crop", // Shiba Inu con gafas
    "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=400&auto=format&fit=crop", // Panda rojo bostezando tiernamente
    "https://images.unsplash.com/photo-1540573133827-2e116694cede?q=80&w=400&auto=format&fit=crop"  // Mono sorprendido en primer plano
];

/**
 * Obtiene una foto de perfil divertida por defecto basada de forma estable en el ID del usuario.
 * 
 * @param {number|string} userId - El identificador único del usuario.
 * @returns {string} La URL de la imagen de Unsplash asignada al usuario de forma consistente.
 */
export const getFunnyDefaultAvatar = (userId) => {
    const id = parseInt(userId, 10) || 0;
    const index = id % FUNNY_AVATARS.length;
    return FUNNY_AVATARS[index];
};
