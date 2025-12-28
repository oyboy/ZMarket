import React, { useEffect, useState } from 'react';
import {
    getPopularProducts,
    getPersonalRecommendations,
} from '../../services/recommendations';
import ProductCard from './ProductCard';

const RecommendationsSection = ({ token }) => {
    const [popular, setPopular] = useState([]);
    const [personal, setPersonal] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setErr('');
            try {
                const [pop, pers] = await Promise.all([
                    getPopularProducts(4).catch(() => []),
                    getPersonalRecommendations(8, token).catch(() => []),
                ]);
                if (!alive) return;
                setPopular(Array.isArray(pop) ? pop : []);
                setPersonal(Array.isArray(pers) ? pers : []);
            } catch (e) {
                if (!alive) return;
                setErr(e.message || 'Не удалось загрузить рекомендации');
                setPopular([]);
                setPersonal([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [token]);

    if (
        !loading &&
        !err &&
        personal.length === 0 &&
        popular.length === 0
    ) {
        return null;
    }

    return (
        <div className="mb-8">
            {personal.length > 0 && (
                <section className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-['Poppins']">
                                Рекомендуем вам
                            </h2>
                            <span className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100">
                                {personal.length} товаров
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {personal.map((p) => (
                            <ProductCard
                                key={p.productUUID || p.id}
                                product={p}
                                canManage={false}
                                onEdit={null}
                                showBuy={true}
                                showUpload={false}
                                onUpload={null}
                                onRequireAuth={null}
                                onSetMainAttachment={null}
                                onDeleteAttachment={null}
                                stockInfo={null}
                                onOpenStock={null}
                            />
                        ))}
                    </div>
                </section>
            )}

            {popular.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Популярные товары
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {popular.map((p) => (
                            <ProductCard
                                key={p.productUUID || p.id}
                                product={p}
                                canManage={false}
                                onEdit={null}
                                showBuy={true}
                                showUpload={false}
                                onUpload={null}
                                onRequireAuth={null}
                                onSetMainAttachment={null}
                                onDeleteAttachment={null}
                                stockInfo={null}
                                onOpenStock={null}
                            />
                        ))}
                    </div>
                </section>
            )}

            {loading && (
                <div className="mt-2 text-sm text-gray-500">
                    Загружаем рекомендации…
                </div>
            )}
            {err && (
                <div className="mt-2 text-sm text-red-600">
                    {err}
                </div>
            )}
        </div>
    );
};

export default RecommendationsSection;