export default async function handler(req, res) {
  // O Mercado Pago envia notificações via POST ou GET
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    const query = req.query || {};
    const body = req.body || {};

    // Pega o ID do pagamento que foi atualizado
    const paymentId = query['data.id'] || query.id || body?.data?.id || (body.type === 'payment' ? body?.data?.id : null);

    if (paymentId && accessToken && supabaseUrl && supabaseKey) {
      // 1. Consulta o pagamento diretamente na API do Mercado Pago
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const payment = await mpRes.json();

      if (payment && payment.status === 'approved' && payment.external_reference) {
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

          // 3. Atualiza para confirmado no Supabase
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
        }
      }
    }

    // Mercado Pago espera sempre status 200/201 para confirmar recebimento
    return res.status(200).send('OK');
  } catch (err) {
    console.error('Erro no webhook Mercado Pago:', err);
    return res.status(200).send('OK');
  }
}
