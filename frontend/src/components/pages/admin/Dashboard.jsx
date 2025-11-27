import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Админ-панель</h1>
            <div className="space-y-3">
                <Link to="/admin/pending-sellers" className="text-blue-600 hover:underline">Заявки на продавца</Link>
                <Link to="/admin/rejected-sellers" className="text-blue-600 hover:underline">Отклонённые заявки</Link>
            </div>
        </div>
    );
}