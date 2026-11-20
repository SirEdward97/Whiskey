import { NextResponse } from 'next/server';

const startedAt = Date.now();

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'edwar-granados-portfolio',
    author: 'Edwar Granados (@SirEdward97)',
    stack: {
      framework: 'Next.js (App Router)',
      ui: 'React.js',
      graphics3d: 'Three.js / WebGL 2.0',
    },
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
}
