import React from "react";
import { Phone, MapPin, MessageCircle, ShieldCheck } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappNumber = "5562981186284"; // Pode ser ajustado conforme contato
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Vim pelo site da Chácara Santa Fé e gostaria de tirar algumas dúvidas.")}`;

  return (
    <>
      <footer id="contato" className="bg-[#07150F] text-white/80 py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Coluna 1: Logo & Info */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/img/logo-256.png"
                  alt="Chácara Santa Fé"
                  className="w-14 h-14 rounded-full shadow-lg"
                />
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#F0DFA8] block">
                    CHÁCARA
                  </span>
                  <span className="font-accent italic text-2xl font-bold text-white">
                    Santa Fé
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Espaço exclusivo para celebrações inesquecíveis, casamentos ao ar livre e estadias acolhedoras com pernoite.
              </p>
            </div>

            {/* Coluna 2: Navegação */}
            <div>
              <h4 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">
                Navegação
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#inicio" className="hover:text-[#D4A72C] transition-colors">Início</a></li>
                <li><a href="#estrutura" className="hover:text-[#D4A72C] transition-colors">Estrutura</a></li>
                <li><a href="#galeria" className="hover:text-[#D4A72C] transition-colors">Galeria de Fotos</a></li>
                <li><a href="#sobre" className="hover:text-[#D4A72C] transition-colors">Sobre Nós</a></li>
                <li><a href="#reservar" className="hover:text-[#D4A72C] transition-colors">Agendamento & Pagamento</a></li>
              </ul>
            </div>

            {/* Coluna 3: Contato & Redes */}
            <div>
              <h4 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">
                Contato
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#D4A72C]" />
                  <span>(62) 98118-6284</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-[#D4A72C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  <a
                    href="https://instagram.com/chacara.santafe1"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#D4A72C] transition-colors"
                  >
                    @chacara.santafe1
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#D4A72C]" />
                  <span>Goiás – Brasil</span>
                </li>
              </ul>
            </div>

            {/* Coluna 4: Painel Administrativo */}
            <div>
              <h4 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">
                Administração
              </h4>
              <p className="text-xs text-white/60 mb-4">
                Acesso restrito para o proprietário gerenciar reservas, datas bloqueadas e solicitações.
              </p>
              <a
                href="/admin"
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F0DFA8] border border-white/10 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4A72C]" />
                Acessar Painel /admin
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
            <span>© {currentYear} Chácara Santa Fé. Todos os direitos reservados.</span>
            <span>Agendamento Online · Pagamento Seguro · WhatsApp</span>
          </div>
        </div>
      </footer>

      {/* Botão Flutuante do WhatsApp */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300"
      >
        <MessageCircle className="w-8 h-8 fill-current" />
      </a>
    </>
  );
}
