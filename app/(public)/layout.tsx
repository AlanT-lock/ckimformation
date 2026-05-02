import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DevisModalProvider } from '@/components/forms/DevisModal';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <DevisModalProvider>
      <Navbar />
      <main className="pt-20">{children}</main>
      <Footer />
    </DevisModalProvider>
  );
}
