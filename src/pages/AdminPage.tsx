import React, { useState, useEffect } from "react";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Check,
  X,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  MessageCircle,
  ShieldCheck,
  LogOut,
  RefreshCw,
  PlusCircle,
  ArrowLeft,
  UserCheck,
  Moon,
  Sun
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface BookingRequest {
  id: string;
  name: string;
  whatsapp: string;
  date: string;
  event_type: string;
  guests: string;
  status: "pending" | "confirmed" | "rejected";
  payment_id?: string;
  payment_status?: string;
  amount?: number;
  created_at: string;
}

export function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Modo Escuro
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin-theme") === "dark";
    }
    return false;
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("admin-theme", next ? "dark" : "light");
      return next;
    });
  };

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "rejected">("all");

  const [manualClientName, setManualClientName] = useState("");
  const [manualEventType, setManualEventType] = useState("Casamento");
  const [isLoading, setIsLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Senha do painel configurável
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "santafe123";

  useEffect(() => {
    if (sessionStorage.getItem("admin-authenticated") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin-authenticated", "true");
      setLoginError("");
    } else {
      setLoginError("Senha incorreta. A senha padrão inicial é 'santafe123'.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin-authenticated");
  };

  // Carrega todas as informações
  const loadData = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      const savedBlocked = localStorage.getItem("santafe_mock_blocked");
      const savedPending = localStorage.getItem("santafe_mock_pending");
      const savedRequests = localStorage.getItem("santafe_mock_requests");
      if (savedBlocked) setBlockedDates(JSON.parse(savedBlocked));
      if (savedPending) setPendingDates(JSON.parse(savedPending));
      if (savedRequests) setRequests(JSON.parse(savedRequests));
      setIsLoading(false);
      return;
    }

    try {
      // Sincroniza pagamentos aprovados do Mercado Pago
      await fetch('/api/mercadopago/sync').catch(() => {});

      const [resBlocked, resPending, resReqs] = await Promise.all([
        supabase.from("blocked_dates").select("*").order("date", { ascending: true }),
        supabase.from("pending_dates").select("*").order("date", { ascending: true }),
        supabase.from("booking_requests").select("*").order("created_at", { ascending: false })
      ]);

      setBlockedDates((resBlocked.data || []).map((b: any) => b.date?.trim()).filter(Boolean));
      setPendingDates((resPending.data || []).map((p: any) => p.date?.trim()).filter(Boolean));
      setRequests((resReqs.data || []) as BookingRequest[]);
    } catch (err: any) {
      console.error("Erro ao carregar dados do admin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();

      // Atualização periódica a cada 8 segundos
      const interval = setInterval(() => {
        loadData();
      }, 8000);

      // Canal em tempo real do Supabase
      let channel: any = null;
      if (isSupabaseConfigured) {
        try {
          channel = supabase
            .channel("realtime-admin-dashboard")
            .on("postgres_changes", { event: "*", schema: "public", table: "booking_requests" }, () => loadData())
            .on("postgres_changes", { event: "*", schema: "public", table: "blocked_dates" }, () => loadData())
            .on("postgres_changes", { event: "*", schema: "public", table: "pending_dates" }, () => loadData())
            .subscribe();
        } catch (e) {
          console.warn("Realtime admin fallback to interval");
        }
      }

      return () => {
        clearInterval(interval);
        if (channel) supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setStatusFeedback({ text, type });
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  const formatDateToStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 1. Bloquear Data Selecionada
  const handleBlockDate = async () => {
    if (!selectedDate) return;
    const dateStr = formatDateToStr(selectedDate);

    try {
      if (isSupabaseConfigured) {
        await supabase.from("blocked_dates").upsert({ date: dateStr });
        await supabase.from("pending_dates").delete().eq("date", dateStr);

        if (manualClientName.trim()) {
          await supabase.from("booking_requests").insert({
            name: manualClientName,
            whatsapp: "Reserva Manual / Balcão",
            date: dateStr,
            event_type: manualEventType,
            guests: "Informado no balcão",
            status: "confirmed"
          });
        }
      } else {
        const nextBlocked = Array.from(new Set([...blockedDates, dateStr]));
        const nextPending = pendingDates.filter((d) => d !== dateStr);
        setBlockedDates(nextBlocked);
        setPendingDates(nextPending);
        localStorage.setItem("santafe_mock_blocked", JSON.stringify(nextBlocked));
        localStorage.setItem("santafe_mock_pending", JSON.stringify(nextPending));
      }

      showFeedback(`Data ${format(selectedDate, "dd/MM/yyyy")} bloqueada com sucesso!`);
      setManualClientName("");
      loadData();
    } catch (err: any) {
      showFeedback("Erro ao bloquear data: " + err.message, "error");
    }
  };

  // 2. Liberar Data
  const handleFreeDate = async () => {
    if (!selectedDate) return;
    const dateStr = formatDateToStr(selectedDate);

    try {
      if (isSupabaseConfigured) {
        await supabase.from("blocked_dates").delete().eq("date", dateStr);
        await supabase.from("pending_dates").delete().eq("date", dateStr);
      } else {
        const nextBlocked = blockedDates.filter((d) => d !== dateStr);
        const nextPending = pendingDates.filter((d) => d !== dateStr);
        setBlockedDates(nextBlocked);
        setPendingDates(nextPending);
        localStorage.setItem("santafe_mock_blocked", JSON.stringify(nextBlocked));
        localStorage.setItem("santafe_mock_pending", JSON.stringify(nextPending));
      }

      showFeedback(`Data ${format(selectedDate, "dd/MM/yyyy")} liberada com sucesso!`);
      loadData();
    } catch (err: any) {
      showFeedback("Erro ao liberar data: " + err.message, "error");
    }
  };

  // 3. Aprovar Solicitação
  const handleApproveRequest = async (req: BookingRequest) => {
    try {
      if (isSupabaseConfigured) {
        await supabase.from("booking_requests").update({ status: "confirmed" }).eq("id", req.id);
        await supabase.from("blocked_dates").upsert({ date: req.date });
        await supabase.from("pending_dates").delete().eq("date", req.date);
      } else {
        const updated = requests.map((r) =>
          r.id === req.id ? { ...r, status: "confirmed" as const } : r
        );
        setRequests(updated);
        localStorage.setItem("santafe_mock_requests", JSON.stringify(updated));
      }
      showFeedback(`Reserva de ${req.name} confirmada!`);
      loadData();
    } catch (err: any) {
      showFeedback("Erro ao aprovar: " + err.message, "error");
    }
  };

  // 4. Recusar Solicitação
  const handleRejectRequest = async (req: BookingRequest) => {
    try {
      if (isSupabaseConfigured) {
        await supabase.from("booking_requests").update({ status: "rejected" }).eq("id", req.id);
        await supabase.from("pending_dates").delete().eq("date", req.date);
        await supabase.from("blocked_dates").delete().eq("date", req.date);
      } else {
        const updated = requests.map((r) =>
          r.id === req.id ? { ...r, status: "rejected" as const } : r
        );
        setRequests(updated);
        localStorage.setItem("santafe_mock_requests", JSON.stringify(updated));
      }
      showFeedback(`Reserva de ${req.name} foi recusada e a data liberada.`);
      loadData();
    } catch (err: any) {
      showFeedback("Erro ao recusar: " + err.message, "error");
    }
  };

  // 5. Excluir Solicitação
  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    try {
      if (isSupabaseConfigured) {
        await supabase.from("booking_requests").delete().eq("id", id);
      } else {
        const updated = requests.filter((r) => r.id !== id);
        setRequests(updated);
        localStorage.setItem("santafe_mock_requests", JSON.stringify(updated));
      }
      showFeedback("Registro excluído.");
      loadData();
    } catch (err: any) {
      showFeedback("Erro ao excluir: " + err.message, "error");
    }
  };

  // Tela de Login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07150F] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0F2A1F] border border-white/10 rounded-3xl p-8 shadow-2xl text-white">
          <div className="text-center mb-8">
            <img src="/img/logo-256.png" alt="Logo" className="w-16 h-16 rounded-full mx-auto mb-4 shadow-md" />
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#F0DFA8]">
              CHÁCARA SANTA FÉ
            </span>
            <h1 className="font-display text-2xl font-bold mt-1">
              Painel do Proprietário
            </h1>
            <p className="text-white/60 text-xs mt-2">
              Digite a senha de administrador para acessar o gerenciamento
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-semibold text-white/70 mb-1.5">
                Senha de Acesso
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4A72C] transition-colors"
              />
              <span className="text-[11px] text-white/40 block mt-1.5">
                Senha inicial padrão: <code>santafe123</code> (pode ser alterada no .env)
              </span>
            </div>

            <Button type="submit" variant="gold" className="w-full mt-2 cursor-pointer">
              Acessar Painel
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <a href="/" className="text-xs text-white/60 hover:text-white flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para o site público
            </a>
          </div>
        </div>
      </div>
    );
  }

  const selectedDateStr = selectedDate ? formatDateToStr(selectedDate) : "";
  const isSelectedBlocked = blockedDates.includes(selectedDateStr);
  const isSelectedPending = pendingDates.includes(selectedDateStr);

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-[#07150F] text-white" : "bg-[#F6F8F3] text-[#13201A]"
      }`}
    >
      {/* Top Header Admin */}
      <header
        className={`py-4 px-6 sticky top-0 z-40 shadow-md transition-colors duration-300 ${
          isDarkMode ? "bg-[#0A1F16] border-b border-white/10 text-white" : "bg-[#0F2A1F] text-white"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/img/logo-256.png" alt="Logo" className="w-10 h-10 rounded-full" />
            <div>
              <span className="font-display font-bold text-lg leading-tight block">
                Painel Administrativo
              </span>
              <span className="text-[11px] text-[#F0DFA8] block">
                Chácara Santa Fé · Gestão de Reservas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Botão de Modo Escuro / Claro */}
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-[#D4A72C]" />
                  <span className="hidden sm:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-300" />
                  <span className="hidden sm:inline">Modo Escuro</span>
                </>
              )}
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-white/80 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors hidden sm:inline-flex"
            >
              Ver Site Público
            </a>
            <button
              onClick={loadData}
              disabled={isLoading}
              title="Atualizar dados"
              className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Feedback Toast */}
      {statusFeedback && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div
            className={`px-5 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
              statusFeedback.type === "success"
                ? "bg-[#0F2A1F] text-[#F0DFA8] border border-[#D4A72C]"
                : "bg-red-900 text-white border border-red-500"
            }`}
          >
            {statusFeedback.type === "success" ? (
              <Check className="w-4 h-4 text-[#D4A72C]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-300" />
            )}
            {statusFeedback.text}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div
            className={`rounded-2xl p-6 border shadow-sm flex items-center gap-4 transition-colors ${
              isDarkMode
                ? "bg-[#0F2A1F] border-white/10 text-white"
                : "bg-white border-[#0F2A1F]/10 text-[#0F2A1F]"
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-xs uppercase font-bold ${isDarkMode ? "text-white/60" : "text-[#58695F]"}`}>
                Solicitações Pendentes
              </span>
              <h3 className="font-display text-2xl font-bold">
                {requests.filter((r) => r.status === "pending").length}
              </h3>
            </div>
          </div>

          <div
            className={`rounded-2xl p-6 border shadow-sm flex items-center gap-4 transition-colors ${
              isDarkMode
                ? "bg-[#0F2A1F] border-white/10 text-white"
                : "bg-white border-[#0F2A1F]/10 text-[#0F2A1F]"
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-xs uppercase font-bold ${isDarkMode ? "text-white/60" : "text-[#58695F]"}`}>
                Reservas Confirmadas
              </span>
              <h3 className="font-display text-2xl font-bold">
                {requests.filter((r) => r.status === "confirmed").length}
              </h3>
            </div>
          </div>

          <div
            className={`rounded-2xl p-6 border shadow-sm flex items-center gap-4 transition-colors ${
              isDarkMode
                ? "bg-[#0F2A1F] border-white/10 text-white"
                : "bg-white border-[#0F2A1F]/10 text-[#0F2A1F]"
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-xs uppercase font-bold ${isDarkMode ? "text-white/60" : "text-[#58695F]"}`}>
                Datas Bloqueadas
              </span>
              <h3 className="font-display text-2xl font-bold">{blockedDates.length}</h3>
            </div>
          </div>
        </div>

        {/* Section: Calendário de Controle Rápido */}
        <div
          className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition-colors ${
            isDarkMode ? "bg-[#0F2A1F] border-white/10" : "bg-white border-[#0F2A1F]/10"
          }`}
        >
          <h2 className="font-display text-xl font-bold mb-2 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#D4A72C]" />
            Gerenciamento Direto do Calendário
          </h2>
          <p className={`text-xs sm:text-sm mb-6 ${isDarkMode ? "text-white/60" : "text-[#58695F]"}`}>
            Clique em qualquer dia para ver o status, bloquear manualmente (com ou sem nome de cliente) ou liberar uma data.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 flex justify-center text-[#0F2A1F]">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                modifiers={{
                  blocked: (date) => blockedDates.includes(formatDateToStr(date)),
                  pending: (date) => pendingDates.includes(formatDateToStr(date)),
                }}
                modifiersClassNames={{
                  blocked: "!bg-red-500 !text-white font-bold",
                  pending: "!bg-amber-400 !text-black font-bold",
                }}
              />
            </div>

            <div
              className={`lg:col-span-5 rounded-2xl p-6 border transition-colors ${
                isDarkMode ? "bg-[#132E22] border-white/10" : "bg-[#F6F8F3] border-[#0F2A1F]/10"
              }`}
            >
              <h3 className="font-display font-bold text-base mb-3">
                Ações para a Data Selecionada
              </h3>

              {selectedDate ? (
                <div className="space-y-4">
                  <div
                    className={`p-3 rounded-xl border ${
                      isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-[#0F2A1F]/10"
                    }`}
                  >
                    <span className={`text-xs block ${isDarkMode ? "text-white/60" : "text-[#58695F]"}`}>
                      Data:
                    </span>
                    <strong className="text-base capitalize">
                      {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </strong>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs">Status:</span>
                      {isSelectedBlocked ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold border border-red-500/30">
                          Bloqueada / Ocupada
                        </span>
                      ) : isSelectedPending ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                          Pendente
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-semibold border border-green-500/30">
                          Disponível (Livre)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Formulário para Bloqueio Manual */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label
                        className={`block text-xs font-semibold mb-1 ${
                          isDarkMode ? "text-white/70" : "text-[#58695F]"
                        }`}
                      >
                        Nome do Cliente / Motivo (Opcional)
                      </label>
                      <input
                        type="text"
                        value={manualClientName}
                        onChange={(e) => setManualClientName(e.target.value)}
                        placeholder="Ex: Reserva Balcão ou Manutenção"
                        className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#D4A72C] ${
                          isDarkMode
                            ? "bg-white/10 border border-white/20 text-white placeholder-white/40"
                            : "bg-white border border-[#0F2A1F]/15 text-[#0F2A1F]"
                        }`}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleBlockDate}
                        variant="forest"
                        size="sm"
                        className="flex-1 text-xs cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 mr-1" />
                        Bloquear Data
                      </Button>

                      {(isSelectedBlocked || isSelectedPending) && (
                        <Button
                          onClick={handleFreeDate}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs text-red-400 border-red-500/40 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5 mr-1" />
                          Liberar Data
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-center py-12 text-xs sm:text-sm ${
                    isDarkMode ? "text-white/50" : "text-[#58695F]"
                  }`}
                >
                  Toque em um dia no calendário ao lado para visualizar e alterar seu status.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section: Tabela de Pedidos e Solicitações de Reserva */}
        <div
          className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition-colors ${
            isDarkMode ? "bg-[#0F2A1F] border-white/10" : "bg-white border-[#0F2A1F]/10"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-xl font-bold">Todas as Solicitações de Reserva</h2>
              <p className={`text-xs sm:text-sm ${isDarkMode ? "text-white/60" : "text-[#58695F]"}`}>
                Gerencie clientes que solicitaram via site público ou agendamento online
              </p>
            </div>

            {/* Filtros de Status */}
            <div
              className={`flex items-center gap-1.5 p-1 rounded-xl border text-xs ${
                isDarkMode ? "bg-white/5 border-white/10" : "bg-[#F6F8F3] border-[#0F2A1F]/10"
              }`}
            >
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === "all"
                    ? isDarkMode
                      ? "bg-[#D4A72C] text-[#0F2A1F] font-bold"
                      : "bg-[#0F2A1F] text-white"
                    : isDarkMode
                    ? "text-white/70 hover:text-white"
                    : "text-[#58695F] hover:text-[#0F2A1F]"
                }`}
              >
                Todas ({requests.length})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === "pending"
                    ? "bg-amber-500 text-white font-bold"
                    : isDarkMode
                    ? "text-white/70 hover:text-white"
                    : "text-[#58695F] hover:text-[#0F2A1F]"
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setStatusFilter("confirmed")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === "confirmed"
                    ? "bg-green-600 text-white font-bold"
                    : isDarkMode
                    ? "text-white/70 hover:text-white"
                    : "text-[#58695F] hover:text-[#0F2A1F]"
                }`}
              >
                Confirmadas
              </button>
              <button
                onClick={() => setStatusFilter("rejected")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === "rejected"
                    ? "bg-red-600 text-white font-bold"
                    : isDarkMode
                    ? "text-white/70 hover:text-white"
                    : "text-[#58695F] hover:text-[#0F2A1F]"
                }`}
              >
                Recusadas
              </button>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className={`text-center py-12 text-sm ${isDarkMode ? "text-white/50" : "text-[#58695F]"}`}>
              Nenhuma solicitação encontrada com o filtro selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr
                    className={`border-b text-xs uppercase tracking-wider ${
                      isDarkMode ? "border-white/10 text-white/60" : "border-[#0F2A1F]/10 text-[#58695F]"
                    }`}
                  >
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4">Data Solicitada</th>
                    <th className="py-3 px-4">Evento / Convidados</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? "divide-white/10" : "divide-[#0F2A1F]/10"}`}>
                  {filteredRequests.map((req) => {
                    const cleanPhone = (req.whatsapp || "").replace(/\D/g, "");
                    const zapUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                      `Olá ${req.name}! Vi sua solicitação para a Chácara Santa Fé no dia ${req.date} (${req.event_type}). Vamos alinhar os detalhes da sua reserva?`
                    )}`;

                    return (
                      <tr
                        key={req.id}
                        className={`transition-colors ${
                          isDarkMode ? "hover:bg-white/5" : "hover:bg-[#F6F8F3]/60"
                        }`}
                      >
                        <td className="py-4 px-4 font-semibold">{req.name}</td>
                        <td className={`py-4 px-4 ${isDarkMode ? "text-white/70" : "text-[#58695F]"}`}>
                          {req.whatsapp}
                        </td>
                        <td className="py-4 px-4 font-medium">{req.date}</td>
                        <td className="py-4 px-4 text-xs">
                          <span className="font-medium block">{req.event_type}</span>
                          <span className={isDarkMode ? "text-white/60" : "text-[#58695F]"}>{req.guests}</span>
                        </td>
                        <td className="py-4 px-4 font-bold text-[#F0DFA8]">
                          {req.amount ? `R$ ${Number(req.amount).toLocaleString("pt-BR")},00` : "A combinar"}
                        </td>
                        <td className="py-4 px-4">
                          {req.status === "confirmed" ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                              Confirmada
                            </span>
                          ) : req.status === "pending" ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Pendente
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                              Recusada
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* WhatsApp Button */}
                            <a
                              href={zapUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Conversar no WhatsApp"
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkMode
                                  ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                                  : "bg-green-50 text-green-700 hover:bg-green-100"
                              }`}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>

                            {/* Aprovar Button */}
                            {req.status !== "confirmed" && (
                              <button
                                onClick={() => handleApproveRequest(req)}
                                title="Aprovar e Confirmar Data"
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  isDarkMode
                                    ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                }`}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}

                            {/* Recusar Button */}
                            {req.status !== "rejected" && (
                              <button
                                onClick={() => handleRejectRequest(req)}
                                title="Recusar Reserva"
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  isDarkMode
                                    ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                }`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}

                            {/* Excluir Button */}
                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              title="Excluir Registro"
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                isDarkMode
                                  ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                                  : "bg-red-50 text-red-700 hover:bg-red-100"
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
