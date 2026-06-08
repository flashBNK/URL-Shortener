from domain.link.exceptions import LinkIsNotActive
from domain.link.models import CreateLinkClickDTO, LinkDTO
from infrastructure.redis.link_cache import LinkCache
from middlewares.log_middleware import log
from services.geo import GeoService

from .abstract import AbstractRedirectLinkUseCase


class PostgreSQLRedirectLinkUseCase(AbstractRedirectLinkUseCase):
    def __init__(self, uow, cache: LinkCache, geo_service: GeoService):
        self._uow = uow
        self._cache = cache
        self._geo_service = geo_service

    async def execute(self, short_url: str, user_agent: str, ip: str) -> LinkDTO:
        country = await self._geo_service.get_country(ip=ip)

        cached_link = await self._cache.get(short_url)


        if cached_link:
            log.debug("redirect cache hit", short_url=short_url)

            async with self._uow as uow:
                await uow.repository.increment_total(short_url)  # ← новый метод
                await uow.click_repository.create(CreateLinkClickDTO(
                    link_id=cached_link["id"],
                    ip=ip,
                    user_agent=user_agent,
                    country=await self._geo_service.get_country(ip),
                ))

            link = LinkDTO(
                id=cached_link["id"],
                short_url=short_url,
                url=cached_link["url"],
                user_id=cached_link["user_id"],
                is_active=cached_link["is_active"],
                total=cached_link["total"],
                expires_at=cached_link["expires_at"],
            )
            return link

        async with self._uow as uow:
            link = await uow.repository.redirect(short_url)
            if not link.is_active:
                raise LinkIsNotActive
            await uow.click_repository.create(CreateLinkClickDTO(
                country=country,
                user_agent=user_agent,
                ip=ip,
                link_id=link.id,
            ))

            await self._cache.set(short_url, link)

        return link