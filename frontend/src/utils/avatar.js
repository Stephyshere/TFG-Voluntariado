/**
 * Utilidades para la gestión de avatares y fotos de perfil de los usuarios.
 */

/**
 * Obtiene un avatar predefinido con las iniciales del usuario.
 * 
 * @param {Object} user - El objeto de usuario que contiene nombre, username o entidad.
 * @returns {string} La URL de la imagen de ui-avatars.
 */
export const getDefaultAvatar = (user) => {
    if (!user) return 'https://ui-avatars.com/api/?name=U&background=random&color=fff&size=200';
    
    let name = 'Usuario';
    
    // Si es una organización
    if (user.nombre_entidad) {
        name = user.nombre_entidad;
    } 
    // Si tiene nombre completo
    else if (user.first_name || user.last_name) {
        name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    } 
    // Si solo tiene username
    else if (user.username) {
        name = user.username;
    }

    const formattedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${formattedName}&background=random&color=fff&size=200&bold=true`;
};
