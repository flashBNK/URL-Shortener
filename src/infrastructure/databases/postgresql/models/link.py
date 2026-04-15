from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer

from ..base import Base

class Link(Base):
    __tablename__ = 'link'

    id: Mapped[int] = mapped_column(primary_key=True)
    short_url: Mapped[str] = mapped_column(String(32), unique=True)
    url: Mapped[str] = mapped_column(String(511))
    total: Mapped[int] = mapped_column(Integer, default=0)