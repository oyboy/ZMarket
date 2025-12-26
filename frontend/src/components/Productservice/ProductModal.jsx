import React, { useEffect, useState, useRef } from 'react';
import { getCategoryTree } from '../../services/categories';

const normalizeName = (node) =>
    node.name || node.title || `Категория ${node.id}`;

const buildPathLabel = (path) =>
    path.map((p) => p.name).join(' / ');

const findPathById = (nodes, id, acc = []) => {
    if (!Array.isArray(nodes)) return null;
    for (const n of nodes) {
        const name = normalizeName(n);
        const next = [...acc, { id: n.id, name }];
        if (n.id === id) return next;
        if (Array.isArray(n.children) && n.children.length) {
            const found = findPathById(n.children, id, next);
            if (found) return found;
        }
    }
    return null;
};

const flattenForSearch = (nodes, accPath = []) => {
    const out = [];
    if (!Array.isArray(nodes)) return out;
    for (const n of nodes) {
        const name = normalizeName(n);
        const nextPath = [...accPath, { id: n.id, name }];
        out.push({
            id: n.id,
            label: buildPathLabel(nextPath),
            path: nextPath,
        });
        if (Array.isArray(n.children) && n.children.length) {
            out.push(...flattenForSearch(n.children, nextPath));
        }
    }
    return out;
};

const CategoryPickerModal = ({ open, tree, value, onClose, onSelect }) => {
    const [path, setPath] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!open) return;
        setSearch('');
        if (!Array.isArray(tree) || tree.length === 0 || !value) {
            setPath([]);
            return;
        }
        const p = findPathById(tree, value);
        setPath(p || []);
    }, [open, value, tree]);

    if (!open) return null;

    const currentLevelNodes =
        path.length > 0
            ? (path[path.length - 1].children || [])
            : (tree || []);

    const allForSearch = flattenForSearch(tree || []);
    const query = search.trim().toLowerCase();
    const searchResults = query
        ? allForSearch.filter((item) =>
            item.label.toLowerCase().includes(query)
        ).slice(0, 100)
        : [];

    const handlePick = (id) => {
        onSelect && onSelect(id);
        onClose && onClose();
    };

    const handleEnterNode = (node) => {
        const name = normalizeName(node);
        setPath((prev) => [
            ...prev,
            { id: node.id, name, children: node.children || [] },
        ]);
    };

    const handleBreadcrumbClick = (index) => {
        if (index < 0) {
            setPath([]);
        } else {
            setPath((prev) => prev.slice(0, index + 1));
        }
    };

    const crumbs = [
        { id: null, name: 'Все категории' },
        ...path.map((p) => ({ id: p.id, name: p.name })),
    ];

    return (
        <div className="fixed inset-0 z-[60]">
            {/* Бэкдроп */}
            <div
                className="fixed inset-0 bg-black/40"
                onClick={onClose}
            />
            {/* Контент модалки */}
            <div className="relative z-10 max-w-3xl w-full bg-white rounded-lg shadow-xl mx-auto mt-16 p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Выбор категории</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Закрыть
                    </button>
                </div>

                <div className="mb-3 text-sm text-gray-700 flex flex-wrap gap-1">
                    {crumbs.map((c, i) => (
                        <span key={i} className="flex items-center gap-1">
                            {i > 0 && (
                                <span className="text-gray-400">/</span>
                            )}
                            <button
                                type="button"
                                className="hover:underline"
                                onClick={() => handleBreadcrumbClick(i - 1)}
                            >
                                {c.name}
                            </button>
                        </span>
                    ))}
                </div>

                <div className="mb-4">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="Поиск по категориям (по названию или части пути)..."
                    />
                </div>

                {query ? (
                    <div className="max-h-[50vh] overflow-auto border rounded divide-y">
                        {searchResults.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">
                                Ничего не найдено
                            </div>
                        ) : (
                            searchResults.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handlePick(item.id)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                    {item.label}
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="max-h-[50vh] overflow-auto border rounded divide-y">
                        {!currentLevelNodes ||
                        currentLevelNodes.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">
                                Нет подкатегорий
                            </div>
                        ) : (
                            currentLevelNodes.map((node) => {
                                const name = normalizeName(node);
                                const hasChildren =
                                    Array.isArray(node.children) &&
                                    node.children.length > 0;
                                return (
                                    <div
                                        key={node.id}
                                        className="flex items-center justify-between px-3 py-2 text-sm"
                                    >
                                        <button
                                            type="button"
                                            className="text-left flex-1 hover:underline"
                                            onClick={() => handlePick(node.id)}
                                        >
                                            {name}
                                        </button>
                                        {hasChildren && (
                                            <button
                                                type="button"
                                                className="ml-3 text-xs text-blue-600 hover:underline"
                                                onClick={() =>
                                                    handleEnterNode(node)
                                                }
                                            >
                                                Внутрь
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                <div className="mt-3 text-xs text-gray-500">
                    Нажми на название, чтобы выбрать категорию. Кнопка
                    &quot;Внутрь&quot; позволяет спуститься в подкатегории.
                </div>
            </div>
        </div>
    );
};

const emptyAttrRow = () => ({
    uid:
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Math.random()),
    key: '',
    type: 'string',
    value: '',
});

const inferType = (v) => {
    if (typeof v === 'number') return 'number';
    if (typeof v === 'boolean') return 'boolean';
    return 'string';
};

const toAttributesMap = (rows) => {
    const out = {};
    rows.forEach(({ key, type, value }) => {
        const k = (key || '').trim();
        if (!k) return;
        if (type === 'number') {
            const n = Number(value);
            out[k] = Number.isFinite(n) ? n : value;
        } else if (type === 'boolean') {
            out[k] = String(value).toLowerCase() === 'true';
        } else {
            out[k] = value;
        }
    });
    return out;
};

const ProductModal = ({
                          open,
                          isEdit,
                          loading,
                          formData,
                          onChange,
                          onSubmit,
                          onClose,
                          imageFile,
                          onImageChange,
                      }) => {
    const [attrRows, setAttrRows] = useState([emptyAttrRow()]);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [categoriesTree, setCategoriesTree] = useState(null);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesError, setCategoriesError] = useState('');
    const [catPickerOpen, setCatPickerOpen] = useState(false);

    // Используем ref для onChange чтобы избежать бесконечного цикла
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    });

    useEffect(() => {
        if (!open) return;
        const attrs = formData?.attributes || {};
        const entries = Object.entries(attrs);
        if (entries.length === 0) {
            setAttrRows([emptyAttrRow()]);
        } else {
            const rows = entries.map(([k, v]) => ({
                uid:
                    typeof crypto !== 'undefined' && crypto.randomUUID
                        ? crypto.randomUUID()
                        : `${k}-${Math.random()}`,
                key: k,
                type: inferType(v),
                value:
                    typeof v === 'boolean'
                        ? String(v)
                        : String(v ?? ''),
            }));
            setAttrRows(rows);
        }
    }, [open, isEdit, formData?.productUUID]);

    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(imageFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);

    useEffect(() => {
        if (!open) return;
        if (categoriesTree !== null) return;
        let alive = true;
        (async () => {
            try {
                setCategoriesLoading(true);
                setCategoriesError('');
                const tree = await getCategoryTree();
                if (!alive) return;
                setCategoriesTree(Array.isArray(tree) ? tree : []);
            } catch (e) {
                if (!alive) return;
                setCategoriesTree([]);
                setCategoriesError(e.message || 'Ошибка загрузки категорий');
            } finally {
                if (alive) setCategoriesLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [open, categoriesTree]);

    // Используем ref вместо onChange в зависимостях
    useEffect(() => {
        if (!open) return;
        const map = toAttributesMap(attrRows);
        onChangeRef.current?.({ target: { name: 'attributes', value: map } });
    }, [attrRows, open]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0] || null;
        onImageChange && onImageChange(file);
    };

    const handleAttrChange = (i, field, val) => {
        setAttrRows((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], [field]: val };
            return next;
        });
    };

    const addAttrRow = () => setAttrRows((prev) => [...prev, emptyAttrRow()]);
    const removeAttrRow = (i) =>
        setAttrRows((prev) => prev.filter((_, idx) => idx !== i));

    const canSubmit =
        !loading &&
        (formData?.title || '').trim().length > 0 &&
        (formData?.description || '').trim().length > 0 &&
        Number(formData?.price) > 0 &&
        Number(formData?.stock ?? 0) >= 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit && onSubmit();
    };

    const selectedCategoryLabel = (() => {
        if (!formData?.categoryId) return 'Не выбрана';
        if (
            !categoriesTree ||
            !Array.isArray(categoriesTree) ||
            categoriesTree.length === 0
        ) {
            return `ID: ${formData.categoryId}`;
        }
        const path = findPathById(
            categoriesTree,
            Number(formData.categoryId)
        );
        return path ? buildPathLabel(path) : `ID: ${formData.categoryId}`;
    })();

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-80 overflow-y-auto">
            {/* Бэкдроп */}
            <div
                className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-blue-900/50 to-purple-900/60 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Контент модалки */}
            <div className="relative z-10 flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 pointer-events-none">
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full pointer-events-auto">
                    <div className="relative bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 p-6">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-white font-['Poppins']">
                                    {isEdit ? (
                                        <span className="flex items-center">
                                            <svg
                                                className="w-6 h-6 mr-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                            Редактировать товар
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <svg
                                                className="w-6 h-6 mr-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                />
                                            </svg>
                                            Добавить новый товар
                                        </span>
                                    )}
                                </h3>
                                <p className="text-blue-100 text-sm mt-1 font-['Inter']">
                                    {isEdit
                                        ? 'Обновите информацию о товаре'
                                        : 'Заполните информацию о новом товаре'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all duration-300"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-gradient-to-b from-white to-gray-50 max-h-[75vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                {/* Название товара */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                        <span className="flex items-center">
                                            <svg
                                                className="w-4 h-4 text-blue-500 mr-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                            Название товара *
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title || ''}
                                            onChange={onChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 font-['Inter']"
                                            placeholder="Введите название товара"
                                        />
                                        {formData.title && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                                    <svg
                                                        className="w-3 h-3 text-white"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={3}
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Описание товара */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                        <span className="flex items-center">
                                            <svg
                                                className="w-4 h-4 text-purple-500 mr-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                                />
                                            </svg>
                                            Описание товара *
                                        </span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description || ''}
                                        onChange={onChange}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 font-['Inter'] resize-none"
                                        placeholder="Детальное описание товара"
                                    />
                                </div>

                                {/* Цена и остаток */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                            <span className="flex items-center">
                                                <svg
                                                    className="w-4 h-4 text-green-500 mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                Цена (₽) *
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price ?? ''}
                                                onChange={(e) =>
                                                    onChange({
                                                        target: {
                                                            name: 'price',
                                                            value:
                                                                e.target.value === ''
                                                                    ? ''
                                                                    : Number(e.target.value),
                                                        },
                                                    })
                                                }
                                                min="0.01"
                                                step="0.01"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 font-['Inter']"
                                                placeholder="0.00"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                <div className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                                                    <span className="text-xs font-medium text-blue-600">
                                                        ₽
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                            <span className="flex items-center">
                                                <svg
                                                    className="w-4 h-4 text-orange-500 mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                                    />
                                                </svg>
                                                Остаток на складе
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="stock"
                                                value={formData.stock ?? 0}
                                                onChange={(e) =>
                                                    onChange({
                                                        target: {
                                                            name: 'stock',
                                                            value:
                                                                e.target.value === ''
                                                                    ? 0
                                                                    : Math.max(0, Number(e.target.value)),
                                                        },
                                                    })
                                                }
                                                min="0"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-300 font-['Inter']"
                                                placeholder="0"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                <div className="px-2 py-1 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                                                    <span className="text-xs font-medium text-orange-600">
                                                        шт.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Категория */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                        <span className="flex items-center">
                                            <svg
                                                className="w-4 h-4 text-pink-500 mr-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                                />
                                            </svg>
                                            Категория
                                        </span>
                                    </label>
                                    {categoriesLoading && (
                                        <div className="text-sm text-gray-500">
                                            Загрузка категорий…
                                        </div>
                                    )}
                                    {!categoriesLoading && categoriesError && (
                                        <div className="text-sm text-red-600 mb-1">
                                            {categoriesError}
                                        </div>
                                    )}
                                    {!categoriesLoading &&
                                        categoriesTree &&
                                        categoriesTree.length === 0 && (
                                            <div className="text-sm text-gray-500">
                                                Категории ещё не созданы.
                                            </div>
                                        )}
                                    {categoriesTree && categoriesTree.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setCatPickerOpen(true)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-300 font-['Inter'] bg-white flex items-center justify-between text-sm"
                                        >
                                            <span
                                                className={
                                                    formData.categoryId
                                                        ? 'text-gray-900'
                                                        : 'text-gray-400'
                                                }
                                            >
                                                {formData.categoryId
                                                    ? selectedCategoryLabel
                                                    : 'Выберите категорию'}
                                            </span>
                                            <span className="text-gray-400 text-xs">
                                                Изменить
                                            </span>
                                        </button>
                                    )}
                                    {formData.categoryId && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Выбрана категория ID {formData.categoryId}
                                        </p>
                                    )}
                                </div>

                                {/* Атрибуты */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                        Атрибуты
                                    </label>
                                    <div className="space-y-2">
                                        {attrRows.map((row, i) => (
                                            <div
                                                key={row.uid}
                                                className="grid grid-cols-12 gap-2"
                                            >
                                                <input
                                                    className="col-span-4 px-2 py-2 border rounded text-sm"
                                                    placeholder="Ключ"
                                                    value={row.key}
                                                    onChange={(e) =>
                                                        handleAttrChange(i, 'key', e.target.value)
                                                    }
                                                />
                                                <select
                                                    className="col-span-3 px-2 py-2 border rounded text-sm"
                                                    value={row.type}
                                                    onChange={(e) =>
                                                        handleAttrChange(i, 'type', e.target.value)
                                                    }
                                                >
                                                    <option value="string">string</option>
                                                    <option value="number">number</option>
                                                    <option value="boolean">boolean</option>
                                                </select>
                                                {row.type === 'boolean' ? (
                                                    <select
                                                        className="col-span-4 px-2 py-2 border rounded text-sm"
                                                        value={String(row.value)}
                                                        onChange={(e) =>
                                                            handleAttrChange(i, 'value', e.target.value)
                                                        }
                                                    >
                                                        <option value="true">true</option>
                                                        <option value="false">false</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        className="col-span-4 px-2 py-2 border rounded text-sm"
                                                        placeholder="Значение"
                                                        value={row.value}
                                                        onChange={(e) =>
                                                            handleAttrChange(i, 'value', e.target.value)
                                                        }
                                                    />
                                                )}
                                                <button
                                                    type="button"
                                                    className="col-span-1 text-red-600 hover:text-red-800"
                                                    onClick={() => removeAttrRow(i)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
                                            onClick={addAttrRow}
                                        >
                                            + Добавить атрибут
                                        </button>
                                    </div>
                                </div>

                                {/* Фото товара */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                        Фото товара
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="text-sm"
                                    />
                                    {previewUrl && imageFile && (
                                        <div className="mt-2 flex items-center gap-3">
                                            <img
                                                src={previewUrl}
                                                alt=""
                                                className="w-16 h-16 object-cover rounded border"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Выбрано: {imageFile.name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Кнопки */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="mt-3 sm:mt-0 w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 active:scale-95 shadow-sm font-['Inter']"
                                    >
                                        <span className="flex items-center justify-center space-x-2 text-gray-700">
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                            <span>Отмена</span>
                                        </span>
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-white transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-['Inter']"
                                    >
                                        <span className="flex items-center justify-center space-x-2">
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Сохранение...</span>
                                                </>
                                            ) : isEdit ? (
                                                <>
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                    <span>Обновить товар</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                        />
                                                    </svg>
                                                    <span>Добавить товар</span>
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Индикаторы заполнения */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className={`w-3 h-3 rounded-full ${
                                                formData.title
                                                    ? 'bg-green-500 animate-pulse'
                                                    : 'bg-gray-300'
                                            }`}
                                        />
                                        <span
                                            className={`font-medium ${
                                                formData.title
                                                    ? 'text-gray-900'
                                                    : 'text-gray-500'
                                            }`}
                                        >
                                            Название
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className={`w-3 h-3 rounded-full ${
                                                formData.description
                                                    ? 'bg-green-500 animate-pulse'
                                                    : 'bg-gray-300'
                                            }`}
                                        />
                                        <span
                                            className={`font-medium ${
                                                formData.description
                                                    ? 'text-gray-900'
                                                    : 'text-gray-500'
                                            }`}
                                        >
                                            Описание
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className={`w-3 h-3 rounded-full ${
                                                formData.price > 0
                                                    ? 'bg-green-500 animate-pulse'
                                                    : 'bg-gray-300'
                                            }`}
                                        />
                                        <span
                                            className={`font-medium ${
                                                formData.price > 0
                                                    ? 'text-gray-900'
                                                    : 'text-gray-500'
                                            }`}
                                        >
                                            Цена
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <CategoryPickerModal
                open={catPickerOpen}
                tree={categoriesTree || []}
                value={formData.categoryId ? Number(formData.categoryId) : null}
                onClose={() => setCatPickerOpen(false)}
                onSelect={(id) => {
                    onChange &&
                    onChange({
                        target: { name: 'categoryId', value: id },
                    });
                }}
            />
        </div>
    );
};

export default ProductModal;