from rest_framework.permissions import SAFE_METHODS, BasePermission

DEMO_GROUP = "demo-admin"
DEMO_MAX_TRIALS = 25


def is_demo_admin(user) -> bool:
    """Demo admins are staff in DEMO_GROUP; they may only manage records they created."""
    if not (user and user.is_authenticated):
        return False
    cached = getattr(user, "_is_demo_admin", None)
    if cached is None:
        cached = user.groups.filter(name=DEMO_GROUP).exists()
        user._is_demo_admin = cached
    return cached


def can_modify(user, trial) -> bool:
    if not (user and user.is_authenticated and user.is_staff):
        return False
    if is_demo_admin(user):
        return trial.created_by_id == user.id
    return True


class IsAdminOrReadOnly(BasePermission):
    """Authenticated users read; staff write; demo admins write only their own records."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return request.method in SAFE_METHODS or user.is_staff

    def has_object_permission(self, request, view, obj):
        return request.method in SAFE_METHODS or can_modify(request.user, obj)