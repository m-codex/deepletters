# Voiceletter

## Configuration

### Supabase

This project uses Supabase for its backend and the `@supabase/ssr` library for server-side authentication. For the magic link authentication to work correctly, you must configure your Supabase project to use the **PKCE (Proof-of-Key Exchange)** grant flow.

To enable this, follow these steps:

1.  **Enable Email Confirmation:**
    *   Navigate to your Supabase project's dashboard.
    *   Go to **Authentication** > **Providers** > **Email**.
    *   Enable the **Confirm email** toggle. This is required to trigger the PKCE flow for new users.

2.  **Verify the "Confirm signup" Email Template:**
    *   Go to **Authentication** > **Templates**.
    *   Open the **Confirm signup** email template.
    *   Ensure that the link in the email body uses the `{{ .ConfirmationURL }}` variable. For example:
        ```html
        <a href="{{ .ConfirmationURL }}">Confirm your signup</a>
        ```

This configuration ensures that Supabase sends the correct authentication `code` to the application's callback route, allowing the server-side logic to complete the sign-in and redirect the user to the dashboard.
