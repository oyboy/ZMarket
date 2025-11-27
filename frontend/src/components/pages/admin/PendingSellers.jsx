import React, { useEffect, useState } from 'react';
import { adminGetPendingSellers, adminVerifySeller, adminRejectSeller } from '../../../services/admin';

const RejectModal = ({ open, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    if (!open) return null;

    const submit = async () => {
        setLoading(true);
        try {
            await onSubmit(reason.trim());
            setReason('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            <div className="relative max-w-lg w-full bg-white rounded-lg shadow-xl mx-auto mt-32 p-6">
                <h3 className="text-lg font-semibold mb-3">Отклонить заявку</h3>
                <textarea
                    className="w-full border rounded p-2 text-sm"
                    rows={4}
                    placeholder="Причина отклонения"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
                <div className="mt-3 flex items-center gap-2">
                    <button onClick={submit} disabled={loading} className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50">
                        {loading ? 'Отправка…' : 'Отклонить'}
                    </button>
                    <button onClick={onClose} className="px-4 py-2 rounded border">Отмена</button>
                </div>
            </div>
        </div>
    );
};

const AdminPendingSellers = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rejectUserId, setRejectUserId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const data = await adminGetPendingSellers();
            setRows(data);
        } catch (e) {
            console.error(e);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const verify = async (userId) => {
        try {
            await adminVerifySeller(userId);
            await load();
            alert('Верификация успешна');
        } catch (e) {
            alert('Ошибка верификации');
        }
    };

    const openReject = (userId) => setRejectUserId(userId);
    const closeReject = () => setRejectUserId(null);

    const submitReject = async (reason) => {
        try {
            await adminRejectSeller(rejectUserId, reason || '');
            closeReject();
            await load();
            alert('Верификация отклонена');
        } catch (e) {
            alert(e.message || 'Ошибка отклонения');
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Заявки на продавца</h1>
            {loading ? (
                <div>Загрузка…</div>
            ) : rows.length === 0 ? (
                <div className="text-gray-600">Нет ожидающих заявок</div>
            ) : (
                <div className="divide-y border rounded">
                    {rows.map((r) => (
                        <div key={r.userId} className="p-4 flex items-center justify-between">
                            <div className="min-w-0">
                                <div className="font-medium truncate">{r.companyName}</div>
                                <div className="text-sm text-gray-600 truncate">ИНН: {r.inn}</div>
                                <div className="text-sm text-gray-600 truncate">{r.email}</div>
                                {r.description && <div className="text-sm truncate">{r.description}</div>}
                                <div className="text-xs text-gray-500 mt-1">{r.createdAt}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => verify(r.userId)} className="px-3 py-1.5 rounded bg-green-600 text-white">
                                    Подтвердить
                                </button>
                                <button onClick={() => openReject(r.userId)} className="px-3 py-1.5 rounded bg-red-600 text-white">
                                    Отклонить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <RejectModal open={!!rejectUserId} onClose={closeReject} onSubmit={submitReject} />
        </div>
    );
};

export default AdminPendingSellers;