export default async function handler(req, res) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!accessToken) {
      return res.status(400).json({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado' });
    }

    const { payment_id, booking_id } = req.query || {};

    if (!payment_id && !booking_id) {
      return res.status(400).json({ error: 'Informe payment_id ou booking_id' });
    }

    let payment = null;

    // 1. Se tem payment_id, busca diretamente
    if (payment_id) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (mpRes.ok) {
        payment = await mpRes.json();
      }
    }

    // 2. Se não achou por payment_id ou só tem booking_id, busca pelo external_reference
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

    // 3. Se achou pagamento no Mercado Pago
    if (payment) {
      const isApproved = payment.status === 'approved';
      const actualBookingId = payment.external_reference || booking_id;

      // Se foi aprovado, sincroniza com o Supabase
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
              // Atualiza para confirmado
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

              // Bloqueia a data
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

              // Remove de pendentes
              await fetch(`${supabaseUrl}/rest/v1/pending_dates?date=eq.${b.date}`, {
                method: 'DELETE',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`
                }
              });
            }
          }
        } catch (syncErr) {
          console.error('Erro ao sincronizar status no Supabase:', syncErr);
        }
      }

      return res.status(200).json({
        paid: isApproved,
        status: payment.status,
        status_detail: payment.status_detail,
        paymentId: payment.id,
        amount: payment.transaction_amount,
        paymentMethod: payment.payment_method_id,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url
      });
    }

    // 4. Se não achou no Mercado Pago, verifica se o Supabase já tem a reserva confirmada
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
          return res.status(200).json({
            paid: true,
            status: 'approved',
            paymentId: b.payment_id,
            amount: b.amount,
            date: b.date
          });
        }
      }
    }

    return res.status(200).json({
      paid: false,
      status: 'not_found',
      message: 'Nenhum pagamento identificado para esta reserva.'
    });

  } catch (err) {
    console.error('Erro em check-status:', err);
    return res.status(500).json({ error: err.message });
  }
}
