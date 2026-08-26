import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategoryTree } from '../../services/categories';

// имя категории
const getName = (node) =>
    node.name || node.title || `Категория ${node.id}`;

// плоский список для поиска: "A / B / C"
const flattenForSearch = (nodes, acc = []) => {
    const res = [];
    if (!Array.isArray(nodes)) return res;
    for (const n of nodes) {
        const name = getName(n);
        const path = [...acc, name];
        res.push({ id: n.id, label: path.join(' / ') });
        if (Array.isArray(n.children) && n.children.length) {
            res.push(...flattenForSearch(n.children, path));
        }
    }
    return res;
};

const CatalogButton = () => {
    const [open, setOpen] = useState(false);
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const [path, setPath] = useState([]); // путь: [{id,name,children}, ...]
    const [search, setSearch] = useState('');

    const navigate = useNavigate();

    // грузим дерево один раз при первом открытии
    useEffect(() => {
        if (!open) return;
        if (tree.length) return;

        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setErr('');
                const data = await getCategoryTree(); // /api/v1/categories/tree
                if (!alive) return;
                setTree(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!alive) return;
                setErr(e.message || 'Ошибка загрузки категорий');
                setTree([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [open, tree.length]);

    const close = () => {
        setOpen(false);
        setSearch('');
        setPath([]);
    };

    const selectCategory = (id) => {
        close();
        navigate(`/products?categoryId=${id}`);
    };

    // текущий уровень: корень или дети последнего узла в path
    const currentLevelNodes = useMemo(() => {
        if (path.length === 0) return tree;
        const last = path[path.length - 1];
        return last.children || [];
    }, [tree, path]);

    // поиск по всему дереву
    const flat = useMemo(() => flattenForSearch(tree), [tree]);
    const q = search.trim().toLowerCase();
    const searchResults = useMemo(
        () => (q ? flat.filter(c => c.label.toLowerCase().includes(q)).slice(0, 100) : []),
        [flat, q]
    );

    // клик по элементу на текущем уровне
    const handleClickNode = (node) => {
        const hasChildren = Array.isArray(node.children) && node.children.length > 0;
        if (hasChildren) {
            // углубляемся на уровень ниже
            setPath(prev => [...prev, {
                id: node.id,
                name: getName(node),
                children: node.children || []
            }]);
        } else {
            // листовая категория — сразу выбираем
            selectCategory(node.id);
        }
    };

    // клик по хлебным крошкам
    const handleCrumbClick = (index) => {
        // index = -1 => "Все категории"
        if (index < 0) {
            setPath([]);
        } else {
            setPath(prev => prev.slice(0, index + 1));
        }
    };

    const crumbs = [
        { id: null, name: 'Все категории' },
        ...path.map(p => ({ id: p.id, name: p.name }))
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
                aria-expanded={open}
            >
                Категории
            </button>

            {open && (
                <div className="absolute z-50 mt-2 w-[360px] max-h-[70vh] bg-white border rounded-lg shadow-lg p-3">
                    {/* хлебные крошки */}
                    <div className="mb-2 text-xs text-gray-700 flex flex-wrap gap-1">
                        {crumbs.map((c, i) => (
                            <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-400">/</span>}
                                <button
                                    type="button"
                                    className="hover:underline"
                                    onClick={() => handleCrumbClick(i - 1)}
                                >
                  {c.name}
                </button>
              </span>
                        ))}
                    </div>

                    {/* поиск */}
                    <div className="mb-2">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border rounded text-sm"
                            placeholder="Поиск по категориям..."
                        />
                    </div>

                    {loading && <div className="text-sm text-gray-500 px-1 py-2">Загрузка...</div>}
                    {!loading && err && (
                        <div className="text-sm text-red-600 px-1 py-2">{err}</div>
                    )}

                    {!loading && !err && (
                        <>
                            {q ? (
                                // режим поиска
                                <div className="max-h-[50vh] overflow-auto border rounded divide-y">
                                    {searchResults.length === 0 ? (
                                        <div className="p-2 text-sm text-gray-500">Ничего не найдено</div>
                                    ) : (
                                        searchResults.map(item => (
                                            <button
                                                key={item.id}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                                onClick={() => selectCategory(item.id)}
                                            >
                                                {item.label}
                                            </button>
                                        ))
                                    )}
                                </div>
                            ) : (
                                // текущий уровень дерева
                                <div className="max-h-[50vh] overflow-auto border rounded divide-y">
                                    {(!currentLevelNodes || currentLevelNodes.length === 0) ? (
                                        <div className="p-2 text-sm text-gray-500">Нет подкатегорий</div>
                                    ) : (
                                        currentLevelNodes.map(node => {
                                            const name = getName(node);
                                            const hasChildren = Array.isArray(node.children) && node.children.length > 0;
                                            return (
                                                <button
                                                    key={node.id}
                                                    type="button"
                                                    onClick={() => handleClickNode(node)}
                                                    className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-left hover:bg-gray-50"
                                                >
                                                    <span>{name}</span>
                                                    {hasChildren && <span className="text-gray-400 text-xs">›</span>}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CatalogButton;