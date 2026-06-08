from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(slots=True)
class CreateUserDTO:
    username: str
    email: str
    password: str


@dataclass(slots=True)
class UserDTO:
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime


@dataclass(slots=True)
class UserUpdateDTO:
    username: Optional[str] = None
    email: Optional[str] = None


@dataclass(slots=True)
class ChangePasswordDTO:
    current_password: str
    new_password: str


@dataclass(slots=True)
class PasswordDTO:
    current_password: str