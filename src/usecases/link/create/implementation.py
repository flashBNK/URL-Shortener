from domain.link.exceptions import InvalidUrlError, LinkAlreadyExist, LinkIsExist, UnsafeUrlError
from domain.link.models import CreateLinkDTO, LinkDTO
from logger import get_logger
from services.safe_browsing import SafeBrowsingService
from services.url import UrlService
from utils.short_code import generate_short_code

from .abstract import AbstractCreateLinkUseCase

log = get_logger("usecases.link")


class PostgreSQLCreateLinkUseCase(AbstractCreateLinkUseCase):
    def __init__(self, uow, url_service: UrlService, safe_browsing_service: SafeBrowsingService):
        self._uow = uow
        self._url_service = url_service
        self._safe_browsing_service = safe_browsing_service

    async def execute(self, dto: CreateLinkDTO) -> LinkDTO:
        log.info("creating link", url=dto.url, user_id=dto.user_id)
        dto.url = self._url_service.normalize_url(dto.url)

        if not self._url_service.is_valid_url(url=dto.url):
            raise InvalidUrlError

        if not await self._url_service.check_url_active(url=dto.url):
            raise InvalidUrlError

        if not await self._safe_browsing_service.is_url_safe(url=dto.url):
            raise UnsafeUrlError


        if dto.custom_alias:
            dto.short_url = dto.custom_alias
            async with self._uow as uow:
                link = await uow.repository.create(dto)
                log.info("custom link created", short_url=link.short_url, user_id=dto.user_id)
                return link



        for _ in range(10):
            dto.short_url = generate_short_code()
            try:
                async with self._uow as uow:
                    link = await uow.repository.create(dto)
                    log.info("link created", short_url=link.short_url, user_id=dto.user_id)
                    return link

            except LinkIsExist:
                continue

        log.error("link creation failed", url=dto.url)
        raise LinkAlreadyExist