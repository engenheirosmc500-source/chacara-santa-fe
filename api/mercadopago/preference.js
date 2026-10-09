export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body || {};
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(400).json({
        error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado nas variáveis da Vercel.',
        missingToken: true
      });
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const origin = `${proto}://${host}`;

    const preferencePayload = {
      items: [
        {
          title: data.title || `Reserva Chácara Santa Fé - ${data.date}`,
          unit_price: Number(data.amount || process.env.RESERVATION_AMOUNT || 1),
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
      auto_return: 'approved',
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
      return res.status(mpRes.status).json({
        error: mpJson.message || 'Erro no Mercado Pago',
        details: mpJson
      });
    }

    return res.status(200).json({
      id: mpJson.id,
      init_point: mpJson.init_point,
      sandbox_init_point: mpJson.sandbox_init_point
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
