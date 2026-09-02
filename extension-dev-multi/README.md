# Farix AI Multi Extension (Veo 3 + Gemini Pro + Whisk)

Manifest V3 Chrome extension that manages all Farix tools in one place.

## Behavior

- Farix Supabase email/password login (auto-login from a farixai.com session)
- Loads the plan from `user_plans` and derives tool access:
  - `pro` → Veo 3 active, Gemini Pro and Whisk locked
  - `master` → Veo 3 + Whisk + Gemini Pro active
- Popup shows email, plan, and per-tool Active / Ready / Locked status
- **Inject Session** injects only the selected tool's cookies, then opens the tool:
  - Veo 3 → `https://labs.google/fx/tools/flow`
  - Whisk → `https://labs.google/fx/tools/flow/shared/tool/c0c427a4-f509-4a15-a704-21f89e512dbe`
  - Gemini Pro → `https://gemini.google.com/app`
- **Clear Data** removes the injected cookies for the selected tool
- Logout clears all cookies and the local session
- Single-device enforcement through `set_active_session`
- No credits system

## Cookie pools

| Tool | Account RPC | Cookie domain | Lockdown |
| --- | --- | --- | --- |
| Veo 3 (Flow) | `get_random_flow_account` | `labs.google` only | `veo-lockdown.js` |
| Whisk | `get_random_flow_account` (same Flow pool as Veo 3) | `labs.google` only | `veo-lockdown.js` |
| Gemini Pro | `get_random_gemini_account` | Google accounts domains | `gemini-lockdown.js` |

Whisk has **no separate cookie pool** — it reuses the Flow/Veo accounts and only
differs by the URL opened after injection. Flow cookies are never injected into
Gemini domains: each tool's domain allow-list is checked before any
`chrome.cookies.set` call, and lockdown scripts are matched by URL.

## Install

1. Download and extract the ZIP.
2. Open `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select the extracted folder.
