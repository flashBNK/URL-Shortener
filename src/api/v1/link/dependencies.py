from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from dependency_injector.wiring import inject, Provide

from infrastructure.databases.postgresql.session import get_async_session
from infrastructure.di.injection import build_link_unit_of_work
from infrastructure.repositories.postgresql.link.uow import PostgreSQLLinkUnitOfWork
from services.geo import GeoService

from usecases.link.find_by_short_url.implementation import PostgreSQLFindByShortUrlLinkUseCase
from usecases.link.redirect.implementation import PostgreSQLRedirectLinkUseCase
from usecases.link.create.implementation import PostgreSQLCreateLinkUseCase

from services.url import UrlService
from container import Container

def get_link_unit_of_work(
    session: AsyncSession = Depends(get_async_session)
) -> PostgreSQLLinkUnitOfWork:
    return build_link_unit_of_work(session)


def find_by_short_url_link_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLFindByShortUrlLinkUseCase(uow=uow)


@inject
def create_link_use_case(
    session: AsyncSession = Depends(get_async_session),
    url_service: UrlService = Depends(Provide[Container.url_service]),
    safe_browsing_service = Provide[Container.safe_browsing_service],
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLCreateLinkUseCase(uow=uow, url_service=url_service, safe_browsing_service=safe_browsing_service)


@inject
def redirect_link_use_case(
    session: AsyncSession = Depends(get_async_session),
    geo_service: GeoService = Depends(Provide[Container.geo_service]),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLRedirectLinkUseCase(uow=uow, geo_service=geo_service)