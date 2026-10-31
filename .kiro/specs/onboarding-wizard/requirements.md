# Requirements Document

## Introduction

This document specifies requirements for an onboarding wizard for the Poultry Intelligence Hub web application (`apps/web`). The wizard guides a new farm owner through a three-step setup flow — Farm identity, Sheds, and First batch — immediately after sign-up, and persists progress so an interrupted setup can be resumed.

The feature is implemented entirely in the existing React frontend using the existing local-prototype store persisted to `localStorage`. No backend, Supabase, authentication provider, database migration, or network synchronization is in scope. Role selection in this local prototype is a convenience affordance and is not a production authorization control.

The wizard introduces an explicit, workspace-scoped onboarding status (`not_started`, `in_progress`, `completed`) that is persisted and used to decide whether to route a new owner into onboarding. Onboarding completion is never inferred from the presence of shed records. The wizard also introduces new store concepts — shed configured capacity, a shed-creation action, a batch-creation action, per-shed batch allocations, and a coordinated idempotent final-commit action — along with the data-model and persistence-version changes those concepts require.

## Glossary

- **Onboarding_Wizard**: The frontend feature that presents the three-step setup flow at the `/onboarding` route.
- **Farm_Store**: The existing frontend state container (`src/store/farm-store.tsx`) holding `FarmState` and exposing reducer actions; persisted to `localStorage` by `FarmProvider`.
- **FarmState**: The versioned root state object (`version: 1`) containing `role`, `currentUserId`, `activeBatchId`, `settings`, `sheds`, `batches`, and related collections.
- **Workspace**: The current farm identity scope represented by `FarmState` for the signed-in user; all onboarding data is written against this workspace.
- **Owner**: A `TeamMember` whose `role` is `owner`.
- **Invited_Member**: A `TeamMember` whose `role` is `manager` or `worker` who joins an existing farm.
- **Onboarding_Status**: A persisted, workspace-scoped value with exactly one of three states: `not_started`, `in_progress`, `completed`.
- **Shed**: A housing unit record. For this feature, a Shed has a stable `id`, a `name`, a configured `capacity` (a new field), and existing placement data (`placedBirds`).
- **Configured_Capacity**: The maximum number of birds a Shed is built to hold; a configuration value distinct from the number of birds currently placed.
- **Batch**: A flock record with `status` of `setup`, `active`, or `closed`.
- **Planned_Batch**: A Batch created with `status` of `setup`, representing chicks not yet placed; actual placement fields and live-bird counts are not populated.
- **Confirmed_Batch**: A Batch created with `status` of `active`, representing a confirmed placement with recorded placed counts.
- **Allocation**: A record linking a Batch to a specific Shed with a bird count for that Shed; a Batch may have multiple Allocations across Sheds.
- **Draft**: Persisted, incomplete wizard input stored across page refreshes with stable identifiers.
- **Final_Commit**: The single coordinated action that writes all wizard-created records to the Farm_Store and marks Onboarding_Status as `completed`.
- **Seed_Data**: Pre-existing demo/seed records shipped with the application.
- **Zod**: The validation library used to validate wizard input before commit.

## Requirements

### Requirement 1: Owner entry routing after sign-up

**User Story:** As a new farm owner, I want to be taken to onboarding right after sign-up, so that I can set up my farm before using the app.

#### Acceptance Criteria

1. WHEN an Owner completes sign-up AND the Onboarding_Status for the Workspace is `not_started`, THE Onboarding_Wizard SHALL navigate the Owner to the `/onboarding` route.
2. WHEN an Owner signs in AND the Onboarding_Status for the Workspace is `completed`, THE Onboarding_Wizard SHALL NOT route the Owner to the `/onboarding` route.
3. THE Onboarding_Wizard SHALL determine routing from the persisted Onboarding_Status for the Workspace and SHALL NOT infer onboarding completion from the count of Shed records.
4. WHERE Seed_Data is present for a new Owner whose Onboarding_Status is `not_started`, THE Onboarding_Wizard SHALL treat the Workspace as requiring onboarding.

### Requirement 2: Direct and resumable access to onboarding

**User Story:** As a farm owner who was interrupted during setup, I want to return directly to onboarding and continue where I left off, so that I do not lose my progress.

#### Acceptance Criteria

1. WHEN a user navigates directly to the `/onboarding` route, THE Onboarding_Wizard SHALL render the onboarding flow.
2. WHILE the Onboarding_Status for the Workspace is `in_progress`, THE Onboarding_Wizard SHALL restore the saved Draft and resume at the previously reached step.
3. WHEN the Onboarding_Wizard begins collecting input for a Workspace whose Onboarding_Status is `not_started`, THE Farm_Store SHALL set the Onboarding_Status to `in_progress`.

### Requirement 3: Invited member flow preservation

**User Story:** As an invited manager or worker, I want to join the existing farm without triggering owner setup, so that I use the workspace assigned to me.

#### Acceptance Criteria

1. WHEN an Invited_Member signs in, THE Onboarding_Wizard SHALL NOT route the Invited_Member to the `/onboarding` route.
2. WHEN an Invited_Member signs in, THE Onboarding_Wizard SHALL NOT create a new farm or Workspace.
3. WHEN an Invited_Member signs in, THE Onboarding_Wizard SHALL preserve the Invited_Member's assigned-workspace flow and navigate to the assigned destination.

### Requirement 4: Stepped wizard presentation

**User Story:** As a farm owner, I want a clear stepped wizard with navigation and a final review, so that I understand my progress and can confirm before finishing.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL present three ordered steps labeled Farm, Sheds, and First batch with a step indicator showing the current step.
2. THE Onboarding_Wizard SHALL present a Continue control that advances to the next step and a Back control that returns to the previous step, except that Back SHALL be unavailable on the first step.
3. WHEN the user reaches completion, THE Onboarding_Wizard SHALL present a final review of the entered Farm, Shed, and Batch data before Final_Commit.
4. THE Onboarding_Wizard SHALL render all interactive controls using the existing shared Input, Label, Select, and Button components with `h-12` control height.
5. THE Onboarding_Wizard SHALL present each step label as an icon together with a word.
6. IF a validation error occurs on a field, THEN THE Onboarding_Wizard SHALL present the error in an accessible manner associated with the field.
7. THE Onboarding_Wizard SHALL present every user-facing value that is not recorded as an explicit not-recorded indication and SHALL NOT present a not-recorded value as zero.

### Requirement 5: Step 1 — Farm identity

**User Story:** As a farm owner, I want to record my farm name, location, and timezone, so that my workspace reflects my farm.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL collect a farm name, a location, and a farm timezone in Step 1.
2. IF the farm name is empty after trimming surrounding whitespace, THEN THE Onboarding_Wizard SHALL reject the submission of Step 1 with an accessible error.
3. IF the location is empty after trimming surrounding whitespace, THEN THE Onboarding_Wizard SHALL reject the submission of Step 1 with an accessible error.
4. THE Onboarding_Wizard SHALL default the farm timezone to `Asia/Kolkata` AND SHALL allow the Owner to change the timezone.
5. WHEN Step 1 is committed during Final_Commit, THE Farm_Store SHALL save the farm name, location, and timezone to the settings of the current Workspace.
6. WHEN the Farm_Store saves Step 1 settings, THE Farm_Store SHALL NOT overwrite the identity settings of any other Workspace.

### Requirement 6: Step 2 — Sheds with configured capacity

**User Story:** As a farm owner, I want to add one or more sheds with their capacities, so that my housing is represented accurately.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL require at least one Shed to be entered before Step 2 can be completed.
2. THE Onboarding_Wizard SHALL collect a shed name and a bird Configured_Capacity for each Shed.
3. IF a shed name is empty after trimming surrounding whitespace, THEN THE Onboarding_Wizard SHALL reject the Shed entry with an accessible error.
4. IF a Configured_Capacity is not a positive integer, THEN THE Onboarding_Wizard SHALL reject the Shed entry with an accessible error.
5. THE Onboarding_Wizard SHALL provide an Add-another-shed control that adds an additional Shed entry.
6. IF two Shed names within the Workspace are equal after trimming surrounding whitespace and normalizing letter case, THEN THE Onboarding_Wizard SHALL reject the duplicate Shed entry with an accessible error.
7. THE Farm_Store SHALL store the Configured_Capacity as a configuration value distinct from the count of birds placed in the Shed.
8. WHEN a Shed is committed during Final_Commit, THE Farm_Store SHALL assign the Shed a stable identifier linked to the current Workspace.

### Requirement 7: Step 3 — First batch choice

**User Story:** As a farm owner, I want to choose whether to set up a batch now or later, so that I am not forced to fabricate flock data during setup.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL present exactly two explicit choices in Step 3: set up the first batch now, or add a batch later.
2. WHEN the Owner chooses to add a batch later, THE Onboarding_Wizard SHALL complete onboarding without creating any Batch record.
3. WHEN the Owner chooses to set up the first batch now, THE Onboarding_Wizard SHALL present a choice between a Planned_Batch and a Confirmed_Batch.

### Requirement 8: Skipping batch creation

**User Story:** As a farm owner who skips batch setup, I want a clean dashboard that invites me to create a batch, so that I do not see fabricated flock metrics.

#### Acceptance Criteria

1. WHEN the Owner completes onboarding having chosen to add a batch later, THE Onboarding_Wizard SHALL navigate the Owner to the `/dashboard` route.
2. WHEN the dashboard renders for a Workspace with no Batch, THE dashboard SHALL present a create-first-batch empty state.
3. WHEN the dashboard renders for a Workspace with no Batch, THE dashboard SHALL present flock values as not-recorded indications AND SHALL NOT present Seed_Data bird counts or fabricated metrics.

### Requirement 9: Batch common fields and shed allocations

**User Story:** As a farm owner, I want to describe my batch and distribute birds across sheds, so that my flock is represented without locking it to a single shed.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL collect a batch name or code when a Batch is being created.
2. THE Onboarding_Wizard SHALL collect a breed or strain AND SHALL provide a not-known-yet option for the breed or strain.
3. THE Onboarding_Wizard SHALL collect a supplier AND SHALL allow the supplier to be omitted during setup.
4. THE Onboarding_Wizard SHALL allow the Owner to select one or more Sheds for the Batch.
5. THE Onboarding_Wizard SHALL collect a bird Allocation count per selected Shed.
6. THE Farm_Store SHALL represent the relationship between a Batch and its Sheds as per-Shed Allocations AND SHALL NOT permanently attach a Batch to a single Shed.
7. IF a batch name or code is empty after trimming surrounding whitespace, THEN THE Onboarding_Wizard SHALL reject the Batch with an accessible error.

### Requirement 10: Confirmed (already placed) batch validation

**User Story:** As a farm owner recording a placed batch, I want my counts and dates validated, so that only a real placement becomes an active batch.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL collect an actual placement date and a confirmed placed count for a Confirmed_Batch.
2. IF a confirmed placed count is not a positive integer, THEN THE Onboarding_Wizard SHALL reject the Confirmed_Batch with an accessible error.
3. IF any Allocation count is not a positive integer, THEN THE Onboarding_Wizard SHALL reject the Confirmed_Batch with an accessible error.
4. IF the sum of the Allocation counts does not equal the confirmed placed count, THEN THE Onboarding_Wizard SHALL reject the Confirmed_Batch with an accessible error.
5. IF an Allocation count exceeds the Configured_Capacity of its Shed, THEN THE Onboarding_Wizard SHALL flag the Allocation AND SHALL require correction within the onboarding flow before Final_Commit.
6. IF the actual placement date is later than the current date, THEN THE Onboarding_Wizard SHALL reject the Confirmed_Batch with an accessible error.
7. WHEN a Confirmed_Batch is committed during Final_Commit, THE Farm_Store SHALL create the Batch with status `active`.

### Requirement 11: Planned batch handling

**User Story:** As a farm owner planning a future batch, I want to save it as a draft without live-bird data, so that a plan is not mistaken for an active flock.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL collect an expected placement date for a Planned_Batch.
2. WHEN a Planned_Batch is committed during Final_Commit, THE Farm_Store SHALL create the Batch with status `setup`.
3. WHEN a Planned_Batch is committed, THE Farm_Store SHALL NOT populate actual placement fields or live-bird counts for the Batch.
4. WHEN a Planned_Batch is committed, THE Farm_Store SHALL leave `activeBatchId` unchanged.

### Requirement 12: Active-batch designation

**User Story:** As a farm owner, I want only a confirmed placed batch to become my active flock, so that my active status reflects reality.

#### Acceptance Criteria

1. WHEN a Confirmed_Batch is committed during Final_Commit, THE Farm_Store SHALL set `activeBatchId` to the identifier of the committed Confirmed_Batch.
2. WHEN onboarding completes without a Confirmed_Batch, THE Farm_Store SHALL leave `activeBatchId` unchanged.

### Requirement 13: Draft persistence and resume

**User Story:** As a farm owner, I want my in-progress input saved across refreshes, so that a reload does not erase my work.

#### Acceptance Criteria

1. WHEN the Owner enters input in any wizard step, THE Onboarding_Wizard SHALL persist the input as a Draft with stable identifiers.
2. WHEN the `/onboarding` route loads AND a Draft exists for the Workspace, THE Onboarding_Wizard SHALL restore the Draft input.
3. THE Onboarding_Wizard SHALL persist the Draft using the existing Farm_Store persistence approach.

### Requirement 14: Idempotent final commit

**User Story:** As a farm owner, I want finishing onboarding to be safe to retry, so that re-entry or a double-click does not duplicate my records.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL commit all wizard-created records through a single coordinated Final_Commit action.
2. WHEN Final_Commit runs more than once for the same Draft, THE Farm_Store SHALL NOT create duplicate Shed or Batch records.
3. WHEN the Owner activates the Finish control more than once for the same Draft, THE Onboarding_Wizard SHALL commit the records at most once.
4. THE Final_Commit SHALL use the stable Draft identifiers when creating Shed and Batch records so that repeated commits resolve to the same records.

### Requirement 15: Completion status and failure handling

**User Story:** As a farm owner, I want onboarding marked complete only after a successful save, so that a failure leaves my draft intact and recoverable.

#### Acceptance Criteria

1. WHEN Final_Commit succeeds, THE Farm_Store SHALL set the Onboarding_Status for the Workspace to `completed`.
2. IF Final_Commit fails, THEN THE Farm_Store SHALL leave the Onboarding_Status at `in_progress` AND SHALL preserve the Draft.
3. IF Final_Commit fails, THEN THE Onboarding_Wizard SHALL present a retryable error.

### Requirement 16: Data isolation and preservation

**User Story:** As a farm owner, I want my new farm data kept separate from demo data and never destroyed, so that my records are trustworthy.

#### Acceptance Criteria

1. THE Farm_Store SHALL keep Seed_Data separate from records created during onboarding.
2. WHEN the Owner creates farm, Shed, or Batch records during onboarding, THE Farm_Store SHALL NOT clear existing farm records for the Workspace.
3. WHEN a new Owner's dashboard renders after onboarding, THE dashboard SHALL NOT present Seed_Data belonging to the demo workspace.

### Requirement 17: Local-only implementation boundary

**User Story:** As a developer, I want onboarding to stay within the local prototype boundary, so that no backend or sync is introduced and local records are not misrepresented as synchronized.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL read and write state exclusively through the existing Farm_Store and its `localStorage` persistence.
2. THE Onboarding_Wizard SHALL NOT introduce a backend service, a Supabase integration, a new authentication provider, a database migration, or network synchronization.
3. THE Onboarding_Wizard SHALL NOT label locally created records as `Synced`.
4. WHEN the Farm_Store loads a persisted FarmState whose version precedes the version that includes the onboarding and capacity fields, THE Farm_Store SHALL migrate the loaded state by backfilling the new fields with defined default values.
5. THE Onboarding_Wizard SHALL validate all step input using Zod before Final_Commit.
