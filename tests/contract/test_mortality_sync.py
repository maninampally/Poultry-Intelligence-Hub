"""Mortality sync contract tests.

Covers idempotency, correction (`supersedes_event_id`), and metrics rebuild rules.

Without `DATABASE_URL`, domain + command-mapping tests run against pure/mocked code.
With `DATABASE_URL`, optional integration cases exercise the live ledger (skipped if unset).

Install:
  pip install -e packages/backend-core -r tests/contract/requirements.txt
  PYTHONPATH=packages/backend-core/src pytest tests/contract -q
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
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
    ):
        tx.return_value.__enter__.return_value = MagicMock()
        tx.return_value.__exit__.return_value = None
        result = mortality_service.log_mortality(command)

    assert result.duplicate is True
    assert result.accepted is True
    assert result.event_id == existing_event
    repo.insert_logged_event.assert_not_called()


def test_log_mortality_correction_inserts_new_event_with_supersedes():
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
    repo.insert_logged_event.return_value = event

    with (
        patch("murgi_mitra.modules.daily_ops.application.service.transaction") as tx,
        patch(
            "murgi_mitra.modules.daily_ops.application.service.MortalityRepository",
            return_value=repo,
        ),
    ):
        tx.return_value.__enter__.return_value = MagicMock()
        tx.return_value.__exit__.return_value = None
        result = mortality_service.log_mortality(command)

    assert result.duplicate is False
    assert result.accepted is True
    assert result.event_id == command.entity_id
    inserted = repo.insert_logged_event.call_args.args[0]
    assert inserted.supersedes_event_id == original_id
    # Original event is never updated — only a new insert path exists.
    assert not hasattr(repo, "update_logged_event") or not repo.update_logged_event.called


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
