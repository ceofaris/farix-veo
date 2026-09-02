# Farix AI Multi Extension (Veo 3 + Gemini Pro)

Manifest V3 Chrome extension that manages both Farix tools in one place.

## Behavior

- Farix Supabase email/password login
- Loads the plan from `user_plans` and derives tool access:
  - `master` → Veo 3 + Gemini Pro active
  - `pro` → Veo 3 active, Gemini locked
  - `master` → all tools active
- Popup shows email, plan, and per-tool Active / Ready / Locked status
- **Inject Session** uses the active tab to pick the tool (or the tool selector when
  both are unlocked) and injects only that tool's cookies
- **Clear Data** removes the injected cookies for the selected tool
- Logout clears both tools' cookies and the local session
- Single-device enforcement through `set_active_session`
- No credits system

## Cookie isolation

| Site | Account RPC | Cookie domain | Lockdown |
| --- | --- | --- | --- |
| `labs.google` | `get_random_flow_account` | `labs.google` only | `veo-lockdown.js` |

Cookies are never cross-injected: each tool's domain allow-list is checked before
any `chrome.cookies.set` call, and lockdown scripts are matched by URL.

## Install

1. Download and extract the ZIP.
2. Open `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select the extracted folder.
