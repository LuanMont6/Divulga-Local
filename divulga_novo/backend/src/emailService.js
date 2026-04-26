import nodemailer from 'nodemailer';

/**
 * Envia e-mail de boas-vindas com o link do cardápio
 */
export async function sendWelcomeEmail(email, slug) {
  // Configuração do transportador
  // Por padrão, usaremos variáveis de ambiente para segurança
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 465,
    secure: true, // true para 465, false para outras portas
    auth: {
      user: process.env.EMAIL_USER, // Seu e-mail (ex: contato@seudominio.com)
      pass: process.env.EMAIL_PASS, // Sua senha ou Senha de App
    },
  });

  const menuUrl = `https://maindest.netlify.app/divulga_novo/Menu%20digital/menu.html?store=${slug}`;

  const mailOptions = {
    from: `"MAIND | Web Cardápio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🚀 Seu Cardápio Digital está pronto!',
    html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #6D28D9; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Parabéns!</h1>
        </div>
        <div style="padding: 30px;">
          <p>Olá,</p>
          <p>Seu cardápio digital foi criado com sucesso. Agora você já pode começar a vender pelo WhatsApp!</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <p style="margin-bottom: 10px; font-weight: bold;">Link do seu cardápio:</p>
            <a href="${menuUrl}" style="color: #6D28D9; font-size: 18px; word-break: break-all;">${menuUrl}</a>
          </div>

          <p><strong>Dica:</strong> Guarde este e-mail para acessar seu link sempre que precisar.</p>
          
          <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #777;">
            <p>Este é um e-mail automático do sistema MAIND Web Cardápio.</p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Enviado com sucesso:', info.messageId);
    return true;
  } catch (error) {
    console.error('[EMAIL] Erro ao enviar e-mail:', error);
    return false;
  }
}
