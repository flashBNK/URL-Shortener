import datetime

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime, ForeignKey

from ..base import Base


class LinkClick(Base):
    __tablename__ = 'link_click'

    id: Mapped[int] = mapped_column(primary_key=True)
    ip: Mapped[str] = mapped_column(String(45)) # IPv4/IPv6
    country: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    clicked_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.UTC))

    link_id: Mapped[int] = mapped_column(ForeignKey('link.id'))