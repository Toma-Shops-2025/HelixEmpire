import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface Props {
  title: string;
  children: ReactNode;
  updated?: string;
}

export function LegalLayout({ title, children, updated }: Props) {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-white pb-20">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 p-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">{title}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 md:p-12 prose prose-invert prose-orange">
        <div className="bg-white/5 border-2 border-white/10 p-8 rounded-[40px] shadow-2xl">
          <div className="mb-8">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2 leading-none">{title}</h2>
            {updated && <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Last Updated: {updated}</p>}
          </div>
          <div className="space-y-6 text-sm font-bold uppercase tracking-widest leading-relaxed text-white/70">
            {children}
          </div>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto px-6 text-center">
        <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.4em]">Helix Empire is a property of TomaAI Network</p>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 pt-6 border-t border-white/5">
      <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
