'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ParcelleMap } from '@/components/parcelles/parcelle-map';

/**
 * Vue cartographique. La carte (Leaflet) est chargée en dynamique sans SSR par
 * le composant ParcelleMap lui-même ; cette page se contente de la cadrer.
 */
export default function CarteParcellesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/parcelles"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Carte des parcelles</h1>
      </div>
      <ParcelleMap />
    </div>
  );
}
