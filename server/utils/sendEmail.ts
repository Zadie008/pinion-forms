import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendResponseEmail(
  toEmail: string,
  formTitle: string,
  pdfBuffer: Buffer
) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Pinion Forms" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `New response: ${formTitle}`,
    text: `You have a new response for "${formTitle}". See the attached PDF for full details.`,
    attachments: [
      {
        filename: `${formTitle.replace(/[^a-z0-9]/gi, '_')}_response.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}