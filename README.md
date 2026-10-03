# TA Writing Lab

Independent bilingual English argumentative-writing practice for a Hong Kong Treasury Accountant candidate. Study first, read original sample essays, practise for 60 minutes and export a private draft for Afuu to mark in the existing Telegram conversation.

## What is official — and what is not

The Treasury's public recruitment information confirms an English essay-type writing paper assessing written communication and organisation. The 60-minute / approximately 500-word format was supplied by the candidate. Actual invitations and examination instructions take priority.

Official HKEAA candidate samples and writing level descriptors are linked as references from another Hong Kong examination. They are **not TA sample answers or a TA marking scheme**. All six practice questions and both 500-word examples are original independent material.

The practice pass threshold is **70/100**, selected by the user. Practice weights are Content & argument 30, Language & style 40, Organisation & coherence 30. These weights do not represent an official TA standard or guarantee an examination pass. See [MARKING.md](./MARKING.md).

## Privacy and genuine marking

- No backend, API keys, analytics or automatic grading.
- Essays, outlines and timing state are stored only in the visitor's browser localStorage. They are not synced or sent to this repository.
- Downloads and clipboard operations are local. The visitor must send the exported `.txt` file or text in the existing Telegram conversation with Afuu (or through the person who shared the site).
- Completing or downloading an essay is **not** a submission receipt and **not** a score.
- Download before switching devices or clearing browser data. Browser storage can fail; the interface warns about it.

## Temporary publication

GitHub Pages is scheduled to be unpublished on **5 October 2026 at 23:00 Hong Kong time (15:00 UTC)**. The source repository is retained. GitHub scheduled jobs can be delayed. The repository-scoped expiry workflow has a default dry-run manual action and verifies the Pages API after an actual unpublish. It never deletes repository files or student data.

## Run and test

```text
python -m http.server 8767 --bind 127.0.0.1
npm run check
npm test
```

Open the localhost URL printed by the server. All runtime assets are local; there are no npm runtime dependencies or build step. GitHub Pages uses `main` at the repository root.

## Official references

- [Treasury recruitment examination](https://www.try.gov.hk/internet/ehcare_career.html)
- [HKEAA 2025 writing samples](https://www.hkeaa.edu.hk/DocLibrary/HKDSE/subject_information/eng_lang/2025-Sample-ENG-Paper2-S633.pdf) — PDF pages 16–20; printed 15–19.
- [HKEAA writing descriptors](https://www.hkeaa.edu.hk/DocLibrary/HKDSE/Subject_Information/eng_lang/LevelDescriptors-ENG-Writing.pdf)

Official scripts are linked, not copied into this repository. The downloadable PDF contains our independent exercises, examples and teaching notes.
