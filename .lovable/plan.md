# 5-Video Sequential Featured Player on User Home

## Goal
Replace the single featured video card on the User Home page with a clean, chromeless 5-video sequential player. One video plays, ends, the next auto-starts, and after the 5th it loops back to the first. No native controls, timeline, or download UI should be visible.

## What will be built

### Frontend changes
- Update `src/routes/_authenticated/dashboard/index.tsx`:
  - Replace the single `<video>` in the featured card with a playlist-driven video element.
  - Add a `VIDEO_PLAYLIST` array with 5 slots (placeholder URLs to be replaced by the user).
  - Track `currentIndex` with React state; advance on the `<video>` `onEnded` event.
  - After the 5th video ends, reset to index 0 so playback loops continuously.
  - Render the video with `controls={false}`, `autoPlay`, `muted`, `playsInline`, `disablePictureInPicture` and `controlsList="nodownload nofullscreen noremoteplayback"` to hide the timeline, download button, and other native chrome.
  - Enlarge and reposition the "Latest generation" label so it is not small, while keeping it subtle and premium.
  - Add a tiny row of 5 dot indicators below the video to show which clip is currently playing (optional, very minimal).

### Component logic
- Use `useRef` for the video element to call `load()` when the source changes.
- Handle `onEnded` to set `currentIndex` to `(currentIndex + 1) % playlist.length`.
- Add a brief crossfade/transition between clips via CSS opacity transition.

### Defaults
- Playlist will be seeded with 5 placeholder URLs so the component works in preview.
- The user can replace the 5 entries with their real 30-second video URLs.

## Files to modify
- `src/routes/_authenticated/dashboard/index.tsx`
- No backend or database changes needed.

## Out of scope
- No manual next/prev controls or pause/play button.
- No changes to the 7 portrait clip row, My Tools section, or sidebar.

## Acceptance criteria
- Featured video plays automatically without any timeline, download, or fullscreen buttons.
- When one video finishes, the next starts immediately.
- After the 5th video, playback loops back to the first.
- "Latest generation" label is clearly readable and not tiny.
- The rest of the User Home page remains unchanged.
