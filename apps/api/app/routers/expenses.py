"""Expenses CRUD (manager-only via RLS). Money is integer paise."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field

from app import db
from app.auth import AuthContext, get_auth
from app.serialize import row_dict

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


class ExpenseCreate(BaseModel):
    org_id: str
    flock_id: str | None = None
    category_id: str | None = None
    category_name: str | None = None
    occurred_date: date
    amount_paise: int = Field(ge=0)
    photo_uri: str | None = None
    notes: str | None = None


@router.get("")
async def list_expenses(
    org_id: str = Query(...),
    flock_id: str | None = None,
    auth: AuthContext = Depends(get_auth),
) -> list[dict]:
    async with db.acquire(auth.user_id) as conn:
        if flock_id:
            rows = await conn.fetch(
                """
                select id, org_id, flock_id, category_id, category_name,
                       occurred_date, amount_paise, photo_uri, notes, updated_at
                from expenses
                where org_id = $1 and flock_id = $2 and deleted_at is null
                order by occurred_date desc
                """,
                org_id,
                flock_id,
            )
        else:
            rows = await conn.fetch(
                """
                select id, org_id, flock_id, category_id, category_name,
                       occurred_date, amount_paise, photo_uri, notes, updated_at
                from expenses
                where org_id = $1 and deleted_at is null
                order by occurred_date desc
                limit 200
                """,
                org_id,
            )
    return [row_dict(r) for r in rows]


@router.post("", status_code=201)
async def create_expense(
    body: ExpenseCreate, auth: AuthContext = Depends(get_auth)
) -> dict:
    async with db.acquire(auth.user_id) as conn:
        row = await conn.fetchrow(
            """
            insert into expenses
              (org_id, flock_id, category_id, category_name, occurred_date,
               amount_paise, photo_uri, notes, created_by)
            values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            returning id, org_id, flock_id, category_id, category_name,
                      occurred_date, amount_paise, photo_uri, notes, created_at
            """,
            body.org_id,
            body.flock_id,
            body.category_id,
            body.category_name,
            body.occurred_date,
            body.amount_paise,
            body.photo_uri,
            body.notes,
            auth.user_id,
        )
    if row is None:
        raise HTTPException(status_code=403, detail="expense write denied")
    return row_dict(row)


@router.delete("/{expense_id}", status_code=204)
async def soft_delete_expense(
    expense_id: str, auth: AuthContext = Depends(get_auth)
) -> Response:
    async with db.acquire(auth.user_id) as conn:
        result = await conn.execute(
            """
            update expenses
            set deleted_at = now()
            where id = $1 and deleted_at is null
            """,
            expense_id,
        )
    # asyncpg returns e.g. "UPDATE 1"
    if result.split()[-1] == "0":
        raise HTTPException(status_code=404, detail="expense not found")
    return Response(status_code=204)
