// Builds the PDF the applicant downloads after submitting. jsPDF is imported on
// demand so it stays out of the main bundle.

import { SUMMARY_SECTIONS, visibleRows, displayValue, genderLabel } from './submission';
import { FIELDS } from '../validation/applicationSchema';

const MARGIN = 18;
const LINE = 6;
const PAGE_BOTTOM = 275;

// Imported on demand so jsPDF is not in the main bundle.
export const downloadSummaryPdf = async (values, reference) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  const page = () => {
    if (y > PAGE_BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const write = (text, { size = 10, bold = false, gap = LINE } = {}) => {
    page();
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size);
    doc.text(text, MARGIN, y);
    y += gap;
  };

  write('HPAIR Application', { size: 18, bold: true, gap: 9 });
  write(`Reference ${reference}`, { size: 10 });
  write(`Downloaded ${new Date().toLocaleString()}`, { size: 10, gap: 10 });

  const row = (label, value) => {
    page();
    doc.setFont('helvetica', 'normal').setFontSize(10);
    doc.text(label, MARGIN, y);
    // Wrap long values instead of running them off the page.
    const lines = doc.splitTextToSize(displayValue(value), 110);
    doc.setFont('helvetica', 'bold');
    doc.text(lines, MARGIN + 62, y);
    y += LINE * lines.length;
  };

  SUMMARY_SECTIONS.forEach((section) => {
    y += 3;
    write(section.title.toUpperCase(), { size: 11, bold: true, gap: 7 });
    visibleRows(section, values).forEach((r) => row(r.label, r.value(values)));
  });

  y += 3;
  write('EQUALITY INFORMATION', { size: 11, bold: true, gap: 7 });
  row('Gender', genderLabel(values[FIELDS.gender]));

  const safeName = (values[FIELDS.lastName] || 'application').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  doc.save(`hpair-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
};
