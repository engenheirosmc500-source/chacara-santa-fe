import React from "react";

export function ComoFunciona() {
  const steps = [
    {
      num: "1",
      title: "Escolha a Data",
      desc: "Navegue pelo nosso calendário interativo e escolha um dia livre para sua comemoração."
    },
    {
      num: "2",
      title: "Preencha seus Dados",
      desc: "Informe seu nome, WhatsApp, tipo de evento e quantidade estimada de convidados."
    },
    {
      num: "3",
      title: "Pagamento Seguro",
      desc: "Pague com PIX ou Cartão de Crédito em ambiente criptografado e seguro com confirmação imediata."
    },
    {
      num: "4",
      title: "Celebre sem Preocupação",
      desc: "Com a data garantida no sistema, nossa equipe recebe você com o espaço 100% pronto."
    }
  ];

  return (
    <section className="py-24 bg-[#EDF1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#A9831F] block mb-3">
            PASSO A PASSO
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F2A1F]">
            Da escolha da data ao{" "}
            <span className="font-accent italic text-[#D4A72C]">grande dia</span>
          </h2>
          <p className="mt-4 text-[#58695F] text-base sm:text-lg">
            Um processo 100% digital, prático e transparente para você.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-8 border border-[#0F2A1F]/10 shadow-sm text-center flex flex-col items-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 rounded-full bg-[#0F2A1F] text-[#F0DFA8] group-hover:bg-[#D4A72C] group-hover:text-[#0F2A1F] font-display font-bold text-2xl flex items-center justify-center mb-6 shadow-md transition-colors duration-300">
                {st.num}
              </div>
              <h3 className="font-display text-xl font-bold text-[#0F2A1F] mb-3">
                {st.title}
              </h3>
              <p className="text-[#58695F] text-sm leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
