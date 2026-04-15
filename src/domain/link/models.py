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