"""Export your whole profile as one JSON file, and import it back.

Use it to back up your data, to move it to another machine, or to rebuild the
database after a model change (export, delete data/jobpilot.db, restart, import).
"""

from fastapi import APIRouter, HTTPException
from sqlmodel import delete, select

from app.db import SessionDep
from app.models import (
    Item,
    ItemCreate,
    Profile,
    ProfileBundle,
    ProfileUpdate,
    Skill,
    SkillCreate,
    utcnow,
)
from app.routers.items import sort_items
from app.routers.profile import get_or_create_profile

router = APIRouter(prefix="/api", tags=["backup"])


@router.get("/export", response_model=ProfileBundle)
def export_profile(session: SessionDep) -> ProfileBundle:
    profile = get_or_create_profile(session)
    items = sort_items(list(session.exec(select(Item)).all()))
    skills = session.exec(select(Skill).order_by(Skill.category, Skill.name_key)).all()
    return ProfileBundle(
        profile=ProfileUpdate.model_validate(profile, from_attributes=True),
        items=[ItemCreate.model_validate(i, from_attributes=True) for i in items],
        skills=[SkillCreate.model_validate(s, from_attributes=True) for s in skills],
    )


@router.post("/import")
def import_profile(bundle: ProfileBundle, session: SessionDep) -> dict[str, int]:
    """Replace everything with the contents of the bundle."""
    names = [s.name.casefold() for s in bundle.skills]
    duplicates = sorted({n for n in names if names.count(n) > 1})
    if duplicates:
        raise HTTPException(status_code=422, detail=f"Duplicate skills in file: {', '.join(duplicates)}")

    session.exec(delete(Item))
    session.exec(delete(Skill))
    session.exec(delete(Profile))
    session.add(Profile(id=1, **bundle.profile.model_dump(), updated_at=utcnow()))
    for item in bundle.items:
        session.add(Item.model_validate(item))
    for skill in bundle.skills:
        session.add(Skill.model_validate(skill, update={"name_key": skill.name.casefold()}))
    session.commit()
    return {"items": len(bundle.items), "skills": len(bundle.skills)}
