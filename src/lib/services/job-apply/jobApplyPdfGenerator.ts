import { jsPDF } from 'jspdf';
import { contactSummary } from './jobApplyParser';
import type { TailoredResume } from './types';

export async function generateBasicPdf(data: TailoredResume): Promise<Buffer> {
  const doc = new jsPDF();
  const margin = 20;
  const contentWidth = 170;
  let y = 20;
  const contacts = contactSummary();

  const addText = (text: string, fontSize = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, contentWidth);
    if (y + lines.length * 6 > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * 6 + 2;
  };

  addText('RAMOS', 22, 'bold');
  addText('Graphic Designer & Visual Strategist', 10);
  addText([contacts.email, contacts.whatsapp, contacts.site].filter(Boolean).join(' | '), 9);
  y += 6;

  addText('PROFESSIONAL SUMMARY', 12, 'bold');
  addText(data.summary);
  y += 4;

  addText('CORE SKILLS', 12, 'bold');
  addText(data.skills.join(' | '));
  y += 4;

  addText('EXPERIENCE', 12, 'bold');
  for (const exp of data.experience) {
    addText(`${exp.position} - ${exp.company} (${exp.year})`, 10, 'bold');
    for (const bullet of exp.bullets.slice(0, 3)) {
      addText(`- ${bullet}`, 9);
    }
    y += 2;
  }

  return Buffer.from(doc.output('arraybuffer'));
}
