import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StarRating from '../Shared/StarRating';
import StarInput from '../Shared/StarInput';
import { formatPrice } from '../../utils/format';
import { getProductById, getProductAttachments, PRODUCTS_API } from '../../../src/services/products';
import { getProductRating, postReview, getProductReviews } from '../../../src/services/reviews';
import { getRolesFromToken } from '../../utils/jwt';

const Bar = ({ label, value, total }) => {
    const pct = total > 0 ? Math.round((value * 100) / total) : 0;
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="w-10 text-gray-600">{label}★</span>
            <div className="flex-1 bg-gray-200 rounded h-2 overflow-hidden">
                <div className="bg-yellow-400 h-2" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-10 text-right text-gray-600">{value}</span>
        </div>
    );
};

const maskUser = (id) => (id ? `${id.substring(0, 8)}…` : 'Пользователь');

const ProductDetails = ({ onRequireAuth }) => {
    const requireAuth = (typeof onRequireAuth === 'function') ? onRequireAuth : () => alert('Нужно войти');
    const { uuid } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    const [attachments, setAttachments] = useState([]);
    const [idx, setIdx] = useState(0);

    const [avg, setAvg] = useState(0);
    const [cnt, setCnt] = useState(0);
    const [b, setB] = useState({ b1:0, b2:0, b3:0, b4:0, b5:0 });
    const [ratingLoading, setRatingLoading] = useState(false);

    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [mark, setMark] = useState(0);
    const [text, setText] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitMsg, setSubmitMsg] = useState('');

    const token = useMemo(() => localStorage.getItem('jwtToken'), []);
    const roles = useMemo(() => (token ? getRolesFromToken(token) : []), [token]);
    const isUser = roles.includes('USER') || roles.includes('ROLE_USER');

    const imageId = attachments[idx]?.gridFsId || attachments[idx]?.id || attachments[idx] || product?.mainAttachmentId;
    const imgSrc = imageId ? `${PRODUCTS_API}/products/${imageId}/attachments-fs` : null;

    const PAGE_SIZE = 10;
    const [rvPage, setRvPage] = useState(0);
    const [rvHasMore, setRvHasMore] = useState(true);
    const [rvLoadingMore, setRvLoadingMore] = useState(false);

    const [sortKey, setSortKey] = useState('positive');
    const [onlyWithText, setOnlyWithText] = useState(false);

    const hasCreatedAt = useMemo(
        () => reviews.some(rv => rv.createdAt),
        [reviews]
    );

    const ts = (rv) => {
        const d = rv.createdAt ? new Date(rv.createdAt) : null;
        return d ? d.getTime() : 0;
    };
    const displayedReviews = useMemo(() => {
        let arr = Array.isArray(reviews) ? [...reviews] : [];
        if (onlyWithText) arr = arr.filter(rv => (rv.text || '').trim().length > 0);

        switch (sortKey) {
            case 'recent':
                if (hasCreatedAt) {
                    arr.sort((a, b) => ts(b) - ts(a));
                } else {
                    arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                }
                break;
            case 'negative':
                arr.sort((a, b) => (a.rating || 0) - (b.rating || 0));
                break;
            case 'positive':
            default:
                arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
        }
        return arr;
    }, [reviews, onlyWithText, sortKey, hasCreatedAt]);

    const loadMoreReviews = async () => {
        if (!rvHasMore || rvLoadingMore) return;
        setRvLoadingMore(true);
        try {
            const more = await getProductReviews(uuid, { limit: PAGE_SIZE, offset: rvPage * PAGE_SIZE });
            setReviews(prev => [...prev, ...more]);
            setRvPage(p => p + 1);
            setRvHasMore(more.length === PAGE_SIZE);
        } finally {
            setRvLoadingMore(false);
        }
    };

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setErr('');
                const prod = await getProductById(uuid);
                if (!alive) return;
                if (!prod) { setErr('Товар не найден'); return; }
                setProduct(prod);

                // отзывы первая страница
                setReviewsLoading(true);
                const pr = await getProductReviews(uuid, { limit: PAGE_SIZE, offset: 0 });
                if (!alive) return;
                setReviews(pr);
                setRvPage(1);
                setRvHasMore(pr.length === PAGE_SIZE);
                setReviewsLoading(false);

                // вложения + рейтинг
                const [attRes, ratRes] = await Promise.allSettled([
                    getProductAttachments(uuid),
                    getProductRating(uuid),
                ]);
                if (!alive) return;

                if (attRes.status === 'fulfilled') setAttachments(Array.isArray(attRes.value) ? attRes.value : []);
                if (ratRes.status === 'fulfilled') {
                    const data = ratRes.value || {};
                    const newAvg = Number(data?.avg ?? data?.average ?? 0);
                    const newCnt = Number(data?.cnt ?? data?.count ?? 0);
                    setAvg(Number.isFinite(newAvg) ? newAvg : 0);
                    setCnt(Number.isFinite(newCnt) ? newCnt : 0);
                    setB({
                        b1: Number(data?.b1 ?? 0),
                        b2: Number(data?.b2 ?? 0),
                        b3: Number(data?.b3 ?? 0),
                        b4: Number(data?.b4 ?? 0),
                        b5: Number(data?.b5 ?? 0),
                    });
                }
            } catch {
                setErr('Ошибка загрузки товара');
            } finally {
                setLoading(false);
                setRatingLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [uuid]);

    const handleBuy = () => {
        if (!token) { requireAuth(); return; }
        // TODO: корзина/заказ
    };

    const submitReview = async () => {
        if (!token) { requireAuth(); return; }
        if (mark < 1 || mark > 5) { setSubmitMsg('Поставьте оценку от 1 до 5'); return; }
        setSubmitLoading(true);
        setSubmitMsg('');
        try {
            const res = await postReview(uuid, { mark, text }, token);
            if (res.accepted) {
                setSubmitMsg('Отзыв принят. Рейтинг обновится через несколько секунд.');
                setTimeout(async () => {
                    try {
                        const [r, rv] = await Promise.all([
                            getProductRating(uuid),
                            getProductReviews(uuid, { limit: PAGE_SIZE, offset: 0 })
                        ]);
                        const newAvg = Number(r?.avg ?? r?.average ?? 0);
                        const newCnt = Number(r?.cnt ?? r?.count ?? 0);
                        setAvg(Number.isFinite(newAvg) ? newAvg : avg);
                        setCnt(Number.isFinite(newCnt) ? newCnt : cnt);
                        setB({
                            b1: Number(r?.b1 ?? 0), b2: Number(r?.b2 ?? 0), b3: Number(r?.b3 ?? 0),
                            b4: Number(r?.b4 ?? 0), b5: Number(r?.b5 ?? 0),
                        });
                        setReviews(Array.isArray(rv) ? rv : []);
                        setRvPage(1);
                        setRvHasMore((rv || []).length === PAGE_SIZE);
                    } catch {}
                }, 2500);
            }
        } catch (e) {
            setSubmitMsg(e.message === 'UNAUTHORIZED' ? 'Нужно войти' : 'Не удалось отправить отзыв');
            if (e.message === 'UNAUTHORIZED') requireAuth();
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) {
        return (<div className="max-w-7xl mx-auto p-6">Загрузка…</div>);
    }
    if (err || !product) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline mb-4">Назад</button>
                <div className="text-red-600">{err || 'Товар не найден'}</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline mb-4">Назад</button>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-6">
                    <div className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                        {imgSrc ? (
                            <img src={imgSrc} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">Нет фото</div>
                        )}
                        {attachments.length > 1 && (
                            <>
                                <button onClick={() => setIdx(i => (i - 1 + attachments.length) % attachments.length)} className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button onClick={() => setIdx(i => (i + 1) % attachments.length)} className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </>
                        )}
                    </div>
                    {attachments.length > 1 && (
                        <div className="mt-3 grid grid-cols-5 gap-2">
                            {attachments.map((a, i) => {
                                const id = a?.gridFsId || a?.id || a;
                                return (
                                    <button key={id} onClick={() => setIdx(i)} className={`aspect-square rounded overflow-hidden border ${i === idx ? 'border-blue-600' : 'border-transparent'}`}>
                                        <img src={`${PRODUCTS_API}/products/${id}/attachments-fs`} alt="" className="w-full h-full object-cover" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="col-span-12 lg:col-span-6">
                    <h1 className="text-2xl font-bold">{product.title}</h1>

                    <div className="mt-2 flex items-center gap-2">
                        <StarRating rating={avg} />
                        {!ratingLoading && cnt > 0 && <span className="text-sm text-gray-600">{avg.toFixed(1)} · {cnt} отзыв(ов)</span>}
                        {ratingLoading && <span className="text-xs text-gray-400">обновляем…</span>}
                    </div>

                    <div className="mt-4 text-3xl font-semibold">{formatPrice(product.price)}</div>
                    <div className="mt-2 text-sm text-gray-600">Статус: {product.stock > 0 ? 'В наличии' : 'Нет в наличии'}</div>
                    <div className="mt-2 text-sm text-gray-600">Продавец: {product.seller_id || product.sellerId || '—'}</div>

                    <div className="mt-6 flex items-center gap-3">
                        {isUser && (
                            <button onClick={() => { if (!token) requireAuth(); else {/* TODO */} }} className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">Купить</button>
                        )}
                        <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="px-5 py-2 rounded border">Поделиться</button>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-semibold mb-2">Описание</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{product.description || '—'}</p>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-semibold mb-2">Характеристики</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">UUID</span><span className="font-mono">{uuid}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Остаток</span><span>{product.stock}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Продавец</span><span className="font-mono">{product.seller_id || product.sellerId || '—'}</span></div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-semibold mb-2">Распределение оценок</h2>
                        <div className="space-y-1">
                            <Bar label="5" value={b.b5} total={cnt} />
                            <Bar label="4" value={b.b4} total={cnt} />
                            <Bar label="3" value={b.b3} total={cnt} />
                            <Bar label="2" value={b.b2} total={cnt} />
                            <Bar label="1" value={b.b1} total={cnt} />
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-semibold mb-2">Оставить отзыв</h2>
                        {!showForm ? (
                            <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline">Написать отзыв</button>
                        ) : (
                            <div className="p-3 border rounded-lg bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">Ваша оценка:</span>
                                    <StarInput value={mark} onChange={setMark} />
                                </div>
                                <textarea className="mt-2 w-full border rounded-lg p-2 text-sm" rows={3} placeholder="Комментарий (необязательно)" value={text} onChange={(e) => setText(e.target.value)} />
                                <div className="mt-2 flex items-center gap-2">
                                    <button onClick={submitReview} disabled={submitLoading || mark < 1} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50">
                                        {submitLoading ? 'Отправка...' : 'Отправить'}
                                    </button>
                                    <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded border text-sm">Отмена</button>
                                    {submitMsg && <span className="text-xs text-gray-600">{submitMsg}</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-semibold mb-2">Отзывы</h2>

                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <label className="text-sm text-gray-600">Сортировка:</label>
                            <select
                                value={sortKey}
                                onChange={(e) => setSortKey(e.target.value)}
                                className="text-sm border rounded px-2 py-1"
                            >
                                <option value="positive">Сначала положительные</option>
                                <option value="negative">Сначала отрицательные</option>
                                <option value="recent" disabled={!hasCreatedAt}>Недавние</option>
                            </select>

                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={onlyWithText}
                                    onChange={(e) => setOnlyWithText(e.target.checked)}
                                />
                                Только с текстом
                            </label>
                        </div>

                        {reviewsLoading && <div className="text-sm text-gray-500">Загрузка отзывов…</div>}
                        {!reviewsLoading && displayedReviews.length === 0 && (
                            <div className="text-sm text-gray-500">Отзывов пока нет</div>
                        )}

                        {!reviewsLoading && displayedReviews.length > 0 && (
                            <div className="divide-y border rounded-lg">
                                {displayedReviews.map((rv) => (
                                    <div key={rv.id} className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <StarRating rating={Number(rv.rating || 0)} />
                                                <span className="text-sm text-gray-600">{Number(rv.rating || 0).toFixed(1)}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {rv.createdAt ? new Date(rv.createdAt).toLocaleString() : ''}
                                            </span>
                                        </div>
                                        {rv.text && <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{rv.text}</p>}
                                        <div className="mt-1 text-xs text-gray-500">{(rv.userId || '').substring(0, 8)}…</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {rvHasMore && (
                            <div className="mt-3">
                                <button
                                    onClick={loadMoreReviews}
                                    disabled={rvLoadingMore}
                                    className="px-3 py-1.5 rounded border text-sm"
                                >
                                    {rvLoadingMore ? 'Загрузка…' : 'Показать ещё'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;