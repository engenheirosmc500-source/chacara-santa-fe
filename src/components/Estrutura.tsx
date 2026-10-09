import React from "react";
import { Utensils, Waves, Bed, Trees, Sparkles, ShieldCheck } from "lucide-react";

export function Estrutura() {
  const items = [
    {
      icon: Waves,
      title: "Piscina com Deck",
      desc: "Área de banho de sol com espreguiçadeiras, ducha e iluminação noturna especial para fotos incríveis."
    },
    {
      icon: Utensils,
      title: "Área Gourmet Completa",
      desc: "Churrasqueira a carvão, fogão, freezer, geladeira e bancadas amplas para apoio ao buffet ou churrasco."
    },
    {
      icon: Bed,
      title: "Acomodação com Pernoite",
      desc: "Quartos confortáveis e arejados para você e seus convidados descansarem após a celebração."
    },
    {
      icon: Trees,
      title: "Natureza & Verde",
      desc: "Gramado espaçoso para cerimônias ao ar livre, fotos de casamento, fogueira e recreação infantil."
    },
    {
      icon: Sparkles,
      title: "Quiosque Iluminado",
      desc: "Ambiente coberto com estrutura rústica e charmosa para recepção, jantar ou pista de dança."
    },
    {
      icon: ShieldCheck,
      title: "Privacidade Total",
      desc: "Espaço totalmente fechado e reservado apenas para o seu grupo durante todo o período do contrato."
    }
  ];

  return (
    <section id="estrutura" className="py-24 bg-[#EDF1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#A9831F] block mb-3">
            O QUE VOCÊ ENCONTRA
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F2A1F]">
            Estrutura pensada para o seu{" "}
            <span className="font-accent italic text-[#D4A72C]">conforto</span>
          </h2>
          <p className="mt-4 text-[#58695F] text-base sm:text-lg">
            Tudo o que você precisa para realizar um evento marcante ou descansar com a família.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 border border-[#0F2A1F]/10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#EDF1E8] group-hover:bg-[#0F2A1F] text-[#0F2A1F] group-hover:text-[#D4A72C] flex items-center justify-center mb-6 transition-colors duration-300">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#0F2A1F] mb-3">
                  {item.title}
                </h3>
                <p className="text-[#58695F] text-sm sm:text-base leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
