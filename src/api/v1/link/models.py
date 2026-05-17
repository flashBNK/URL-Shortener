from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


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
    custom_alias: Optional[str]

    @field_validator("custom_alias")
    @classmethod
    def validate_custom_alias(cls, value: str | None) -> str | None:
        value = value.strip()
        if value is None:
            return value
        if not 4 <= len(value) <= 12:
            raise ValueError("short url must be between 4 and 12 characters")
        return value

class UpdateLinkSchema(BaseModel):
    short_url: Optional[str]
    is_active: Optional[bool]
    expires_at: Optional[datetime]

    @field_validator("short_url")
    @classmethod
    def validate_short_url(cls, value: str | None) -> str | None:
        value = value.strip()
        if value is None:
            return value
        if not 4 <= len(value) <= 12:
            raise ValueError("short url must be between 4 and 12 characters")
        return value


class LinkShortSchema(BaseModel):
    url: str
    short_url: str
    total: int
    is_active: bool
    expires_at: datetime | None

class ListLinksSchema(BaseModel):
    items: list[LinkShortSchema]
    total: int
    limit: int
    offset: int

class GroupByCountryLinkSchema(BaseModel):
    link_id: int
    total: int
    by_country: dict