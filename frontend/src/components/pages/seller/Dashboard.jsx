import React from 'react';
import { Link } from 'react-router-dom';

export default function SellerDashboard() {
    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Кабинет продавца</h1>
            <div className="space-y-3">
                <Link to="/seller/products" className="text-blue-600 hover:underline">Мои товары</Link>
                <Link to="/seller/warehouse" className="text-blue-600 hover:underline">Движение по складу</Link>
                <Link to="/seller/orders" className="text-blue-600 hover:underline">Заказы по моим товарам</Link>
            </div>
        </div>
    );
}