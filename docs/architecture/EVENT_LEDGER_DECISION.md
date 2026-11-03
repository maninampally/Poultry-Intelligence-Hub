# Event ledger decision (Phase 4.4)

## Decision

**Defer** introducing a `farm_events` immutable ledger until the current
**row-based sync** (Phase 1) and **projections** (Phase 2) are proven in
production use (multi-device farmers, conflict rates, rebuild cost).

`SYSTEM_DESIGN.md` remains the **target** architecture, not the as-built schema.

## Why defer

1. Phases 1–2 already deliver offline push apply + rebuildable `flock_metrics`.
2. Dual models (events + mutable daily_records) without dual-write discipline
   create silent metric drift (we already fixed one daily vs mortality gap).
3. Rewriting mobile + API + RLS around events is high cost before product validation.

## Revisit when

- Row sync shows systematic lost updates / conflict pain, **or**
- Audit/compliance requires immutable supersede chains, **or**
- Projection rebuild from tables becomes too expensive vs event replay.

## If we adopt events later (sketch)

1. Add `farm_events` alongside current tables (dual-write from sync apply).  
2. Rebuild projections from events only; keep tables as materializations.  
3. Stop writing tables directly from REST once lag is proven zero.  
4. Migrate historical rows into events in batches per org.

Until then: improve row sync (more apply tables, UI drain hooks), not a ledger rewrite.
