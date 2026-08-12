import nodemailer from 'nodemailer';

const clean = (value, max = 150) => String(value || '').trim().slice(0, max);
const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export const registerForWebinar = async (req, res) => {
  const registration = {
    fullName: clean(req.body.fullName, 100),
    mobile: clean(req.body.mobile, 20),
    email: clean(req.body.email, 150).toLowerCase(),
    webinarDate: clean(req.body.webinarDate, 100),
    attendeeType: clean(req.body.attendeeType, 50),
  };

  if (Object.values(registration).some((value) => !value)) return res.status(400).json({ message: 'Please complete all required fields.' });
  if (!/^[0-9+() -]{7,20}$/.test(registration.mobile)) return res.status(400).json({ message: 'Please enter a valid mobile number.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email)) return res.status(400).json({ message: 'Please enter a valid email address.' });
  if (!['Student', 'Working Professional'].includes(registration.attendeeType)) return res.status(400).json({ message: 'Please select a valid current status.' });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return res.status(503).json({ message: 'Email service is temporarily unavailable. Please contact us by phone.' });

  const mailer = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true' || Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  const recipient = process.env.ENQUIRY_TO_EMAIL || 'contact@plexusskills.in';
  const from = process.env.SMTP_FROM || `Plexus Skills <${SMTP_USER}>`;
  const rows = [['Full Name', registration.fullName], ['Mobile Number', registration.mobile], ['Email ID', registration.email], ['Upcoming Webinar Date', registration.webinarDate], ['Current Status', registration.attendeeType]].map(([label, value]) => `<tr><td style="padding:9px 12px;border:1px solid #ddd;font-weight:700">${label}</td><td style="padding:9px 12px;border:1px solid #ddd">${escapeHtml(value)}</td></tr>`).join('');

  try {
    await mailer.sendMail({ from, to: recipient, replyTo: registration.email, subject: `New webinar registration: ${registration.fullName}`, html: `<div style="font-family:Arial,sans-serif;color:#031234"><h2 style="color:#761e6b">New Webinar Registration</h2><table style="border-collapse:collapse;width:100%;max-width:650px">${rows}</table></div>`, text: `New Webinar Registration\n\nFull Name: ${registration.fullName}\nMobile Number: ${registration.mobile}\nEmail ID: ${registration.email}\nUpcoming Webinar Date: ${registration.webinarDate}\nCurrent Status: ${registration.attendeeType}` });
    await mailer.sendMail({ from, to: registration.email, replyTo: recipient, subject: 'Your webinar seat is reserved | Plexus Skills', html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#031234;line-height:1.65"><h2 style="color:#761e6b">Your seat is reserved, ${escapeHtml(registration.fullName)}!</h2><p>We received your registration for the webinar on <strong>${escapeHtml(registration.webinarDate)}</strong>.</p><p>Our team will share the webinar joining details with you by email and mobile.</p><p>Regards,<br><strong>Plexus Skills Team</strong></p></div>`, text: `Your seat is reserved, ${registration.fullName}! We received your registration for the webinar on ${registration.webinarDate}. Our team will share the joining details with you.\n\nRegards,\nPlexus Skills Team` });
    return res.status(201).json({ message: 'Your webinar seat has been reserved successfully.' });
  } catch (error) {
    console.error('Webinar registration email error:', error);
    return res.status(502).json({ message: 'We could not reserve your seat right now. Please try again shortly.' });
  }
};
