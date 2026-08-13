import nodemailer from 'nodemailer';

const requiredFields = ['fullName', 'mobileNumber', 'qualification', 'interestedCourse', 'city'];
const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const clean = (value, maxLength = 150) => String(value || '').trim().slice(0, maxLength);

export const submitEnquiry = async (req, res) => {
  const enquiry = {
    fullName: clean(req.body.fullName, 100), mobileNumber: clean(req.body.mobileNumber, 20),
    email: clean(req.body.email, 150).toLowerCase(), qualification: clean(req.body.qualification, 100),
    interestedCourse: clean(req.body.interestedCourse, 120), city: clean(req.body.city, 100),
  };
  if (requiredFields.some((field) => !enquiry[field])) return res.status(400).json({ message: 'Please complete all required fields.' });
  if (!/^[0-9+() -]{7,20}$/.test(enquiry.mobileNumber)) return res.status(400).json({ message: 'Please enter a valid mobile number.' });
  if (enquiry.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) return res.status(400).json({ message: 'Please enter a valid email address.' });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error('Course enquiry email is not configured.');
    return res.status(503).json({ message: 'Email service is temporarily unavailable. Please contact us by phone.' });
  }
  const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true' || Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS }, pool: true, maxConnections: 2, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 });
  const recipient = process.env.ENQUIRY_TO_EMAIL || 'contact@plexusskills.in';
  const from = process.env.SMTP_FROM || `Plexus Skills <${SMTP_USER}>`;
  const rows = [['Full Name',enquiry.fullName],['Mobile Number',enquiry.mobileNumber],['Email ID',enquiry.email||'Not provided'],['Qualification',enquiry.qualification],['Interested Course',enquiry.interestedCourse],['City',enquiry.city]].map(([label,value])=>`<tr><td style="padding:9px 12px;border:1px solid #dbe5e8;font-weight:700">${label}</td><td style="padding:9px 12px;border:1px solid #dbe5e8">${escapeHtml(value)}</td></tr>`).join('');
  try {
    const messages = [transporter.sendMail({ from, to: recipient, replyTo: enquiry.email || undefined, subject: `New course enquiry: ${enquiry.fullName}`, html: `<div style="font-family:Arial,sans-serif;color:#17384d"><h2 style="color:#087d76">New Course Enquiry</h2><table style="border-collapse:collapse;width:100%;max-width:650px">${rows}</table></div>`, text: `New Course Enquiry\n\nFull Name: ${enquiry.fullName}\nMobile Number: ${enquiry.mobileNumber}\nEmail ID: ${enquiry.email || 'Not provided'}\nQualification: ${enquiry.qualification}\nInterested Course: ${enquiry.interestedCourse}\nCity: ${enquiry.city}` })];
    if (enquiry.email) messages.push(transporter.sendMail({ from, to: enquiry.email, replyTo: recipient, subject: 'We received your course enquiry | Plexus Skills', html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17384d;line-height:1.65"><h2 style="color:#087d76">Thank you, ${escapeHtml(enquiry.fullName)}!</h2><p>We have received your enquiry for <strong>${escapeHtml(enquiry.interestedCourse)}</strong>.</p><p>Our career counselling team will contact you shortly on <strong>${escapeHtml(enquiry.mobileNumber)}</strong>.</p><p>Regards,<br><strong>Plexus Skills Team</strong></p></div>`, text: `Thank you, ${enquiry.fullName}! We received your enquiry for ${enquiry.interestedCourse}. Our career counselling team will contact you shortly on ${enquiry.mobileNumber}.\n\nRegards,\nPlexus Skills Team` }));
    await Promise.all(messages);
    return res.status(201).json({ message: 'Your enquiry has been submitted successfully.' });
  } catch (error) {
    console.error('Course enquiry email error:', error);
    return res.status(502).json({ message: 'We could not send your enquiry right now. Please try again shortly.' });
  }
};
