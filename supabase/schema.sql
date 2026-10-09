-- =========================================================================
-- ESQUEMA DO BANCO DE DADOS SUPABASE PARA O SISTEMA DE AGENDAMENTO
-- CHÁCARA SANTA FÉ COM INTEGRAÇÃO MERCADO PAGO
-- =========================================================================

-- 1. Tabela de datas totalmente bloqueadas (indisponíveis / confirmadas)
CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL UNIQUE, -- Formato: 'YYYY-MM-DD'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de datas com solicitação pendente de pagamento / aprovação
CREATE TABLE IF NOT EXISTS pending_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL UNIQUE, -- Formato: 'YYYY-MM-DD'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de solicitações e registros de reserva
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  date TEXT NOT NULL, -- Formato: 'YYYY-MM-DD'
  event_type TEXT NOT NULL,
  guests TEXT DEFAULT 'N/A',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'rejected'
  payment_id TEXT,                        -- ID da transação no Mercado Pago
  payment_status TEXT,                    -- 'approved' | 'pending' | 'rejected'
  amount NUMERIC(10,2) DEFAULT 1200.00,  -- Valor total da reserva
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para melhor desempenho de consulta
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates(date);
CREATE INDEX IF NOT EXISTS idx_pending_dates_date ON pending_dates(date);
CREATE INDEX IF NOT EXISTS idx_booking_requests_date ON booking_requests(date);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Segurança (Políticas públicas para consulta e reserva)
DROP POLICY IF EXISTS "Permitir leitura pública de blocked_dates" ON blocked_dates;
CREATE POLICY "Permitir leitura pública de blocked_dates" ON blocked_dates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gravação de blocked_dates" ON blocked_dates;
CREATE POLICY "Permitir gravação de blocked_dates" ON blocked_dates FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura pública de pending_dates" ON pending_dates;
CREATE POLICY "Permitir leitura pública de pending_dates" ON pending_dates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gravação de pending_dates" ON pending_dates;
CREATE POLICY "Permitir gravação de pending_dates" ON pending_dates FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura de booking_requests" ON booking_requests;
CREATE POLICY "Permitir leitura de booking_requests" ON booking_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção e atualização de booking_requests" ON booking_requests;
CREATE POLICY "Permitir inserção e atualização de booking_requests" ON booking_requests FOR ALL USING (true);
