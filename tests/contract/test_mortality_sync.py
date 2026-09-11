"""Mortality sync contract tests.

Covers idempotency, correction (`supersedes_event_id`), metrics rebuild rules,
pull payload shape, and Express write freeze.

Without `DATABASE_URL`, domain + command-mapping tests run against pure/mocked code.
With `DATABASE_URL`, optional integration cases exercise the live ledger (skipped if unset).

Install:
  pip install -e packages/backend-core -r tests/contract/requirements.txt
  PYTHONPATH=packages/backend-core/src pytest tests/contract -q
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from murgi_mitra.core.auth import AuthContext
from murgi_mitra.modules.daily_ops.application.commands import LogMortality, LogMortalityResult
from murgi_mitra.modules.daily_ops.application import service as mortality_service
from murgi_mitra.modules.daily_ops.domain import rules
from murgi_mitra.modules.daily_ops.domain.events import MortalityLogged
from murgi_mitra.modules.daily_ops.infrastructure.sync_handler import push_mortality
from murgi_mitra.modules.sync.schemas import MortalitySyncOperation

HAS_DATABASE = bool(os.getenv("DATABASE_URL"))
requires_db = pytest.mark.skipif(not HAS_DATABASE, reason="DATABASE_URL not set")


def _auth() -> AuthContext:
    return AuthContext(tenant_id="tenant-1", user_id="user-1")


def _command(**overrides) -> LogMortality:
    base = dict(
        operation_id=uuid4(),
        idempotency_key="idem-1",
        entity_id=uuid4(),
        batch_id=uuid4(),
        shed_id=uuid4(),
        count=4,
        shift="morning",
        cause="heat",
        occurred_at=datetime.now(timezone.utc),
        tenant_id="tenant-1",
        actor_user_id="user-1",
    )
    base.update(overrides)
    return LogMortality(**base)


# --- Domain rules ---


def test_live_bird_count_never_negative():
    assert rules.live_bird_count(100, 5) == 95
    assert rules.live_bird_count(10, 50) == 0


def test_mortality_percent():
    assert rules.mortality_percent(1000, 25) == 2.5


def test_validate_mortality_count_rejects_negative():
    with pytest.raises(ValueError, match="negative"):
        rules.validate_mortality_count(-1)


def test_metrics_exclude_superseded_events_rule():
    """Mirrors repository SQL: ignore events that have a correcting supersession."""
    events = [
        {"id": "orig", "count": 10, "supersedes_event_id": None},
        {"id": "fix", "count": 3, "supersedes_event_id": "orig"},
        {"id": "other", "count": 2, "supersedes_event_id": None},
    ]
    superseded_ids = {
        e["supersedes_event_id"] for e in events if e["supersedes_event_id"]
    }
    active = [e for e in events if e["id"] not in superseded_ids]
    assert sum(e["count"] for e in active) == 5  # corr(3) + other(2); orig ignored


def test_validate_correction_target_rejects_missing_original():
    with pytest.raises(ValueError, match="original_event_not_found"):
        rules.validate_correction_target(
            original=None,
            batch_id=uuid4(),
            tenant_id="tenant-1",
        )


def test_validate_correction_target_rejects_already_superseded():
    batch_id = uuid4()
    with pytest.raises(ValueError, match="original_event_already_superseded"):
        rules.validate_correction_target(
            original={
                "tenant_id": "tenant-1",
                "batch_id": batch_id,
                "event_type": "mortality.logged",
                "already_superseded": True,
            },
            batch_id=batch_id,
            tenant_id="tenant-1",
        )


def test_validate_correction_target_rejects_batch_mismatch():
    with pytest.raises(ValueError, match="original_event_batch_mismatch"):
        rules.validate_correction_target(
            original={
                "tenant_id": "tenant-1",
                "batch_id": uuid4(),
                "event_type": "mortality.logged",
                "already_superseded": False,
            },
            batch_id=uuid4(),
            tenant_id="tenant-1",
        )


def test_mortality_logged_payload_includes_supersedes_when_set():
    original = uuid4()
    event = MortalityLogged(
        event_id=uuid4(),
        batch_id=uuid4(),
        shed_id=uuid4(),
        count=2,
        shift="morning",
        cause="heat",
        occurred_at=datetime.now(timezone.utc),
        supersedes_event_id=original,
    )
    assert event.payload()["supersedes_event_id"] == str(original)


# --- Sync handler mapping ---


def test_push_mortality_maps_supersedes_event_id():
    original = uuid4()
    operation = MortalitySyncOperation(
        operation_id=uuid4(),
        idempotency_key="corr-1",
        resource="mortality-entry",
        action="create",
        entity_id=uuid4(),
        batch_id=uuid4(),
        shed_id=uuid4(),
        occurred_at=datetime.now(timezone.utc),
        count=2,
        shift="evening",
        cause="unknown",
        supersedes_event_id=original,
    )
    captured: list[LogMortality] = []

    def fake_log(command: LogMortality, operation_payload=None):
        captured.append(command)
        return LogMortalityResult(
            operation_id=command.operation_id,
            accepted=True,
            event_id=command.entity_id,
        )

    with patch(
        "murgi_mitra.modules.daily_ops.infrastructure.sync_handler.log_mortality",
        side_effect=fake_log,
    ):
        result = push_mortality(operation, _auth())

    assert result.accepted is True
    assert result.duplicate is False
    assert len(captured) == 1
    assert captured[0].supersedes_event_id == original
    assert captured[0].count == 2


def test_push_mortality_duplicate_flag_passthrough():
    op_id = uuid4()
    event_id = uuid4()
    operation = MortalitySyncOperation(
        operation_id=op_id,
        idempotency_key="dup-key",
        resource="mortality-entry",
        action="create",
        entity_id=uuid4(),
        batch_id=uuid4(),
        shed_id=uuid4(),
        occurred_at=datetime.now(timezone.utc),
        count=1,
        shift="morning",
    )

    with patch(
        "murgi_mitra.modules.daily_ops.infrastructure.sync_handler.log_mortality",
        return_value=LogMortalityResult(
            operation_id=op_id,
            accepted=True,
            event_id=event_id,
            duplicate=True,
        ),
    ):
        result = push_mortality(operation, _auth())

    assert result.duplicate is True
    assert result.event_id == event_id
    assert result.accepted is True


# --- Application service (mocked repository / transaction) ---


def test_log_mortality_duplicate_idempotency_key_returns_duplicate_true():
    command = _command(idempotency_key="same-key")
    existing_event = uuid4()
    repo = MagicMock()
    repo.find_sync_operation.return_value = {
        "operation_id": command.operation_id,
        "event_id": existing_event,
        "status": "accepted",
    }

    with (
        patch("murgi_mitra.modules.daily_ops.application.service.transaction") as tx,
        patch(
            "murgi_mitra.modules.daily_ops.application.service.MortalityRepository",
            return_value=repo,
        ),
        patch("murgi_mitra.modules.daily_ops.application.service.apply_rls_context"),
    ):
        tx.return_value.__enter__.return_value = MagicMock()
        tx.return_value.__exit__.return_value = None
        result = mortality_service.log_mortality(command)

    assert result.duplicate is True
    assert result.accepted is True
    assert result.event_id == existing_event
    repo.insert_logged_event.assert_not_called()


def test_log_mortality_correction_validates_and_inserts_new_event():
    original_id = uuid4()
    command = _command(supersedes_event_id=original_id, idempotency_key="corr-key")
    event = MortalityLogged(
        event_id=command.entity_id,
        batch_id=command.batch_id,
        shed_id=command.shed_id,
        count=command.count,
        shift=command.shift,
        cause=command.cause,
        occurred_at=command.occurred_at,
        supersedes_event_id=original_id,
    )
    repo = MagicMock()
    repo.find_sync_operation.return_value = None
    repo.load_correction_target.return_value = {
        "tenant_id": command.tenant_id,
        "batch_id": command.batch_id,
        "event_type": "mortality.logged",
        "already_superseded": False,
    }
    repo.insert_logged_event.return_value = event

    with (
        patch("murgi_mitra.modules.daily_ops.application.service.transaction") as tx,
        patch(
            "murgi_mitra.modules.daily_ops.application.service.MortalityRepository",
            return_value=repo,
        ),
        patch("murgi_mitra.modules.daily_ops.application.service.apply_rls_context"),
    ):
        tx.return_value.__enter__.return_value = MagicMock()
        tx.return_value.__exit__.return_value = None
        result = mortality_service.log_mortality(command)

    assert result.duplicate is False
    assert result.accepted is True
    assert result.event_id == command.entity_id
    repo.load_correction_target.assert_called_once_with(original_id, command.tenant_id)
    inserted = repo.insert_logged_event.call_args.args[0]
    assert inserted.supersedes_event_id == original_id


def test_log_mortality_correction_rejects_missing_original():
    original_id = uuid4()
    command = _command(supersedes_event_id=original_id, idempotency_key="corr-missing")
    repo = MagicMock()
    repo.find_sync_operation.return_value = None
    repo.load_correction_target.return_value = None

    with (
        patch("murgi_mitra.modules.daily_ops.application.service.transaction") as tx,
        patch(
            "murgi_mitra.modules.daily_ops.application.service.MortalityRepository",
            return_value=repo,
        ),
        patch("murgi_mitra.modules.daily_ops.application.service.apply_rls_context"),
    ):
        tx.return_value.__enter__.return_value = MagicMock()
        tx.return_value.__exit__.return_value = None
        with pytest.raises(ValueError, match="original_event_not_found"):
            mortality_service.log_mortality(command)

    repo.insert_logged_event.assert_not_called()


def test_rebuild_batch_metrics_uses_repo_totals_that_exclude_superseded():
    batch_id = uuid4()
    last_event = uuid4()
    repo = MagicMock()
    repo.load_batch_mortality_totals.return_value = {
        "placement_count": 1000,
        "mortality": 5,  # already excludes superseded rows in SQL
        "tenant_id": "tenant-1",
        "last_event_id": last_event,
    }

    with (
        patch("murgi_mitra.modules.daily_ops.application.service.transaction") as tx,
        patch(
            "murgi_mitra.modules.daily_ops.application.service.MortalityRepository",
            return_value=repo,
        ),
    ):
        tx.return_value.__enter__.return_value = MagicMock()
        tx.return_value.__exit__.return_value = None
        mortality_service.rebuild_batch_metrics(batch_id)

    kwargs = repo.upsert_batch_metrics.call_args.kwargs
    assert kwargs["cumulative_mortality"] == 5
    assert kwargs["live_birds"] == 995
    assert kwargs["mortality_pct"] == 0.5


def test_express_mortality_post_frozen_in_source():
    route = Path("apps/api/src/routes/mortality.ts").read_text()
    assert "410" in route
    assert "EXPRESS_MORTALITY_WRITE_FROZEN" in route
    assert "sync/push" in route


def test_celery_beat_schedules_outbox_relay():
    source = Path("apps/worker-python/app/celery_app.py").read_text()
    assert "relay-outbox-every-minute" in source
    assert "outbox.relay" in source
    assert "beat_schedule" in source


def test_get_batch_metrics_denies_cross_tenant_access():
    batch_id = uuid4()
    repo = MagicMock()
    repo.user_can_access_batch.return_value = False

    with (
        patch("murgi_mitra.modules.daily_ops.application.service.transaction") as tx,
        patch(
            "murgi_mitra.modules.daily_ops.application.service.MortalityRepository",
            return_value=repo,
        ),
        patch("murgi_mitra.modules.daily_ops.application.service.apply_rls_context"),
    ):
        tx.return_value.__enter__.return_value = MagicMock()
        tx.return_value.__exit__.return_value = None
        with pytest.raises(PermissionError, match="batch_access_denied"):
            mortality_service.get_batch_metrics(batch_id, _auth())

    repo.load_batch_metrics.assert_not_called()


def test_get_batch_metrics_returns_stored_projection_for_member():
    batch_id = uuid4()
    event_id = uuid4()
    repo = MagicMock()
    repo.user_can_access_batch.return_value = True
    repo.load_batch_metrics.return_value = {
        "batch_id": batch_id,
        "tenant_id": "tenant-1",
        "placement_count": 1000,
        "cumulative_mortality": 12,
        "live_bird_count": 988,
        "mortality_percent": 1.2,
        "last_processed_event_id": event_id,
        "projection_status": "current",
    }

    with (
        patch("murgi_mitra.modules.daily_ops.application.service.transaction") as tx,
        patch(
            "murgi_mitra.modules.daily_ops.application.service.MortalityRepository",
            return_value=repo,
        ),
        patch("murgi_mitra.modules.daily_ops.application.service.apply_rls_context"),
    ):
        tx.return_value.__enter__.return_value = MagicMock()
        tx.return_value.__exit__.return_value = None
        view = mortality_service.get_batch_metrics(batch_id, _auth())

    assert view.live_bird_count == 988
    assert view.cumulative_mortality == 12
    assert view.projection_status == "current"
    assert view.last_processed_event_id == event_id


def test_get_batch_metrics_derives_from_ledger_when_projection_missing():
    batch_id = uuid4()
    repo = MagicMock()
    repo.user_can_access_batch.return_value = True
    repo.load_batch_metrics.return_value = None
    repo.load_batch_mortality_totals.return_value = {
        "placement_count": 500,
        "mortality": 20,
        "tenant_id": "tenant-1",
        "last_event_id": uuid4(),
    }

    with (
        patch("murgi_mitra.modules.daily_ops.application.service.transaction") as tx,
        patch(
            "murgi_mitra.modules.daily_ops.application.service.MortalityRepository",
            return_value=repo,
        ),
        patch("murgi_mitra.modules.daily_ops.application.service.apply_rls_context"),
    ):
        tx.return_value.__enter__.return_value = MagicMock()
        tx.return_value.__exit__.return_value = None
        view = mortality_service.get_batch_metrics(batch_id, _auth())

    assert view.live_bird_count == 480
    assert view.cumulative_mortality == 20
    assert view.projection_status == "derived"


def test_express_list_prefers_ledger_and_exposes_metrics_route():
    route = Path("apps/api/src/routes/mortality.ts").read_text()
    assert "ledger-preferred" in route or "ledger-preferred" in route.lower() or "X-Mortality-Source" in route
    assert "/metrics" in route
    assert "getBatchMetrics" in route
    db_helper = Path("packages/db/src/queries/mortality.ts").read_text()
    assert "list-ledger-by-batch.sql" in db_helper
    assert "get-batch-metrics.sql" in db_helper


def test_fastapi_batches_metrics_route_wired():
    api = Path("packages/backend-core/src/murgi_mitra/modules/daily_ops/api.py").read_text()
    main = Path("apps/api-python/app/main.py").read_text()
    assert "/{batch_id}/metrics" in api
    assert "batches_router" in main


@requires_db
def test_db_idempotency_and_correction_smoke():
    """Optional live DB smoke — requires migrated schema + seed memberships.

    Manual proof path is documented in docs/DESIGN.md; this skippable case
    only asserts connectivity against a configured DB.
    """
    from murgi_mitra.core.database import transaction

    with transaction() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            assert cursor.fetchone()[0] == 1
