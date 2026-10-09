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

                  const rawName = (data.name || 'Cliente').trim();
                  const nameParts = rawName.split(' ');
                  const firstName = nameParts[0] || 'Cliente';
                  const lastName = nameParts.slice(1).join(' ') || 'Hóspede';
                  const cleanPhone = (data.whatsapp || '').replace(/\D/g, '');

                  const origin = req.headers.origin || 'http://localhost:5173';
                  const preferencePayload = {
                    items: [
                      {
                        id: `reserva-${data.bookingId || Date.now()}`,
                        title: data.title || `Reserva Chácara Santa Fé - ${data.date}`,
                        unit_price: Number(data.amount || env.RESERVATION_AMOUNT || 1),
                        quantity: 1,
                        currency_id: 'BRL',
                        description: `Reserva para evento: ${data.eventType || 'Evento'} - ${data.guests || 'Convidados'}`
                      }
                    ],
                    payer: {
                      name: firstName,
                      surname: lastName,
                      email: data.email || (cleanPhone ? `cliente${cleanPhone}@gmail.com` : 'cliente@chacarasantafe.com.br'),
                      phone: {
                        area_code: cleanPhone.length >= 10 ? cleanPhone.slice(0, 2) : '62',
                        number: cleanPhone.length >= 10 ? cleanPhone.slice(2) : cleanPhone
                      }
                    },
                    payment_methods: {
                      excluded_payment_methods: [],
                      excluded_payment_types: [],
                      installments: 12
                    },
                    back_urls: {
                      success: `${origin}/reserva-confirmada?booking_id=${data.bookingId}&date=${data.date}&name=${encodeURIComponent(data.name || '')}`,
                      pending: `${origin}/reserva-confirmada?booking_id=${data.bookingId}&date=${data.date}&name=${encodeURIComponent(data.name || '')}&status=pending`,
                      failure: `${origin}/reserva-confirmada?booking_id=${data.bookingId}&date=${data.date}&name=${encodeURIComponent(data.name || '')}&status=failure`
                    },
                    auto_return: 'approved',
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

            // Rota para geração de PIX Transparente
            if (req.url === '/api/mercadopago/pix' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const data = JSON.parse(body || '{}');
                  const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN || env.VITE_MERCADO_PAGO_ACCESS_TOKEN;

                  if (!accessToken) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado.', missingToken: true }));
                    return;
                  }

                  const rawName = (data.name || 'Cliente').trim();
                  const nameParts = rawName.split(' ');
                  const firstName = nameParts[0] || 'Cliente';
                  const lastName = nameParts.slice(1).join(' ') || 'Hóspede';

                  const paymentPayload = {
                    transaction_amount: Number(data.amount || env.RESERVATION_AMOUNT || 1),
                    description: data.title || `Reserva Chácara Santa Fé - ${data.date}`,
                    payment_method_id: 'pix',
                    payer: {
                      email: data.email || 'contato@chacarasantafe.com.br',
                      first_name: firstName,
                      last_name: lastName
                    },
                    external_reference: data.bookingId || String(Date.now())
                  };

                  const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
                      'X-Idempotency-Key': `pix-${data.bookingId || Date.now()}-${Date.now()}`
                    },
                    body: JSON.stringify(paymentPayload)
                  });

                  const mpJson = await mpRes.json();

                  if (!mpRes.ok) {
                    res.statusCode = mpRes.status;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: mpJson.message || 'Erro ao gerar PIX', details: mpJson }));
                    return;
                  }

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    paymentId: mpJson.id,
                    status: mpJson.status,
                    qr_code: mpJson.point_of_interaction?.transaction_data?.qr_code,
                    qr_code_base64: mpJson.point_of_interaction?.transaction_data?.qr_code_base64,
                    ticket_url: mpJson.point_of_interaction?.transaction_data?.ticket_url,
                    amount: mpJson.transaction_amount,
                    bookingId: data.bookingId
                  }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            // Rota para checar status real de pagamento no Mercado Pago
            if (req.url?.startsWith('/api/mercadopago/check-status') && req.method === 'GET') {
              try {
                const url = new URL(req.url, 'http://localhost:5173');
                const payment_id = url.searchParams.get('payment_id');
                const booking_id = url.searchParams.get('booking_id');

                const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN || env.VITE_MERCADO_PAGO_ACCESS_TOKEN;
                const supabaseUrl = env.VITE_SUPABASE_URL;
                const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

                if (!accessToken) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Access token não configurado' }));
                  return;
                }

                let payment: any = null;

                if (payment_id) {
                  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                  });
                  if (mpRes.ok) {
                    payment = await mpRes.json();
                  }
                }

                if (!payment && booking_id) {
                  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${booking_id}&sort=date_created&criteria=desc&limit=1`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                  });
                  if (mpRes.ok) {
                    const data = await mpRes.json();
                    if (data.results && data.results.length > 0) {
                      payment = data.results[0];
                    }
                  }
                }

                if (payment) {
                  const isApproved = payment.status === 'approved';
                  const actualBookingId = payment.external_reference || booking_id;

                  if (isApproved && supabaseUrl && supabaseKey && actualBookingId) {
                    try {
                      const reqBooking = await fetch(`${supabaseUrl}/rest/v1/booking_requests?id=eq.${actualBookingId}`, {
                        headers: {
                          'apikey': supabaseKey,
                          'Authorization': `Bearer ${supabaseKey}`
                        }
                      });
                      const bookings = await reqBooking.json();

                      if (Array.isArray(bookings) && bookings.length > 0) {
                        const b = bookings[0];
                        if (b.status !== 'confirmed') {
                          await fetch(`${supabaseUrl}/rest/v1/booking_requests?id=eq.${actualBookingId}`, {
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

                          await fetch(`${supabaseUrl}/rest/v1/pending_dates?date=eq.${b.date}`, {
                            method: 'DELETE',
                            headers: {
                              'apikey': supabaseKey,
                              'Authorization': `Bearer ${supabaseKey}`
                            }
                          });
                        }
                      }
                    } catch (e) {
                      console.error('Erro ao sincronizar Supabase em check-status:', e);
                    }
                  }

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    paid: isApproved,
                    status: payment.status,
                    paymentId: payment.id,
                    amount: payment.transaction_amount,
                    paymentMethod: payment.payment_method_id,
                    qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
                    qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
                    ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url
                  }));
                  return;
                }

                // Se não encontrou no Mercado Pago, verifica se o Supabase já tem a reserva confirmada
                if (booking_id && supabaseUrl && supabaseKey) {
                  const reqBooking = await fetch(`${supabaseUrl}/rest/v1/booking_requests?id=eq.${booking_id}`, {
                    headers: {
                      'apikey': supabaseKey,
                      'Authorization': `Bearer ${supabaseKey}`
                    }
                  });
                  const bookings = await reqBooking.json();
                  if (Array.isArray(bookings) && bookings.length > 0) {
                    const b = bookings[0];
                    if (b.status === 'confirmed') {
                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({
                        paid: true,
                        status: 'approved',
                        paymentId: b.payment_id,
                        amount: b.amount,
                        date: b.date
                      }));
                      return;
                    }
                  }
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  paid: false,
                  status: 'not_found'
                }));
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
