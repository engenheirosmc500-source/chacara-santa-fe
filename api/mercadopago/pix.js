export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body || {};
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(400).json({
        error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado.',
        missingToken: true
      });
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const origin = `${proto}://${host}`;

    // Determina o nome do cliente
    const rawName = (data.name || 'Cliente').trim();
    const nameParts = rawName.split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'Hóspede';

    // Cria o pagamento PIX diretamente na API do Mercado Pago
    const paymentPayload = {
      transaction_amount: Number(data.amount || process.env.RESERVATION_AMOUNT || 1),
      description: data.title || `Reserva Chácara Santa Fé - ${data.date}`,
      payment_method_id: 'pix',
      payer: {
        email: data.email || 'contato@chacarasantafe.com.br',
        first_name: firstName,
        last_name: lastName
      },
      external_reference: data.bookingId || String(Date.now()),
      notification_url: `${origin}/api/mercadopago/webhook`
    };

    const idempotencyKey = `pix-${data.bookingId || Date.now()}-${Date.now()}`;

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(paymentPayload)
    });

    const mpJson = await mpRes.json();

    if (!mpRes.ok) {
      console.error('Erro na criação de PIX no Mercado Pago:', mpJson);
      return res.status(mpRes.status).json({
        error: mpJson.message || 'Erro ao gerar PIX no Mercado Pago',
        details: mpJson
      });
    }

    const qrCode = mpJson.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpJson.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl = mpJson.point_of_interaction?.transaction_data?.ticket_url;

    return res.status(200).json({
      paymentId: mpJson.id,
      status: mpJson.status,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      ticket_url: ticketUrl,
      amount: mpJson.transaction_amount,
      bookingId: data.bookingId
    });
  } catch (err) {
    console.error('Erro em pix.js:', err);
    return res.status(500).json({ error: err.message });
  }
}
