import React, { useState } from 'react';
import { becomeSeller } from '../../services/users';

const innRe = /^\d{10}(\d{2})?$/;

const BecomeSellerModal = ({ open, onClose, onSuccess }) => {
    const [form, setForm] = useState({ name: '', inn: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    if (!open) return null;
    const change = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const validate = () => {
        if (!form.name.trim() || !form.inn.trim()) {
            setMsg('Заполните название и ИНН');
            return false;
        }
        if (!innRe.test(form.inn)) {
            setMsg('ИНН должен содержать 10 или 12 цифр');
            return false;
        }
        return true;
    };

    const submit = async () => {
        const token = localStorage.getItem('jwtToken');
        if (!token) { setMsg('Нужно войти'); return; }
        if (!validate()) return;
        setLoading(true);
        setMsg('');
        try {
            const message = await becomeSeller(form, token);
            setMsg(message || 'Вы успешно стали продавцом');
            onSuccess && onSuccess();
        } catch (e) {
            if (e.message === 'UNAUTHORIZED') setMsg('Нужно войти');
            else if (e.message === 'FORBIDDEN') setMsg('Недостаточно прав (нужна роль USER)');
            else setMsg(e.message || 'Ошибка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="fixed inset-0 bg-black/40" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h3 className="text-lg font-semibold mb-4">Стать продавцом</h3>

                    <div className="space-y-3">
                        <input name="name" value={form.name} onChange={change} placeholder="Название компании" className="w-full border rounded px-3 py-2" />
                        <input name="inn" value={form.inn} onChange={change} placeholder="ИНН (10 или 12 цифр)" className="w-full border rounded px-3 py-2" />
                        <textarea name="description" value={form.description} onChange={change} placeholder="Описание (необязательно)" rows={3} className="w-full border rounded px-3 py-2" />
                    </div>

                    {msg && <div className="text-sm mt-3">{msg}</div>}

                    <div className="mt-4 flex items-center gap-2">
                        <button onClick={submit} disabled={loading} className="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50">
                            {loading ? 'Отправка…' : 'Отправить'}
                        </button>
                        <button onClick={onClose} className="px-4 py-2 rounded border">Закрыть</button>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                        После повышения роли обновите токен (перезайдите), чтобы увидеть интерфейс продавца.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BecomeSellerModal;