import nodemailer from 'nodemailer';

const clean = (value, max = 500) => String(value || '').trim().slice(0, max);
const escapeHtml = (value = '') => clean(value, 5000).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+() -]{7,20}$/;

const getMailer = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  return {
    transport: nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true' || Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS }, pool: true, maxConnections: 2, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 }),
    recipient: process.env.ENQUIRY_TO_EMAIL || 'contact@plexusskills.in',
    from: process.env.SMTP_FROM || `Plexus Skills <${SMTP_USER}>`,
  };
};

const sendSubmission = async (res, { title, subject, name, email, fields, replySubject, replyText, attachment }) => {
  const mailer = getMailer();
  if (!mailer) return res.status(503).json({ message: 'Email service is temporarily unavailable. Please contact us by phone.' });
  const rows = fields.map(([label, value]) => `<tr><td style="padding:9px 12px;border:1px solid #ddd;font-weight:700">${escapeHtml(label)}</td><td style="padding:9px 12px;border:1px solid #ddd">${escapeHtml(value || 'Not provided')}</td></tr>`).join('');
  try {
    await Promise.all([
      mailer.transport.sendMail({ from: mailer.from, to: mailer.recipient, replyTo: email, subject, html: `<div style="font-family:Arial,sans-serif"><h2>${escapeHtml(title)}</h2><table style="border-collapse:collapse;width:100%;max-width:700px">${rows}</table></div>`, text: fields.map(([label, value]) => `${label}: ${value || 'Not provided'}`).join('\n'), attachments: attachment ? [{ filename: attachment.originalname, content: attachment.buffer, contentType: attachment.mimetype }] : undefined }),
      mailer.transport.sendMail({ from: mailer.from, to: email, replyTo: mailer.recipient, subject: replySubject, html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Thank you, ${escapeHtml(name)}!</h2><p>${escapeHtml(replyText)}</p><p>Regards,<br><strong>Plexus Skills Team</strong></p></div>`, text: `Thank you, ${name}! ${replyText}\n\nRegards,\nPlexus Skills Team` }),
    ]);
    return res.status(201).json({ message: 'Your form has been submitted successfully.' });
  } catch (error) {
    console.error(`${title} email error:`, error);
    return res.status(502).json({ message: 'We could not submit your form right now. Please try again shortly.' });
  }
};

const validate = (email, phone) => !emailPattern.test(email) ? 'Please enter a valid email address.' : phone && !phonePattern.test(phone) ? 'Please enter a valid phone number.' : null;

export const submitContact = async (req, res) => {
  const d = { name: clean(req.body.name,100), email: clean(req.body.email,150).toLowerCase(), phone: clean(req.body.phone,20), subject: clean(req.body.subject,150), message: clean(req.body.message,3000) };
  if (!d.name || !d.email || !d.subject || !d.message) return res.status(400).json({ message: 'Please complete all required fields.' }); const error=validate(d.email,d.phone); if(error)return res.status(400).json({message:error});
  return sendSubmission(res,{title:'New Contact Message',subject:`New contact message: ${d.subject}`,name:d.name,email:d.email,fields:[['Name',d.name],['Email',d.email],['Phone',d.phone],['Subject',d.subject],['Message',d.message]],replySubject:'We received your message | Plexus Skills',replyText:'We received your message and our team will respond within 24 hours.'});
};
export const submitAdvisor = async (req,res)=>{const d={name:clean(req.body.name,100),phone:clean(req.body.phone,20),email:clean(req.body.email,150).toLowerCase(),preferredTime:clean(req.body.preferredTime,20),course:clean(req.body.course,150),message:clean(req.body.message,2000)};if(!d.name||!d.phone||!d.email||!d.preferredTime||!d.course)return res.status(400).json({message:'Please complete all required fields.'});const error=validate(d.email,d.phone);if(error)return res.status(400).json({message:error});return sendSubmission(res,{title:'New Adviser Callback Request',subject:`New adviser request: ${d.name}`,name:d.name,email:d.email,fields:[['Name',d.name],['Phone',d.phone],['Email',d.email],['Preferred Time',d.preferredTime],['Course',d.course],['Message',d.message]],replySubject:'Callback request received | Plexus Skills',replyText:'We received your callback request. Our adviser will contact you soon.'});};
export const submitPartnership = async(req,res)=>{const d={name:clean(req.body.name,100),designation:clean(req.body.designation,100),contact:clean(req.body.contact,20),email:clean(req.body.email,150).toLowerCase(),collegeName:clean(req.body.collegeName,200)};if(Object.values(d).some(v=>!v))return res.status(400).json({message:'Please complete all required fields.'});const error=validate(d.email,d.contact);if(error)return res.status(400).json({message:error});return sendSubmission(res,{title:'New College Partnership Request',subject:`New college partnership: ${d.collegeName}`,name:d.name,email:d.email,fields:[['Name',d.name],['Designation',d.designation],['Contact',d.contact],['Email',d.email],['College',d.collegeName]],replySubject:'Partnership request received | Plexus Skills',replyText:'We received your partnership request. Our team will contact you shortly.'});};
export const submitCareerApplication = async(req,res)=>{const d={name:clean(req.body.name,100),contact:clean(req.body.contact,20),email:clean(req.body.email,150).toLowerCase(),position:clean(req.body.position,150),experience:clean(req.body.experience,3000)};if(Object.values(d).some(v=>!v)||!req.file)return res.status(400).json({message:'Please complete all fields and attach your résumé.'});const error=validate(d.email,d.contact);if(error)return res.status(400).json({message:error});return sendSubmission(res,{title:'New Career Application',subject:`Career application: ${d.position} - ${d.name}`,name:d.name,email:d.email,fields:[['Name',d.name],['Contact',d.contact],['Email',d.email],['Position',d.position],['Experience',d.experience],['Résumé',req.file.originalname]],attachment:req.file,replySubject:'Application received | Plexus Skills',replyText:'We received your application. Our HR team will review it and contact you if shortlisted.'});};
