# Email Templates

Branded HTML email templates for Supabase Auth, styled to match the Team Manager app.

## Files

| File | Supabase Template | Trigger |
|---|---|---|
| `confirm-signup.html` | Confirm signup | User creates a new account |
| `reset-password.html` | Reset password | User clicks "forgot password" |
| `change-email.html` | Change email address | User updates their email in settings |

## Design

- Background: `#EEF2FF` (blue-tinted, matches `from-blue-50` gradient)
- Primary color: `#5767E8` (matches app `--primary` oklch value)
- Card: white, `border-radius: 16px`, subtle `#E5E7EB` border
- Font: Plus Jakarta Sans (loaded via Google Fonts link), falls back to Segoe UI / system sans-serif
- Layout: table-based with fully inline CSS for maximum email client compatibility

## Supabase Template Variables Used

| Variable | Description |
|---|---|
| `{{ .ConfirmationURL }}` | The magic link / action URL |
| `{{ .Email }}` | The user's email address (used in change-email template) |

## How to Apply

### 1. Configure Resend SMTP

In **Supabase Dashboard → Authentication → Settings → SMTP Settings**:

```
Host:     smtp.resend.com
Port:     465
Username: resend
Password: <your Resend API key>
Sender:   noreply@yourdomain.com
```

### 2. Paste the templates

In **Supabase Dashboard → Authentication → Email Templates**:

For each template:
1. Select the template type from the dropdown
2. Set the **Subject** (see suggestions below)
3. Paste the full HTML from the corresponding file into the **Body** field
4. Click **Save**

### Suggested subject lines

| Template | Subject |
|---|---|
| Confirm signup | `Confirm your Team Manager account` |
| Reset password | `Reset your Team Manager password` |
| Change email | `Confirm your new email address — Team Manager` |

### 3. Test

Send a test by signing up with a new account or using the **Send test email** button in the Supabase template editor. Check delivery and rendering in your Resend dashboard under **Logs**.

## Notes

- The Google Fonts `<link>` tag for Plus Jakarta Sans will load in most webmail clients (Gmail, Outlook web) but is ignored by native mail apps, which fall back to Segoe UI / system sans-serif. The fallback looks clean.
- Do not use external images in email templates — use emoji or inline SVG instead to avoid broken image links.
- If you add a **Magic Link** login flow in future, duplicate `confirm-signup.html` and change the heading/body text. The `{{ .ConfirmationURL }}` variable is the same.
