import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-dark text-white flex flex-col">
      <header className="px-6 md:px-10 py-6">
        <Link href="/" aria-label="C-KIM Formation — Accueil" className="inline-block">
          <Image
            src="/logo-ckim.png"
            alt="C-KIM Formation"
            width={512}
            height={353}
            className="h-12 w-auto"
          />
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-lg">{children}</div>
      </div>
      <footer className="px-6 md:px-10 py-4 text-xs text-muted/70 text-center">
        © {new Date().getFullYear()} C-KIM Formation
      </footer>
    </main>
  );
}
