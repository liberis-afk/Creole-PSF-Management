import { NextRequest, NextResponse } from 'next/server';
import { apiServerRaw } from '@/lib/api-server';

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') ?? 'csv';
  const res = await apiServerRaw(`/equipements/export?format=${encodeURIComponent(format)}`);
  if (!res.ok || !res.body) {
    return NextResponse.json({ message: "Échec de l'export" }, { status: res.status });
  }
  return new NextResponse(res.body, {
    status: 200,
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Disposition': res.headers.get('Content-Disposition') ?? 'attachment',
    },
  });
}
