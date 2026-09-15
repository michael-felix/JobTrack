# JobTrack AI — Chrome Extension

Captures job postings from LinkedIn, Seek, and Indeed straight into your
JobTrack AI account as a new **Saved** application. Independent deployable
from the web app — its own `package.json`, build, and test suite — talking
to the web app's `/api/extension/*` REST endpoints over a personal access
token (see `docs/ARCHITECTURE.md` in the repo root).

## Setup

```bash
npm install
npm run build
```

Then in Chrome:

1. Go to `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked**, select this folder's `dist/` directory.
3. In the web app, go to **Settings** and generate an access token.
4. Click the extension icon → **Open settings** (or right-click the
   extension icon → Options), paste in your JobTrack AI URL and the token,
   and save. You'll be asked to grant permission for that specific URL —
   this is expected; the extension only ever requests the exact origin you
   configure, not blanket access to every site you visit.

## Using it

Open a job posting on LinkedIn, Seek, or Indeed, click the extension icon.
If the page is recognized, the form is pre-filled — review and click **Save
to JobTrack**. If parsing fails (unsupported site, or the source site
changed its markup), the form opens blank instead of showing an error —
fill it in manually and save; either way it lands as a normal application on
your board.

## Development

```bash
npm run dev    # Vite dev server (for iterating on popup/options UI in a browser tab)
npm test       # parser unit tests (jsdom, no browser required)
npm run build  # type-check + production build to dist/
```

## Testing notes / known gap

Parser tests (`src/parsers/*.test.ts`) run against hand-authored HTML
fixtures (`src/parsers/fixtures/`) that approximate each site's real markup
— they were not captured from live pages, since this project was built
without live network access to LinkedIn/Seek/Indeed. Each parser has a
"well-formed" fixture (asserts the expected structured extraction) and a
"mangled" fixture (asserts a graceful `null` instead of a thrown exception).
**Before relying on this against the real sites, load the extension unpacked
and test it against actual postings** — site markup drifts over time, and
the fixtures can't catch that; when a selector goes stale, add a new fixture
reproducing the change and update `src/parsers/{site}.ts`.

## Architecture notes

- **No background service worker.** The popup does everything on demand:
  `chrome.scripting.executeScript` reads `document.documentElement.outerHTML`
  from the active tab, and the popup parses that HTML string locally with
  `DOMParser` using the exact same parser functions the tests exercise —
  nothing chrome-API-specific leaks into parsing logic.
- **`optional_host_permissions`, not a blanket `host_permissions`.** The
  extension requests access only to the specific backend origin the user
  configures (`chrome.permissions.request` in the options page), not
  `<all_urls>`.
- **Bearer token, capped scope.** The token only works against
  `/api/extension/capture` (create a Saved application) and
  `/api/extension/verify` (identity check) — see `requireBearerUser` in the
  web app's `src/lib/current-user.ts`.
