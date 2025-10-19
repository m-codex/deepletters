# Voiceletter

## Configuration

### Supabase

This project uses Supabase for its backend. To ensure the magic link authentication works correctly, you must disable the "Confirm email" setting in your Supabase project's email provider settings.

To do this, navigate to your Supabase project's dashboard, then go to **Authentication** > **Providers** > **Email** and disable the **Confirm email** toggle. This will ensure that the redirect URL from the magic link includes the necessary authentication code.
