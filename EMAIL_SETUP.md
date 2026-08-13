# Course enquiry email setup

Add the following variables to the backend `.env` file or to the environment settings of the deployed backend:

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=Plexus Skills <contact@plexusskills.in>
ENQUIRY_TO_EMAIL=contact@plexusskills.in
CORS_ORIGINS=https://plexusskills.in,https://www.plexusskills.in,https://plexusskills.netlify.app
```

Use port `465` with `SMTP_SECURE=true`, or port `587` with `SMTP_SECURE=false`. The email provider must allow the account to send from the address set in `SMTP_FROM`.

The public form endpoints are `/api/enquiries`, `/api/enrollments`,
`/api/webinar-registrations`, and `/api/submissions/*`. They send submitted
details to `ENQUIRY_TO_EMAIL` and an automatic confirmation to the visitor.

Set the same variables in the deployed backend environment (for example,
Render); a local `.env` file is not uploaded automatically. When using Gmail,
`SMTP_PASS` must be a Google App Password and the authenticated account must be
allowed to use the address in `SMTP_FROM`.
