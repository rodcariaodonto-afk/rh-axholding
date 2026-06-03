import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const WHATSAPP_URL = "https://wa.me/5511939171383?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20o%20RH%20Smart%20IA%20.%20Poderia%20me%20falar%20sobre%20a%20plataforma%3F";

interface Section {
  id: string;
  label: string;
}

interface LegalPageLayoutProps {
  children: ReactNode;
  title: string;
  sections?: Section[];
}

export default function LegalPageLayout({ children, title, sections }: LegalPageLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a1628] text-gray-200 font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0a1628]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white">
            RH Smart <span className="text-blue-400">IA</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-gray-300 hover:text-white">Entrar</Button>
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-500 hover:bg-green-600 text-white text-sm">
                <MessageCircle size={16} className="mr-1.5" /> Falar com Consultor
              </Button>
            </a>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#0e1b30] border-t border-white/10 px-4 py-4 space-y-3">
            <Link to="/auth" className="block text-gray-300 hover:text-white text-sm">Entrar</Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="block text-green-400 text-sm font-semibold">Falar com Consultor</a>
          </div>
        )}
      </header>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex gap-10">
        {/* Sidebar nav - desktop */}
        {sections && sections.length > 0 && (
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-24 space-y-1">
              <Link to="/" className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 mb-4">
                <ArrowLeft size={14} /> Voltar para a página inicial
              </Link>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-gray-400 hover:text-white py-1.5 px-3 rounded hover:bg-white/5 transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>
        )}

        {/* Content */}
        <main className="flex-1 max-w-4xl">
          {/* Mobile back button */}
          <Link to="/" className="lg:hidden flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 mb-6">
            <ArrowLeft size={14} /> Voltar para a página inicial
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">{title}</h1>
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-semibold
            prose-p:text-gray-300 prose-li:text-gray-300
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
          ">
            {children}
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#070e1a] border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-sm text-gray-500">
              © {new Date().getFullYear()} AX Holding. Todos os direitos reservados.
            </span>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
              <Link to="/termos" className="hover:text-white transition-colors">Termos</Link>
              <Link to="/lgpd" className="hover:text-white transition-colors">LGPD</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp floating */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full px-5 py-3 shadow-lg shadow-green-500/30 transition-all hover:scale-105"
      >
        <MessageCircle size={22} />
        <span className="hidden sm:inline text-sm font-semibold">Falar com Consultor</span>
      </a>
    </div>
  );
}
