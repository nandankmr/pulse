# System Messages Implementation Plan

## Phase 1 · Baseline Audit
- **Inventory current flows** Review `pulse-api/src/modules/message/` and `pulse-api/src/modules/chat/` to understand message persistence and existing realtime events (e.g., `group:member:added`).
- **Front-end display check** Inspect `pulse/src/screens/ChatScreen.tsx` and related hooks/components to see how messages are rendered, normalized (`ensureMessageDefaults`), and cached (`useMessages`).

## Phase 2 · Backend Design & Implementation
- **Schema extension** Update Prisma schema to introduce a `SystemMessageType` enum and extend the `Message` model (or add a dedicated table) with `systemType`, `metadata`, `actorId`, and `targetUserId` fields.
- **Creation helpers** Add a `SystemMessageService` (or similar) in `pulse-api/src/modules/message/` to publish system messages for lifecycle events (group create, member add/remove, role change, metadata updates).
- **Socket & API output** Update presenters and `socket.server.ts` so system messages are emitted alongside regular messages, ensuring payloads carry typed metadata for the client.

## Phase 3 · Frontend Rendering & State
- **Type updates** Extend `pulse/src/types/message.ts` (and related TS interfaces) with `systemType` and `metadata` properties.
- **Query handling** Adjust `useMessages` and `normalizeSocketMessage` logic so system messages are recognized and mapped correctly.
- **UI components** Add a `SystemMessageBubble` (or equivalent) that renders localized strings based on `systemType`, including icons/formatting. Integrate into `ChatScreen` message list.
- **Caching consistency** Verify React Query caches (`chatKeys`) and optimistic updates handle system messages without regressions.

## Phase 4 · Triggers & Integration
- **Emit on events** Hook system message creation into existing flows: group creation (`chat.service.ts`), add/remove member (`group.service.ts` / `chat.service.ts`), role changes, and group metadata updates (`group.controller.ts`).
- **Historical migration (optional)** Plan backfill scripts if historical events should appear in chat history (consider Prisma migrations or scripts under `pulse-api/scripts/`).

## Phase 5 · Testing & Rollout
- **Automated tests** Add backend unit/integration tests covering system message creation and socket emissions; extend frontend tests if applicable.
- **Manual QA** Validate end-to-end scenarios on both clients: creating groups, membership changes, renaming groups, ensuring system messages display as expected.
- **Localization & accessibility** Route system strings through `pulse/src/i18n/` and verify screen reader support.
- **Monitoring** Add logging/metrics to observe system message volume and detect anomalies post-deployment.
