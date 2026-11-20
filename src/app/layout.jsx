import { JetBrains_Mono, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import '@/styles/styles.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Edwar Granados (@SirEdward97) — Full-Stack & 3D Interactive Developer',
  description:
    'Portafolio profesional de Edwar Granados (@SirEdward97). Desarrollo de software Full-Stack con Next.js y React, interfaces interactivas 3D con Three.js, Flutter, Python (Django, FastAPI), Node.js (Express), GraphQL, bases de datos, Docker y flujos con IA.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
