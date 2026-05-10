import type { Metadata } from 'next';
import { bebas, dmSans, dmSerif } from './fonts';
import { LenisProvider } from '@/components/motion/LenisProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'C-KIM Formation — Sécurité au travail & développement humain',
  description: 'Centre de formation certifié Qualiopi à Draguignan (PACA). Sécurité, prévention, formateurs, développement humain.',
  metadataBase: new URL('https://ckimformation.fr'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-FR" className={`${bebas.variable} ${dmSans.variable} ${dmSerif.variable}`}>
      <body>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
