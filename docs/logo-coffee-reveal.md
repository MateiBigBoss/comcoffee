# Homepage coffee texture reveal

The large homepage logo retains its original black image and letter arrival animation.
Moving a mouse over it reveals the owner's coffee-bean photograph in a soft circular
spotlight, clipped inside the logo. Leaving the logo restores black; the effect does
not permanently erase anything. No runtime dependencies or generated images are used.

## Files

- `site/index.html`: inverted luminance mask derived from the existing wordmark,
  radial spotlight mask and decorative texture layer.
- `site/assets/css/home.css`: fade and arrival timing; touch/reduced-motion fallback.
- `site/assets/js/logo-reveal.js`: pointer coordinates and frame cleanup.
- `site/assets/img/coffee-beans-texture.jpg`: unchanged owner-supplied
  `153456-805688480_tiny.jpg`.
- `scripts/test-logo-reveal.mjs`: behavior checks, also included in GitHub Actions.

The spotlight's size is set by `radius` in the script. Its softness is controlled
by the stops in `brand-light-gradient` in the homepage SVG. The SVG coordinates
match the original wordmark viewBox (`140 190 790 205`).

Touch input and reduced-motion preferences retain the original logo. JavaScript or
texture failure also leaves the black image available. The decorative layer adds
no keyboard stop or duplicate accessible label.

## Verification — 2026-10-14

- Static site links/assets/JavaScript checks, menu behavior tests, spotlight behavior
  tests and `git diff --check` passed.
- Browser checked at desktop size and 390px viewport width: no horizontal overflow.
  Verified texture on different letters, letter clipping and return to black.
- No browser console errors or warnings observed. Touch and reduced-motion guards
  verified by automated behavior tests; no physical phone test performed.

Branch: `codex/logo-coffee-reveal`. Based on the existing local gallery worktree at
`5048c95`, with the owner's subsequent page edits preserved separately in `bd2bc8a`.
The original worktree and its staged editor settings were left untouched.
