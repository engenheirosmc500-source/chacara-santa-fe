import React, { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  Home,
  ShieldCheck,
  Calendar,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

type VerificationStatus = "checking" | "approved" | "pending" | "not_paid" | "error";

export function ReservaConfirmadaPage() {
  const [params, setParams] = useState<{
    bookingId: string | null;
    date: string | null;
    name: string | null;
    paymentId: string | null;
  }>({
    bookingId: null,
    date: null,
    name: null,
    paymentId: null
  });

  const [status, setStatus] = useState<VerificationStatus>("checking");
  const [statusDetail, setStatusDetail] = useState<string>("");
  const [isVerifyingAgain, setIsVerifyingAgain] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const checkPaymentStatus = useCallback(async (bookingId: string | null, paymentId: string | null) => {
    if (!bookingId && !paymentId) {
      setStatus("not_paid");
      return;
    }

    try {
      const query = new URLSearchParams();
      if (paymentId) query.set("payment_id", paymentId);
      if (bookingId) query.set("booking_id", bookingId);

      const res = await fetch(`/api/mercadopago/check-status?${query.toString()}`);
      if (!res.ok) {
        throw new Error("Falha ao consultar status de pagamento");
      }

      const data = await res.json();

      if (data.paid || data.status === "approved") {
        setStatus("approved");
        setStatusDetail("Pagamento confirmado com sucesso!");
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else if (data.status === "pending" || data.status === "in_process") {
        setStatus("pending");
        setStatusDetail("O pagamento ainda está sendo processado pelo seu banco.");
      } else if (data.status === "rejected" || data.status === "cancelled") {
        setStatus("not_paid");
        setStatusDetail("O pagamento foi recusado ou cancelado.");
      } else {
        setStatus("not_paid");
        setStatusDetail("Nenhum pagamento concluído foi identificado.");
      }
    } catch (err: any) {
      console.error("Erro ao verificar status:", err);
      setStatus("pending");
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get("booking_id") || urlParams.get("external_reference");
    const date = urlParams.get("date");
    const name = urlParams.get("name") || "Cliente";
    const paymentId = urlParams.get("payment_id") || urlParams.get("collection_id");

    setParams({ bookingId, date, name, paymentId });

    // Verifica o status real no servidor/Mercado Pago
    checkPaymentStatus(bookingId, paymentId);
  }, [checkPaymentStatus]);

  // Se estiver pendente, faz até 4 tentativas automáticas de checagem a cada 4 segundos
  useEffect(() => {
    if (status === "pending" && pollCount < 4) {
      const timer = setTimeout(() => {
        setPollCount((prev) => prev + 1);
        checkPaymentStatus(params.bookingId, params.paymentId);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status, pollCount, params.bookingId, params.paymentId, checkPaymentStatus]);

  const handleManualCheck = async () => {
    setIsVerifyingAgain(true);
    await checkPaymentStatus(params.bookingId, params.paymentId);
    setIsVerifyingAgain(false);
  };

  const ownerNumber = "5562981186284";
  const whatsappMsgSuccess = `Olá! Concluí o pagamento da minha reserva para o dia ${params.date || "agendado"} na Chácara Santa Fé!\nNome: ${params.name}\nID Transação: ${params.paymentId || "Confirmado"}.\nAguardo as orientações de chegada!`;
  const whatsappLinkSuccess = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(whatsappMsgSuccess)}`;

  const whatsappMsgHelp = `Olá! Realizei uma tentativa de reserva para o dia ${params.date || "agendado"} na Chácara Santa Fé, mas gostaria de verificar o status do pagamento com vocês.\nNome: ${params.name}`;
  const whatsappLinkHelp = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(whatsappMsgHelp)}`;

  return (
    <div className="min-h-screen bg-[#07150F] flex items-center justify-center p-4 text-white">
      <div className="max-w-lg w-full bg-[#0F2A1F] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4A72C]/20 rounded-full blur-2xl pointer-events-none" />

        {/* 1. ESTADO: VERIFICANDO */}
        {status === "checking" && (
          <div className="py-12">
            <div className="w-16 h-16 rounded-full bg-[#D4A72C]/10 border border-[#D4A72C]/30 flex items-center justify-center mx-auto mb-6 animate-spin">
              <RefreshCw className="w-8 h-8 text-[#D4A72C]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verificando Pagamento Seguro...</h2>
            <p className="text-sm text-white/70">
              Estamos consultando a autenticação do seu pagamento em tempo real. Aguarde um instante.
            </p>
          </div>
        )}

        {/* 2. ESTADO: PAGAMENTO APROVADO */}
        {status === "approved" && (
          <>
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

            <div className="space-y-3">
              <Button
                asChild
                variant="gold"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
              >
                <a href={whatsappLinkSuccess} target="_blank" rel="noopener noreferrer">
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
          </>
        )}

        {/* 3. ESTADO: PAGAMENTO PENDENTE */}
        {status === "pending" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            <span className="text-xs uppercase tracking-[0.25em] font-bold text-amber-300 block mb-2">
              PAGAMENTO EM PROCESSAMENTO
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
              Aguardando Compensação
            </h1>

            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Olá, <strong>{params.name}</strong>! Seu pedido para o dia <strong>{params.date || "agendado"}</strong> foi registrado, mas o pagamento ainda não foi concluído ou está em processamento pela instituição bancária.
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200/90 text-left mb-6">
              💡 <strong>Atenção:</strong> Sua data só será bloqueada definitivamente assim que o pagamento for concluído. Se você acabou de efetuar o PIX ou Cartão, clique no botão abaixo para verificar novamente.
            </div>

            <div className="space-y-3">
              <Button
                variant="gold"
                size="lg"
                onClick={handleManualCheck}
                disabled={isVerifyingAgain}
                className="w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isVerifyingAgain ? "animate-spin" : ""}`} />
                {isVerifyingAgain ? "Verificando..." : "Verificar Pagamento Novamente"}
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-white border-white/20 hover:bg-white/10"
              >
                <a href={whatsappLinkHelp} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 text-green-400" />
                  Falar no WhatsApp
                </a>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full flex items-center justify-center gap-2 text-white/70"
              >
                <a href="/#reservar">
                  <ArrowRight className="w-4 h-4" />
                  Voltar para o Agendamento
                </a>
              </Button>
            </div>
          </>
        )}

        {/* 4. ESTADO: PAGAMENTO NÃO CONCLUÍDO / RECUSADO */}
        {status === "not_paid" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10" />
            </div>

            <span className="text-xs uppercase tracking-[0.25em] font-bold text-red-300 block mb-2">
              PAGAMENTO NÃO IDENTIFICADO
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
              Reserva Não Concluída
            </h1>

            <p className="text-white/80 text-sm leading-relaxed mb-6">
              O pagamento desta reserva não foi realizado ou foi cancelado. A data <strong>{params.date || "solicitada"}</strong> não foi reservada e continua disponível.
            </p>

            <div className="space-y-3">
              <Button
                asChild
                variant="gold"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
              >
                <a href="/#reservar">
                  <ArrowRight className="w-4 h-4 text-[#0F2A1F]" />
                  Tentar Agendar Novamente
                </a>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full flex items-center justify-center gap-2 text-white/70"
              >
                <a href={whatsappLinkHelp} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 text-green-400" />
                  Falar com Atendimento
                </a>
              </Button>
            </div>
          </>
        )}

        <div className="mt-8 pt-4 border-t border-white/10 text-xs text-white/50 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#D4A72C]" />
          Ambiente 100% protegido e criptografado
        </div>
      </div>
    </div>
  );
}
