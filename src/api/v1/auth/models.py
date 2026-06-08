from datetime import datetime

from pydantic import BaseModel, field_validator


class LoginUserSchema(BaseModel):
    username: str
    password: str

    @field_validator('password', "username")
    @classmethod
    def not_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty")
        return value


class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str

    refresh_token_expires_in: datetime
    access_token_expires_in: datetime


class RefreshTokenSchema(BaseModel):
    refresh_token: str