import { jsPDF } from 'jspdf';

interface Question {
  id: string;
  type: string;
  label: string;
}

interface Answer {
  questionId: string;
  value: string | string[];
}

interface FormSchema {
  title: string;
  questions: Question[];
}

export function generateResponsePDF(form: FormSchema, answers: Answer[], submittedAt: string): Buffer {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text(form.title || 'Form Response', 14, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Submitted: ${new Date(submittedAt).toLocaleString()}`, 14, y);
  y += 12;
  doc.setTextColor(0);

  for (const question of form.questions) {
    const answer = answers.find(a => a.questionId === question.id);
    if (!answer) continue;

    // New page if we're running out of room
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const labelLines = doc.splitTextToSize(question.label || 'Untitled question', 180);
    doc.text(labelLines, 14, y);
    y += labelLines.length * 6 + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    if (question.type === 'signature' && typeof answer.value === 'string' && answer.value.startsWith('data:image')) {
      // Embed the signature drawing as an actual image in the PDF
      try {
        if (y > 210) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(answer.value, 'PNG', 14, y, 80, 30);
        y += 36;
      } catch {
        doc.text('[Signature could not be rendered]', 14, y);
        y += 8;
      }
    } else {
      const valueText = Array.isArray(answer.value) ? answer.value.join(', ') : (answer.value || '—');
      const valueLines = doc.splitTextToSize(valueText, 180);
      doc.text(valueLines, 14, y);
      y += valueLines.length * 6 + 6;
    }

    y += 4; // spacing between questions
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}