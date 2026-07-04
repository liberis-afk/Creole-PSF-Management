'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, FileType } from 'lucide-react';

/**
 * Menu déroulant d'export. Déclenche le téléchargement en pointant un lien vers
 * la route BFF /api/equipements/export, qui relaie le flux binaire généré par
 * le backend (CSV / Excel / PDF).
 */
export function ExportMenu() {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function exporter(format: 'csv' | 'xlsx' | 'pdf') {
    // Un lien de téléchargement classique : le navigateur enregistre le fichier
    // renvoyé par la route (Content-Disposition: attachment).
    window.location.href = `/api/equipements/export?format=${format}`;
    setOuvert(false);
  }

  const options = [
    { format: 'csv' as const, label: 'CSV', icone: FileText },
    { format: 'xlsx' as const, label: 'Excel', icone: FileSpreadsheet },
    { format: 'pdf' as const, label: 'PDF', icone: FileType },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOuvert((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
      >
        <Download className="h-4 w-4" />
        Exporter
      </button>
      {ouvert && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-950">
          {options.map((o) => (
            <button
              key={o.format}
              onClick={() => exporter(o.format)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              <o.icone className="h-4 w-4 text-gray-400" />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
