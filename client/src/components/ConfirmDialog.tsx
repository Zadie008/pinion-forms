interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="gform-card"
        style={{
          maxWidth: 400,
          width: '100%',
          padding: 24,
          textAlign: 'left',
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>{title}</h2>
        <p style={{ marginBottom: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} className="gform-button gform-button-secondary">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="gform-button"
            style={{
              background: danger ? '#d93025' : 'var(--accent)',
              color: '#ffffff',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}