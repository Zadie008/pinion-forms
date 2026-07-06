import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { FormSchema, FormResponse } from './types';
import { api } from './api';

const API_BASE = import.meta.env.VITE_API_BASE;

export default function ViewResponses() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormSchema | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;
    Promise.all([
      api.getForm(formId),
      axios.get<FormResponse[]>(`${API_BASE}/forms/${formId}/responses`).then(r => r.data),
    ])
      .then(([formData, responseData]) => {
        setForm(formData);
        setResponses(
          [...responseData].sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          )
        );
      })
      .catch(() => setError('Could not load responses.'))
      .finally(() => setLoading(false));
  }, [formId]);

  const downloadResponsePDF = (responseId: string) => {
    window.open(`${API_BASE}/forms/${formId}/responses/${responseId}/pdf`, '_blank');
  };

  const downloadAllCSV = () => {
    window.open(`${API_BASE}/forms/${formId}/responses/export/csv`, '_blank');
  };

  if (loading) return <div style={{ padding: 32 }}>Loading responses...</div>;
  if (error) return <div style={{ padding: 32, color: 'red' }}>{error}</div>;
  if (!form) return null;

  const questionLabel = (questionId: string) =>
    form.questions.find(q => q.id === questionId)?.label ?? 'Untitled question';

  const questionType = (questionId: string) =>
    form.questions.find(q => q.id === questionId)?.type;

  const isFullWidthAnswer = (questionId: string) => {
    const type = questionType(questionId);
    return type === 'signature' || type === 'long_text';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <button
          onClick={() => navigate('/admin')}
          className="gform-button gform-button-secondary"
          style={{ marginBottom: 20 }}
        >
          ← Back to Dashboard
        </button>

        <div className="gform-card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div className="gform-header-strip" />
          <div style={{ padding: '28px 32px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <h1 style={{ margin: 0 }}>{form.title}</h1>
              {responses.length > 0 && (
                <button
                  onClick={downloadAllCSV}
                  className="gform-button gform-button-primary"
                  style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  Download All (CSV)
                </button>
              )}
            </div>
            <p style={{ marginTop: 8 }}>
              {responses.length} response{responses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="gform-card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 60 }}>
            No responses yet. Share the responder link to start collecting answers.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {responses.map(response => (
              <div key={response.id} className="gform-card" style={{ padding: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Submitted {new Date(response.submittedAt).toLocaleString()}
                  </div>
                  <button
                    onClick={() => downloadResponsePDF(response.id)}
                    className="gform-button gform-button-secondary"
                    style={{ fontSize: 13, padding: '6px 14px' }}
                  >
                    Download PDF
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px 24px',
                  }}
                >
                  {response.answers.map(answer => (
                    <div
                      key={answer.questionId}
                      style={{
                        gridColumn: isFullWidthAnswer(answer.questionId) ? 'span 2' : 'span 1',
                        minWidth: 0,
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        {questionLabel(answer.questionId)}
                      </div>
                      {questionType(answer.questionId) === 'signature' && typeof answer.value === 'string' && answer.value ? (
                        <img
                          src={answer.value}
                          alt="Signature"
                          style={{ border: '1px solid var(--border)', borderRadius: 4, maxWidth: 300, display: 'block' }}
                        />
                      ) : (
                        <div style={{ color: 'var(--text)', fontSize: 15, wordBreak: 'break-word' }}>
                          {Array.isArray(answer.value) ? answer.value.join(', ') || '—' : answer.value || '—'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}