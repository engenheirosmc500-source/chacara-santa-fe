export default async function handler(req, res) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token não configurado' });
    }

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=20', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const mpData = await mpRes.json();
    const approvedPayments = (mpData.results || []).filter(p => p.status === 'approved' && p.external_reference);

    const synced = [];

    if (supabaseUrl && supabaseKey) {
      for (const payment of approvedPayments) {
        const bookingId = payment.external_reference;

        const reqBooking = await fetch(`${supabaseUrl}/rest/v1/booking_requests?id=eq.${bookingId}`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        const bookings = await reqBooking.json();

        if (Array.isArray(bookings) && bookings.length > 0) {
          const b = bookings[0];

          if (b.status !== 'confirmed') {
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

            synced.push({ bookingId, date: b.date, amount: payment.transaction_amount, paymentId: payment.id });
          }
        }
      }
    }

    return res.status(200).json({ success: true, syncedCount: synced.length, synced, totalApproved: approvedPayments.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
