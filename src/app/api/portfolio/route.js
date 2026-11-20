import { NextResponse } from 'next/server';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const featured = searchParams.get('featured');

  if (domain) {
    const capabilities = PORTFOLIO_DATA.capabilities.filter((cap) => cap.domain === domain);
    const logos3d = PORTFOLIO_DATA.logos3d.filter((logo) =>
      domain === 'ai'
        ? logo.id === 'python' || logo.id === 'nodejs' || logo.id === 'docker'
        : logo.domain === domain
    );
    return NextResponse.json({ domain, capabilities, logos3d });
  }

  if (featured === 'true' || featured === 'false') {
    const isFeatured = featured === 'true';
    const projects = PORTFOLIO_DATA.projects.filter((project) => project.featured === isFeatured);
    return NextResponse.json({ projects });
  }

  return NextResponse.json(PORTFOLIO_DATA);
}
