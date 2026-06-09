from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(slots=True)
class LinkDTO:
    id: int
    url: str
    short_url: str
    total: int
    is_active: bool
    expires_at: datetime | None
    user_id: int | None

@dataclass(slots=True)
class CreateLinkDTO:
    url: Optional[str]
    short_url: Optional[str]
    user_id: Optional[int]
    custom_alias: Optional[str]


@dataclass(slots=True)
class UpdateLinkDTO:
    short_url: Optional[str]
    is_active: Optional[bool]
    expires_at: Optional[datetime]
    expires_at_set: bool = False


@dataclass(slots=True)
class LinkClickDTO:
    id: int
    link_id: int
    ip: str
    country: str
    user_agent: str
    clicked_at: datetime

@dataclass(slots=True)
class CreateLinkClickDTO:
    link_id: int
    ip: str
    country: str
    user_agent: str


@dataclass(slots=True)
class GroupByCountryLinkDTO:
    link_id: int
    total: int
    by_country: dict
    clicks_by_device: dict
    clicks_by_date: dict
