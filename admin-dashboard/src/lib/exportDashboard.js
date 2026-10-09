import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toISODate } from './dates';

export async function exportDashboard(node, format, name) {
  const canvas = await html2canvas(node, { backgroundColor: '#0B132B', scale: 1.5, useCORS: true, logging: false });
  const file = `${name}-${toISODate()}`;
  if (format === 'png') {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${file}.png`;
    a.click();
    return;
  }
  const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'l' : 'p', unit: 'px', format: [canvas.width, canvas.height] });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, canvas.width, canvas.height);
  pdf.save(`${file}.pdf`);
}
