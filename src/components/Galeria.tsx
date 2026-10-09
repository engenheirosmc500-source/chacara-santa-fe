import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

export function Galeria() {
  const images = [
    { src: "/img/piscina-fogueira.jpg", title: "Piscina e Área de Fogueira" },
    { src: "/img/quiosque-noite.jpg", title: "Quiosque Iluminado à Noite" },
    { src: "/img/aerea-piscina.jpg", title: "Vista Superior da Piscina" },
    { src: "/img/gourmet-noite.jpg", title: "Área Gourmet Iluminada" },
    { src: "/img/churrasqueira.jpg", title: "Churrasqueira Completa" },
    { src: "/img/suite-azul.jpg", title: "Suíte Aconchegante" },
    { src: "/img/piscina-quiosque.jpg", title: "Deck e Quiosque" },
    { src: "/img/cozinha.jpg", title: "Cozinha Equipada" },
    { src: "/img/vista-aerea.jpg", title: "Vista Panorâmica da Chácara" },
  ];

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const openModal = (idx: number) => setActiveIdx(idx);
  const closeModal = () => setActiveIdx(null);
  const nextImage = () => {
    if (activeIdx !== null) {
      setActiveIdx((activeIdx + 1) % images.length);
    }
  };
  const prevImage = () => {
    if (activeIdx !== null) {
      setActiveIdx((activeIdx - 1 + images.length) % images.length);
    }
  };

  return (
    <section id="galeria" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#A9831F] block mb-3">
            FOTOS REAIS DO ESPAÇO
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F2A1F]">
            Conheça cada{" "}
            <span className="font-accent italic text-[#D4A72C]">detalhe</span>
          </h2>
          <p className="mt-4 text-[#58695F] text-base sm:text-lg">
            Clique nas fotos para ampliar e visualizar em alta definição.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => openModal(idx)}
              className="relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 aspect-[4/3] bg-gray-100"
            >
              <img
                src={img.src}
                alt={img.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A1F]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div className="flex items-center justify-between w-full text-white">
                  <span className="font-medium text-sm">{img.title}</span>
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            className="absolute top-6 right-6 p-3 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 sm:left-8 p-3 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50 cursor-pointer"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 sm:right-8 p-3 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50 cursor-pointer"
            aria-label="Próxima"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div
            className="max-w-5xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[activeIdx].src}
              alt={images[activeIdx].title}
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
            <p className="mt-4 text-white font-medium text-lg text-center">
              {images[activeIdx].title} ({activeIdx + 1} de {images.length})
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
