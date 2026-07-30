import nodemailer from 'nodemailer';

// Gmail SMTP configuration
const SMTP_HOST = process.env.SMTP_SERVER || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || "addytiwari3@gmail.com";
const SMTP_PASS = process.env.SMTP_PASSWORD || "zreycsrvfehhfwyk";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export default async function handler(req, res) {
  // CORS Headers allowing direct API requests from browser origins
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { to, subject, html, attachments } = req.body || {};

      if (!to) {
        return res.status(400).json({ error: 'Recipient email address ("to") is required.' });
      }

      // Convert Base64 attachments payload into Nodemailer attachment structure
      const formattedAttachments = (attachments || []).map(att => ({
        filename: att.filename || 'VitalsGuard_Report.html',
        content: att.content ? Buffer.from(att.content, 'base64') : (att.text || ''),
        contentType: att.contentType || 'text/html'
      }));

      const info = await transporter.sendMail({
        from: `VitalsGuard Health Tracker <${SMTP_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject || 'VitalsGuard Health Report',
        html: html || '<p>VitalsGuard Health Report</p>',
        attachments: formattedAttachments
      });

      console.log('[SMTP Live Dispatch Success]:', info.messageId);
      return res.status(200).json({ 
        success: true, 
        messageId: info.messageId, 
        accepted: info.accepted,
        provider: 'smtp'
      });
    } catch (error) {
      console.error('[Email Dispatch Error]:', error);
      return res.status(400).json({ error: error.message || 'Email dispatch failed' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
