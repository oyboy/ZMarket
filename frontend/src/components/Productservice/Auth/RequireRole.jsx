// import React from 'react';
// import { Navigate, Outlet, useLocation } from 'react-router-dom';
// import { getRolesFromToken } from '../../../utils/jwt';
//
// const RequireRole = ({ anyOf = [] }) => {
//     const token = localStorage.getItem('jwtToken');
//     const location = useLocation();
//     if (!token) return <Navigate to="/" state={{ from: location }} replace />;
//
//     const roles = getRolesFromToken(token);
//     const ok = anyOf.length === 0 || anyOf.some(r => roles.includes(r));
//     return ok ? <Outlet /> : <Navigate to="/" replace />;
// };
//
// export default RequireRole;



import React from 'react';
import { Navigate } from 'react-router-dom';
import { getRolesFromToken } from '../../../utils/jwt';  // Исправленный путь

const RequireRole = ({ children, anyOf = [] }) => {
    const token = localStorage.getItem('jwtToken');

    if (!token) {
        return <Navigate to="/" replace />;
    }

    const roles = getRolesFromToken(token);
    const hasRequiredRole = anyOf.some(role => roles.includes(role));

    if (!hasRequiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RequireRole;