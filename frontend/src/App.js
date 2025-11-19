import {React, useState} from 'react';
import { Routes, Route } from 'react-router-dom';
import Productservice from './components/Productservice';
import SellerProducts from './components/Productservice/Seller/SellerProducts';
import RequireAuth from './components/Productservice/Auth/RequireAuth';
import ProductDetails from './components/Productservice/ProductDetails';
import LoginModal from './components/Productservice/LoginModal';

const App = () => {
    const [showLoginModal, setShowLoginModal] = useState(false);

    const openAuth = () => setShowLoginModal(true);
    const closeAuth = () => setShowLoginModal(false);

    return (
        <>
        <Routes>
            <Route path="/" element={<Productservice />} />
            <Route element={<RequireAuth roles={['SELLER', 'ADMIN', 'ROLE_SELLER', 'ROLE_ADMIN']} />}>
                <Route path="/seller/products" element={<SellerProducts />} />
            </Route>
            <Route path="/product/:uuid" element={<ProductDetails onRequireAuth={() => setShowLoginModal?.(true)} />} />
            <Route path="*" element={<Productservice />} />
        </Routes>
            <LoginModal
                open={showLoginModal}
                loading={false}
                loginData={{}}
                onChange={() => {}}
                onLogin={() => {}}
                onClose={closeAuth}
            />
        </>
    );
};

export default App;