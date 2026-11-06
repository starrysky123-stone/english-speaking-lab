# English Speaking Lab

Private English speaking practice site with Traditional Chinese guidance, 12 authored lessons (6 daily, 6 academic), shared vocabulary/shadowing/conversation/review workflow, browser text-to-speech and 30-second recordings, local progress, and a personal word review list.

## Service activation

The site works in guided mode without service credentials. It never fabricates AI output or pronunciation scores.

Configure server-side Site secrets:
- `OPENAI_API_KEY`: enables adaptive English text dialogue and written expression feedback through the Responses API.
- `OPENAI_MODEL`: optional; defaults to `gpt-6-astra`.
- `AZURE_SPEECH_KEY` and `AZURE_SPEECH_ENDPOINT`: enables Azure Speech Pronunciation Assessment. Use a resource endpoint such as `https://RESOURCE.cognitiveservices.azure.com`.

Redeploy the saved Site version after changing runtime secrets. Keys must never go in frontend code or browser storage. The Site is owner-private and paid API routes additionally require the platform authenticated-user header and validate request origin.

Recordings are held in browser memory only. Clicking Analyze sends a mono PCM WAV recording (16kHz, max 30 seconds) to Azure through the server. Free speech is transcribed first to supply reference text, then separately acoustically assessed. Only actual word accuracy scores below 70 enter review automatically; omissions and insertions are excluded. Recognition is never itself a pronunciation score. The threshold is a practice aid, not a validated diagnosis. Users may also save unfamiliar words themselves.

AI dialogue sends entered text, not raw audio, to OpenAI. AI feedback evaluates written expression only. Failed requests show an error, not synthetic success. Client logs, word collections, and settings stay in localStorage on the current browser; recordings are not persisted and there is no cross-device sync. JSON export provides a readable backup (no in-app import).

## Development and checks

Use the bundled Sites setup, dependency, build, and source workflow scripts. `npm run dev` launches Vinext. `node node_modules/typescript/bin/tsc --noEmit` and `node checks/learning-data.mjs` validate types, lesson coverage and pronunciation-review selection. `npm run build` produces the Worker deployment.

Browser QA covered desktop and mobile layouts, vocabulary collection, sentence stage, the full three-question guided conversation, completion, mastery status, and local persistence after reload. Physical microphone capture and paid provider calls still require validation with the owner's device and connected services.

## Provider documentation

- https://developers.openai.com/api/docs/guides/text
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short

## Personal material import

The “我的教材” area starts empty. No user's files or QA fixtures are bundled. Learners can paste text or locally extract text from UTF-8 TXT/Markdown, text-based PDF, DOCX and PPTX, then inspect and edit a lesson before saving. File limits are 10 MB, 50 PDF pages, 50,000 text characters per material, and 30 materials per browser. Image/scanned PDFs have no OCR and report an actionable error. Complex columns and tables may need manual correction.

The importer uses deterministic extraction, not AI: candidate vocabulary is selected from the material; shadowing sentences retain the source wording; translations and IPA are left blank until supplied by the learner. Source/adapted sentence labels are computed against the retained text. Generic conversation questions and answer hints are clearly marked as supplemental and editable. Exercise sizes may vary (1–12 words/sentences, 1–8 questions).

Imported lessons use the existing four-stage practice flow, word review, session logging, optional AI text dialogue, and optional acoustic assessment. Original files are never uploaded by the importer. Only selected practice text is sent to OpenAI when the learner uses connected AI features. Local schema migration preserves prior logs, settings and review words. Material edits are checked before saving, and storage failure does not report success. Archive/restore retains history. Material JSON backup imports preserve existing items and assign a new ID to colliding copies; full learning-record exports also contain custom materials.

`npm run dev` and `npm run build` copy the installed PDF.js worker into public assets so the worker and library versions match. Keep this step in the deployment build. The file is generated, not tracked.

Additional QA: pasted material -> edit -> save -> all four practice stages, custom two-question dialogue, vocabulary collection, JSON export, PDF/DOCX/PPTX reading, and scanned-PDF errors. Backup parser/round-trip validation and prior-data migration are covered by checks/materials.mjs. Browser file selection for backup restoration was stopped after user declined the upload test; the end-to-end browser restore path has not been verified.

To execute checks with current runtime imports, bundle each checks/*.mjs using the local esbuild binary (`--bundle --platform=node --format=esm`) into .sites-runtime, then run the emitted module with Node.
