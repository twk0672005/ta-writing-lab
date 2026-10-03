# Writing Notes

Bilingual personal English argumentative-writing notes. Read the three writing guides, select accurate government evidence, study original examples, practise for 60 minutes and export a locally saved draft for feedback in the existing conversation.

## Learning material

- Three detailed guides: task response and development; accurate language and appropriate style; structure, paragraphing and cohesion.
- Weak/improved examples, worked paragraphs, self-checks and short exercises with collapsible suggested answers.
- Six question-linked government notes covering AI services, public finances, elderly care, digital inclusion, information literacy and infrastructure.
- Government facts are linked to their official source and date. Announcements, estimates, projected benefits, analysis and recommendations are distinguished. Sources were checked on **3 October 2026**; the page is not a continuously updated news service.
- The two original model essay bodies remain 500 words each. The five-paragraph allocation is a suggested practice method, not an official format.

HKEAA writing descriptors and candidate scripts are references from another Hong Kong examination. The 60-minute/about-500-word format and **70/100** threshold are user-supplied practice settings. Weights are Content 30, Language 40 and Organisation 30, not an official marking standard or a guarantee of an examination pass. See [MARKING.md](./MARKING.md).

## Drafts and feedback

There is no backend, analytics, client API key or automatic grading. Essays, outlines and timing state stay in browser localStorage. Downloads and clipboard operations are local; users must send the exported text/file in the existing conversation, directly or through the person who shared the link. Download before changing devices or clearing browser data.

The existing browser-storage identifier is deliberately unchanged so the branding update does not lose drafts. The new export rubric identifier is `writing-practice-v1`; the previous version uses the same weights and threshold.

## Search visibility, not access control

- Static HTML includes `robots` and `googlebot` metadata requesting `noindex,nofollow,nosnippet,noimageindex`.
- Crawlers must be able to read the HTML for `noindex` to work. Do not add a blanket crawl block that hides this instruction.
- A `robots.txt` file in a project subdirectory is not an effective origin-root robots policy. No origin-wide settings or other projects have been changed.
- There is no sitemap submission, indexable public PDF or intended promotion of the site. The previously published PDF is retained outside the deployment package.
- These settings are **not authentication**. The public source, repository address and older commit history remain accessible; the existing website address is deliberately retained. Third-party links, copies and indexing delays cannot be ruled out. No claim of verified Google removal is made.

Official implementation reference: [Google: block indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

## Temporary publication

The Pages site is scheduled to be unpublished on **5 October 2026 at 23:00 Hong Kong time (15:00 UTC)**, with source code retained. Scheduled jobs can be delayed. The existing repository-scoped expiry workflow is unchanged; a dry run is not proof of a completed future unpublish.

## Run and test

```text
python -m http.server 8767 --bind 127.0.0.1
npm run check
npm test
```

All runtime assets are local. No npm runtime dependencies or build step. GitHub Pages uses `main` at the repository root. Detailed source URLs and dates are in `content.json`; official scripts are linked, not copied.
