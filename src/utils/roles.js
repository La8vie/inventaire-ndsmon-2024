export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user'
};

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 3,
  [ROLES.ADMIN]: 2,
  [ROLES.MODERATOR]: 1,
  [ROLES.USER]: 0
};

export const hasRole = (user, requiredRole) => {
  if (!user || !user.role) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
};

export const hasAnyRole = (user, roles = []) => {
  if (!user || !user.role) return false;
  return roles.some(role => hasRole(user, role));
};
