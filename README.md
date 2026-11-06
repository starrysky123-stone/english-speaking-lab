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
