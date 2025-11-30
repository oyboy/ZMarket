export const getRolesFromToken = (token) => {
    if (!token) return [];
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        let roles = [];
        if (payload.realm_access && Array.isArray(payload.realm_access.roles)) {
            roles = payload.realm_access.roles;
        } else if (Array.isArray(payload.authorities)) {
            roles = payload.authorities;
        } else if (Array.isArray(payload.roles)) {
            roles = payload.roles;
        } else if (typeof payload.scope === 'string') {
            roles = payload.scope.split(' ');
        }
        return roles.map((r) => String(r).toUpperCase());
    } catch {
        return [];
    }
};

export const getUserFromToken = (token) => {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            sub: payload.sub || payload.user_id || payload.uid || null,
            username: payload.preferred_username || payload.username || payload.name || null,
            email: payload.email || null,
            payload,
        };
    } catch {
        return null;
    }
};

export const getTokenExpirationMs = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) return payload.exp * 1000;
    } catch {}
    return NaN;
};