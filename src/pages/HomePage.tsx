import React from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Estrutura } from "@/components/Estrutura";
import { Galeria } from "@/components/Galeria";
import { Sobre } from "@/components/Sobre";
import { IdealPara } from "@/components/IdealPara";
import { ComoFunciona } from "@/components/ComoFunciona";
import { SecaoReservas } from "@/components/SecaoReservas";
import { Depoimentos } from "@/components/Depoimentos";
import { Footer } from "@/components/Footer";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[#F6F8F3] text-[#13201A]">
      <Navbar />
      <main>
        <Hero />
        <Estrutura />
        <Galeria />
        <Sobre />
        <IdealPara />
        <ComoFunciona />
        <SecaoReservas />
        <Depoimentos />
      </main>
      <Footer />
    </div>
  );
}
