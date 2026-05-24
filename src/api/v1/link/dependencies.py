from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from dependency_injector.wiring import inject, Provide

from infrastructure.databases.postgresql.session import get_async_session
from infrastructure.di.injection import build_link_unit_of_work
from infrastructure.redis.link_cache import LinkCache
from infrastructure.repositories.postgresql.link.uow import PostgreSQLLinkUnitOfWork
from services.geo import GeoService

from usecases.link.find_by_short_url.implementation import PostgreSQLFindByShortUrlLinkUseCase
from usecases.link.get_list_clicks.implementation import PostgreSQLGetLinkClicksUseCase
from usecases.link.list_public_links.implementation import PostgreSQLListPublicLinksUseCase
from usecases.link.redirect.implementation import PostgreSQLRedirectLinkUseCase
from usecases.link.create.implementation import PostgreSQLCreateLinkUseCase
from usecases.link.group_by_country.implementation import PostgreSQLGroupByCountryLinkUseCase
from usecases.link.get_links_me.implementation import PostgreSQLGetMeLinksUseCase
from usecases.link.delete.implementation import PostgreSQLDeleteLinkUseCase
from usecases.link.update.implementation import PostgreSQLUpdateLinkUseCase

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
    cache: LinkCache = Depends(Provide[Container.link_cache]),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLRedirectLinkUseCase(uow=uow, geo_service=geo_service, cache=cache)


def stats_link_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLGroupByCountryLinkUseCase(uow=uow)


def get_me_links_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLGetMeLinksUseCase(uow=uow)


def delete_link_use_case(
    session: AsyncSession = Depends(get_async_session),
    cache: LinkCache = Depends(Provide[Container.link_cache]),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLDeleteLinkUseCase(uow=uow, cache=cache)


def update_link_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLUpdateLinkUseCase(uow=uow)


def get_link_clicks_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLGetLinkClicksUseCase(uow=uow)


def list_public_links_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLListPublicLinksUseCase(uow=uow)