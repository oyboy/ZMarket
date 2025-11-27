import React, { useState } from 'react';
import { registerUser } from '../../../services/users';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pwdRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

const RegisterModal = ({ open, onClose, onRegistered }) => {
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    if (!open) return null;

    const change = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const validate = () => {
        if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) { setMsg('Заполните все поля'); return false; }
        if (!emailRe.test(form.email)) { setMsg('Некорректный формат email'); return false; }
        if (form.password.length < 8 || form.password.length > 72) { setMsg('Пароль должен быть от 8 до 72 символов'); return false; }
        if (!pwdRe.test(form.password)) { setMsg('Пароль должен содержать строчные, заглавные буквы и цифры'); return false; }
        if (form.password !== form.confirmPassword) { setMsg('Пароли не совпадают'); return false; }
        return true;
    };

    const submit = async () => {
        if (!validate()) return;
        setLoading(true); setMsg('');
        try {
            await registerUser(form); // { userId }
            // авто-логин: используем email как username и текущий пароль
            onRegistered && onRegistered({ email: form.email, password: form.password });
        } catch (e) {
            setMsg(e.message || 'Ошибка регистрации');
            return;
        } finally {
            setLoading(false);
        }
        onClose && onClose();
    };

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            <div className="relative max-w-md w-full bg-white rounded-lg shadow-xl mx-auto mt-24 p-6">
                <h3 className="text-lg font-semibold mb-4">Регистрация</h3>
                <div className="space-y-3">
                    <input name="firstName" value={form.firstName} onChange={change} placeholder="Имя" className="w-full border rounded px-3 py-2" />
                    <input name="lastName" value={form.lastName} onChange={change} placeholder="Фамилия" className="w-full border rounded px-3 py-2" />
                    <input name="email" type="email" value={form.email} onChange={change} placeholder="Email (используем для входа)" className="w-full border rounded px-3 py-2" />
                    <input name="password" type="password" value={form.password} onChange={change} placeholder="Пароль" className="w-full border rounded px-3 py-2" />
                    <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={change} placeholder="Подтвердите пароль" className="w-full border rounded px-3 py-2" />
                </div>
                {msg && <div className="text-sm mt-3">{msg}</div>}
                <div className="mt-4 flex items-center gap-2">
                    <button onClick={submit} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
                        {loading ? 'Отправка…' : 'Зарегистрироваться'}
                    </button>
                    <button onClick={onClose} className="px-4 py-2 rounded border">Отмена</button>
                </div>
            </div>
        </div>
    );
};

export default RegisterModal;