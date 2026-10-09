import React from "react";
import { Check } from "lucide-react";

export function Sobre() {
  const points = [
    "Localização tranquila e de fácil acesso",
    "Área verde ampla com gramado e árvores",
    "Espaço infantil e segurança para crianças",
    "Cozinha de apoio completa e equipada",
    "Iluminação cênica noturna por todo o espaço",
    "Atendimento próximo e suporte aos noivos e anfitriões"
  ];

  return (
    <section id="sobre" className="py-24 bg-[#F6F8F3] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Media Images */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] max-w-lg mx-auto">
              <img
                src="/img/fogueira-sol.jpg"
                alt="Ambiente Chácara Santa Fé"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -right-4 sm:-right-8 w-1/2 aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-xl hidden sm:block">
              <img
                src="/img/noite-torre.jpg"
                alt="Noite na chácara"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#A9831F] block">
              NOSSA HISTÓRIA & PROPÓSITO
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F2A1F] leading-tight">
              Um lugar pensado para reunir quem você mais{" "}
              <span className="font-accent italic text-[#D4A72C]">ama</span>
            </h2>
            <p className="text-[#58695F] text-base sm:text-lg leading-relaxed">
              A Chácara Santa Fé nasceu do desejo de criar um refúgio acolhedor onde momentos especiais pudessem ser vividos sem pressa, com a energia única do campo e a estrutura moderna que seu evento merece.
            </p>
            <p className="text-[#58695F] text-base sm:text-lg leading-relaxed">
              Aqui, cada detalhe foi planejado para proporcionar tranquilidade para os anfitriões e encantamento para os convidados, seja em uma cerimônia intimista de casamento, uma festa infantil cheia de brincadeiras ou um fim de semana de descanso em família.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {points.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-3 text-[#13201A] font-medium text-sm sm:text-base">
                  <div className="w-6 h-6 rounded-full bg-[#D4A72C]/20 text-[#A9831F] flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>{pt}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 font-accent italic text-2xl text-[#0F2A1F]">
              "Venha viver momentos inesquecíveis na Chácara Santa Fé."
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
