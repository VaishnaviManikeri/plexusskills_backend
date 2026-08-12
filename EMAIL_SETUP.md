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
```

Use port `465` with `SMTP_SECURE=true`, or port `587` with `SMTP_SECURE=false`. The email provider must allow the account to send from the address set in `SMTP_FROM`.

The API endpoint is `POST /api/enquiries`. It sends the submitted details to `ENQUIRY_TO_EMAIL` and sends an automatic confirmation when the visitor provides an email address.
