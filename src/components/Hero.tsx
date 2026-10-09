import React from "react";
import { Calendar as CalendarIcon, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

export function Hero() {
  return (
    <section id="inicio" className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-16 overflow-hidden">
      {/* Background Image with Dark Emerald Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/img/aerea-familia.jpg"
          alt="Chácara Santa Fé aérea"
          className="w-full h-full object-cover object-center scale-105 animate-pulse duration-[10000ms]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07150F] via-[#0F2A1F]/70 to-[#0F2A1F]/60" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center text-white">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F0DFA8] text-xs sm:text-sm font-semibold tracking-widest uppercase mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-[#D4A72C]" />
          <span>Espaço Exclusivo · Eventos & Pernoite</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">
          O refúgio perfeito para o seu{" "}
          <span className="font-accent italic text-[#D4A72C] font-normal">
            grande momento
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-2xl text-white/85 max-w-3xl mx-auto font-light leading-relaxed mb-10">
          Celebre festas inesquecíveis, casamentos ao ar livre ou aproveite um fim de semana acolhedor com sua família cercado pela natureza.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Button
            variant="gold"
            size="lg"
            asChild
            className="w-full sm:w-auto"
          >
            <a href="#reservar" className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Ver Calendário & Agendar
            </a>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            asChild
            className="w-full sm:w-auto"
          >
            <a href="#estrutura">Conhecer a Estrutura</a>
          </Button>
        </div>

        {/* Highlight Tags */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-8 border-t border-white/20 text-xs sm:text-sm text-white/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4A72C]" />
            <span>Piscina Cristalina</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4A72C]" />
            <span>Área Gourmet Completa</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4A72C]" />
            <span>Suítes para Pernoite</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4A72C]" />
            <span>Pagamento 100% Seguro (PIX & Cartão)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
