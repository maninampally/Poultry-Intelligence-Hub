# Requirements Document — Unit Handling

## Introduction

This document specifies a general unit-handling system for the Poultry Intelligence Hub web application (`apps/web`). Farmers think in different units for the same physical quantity — feed in **bags** or **kilograms**, bird weight in **grams** or **kilograms** — and bag size is not standardized (50, 25, 70, 75 kg per bag are all seen in practice and can change between deliveries). The system lets users enter and view quantities in their preferred unit while the application stores one canonical unit per quantity kind, so every deterministic calculation (feed stock, feed runway, FCR) remains correct and unaffected by display preferences.

The preferred unit is a **farm-wide setting** (not per user). It is captured during onboarding and editable later in Settings. Because bag size varies, bag size is a **per-entry** property defaulted from the farm setting, not a fixed global constant. All quantities are persisted in a canonical base unit; units are an entry/display concern only. The feature is implemented in the existing local-prototype store; no backend, Supabase, auth provider, DB migration, or network sync is in scope.

This pass builds the general units foundation and applies it to **feed** end to end (the primary need) and establishes the pattern for bird weight; other domains (water, medicine, area) are out of scope for this pass but must be expressible on the same foundation without rework.

## Glossary

- **Quantity_Kind**: A category of physical quantity with a single canonical unit — `mass` (canonical kilogram), `weight` (canonical gram), `volume` (canonical litre), `count` (canonical whole number).
- **Canonical_Unit**: The single stored unit for a Quantity_Kind. Feed mass is stored in kilograms; bird weight is stored in grams.
- **Display_Unit**: The unit a value is shown in or entered in; may differ from the Canonical_Unit.
- **Fixed_Factor_Unit**: A Display_Unit convertible to the Canonical_Unit by a constant factor (e.g. tonne↔kg, kg↔gram).
- **Variable_Factor_Unit**: A Display_Unit whose conversion depends on a per-record context value — specifically **bags**, which convert to kilograms using a **Bag_Size**.
- **Bag_Size**: The kilograms contained in one bag, for a specific feed entry. Not globally fixed.
- **Farm_Feed_Unit**: The farm-wide preferred feed Display_Unit, one of `kg` or `bags`.
- **Default_Bag_Size**: The farm-wide default Bag_Size used to pre-fill entry forms when Farm_Feed_Unit is `bags`.
- **Units_Module**: The pure, deterministic conversion module (`src/domain/units.ts`) exposing `toCanonical` and `fromCanonical`.
- **Entry_Context**: Metadata stored on a record describing how a value was entered — the Display_Unit, the entered value, and (for bags) the Bag_Size — kept for honest display and round-trip editing, separate from the canonical value.
- **Farm_Store**: The existing frontend state container persisted to `localStorage`.
- **FeedMovement**: The existing feed record; its canonical `kg` field remains authoritative.

## Requirements

### Requirement 1: Canonical storage independent of display unit

**User Story:** As a farm operator, I want quantities stored in one canonical unit regardless of how I enter them, so that my feed stock, runway, and FCR stay correct when I switch units.

#### Acceptance Criteria

1. THE Farm_Store SHALL store every feed quantity as kilograms in the existing canonical field.
2. THE Farm_Store SHALL store every bird-weight quantity as grams in the existing canonical field.
3. WHEN a quantity is entered in a Display_Unit other than the Canonical_Unit, THE Units_Module SHALL convert it to the Canonical_Unit before it is stored.
4. THE deterministic calculations for feed stock, feed runway, and FCR SHALL operate solely on canonical values AND SHALL NOT depend on any Display_Unit.
5. WHEN the Farm_Feed_Unit changes, THE Farm_Store SHALL NOT alter any previously stored canonical value.

### Requirement 2: Deterministic, pure conversion

**User Story:** As a developer, I want conversions to be pure and deterministic, so that calculations are reproducible and testable.

#### Acceptance Criteria

1. THE Units_Module SHALL expose `toCanonical(value, displayUnit, kind, context?)` and `fromCanonical(canonicalValue, displayUnit, kind, context?)` as pure functions.
2. WHERE a Display_Unit is a Fixed_Factor_Unit, THE Units_Module SHALL convert using a constant factor without external context.
3. WHERE a Display_Unit is a Variable_Factor_Unit (bags), THE Units_Module SHALL require a Bag_Size in the context AND SHALL convert kilograms as `bags × BagSize` and bags as `kilograms ÷ BagSize`.
4. IF a Variable_Factor_Unit conversion is requested without a positive Bag_Size, THEN THE Units_Module SHALL reject the conversion.
5. THE Units_Module SHALL NOT round canonical values in a way that loses information needed by calculations; any rounding SHALL be applied only to displayed values.

### Requirement 3: Farm-wide feed unit preference

**User Story:** As a farm owner, I want to set whether my farm works in bags or kilograms, so that entry and display match how my team thinks.

#### Acceptance Criteria

1. THE Farm_Store SHALL hold a Farm_Feed_Unit setting with exactly one of the values `kg` or `bags`, scoped to the farm/workspace.
2. WHERE Farm_Feed_Unit is `bags`, THE Farm_Store SHALL hold a positive Default_Bag_Size in kilograms.
3. THE Farm_Feed_Unit and Default_Bag_Size SHALL be editable in Settings after onboarding.
4. WHEN the Farm_Feed_Unit is `kg`, THE application SHALL NOT require a Default_Bag_Size.

### Requirement 4: Onboarding captures the feed unit

**User Story:** As a new farm owner, I want onboarding to ask whether I use bags or kilograms, so that my preference is set from the start.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL ask the owner to choose a Farm_Feed_Unit of `kg` or `bags`.
2. WHEN the owner chooses `kg`, THE Onboarding_Wizard SHALL NOT ask for a bag size.
3. WHEN the owner chooses `bags`, THE Onboarding_Wizard SHALL require a Default_Bag_Size that is a positive number of kilograms.
4. WHEN onboarding completes, THE Farm_Store SHALL persist the chosen Farm_Feed_Unit and, for `bags`, the Default_Bag_Size, to the farm/workspace settings.
5. IF the owner chooses `bags` AND the Default_Bag_Size is missing or not a positive number, THEN THE Onboarding_Wizard SHALL reject the step with an accessible error.

### Requirement 5: Feed entry in the preferred unit with per-entry override

**User Story:** As a farm worker recording feed, I want to enter in bags or kilograms and set the bag size for this delivery, so that varying bag sizes are captured accurately.

#### Acceptance Criteria

1. WHEN a feed entry form opens, THE form SHALL default its Display_Unit to the Farm_Feed_Unit.
2. THE feed entry form SHALL provide a control to switch the Display_Unit between `kg` and `bags` for the current entry.
3. WHERE the Display_Unit is `bags`, THE feed entry form SHALL present a Bag_Size field pre-filled with the Default_Bag_Size AND SHALL allow it to be changed for this entry.
4. IF the Display_Unit is `bags` AND the Bag_Size is not a positive number, THEN THE feed entry form SHALL reject the entry with an accessible error.
5. WHEN a feed entry is saved, THE Farm_Store SHALL store the canonical kilograms computed from the entered value and unit.
6. WHEN a feed entry is saved in `bags`, THE Farm_Store SHALL store the Entry_Context (Display_Unit, entered value, Bag_Size) on the record.
7. THE feed entry form SHALL present the unit beside every quantity field as a word AND SHALL NOT present a quantity without its unit.

### Requirement 6: Feed display in the preferred unit

**User Story:** As a farm operator, I want feed figures shown in my preferred unit, so that stock and usage are easy to read.

#### Acceptance Criteria

1. WHEN feed stock, feed usage, or feed runway inputs are displayed AND Farm_Feed_Unit is `bags`, THE application SHALL present the value converted to bags using the Default_Bag_Size.
2. WHEN a feed value is displayed in bags, THE application SHALL show the unit word `bags` with the number.
3. WHERE a stored feed record has an Entry_Context in bags, THE application SHALL be able to show the original entered value and its Bag_Size.
4. WHEN a feed record without an Entry_Context is displayed in bags, THE application SHALL convert using the Default_Bag_Size AND SHALL indicate that the conversion uses the default bag size.
5. THE application SHALL NOT present a feed value computed as `null` (not recorded) as zero.

### Requirement 7: Bird weight unit expressibility

**User Story:** As a farm operator, I want bird weight to use the same unit foundation, so that gram/kilogram display is consistent and future units are easy to add.

#### Acceptance Criteria

1. THE Units_Module SHALL support converting bird weight between grams and kilograms as a Fixed_Factor_Unit.
2. THE Farm_Store SHALL continue to store bird weight in grams as the Canonical_Unit.
3. WHERE bird weight is displayed, THE application SHALL be able to present it in grams or kilograms via the Units_Module without changing stored values.

### Requirement 8: Migration and persistence

**User Story:** As a returning user, I want existing data to keep working after units are added, so that nothing breaks or is lost.

#### Acceptance Criteria

1. WHEN the Farm_Store loads a persisted state that predates the unit settings, THE Farm_Store SHALL backfill Farm_Feed_Unit to `kg` and omit a required Default_Bag_Size.
2. THE Farm_Store SHALL treat existing feed records without an Entry_Context as canonical kilograms with no original-unit metadata.
3. THE Farm_Store SHALL keep the persisted state version policy unchanged such that existing demo and user state continues to load.
4. THE unit settings and Entry_Context fields SHALL be additive and SHALL NOT remove or rewrite existing fields.

### Requirement 9: Local-only boundary

**User Story:** As a developer, I want unit handling to stay within the local prototype boundary, so that no backend or sync is introduced.

#### Acceptance Criteria

1. THE unit-handling feature SHALL read and write state exclusively through the existing Farm_Store and its `localStorage` persistence.
2. THE unit-handling feature SHALL NOT introduce a backend, a Supabase integration, a new authentication provider, a database migration, or network synchronization.
3. THE unit-handling feature SHALL validate unit input using Zod before values are committed.
4. THE unit-handling feature SHALL NOT label locally created records as `Synced`.
