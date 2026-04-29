from datetime import datetime
from dataclasses import dataclass


@dataclass(slots=True)
class LoginUserDTO:
    username: str
    password: str


@dataclass(slots=True)
class TokenDTO:
    access_token: str
    refresh_token: str

    refresh_token_expires_in: datetime
    access_token_expires_in: datetime


@dataclass(slots=True)
class RefreshTokenDTO:
    refresh_token: str


@dataclass(slots=True)
class CreateTokenDTO(TokenDTO):
    pass


@dataclass(slots=True)
class UpdateTokenDTO(CreateTokenDTO):
    pass