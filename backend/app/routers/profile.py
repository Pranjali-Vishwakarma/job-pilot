from fastapi import APIRouter
from sqlmodel import Session

from app.db import SessionDep
from app.models import Profile, ProfileRead, ProfileUpdate, utcnow

router = APIRouter(prefix="/api/profile", tags=["profile"])


def get_or_create_profile(session: Session) -> Profile:
    profile = session.get(Profile, 1)
    if profile is None:
        profile = Profile(id=1)
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return profile


@router.get("", response_model=ProfileRead)
def read_profile(session: SessionDep) -> Profile:
    return get_or_create_profile(session)


@router.put("", response_model=ProfileRead)
def update_profile(data: ProfileUpdate, session: SessionDep) -> Profile:
    profile = get_or_create_profile(session)
    profile.sqlmodel_update(data.model_dump())
    profile.updated_at = utcnow()
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile
