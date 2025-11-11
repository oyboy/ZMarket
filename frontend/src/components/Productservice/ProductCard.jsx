import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StarRating from '../Shared/StarRating';
import { formatPrice } from '../../utils/format';

const PRODUCTS_API =
    process.env.REACT_APP_PRODUCTS_URL ||
    'http://localhost:8072/productservice/api/v1';

const extractAttachmentIds = (p) => {
    if (Array.isArray(p?.attachments) && p.attachments.length) {
        return p.attachments
            .map((a) => a?.gridFsId || a?.id || a)
            .filter(Boolean);
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
                         onUpload,                   // (product, file) => void
                         onRequireAuth,              // () => void
                         onSetMainAttachment,        // (product, attachmentId) => Promise<void>
                         onDeleteAttachment,         // (product, attachmentId) => Promise<void>
                     }) => {
    const rating = getRatingValue(product);
    const ratingCount = getRatingCount(product);

    const productId = useMemo(() => product.productUUID || product.id, [product]);
    const initialIds = useMemo(() => extractAttachmentIds(product), [product]);

    const [attachmentIds, setAttachmentIds] = useState(initialIds);
    const [fetchedAll, setFetchedAll] = useState(
        Array.isArray(product?.attachments) && product.attachments.length > 0
    );
    const [currentIdx, setCurrentIdx] = useState(0);

    // Ленивая загрузка превью по видимости
    const [hostRef, inView] = useInViewportOnce(0.2);
    const imageId = attachmentIds[currentIdx];
    const imgSrc = inView && imageId ? `${PRODUCTS_API}/products/${imageId}/attachments-fs` : null;

    // Подгрузить полный список вложений по требованию
    const fetchAllIds = useCallback(async () => {
        if (fetchedAll || !productId) return false;
        try {
            const res = await fetch(`${PRODUCTS_API}/products/${productId}/attachments`);
            if (!res.ok) return false;
            const list = await res.json();
            const ids = Array.isArray(list)
                ? list.map((a) => a?.gridFsId || a?.id).filter(Boolean)
                : [];
            if (ids.length) {
                setAttachmentIds(ids);
                setFetchedAll(true);
                setCurrentIdx((i) => Math.min(i, ids.length - 1));
                return true;
            }
        } catch (_) {}
        return false;
    }, [fetchedAll, productId]);

    // Если карточка видима и нет ни одного id — попробовать подтянуть хотя бы один
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!inView) return;
            if (attachmentIds.length > 0) return;
            const ok = await fetchAllIds();
            if (!cancelled && !ok) {
                // останется плейсхолдер
            }
        })();
        return () => { cancelled = true; };
    }, [inView, attachmentIds.length, fetchAllIds]);

    // Навигация по карусели
    const goPrev = useCallback(async (e) => {
        e?.stopPropagation?.();
        if (!fetchedAll && attachmentIds.length <= 1) {
            const ok = await fetchAllIds();
            if (!ok || attachmentIds.length <= 1) return;
        }
        setCurrentIdx((i) => (i - 1 + attachmentIds.length) % attachmentIds.length);
    }, [fetchedAll, attachmentIds.length, fetchAllIds]);

    const goNext = useCallback(async (e) => {
        e?.stopPropagation?.();
        if (!fetchedAll && attachmentIds.length <= 1) {
            const ok = await fetchAllIds();
            if (!ok || attachmentIds.length <= 1) return;
        }
        setCurrentIdx((i) => (i + 1) % attachmentIds.length);
    }, [fetchedAll, attachmentIds.length, fetchAllIds]);

    const hasCarousel = attachmentIds.length > 1;

    const uploadInputId = `upload-${productId}`;
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && onUpload) onUpload(product, file);
        e.target.value = '';
    };

    // Buy
    const handleBuy = () => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            onRequireAuth && onRequireAuth();
            return;
        }
        // TODO: реализовать покупку/добавление в корзину
    };

    // Управление текущим изображением (сделать превью, удалить)
    const handleSetMain = async () => {
        if (!imageId || !onSetMainAttachment) return;
        try {
            await onSetMainAttachment(product, imageId);
            // оптимистично ставим текущую первой
            setAttachmentIds((prev) => [imageId, ...prev.filter((id) => id !== imageId)]);
            setCurrentIdx(0);
        } catch { /* ignore */ }
    };

    const handleDelete = async () => {
        if (!imageId || !onDeleteAttachment) return;
        try {
            await onDeleteAttachment(product, imageId);
            setAttachmentIds((prev) => prev.filter((id) => id !== imageId));
            setCurrentIdx((i) => Math.max(0, Math.min(i, attachmentIds.length - 2)));
        } catch { /* ignore */ }
    };

    const EdgeOverlay = ({ side }) => (
        <div
            onClick={side === 'left' ? goPrev : goNext}
            className={`absolute top-0 ${side === 'left' ? 'left-0' : 'right-0'} h-full w-1/3 z-10 cursor-pointer
                  hover:bg-black/5 active:bg-black/10 transition-colors`}
            aria-label={side === 'left' ? 'Предыдущее изображение' : 'Следующее изображение'}
        />
    );

    const Arrow = ({ side }) => (
        <button
            type="button"
            onClick={side === 'left' ? goPrev : goNext}
            className={`absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-2' : 'right-2'}
                  opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 rounded-full p-2 shadow`}
            aria-label={side === 'left' ? 'Назад' : 'Вперёд'}
        >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {side === 'left'
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                }
            </svg>
        </button>
    );

    const Dots = () => (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
            {attachmentIds.map((_, i) => (
                <span
                    key={i}
                    onClick={async () => {
                        if (!fetchedAll && attachmentIds.length <= 1) {
                            const ok = await fetchAllIds();
                            if (!ok || attachmentIds.length <= 1) return;
                        }
                        setCurrentIdx(i);
                    }}
                    className={`h-1.5 rounded-full cursor-pointer transition-all ${
                        i === currentIdx ? 'w-4 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'
                    }`}
                />
            ))}
        </div>
    );

    return (
        <div ref={hostRef} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
            <div className="relative aspect-square overflow-hidden bg-gray-200">
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
                                <EdgeOverlay side="left" />
                                <EdgeOverlay side="right" />
                                <Arrow side="left" />
                                <Arrow side="right" />
                                <Dots />
                            </>
                        )}

                        {showUpload && imageId && (
                            <div className="absolute top-2 right-2 z-30 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleSetMain}
                                    title="Сделать превью"
                                    className="bg-white/90 hover:bg-white text-yellow-600 rounded-full p-2 shadow"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    title="Удалить фото"
                                    className="bg-white/90 hover:bg-white text-red-600 rounded-full p-2 shadow"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3m-9 0h12" />
                                    </svg>
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
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{product.title}</h3>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                <div className="flex items-center mb-3">
                    <StarRating rating={rating} />
                    {rating > 0 ? (
                        <>
                            <span className="text-sm text-gray-700 ml-2">{rating.toFixed(1)}</span>
                            {ratingCount > 0 && <span className="text-sm text-gray-500 ml-1">({ratingCount})</span>}
                        </>
                    ) : (
                        <span className="text-sm text-gray-400 ml-2">Нет отзывов</span>
                    )}
                </div>

                <div className={`flex items-center ${showBuy ? 'justify-between' : 'justify-start'}`}>
                    <span className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                    {showBuy && (
                        <button
                            onClick={handleBuy}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Купить
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                    {canManage && (
                        <button
                            onClick={() => onEdit && onEdit(product)}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                        >
                            Редактировать
                        </button>
                    )}

                    {showUpload && (
                        <>
                            <input
                                id={uploadInputId}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <label
                                htmlFor={uploadInputId}
                                className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800"
                            >
                                Загрузить фото
                            </label>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;