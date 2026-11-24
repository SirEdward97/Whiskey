import { Inter } from 'next/font/google';
import '@/styles/styles.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Edwar Granados (@SirEdward97) — Diseñador Web & Desarrollador 3D Interactivo',
  description:
    'Portafolio profesional de Edwar Granados (@SirEdward97). Diseño web y desarrollo Frontend con Next.js, React y Tailwind CSS, especializado en interfaces interactivas 3D con Three.js, aplicaciones multiplataforma en Flutter e integración con APIs (Node.js, Python), Docker y flujos con IA.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
