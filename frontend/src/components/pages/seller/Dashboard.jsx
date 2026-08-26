import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../Shared/ToastProvider';
import {
    getSellerInfo,
    updateSellerProfile,
    uploadSellerAvatar,
    deleteSellerAvatar,
} from '../../../services/users';
import { getRolesFromToken, getUserFromToken } from '../../../utils/jwt';

export default function SellerDashboard() {
    const toast = useToast();
    const token = localStorage.getItem('jwtToken');

    const roles = useMemo(() => (token ? getRolesFromToken(token) : []), [token]);
    const user = useMemo(() => (token ? getUserFromToken(token) : null), [token]);
    const userId = user?.sub || null;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [profile, setProfile] = useState({
        companyName: '',
        description: '',
        avatarUrl: '',
    });
    const [form, setForm] = useState({ companyName: '', description: '' });
    const [avatarPreview, setAvatarPreview] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deletingAvatar, setDeletingAvatar] = useState(false);

    const loadedRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const load = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const info = await getSellerInfo(userId);
            if (!mountedRef.current) return;
            const companyName = info?.sellerName || '';
            const description = info?.description || '';
            const avatarUrl = info?.avatarUrl || '';
            setProfile({ companyName, description, avatarUrl });
            setForm({ companyName, description });
            setAvatarPreview('');
            setAvatarFile(null);
        } catch (e) {
            if (mountedRef.current)
                toast.error(e.message || 'Не удалось загрузить профиль продавца');
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    };

    useEffect(() => {
        if (!userId) return;
        if (loadedRef.current) return;
        loadedRef.current = true;
        load();
    }, [userId]);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const saveProfile = async () => {
        if (!form.companyName.trim()) {
            toast.warn('Укажите название компании');
            return;
        }
        setSaving(true);
        try {
            await updateSellerProfile({
                companyName: form.companyName.trim(),
                description: form.description || '',
            });
            toast.success('Профиль сохранён');
            await load();
        } catch (e) {
            toast.error(e.message || 'Не удалось сохранить профиль');
        } finally {
            setSaving(false);
        }
    };

    const onPickAvatar = (file) => {
        if (!file) return;
        setAvatarFile(file);
        const url = URL.createObjectURL(file);
        setAvatarPreview(url);
    };

    const doUploadAvatar = async () => {
        if (!avatarFile) return;
        setUploading(true);
        try {
            await uploadSellerAvatar(avatarFile);
            toast.success('Аватар обновлён');
            await load();
        } catch (e) {
            toast.error(e.message || 'Не удалось загрузить аватар');
        } finally {
            setUploading(false);
        }
    };

    const doDeleteAvatar = async () => {
        setDeletingAvatar(true);
        try {
            await deleteSellerAvatar();
            toast.info('Аватар удалён');
            await load();
        } catch (e) {
            toast.error(e.message || 'Не удалось удалить аватар');
        } finally {
            setDeletingAvatar(false);
        }
    };

    const isSeller = roles.includes('SELLER') || roles.includes('ROLE_SELLER');

    if (!token || !isSeller) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Кабинет продавца
                </h1>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-gray-600">
                    Недостаточно прав для доступа к кабинету продавца.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Кабинет продавца
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Управляйте профилем магазина, товарами и статистикой
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900">
                            Профиль продавца
                        </h2>
                        {loading ? (
                            <div className="text-gray-500 text-sm">Загрузка…</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Название компании
                                    </label>
                                    <input
                                        name="companyName"
                                        value={form.companyName}
                                        onChange={onChange}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                        placeholder="Например, ИП Петров"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Описание
                                    </label>
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={onChange}
                                        rows={4}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                        placeholder="Коротко о магазине, условиях доставки и т.п."
                                    />
                                </div>
                                <div className="md:col-span-2 flex items-center gap-2 mt-1">
                                    <button
                                        onClick={saveProfile}
                                        disabled={saving}
                                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 shadow-sm disabled:opacity-50"
                                    >
                                        {saving ? 'Сохранение…' : 'Сохранить'}
                                    </button>
                                    <button
                                        onClick={() =>
                                            setForm({
                                                companyName: profile.companyName,
                                                description: profile.description,
                                            })
                                        }
                                        className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Сбросить
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                        <h2 className="text-lg font-semibold mb-3 text-gray-900">
                            Быстрые ссылки
                        </h2>
                        <p className="text-sm text-gray-500 mb-3">
                            Основные разделы кабинета продавца
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                to="/seller/products"
                                className="px-4 py-2 rounded-full border text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 shadow-sm"
                            >
                                Мои товары
                            </Link>
                            <Link
                                to="/seller/warehouse"
                                className="px-4 py-2 rounded-full border text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 shadow-sm"
                            >
                                Движение по складу
                            </Link>
                            <Link
                                to="/seller/orders"
                                className="px-4 py-2 rounded-full border text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 shadow-sm"
                            >
                                Заказы по моим товарам
                            </Link>
                            <Link
                                to="/seller/stats"
                                className="px-4 py-2 rounded-full border text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 shadow-sm"
                            >
                                Статистика по заказам
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900">
                            Аватар
                        </h2>
                        <div className="flex items-start gap-4">
                            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-200">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : profile.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                        Нет фото
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Загрузить новый
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => onPickAvatar(e.target.files?.[0] || null)}
                                    className="text-sm"
                                />
                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        onClick={doUploadAvatar}
                                        disabled={uploading || !avatarFile}
                                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {uploading ? 'Загрузка…' : 'Обновить'}
                                    </button>
                                    <button
                                        onClick={doDeleteAvatar}
                                        disabled={deletingAvatar || (!profile.avatarUrl && !avatarPreview)}
                                        className="px-3 py-1.5 rounded-lg border text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        {deletingAvatar ? 'Удаление…' : 'Удалить аватар'}
                                    </button>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    Рекомендуемый формат: JPG/PNG, до 5 МБ
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                        <h2 className="text-lg font-semibold mb-2 text-gray-900">
                            Текущий профиль
                        </h2>
                        {loading ? (
                            <div className="text-gray-500 text-sm">Загрузка…</div>
                        ) : (
                            <div className="text-sm text-gray-700 space-y-1">
                                <div>
                                    <span className="text-gray-500">Название:</span>{' '}
                                    <span className="font-medium">
                                        {profile.companyName || '—'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Описание:</span>{' '}
                                    <span>
                                        {profile.description || '—'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}