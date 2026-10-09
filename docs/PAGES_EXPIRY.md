# Pages expiry repair — HOLD until authenticated removal and HTTP verification

Authorized repository: `twk0672005/ta-writing-lab`. Original deadline: 2026-10-05 23:00 Hong Kong time (15:00 UTC). Preserve the repository and all application source. Do not make the repository private, delete branches, remove application files or alter other projects.

## Findings

- Actual job logs for run `37378186254`, job `111992815566`: checkout `fa3beeeea13509a962e41620b8ae91c05ab799e1`; GITHUB_TOKEN permissions Contents read, Metadata read, Pages write. `DRY_RUN=false`. Traceback identifies `api('DELETE', token)` and HTTP 403.
- GitHub's [Delete a GitHub Pages site endpoint](https://docs.github.com/en/rest/pages/pages#delete-a-github-pages-site) requires **both Pages write and Administration write** for GitHub App/fine-grained credentials. The workflow uses `github.token`, which lacks Administration; adding `pages: write` alone cannot fix this permission mismatch.
- The original script discarded the historical 403 response body and headers. Its exact server message/request ID cannot be recovered from that log. The missing required permission is proven by the configuration/log and current endpoint contract; no claim is made to have read a historical `X-Accepted-GitHub-Permissions` header.
- Live anonymous GET `/repos/twk0672005/ta-writing-lab/pages` returns 404, while the actual Pages URL serves the writing-notes application with HTTP 200. **Anonymous 404 is not down proof.** The recorded observations and body hashes are in [pages-expiry-evidence.json](pages-expiry-evidence.json).
- Secure browser sign-in was not completed. There is no confirmed authenticated Pages readback or successful DELETE in this task. Overall result remains **HOLD**.

## Repair behavior

The script logs JSON evidence with UTC timestamps, HTTP status, response hash, request ID and server accepted permissions. API errors retain a redacted server message. It accepts PASS only when an authenticated Pages read returns 404, the homepage and six known application assets return 404 at the expected origin/path, the repository remains accessible, and main has the same commit as immediately before the operation. Network errors, 200 pages/assets, redirects elsewhere, source changes and API errors remain HOLD. A dry run is explicitly DRY_RUN, never PASS.

DELETE uses a separate `PAGES_EXPIRY_TOKEN`; it never silently reuses GITHUB_TOKEN. Only the approved `/pages` endpoint is deleted. The existing deadline/scope guard stays. The annual cron is retired because its one-time 2026 date has passed; verification/removal is manually dispatched. Do not merge or call this operationally complete until the credential/removal step is handled. This repair branch does not change the publishing source or deploy the site.

## Complete the authorized removal

Prefer the existing administrator's GitHub Pages settings: remove publishing source by choosing **None**, preserving the repository. Alternatively, use an **existing** repository-scoped Pages/Administration write credential. Creating a new credential or expanding its security permissions is a separate decision; no new credential was created here.

For script use, set `GITHUB_REPOSITORY=twk0672005/ta-writing-lab`, `DRY_RUN=false`, `GH_TOKEN` to an authenticated credential with Pages read and repository Contents read, and `PAGES_EXPIRY_TOKEN` to the approved deletion credential. Run `python scripts/expire_pages.py`. Do not paste tokens into chat, put them in code or pass them on the command line. The workflow reads the deletion credential only from the repository secret of the same name.

After UI removal, no deletion credential is needed to run the read-only check: set `VERIFY_ONLY=true` and an authenticated `GH_TOKEN` with Pages read and Contents read, then run the script. In Actions, `verify_only=true` invokes this check; `dry_run=true` alone only inspects configuration. CDN propagation can outlast the bounded retry; retain HOLD and run read-only verification later.

Independent public checks (not sufficient alone to assert PASS):

```sh
curl -i -H 'Cache-Control: no-cache' https://twk0672005.github.io/ta-writing-lab/
curl -i -H 'Cache-Control: no-cache' https://twk0672005.github.io/ta-writing-lab/index.html
curl -i https://api.github.com/repos/twk0672005/ta-writing-lab/pages
```

Authenticated Pages evidence with an existing `gh` login that has Pages read:

```sh
gh api --include repos/twk0672005/ta-writing-lab/pages
gh api repos/twk0672005/ta-writing-lab/commits/main --jq .sha
```

Keep the HTTP status, `X-GitHub-Request-Id`, timestamp and returned main SHA. Expected completed result: Pages API 404 **with a credential known to have Pages read**, homepage and direct application assets 404, source/repository preserved. A Pages 404 observed without a trusted read credential remains inconclusive even if the site is unavailable.

## Validation

- `python -m unittest discover -s tests -p 'test_expire_pages.py' -v`: six tests covering API 404/live website mismatch, complete absence, redirect rejection, source-change HOLD, missing administrator credential and redacted 403 diagnostics.
- Existing JavaScript/content checks rerun after updating the old annual-cron expectation to the retired one-time schedule.
- These tests validate repair logic. They are not a successful DELETE or live down verification.
