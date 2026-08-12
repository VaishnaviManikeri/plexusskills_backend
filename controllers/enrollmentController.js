import nodemailer from 'nodemailer';

const clean = (value, max = 150) => String(value || '').trim().slice(0, max);
const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export const submitEnrollment = async (req, res) => {
  const enrollment = {
    fullName: clean(req.body.fullName, 100),
    mobileNumber: clean(req.body.mobileNumber, 20),
    email: clean(req.body.email, 150).toLowerCase(),
    interestedCourse: clean(req.body.interestedCourse, 120),
  };

  if (Object.values(enrollment).some((value) => !value)) return res.status(400).json({ message: 'Please complete all required fields.' });
  if (!/^[0-9+() -]{7,20}$/.test(enrollment.mobileNumber)) return res.status(400).json({ message: 'Please enter a valid mobile number.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enrollment.email)) return res.status(400).json({ message: 'Please enter a valid email address.' });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return res.status(503).json({ message: 'Email service is temporarily unavailable. Please contact us by phone.' });

  const mailer = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true' || Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  const recipient = process.env.ENQUIRY_TO_EMAIL || 'contact@plexusskills.in';
  const from = process.env.SMTP_FROM || `Plexus Skills <${SMTP_USER}>`;
  const rows = [['Full Name', enrollment.fullName], ['Mobile Number', enrollment.mobileNumber], ['Email ID', enrollment.email], ['Interested Course', enrollment.interestedCourse]].map(([label, value]) => `<tr><td style="padding:9px 12px;border:1px solid #ddd;font-weight:700">${label}</td><td style="padding:9px 12px;border:1px solid #ddd">${escapeHtml(value)}</td></tr>`).join('');

  try {
    await mailer.sendMail({ from, to: recipient, replyTo: enrollment.email, subject: `New course enrollment: ${enrollment.fullName}`, html: `<div style="font-family:Arial,sans-serif;color:#031234"><h2 style="color:#761e6b">New Course Enrollment</h2><table style="border-collapse:collapse;width:100%;max-width:650px">${rows}</table></div>`, text: `New Course Enrollment\n\nFull Name: ${enrollment.fullName}\nMobile Number: ${enrollment.mobileNumber}\nEmail ID: ${enrollment.email}\nInterested Course: ${enrollment.interestedCourse}` });
    await mailer.sendMail({ from, to: enrollment.email, replyTo: recipient, subject: 'We received your enrollment request | Plexus Skills', html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#031234;line-height:1.65"><h2 style="color:#761e6b">Thank you, ${escapeHtml(enrollment.fullName)}!</h2><p>We received your enrollment request for <strong>${escapeHtml(enrollment.interestedCourse)}</strong>.</p><p>Our admissions team will contact you shortly on <strong>${escapeHtml(enrollment.mobileNumber)}</strong> with the next steps.</p><p>Regards,<br><strong>Plexus Skills Team</strong></p></div>`, text: `Thank you, ${enrollment.fullName}! We received your enrollment request for ${enrollment.interestedCourse}. Our admissions team will contact you shortly on ${enrollment.mobileNumber}.\n\nRegards,\nPlexus Skills Team` });
    return res.status(201).json({ message: 'Your enrollment request has been submitted successfully.' });
  } catch (error) {
    console.error('Course enrollment email error:', error);
    return res.status(502).json({ message: 'We could not submit your enrollment right now. Please try again shortly.' });
  }
};
