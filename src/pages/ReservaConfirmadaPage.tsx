import React, { useEffect, useState, useCallback, useRef } from "react";
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
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  QrCode
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
  const [pixInfo, setPixInfo] = useState<{
    qr_code?: string;
    qr_code_base64?: string;
    ticket_url?: string;
    amount?: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [isVerifyingAgain, setIsVerifyingAgain] = useState(false);
  const pollTimerRef = useRef<any>(null);

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
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else if (data.status === "pending" || data.status === "in_process") {
        setStatus("pending");
        if (data.qr_code || data.qr_code_base64 || data.ticket_url) {
          setPixInfo({
            qr_code: data.qr_code,
            qr_code_base64: data.qr_code_base64,
            ticket_url: data.ticket_url,
            amount: data.amount
          });
        }
      } else if (data.status === "rejected" || data.status === "cancelled") {
        setStatus("not_paid");
      } else {
        // Se o status da URL for explicitamente pending, mantém pending
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("status") === "pending") {
          setStatus("pending");
        } else {
          setStatus("not_paid");
        }
      }
    } catch (err: any) {
      console.error("Erro ao verificar status:", err);
      // Se deu erro de conexão mas a URL indica pending, mostra pending
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("status") === "pending") {
        setStatus("pending");
      } else {
        setStatus("not_paid");
      }
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

  // Se estiver pendente, faz checagem contínua a cada 3 segundos
  useEffect(() => {
    if (status === "pending") {
      pollTimerRef.current = setInterval(() => {
        checkPaymentStatus(params.bookingId, params.paymentId);
      }, 3000);

      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      };
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }
  }, [status, params.bookingId, params.paymentId, checkPaymentStatus]);

  const handleManualCheck = async () => {
    setIsVerifyingAgain(true);
    await checkPaymentStatus(params.bookingId, params.paymentId);
    setIsVerifyingAgain(false);
  };

  const handleCopyPix = () => {
    if (!pixInfo?.qr_code) return;
    navigator.clipboard.writeText(pixInfo.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const ownerNumber = "5562981186284";
  const whatsappMsgSuccess = `Olá! Concluí o pagamento da minha reserva para o dia ${params.date || "agendado"} na Chácara Santa Fé!\nNome: ${params.name}\nID Transação: ${params.paymentId || "Confirmado"}.\nAguardo as orientações de chegada!`;
  const whatsappLinkSuccess = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(whatsappMsgSuccess)}`;

  const whatsappMsgHelp = `Olá! Estou na tela de pagamento para a data ${params.date || "agendada"} na Chácara Santa Fé e gostaria de ajuda para concluir minha reserva.\nNome: ${params.name}`;
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
              Estamos consultando a autenticação do seu pagamento em tempo real junto ao sistema seguro.
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

        {/* 3. ESTADO: PAGAMENTO PENDENTE (PEDINDO PARA PAGAR) */}
        {status === "pending" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            <span className="text-xs uppercase tracking-[0.25em] font-bold text-amber-300 block mb-2">
              PAGAMENTO PENDENTE
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
              Aguardando Pagamento
            </h1>

            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Olá, <strong>{params.name}</strong>! Sua reserva para o dia <strong>{params.date || "agendado"}</strong> ainda <strong>NÃO</strong> foi confirmada. Para garantir e bloquear a sua data, conclua o pagamento abaixo:
            </p>

            {/* Se houver QR code disponível */}
            {pixInfo?.qr_code_base64 && (
              <div className="bg-white p-4 rounded-2xl mx-auto w-52 h-52 flex items-center justify-center shadow-lg border-2 border-[#D4A72C]/40 mb-4">
                <img
                  src={`data:image/png;base64,${pixInfo.qr_code_base64}`}
                  alt="QR Code Pix"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {pixInfo?.qr_code && (
              <Button
                variant="gold"
                size="lg"
                onClick={handleCopyPix}
                className="w-full flex items-center justify-center gap-2 shadow-lg mb-4"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-green-950" />
                    Código Pix Copiado com Sucesso!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 text-[#0F2A1F]" />
                    Copiar Código PIX (Copia e Cola)
                  </>
                )}
              </Button>
            )}

            {pixInfo?.ticket_url && (
              <Button
                asChild
                variant="outline"
                className="w-full mb-4 text-white border-white/20 hover:bg-white/10 flex items-center justify-center gap-2"
              >
                <a href={pixInfo.ticket_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 text-[#D4A72C]" />
                  Abrir Boleto / Instruções de Pagamento
                </a>
              </Button>
            )}

            {/* Indicador de checagem em tempo real */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-6 flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <div>
                  <p className="text-xs font-semibold text-white">
                    Aguardando confirmação bancária...
                  </p>
                  <p className="text-[11px] text-white/60">
                    Esta tela atualizará automaticamente em segundos assim que você pagar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={isVerifyingAgain}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Checar agora"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingAgain ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-white border-white/20 hover:bg-white/10"
              >
                <a href={whatsappLinkHelp} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 text-green-400" />
                  Preciso de ajuda pelo WhatsApp
                </a>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full flex items-center justify-center gap-2 text-white/70"
              >
                <a href="/#reservar">
                  <ArrowRight className="w-4 h-4" />
                  Voltar para o Calendário
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
              Não identificamos nenhum pagamento aprovado para este agendamento. A data <strong>{params.date || "solicitada"}</strong> continua disponível para outros clientes.
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
                  Falar com Atendimento no WhatsApp
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
