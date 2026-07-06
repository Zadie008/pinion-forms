import express from 'express';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { generateResponsePDF } from './utils/generatePDF';
import { sendResponseEmail } from './utils/sendEmail';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); 

const DB_FILE = path.join(__dirname, 'forms.json');

function readForms(): any[] {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeForms(forms: any[]) {
  fs.writeFileSync(DB_FILE, JSON.stringify(forms, null, 2));
}

app.get('/api/forms', (req, res) => {
  res.json(readForms());
});

app.get('/api/forms/:id', (req, res) => {
  const forms = readForms();
  const form = forms.find((f) => f.id === req.params.id);
  if (!form) return res.status(404).json({ error: 'Not found' });
  res.json(form);
});

app.post('/api/forms', (req, res) => {
  const forms = readForms();
  const now = new Date().toISOString();
  const newForm = {
    id: uuid(),
    createdAt: now,
    updatedAt: now,
    questions: [],
    ...req.body,
  };
  forms.push(newForm);
  writeForms(forms);
  res.json(newForm);
});

app.put('/api/forms/:id', (req, res) => {
  const forms = readForms();
  const idx = forms.findIndex((f) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  forms[idx] = { ...forms[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeForms(forms);
  res.json(forms[idx]);
});

app.delete('/api/forms/:id', (req, res) => {
  const forms = readForms().filter((f) => f.id !== req.params.id);
  writeForms(forms);
  res.json({ success: true });
});

const RESPONSES_FILE = path.join(__dirname, 'responses.json');

function readResponses(): any[] {
  if (!fs.existsSync(RESPONSES_FILE)) fs.writeFileSync(RESPONSES_FILE, '[]');
  return JSON.parse(fs.readFileSync(RESPONSES_FILE, 'utf-8'));
}

function writeResponses(responses: any[]) {
  fs.writeFileSync(RESPONSES_FILE, JSON.stringify(responses, null, 2));
}

app.post('/api/forms/:id/responses', async (req, res) => {
  const forms = readForms();
  const form = forms.find((f) => f.id === req.params.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });

  const responses = readResponses();
  const newResponse = {
    id: uuid(),
    formId: req.params.id,
    submittedAt: new Date().toISOString(),
    answers: req.body.answers,
  };
  responses.push(newResponse);
  writeResponses(responses);

  // Respond to the responder immediately — don't make them wait on email sending
  res.json(newResponse);

  // Generate PDF + email in the background
  try {
    const pdfBuffer = generateResponsePDF(form, newResponse.answers, newResponse.submittedAt);
    if (form.adminEmail) {
      await sendResponseEmail(form.adminEmail, form.title, pdfBuffer);
      console.log(`Emailed response for "${form.title}" to ${form.adminEmail}`);
    }
  } catch (err) {
    console.error('Failed to generate PDF or send email:', err);
  }
});

app.get('/api/forms/:id/responses', (req, res) => {
  const responses = readResponses().filter((r) => r.formId === req.params.id);
  res.json(responses);
});

app.get('/api/forms/:formId/responses/:responseId/pdf', (req, res) => {
  const forms = readForms();
  const form = forms.find((f) => f.id === req.params.formId);
  if (!form) return res.status(404).json({ error: 'Form not found' });

  const responses = readResponses();
  const response = responses.find((r) => r.id === req.params.responseId);
  if (!response) return res.status(404).json({ error: 'Response not found' });

  const pdfBuffer = generateResponsePDF(form, response.answers, response.submittedAt);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${form.title.replace(/[^a-z0-9]/gi, '_')}_response.pdf"`
  );
  res.send(pdfBuffer);
});

app.get('/api/forms/:formId/responses/export/csv', (req, res) => {
  const forms = readForms();
  const form = forms.find((f) => f.id === req.params.formId);
  if (!form) return res.status(404).json({ error: 'Form not found' });

  const responses = readResponses().filter((r) => r.formId === req.params.formId);

  const headers = ['Submitted At', ...form.questions.map((q: any) => q.label || 'Untitled')];
  const rows = responses.map((r) => {
    const row = [new Date(r.submittedAt).toLocaleString()];
    for (const q of form.questions) {
      const answer = r.answers.find((a: any) => a.questionId === q.id);
      let value = '';
      if (answer) {
        if (q.type === 'signature') {
          value = '[signature]';
        } else if (Array.isArray(answer.value)) {
          value = answer.value.join('; ');
        } else {
          value = answer.value || '';
        }
      }
      row.push(`"${String(value).replace(/"/g, '""')}"`);
    }
    return row.join(',');
  });

  const csv = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${form.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv"`
  );
  res.send(csv);
});

app.listen(4000, () => console.log('Server running on http://localhost:4000'));