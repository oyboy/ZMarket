import React, { useState } from 'react';
import { registerUser } from '../../../services/users';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pwdRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

const RegisterModal = ({ open, onClose, onRegistered }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const validate = () => {
        const { firstName, lastName, email, password, confirmPassword } = formData;

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            setError('Заполните все поля');
            return false;
        }
        if (!emailRe.test(email)) {
            setError('Некорректный формат email');
            return false;
        }
        if (password.length < 8 || password.length > 72) {
            setError('Пароль должен быть от 8 до 72 символов');
            return false;
        }
        if (!pwdRe.test(password)) {
            setError('Пароль должен содержать строчные, заглавные буквы и цифры');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return false;
        }
        if (!acceptedTerms) {
            setError('Необходимо принять условия пользовательского соглашения');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setError('');
        try {
            await registerUser(formData);
            onRegistered && onRegistered({
                email: formData.email,
                password: formData.password,
            });
            onClose && onClose();
        } catch (err) {
            setError(err.message || 'Ошибка регистрации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-height-screen min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/20 backdrop-blur-sm"
                    onClick={onClose}
                />

                <div className="inline-block align-bottom bg-white/95 backdrop-blur-md rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        type="button"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                            <span className="text-white text-2xl font-bold">Z</span>
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Создать аккаунт
                        </h2>
                        <p className="text-gray-600 mt-2">Присоединяйтесь к ZMarket сегодня</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 animate-shake">
                            <div className="flex items-center">
                                <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <span className="text-red-700 font-medium text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Имя
                                    </span>
                                </label>
                                <div className={`relative rounded-lg border-2 transition-all ${focusedField === 'firstName' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('firstName')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full px-4 py-3 bg-transparent focus:outline-none"
                                        placeholder="Ваше имя"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Фамилия
                                    </span>
                                </label>
                                <div className={`relative rounded-lg border-2 transition-all ${focusedField === 'lastName' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'}`}>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('lastName')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full px-4 py-3 bg-transparent focus:outline-none"
                                        placeholder="Ваша фамилия"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                    Email адрес *
                                </span>
                            </label>
                            <div className={`relative rounded-lg border-2 transition-all ${focusedField === 'email' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full px-4 py-3 bg-transparent focus:outline-none"
                                    placeholder="your@email.com"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Пароль *
                                    </span>
                                </label>
                                <div className={`relative rounded-lg border-2 transition-all ${focusedField === 'password' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full px-4 py-3 bg-transparent focus:outline-none"
                                        placeholder="Минимум 8 символов, A-z, 0-9"
                                        disabled={loading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Подтвердите пароль *
                                    </span>
                                </label>
                                <div className={`relative rounded-lg border-2 transition-all ${focusedField === 'confirmPassword' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('confirmPassword')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full px-4 py-3 bg-transparent focus:outline-none"
                                        placeholder="Повторите пароль"
                                        disabled={loading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="mt-1 mr-3 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                disabled={loading}
                            />
                            <label htmlFor="terms" className="text-sm text-gray-600">
                                Я принимаю{' '}
                                <a href="/terms" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                                    Условия использования
                                </a>{' '}
                                и{' '}
                                <a href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                                    Политику конфиденциальности
                                </a>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 group overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        <span>Регистрация...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        <span>Зарегистрироваться</span>
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/10 transition-all duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">
                                    Или продолжите с
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span>Facebook</span>
                            </button>
                            <button
                                type="button"
                                className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" />
                                </svg>
                                <span>Google</span>
                            </button>
                        </div>

                        <div className="text-center pt-4 border-t border-gray-100">
                            <p className="text-gray-600">
                                Уже есть аккаунт?{' '}
                                <button
                                    type="button"
                                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                                    onClick={onClose}
                                >
                                    Войти
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default RegisterModal;