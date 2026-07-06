import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormSchema } from './types';
import { api } from './api';
import Toast from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';

export default function AdminDashboard() {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await api.getForms();
      data.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setForms(data);
      setError(null);
    } catch (err) {
      setError('Could not load forms. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    const newForm = await api.createForm({
      title: 'Untitled Form',
      questions: [],
      adminEmail: 'you@example.com',
    });
    navigate(`/admin/edit/${newForm.id}`);
  };

  const requestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    await api.deleteForm(pendingDeleteId);
    setForms(prev => prev.filter(f => f.id !== pendingDeleteId));
    setPendingDeleteId(null);
    setToastMessage('Form deleted.');
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
  };

  const handleCopyLink = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/respond/${id}`;
    await navigator.clipboard.writeText(link);
    setToastMessage('Responder link copied to clipboard.');
  };

  if (loading) return <div style={{ padding: 32 }}>Loading forms...</div>;
  if (error) return <div style={{ padding: 32, color: 'red' }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <h1 style={{ margin: 0, flex: '1 1 auto', minWidth: 0 }}>Pinion Africa Forms</h1>
          <button
            onClick={handleCreateNew}
            className="gform-button gform-button-primary"
            style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            + Create New Form
          </button>
        </div>

        {forms.length === 0 ? (
          <div className="gform-card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 60 }}>
            No forms yet. Click "Create New Form" to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {forms.map(form => (
              <div
                key={form.id}
                onClick={() => navigate(`/admin/edit/${form.id}`)}
                className="gform-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'stretch',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  minHeight: 140,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0 }}>
                  <div style={{ width: 8, background: 'var(--accent)', flexShrink: 0 }} />
                  <div
                    style={{
                      padding: '28px 32px',
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 20 }}>
                      {form.title || 'Untitled Form'}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {form.questions.length} question{form.questions.length !== 1 ? 's' : ''} ·{' '}
                      Updated {new Date(form.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '24px 32px',
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={(e) => handleCopyLink(form.id, e)}
                    className="gform-button gform-button-secondary"
                    style={{ fontSize: 13, padding: '8px 16px' }}
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/responses/${form.id}`);
                    }}
                    className="gform-button gform-button-secondary"
                    style={{ fontSize: 13, padding: '8px 16px' }}
                  >
                    View Responses
                  </button>
                  <button
                    onClick={(e) => requestDelete(form.id, e)}
                    className="gform-button gform-button-secondary"
                    style={{ fontSize: 13, padding: '8px 16px', color: '#d93025' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingDeleteId && (
        <ConfirmDialog
          title="Delete this form?"
          message="This will permanently delete the form and cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}