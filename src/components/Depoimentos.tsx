import React from "react";
import { Star, Quote } from "lucide-react";

export function Depoimentos() {
  const testimonials = [
    {
      quote: "Comemoramos o aniversário de 5 anos do nosso filho e foi simplesmente perfeito! O espaço é muito seguro, as crianças brincaram o dia todo no gramado e a piscina é incrível.",
      name: "Mariana e Rodrigo Silva",
      event: "Festa Infantil"
    },
    {
      quote: "Nosso mini wedding na Chácara Santa Fé foi um sonho realizado. O quiosque com a iluminação noturna ficou espetacular nas fotos e os convidados elogiaram muito o conforto.",
      name: "Camila & Lucas Ferreira",
      event: "Casamento ao Ar Livre"
    },
    {
      quote: "Alugamos para o fim de semana em família com pernoite. Quartos limpos, cozinha com tudo o que precisávamos e um silêncio restaurador. Já queremos voltar!",
      name: "Família Albuquerque",
      event: "Estadia Familiar"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#A9831F] block mb-3">
            AVALIAÇÕES REAIS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F2A1F]">
            Quem já celebrou{" "}
            <span className="font-accent italic text-[#D4A72C]">conosco</span>
          </h2>
          <p className="mt-4 text-[#58695F] text-base sm:text-lg">
            A satisfação dos nossos clientes é o nosso maior compromisso.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-[#F6F8F3] border border-[#0F2A1F]/10 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div>
                <div className="flex gap-1 text-[#D4A72C] mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="font-accent italic text-[#13201A] text-lg leading-relaxed mb-6">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-6 border-t border-[#0F2A1F]/10 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-[#0F2A1F] text-base">
                    {t.name}
                  </h4>
                  <span className="text-xs text-[#58695F]">{t.event}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#0F2A1F] text-[#D4A72C] flex items-center justify-center font-bold text-sm">
                  {t.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
