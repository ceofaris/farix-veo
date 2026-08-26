# Farix AI — Gemini Pro

Standalone Manifest V3 extension for switching a Farix-managed Gemini session.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select the `farix-ai-gemini` folder.
4. Open the extension's **Options** page and enter the Supabase project URL and **anon** key.
5. Open the popup, sign in with the Farix email/password account, then choose **Inject**.

The downloadable `farix-ai-gemini.zip` is also loadable after extraction.

## Supabase contract

The extension uses Supabase Auth password sign-in and these RPCs, configurable from Options:

- `get_random_active_account({ tool_slug: "gemini" })`
- `set_active_session({ tool_slug: "gemini", account_id, session_id })`
- `clear_active_session({ tool_slug: "gemini", account_id, session_id })`

The random-account RPC should return one account object (or a one-item array) with:

```json
{
  "id": "account-id",
  "tool_slug": "gemini",
  "label": "Gemini account",
  "cookies": [
    {
      "name": "SID",
      "value": "...",
      "domain": ".google.com",
      "path": "/",
      "secure": true,
      "httpOnly": true,
      "sameSite": "lax"
    }
  ]
}
```

`tool_slug` is always sent as `gemini`, and returned accounts/cookies are checked again in the extension. Cookies are only read, written, or removed for Gemini-related Google cookie scopes. Veo, ChatGPT, and unrelated hosts are rejected.

## Lockdown behavior

The document-start content script silently blocks account/profile, settings, billing, upgrade/plan, and sign-out controls. It does not display a toast, banner, alert, or “content locked” message. Chat input, sending, New chat, and basic conversation switching remain available.

## Security notes

- Only the Supabase URL and public anon key belong in the extension.
- Never put a `service_role` key or other privileged credential in `config.js` or extension storage.
- The extension does not inject or touch Veo or ChatGPT cookies.