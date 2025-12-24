import React, { useEffect, useState } from 'react';
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

// ===== модалка выбора категории =====
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
        setPath((prev) => [...prev, { id: node.id, name, children: node.children || [] }]);
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
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            <div className="relative max-w-3xl w-full bg-white rounded-lg shadow-xl mx-auto mt-16 p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Выбор категории</h3>
                    <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
                        Закрыть
                    </button>
                </div>

                {/* хлебные крошки */}
                <div className="mb-3 text-sm text-gray-700 flex flex-wrap gap-1">
                    {crumbs.map((c, i) => (
                        <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-400">/</span>}
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

                {/* поиск */}
                <div className="mb-4">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="Поиск по категориям (по названию или части пути)..."
                    />
                </div>

                {/* список */}
                {query ? (
                    <div className="max-h-[50vh] overflow-auto border rounded divide-y">
                        {searchResults.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">Ничего не найдено</div>
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
                        {(!currentLevelNodes || currentLevelNodes.length === 0) ? (
                            <div className="p-3 text-sm text-gray-500">Нет подкатегорий</div>
                        ) : (
                            currentLevelNodes.map((node) => {
                                const name = normalizeName(node);
                                const hasChildren = Array.isArray(node.children) && node.children.length > 0;
                                return (
                                    <div key={node.id} className="flex items-center justify-between px-3 py-2 text-sm">
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
                                                onClick={() => handleEnterNode(node)}
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
                    Нажми на название, чтобы выбрать категорию. Кнопка &quot;Внутрь&quot; позволяет спуститься в подкатегории.
                </div>
            </div>
        </div>
    );
};

// ===== атрибуты / превью =====
const emptyAttrRow = () => ({
    uid: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : String(Math.random()),
    key: '',
    type: 'string',
    value: ''
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

// ===== сама модалка товара =====
const ProductModal = ({
                          open,
                          isEdit,
                          loading,
                          formData,
                          onChange,
                          onSubmit,
                          onClose,
                          imageFile,
                          onImageChange
                      }) => {
    const [attrRows, setAttrRows] = useState([emptyAttrRow()]);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [categoriesTree, setCategoriesTree] = useState(null);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesError, setCategoriesError] = useState('');
    const [catPickerOpen, setCatPickerOpen] = useState(false);

    // инициализация атрибутов при открытии / смене товара
    useEffect(() => {
        if (!open) return;
        const attrs = formData?.attributes || {};
        const entries = Object.entries(attrs);
        if (entries.length === 0) {
            setAttrRows([emptyAttrRow()]);
        } else {
            const rows = entries.map(([k, v]) => ({
                uid: (typeof crypto !== 'undefined' && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : `${k}-${Math.random()}`,
                key: k,
                type: inferType(v),
                value: typeof v === 'boolean' ? String(v) : String(v ?? '')
            }));
            setAttrRows(rows);
        }
    }, [open, isEdit, formData?.productUUID]);

    // превью картинки
    useEffect(() => {
        if (!imageFile) { setPreviewUrl(null); return; }
        const url = URL.createObjectURL(imageFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);

    // загрузка категорий (дерева) при первом открытии
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
        return () => { alive = false; };
    }, [open, categoriesTree]);

    // поднятие атрибутов наверх при каждом изменении строк
    useEffect(() => {
        if (!open) return;
        const map = toAttributesMap(attrRows);
        onChange && onChange({ target: { name: 'attributes', value: map } });
    }, [attrRows, open, onChange]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0] || null;
        onImageChange && onImageChange(file);
    };

    const handleAttrChange = (i, field, val) => {
        setAttrRows(prev => {
            const next = [...prev];
            next[i] = { ...next[i], [field]: val };
            return next;
        });
    };

    const addAttrRow = () => setAttrRows(prev => [...prev, emptyAttrRow()]);
    const removeAttrRow = (i) => setAttrRows(prev => prev.filter((_, idx) => idx !== i));

    const canSubmit =
        !loading &&
        (formData?.title || '').trim().length > 0 &&
        (formData?.description || '').trim().length > 0 &&
        Number(formData?.price) > 0 &&
        Number(formData?.stock ?? 0) >= 0 &&
        formData?.categoryId != null &&
        formData?.categoryId !== '';

    const handleSave = () => {
        if (!canSubmit) return;
        onSubmit && onSubmit();
    };

    // подпись выбранной категории
    const selectedCategoryLabel = (() => {
        if (!formData?.categoryId) return 'Не выбрана';
        if (!categoriesTree || !Array.isArray(categoriesTree) || categoriesTree.length === 0) {
            return `ID: ${formData.categoryId}`;
        }
        const path = findPathById(categoriesTree, Number(formData.categoryId));
        return path ? buildPathLabel(path) : `ID: ${formData.categoryId}`;
    })();

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="sm:flex sm:items-start">
                        <div className="w-full">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                {isEdit ? 'Редактировать товар' : 'Добавить новый товар'}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title || ''}
                                        onChange={onChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Введите название товара"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                    <textarea
                                        name="description"
                                        value={formData.description || ''}
                                        onChange={onChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Описание товара"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price ?? ''}
                                            onChange={(e) =>
                                                onChange({
                                                    target: {
                                                        name: 'price',
                                                        value: e.target.value === '' ? '' : Number(e.target.value)
                                                    }
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                            min="0.01"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Остаток</label>
                                        <input
                                            type="number"
                                            name="stock"
                                            value={formData.stock ?? 0}
                                            onChange={(e) =>
                                                onChange({
                                                    target: {
                                                        name: 'stock',
                                                        value: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value))
                                                    }
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {/* Выбор категории из дерева */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                                    {categoriesLoading && (
                                        <div className="text-sm text-gray-500">Загрузка категорий…</div>
                                    )}
                                    {!categoriesLoading && categoriesError && (
                                        <div className="text-sm text-red-600 mb-1">{categoriesError}</div>
                                    )}
                                    {!categoriesLoading && categoriesTree && categoriesTree.length === 0 && (
                                        <div className="text-sm text-gray-500">
                                            Категории ещё не созданы. Попроси администратора добавить их в панели &quot;Категории&quot;.
                                        </div>
                                    )}
                                    {categoriesTree && categoriesTree.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setCatPickerOpen(true)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between text-sm"
                                        >
                      <span className={formData.categoryId ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.categoryId ? selectedCategoryLabel : 'Выберите категорию'}
                      </span>
                                            <span className="text-gray-400 text-xs">Изменить</span>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Атрибуты</label>
                                    <div className="space-y-2">
                                        {attrRows.map((row, i) => (
                                            <div key={row.uid} className="grid grid-cols-12 gap-2">
                                                <input
                                                    className="col-span-4 px-2 py-2 border rounded"
                                                    placeholder="Ключ (напр. color)"
                                                    value={row.key}
                                                    onChange={(e) => handleAttrChange(i, 'key', e.target.value)}
                                                />
                                                <select
                                                    className="col-span-3 px-2 py-2 border rounded"
                                                    value={row.type}
                                                    onChange={(e) => handleAttrChange(i, 'type', e.target.value)}
                                                >
                                                    <option value="string">string</option>
                                                    <option value="number">number</option>
                                                    <option value="boolean">boolean</option>
                                                </select>
                                                {row.type === 'boolean' ? (
                                                    <select
                                                        className="col-span-4 px-2 py-2 border rounded"
                                                        value={String(row.value)}
                                                        onChange={(e) => handleAttrChange(i, 'value', e.target.value)}
                                                    >
                                                        <option value="true">true</option>
                                                        <option value="false">false</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        className="col-span-4 px-2 py-2 border rounded"
                                                        placeholder="Значение"
                                                        value={row.value}
                                                        onChange={(e) => handleAttrChange(i, 'value', e.target.value)}
                                                    />
                                                )}
                                                <button
                                                    type="button"
                                                    className="col-span-1 text-red-600"
                                                    onClick={() => removeAttrRow(i)}
                                                    title="Удалить"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            className="px-3 py-1.5 border rounded text-sm"
                                            onClick={addAttrRow}
                                        >
                                            + Добавить атрибут
                                        </button>
                                    </div>
                                </div>

                                {/* Фото */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Фото товара</label>
                                    <input type="file" accept="image/*" onChange={handleImageChange} />
                                    {previewUrl && imageFile && (
                                        <div className="mt-2 flex items-center gap-3">
                                            <img
                                                src={previewUrl}
                                                alt=""
                                                className="w-16 h-16 object-cover rounded border"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            <p className="text-xs text-gray-500">Выбрано: {imageFile.name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!canSubmit}
                            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Сохранение...' : (isEdit ? 'Обновить товар' : 'Добавить товар')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            </div>

            <CategoryPickerModal
                open={catPickerOpen}
                tree={categoriesTree || []}
                value={formData.categoryId ? Number(formData.categoryId) : null}
                onClose={() => setCatPickerOpen(false)}
                onSelect={(id) => {
                    onChange && onChange({ target: { name: 'categoryId', value: id } });
                }}
            />
        </div>
    );
};

export default ProductModal;