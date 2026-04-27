from pydantic import BaseModel, EmailStr, model_validator
from datetime import datetime
from typing import Optional

from .crypto import context


class CreateUserSchema(BaseModel):
    username: str
    email: EmailStr
    password: str

    def set_password(self):
        self.password = context.hash(self.password)

    @model_validator(mode="after")
    def check_password(self) -> "CreateUserSchema":
        self.set_password()
        return self


class UserSchema(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    created_at: datetime


class UpdateUserSchema(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None