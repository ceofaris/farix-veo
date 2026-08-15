# Farix AI Veo Session Extension

Manifest V3 Chrome extension for the Farix AI managed-account workflow:

- Supabase email/password login
- Profile, plan, expiry, and credit balance display
- Managed Flow cookie injection through `get_random_flow_account`
- Single-device activation through `set_active_session`
- 30-credit deduction when a newly-added video appears on the Flow page
- In-page low-credit warning overlay
- Cookie and local-session cleanup on logout and disable/unload paths

## Configure Supabase

1. Open `config.js`.
2. Replace `SUPABASE_URL` with your project URL.
3. Replace `SUPABASE_ANON_KEY` with the public anon key.
4. Keep the key public/anon only. Never use a `service_role` key in a browser extension.
5. If your database uses different RPC argument names, update `RPC_ARGUMENTS` in the same file.
6. If your profile tables use different user-id columns, update `PROFILE_USER_COLUMN` and `USER_TOOLS_USER_COLUMN`.

The default data contract expects:

- `profiles`: one row keyed by `id`
- `user_tools`: one row keyed by `user_id`, with `credits`, `plan`, `tools`, and `expiry`/`expires_at`
- `get_random_flow_account()`: returns an account containing `cookie_data`
- `set_active_session(p_user_id, p_device_id)`: rejects an account already active elsewhere
- `check_and_deduct_credits(p_user_id, p_amount)`: returns a remaining-credit field, or the extension will refresh the profile

`cookie_data` can be a JSON array of Chrome cookie objects, a `{ "cookies": [...] }` object, or a name/value map. For safety, cookie injection is limited to `labs.google` and its subdomains.

## Load in Chrome

1. Go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Choose this `farix-veo-extension` folder.
5. After editing `config.js`, click **Reload** on the extension card.

## Notes

The extension only observes newly-added `<video>` elements on `https://labs.google/fx/tools/flow*`; it does not count images. Chrome does not guarantee an uninstall callback for extensions, so logout is the reliable cleanup path and disable/unload cleanup is best effort. The extension never stores the user's password.