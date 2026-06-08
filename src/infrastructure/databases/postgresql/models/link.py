from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .link_click import LinkClick
    from .user import User

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base


class Link(Base):
    __tablename__ = 'link'

    id: Mapped[int] = mapped_column(primary_key=True)
    short_url: Mapped[str] = mapped_column(String(32), unique=True)
    url: Mapped[str] = mapped_column(String(511))
    total: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user_id: Mapped[int | None] = mapped_column(ForeignKey("user.id"), nullable=True)
    user: Mapped[Optional["User"]] = relationship(back_populates="links")

    clicks: Mapped[list["LinkClick"]] = relationship(back_populates="link", cascade="all, delete-orphan")