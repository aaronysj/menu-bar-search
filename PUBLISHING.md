# Publishing Checklist

Use this checklist before submitting the extension to the Raycast Store.

## Required

- Replace `package.json` `author` with the exact Raycast account username.
- Decide the final extension name before the first Store submission. The `name` field becomes the Store slug.
- Run `npm run build` and open the distribution build in Raycast.
- Run `npm run lint`; the author check must pass against Raycast's API.
- Capture or replace Store screenshots in `metadata/` with Raycast Window Capture.
- Run `npm run publish` to open the pull request against `raycast/extensions`.

## Screenshots

Raycast recommends at least three screenshots and allows up to six. Capture them as PNG files at 2000 x 1250 pixels.

Current screenshots:

- `metadata/menu-bar-items.png`: generated from `images/img.png`, showing the populated menu bar item list.
- `metadata/open-menu.png`: generated from `images/img_1.png`, showing a selected menu bar item opened.

Suggested remaining shot:

- `metadata/accessibility-permission.png`: the recovery view or permission-related state.

Avoid showing sensitive menu bar data, personal names, private app names, API keys, or multiple desktop backgrounds. Before submission, prefer replacing the generated screenshots with fresh Raycast Window Capture exports at 2000 x 1250 pixels, especially `metadata/open-menu.png`, which was adapted from a portrait screenshot.

## Binary Review Notes

The extension uses a Swift helper compiled from `helper/menubarctl.swift` into `assets/menubarctl` by `npm run build-helper`. The generated binary is ignored by git so reviewers can inspect the source and build path instead of accepting an opaque checked-in binary.

Mention this in the pull request description:

> This extension builds its macOS helper from `helper/menubarctl.swift` during `npm run build`. It uses public Accessibility APIs only and does not download external binaries.
