from domain.link.models import CreateLinkDTO, LinkDTO
from domain.link.exceptions import LinkIsExist, LinkAlreadyExist, InvalidUrlError, UnsafeUrlError
from utils.short_code import generate_short_code
from services.url import UrlService
from services.safe_browsing import SafeBrowsingService

from .abstract import AbstractCreateLinkUseCase


class PostgreSQLCreateLinkUseCase(AbstractCreateLinkUseCase):
    def __init__(self, uow, url_service: UrlService, safe_browsing_service: SafeBrowsingService):
        self._uow = uow
        self._url_service = url_service
        self._safe_browsing_service = safe_browsing_service

    async def execute(self, dto: CreateLinkDTO) -> LinkDTO:
        dto.url = self._url_service.normalize_url(dto.url)

        if not self._url_service.is_valid_url(url=dto.url):
            print("-"*100)
            raise InvalidUrlError

        if not await self._url_service.check_url_active(url=dto.url):
            raise InvalidUrlError

        if not await self._safe_browsing_service.is_url_safe(url=dto.url):
            raise UnsafeUrlError


        for _ in range(10):
            dto.short_url = generate_short_code()
            try:
                async with self._uow as uow:
                    return await uow.repository.create(dto)
            except LinkIsExist:
                continue

        raise LinkAlreadyExist