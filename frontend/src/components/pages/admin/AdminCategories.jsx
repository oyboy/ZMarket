import React, { useEffect, useMemo, useState } from 'react';
import {
    getAllCategories,
    getCategoryTree,
    createCategory,
    updateCategory,
    deleteCategory
} from '../../../services/categories';

const CategoryFormModal = ({ open, initial, parents, onClose, onSubmit, saving }) => {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [parentId, setParentId] = useState('');

    useEffect(() => {
        if (!open) return;
        setName(initial?.name || '');
        setSlug(initial?.slug || '');
        setParentId(
            initial?.parentId != null ? String(initial.parentId) : ''
        );
    }, [open, initial]);

    if (!open) return null;

    const canSave = name.trim().length > 0 && !saving;

    const submit = () => {
        if (!canSave) return;
        onSubmit({
            name: name.trim(),
            slug: slug.trim() || null,
            parentId: parentId === '' ? null : Number(parentId)
        });
    };

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            <div className="relative max-w-lg w-full bg-white rounded-lg shadow-xl mx-auto mt-24 p-6">
                <h3 className="text-lg font-semibold mb-4">
                    {initial ? 'Редактировать категорию' : 'Новая категория'}
                </h3>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm mb-1">Название</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Напр. Смартфоны"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Slug (опционально)</label>
                        <input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="napr-smartfony"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Родитель</label>
                        <select
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">— Без родителя —</option>
                            {parents.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Если нужна древовидная структура — выбери родителя.
                        </p>
                    </div>
                </div>

                <div className="mt-5 flex items-center gap-2 justify-end">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Отмена</button>
                    <button
                        onClick={submit}
                        disabled={!canSave}
                        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                    >
                        {saving ? 'Сохранение…' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function AdminCategories() {
    const token = useMemo(() => localStorage.getItem('jwtToken'), []);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tree, setTree] = useState([]);
    const [treeOpen, setTreeOpen] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const load = async () => {
        setLoading(true);
        setErr('');
        try {
            const [list, t] = await Promise.all([
                getAllCategories(token),
                getCategoryTree(token).catch(() => [])
            ]);
            setRows(Array.isArray(list) ? list : []);
            setTree(Array.isArray(t) ? t : []);
        } catch (e) {
            setErr(e.message || 'Ошибка загрузки категорий');
            setRows([]);
            setTree([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // один раз

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (row) => { setEditing(row); setModalOpen(true); };
    const closeModal = () => setModalOpen(false);

    const parentsOptions = useMemo(() => {
        // нельзя выбрать самого себя как родителя
        const excludeId = editing?.id;
        return rows
            .filter(r => r.id !== excludeId)
            .map(r => ({ id: r.id, name: r.name || r.title || `Категория ${r.id}` }));
    }, [rows, editing?.id]);

    const saveCategory = async (payload) => {
        setSaving(true);
        try {
            if (editing) {
                await updateCategory(editing.id, payload, token);
            } else {
                await createCategory(payload, token);
            }
            closeModal();
            await load();
        } catch (e) {
            alert(e.message || 'Ошибка сохранения категории');
        } finally {
            setSaving(false);
        }
    };

    const removeCategory = async (row) => {
        if (!window.confirm(`Удалить категорию «${row.name || row.id}»?`)) return;
        try {
            await deleteCategory(row.id, token);
            await load();
        } catch (e) {
            alert(e.message || 'Ошибка удаления. Возможно, у категории есть дочерние элементы или товары.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Категории</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setTreeOpen(v => !v)} className="px-3 py-1.5 border rounded">
                        {treeOpen ? 'Скрыть дерево' : 'Показать дерево'}
                    </button>
                    <button onClick={openCreate} className="px-3 py-1.5 rounded bg-blue-600 text-white">
                        + Новая категория
                    </button>
                </div>
            </div>

            {err && <div className="mb-3 text-red-600">{err}</div>}

            {treeOpen && (
                <div className="mb-6 p-4 border rounded">
                    <h2 className="font-semibold mb-2">Дерево</h2>
                    <CategoryTree nodes={tree} />
                </div>
            )}

            {loading ? (
                <div>Загрузка…</div>
            ) : rows.length === 0 ? (
                <div className="text-gray-600">Категорий пока нет</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 border">ID</th>
                            <th className="p-2 border">Название</th>
                            <th className="p-2 border">Slug</th>
                            <th className="p-2 border">Родитель</th>
                            <th className="p-2 border w-40">Действия</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((r) => (
                            <tr key={r.id}>
                                <td className="p-2 border font-mono">{r.id}</td>
                                <td className="p-2 border">{r.name || '—'}</td>
                                <td className="p-2 border">{r.slug || '—'}</td>
                                <td className="p-2 border">{r.parentId ?? '—'}</td>
                                <td className="p-2 border">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEdit(r)} className="px-2 py-1 rounded border">Редакт.</button>
                                        <button onClick={() => removeCategory(r)} className="px-2 py-1 rounded bg-red-600 text-white">Удалить</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            <CategoryFormModal
                open={modalOpen}
                initial={editing}
                parents={parentsOptions}
                onClose={closeModal}
                onSubmit={saveCategory}
                saving={saving}
            />
        </div>
    );
}

function CategoryTree({ nodes }) {
    if (!Array.isArray(nodes) || nodes.length === 0) return <div className="text-sm text-gray-500">Пусто</div>;
    return (
        <ul className="list-disc pl-6 space-y-1">
            {nodes.map((n) => (
                <li key={n.id}>
                    <span className="font-medium">{n.name || `Категория ${n.id}`}</span> {n.slug ? <span className="text-xs text-gray-500">({n.slug})</span> : null}
                    {Array.isArray(n.children) && n.children.length > 0 && (
                        <div className="mt-1">
                            <CategoryTree nodes={n.children} />
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}