// import React from 'react';
// import { Navigate, Outlet, useLocation } from 'react-router-dom';
// import { getRolesFromToken } from '../../../utils/jwt';
//
// const RequireAuth = ({ roles = [] }) => {
//     const token = localStorage.getItem('jwtToken');
//     const location = useLocation();
//
//     if (!token) return <Navigate to="/" state={{ from: location }} replace />;
//
//     const userRoles = getRolesFromToken(token);
//     const ok = roles.length === 0 || roles.some((r) => userRoles.includes(r));
//     return ok ? <Outlet /> : <Navigate to="/" replace />;
// };
//
// export default RequireAuth;


import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const RequireAuth = ({ children, redirectTo = '/login' }) => {
    const location = useLocation();
    const token = localStorage.getItem('jwtToken');

    if (!token) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return children;
};

export default RequireAuth;