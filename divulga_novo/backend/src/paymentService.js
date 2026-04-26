import { MercadoPagoConfig, Preference } from 'mercadopago';

/**
 * Cria uma preferência de pagamento no Mercado Pago
 */
export async function createPaymentPreference(items, orderId) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('Configuração do Mercado Pago (MP_ACCESS_TOKEN) ausente no .env');
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  // Formata os itens para o Mercado Pago
  const mpItems = items.map(item => ({
    id: item.id,
    title: item.name,
    unit_price: Number(item.price),
    quantity: Number(item.qty),
    currency_id: 'BRL'
  }));

  try {
    const frontendUrl = process.env.FRONTEND_URL || '';
    const isPublicUrl = frontendUrl.startsWith('https://');

    const preferenceBody = {
      items: mpItems,
      external_reference: orderId,
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' }
        ],
        installments: 12
      },
      notification_url: process.env.BACKEND_URL
        ? `${process.env.BACKEND_URL}/api/payments/webhook`
        : undefined,
    };

    // back_urls + auto_return só funcionam com URLs públicas (não localhost)
    if (isPublicUrl) {
      preferenceBody.back_urls = {
        success: `${frontendUrl}/menu.html?payment=success`,
        failure: `${frontendUrl}/menu.html?payment=failure`,
        pending: `${frontendUrl}/menu.html?payment=pending`,
      };
      preferenceBody.auto_return = 'approved';
    }

    const response = await preference.create({ body: preferenceBody });

    return {
      init_point: response.init_point, // Link para redirecionar o cliente
      id: response.id
    };
  } catch (error) {
    console.error('[PAYMENT] Erro ao criar preferência:', error);
    throw error;
  }
}
