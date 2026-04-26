from pydantic import BaseModel


class LinkSchema(BaseModel):
    id: int
    url: str
    short_url: str
    total: int

class CreateLinkSchema(BaseModel):
    url: str

class UpdateLinkSchema(CreateLinkSchema):
    ...

class ListLinksSchema(BaseModel):
    url: str
    short_url: str


class GroupByCountryLinkSchema(BaseModel):
    link_id: int
    total: int
    by_country: dict