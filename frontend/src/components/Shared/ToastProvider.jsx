import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(1);

    const remove = useCallback((id) => {
        setToasts(t => t.filter(x => x.id !== id));
    }, []);

    const push = useCallback((payload) => {
        const id = idRef.current++;
        const t = { id, type: payload.type || 'info', title: payload.title, message: payload.message, duration: payload.duration ?? 4000 };
        setToasts(list => [...list, t]);
        if (t.duration > 0) {
            setTimeout(() => remove(id), t.duration);
        }
        return id;
    }, [remove]);

    const api = useMemo(() => ({
        show: push,
        success: (message, opts={}) => push({ ...opts, type: 'success', message }),
        error: (message, opts={}) => push({ ...opts, type: 'error', message }),
        info: (message, opts={}) => push({ ...opts, type: 'info', message }),
        warn: (message, opts={}) => push({ ...opts, type: 'warning', message }),
        remove,
    }), [push, remove]);

    return (
        <ToastCtx.Provider value={api}>
            {children}
            {createPortal(
                <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-2">
                    {toasts.map(t => (
                        <Toast key={t.id} toast={t} onClose={() => remove(t.id)} />
                    ))}
                </div>,
                document.body
            )}
        </ToastCtx.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastCtx);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
}

function Toast({ toast, onClose }) {
    const color = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-amber-600',
    }[toast.type] || 'bg-gray-800';

    const Icon = () => {
        switch (toast.type) {
            case 'success': return (<svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586l-3.293-3.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" /></svg>);
            case 'error': return (<svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>);
            case 'warning': return (<svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>);
            default: return (<svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zM9 7h2v2H9V7zm0 4h2v4H9v-4z" /></svg>);
        }
    };

    return (
        <div className={`flex items-start gap-3 text-white shadow-lg rounded-lg px-4 py-3 ${color} animate-[fadeIn_.2s_ease]`}>
            <div className="mt-0.5"><Icon /></div>
            <div className="text-sm">
                {toast.title && <div className="font-semibold">{toast.title}</div>}
                {toast.message && <div>{toast.message}</div>}
            </div>
            <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
    );
}