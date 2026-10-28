from fastapi import APIRouter, HTTPException, Response
from sqlmodel import Session, select

from app.db import SessionDep
from app.models import Skill, SkillCategory, SkillCreate, SkillRead, SkillUpdate

router = APIRouter(prefix="/api/skills", tags=["skills"])


def get_skill_or_404(session: Session, skill_id: int) -> Skill:
    skill = session.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status_code=404, detail=f"Skill {skill_id} not found")
    return skill


def ensure_unique(session: Session, name: str, exclude_id: int | None = None) -> None:
    existing = session.exec(select(Skill).where(Skill.name_key == name.casefold())).first()
    if existing is not None and existing.id != exclude_id:
        raise HTTPException(status_code=409, detail=f"You already have the skill '{existing.name}'")


@router.get("", response_model=list[SkillRead])
def list_skills(session: SessionDep, category: SkillCategory | None = None) -> list[Skill]:
    query = select(Skill).order_by(Skill.category, Skill.name_key)
    if category is not None:
        query = query.where(Skill.category == category)
    return list(session.exec(query).all())


@router.post("", response_model=SkillRead, status_code=201)
def create_skill(data: SkillCreate, session: SessionDep) -> Skill:
    ensure_unique(session, data.name)
    skill = Skill.model_validate(data, update={"name_key": data.name.casefold()})
    session.add(skill)
    session.commit()
    session.refresh(skill)
    return skill


@router.patch("/{skill_id}", response_model=SkillRead)
def update_skill(skill_id: int, data: SkillUpdate, session: SessionDep) -> Skill:
    skill = get_skill_or_404(session, skill_id)
    changes = data.model_dump(exclude_unset=True, exclude_none=True)
    if "name" in changes:
        ensure_unique(session, changes["name"], exclude_id=skill_id)
        changes["name_key"] = changes["name"].casefold()
    skill.sqlmodel_update(changes)
    session.add(skill)
    session.commit()
    session.refresh(skill)
    return skill


@router.delete("/{skill_id}", status_code=204)
def delete_skill(skill_id: int, session: SessionDep) -> Response:
    skill = get_skill_or_404(session, skill_id)
    session.delete(skill)
    session.commit()
    return Response(status_code=204)
