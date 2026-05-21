import re

from pydantic import BaseModel, EmailStr, model_validator, field_validator
from datetime import datetime
from typing import Optional

from domain.user.crypto import context


class CreateUserSchema(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip()
        if not 3 < len(value) < 32:
            raise ValueError("Username must be between 3 and 32 characters")
        if not re.match(r"^[a-zA-Z0-9_а-яА-ЯёЁ]+$", value):
            raise ValueError("Username can only contain letters, digits and underscores")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one digit")
        return value


class UserSchema(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    created_at: datetime


class UpdateUserSchema(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not 3 < len(value) < 32:
            raise ValueError("Username must be between 3 and 32 characters")
        if not re.match(r"^[a-zA-Z0-9_]+$", value):
            raise ValueError("Username can only contain letters, digits and underscores")
        return value


class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one digit")
        return value


class PasswordSchema(BaseModel):
    current_password: str