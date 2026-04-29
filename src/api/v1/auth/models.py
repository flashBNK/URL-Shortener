from pydantic import BaseModel
from datetime import datetime


class LoginUserSchema(BaseModel):
    username: str
    password: str


class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str

    refresh_token_expires_in: datetime
    access_token_expires_in: datetime


class RefreshTokenSchema(BaseModel):
    refresh_token: str