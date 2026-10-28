from fastapi import APIRouter, HTTPException, Response
from sqlmodel import Session, select

from app.db import SessionDep
from app.models import Item, ItemCreate, ItemKind, ItemRead, ItemUpdate, check_dates, utcnow

router = APIRouter(prefix="/api/items", tags=["items"])


def sort_items(items: list[Item]) -> list[Item]:
    """Manual order first, then ongoing items, then most recent first."""
    items = sorted(items, key=lambda i: i.end_date or i.start_date or "", reverse=True)
    items = sorted(items, key=lambda i: not i.is_current)
    return sorted(items, key=lambda i: i.sort_order)


def get_item_or_404(session: Session, item_id: int) -> Item:
    item = session.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
    return item


@router.get("", response_model=list[ItemRead])
def list_items(session: SessionDep, kind: ItemKind | None = None) -> list[Item]:
    query = select(Item)
    if kind is not None:
        query = query.where(Item.kind == kind)
    return sort_items(list(session.exec(query).all()))


@router.post("", response_model=ItemRead, status_code=201)
def create_item(data: ItemCreate, session: SessionDep) -> Item:
    item = Item.model_validate(data)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.get("/{item_id}", response_model=ItemRead)
def read_item(item_id: int, session: SessionDep) -> Item:
    return get_item_or_404(session, item_id)


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(item_id: int, data: ItemUpdate, session: SessionDep) -> Item:
    item = get_item_or_404(session, item_id)
    changes = data.model_dump(exclude_unset=True)

    # Required fields cannot be cleared with null.
    for field in ("kind", "title"):
        if field in changes and changes[field] is None:
            raise HTTPException(status_code=422, detail=f"{field} cannot be empty")
    # Optional text and list fields: null means "clear it".
    for field, empty in (("bullets", []), ("tags", []), ("tech", [])):
        if field in changes and changes[field] is None:
            changes[field] = empty
    for field in ("organization", "role", "location", "link", "description"):
        if field in changes and changes[field] is None:
            changes[field] = ""
    if changes.get("is_current"):
        changes["end_date"] = None

    try:
        check_dates(
            changes.get("start_date", item.start_date),
            changes.get("end_date", item.end_date),
            changes.get("is_current", item.is_current),
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    item.sqlmodel_update(changes)
    item.updated_at = utcnow()
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, session: SessionDep) -> Response:
    item = get_item_or_404(session, item_id)
    session.delete(item)
    session.commit()
    return Response(status_code=204)
