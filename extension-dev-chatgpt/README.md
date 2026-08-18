# Farix AI ChatGPT Session Extension

Manifest V3 Chrome extension for managed Farix AI ChatGPT access.

## Included

- Farix Supabase email/password login
- Session status, account email, plan, and expiry display
- Inject Session button using `get_random_chatgpt_account`
- Clear Session button that removes ChatGPT cookies without logging out of Farix
- Logout with full local cleanup
- Single-device activation through `set_active_session`
- ChatGPT account-control lockdown during an active managed session
- Main chat, new chat, sidebar chat list, and normal messaging remain usable
- No credit deduction system

## Supabase configuration

The extension uses the configured Supabase project and public anon key. Never replace it with a `service_role` key.

The default contract expects:

- `profiles`: one row keyed by `id`
- `user_tools`: one row keyed by `user_id`
- `get_random_chatgpt_account()`: returns an account containing `cookie_data`
- `set_active_session(p_user_id, p_device_id, p_tool, p_account_id)`: rejects an account already active elsewhere

`cookie_data` may be a Chrome cookie array, `{ "cookies": [...] }`, or a name/value map. Cookie injection is intentionally limited to `chatgpt.com` and its subdomains.

If your RPC uses different argument names, update `RPC_ARGUMENTS` in `config.js`.

## Install

1. Download and extract the ZIP.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted `farix-chatgpt-extension` folder.

Chrome does not guarantee an uninstall callback. Logout and Clear Session are the reliable cleanup paths; disable cleanup is best effort through the management event.