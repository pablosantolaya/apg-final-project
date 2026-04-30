import JSZip from 'jszip';
import type { GeneratedOutputs } from '../types/generation';

export function downloadTxt(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadZip(outputs: GeneratedOutputs, jobTitle: string) {
  const zip = new JSZip();
  const slug = jobTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);

  zip.file('resume.txt', outputs.resume);
  zip.file('cover-letter.txt', outputs.coverLetter);
  zip.file(
    'cold-outreach.txt',
    `Subject: ${outputs.coldEmail.subject}\n\n${outputs.coldEmail.body}`,
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug || 'application'}-package.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
