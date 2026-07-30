import nodemailer from 'nodemailer';

// Resend Email configuration (VITE_ prefixed or standard env key)
const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

// Gmail SMTP configuration retrieved from D:\mppsc\Antigravity-daily-CA-Insights\.env
const SMTP_HOST = process.env.SMTP_SERVER || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || "addytiwari5@gmail.com";
const SMTP_PASS = process.env.SMTP_PASSWORD || "wugdifrelwwzxskr";

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

      // 1. Attempt dispatch via Resend API if API Key is configured
      if (RESEND_API_KEY) {
        try {
          console.log('[Resend API Live Dispatch Attempt]');
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
              from: 'VitalsGuard Health Tracker <onboarding@resend.dev>',
              to: Array.isArray(to) ? to : [to],
              subject: subject || 'VitalsGuard Health Report',
              html: html || '<p>VitalsGuard Health Report</p>',
              attachments: (attachments || []).map(att => ({
                filename: att.filename || 'VitalsGuard_Report.html',
                content: att.content // Base64 string directly supported by Resend
              }))
            })
          });

          const resendData = await resendResponse.json();
          if (resendResponse.ok) {
            console.log('[Resend API Success]:', resendData.id);
            return res.status(200).json({ 
              success: true, 
              messageId: resendData.id,
              provider: 'resend'
            });
          } else {
            console.warn('[Resend API Failed, trying SMTP fallback]:', resendData.message);
          }
        } catch (resendError) {
          console.error('[Resend Dispatch Error, trying SMTP fallback]:', resendError);
        }
      }

      // 2. Fallback to Gmail SMTP via Nodemailer
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
