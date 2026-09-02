# Farix AI Whisk Extension (dev)

Standalone Manifest V3 extension for Whisk only. It does **not** have its own
cookie pool — it reuses the existing Flow/Veo managed accounts.

## Behaviour

1. Supabase email/password login (Master plan required, expiry + disabled account checked).
2. Fetches a random active Flow/Veo account via `get_random_flow_account`.
3. Clears and injects cookies for `labs.google` (and subdomains) only.
4. Marks the session with `set_active_session` (single-device).
5. Opens or focuses:
   `https://labs.google/fx/tools/flow/shared/tool/c0c427a4-f509-4a15-a704-21f89e512dbe`

Cookies are cleared on logout, Clear Session, and on disable/unload.

## Notes

- No separate Whisk accounts exist; King manages one Flow/Veo cookie pool.
- Because the cookie jar is shared with Veo 3, injecting or clearing here also
  affects a Veo session in the same browser profile.
- No Gemini code paths exist in this package.

## Load in Chrome

1. `chrome://extensions` → enable Developer mode.
2. **Load unpacked** → select this folder.
