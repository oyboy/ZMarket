import React, { useEffect, useState } from 'react';
import { adminGetRejectedSellers } from '../../../services/admin';

export default function AdminRejectedSellers() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await adminGetRejectedSellers(); // [] если 404
            setRows(data);
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Отклонённые заявки</h1>
            {loading ? (
                <div>Загрузка…</div>
            ) : rows.length === 0 ? (
                <div className="text-gray-600">Нет записей</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 border">Пользователь</th>
                            <th className="p-2 border">Email</th>
                            <th className="p-2 border">Компания</th>
                            <th className="p-2 border">ИНН</th>
                            <th className="p-2 border">Причина</th>
                            <th className="p-2 border">Дата</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((r, i) => (
                            <tr key={r.userId || i}>
                                <td className="p-2 border font-mono">{(r.userId || '').toString().slice(0,8)}…</td>
                                <td className="p-2 border">{r.email || '—'}</td>
                                <td className="p-2 border">{r.companyName || '—'}</td>
                                <td className="p-2 border">{r.inn || '—'}</td>
                                <td className="p-2 border">{r.reason || r.rejectReason || '—'}</td>
                                <td className="p-2 border">{r.rejectedAt || r.updatedAt || r.createdAt || '—'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}