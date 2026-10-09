import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, Calendar, MessageCircle, Home, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export function ReservaConfirmadaPage() {
  const [params, setParams] = useState<{
    bookingId: string | null;
    date: string | null;
    name: string | null;
    paymentId: string | null;
    status: string | null;
  }>({
    bookingId: null,
    date: null,
    name: null,
    paymentId: null,
    status: null
  });

  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Pega os parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get("booking_id") || urlParams.get("external_reference");
    const date = urlParams.get("date");
    const name = urlParams.get("name") || "Cliente";
    const paymentId = urlParams.get("payment_id") || urlParams.get("collection_id");
    const status = urlParams.get("status") || urlParams.get("collection_status") || "approved";

    setParams({ bookingId, date, name, paymentId, status });

    // Se o status for aprovado, lança confetes e confirma no Supabase
    if (status === "approved" || !status) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Atualiza o Supabase
      const confirmInSupabase = async () => {
        try {
          if (isSupabaseConfigured && date) {
            // Formata para YYYY-MM-DD se vier em outro formato
            let formattedDateStr = date;
            if (date.includes("/")) {
              const [d, m, y] = date.split("/");
              formattedDateStr = `${y}-${m}-${d}`;
            }

            // 1. Confirma o pedido
            if (bookingId) {
              await supabase
                .from("booking_requests")
                .update({
                  status: "confirmed",
                  payment_id: paymentId,
                  payment_status: "approved"
                })
                .eq("id", bookingId);
            }

            // 2. Bloqueia a data
            await supabase.from("blocked_dates").upsert({ date: formattedDateStr });

            // 3. Remove de pendente
            await supabase.from("pending_dates").delete().eq("date", formattedDateStr);
          }
        } catch (err) {
          console.error("Erro ao sincronizar pagamento no Supabase:", err);
        } finally {
          setIsProcessing(false);
        }
      };

      confirmInSupabase();
    } else {
      setIsProcessing(false);
    }
  }, []);

  const ownerNumber = "5562981186284";
  const whatsappMsg = `Olá! Acabei de concluir o pagamento da minha reserva para o dia ${params.date || "agendado"} na Chácara Santa Fé!\nNome: ${params.name}\nID de Pagamento: ${params.paymentId || "Confirmado"}.\nAguardo as orientações de chegada!`;
  const whatsappLink = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="min-h-screen bg-[#07150F] flex items-center justify-center p-4 text-white">
      <div className="max-w-lg w-full bg-[#0F2A1F] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4A72C]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Ícone de Sucesso */}
        <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/40 text-green-400 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#F0DFA8] block mb-2">
          PAGAMENTO RECEBIDO COM SUCESSO
        </span>
        <h1 className="font-display text-3xl font-bold text-white mb-4">
          Reserva Confirmada!
        </h1>

        <p className="text-white/80 text-sm leading-relaxed mb-8">
          Parabéns, <strong>{params.name}</strong>! Seu pagamento seguro foi confirmado e a sua data está oficialmente bloqueada e garantida na Chácara Santa Fé.
        </p>

        {/* Card do Comprovante */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-3 mb-8">
          <div className="flex justify-between text-xs text-white/60">
            <span>Data Agendada:</span>
            <strong className="text-white text-sm">{params.date || "Confirmada"}</strong>
          </div>
          <div className="flex justify-between text-xs text-white/60">
            <span>Status da Reserva:</span>
            <strong className="text-green-400 text-sm capitalize">Confirmada e Paga</strong>
          </div>
          {params.paymentId && (
            <div className="flex justify-between text-xs text-white/60 pt-2 border-t border-white/10">
              <span>ID Transação:</span>
              <span className="font-mono text-white/70">{params.paymentId}</span>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3">
          <Button
            asChild
            variant="gold"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-5 h-5 text-[#0F2A1F]" />
              Enviar Comprovante no WhatsApp
            </a>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full flex items-center justify-center gap-2"
          >
            <a href="/">
              <Home className="w-4 h-4" />
              Voltar para o Site Inicial
            </a>
          </Button>
        </div>

        <div className="mt-8 pt-4 border-t border-white/10 text-xs text-white/50 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#D4A72C]" />
          Transação protegida por ambiente seguro
        </div>
      </div>
    </div>
  );
}
