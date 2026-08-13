import nodemailer from 'nodemailer';

const clean = (value, max = 500) => String(value || '').trim().slice(0, max);
const escapeHtml = (value = '') => clean(value, 5000).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+() -]{7,20}$/;

const mailSettings = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  return {
    transporter: nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true' || Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    }),
    recipient: process.env.ENQUIRY_TO_EMAIL || 'contact@plexusskills.in',
    from: process.env.SMTP_FROM || `Plexus Skills <${SMTP_USER}>`,
  };
};

const submit = async (res, { title, subject, userName, userEmail, fields, confirmation, attachment }) => {
  const settings = mailSettings();
  if (!settings) return res.status(503).json({ message: 'Email service is temporarily unavailable. Please contact us by phone.' });
  const rows = fields.map(([label, value]) => `<tr><td style="padding:9px 12px;border:1px solid #ddd;font-weight:700">${escapeHtml(label)}</td><td style="padding:9px 12px;border:1px solid #ddd">${escapeHtml(value || 'Not provided')}</td></tr>`).join('');
  const text = `${title}\n\n${fields.map(([label, value]) => `${label}: ${value || 'Not provided'}`).join('\n')}`;
  try {
    await settings.transporter.sendMail({
      from: settings.from, to: settings.recipient, replyTo: userEmail, subject,
      html: `<div style="font-family:Arial,sans-serif;color:#031234"><h2 style="color:#761e6b">${escapeHtml(title)}</h2><table style="border-collapse:collapse;width:100%;max-width:700px">${rows}</table></div>`,
      text,
      attachments: attachment ? [{ filename: attachment.originalname, content: attachment.buffer, contentType: attachment.mimetype }] : undefined,
    });
    await settings.transporter.sendMail({
      from: settings.from, to: userEmail, replyTo: settings.recipient,
      subject: confirmation.subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#031234;line-height:1.65"><h2 style="color:#761e6b">Thank you, ${escapeHtml(userName)}!</h2><p>${confirmation.html}</p><p>Regards,<br><strong>Plexus Skills Team</strong></p></div>`,
      text: `Thank you, ${userName}! ${confirmation.text}\n\nRegards,\nPlexus Skills Team`,
    });
    return res.status(201).json({ message: 'Your form has been submitted successfully.' });
  } catch (error) {
    console.error(`${title} email error:`, error);
    return res.status(502).json({ message: 'We could not submit your form right now. Please try again shortly.' });
  }
};

const validateContact = (email, phone) => {
  if (!emailPattern.test(email)) return 'Please enter a valid email address.';
  if (phone && !phonePattern.test(phone)) return 'Please enter a valid phone number.';
  return null;
};

export const submitContact = async (req, res) => {
  const data = { name: clean(req.body.name, 100), email: clean(req.body.email, 150).toLowerCase(), phone: clean(req.body.phone, 20), subject: clean(req.body.subject, 150), message: clean(req.body.message, 3000) };
  if (!data.name || !data.email || !data.subject || !data.message) return res.status(400).json({ message: 'Please complete all required fields.' });
  const error = validateContact(data.email, data.phone); if (error) return res.status(400).json({ message: error });
  return submit(res, { title: 'New Contact Message', subject: `New contact message: ${data.subject}`, userName: data.name, userEmail: data.email, fields: [['Full Name', data.name], ['Email ID', data.email], ['Phone Number', data.phone], ['Subject', data.subject], ['Message', data.message]], confirmation: { subject: 'We received your message | Plexus Skills', html: 'We received your message and our team will respond within 24 hours.', text: 'We received your message and our team will respond within 24 hours.' } });
};

export const submitAdvisor = async (req, res) => {
  const data = { name: clean(req.body.name, 100), phone: clean(req.body.phone, 20), email: clean(req.body.email, 150).toLowerCase(), preferredTime: clean(req.body.preferredTime, 20), course: clean(req.body.course, 150), message: clean(req.body.message, 2000) };
  if (!data.name || !data.phone || !data.email || !data.preferredTime || !data.course) return res.status(400).json({ message: 'Please complete all required fields.' });
  const error = validateContact(data.email, data.phone); if (error) return res.status(400).json({ message: error });
  return submit(res, { title: 'New Adviser Callback Request', subject: `New adviser request: ${data.name}`, userName: data.name, userEmail: data.email, fields: [['Full Name', data.name], ['Phone Number', data.phone], ['Email ID', data.email], ['Preferred Call Time', data.preferredTime], ['Interested Course', data.course], ['Message', data.message]], confirmation: { subject: 'Your callback request is received | Plexus Skills', html: `We received your callback request about <strong>${escapeHtml(data.course)}</strong>. Our adviser will contact you soon.`, text: `We received your callback request about ${data.course}. Our adviser will contact you soon.` } });
};

export const submitPartnership = async (req, res) => {
  const data = { name: clean(req.body.name, 100), designation: clean(req.body.designation, 100), contact: clean(req.body.contact, 20), email: clean(req.body.email, 150).toLowerCase(), collegeName: clean(req.body.collegeName, 200) };
  if (Object.values(data).some((value) => !value)) return res.status(400).json({ message: 'Please complete all required fields.' });
  const error = validateContact(data.email, data.contact); if (error) return res.status(400).json({ message: error });
  return submit(res, { title: 'New College Partnership Request', subject: `New college partnership: ${data.collegeName}`, userName: data.name, userEmail: data.email, fields: [['Name', data.name], ['Designation', data.designation], ['Contact Number', data.contact], ['Email ID', data.email], ['College Name', data.collegeName]], confirmation: { subject: 'Your partnership request is received | Plexus Skills', html: `We received the partnership request for <strong>${escapeHtml(data.collegeName)}</strong>. Our team will contact you shortly.`, text: `We received the partnership request for ${data.collegeName}. Our team will contact you shortly.` } });
};

export const submitJobApplication = async (req, res) => {
  const data = { name: clean(req.body.name, 100), contact: clean(req.body.contact, 20), email: clean(req.body.email, 150).toLowerCase(), position: clean(req.body.position, 150), experience: clean(req.body.experience, 3000) };
  if (Object.values(data).some((value) => !value) || !req.file) return res.status(400).json({ message: 'Please complete all fields and attach your résumé.' });
  const error = validateContact(data.email, data.contact); if (error) return res.status(400).json({ message: error });
  return submit(res, { title: 'New Career Application', subject: `Career application: ${data.position} — ${data.name}`, userName: data.name, userEmail: data.email, fields: [['Name', data.name], ['Contact Number', data.contact], ['Email ID', data.email], ['Position', data.position], ['Experience', data.experience], ['Résumé', req.file.originalname]], attachment: req.file, confirmation: { subject: 'We received your application | Plexus Skills', html: `We received your application for <strong>${escapeHtml(data.position)}</strong>. Our HR team will review it and contact you if your profile is shortlisted.`, text: `We received your application for ${data.position}. Our HR team will review it and contact you if your profile is shortlisted.` } });
};
