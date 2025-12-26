import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Компания */}
                    <div className="col-span-1">
                        <h3 className="text-lg font-bold mb-4">ZMarket</h3>
                        <p className="text-gray-300 text-sm">
                            Гойда!
                        </p>
                    </div>

                    {/* Категории */}
                    <div className="col-span-1">
                        <h4 className="font-semibold mb-4">Категории</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/electronics" className="text-gray-300 hover:text-white transition">Электроника</a></li>
                            <li><a href="/clothing" className="text-gray-300 hover:text-white transition">Одежда</a></li>
                            <li><a href="/home" className="text-gray-300 hover:text-white transition">Дом и сад</a></li>
                            <li><a href="/sports" className="text-gray-300 hover:text-white transition">Спорт</a></li>
                            <li><a href="/books" className="text-gray-300 hover:text-white transition">Книги</a></li>
                        </ul>
                    </div>

                    {/* Помощь */}
                    <div className="col-span-1">
                        <h4 className="font-semibold mb-4">Помощь</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/help" className="text-gray-300 hover:text-white transition">Центр поддержки</a></li>
                            <li><a href="/contact" className="text-gray-300 hover:text-white transition">Контакты</a></li>
                            <li><a href="/shipping" className="text-gray-300 hover:text-white transition">Доставка</a></li>
                            <li><a href="/returns" className="text-gray-300 hover:text-white transition">Возвраты</a></li>
                            <li><a href="/faq" className="text-gray-300 hover:text-white transition">FAQ</a></li>
                        </ul>
                    </div>

                    {/* Контакты */}
                    <div className="col-span-1">
                        <h4 className="font-semibold mb-4">Контакты</h4>
                        <div className="space-y-2 text-sm text-gray-300">
                            <p>📞 +7 (999) 999-99-99</p>
                            <p>✉️ zgoyda@zmarket.ru</p>
                            <p>📍 Москва, ул. Гойдова, 1</p>
                        </div>

                        <div className="mt-4 flex space-x-4">
                            <a href="#" className="text-gray-300 hover:text-white transition" aria-label="Facebook">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-gray-300 hover:text-white transition" aria-label="Instagram">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.511-3.341-1.404-.893-.893-1.404-2.044-1.404-3.341s.511-2.448 1.404-3.341c.893-.893 2.044-1.404 3.341-1.404s2.448.511 3.341 1.404c.893.893 1.404 2.044 1.404 3.341s-.511 2.448-1.404 3.341c-.893.893-2.044 1.404-3.341 1.404z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-gray-300 hover:text-white transition" aria-label="Twitter">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.016 10.016 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.543l-.047-.02z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Нижняя часть */}
                <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-gray-300">
                        &copy; 2024 ZMarket. Все права защищены.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="/privacy" className="text-sm text-gray-300 hover:text-white transition">Политика конфиденциальности</a>
                        <a href="/terms" className="text-sm text-gray-300 hover:text-white transition">Условия использования</a>
                        <a href="/sitemap" className="text-sm text-gray-300 hover:text-white transition">Карта сайта</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;