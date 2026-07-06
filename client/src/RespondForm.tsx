import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { FormSchema, ResponseAnswer } from './types';
import { api } from './api';
import SignaturePad from './SignaturePad';
import { BANNER_PATHS } from './constants/banners';

export default function RespondForm() {
  const { formId } = useParams<{ formId: string }>();

  const [form, setForm] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!formId) return;
    api.getForm(formId)
      .then(setForm)
      .catch(() => setLoadError('This form could not be found. Check the link and try again.'))
      .finally(() => setLoading(false));
  }, [formId]);

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const toggleCheckbox = (questionId: string, optionLabel: string) => {
    setAnswers(prev => {
      const current = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
      const next = current.includes(optionLabel)
        ? current.filter(v => v !== optionLabel)
        : [...current, optionLabel];
      return { ...prev, [questionId]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !formId) return;

    for (const q of form.questions) {
      if (!q.required) continue;
      const val = answers[q.id];
      const isEmpty =
        val === undefined ||
        val === '' ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty) {
        setSubmitError(`Please answer: "${q.label || 'Untitled question'}"`);
        return;
      }
    }

    const payload: ResponseAnswer[] = form.questions.map(q => ({
      questionId: q.id,
      value: answers[q.id] ?? (q.type === 'checkbox' ? [] : ''),
    }));

    try {
      setSubmitting(true);
      setSubmitError(null);
      await api.submitResponse(formId, payload);
      setSubmitted(true);
    } catch {
      setSubmitError('Could not submit your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 32 }}>Loading form...</div>;
  if (loadError) return <div style={{ padding: 32, color: 'red' }}>{loadError}</div>;
  if (!form) return null;

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 16px' }}>
        <div
          className="gform-card"
          style={{ maxWidth: 640, margin: '0 auto', padding: 32, textAlign: 'center' }}
        >
          <h2 style={{ textAlign: 'center' }}>Thank you!</h2>
          <p style={{ textAlign: 'center' }}>Your response has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* ---- Header card ---- */}
        <div className="gform-card" style={{ marginBottom: 24, overflow: 'hidden' }}>
          {form.banner ? (
            <img
              src={BANNER_PATHS[form.banner]}
              alt=""
              style={{ display: 'block', width: '100%', height: 160, objectFit: 'cover' }}
            />
          ) : (
            <div className="gform-header-strip" />
          )}
          <div style={{ padding: 24 }}>
            <h1>{form.title || 'Untitled Form'}</h1>
            {form.description && <p>{form.description}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {form.questions.map(q => (
              <div key={q.id} className="gform-card" style={{ padding: 24 }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 12, fontSize: 15 }}>
                  {q.label || 'Untitled question'}
                  {q.required && <span style={{ color: '#d93025' }}> *</span>}
                </label>

                {q.type === 'short_text' && (
                  <input
                    className="gform-line-input"
                    value={(answers[q.id] as string) ?? ''}
                    onChange={e => setAnswer(q.id, e.target.value)}
                  />
                )}

                {q.type === 'long_text' && (
                  <textarea
                    className="gform-line-input"
                    value={(answers[q.id] as string) ?? ''}
                    onChange={e => setAnswer(q.id, e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                )}

                {q.type === 'multiple_choice' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(q.options ?? []).map(opt => (
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === opt.label}
                          onChange={() => setAnswer(q.id, opt.label)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'checkbox' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(q.options ?? []).map(opt => (
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                        <input
                          type="checkbox"
                          checked={Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt.label)}
                          onChange={() => toggleCheckbox(q.id, opt.label)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'dropdown' && (
                  <select
                    className="gform-box-input"
                    value={(answers[q.id] as string) ?? ''}
                    onChange={e => setAnswer(q.id, e.target.value)}
                  >
                    <option value="" disabled>Select an option</option>
                    {(q.options ?? []).map(opt => (
                      <option key={opt.id} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
                )}

                {q.type === 'signature' && (
                  <SignaturePad onChange={dataUrl => setAnswer(q.id, dataUrl)} />
                )}
              </div>
            ))}
          </div>

          {submitError && (
            <div style={{ color: '#d93025', marginTop: 16, fontSize: 14 }}>{submitError}</div>
          )}

          <div style={{ marginTop: 24 }}>
            <button type="submit" disabled={submitting} className="gform-button gform-button-primary">
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}