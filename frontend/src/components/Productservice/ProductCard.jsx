import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StarRating from '../Shared/StarRating';
import { formatPrice } from '../../utils/format';
import { getProductRating } from '../../services/reviews';
import { addToCart } from '../../services/cart';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../Shared/ToastProvider';

const PRODUCTS_API =
    process.env.REACT_APP_PRODUCTS_URL ||
    'http://localhost:8072/productservice/api/v1';

const extractAttachmentIds = (p) => {
    if (Array.isArray(p?.attachments) && p.attachments.length) {
        return p.attachments.map((a) => a?.gridFsId || a?.id || a).filter(Boolean);
    }
    if (p?.mainAttachmentId) return [p.mainAttachmentId];
    return [];
};

const getRatingValue = (p) => {
    const v = p?.rating ?? p?.ratingAverage ?? p?.avgRating ?? p?.averageRating ?? 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const getRatingCount = (p) => {
    const c = p?.ratingCount ?? p?.reviewsCount ?? p?.reviewCount ?? p?.ratingsCount ?? 0;
    const n = Number(c);
    return Number.isFinite(n) ? n : 0;
};

const useInViewportOnce = (threshold = 0.2) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el || visible) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    obs.disconnect();
                }
            },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [visible]);
    return [ref, visible];
};

const ProductCard = ({
                         product,
                         canManage,
                         onEdit,
                         showBuy = true,
                         showUpload = false,
                         onUpload,
                         onRequireAuth,
                         onSetMainAttachment,
                         onDeleteAttachment,
                         stockInfo,
                         onOpenStock
}) => {
    const requireAuth = typeof onRequireAuth === 'function' ? onRequireAuth : () => alert('Нужно войти');

    // --- rating из товара как базовый (fallback) ---
    const initialAvg = getRatingValue(product);
    const initialCnt = getRatingCount(product);

    const [avg, setAvg] = useState(initialAvg);
    const [count, setCount] = useState(initialCnt);
    const [ratingLoading, setRatingLoading] = useState(false);
    const [ratingError, setRatingError] = useState('');

    const productId = useMemo(() => product.productUUID || product.id, [product]);
    const navigate = useNavigate();
    const openDetails = (e) => {
        if (e.target.closest('[data-role="gallery-control"]')) return;
        if (!productId) return;
        navigate(`/product/${productId}`);
    };

    // --- images logic ---
    const initialIds = useMemo(() => extractAttachmentIds(product), [product]);
    const [attachmentIds, setAttachmentIds] = useState(initialIds);
    const [fetchedAll, setFetchedAll] = useState(Array.isArray(product?.attachments) && product.attachments.length > 0);
    const [currentIdx, setCurrentIdx] = useState(0);

    const [hostRef, inView] = useInViewportOnce(0.2);
    const imageId = attachmentIds[currentIdx];
    const imgSrc = inView && imageId ? `${PRODUCTS_API}/products/${imageId}/attachments-fs` : null;

    const fetchAllIds = useCallback(async () => {
        if (fetchedAll || !productId) return false;
        try {
            const res = await fetch(`${PRODUCTS_API}/products/${productId}/attachments`);
            if (!res.ok) return false;
            const list = await res.json();
            const ids = Array.isArray(list) ? list.map(a => a?.gridFsId || a?.id).filter(Boolean) : [];
            if (ids.length) {
                setAttachmentIds(ids);
                setFetchedAll(true);
                setCurrentIdx(i => Math.min(i, ids.length - 1));
                return true;
            }
        } catch {}
        return false;
    }, [fetchedAll, productId]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!inView) return;
            if (attachmentIds.length > 0) return;
            const ok = await fetchAllIds();
            if (!cancelled && !ok) {
                // оставим плейсхолдер
            }
        })();
        return () => { cancelled = true; };
    }, [inView, attachmentIds.length, fetchAllIds]);

    const goPrev = useCallback(async (e) => {
        e?.stopPropagation?.();
        if (!fetchedAll && attachmentIds.length <= 1) {
            const ok = await fetchAllIds();
            if (!ok || attachmentIds.length <= 1) return;
        }
        setCurrentIdx(i => (i - 1 + attachmentIds.length) % attachmentIds.length);
    }, [fetchedAll, attachmentIds.length, fetchAllIds]);

    const goNext = useCallback(async (e) => {
        e?.stopPropagation?.();
        if (!fetchedAll && attachmentIds.length <= 1) {
            const ok = await fetchAllIds();
            if (!ok || attachmentIds.length <= 1) return;
        }
        setCurrentIdx(i => (i + 1) % attachmentIds.length);
    }, [fetchedAll, attachmentIds.length, fetchAllIds]);

    const hasCarousel = attachmentIds.length > 1;

    const uploadInputId = `upload-${productId}`;
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && onUpload) onUpload(product, file);
        e.target.value = '';
    };

    const toast = useToast();

    const handleAddToCart = async () => {
        const token = localStorage.getItem('jwtToken');
        if (!token) { requireAuth(); return; }
        try {
            await addToCart(productId, 1);
            toast.success('Добавлено в корзину');
        } catch (e) {
            toast.error(e.message || 'Не удалось добавить в корзину');
        }
    };

    const handleSetMain = async () => {
        if (!imageId || !onSetMainAttachment) return;
        try {
            await onSetMainAttachment(product, imageId);
            setAttachmentIds(prev => [imageId, ...prev.filter(id => id !== imageId)]);
            setCurrentIdx(0);
        } catch {}
    };

    const handleDelete = async () => {
        if (!imageId || !onDeleteAttachment) return;
        try {
            await onDeleteAttachment(product, imageId);
            setAttachmentIds(prev => prev.filter(id => id !== imageId));
            setCurrentIdx(i => Math.max(0, Math.min(i, attachmentIds.length - 2)));
        } catch {}
    };

    // ===================== REVIEWS: загрузка рейтинга ======================
    const [ratingLoadedOnce, setRatingLoadedOnce] = useState(false);

    const loadRating = useCallback(async () => {
        if (!productId) return;
        try {
            setRatingLoading(true);
            setRatingError('');
            const r = await getProductRating(productId);
            const newAvg = Number(r?.avg ?? r?.average ?? 0);
            const newCnt = Number(r?.cnt ?? r?.count ?? 0);
            if (Number.isFinite(newAvg)) setAvg(newAvg);
            if (Number.isFinite(newCnt)) setCount(newCnt);
            setRatingLoadedOnce(true);
        } catch {
            setRatingError('Не удалось получить рейтинг');
        } finally {
            setRatingLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        if (inView && !ratingLoadedOnce) {
            loadRating();
        }
    }, [inView, ratingLoadedOnce, loadRating]);

    return (
        <div ref={hostRef} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
            <div className="relative aspect-square overflow-hidden bg-gray-200" onClick={openDetails} style={{ cursor: 'pointer' }}>
                {imgSrc ? (
                    <>
                        <img
                            src={imgSrc}
                            alt={product.title}
                            className="w-full h-full object-cover select-none"
                            draggable={false}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = ''; e.currentTarget.alt = 'Изображение недоступно'; }}
                        />
                        {hasCarousel && (
                            <>
                                <div data-role="gallery-control" onClick={goPrev} className="absolute top-0 left-0 h-full w-1/3 z-10 cursor-pointer hover:bg-black/5 active:bg-black/10 transition-colors" />
                                <div data-role="gallery-control" onClick={goNext} className="absolute top-0 right-0 h-full w-1/3 z-10 cursor-pointer hover:bg-black/5 active:bg-black/10 transition-colors" />
                                <button type="button" data-role="gallery-control" onClick={goPrev} className="absolute top-1/2 -translate-y-1/2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 rounded-full p-2 shadow" aria-label="Назад">
                                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button type="button" data-role="gallery-control" onClick={goNext} className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 rounded-full p-2 shadow" aria-label="Вперёд">
                                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
                                    {attachmentIds.map((_, i) => (
                                        <span key={i} data-role="gallery-control" onClick={(e) => { e.stopPropagation(); setCurrentIdx(i); }} className={`h-1.5 rounded-full cursor-pointer transition-all ${i === currentIdx ? 'w-4 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'}`} />
                                    ))}
                                </div>
                            </>
                        )}
                        {showUpload && imageId && (
                            <div className="absolute top-2 right-2 z-30 flex gap-2">
                                <button type="button" onClick={handleSetMain} title="Сделать превью" className="bg-white/90 hover:bg-white text-yellow-600 rounded-full p-2 shadow">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81л-2.8 2.034..." /></svg>
                                </button>
                                <button type="button" onClick={handleDelete} title="Удалить фото" className="bg-white/90 hover:bg-white text-red-600 rounded-full p-2 shadow">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7л-..." /></svg>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                )}

                {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium z-30">
                        Осталось {product.stock}
                    </div>
                )}
                {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                        <span className="text-white font-medium">Нет в наличии</span>
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                        <Link to={`/product/${productId}`} className="hover:underline">{product.title}</Link>
                    </h3>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                <div className="flex items-center mb-3">
                    <StarRating rating={avg} />
                    {ratingLoading && <span className="text-xs text-gray-400 ml-2">обновляем…</span>}
                    {!ratingLoading && avg > 0 ? (
                        <>
                            <span className="text-sm text-gray-700 ml-2">{avg.toFixed(1)}</span>
                            {count > 0 && <span className="text-sm text-gray-500 ml-1">({count})</span>}
                        </>
                    ) : (!ratingLoading && <span className="text-sm text-gray-400 ml-2">Нет отзывов</span>)}
                </div>

                <div className={`flex items-center ${showBuy ? 'justify-between' : 'justify-start'}`}>
                    <span className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                    {showBuy && (
                        <button onClick={handleAddToCart} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white">
                            В корзину
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                    {canManage && (
                        <button onClick={() => onEdit && onEdit(product)} className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white">
                            Редактировать
                        </button>
                    )}
                    {canManage && onOpenStock && (
                        <button onClick={() => onOpenStock(product)} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white">
                            Склад
                        </button>
                    )}
                    {showUpload && (
                        <>
                            <input id={uploadInputId} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            <label htmlFor={uploadInputId} className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800">
                                Загрузить фото
                            </label>
                        </>
                    )}
                    {canManage && stockInfo && (
                        <div className="mt-1 text-xs text-gray-600">
                            На складе: <span className="font-medium">{stockInfo.available}</span>
                            {typeof stockInfo.quantityReserved === 'number' && (
                            <span className="ml-2 text-gray-500">резерв: {stockInfo.quantityReserved}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;