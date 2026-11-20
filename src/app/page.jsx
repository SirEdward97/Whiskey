import PortfolioClient from '@/components/PortfolioClient';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

export default function HomePage() {
  return <PortfolioClient initialPortfolio={PORTFOLIO_DATA} />;
}
