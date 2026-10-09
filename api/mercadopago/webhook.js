export default async function handler(req, res) {
  // O Mercado Pago envia notificações via POST ou GET
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    const query = req.query || {};

    // Extrai o ID do pagamento com suporte a todos os formatos do Mercado Pago (v1, v2, IPN e Webhooks)
    let paymentId =
      query['data.id'] ||
      query.id ||
      query['data[id]'] ||
      body?.data?.id ||
      (body.type === 'payment' ? body.id : null) ||
      (body.action?.startsWith('payment.') ? body?.data?.id : null);

    if (!paymentId && (query.topic === 'payment' || body.topic === 'payment')) {
      paymentId = query.id || body.id;
    }

    if (!paymentId && body?.resource) {
      const match = String(body.resource).match(/payments\/(\d+)/);
      if (match) paymentId = match[1];
    }

    if (paymentId && accessToken && supabaseUrl && supabaseKey) {
      // 1. Consulta o pagamento diretamente na API do Mercado Pago
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (mpRes.ok) {
        const payment = await mpRes.json();

        if (payment && payment.external_reference) {
          const bookingId = payment.external_reference;

          // 2. Busca a reserva no Supabase
          const reqBooking = await fetch(`${supabaseUrl}/rest/v1/booking_requests?id=eq.${bookingId}`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });
          const bookings = await reqBooking.json();

          if (Array.isArray(bookings) && bookings.length > 0) {
            const b = bookings[0];

            if (payment.status === 'approved') {
              // 3. SE APROVADO: Atualiza para confirmado no Supabase
              await fetch(`${supabaseUrl}/rest/v1/booking_requests?id=eq.${bookingId}`, {
                method: 'PATCH',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  status: 'confirmed',
                  payment_id: String(payment.id),
                  payment_status: 'approved',
                  amount: payment.transaction_amount
                })
              });

              // 4. Bloqueia a data
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

              // 5. Remove de pendente
              await fetch(`${supabaseUrl}/rest/v1/pending_dates?date=eq.${b.date}`, {
                method: 'DELETE',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`
                }
              });
            } else {
              // Se NÃO foi aprovado (pending, in_process, rejected, cancelled)
              // Atualiza apenas o payment_id e payment_status, mantendo status pendente e SEM bloquear a data
              await fetch(`${supabaseUrl}/rest/v1/booking_requests?id=eq.${bookingId}`, {
                method: 'PATCH',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  payment_id: String(payment.id),
                  payment_status: payment.status
                })
              });
            }
          }
        }
      }
    }

    // Mercado Pago exige resposta rápida HTTP 200 para confirmar recebimento
    return res.status(200).send('OK');
  } catch (err) {
    console.error('Erro no webhook Mercado Pago:', err);
    return res.status(200).send('OK');
  }
}
