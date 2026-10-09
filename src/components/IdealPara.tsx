import React from "react";
import { Cake, Heart, Home } from "lucide-react";

export function IdealPara() {
  const categories = [
    {
      icon: Cake,
      title: "Festas Infantis",
      desc: "Espaço de sobra para brincar com segurança, área gramada e área gourmet para os pais acompanharem tudo de perto.",
      tags: ["Playground", "Piscina", "Gramado Seguro", "Amplo Espaço"],
      image: "/img/quarto-familia.jpg"
    },
    {
      icon: Heart,
      title: "Casamentos & Celebrações",
      desc: "Cerimônias intimistas ao ar livre, com o quiosque rústico e árvores iluminadas como cenário para fotos inesquecíveis.",
      tags: ["Mini Wedding", "Bodas", "Aniversários", "Noivado"],
      image: "/img/quiosque-noite.jpg"
    },
    {
      icon: Home,
      title: "Estadia em Família",
      desc: "Fins de semana e feriados com pernoite para desacelerar da rotina, fazer churrasco e relaxar à beira da piscina.",
      tags: ["Pernoite", "Feriados", "Fins de Semana", "Descanso"],
      image: "/img/suite-azul.jpg"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#A9831F] block mb-3">
            VERSATILIDADE
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F2A1F]">
            Ideal para o seu tipo de{" "}
            <span className="font-accent italic text-[#D4A72C]">celebração</span>
          </h2>
          <p className="mt-4 text-[#58695F] text-base sm:text-lg">
            Adaptamos o espaço para receber seu evento com exclusividade e conforto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl overflow-hidden min-h-[480px] flex items-end shadow-md group transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07150F] via-[#0F2A1F]/60 to-transparent" />

                <div className="relative z-10 p-8 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-[#F0DFA8] mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">
                    {cat.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed mb-4">
                    {cat.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cat.tags.map((t, tidx) => (
                      <span
                        key={tidx}
                        className="text-xs px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
