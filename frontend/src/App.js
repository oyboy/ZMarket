import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Productservice from './components/Productservice';
import SellerProducts from './components/Productservice/Seller/SellerProducts';
import RequireAuth from './components/Productservice/Auth/RequireAuth';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<Productservice />} />
            <Route element={<RequireAuth roles={['SELLER', 'ADMIN', 'ROLE_SELLER', 'ROLE_ADMIN']} />}>
                <Route path="/seller/products" element={<SellerProducts />} />
            </Route>
            <Route path="*" element={<Productservice />} />
        </Routes>
    );
};

export default App;