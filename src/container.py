from dependency_injector.containers import DeclarativeContainer
from dependency_injector.providers import Singleton, Factory

from infrastructure.databases.postgresql.session_manager import DatabaseSessionManager
from infrastructure.repositories.postgresql.link.uow import PostgreSQLLinkUnitOfWork
from infrastructure.repositories.postgresql.token.uow import PostgreSQLTokenUnitOfWork
from infrastructure.repositories.postgresql.user.uow import PostgreSQLUserUnitOfWork
from services.geo import GeoService
from services.url import UrlService
from services.safe_browsing import SafeBrowsingService
from settings import settings

class Container(DeclarativeContainer):
    session_manager = Singleton(DatabaseSessionManager)
    url_service = Singleton(UrlService)
    geo_service = Singleton(GeoService)
    safe_browsing_service = Singleton(SafeBrowsingService, api_key=settings.app.safe_browsing_api_key.get_secret_value())

    link_uow_factory = Factory(PostgreSQLLinkUnitOfWork)

    user_uow_factory = Factory(PostgreSQLUserUnitOfWork)

    token_uow_factory = Factory(PostgreSQLTokenUnitOfWork)