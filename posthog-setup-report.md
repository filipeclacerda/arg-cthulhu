<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into *O Arquivo de Amanhã*. The existing custom telemetry layer (which used raw HTTP calls to the PostHog API) has been migrated to the posthog-js SDK, giving the project full access to session recording, autocapture, error tracking, and feature flags. A PostHog provider component was added to the root layout to initialize the SDK on the client side (Next.js 13.5.5 does not support `instrumentation-client.ts`, which requires 15.3+). The existing GDPR consent flow is preserved and wired to posthog's `opt_in_capturing()` / `opt_out_capturing()` at runtime. A reverse proxy was configured in `next.config.js` so PostHog requests route through `/ingest` and are less likely to be blocked by ad-blockers. Three new events were added to cover critical actions not previously tracked: entering the game, starting a fresh session, and importing a saved case code. A fourth event was added to `CipherLab` to track successful puzzle decryption directly at the solve site.

| Event name | Description | File |
|---|---|---|
| `image_mounted` | Player authenticates and enters the game disk image | `src/app/page.tsx` |
| `new_session_started` | Player starts a fresh observer session | `src/app/page.tsx` |
| `case_code_imported` | Player imports a MISK4/MISK3 portable case code | `src/app/page.tsx` |
| `cipher_decrypted` | Player successfully decodes the margin cipher | `src/app/components/apps/CipherLab/CipherLab.tsx` |
| `session_start` | Player opens the game (migrated to SDK) | `src/app/game/telemetry.ts` |
| `session_end` | Player closes the game (migrated to SDK) | `src/app/game/telemetry.ts` |
| `resource_open` | Player opens a file, email, or recovered page (migrated to SDK) | `src/app/game/telemetry.ts` |
| `puzzle_attempt` | Player submits a puzzle answer (migrated to SDK) | `src/app/game/telemetry.ts` |
| `puzzle_near_miss` | Player's answer is recognizably close (migrated to SDK) | `src/app/game/telemetry.ts` |
| `hint_unlocked` | A hint level is unlocked (migrated to SDK) | `src/app/game/telemetry.ts` |
| `puzzle_solved` | Player solves a puzzle (migrated to SDK) | `src/app/game/telemetry.ts` |
| `theory_tested` | Player tests a theory on the evidence board (migrated to SDK) | `src/app/game/telemetry.ts` |
| `ending_chosen` | Player chooses a game ending (migrated to SDK) | `src/app/game/telemetry.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/492906/dashboard/1783018)
- [Daily active players](https://us.posthog.com/project/492906/insights/SNgqL7vE)
- [Game entry funnel](https://us.posthog.com/project/492906/insights/0bxXH8sC)
- [Puzzle solves over time](https://us.posthog.com/project/492906/insights/KwGzLAVh)
- [Hints unlocked by trigger](https://us.posthog.com/project/492906/insights/EiVb1569)
- [Endings chosen](https://us.posthog.com/project/492906/insights/T5uiA2Lp)

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite (`npm test`) — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any CI/deployment environment configuration so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or equivalent) into CI so production stack traces de-minify correctly in PostHog error tracking.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
