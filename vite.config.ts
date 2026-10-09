import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'mercadopago-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            // Rota para criação de preferência do Mercado Pago
            if (req.url === '/api/mercadopago/preference' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const data = JSON.parse(body || '{}');
                  const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN || env.VITE_MERCADO_PAGO_ACCESS_TOKEN;

                  if (!accessToken) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado no .env.',
                      missingToken: true
                    }));
                    return;
                  }

                  const origin = req.headers.origin || 'http://localhost:5173';
                  const preferencePayload = {
                    items: [
                      {
                        title: data.title || `Reserva Chácara Santa Fé - ${data.date}`,
                        unit_price: Number(data.amount || 1200),
                        quantity: 1,
                        currency_id: 'BRL',
                        description: `Reserva para evento: ${data.eventType || 'Evento'} - ${data.guests || 'Convidados'}`
                      }
                    ],
                    payer: {
                      name: data.name || 'Cliente',
                      phone: {
                        number: (data.whatsapp || '').replace(/\D/g, '')
                      }
                    },
                    payment_methods: {
                      excluded_payment_methods: [],
                      excluded_payment_types: [],
                      installments: 12
                    },
                    back_urls: {
                      success: `${origin}/reserva-confirmada?booking_id=${data.bookingId}&date=${data.date}&name=${encodeURIComponent(data.name || '')}`,
                      pending: `${origin}/reserva-confirmada?booking_id=${data.bookingId}&date=${data.date}&status=pending`,
                      failure: `${origin}/?error=pagamento_cancelado`
                    },
                    notification_url: `${origin}/api/mercadopago/webhook`,
                    external_reference: data.bookingId || String(Date.now()),
                    statement_descriptor: 'CHACARA SANTA FE'
                  };

                  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(preferencePayload)
                  });

                  const mpJson = await mpRes.json();

                  if (!mpRes.ok) {
                    res.statusCode = mpRes.status;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: mpJson.message || 'Erro no Mercado Pago', details: mpJson }));
                    return;
                  }

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    id: mpJson.id,
                    init_point: mpJson.init_point,
                    sandbox_init_point: mpJson.sandbox_init_point
                  }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            // Rota para sincronizar pagamentos aprovados do Mercado Pago com o Supabase
            if (req.url === '/api/mercadopago/sync' && (req.method === 'GET' || req.method === 'POST')) {
              try {
                const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN || env.VITE_MERCADO_PAGO_ACCESS_TOKEN;
                const supabaseUrl = env.VITE_SUPABASE_URL;
                const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

                if (!accessToken) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Access token não configurado' }));
                  return;
                }

                // 1. Busca os pagamentos recentes no Mercado Pago
                const mpRes = await fetch('https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=20', {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const mpData = await mpRes.json();
                const approvedPayments = (mpData.results || []).filter((p: any) => p.status === 'approved' && p.external_reference);

                const synced: any[] = [];

                if (supabaseUrl && supabaseKey) {
                  for (const payment of approvedPayments) {
                    const bookingId = payment.external_reference;

                    // Busca o pedido no Supabase
                    const reqBooking = await fetch(`${supabaseUrl}/rest/v1/booking_requests?id=eq.${bookingId}`, {
                      headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                      }
                    });
                    const bookings = await reqBooking.json();

                    if (Array.isArray(bookings) && bookings.length > 0) {
                      const b = bookings[0];

                      // Se o pedido ainda estiver pendente, confirma no Supabase
                      if (b.status !== 'confirmed') {
                        // 1. Atualiza o status em booking_requests
                        await fetch(`${supabaseUrl}/rest/v1/booking_requests?id=eq.${bookingId}`, {
                          method: 'PATCH',
                          headers: {
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                          },
                          body: JSON.stringify({
                            status: 'confirmed',
                            payment_id: String(payment.id),
                            payment_status: 'approved',
                            amount: payment.transaction_amount
                          })
                        });

                        // 2. Insere a data em blocked_dates
                        await fetch(`${supabaseUrl}/rest/v1/blocked_dates`, {
                          method: 'POST',
                          headers: {
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'resolution=merge-duplicates'
                          },
                          body: JSON.stringify({ date: b.date })
                        });

                        // 3. Remove a data de pending_dates
                        await fetch(`${supabaseUrl}/rest/v1/pending_dates?date=eq.${b.date}`, {
                          method: 'DELETE',
                          headers: {
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`
                          }
                        });

                        synced.push({ bookingId, date: b.date, amount: payment.transaction_amount, paymentId: payment.id });
                      }
                    }
                  }
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, syncedCount: synced.length, synced, totalApproved: approvedPayments.length }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5173,
      open: true,
      strictPort: false
    }
  };
});
