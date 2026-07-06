import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { FormSchema, Question, QuestionType, QuestionOption } from './types';
import { api } from './api';
import { BANNER_PATHS } from './constants/banners';
import type { BannerOption } from './constants/banners';
import Toast from './components/Toast';

const OPTION_BASED_TYPES: QuestionType[] = ['multiple_choice', 'checkbox', 'dropdown'];

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Short Answer',
  long_text: 'Paragraph',
  multiple_choice: 'Multiple Choice',
  checkbox: 'Checkboxes',
  dropdown: 'Dropdown',
  signature: 'Signature',
};

function newQuestion(type: QuestionType): Question {
  return {
    id: crypto.randomUUID(),
    type,
    label: '',
    required: false,
    options: OPTION_BASED_TYPES.includes(type)
      ? [{ id: crypto.randomUUID(), label: 'Option 1' }]
      : undefined,
  };
}

export default function FormBuilder() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;
    api.getForm(formId)
      .then(data => setForm(data))
      .catch(() => setError('Could not load this form.'))
      .finally(() => setLoading(false));
  }, [formId]);

  const handleSave = async () => {
    if (!form || !formId) return;
    try {
      setSaving(true);
      const updated = await api.updateForm(formId, form);
      setForm(updated);
      setLastSaved(new Date());
    } catch {
      setError('Could not save. Check your backend server.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!formId) return;
    const link = `${window.location.origin}/respond/${formId}`;
    await navigator.clipboard.writeText(link);
    setToastMessage('Responder link copied to clipboard.');
  };

  const updateForm = (patch: Partial<FormSchema>) => {
    if (!form) return;
    setForm({ ...form, ...patch });
  };

  const setBanner = (banner: BannerOption | null) => {
    updateForm({ banner });
  };

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    if (!form) return;
    setForm({
      ...form,
      questions: form.questions.map(q => (q.id === id ? { ...q, ...patch } : q)),
    });
  };

  const addQuestion = (type: QuestionType) => {
    if (!form) return;
    setForm({ ...form, questions: [...form.questions, newQuestion(type)] });
  };

  const removeQuestion = (id: string) => {
    if (!form) return;
    setForm({ ...form, questions: form.questions.filter(q => q.id !== id) });
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    if (!form) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= form.questions.length) return;
    const updated = [...form.questions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setForm({ ...form, questions: updated });
  };

  const addOption = (questionId: string) => {
    if (!form) return;
    setForm({
      ...form,
      questions: form.questions.map(q => {
        if (q.id !== questionId) return q;
        const options = q.options ?? [];
        const newOpt: QuestionOption = {
          id: crypto.randomUUID(),
          label: `Option ${options.length + 1}`,
        };
        return { ...q, options: [...options, newOpt] };
      }),
    });
  };

  const updateOption = (questionId: string, optionId: string, label: string) => {
    if (!form) return;
    setForm({
      ...form,
      questions: form.questions.map(q => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          options: (q.options ?? []).map(o => (o.id === optionId ? { ...o, label } : o)),
        };
      }),
    });
  };

  const removeOption = (questionId: string, optionId: string) => {
    if (!form) return;
    setForm({
      ...form,
      questions: form.questions.map(q => {
        if (q.id !== questionId) return q;
        return { ...q, options: (q.options ?? []).filter(o => o.id !== optionId) };
      }),
    });
  };

  if (loading) return <div style={{ padding: 32 }}>Loading form...</div>;
  if (error) return <div style={{ padding: 32, color: 'red' }}>{error}</div>;
  if (!form) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <button onClick={() => navigate('/admin')} className="gform-button gform-button-secondary">
            ← Back to Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastSaved && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button onClick={handleCopyLink} className="gform-button gform-button-secondary">
              Copy Responder Link
            </button>
            <button onClick={handleSave} disabled={saving} className="gform-button gform-button-primary">
              {saving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>

        {/* ---- Banner selector ---- */}
        <div className="gform-card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Banner (optional):
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => setBanner(null)}
              className="gform-button"
              style={{
                background: '#ffffff',
                border: form.banner === null ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              None
            </button>
            <button
              onClick={() => setBanner('option1')}
              style={{
                padding: 4,
                borderRadius: 6,
                cursor: 'pointer',
                border: form.banner === 'option1' ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: '#ffffff',
              }}
            >
              <img
                src={BANNER_PATHS.option1}
                alt="Banner option 1"
                style={{ display: 'block', height: 60, width: 'auto', borderRadius: 4 }}
              />
            </button>
            <button
              onClick={() => setBanner('option2')}
              style={{
                padding: 4,
                borderRadius: 6,
                cursor: 'pointer',
                border: form.banner === 'option2' ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: '#ffffff',
              }}
            >
              <img
                src={BANNER_PATHS.option2}
                alt="Banner option 2"
                style={{ display: 'block', height: 60, width: 'auto', borderRadius: 4 }}
              />
            </button>
          </div>
        </div>

        {/* ---- Title/description card ---- */}
        <div className="gform-card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div className="gform-header-strip" style={{ height: 14 }} />
          <div style={{ padding: '32px 32px 24px' }}>
            <input
              className="gform-line-input"
              value={form.title}
              onChange={e => updateForm({ title: e.target.value })}
              placeholder="Form title"
              style={{ fontSize: 30, fontWeight: 500, marginBottom: 16, border: 'none', padding: '8px 0' }}
            />
            <textarea
              className="gform-line-input"
              value={form.description ?? ''}
              onChange={e => updateForm({ description: e.target.value })}
              placeholder="Form description (optional)"
              style={{ resize: 'vertical', border: 'none', fontSize: 15 }}
              rows={2}
            />
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Admin email (responses will be sent here):{' '}
                <input
                  className="gform-box-input"
                  value={form.adminEmail}
                  onChange={e => updateForm({ adminEmail: e.target.value })}
                  placeholder="you@example.com"
                  style={{ display: 'inline-block', width: 240, marginTop: 6 }}
                />
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {form.questions.map((q, index) => (
            <div key={q.id} className="gform-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <input
                  className="gform-line-input"
                  value={q.label}
                  onChange={e => updateQuestion(q.id, { label: e.target.value })}
                  placeholder="Question text"
                  style={{ flex: 1, minWidth: 200, fontSize: 17 }}
                />
                <select
                  className="gform-box-input"
                  value={q.type}
                  onChange={e => {
                    const type = e.target.value as QuestionType;
                    updateQuestion(q.id, {
                      type,
                      options: OPTION_BASED_TYPES.includes(type)
                        ? (q.options ?? [{ id: crypto.randomUUID(), label: 'Option 1' }])
                        : undefined,
                    });
                  }}
                  style={{ width: 180 }}
                >
                  {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {OPTION_BASED_TYPES.includes(q.type) && (
                <div style={{ marginBottom: 16, paddingLeft: 8 }}>
                  {(q.options ?? []).map(opt => (
                    <div key={opt.id} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {q.type === 'multiple_choice' ? '○' : q.type === 'checkbox' ? '☐' : '—'}
                      </span>
                      <input
                        className="gform-line-input"
                        value={opt.label}
                        onChange={e => updateOption(q.id, opt.id, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={() => removeOption(q.id, opt.id)}
                        style={{ color: '#d93025', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(q.id)}
                    style={{ fontSize: 13, color: 'var(--accent)', border: 'none', background: 'none', cursor: 'pointer', marginTop: 4 }}
                  >
                    + Add option
                  </button>
                </div>
              )}

              {q.type === 'signature' && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontStyle: 'italic' }}>
                  Responders will see a blank signature pad here to draw and sign.
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border)',
                  paddingTop: 16,
                  marginTop: 4,
                }}
              >
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                  />
                  Required
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => moveQuestion(index, -1)} disabled={index === 0} className="gform-button gform-button-secondary" style={{ padding: '8px 14px' }}>↑</button>
                  <button onClick={() => moveQuestion(index, 1)} disabled={index === form.questions.length - 1} className="gform-button gform-button-secondary" style={{ padding: '8px 14px' }}>↓</button>
                  <button onClick={() => removeQuestion(q.id)} className="gform-button gform-button-secondary" style={{ padding: '8px 14px', color: '#d93025' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="gform-card" style={{ marginTop: 24, padding: 24, borderStyle: 'dashed' }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14 }}>Add a question:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => addQuestion(value as QuestionType)}
                className="gform-button gform-button-secondary"
                style={{ padding: '10px 18px' }}
              >
                + {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}