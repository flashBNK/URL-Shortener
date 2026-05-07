from datetime import datetime

from pydantic import BaseModel


class LinkSchema(BaseModel):
    id: int
    url: str
    short_url: str
    total: int
    is_active: bool
    expires_at: datetime | None
    user_id: int | None

class CreateLinkSchema(BaseModel):
    url: str

class UpdateLinkSchema(CreateLinkSchema):
    ...

class ListLinksSchema(BaseModel):
    url: str
    short_url: str
    total: int
    is_active: bool


class GroupByCountryLinkSchema(BaseModel):
    link_id: int
    total: int
    by_country: dict