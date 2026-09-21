import { useToastStore } from '../store/useToastStore'

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 rounded-full bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg shadow-black/10 animate-[toast-in_200ms_ease-out] dark:bg-slate-100 dark:text-slate-900"
        >
          <span>{toast.message}</span>
          {toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.()
                dismiss(toast.id)
              }}
              className="font-semibold text-blue-300 hover:underline dark:text-blue-600"
            >
              {toast.actionLabel ?? 'Undo'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
