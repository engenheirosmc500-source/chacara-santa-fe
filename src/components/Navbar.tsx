import React, { useState, useEffect } from "react";
import { MessageCircle, Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";

interface NavbarProps {
  onAdminClick?: () => void;
}

export function Navbar({ onAdminClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0F2A1F]/90 backdrop-blur-md shadow-lg py-3"
            : "bg-gradient-to-b from-[#0F2A1F]/80 to-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <a href="#inicio" className="flex items-center gap-3 text-white group">
            <img
              src="/img/logo-256.png"
              alt="Chácara Santa Fé"
              className="w-12 h-12 rounded-full shadow-md transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#F0DFA8]">
                CHÁCARA
              </span>
              <span className="font-accent italic text-2xl font-bold tracking-tight text-white leading-none">
                Santa Fé
              </span>
            </div>
          </a>

          {/* Nav links desktop */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-white/90">
            <a href="#inicio" className="hover:text-[#D4A72C] transition-colors">Início</a>
            <a href="#estrutura" className="hover:text-[#D4A72C] transition-colors">Estrutura</a>
            <a href="#galeria" className="hover:text-[#D4A72C] transition-colors">Galeria</a>
            <a href="#sobre" className="hover:text-[#D4A72C] transition-colors">Sobre</a>
            <a href="#reservar" className="text-[#F0DFA8] font-semibold hover:text-white transition-colors flex items-center gap-1">
              Agendamento
            </a>
          </nav>

          {/* Right CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="#reservar"
              className="inline-flex items-center gap-2 bg-[#D4A72C] hover:bg-[#F0DFA8] text-[#0F2A1F] font-display font-semibold text-sm px-6 py-2.5 rounded-full shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              Agendar Data
            </a>
            <a
              href="/admin"
              title="Acesso Administrativo"
              className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ShieldCheck className="w-5 h-5" />
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 text-white hover:text-[#D4A72C] focus:outline-none"
            aria-label="Abrir Menu"
          >
            <Menu className="w-7 h-7" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 bg-[#0F2A1F] text-white flex flex-col p-6 transition-transform duration-500 md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/img/logo-256.png" alt="Logo" className="w-10 h-10 rounded-full" />
            <span className="font-accent italic text-xl font-bold">Santa Fé</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 text-white/80 hover:text-white"
            aria-label="Fechar Menu"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        <nav className="flex flex-col gap-6 text-xl font-display font-medium mt-8">
          <a
            href="#inicio"
            onClick={() => setMobileOpen(false)}
            className="hover:text-[#D4A72C] transition-colors"
          >
            Início
          </a>
          <a
            href="#estrutura"
            onClick={() => setMobileOpen(false)}
            className="hover:text-[#D4A72C] transition-colors"
          >
            Estrutura
          </a>
          <a
            href="#galeria"
            onClick={() => setMobileOpen(false)}
            className="hover:text-[#D4A72C] transition-colors"
          >
            Galeria
          </a>
          <a
            href="#sobre"
            onClick={() => setMobileOpen(false)}
            className="hover:text-[#D4A72C] transition-colors"
          >
            Sobre
          </a>
          <a
            href="#reservar"
            onClick={() => setMobileOpen(false)}
            className="text-[#D4A72C] font-semibold"
          >
            Agendamento & Pagamento
          </a>
          <a
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="text-white/60 text-base flex items-center gap-2 pt-4 border-t border-white/10"
          >
            <ShieldCheck className="w-4 h-4" /> Painel do Proprietário (/admin)
          </a>
        </nav>

        <div className="mt-auto pt-6">
          <a
            href="#reservar"
            onClick={() => setMobileOpen(false)}
            className="w-full text-center block bg-[#D4A72C] text-[#0F2A1F] font-bold py-3.5 rounded-full shadow-lg"
          >
            Escolher Data da Reserva
          </a>
        </div>
      </div>
    </>
  );
}
