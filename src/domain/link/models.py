from datetime import datetime

from dataclasses import dataclass
from typing import Optional

@dataclass(slots=True)
class LinkDTO:
    id: int
    url: str
    short_url: str
    total: int

@dataclass(slots=True)
class CreateLinkDTO:
    url: Optional[str]
    short_url: Optional[str]

@dataclass(slots=True)
class UpdateLinkDTO(CreateLinkDTO):
    ...

@dataclass(slots=True)
class ListLinksDTO:
    url: str
    short_url: str


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