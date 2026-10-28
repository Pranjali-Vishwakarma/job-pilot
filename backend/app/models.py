"""Data model for your profile.

Three tables:
- Profile: one row with your contact details and summary.
- Item: every resume entry (education, experience, project, achievement,
  certification, activity). One shared shape keeps the API small and lets the
  Phase 2 scorer rank every entry the same way.
- Skill: your skills, each with a category and level.

Each table has Base / Create / Update / Read variants: the Create and Update
models validate what the API receives, the table model is what gets stored.
"""

import re
from datetime import UTC, datetime
from enum import StrEnum

from pydantic import field_validator, model_validator
from sqlmodel import JSON, Field, SQLModel

YEAR_MONTH = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def utcnow() -> datetime:
    return datetime.now(UTC)


def clean_list(values: list[str] | None, dedupe: bool = False) -> list[str]:
    """Trim whitespace, drop empty entries and, optionally, case-insensitive duplicates."""
    cleaned: list[str] = []
    seen: set[str] = set()
    for value in values or []:
        text = value.strip()
        if not text:
            continue
        key = text.casefold()
        if dedupe and key in seen:
            continue
        seen.add(key)
        cleaned.append(text)
    return cleaned


# ---------------------------------------------------------------- Profile


class ProfileBase(SQLModel):
    full_name: str = Field(default="", max_length=120)
    headline: str = Field(default="", max_length=160)
    email: str = Field(default="", max_length=200)
    phone: str = Field(default="", max_length=40)
    location: str = Field(default="", max_length=120)
    linkedin_url: str = Field(default="", max_length=300)
    github_url: str = Field(default="", max_length=300)
    portfolio_url: str = Field(default="", max_length=300)
    summary: str = Field(default="", max_length=2000)


class Profile(ProfileBase, table=True):
    id: int | None = Field(default=1, primary_key=True)
    updated_at: datetime = Field(default_factory=utcnow)


class ProfileUpdate(ProfileBase):
    pass


class ProfileRead(ProfileBase):
    updated_at: datetime


# ---------------------------------------------------------------- Items


class ItemKind(StrEnum):
    education = "education"
    experience = "experience"
    project = "project"
    achievement = "achievement"
    certification = "certification"
    activity = "activity"


class ItemFields(SQLModel):
    """Fields shared by every item variant, all optional so Update can reuse them."""

    organization: str = Field(default="", max_length=200)
    role: str = Field(default="", max_length=200)
    location: str = Field(default="", max_length=120)
    start_date: str | None = Field(default=None, description="YYYY-MM")
    end_date: str | None = Field(default=None, description="YYYY-MM")
    is_current: bool = False
    link: str = Field(default="", max_length=300)
    description: str = Field(default="", max_length=1000)
    bullets: list[str] = Field(default_factory=list, sa_type=JSON)
    tags: list[str] = Field(default_factory=list, sa_type=JSON)
    tech: list[str] = Field(default_factory=list, sa_type=JSON)
    sort_order: int = 0


class ItemBase(ItemFields):
    kind: ItemKind = Field(index=True)
    title: str = Field(min_length=1, max_length=200)


class Item(ItemBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class ItemValidation(SQLModel):
    """Validators shared by ItemCreate and ItemUpdate."""

    @field_validator("start_date", "end_date", mode="before", check_fields=False)
    @classmethod
    def check_year_month(cls, value: str | None) -> str | None:
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
        value = str(value).strip()
        if not YEAR_MONTH.match(value):
            raise ValueError("Use the format YYYY-MM, for example 2025-06")
        return value

    @field_validator("bullets", mode="after", check_fields=False)
    @classmethod
    def clean_bullets(cls, value: list[str] | None) -> list[str] | None:
        return None if value is None else clean_list(value)

    @field_validator("tags", "tech", mode="after", check_fields=False)
    @classmethod
    def clean_tags(cls, value: list[str] | None) -> list[str] | None:
        return None if value is None else clean_list(value, dedupe=True)

    @field_validator("title", mode="after", check_fields=False)
    @classmethod
    def strip_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Title cannot be empty")
        return value


def check_dates(start: str | None, end: str | None, is_current: bool | None) -> None:
    if is_current and end:
        raise ValueError("An ongoing item cannot have an end date")
    if start and end and end < start:
        raise ValueError("End date must be on or after the start date")


class ItemCreate(ItemValidation, ItemBase):
    @model_validator(mode="after")
    def check_date_order(self) -> "ItemCreate":
        check_dates(self.start_date, self.end_date, self.is_current)
        return self


class ItemUpdate(ItemValidation):
    """Partial update: only the fields you send are changed."""

    kind: ItemKind | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    organization: str | None = Field(default=None, max_length=200)
    role: str | None = Field(default=None, max_length=200)
    location: str | None = Field(default=None, max_length=120)
    start_date: str | None = None
    end_date: str | None = None
    is_current: bool | None = None
    link: str | None = Field(default=None, max_length=300)
    description: str | None = Field(default=None, max_length=1000)
    bullets: list[str] | None = None
    tags: list[str] | None = None
    tech: list[str] | None = None
    sort_order: int | None = None


class ItemRead(ItemBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------- Skills


class SkillCategory(StrEnum):
    language = "language"  # Python, Java, TypeScript
    framework = "framework"  # FastAPI, React, PyTorch
    ml_ai = "ml_ai"  # NLP, computer vision, RAG, LLMs
    data = "data"  # pandas, SQL analytics, Spark
    database = "database"  # PostgreSQL, MongoDB, vector DBs
    cloud_devops = "cloud_devops"  # Docker, AWS, CI/CD, MLOps
    tool = "tool"  # Git, Postman, Jupyter
    design = "design"  # Figma, UI/UX research
    soft = "soft"  # leadership, communication
    other = "other"


class SkillLevel(StrEnum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    expert = "expert"


class SkillBase(SQLModel):
    name: str = Field(min_length=1, max_length=80)
    category: SkillCategory = SkillCategory.other
    level: SkillLevel = SkillLevel.intermediate
    notes: str = Field(default="", max_length=300)


class Skill(SkillBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # Lower-cased copy of the name so "python" and "Python" count as the same skill.
    name_key: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=utcnow)


class SkillCreate(SkillBase):
    @field_validator("name", mode="after")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Skill name cannot be empty")
        return value


class SkillUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    category: SkillCategory | None = None
    level: SkillLevel | None = None
    notes: str | None = Field(default=None, max_length=300)

    @field_validator("name", mode="after")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Skill name cannot be empty")
        return value


class SkillRead(SkillBase):
    id: int
    created_at: datetime


# ---------------------------------------------------------------- Backup


class ProfileBundle(SQLModel):
    """Everything in one JSON document, used by export and import."""

    version: int = 1
    profile: ProfileUpdate = Field(default_factory=ProfileUpdate)
    items: list[ItemCreate] = Field(default_factory=list)
    skills: list[SkillCreate] = Field(default_factory=list)
