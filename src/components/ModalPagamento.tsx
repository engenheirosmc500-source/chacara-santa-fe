import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  QrCode,
  Copy,
  Check,
  CreditCard,
  ShieldCheck,
  Loader2,
  X,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { Button } from "./ui/button";

interface ModalPagamentoProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    bookingId: string;
    date: string;
    name: string;
    whatsapp: string;
    eventType: string;
    guests: string;
  } | null;
  onSuccess: (paymentId: string) => void;
}

export function ModalPagamento({
  isOpen,
  onClose,
  bookingData,
  onSuccess
}: ModalPagamentoProps) {
  const [tab, setTab] = useState<"pix" | "cartao">("pix");
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixData, setPixData] = useState<{
    paymentId: string | number;
    qr_code: string;
    qr_code_base64: string;
    amount?: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"waiting" | "approved" | "error">("waiting");
  const [isCheckingManual, setIsCheckingManual] = useState(false);
  const [isStartingCard, setIsStartingCard] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const pollIntervalRef = useRef<any>(null);

  // 1. Gera o PIX quando o modal abre
  useEffect(() => {
    if (!isOpen || !bookingData) {
      setPixData(null);
      setStatus("waiting");
      setErrorMessage("");
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    let isMounted = true;

    const generatePix = async () => {
      setIsGeneratingPix(true);
      setErrorMessage("");

      try {
        const res = await fetch("/api/mercadopago/pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: bookingData.bookingId,
            date: bookingData.date,
            name: bookingData.name,
            whatsapp: bookingData.whatsapp,
            eventType: bookingData.eventType,
            guests: bookingData.guests,
            amount: 1, // valor para confirmação da reserva
            title: `Reserva Chácara Santa Fé - ${bookingData.date}`
          })
        });

        const data = await res.json();

        if (isMounted) {
          if (res.ok && data.qr_code) {
            setPixData({
              paymentId: data.paymentId,
              qr_code: data.qr_code,
              qr_code_base64: data.qr_code_base64,
              amount: data.amount
            });
          } else {
            setErrorMessage(data.error || "Não foi possível gerar o QR Code Pix.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Erro ao gerar PIX:", err);
          setErrorMessage("Erro de conexão ao gerar o PIX.");
        }
      } finally {
        if (isMounted) setIsGeneratingPix(false);
      }
    };

    generatePix();

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, bookingData]);

  // 2. Polling para checagem em tempo real (a cada 2.5 segundos)
  useEffect(() => {
    if (!isOpen || !pixData?.paymentId || status === "approved") {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `/api/mercadopago/check-status?payment_id=${pixData.paymentId}&booking_id=${bookingData?.bookingId}`
        );
        const data = await res.json();

        if (data.paid || data.status === "approved") {
          setStatus("approved");
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });

          onSuccess(String(pixData.paymentId));

          // Redireciona para a página de confirmação após 2 segundos
          setTimeout(() => {
            window.location.href = `/reserva-confirmada?booking_id=${bookingData?.bookingId}&date=${bookingData?.date}&payment_id=${pixData.paymentId}&name=${encodeURIComponent(
              bookingData?.name || ""
            )}`;
          }, 2000);
        }
      } catch (err) {
        console.error("Erro no polling de status:", err);
      }
    };

    pollIntervalRef.current = setInterval(checkStatus, 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, pixData, status, bookingData, onSuccess]);

  // Copiar código PIX
  const handleCopyPix = () => {
    if (!pixData?.qr_code) return;
    navigator.clipboard.writeText(pixData.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Checagem manual caso o usuário queira clicar
  const handleManualCheck = async () => {
    if (!pixData?.paymentId) return;
    setIsCheckingManual(true);
    try {
      const res = await fetch(
        `/api/mercadopago/check-status?payment_id=${pixData.paymentId}&booking_id=${bookingData?.bookingId}`
      );
      const data = await res.json();
      if (data.paid || data.status === "approved") {
        setStatus("approved");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        onSuccess(String(pixData.paymentId));
        setTimeout(() => {
          window.location.href = `/reserva-confirmada?booking_id=${bookingData?.bookingId}&date=${bookingData?.date}&payment_id=${pixData.paymentId}&name=${encodeURIComponent(
            bookingData?.name || ""
          )}`;
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingManual(false);
    }
  };

  // Iniciar pagamento por cartão de crédito
  const handleStartCardPayment = async () => {
    if (!bookingData) return;
    setIsStartingCard(true);
    try {
      const response = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          date: bookingData.date,
          amount: 1,
          name: bookingData.name,
          whatsapp: bookingData.whatsapp,
          eventType: bookingData.eventType,
          guests: bookingData.guests,
          title: `Reserva Chácara Santa Fé - ${bookingData.date}`
        })
      });

      const data = await response.json();
      if (response.ok && (data.init_point || data.sandbox_init_point)) {
        window.location.href = data.init_point || data.sandbox_init_point;
      } else {
        setErrorMessage(data.error || "Erro ao redirecionar para pagamento com cartão.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Erro de conexão ao abrir cartão.");
    } finally {
      setIsStartingCard(false);
    }
  };

  if (!isOpen || !bookingData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F2A1F] border border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white relative shadow-2xl overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#D4A72C]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A72C]/10 border border-[#D4A72C]/30 text-[#F0DFA8] text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4A72C]" />
            Pagamento Seguro
          </div>
          <h2 className="text-2xl font-bold font-display text-white">
            Finalizar Reserva
          </h2>
          <p className="text-xs text-white/70 mt-1">
            Data selecionada: <strong className="text-white">{bookingData.date}</strong> ({bookingData.eventType})
          </p>
        </div>

        {/* Se o pagamento já foi aprovado */}
        {status === "approved" ? (
          <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 text-green-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              Pagamento Confirmado!
            </h3>
            <p className="text-sm text-green-200">
              Sua reserva foi aprovada com sucesso. Redirecionando para os detalhes...
            </p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-[#D4A72C] animate-spin" />
            </div>
          </div>
        ) : (
          <>
            {/* Abas PIX / Cartão */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setTab("pix")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  tab === "pix"
                    ? "bg-[#D4A72C] text-[#0F2A1F] shadow-lg"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <QrCode className="w-4 h-4" />
                PIX Instantâneo
              </button>
              <button
                type="button"
                onClick={() => setTab("cartao")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  tab === "cartao"
                    ? "bg-[#D4A72C] text-[#0F2A1F] shadow-lg"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Cartão de Crédito
              </button>
            </div>

            {/* ABA PIX */}
            {tab === "pix" && (
              <div className="space-y-4">
                {isGeneratingPix ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-[#D4A72C] animate-spin mx-auto" />
                    <p className="text-sm text-white/80">
                      Gerando seu QR Code PIX oficial...
                    </p>
                  </div>
                ) : errorMessage ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-center space-y-3">
                    <p className="text-xs text-red-200">{errorMessage}</p>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => setTab("cartao")}
                      className="text-xs"
                    >
                      Tentar com Cartão de Crédito
                    </Button>
                  </div>
                ) : pixData ? (
                  <>
                    {/* Imagem do QR Code */}
                    <div className="bg-white p-4 rounded-2xl mx-auto w-56 h-56 flex items-center justify-center shadow-lg border-4 border-[#D4A72C]/40">
                      {pixData.qr_code_base64 ? (
                        <img
                          src={`data:image/png;base64,${pixData.qr_code_base64}`}
                          alt="QR Code Pix"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-black text-xs">
                          <QrCode className="w-12 h-12 mx-auto mb-2 text-black/60" />
                          Use o código Pix Copia e Cola abaixo
                        </div>
                      )}
                    </div>

                    {/* Botão Copiar Código Pix */}
                    <Button
                      variant="gold"
                      size="lg"
                      onClick={handleCopyPix}
                      className="w-full flex items-center justify-center gap-2 shadow-lg"
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5 text-green-900" />
                          Código PIX Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 text-[#0F2A1F]" />
                          Copiar Código PIX
                        </>
                      )}
                    </Button>

                    {/* Status em tempo real */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-white">
                            Aguardando confirmação bancária...
                          </p>
                          <p className="text-[11px] text-white/60">
                            Aprovação automática e instantânea
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleManualCheck}
                        disabled={isCheckingManual}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                        title="Checar agora"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isCheckingManual ? "animate-spin" : ""}`}
                        />
                      </button>
                    </div>

                    <p className="text-[11px] text-center text-white/50 leading-relaxed">
                      1. Abra o app do seu banco &gt; Escolha <strong>Pix</strong> &gt; <strong>Ler QR Code</strong> ou <strong>Pix Copia e Cola</strong>.
                      <br />
                      2. Ao concluir o pagamento, esta tela será confirmada imediatamente.
                    </p>
                  </>
                ) : null}
              </div>
            )}

            {/* ABA CARTÃO DE CRÉDITO */}
            {tab === "cartao" && (
              <div className="space-y-5 py-3 text-center">
                <div className="w-16 h-16 rounded-full bg-[#D4A72C]/10 border border-[#D4A72C]/30 flex items-center justify-center mx-auto text-[#D4A72C]">
                  <CreditCard className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white mb-1">
                    Cartão de Crédito
                  </h4>
                  <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                    Pague com qualquer bandeira em até 12 parcelas em ambiente seguro e criptografado.
                  </p>
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-300 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    {errorMessage}
                  </p>
                )}

                <Button
                  variant="gold"
                  size="lg"
                  onClick={handleStartCardPayment}
                  disabled={isStartingCard}
                  className="w-full flex items-center justify-center gap-2 shadow-lg"
                >
                  {isStartingCard ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Abrindo ambiente seguro...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 text-[#0F2A1F]" />
                      Continuar para Pagamento com Cartão
                      <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-white/50">
                  Você será direcionado para o checkout de cartão com segurança SSL 256 bits.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
