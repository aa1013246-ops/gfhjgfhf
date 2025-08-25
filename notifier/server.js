const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5055;

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Configure Twilio
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/notify', async (req, res) => {
  const { title, message, whatsappTo, emailTo } = req.body || {};
  const subject = title || 'تنبيه الحملة';
  const text = message || 'تم رصد تغيير في معلومات النشاط التجاري.';

  const results = { email: null, whatsapp: null };

  try {
    // Send Email via SendGrid
    if (sgMail && process.env.SENDGRID_API_KEY && (emailTo || process.env.EMAIL_TO)) {
      const to = emailTo || process.env.EMAIL_TO;
      const emailMsg = {
        to,
        from: process.env.EMAIL_FROM || 'no-reply@example.com',
        subject: subject,
        text: text,
      };
      await sgMail.send(emailMsg);
      results.email = { to };
    }
  } catch (e) {
    results.email = { error: e.message };
  }

  try {
    // Send WhatsApp via Twilio
    if (
      twilioClient &&
      process.env.TWILIO_WHATSAPP_FROM &&
      (whatsappTo || process.env.WHATSAPP_TO)
    ) {
      const to = whatsappTo || process.env.WHATSAPP_TO;
      const msg = await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to,
        body: `${subject} - ${text}`,
      });
      results.whatsapp = { sid: msg.sid, to };
    }
  } catch (e) {
    results.whatsapp = { error: e.message };
  }

  res.json({ ok: true, results });
});

app.listen(PORT, () => {
  console.log(`🔔 Notifier running on http://localhost:${PORT}`);
});


