from rest_framework import permissions


class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Permite el acceso completo a los administradores, y de solo lectura a los demás.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.is_staff
                or getattr(getattr(request.user, 'perfil', None), 'rol', '').lower() == 'administrador'
            )
        )


class IsOrganizacionOrAdmin(permissions.BasePermission):
    """
    Permite a los administradores y a las organizaciones crear (POST).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not (request.user and request.user.is_authenticated):
            return False

        rol = getattr(getattr(request.user, 'perfil', None), 'rol', '').lower()
        return request.user.is_staff or rol in ['organizacion', 'administrador']

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Los administradores pueden editar todo.
    Las organizaciones solo pueden editar/borrar lo que han creado (objeto usuario == request.user).
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
            
        is_admin = bool(request.user and request.user.is_authenticated and 
                        (request.user.is_staff or getattr(getattr(request.user, 'perfil', None), 'rol', '').lower() == 'administrador'))
        
        if is_admin:
            return True
            
        return obj.usuario == request.user
