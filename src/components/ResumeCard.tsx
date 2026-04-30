import { useRef } from 'react';
import { extractTextFromFile } from '../lib/pdfExtract';

interface Props {
  value: string;
  onChange: (text: string) => void;
}

export function ResumeCard({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await extractTextFromFile(file);
      onChange(text);
    } catch {
      // extraction failed — user can paste manually
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Resume
        </span>
        <button
          onClick={() => inputRef.current?.click()}
          className="text-xs text-accent hover:underline underline-offset-2"
        >
          Upload PDF / TXT
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,text/plain,application/pdf"
        className="hidden"
        onChange={handleFile}
      />
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste your resume text here, or upload a file above…"
        rows={8}
        className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 bg-white text-neutral-800 placeholder-neutral-300 resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all leading-relaxed"
      />
      {value && (
        <p className="text-[10px] text-neutral-400">
          {value.trim().split(/\s+/).length} words
        </p>
      )}
    </div>
  );
}
