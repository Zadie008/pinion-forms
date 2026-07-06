import axios from 'axios';
import type { FormSchema, FormResponse } from './types';

const API_BASE = import.meta.env.VITE_API_BASE;

export const api = {
  getForms: () =>
    axios.get<FormSchema[]>(`${API_BASE}/forms`).then(r => r.data),

  getForm: (id: string) =>
    axios.get<FormSchema>(`${API_BASE}/forms/${id}`).then(r => r.data),

  createForm: (form: Partial<FormSchema>) =>
    axios.post<FormSchema>(`${API_BASE}/forms`, form).then(r => r.data),

  updateForm: (id: string, form: Partial<FormSchema>) =>
    axios.put<FormSchema>(`${API_BASE}/forms/${id}`, form).then(r => r.data),

  deleteForm: (id: string) =>
    axios.delete(`${API_BASE}/forms/${id}`),

  submitResponse: (formId: string, answers: FormResponse['answers']) =>
    axios.post<FormResponse>(`${API_BASE}/forms/${formId}/responses`, { answers }).then(r => r.data),
};