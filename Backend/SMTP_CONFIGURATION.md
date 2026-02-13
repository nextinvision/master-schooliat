# SMTP Email Configuration Guide

## Overview

The backend uses **nodemailer** with SMTP for sending emails, including OTP emails for deletion verification. The email service is already implemented and configured.

## Configuration

### Environment Variables Required

Add these to your `.env` file in the Backend directory:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server host
SMTP_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                  # true for port 465, false for other ports
SMTP_USER=your-email@gmail.com     # Your SMTP username/email
SMTP_PASSWORD=your-app-password   # Your SMTP password or app password
SMTP_FROM=your-email@gmail.com     # From email address (optional, defaults to SMTP_USER)
```

### Common SMTP Providers

#### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use App Password, not regular password
```

**Note:** For Gmail, you need to:
1. Enable 2-Step Verification
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password as `SMTP_PASSWORD`

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-password
```

## Implementation Status

✅ **Email Service:** Fully implemented in `src/services/email.service.js`
✅ **OTP Service:** Fully implemented in `src/services/otp.service.js`
✅ **Deletion OTP Service:** Fully implemented in `src/services/otp-deletion.service.js`
✅ **Nodemailer:** Installed and configured

## Email Templates

The system includes HTML email templates for:
- OTP verification emails
- Password reset emails
- Deletion confirmation emails

All templates are branded with SchooliAt styling.

## Testing

To test email functionality:

1. Set up SMTP credentials in `.env`
2. Restart the backend server
3. Test OTP request: `POST /deletion-otp/request`
4. Check email inbox for OTP

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials** - Verify all environment variables are set correctly
2. **Check firewall** - Ensure port 587/465 is not blocked
3. **Check logs** - Backend logs will show email sending status
4. **Test connection** - Use a tool like `telnet` to test SMTP connection

### Gmail Specific Issues

- Must use App Password, not regular password
- Enable "Less secure app access" if using regular password (not recommended)
- Check if account has 2FA enabled

## Security Notes

- Never commit `.env` file with credentials
- Use App Passwords for Gmail instead of main password
- Consider using environment-specific SMTP servers
- Rotate passwords regularly

---

**Status:** ✅ Email system fully implemented and ready for configuration

