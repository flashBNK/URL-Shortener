from pydantic import BaseModel, Field, AfterValidator
from typing import Annotated


def ensure_get_zero(num: int) -> int:
    if num < 0:
        return 0
    return num

class Pagination(BaseModel):
    limit: Annotated[int, AfterValidator(ensure_get_zero)] = Field(10, le=100)
    offset: Annotated[int, AfterValidator(ensure_get_zero)] = Field(0)