import React, { useState, useEffect } from "react";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CreditCard,
  MessageCircle,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Lock,
  Loader2
} from "lucide-react";
import { Calendar } from "./ui/calendar";
import { Button } from "./ui/button";
import { ModalPagamento } from "./ModalPagamento";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export function SecaoReservas() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tipoEvento, setTipoEvento] = useState("Casamento");
  const [convidados, setConvidados] = useState("50 a 100");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ date: string; name: string } | null>(null);

  // Estados do Modal de Pagamento Seguro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBookingData, setModalBookingData] = useState<{
    bookingId: string;
    date: string;
    name: string;
    whatsapp: string;
    eventType: string;
    guests: string;
  } | null>(null);

  // 1. Carrega datas bloqueadas e pendentes do Supabase
  const fetchDates = async () => {
    if (!isSupabaseConfigured) {
      // Mock para exibição inicial caso o usuário ainda não tenha conectado as chaves
      const savedMockBlocked = localStorage.getItem("santafe_mock_blocked");
      const savedMockPending = localStorage.getItem("santafe_mock_pending");
      if (savedMockBlocked) setBlockedDates(JSON.parse(savedMockBlocked));
      if (savedMockPending) setPendingDates(JSON.parse(savedMockPending));
      return;
    }

    try {
      // Sincroniza pagamentos aprovados do Mercado Pago
      await fetch('/api/mercadopago/sync').catch(() => {});

      const [resBlocked, resPending, resRequests] = await Promise.all([
        supabase.from("blocked_dates").select("date"),
        supabase.from("pending_dates").select("date"),
        supabase.from("booking_requests").select("date, status"),
      ]);

      const bList = (resBlocked.data || []).map((d: any) => d.date?.trim()).filter(Boolean);
      const pList = (resPending.data || []).map((d: any) => d.date?.trim()).filter(Boolean);
      
      const reqConfirmed = (resRequests.data || [])
        .filter((r: any) => r.status?.trim() === "confirmed")
        .map((r: any) => r.date?.trim())
        .filter(Boolean);

      const reqPending = (resRequests.data || [])
        .filter((r: any) => r.status?.trim() === "pending")
        .map((r: any) => r.date?.trim())
        .filter(Boolean);

      setBlockedDates(Array.from(new Set([...bList, ...reqConfirmed])));
      setPendingDates(Array.from(new Set([...pList, ...reqPending])));
    } catch (err) {
      console.error("Erro ao carregar datas do Supabase:", err);
    }
  };

  useEffect(() => {
    fetchDates();

    // Sincronização periódica em segundo plano (a cada 6 segundos)
    const interval = setInterval(() => {
      fetchDates();
    }, 6000);

    // Canal em tempo real do Supabase
    let channel: any = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel("realtime-calendar")
          .on("postgres_changes", { event: "*", schema: "public", table: "booking_requests" }, () => fetchDates())
          .on("postgres_changes", { event: "*", schema: "public", table: "blocked_dates" }, () => fetchDates())
          .on("postgres_changes", { event: "*", schema: "public", table: "pending_dates" }, () => fetchDates())
          .subscribe();
      } catch (e) {
        console.warn("Realtime subscription fallback to interval polling");
      }
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Helper para verificar status da data
  const formatDateToStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.includes(formatDateToStr(date));
  };

  const isDatePending = (date: Date) => {
    return pendingDates.includes(formatDateToStr(date));
  };

  // 2. Fluxo de Pagamento via Mercado Pago
  const handleMercadoPagoCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedDate) {
      setErrorMessage("Por favor, selecione uma data no calendário.");
      return;
    }
    if (!nome.trim() || !whatsapp.trim()) {
      setErrorMessage("Por favor, preencha seu nome e WhatsApp.");
      return;
    }

    const dateStr = formatDateToStr(selectedDate);

    if (isDateBlocked(selectedDate)) {
      setErrorMessage("Desculpe, esta data já está reservada por outro cliente.");
      return;
    }

    setIsSubmitting(true);

    try {
      let bookingId = `booking_${Date.now()}`;

      // Salva no Supabase se configurado
      if (isSupabaseConfigured) {
        // Marca como pendente na tabela de datas
        await supabase.from("pending_dates").upsert({ date: dateStr });

        // Insere o pedido
        const { data: bookingData, error: bookingErr } = await supabase
          .from("booking_requests")
          .insert({
            name: nome,
            whatsapp,
            date: dateStr,
            event_type: tipoEvento,
            guests: convidados,
            status: "pending"
          })
          .select("id")
          .single();

        if (bookingData?.id) {
          bookingId = bookingData.id;
        }
      } else {
        // Fallback local se o usuário ainda não colocou as chaves do Supabase
        const currentPending = [...pendingDates, dateStr];
        setPendingDates(currentPending);
        localStorage.setItem("santafe_mock_pending", JSON.stringify(currentPending));
      }

      // Abre o modal de pagamento seguro instantâneo na própria página
      setModalBookingData({
        bookingId,
        date: format(selectedDate, "dd/MM/yyyy"),
        name: nome,
        whatsapp,
        eventType: tipoEvento,
        guests: convidados
      });
      setIsModalOpen(true);
    } catch (err: any) {
      console.error("Erro ao preparar reserva:", err);
      setErrorMessage("Erro de conexão ao processar reserva. Tente via WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Fluxo Alternativo Direto para WhatsApp
  const handleWhatsAppBooking = async () => {
    if (!selectedDate || !nome.trim() || !whatsapp.trim()) {
      setErrorMessage("Preencha a data, seu nome e telefone para falar no WhatsApp.");
      return;
    }

    const dateStr = formatDateToStr(selectedDate);
    const formattedDate = format(selectedDate, "dd/MM/yyyy");

    try {
      if (isSupabaseConfigured) {
        await supabase.from("pending_dates").upsert({ date: dateStr });
        await supabase.from("booking_requests").insert({
          name: nome,
          whatsapp,
          date: dateStr,
          event_type: tipoEvento,
          guests: convidados,
          status: "pending"
        });
      }

      const ownerNumber = "5562981186284"; // DDD + Número do proprietário
      const text = `Olá! Gostaria de agendar a data *${formattedDate}* na Chácara Santa Fé para *${tipoEvento}* (${convidados} convidados).\nNome: ${nome}\nTelefone: ${whatsapp}.\nPodemos confirmar a disponibilidade e os valores?`;
      const link = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(text)}`;
      window.open(link, "_blank");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section id="reservar" className="py-24 bg-[#0F2A1F] text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#D4A72C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#3D6A4B]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F0DFA8] text-xs uppercase tracking-widest font-semibold mb-4">
            <Sparkles className="w-4 h-4 text-[#D4A72C]" />
            <span>Agendamento Online com Pagamento Seguro</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Reserve sua data e garanta a{" "}
            <span className="font-accent italic text-[#D4A72C]">sua celebração</span>
          </h2>
          <p className="mt-4 text-white/80 text-base sm:text-lg">
            Escolha um dia disponível no calendário, preencha seus dados e realize o agendamento com total segurança.
          </p>
        </div>

        {/* Warning if Supabase is not configured yet */}
        {!isSupabaseConfigured && (
          <div className="max-w-4xl mx-auto mb-8 p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="block font-semibold">Configuração do Supabase Pendente:</strong>
              Para salvar as datas em tempo real no banco, configure o arquivo <code className="bg-black/30 px-1 py-0.5 rounded">.env</code>.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Coluna do Calendário */}
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
              <div>
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#D4A72C]" />
                  Calendário de Disponibilidade
                </h3>
                <p className="text-white/60 text-xs sm:text-sm mt-1">
                  Clique no dia desejado para iniciar a reserva
                </p>
              </div>

              {/* Legenda de Status */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#D4A72C]" />
                  <span className="text-white/80">Livre</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-white/80">Pendente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-white/80">Ocupado</span>
                </div>
              </div>
            </div>

            {/* Calendário Interativo */}
            <div className="flex justify-center text-[#0F2A1F]">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today || isDateBlocked(date);
                }}
                modifiers={{
                  blocked: (date) => isDateBlocked(date),
                  pending: (date) => isDatePending(date),
                }}
                modifiersClassNames={{
                  blocked: "!bg-red-950/40 !text-red-400 line-through opacity-50 !cursor-not-allowed",
                  pending: "!bg-amber-500/20 !text-amber-300 !border !border-amber-400 font-semibold",
                }}
              />
            </div>

            {/* Data Selecionada Status */}
            {selectedDate && (
              <div className="mt-6 p-4 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#D4A72C] font-semibold block">
                    Data Selecionada
                  </span>
                  <span className="text-lg font-bold text-white capitalize">
                    {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Data Disponível
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Coluna do Formulário & Pagamento */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <h3 className="font-display text-xl font-bold text-white mb-2">
              Dados da Reserva
            </h3>
            <p className="text-white/60 text-xs sm:text-sm mb-6">
              Complete seus dados para prosseguir com o pagamento seguro.
            </p>

            {errorMessage && (
              <div className="mb-6 p-3 rounded-xl bg-red-900/60 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleMercadoPagoCheckout} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-white/80 mb-1.5">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#D4A72C] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-white/80 mb-1.5">
                  WhatsApp com DDD *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(62) 99999-9999"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#D4A72C] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-white/80 mb-1.5">
                    Tipo de Evento
                  </label>
                  <select
                    value={tipoEvento}
                    onChange={(e) => setTipoEvento(e.target.value)}
                    className="w-full bg-[#1A3B2C] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4A72C] transition-colors"
                  >
                    <option value="Casamento">Casamento</option>
                    <option value="Festa Infantil">Festa Infantil</option>
                    <option value="Aniversário Adulto">Aniversário Adulto</option>
                    <option value="Estadia / Pernoite">Estadia / Pernoite</option>
                    <option value="Confraternização">Confraternização</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-white/80 mb-1.5">
                    Nº de Convidados
                  </label>
                  <select
                    value={convidados}
                    onChange={(e) => setConvidados(e.target.value)}
                    className="w-full bg-[#1A3B2C] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4A72C] transition-colors"
                  >
                    <option value="Até 30">Até 30 pessoas</option>
                    <option value="30 a 50">30 a 50 pessoas</option>
                    <option value="50 a 100">50 a 100 pessoas</option>
                    <option value="100 a 150">100 a 150 pessoas</option>
                    <option value="Mais de 150">Mais de 150 pessoas</option>
                  </select>
                </div>
              </div>

              {/* Resumo do Pedido */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 mt-4">
                <div className="flex justify-between text-xs text-white/70">
                  <span>Data Selecionada:</span>
                  <span className="font-semibold text-white">
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione no calendário"}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-white/70">
                  <span>Tipo de Reserva:</span>
                  <span className="font-semibold text-white">{tipoEvento} ({convidados})</span>
                </div>
                <div className="flex justify-between text-xs text-white/70 pt-2 border-t border-white/10">
                  <span>Pagamento:</span>
                  <span className="text-[#D4A72C] font-semibold">PIX ou Cartão (Pagamento Seguro)</span>
                </div>
              </div>

              {/* Botão Principal: Pagamento Seguro */}
              <Button
                type="submit"
                variant="gold"
                size="lg"
                disabled={isSubmitting || !selectedDate}
                className="w-full mt-4 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando Pagamento Seguro...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Garantir Reserva com Pagamento Seguro
                  </>
                )}
              </Button>

              {/* Botão Secundário: WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppBooking}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                Ou solicitar reserva direta via WhatsApp
              </button>

              <div className="text-center pt-2">
                <span className="text-[11px] text-white/50 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Ambiente seguro protegido por criptografia de ponta a ponta
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento Seguro (PIX Instantâneo + Cartão) */}
      <ModalPagamento
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookingData={modalBookingData}
        onSuccess={() => {
          fetchDates();
        }}
      />
    </section>
  );
}
