# English Speaking Lab

Private English speaking practice site with Traditional Chinese guidance, 12 authored lessons (6 daily, 6 academic), shared vocabulary/shadowing/conversation/review workflow, browser text-to-speech and 30-second recordings, local progress, and a personal word review list.

## Service activation

The site works in guided mode without service credentials. It never fabricates AI output or pronunciation scores.

Configure server-side Site secrets:
- `OPENAI_API_KEY`: enables Realtime voice conversation and Responses API text dialogue / written expression feedback.
- `OPENAI_MODEL`: optional; defaults to `gpt-6-astra`.
- `OPENAI_REALTIME_MODEL`: optional; defaults to `gpt-realtime-2.1`.
- `AZURE_SPEECH_KEY` and `AZURE_SPEECH_ENDPOINT`: enables Azure Speech Pronunciation Assessment. Use a resource endpoint such as `https://RESOURCE.cognitiveservices.azure.com`.

Redeploy the saved Site version after changing runtime secrets. Keys must never go in frontend code or browser storage. The Site is owner-private and paid API routes additionally require the platform authenticated-user header and validate request origin.

Recordings are held in browser memory only. Clicking Analyze sends a mono PCM WAV recording (16kHz, max 30 seconds) to Azure through the server. Free speech is transcribed first to supply reference text, then separately acoustically assessed. Only actual word accuracy scores below 70 enter review automatically; omissions and insertions are excluded. Recognition is never itself a pronunciation score. The threshold is a practice aid, not a validated diagnosis. Users may also save unfamiliar words themselves.

AI text dialogue sends entered text and selected practice content to OpenAI. Realtime voice explicitly sends microphone audio after the learner clicks Start, and uses AI-generated audio responses. Written feedback uses conversation text/transcripts, with recognition uncertainty disclosed, and does not assess pronunciation. Failed requests show an error, not synthetic success. Client logs, word collections, and settings stay in localStorage on the current browser; recordings are not persisted and there is no cross-device sync. JSON export provides a readable backup; material backup restoration is supported in the importer.

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


## Selecting a practice set and Recast conversation

All lesson entry points now open a material selector and a per-session checklist. The dropdown includes active imported materials and authored lessons. Learners can select up to 12 words and 12 sentences, search all English tokens / sentences in the original material (including beyond the initial six suggestions), or add their own practice text. A session must contain at least one word or sentence; either stage can be empty and skipped. Selections are stored separately by lesson ID and never overwrite the material. Editing a material resets its remembered selection. The warm-up, shadowing, review cards and AI context use the selected subset. Existing local data is migrated without discarding logs or reviews.

Stage three offers Realtime voice, AI text, and explicitly offline fixed prompts. Missing credentials are shown prominently; no fake AI replies or recasts are generated. The refresh control rechecks configuration presence, not provider account health. A successful session/request is the actual connectivity check.

Voice uses browser WebRTC with server-mediated SDP negotiation at `/api/realtime`, backed by OpenAI `/v1/realtime/calls`. The permanent key stays server-side. Microphone input is disabled until the context has been queued, then semantic VAD with low eagerness allows learner pauses and interruptions. The interface supports mute, cancel, end, connection errors and autoplay recovery. Closing the stage/unmount/pagehide or the 10-minute client session limit closes the peer and stops all microphone tracks; the browser owns the live connection. User and assistant transcript events are matched by item ID so delayed input transcription does not reorder turns. Transcripts are session-only and are not acoustic assessments. No microphone permission is requested automatically.

Both voice and text prompts implement Recast: preserve the intended meaning, naturally reformulate one clear grammar/word-choice issue, then ask one relevant follow-up question. No gratuitous correction of acceptable English, invented facts, or pronunciation diagnoses. Voice recasts are spoken naturally and may be discussed in end-of-session written feedback. Text replies use strict Structured Outputs for optional original/corrected/note metadata. Metadata is shown only when the original occurs in the learner's latest turn and the corrected wording actually occurs in the AI reply. Learners can expand it during conversation and revisit it in stage four. Grammar recasts never auto-create pronunciation-error review entries.

Validation for this update: TypeScript, existing learning/import checks, and `checks/selection-recast.mjs` (bundle with `--alias:cloudflare:workers=./checks/worker-env.mjs`) cover immutable selected subsets, full-source candidates, empty stages, migration, original-quote grounding, transcript ordering, API auth/origin checks, bounded request bodies, missing credentials, quota/incomplete output errors, strict reply payloads and SDP exchange against a **mock provider**. No provider credentials are currently configured. Actual AI quality, WebRTC speech and physical microphone cleanup still require a connected-account/device acceptance test; passing a mock is not a live provider test.

Implementation references:
- https://developers.openai.com/api/docs/guides/voice-webrtc
- https://developers.openai.com/api/docs/guides/realtime-conversations
- https://developers.openai.com/api/docs/guides/realtime-vad
- https://developers.openai.com/api/docs/guides/structured-outputs
