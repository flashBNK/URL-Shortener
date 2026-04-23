from domain.link.models import LinkDTO, CreateLinkClickDTO

from .abstract import AbstractRedirectLinkUseCase

from services.geo import GeoService


class PostgreSQLRedirectLinkUseCase(AbstractRedirectLinkUseCase):
    def __init__(self, uow, geo_service: GeoService):
        self._uow = uow
        self._geo_service = geo_service

    async def execute(self, short_url: str, user_agent: str, ip: str) -> LinkDTO:
        country = await self._geo_service.get_country(ip=ip)

        async with self._uow as uow:
            link = await uow.repository.redirect(short_url)
            await uow.click_repository.create(CreateLinkClickDTO(
                country=country,
                user_agent=user_agent,
                ip=ip,
                link_id=link.id,
            ))

        return link