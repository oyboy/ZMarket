import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StarRating from '../Shared/StarRating';
import { formatPrice } from '../../utils/format';
import { getProductRating } from '../../services/reviews';
import { addToCart } from '../../services/cart';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../Shared/ToastProvider';
import { getRolesFromToken } from '../../utils/jwt';

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

    const initialAvg = getRatingValue(product);
    const initialCnt = getRatingCount(product);

    const [avg, setAvg] = useState(initialAvg);
    const [count, setCount] = useState(initialCnt);
    const [ratingLoading, setRatingLoading] = useState(false);

    const token = useMemo(() => localStorage.getItem('jwtToken'), []);
    const roles = useMemo(() => (token ? getRolesFromToken(token) : []), [token]);
    const isUser = roles.includes('USER') || roles.includes('ROLE_USER');

    const productId = useMemo(() => product.productUUID || product.id, [product]);
    const navigate = useNavigate();

    const openDetails = (e) => {
        if (e.target.closest('[data-role="gallery-control"]')) return;
        if (!productId) return;
        navigate(`/product/${productId}`);
    };

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
        } catch { }
        return false;
    }, [fetchedAll, productId]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!inView) return;
            if (attachmentIds.length > 0) return;
            const ok = await fetchAllIds();
            if (!cancelled && !ok) { }
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
        } catch { }
    };

    const handleDelete = async () => {
        if (!imageId || !onDeleteAttachment) return;
        try {
            await onDeleteAttachment(product, imageId);
            setAttachmentIds(prev => prev.filter(id => id !== imageId));
            setCurrentIdx(i => Math.max(0, Math.min(i, attachmentIds.length - 2)));
        } catch { }
    };

    const [ratingLoadedOnce, setRatingLoadedOnce] = useState(false);

    const loadRating = useCallback(async () => {
        if (!productId) return;
        try {
            setRatingLoading(true);
            const r = await getProductRating(productId);
            const newAvg = Number(r?.avg ?? r?.average ?? 0);
            const newCnt = Number(r?.cnt ?? r?.count ?? 0);
            if (Number.isFinite(newAvg)) setAvg(newAvg);
            if (Number.isFinite(newCnt)) setCount(newCnt);
            setRatingLoadedOnce(true);
        } catch {
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
        <div ref={hostRef} className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200/50 hover:border-blue-200">
            {/* Акционные метки в стиле хедера */}
            {product.stock <= 5 && product.stock > 0 && (
                <div className="absolute top-3 left-3 z-30">
                    <div className="relative px-3 py-1.5 rounded-full font-semibold text-xs shadow-lg overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/0"></div>
                        <span className="relative z-10 text-white font-bold">Осталось {product.stock}</span>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            )}
            {product.stock === 0 && (
                <div className="absolute top-3 left-3 z-30">
                    <div className="relative px-3 py-1.5 rounded-full font-semibold text-xs shadow-lg overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700"></div>
                        <span className="relative z-10 text-white font-bold">Нет в наличии</span>
                    </div>
                </div>
            )}

            {/* Category badge */}
            {product.category && (
                <div className="absolute top-3 right-3 z-30">
                    <div className="relative px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                        <span className="text-xs font-medium text-blue-600">{product.category}</span>
                    </div>
                </div>
            )}

            {/* Image Container */}
            <div
                className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50 cursor-pointer"
                onClick={openDetails}
            >
                {imgSrc ? (
                    <>
                        <img
                            src={imgSrc}
                            alt={product.title}
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                            draggable={false}
                            loading="lazy"
                            onError={(e) => {
                                e.currentTarget.src = '';
                                e.currentTarget.alt = 'Изображение недоступно';
                            }}
                        />

                        {/* Overlay gradient on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {hasCarousel && (
                            <>
                                <div
                                    data-role="gallery-control"
                                    onClick={goPrev}
                                    className="absolute top-0 left-0 h-full w-1/3 z-10 cursor-pointer"
                                />
                                <div
                                    data-role="gallery-control"
                                    onClick={goNext}
                                    className="absolute top-0 right-0 h-full w-1/3 z-10 cursor-pointer"
                                />

                                <button
                                    type="button"
                                    data-role="gallery-control"
                                    onClick={goPrev}
                                    className="absolute top-1/2 -translate-y-1/2 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg backdrop-blur-sm"
                                    aria-label="Назад"
                                >
                                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    data-role="gallery-control"
                                    onClick={goNext}
                                    className="absolute top-1/2 -translate-y-1/2 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg backdrop-blur-sm"
                                    aria-label="Вперёд"
                                >
                                    <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                                    {attachmentIds.map((_, i) => (
                                        <span
                                            key={i}
                                            data-role="gallery-control"
                                            onClick={(e) => { e.stopPropagation(); setCurrentIdx(i); }}
                                            className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                                                i === currentIdx
                                                    ? 'w-6 bg-gradient-to-r from-blue-500 to-purple-500 shadow'
                                                    : 'w-2 bg-white/60 hover:bg-white/80'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {showUpload && imageId && (
                            <div className="absolute top-3 right-12 z-30 flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={handleSetMain}
                                    title="Сделать превью"
                                    className="bg-white/90 hover:bg-white backdrop-blur-sm text-amber-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    title="Удалить фото"
                                    className="bg-white/90 hover:bg-white backdrop-blur-sm text-red-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 mb-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-500">Нет изображения</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Title */}
                <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight group-hover:text-blue-600 transition-colors duration-300">
                    <Link to={`/product/${productId}`} className="hover:underline">
                        {product.title}
                    </Link>
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {product.description}
                </p>

                {/* Rating */}
                <div className="flex items-center mb-4">
                    <div className="flex items-center mr-3">
                        <StarRating rating={avg} size="sm" />
                        <span className="text-sm font-bold text-gray-800 ml-2">{avg.toFixed(1)}</span>
                    </div>
                    {ratingLoading ? (
                        <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span className="text-xs text-gray-400">загрузка...</span>
                        </div>
                    ) : count > 0 ? (
                        <span className="text-sm text-gray-500 font-medium">({count})</span>
                    ) : (
                        <span className="text-sm text-gray-400">Нет отзывов</span>
                    )}
                </div>

                {/* Price and Add to Cart */}
                <div className={`flex items-center ${showBuy ? 'justify-between' : 'justify-start'} mb-4`}>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {formatPrice(product.price)}
                        </span>
                        {product.oldPrice && (
                            <span className="text-sm text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
                        )}
                    </div>

                    {showBuy && isUser && (
                        <button
                            onClick={handleAddToCart}
                            className="relative px-5 py-2.5 rounded-xl font-medium transition-all duration-300 group overflow-hidden active:scale-95"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:from-blue-600 group-hover:to-purple-700"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <span className="relative z-10 flex items-center space-x-2 text-white font-semibold">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>В корзину</span>
                            </span>
                        </button>
                    )}
                </div>

                {/* Management Controls */}
                {(canManage || showUpload) && (
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                            {canManage && (
                                <button
                                    onClick={() => onEdit && onEdit(product)}
                                    className="relative px-4 py-2 rounded-lg font-medium transition-all duration-300 group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 group-hover:from-emerald-100 group-hover:to-green-100"></div>
                                    <div className="absolute inset-0 border border-emerald-200 rounded-lg group-hover:border-emerald-300"></div>
                                    <span className="relative z-10 flex items-center space-x-2 text-emerald-700 font-medium">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span>Редактировать</span>
                                    </span>
                                </button>
                            )}

                            {canManage && onOpenStock && (
                                <button
                                    onClick={() => onOpenStock(product)}
                                    className="relative px-4 py-2 rounded-lg font-medium transition-all duration-300 group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-50 to-indigo-50 group-hover:from-violet-100 group-hover:to-indigo-100"></div>
                                    <div className="absolute inset-0 border border-violet-200 rounded-lg group-hover:border-violet-300"></div>
                                    <span className="relative z-10 flex items-center space-x-2 text-violet-700 font-medium">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <span>Склад</span>
                                    </span>
                                </button>
                            )}

                            {showUpload && (
                                <>
                                    <input id={uploadInputId} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    <label
                                        htmlFor={uploadInputId}
                                        className="relative px-4 py-2 rounded-lg font-medium transition-all duration-300 group overflow-hidden cursor-pointer"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-blue-50 group-hover:from-gray-100 group-hover:to-blue-100"></div>
                                        <div className="absolute inset-0 border border-gray-200 rounded-lg group-hover:border-gray-300"></div>
                                        <span className="relative z-10 flex items-center space-x-2 text-gray-700 font-medium">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            <span>Загрузить фото</span>
                                        </span>
                                    </label>
                                </>
                            )}
                        </div>

                        {/* Stock Info for Admins */}
                        {canManage && stockInfo && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex flex-col p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                                        <span className="text-gray-600 mb-1">На складе</span>
                                        <span className="font-bold text-gray-900 text-sm">{stockInfo.available} шт.</span>
                                    </div>
                                    {typeof stockInfo.quantityReserved === 'number' && (
                                        <div className="flex flex-col p-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50">
                                            <span className="text-gray-600 mb-1">В резерве</span>
                                            <span className="font-bold text-amber-700 text-sm">{stockInfo.quantityReserved} шт.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom gradient line like in header */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
    );
};

export default ProductCard;