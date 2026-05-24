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
    custom_alias: Optional[str] = None

    @field_validator("custom_alias")
    @classmethod
    def validate_custom_alias(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not 4 <= len(value) <= 12:
            raise ValueError("short url must be between 4 and 12 characters")
        return value

class UpdateLinkSchema(BaseModel):
    short_url: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None

    @field_validator("short_url")
    @classmethod
    def validate_short_url(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
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


class LinkClickSchema(BaseModel):
    ip: str
    country: str | None
    user_agent: str | None
    clicked_at: datetime

class ListLinkClicksSchema(BaseModel):
    items: list[LinkClickSchema]
    total: int
    limit: int
    offset: int

class GroupByCountryLinkSchema(BaseModel):
    link_id: int
    total: int
    by_country: dict
    clicks_by_device: dict
    clicks_by_date: dict