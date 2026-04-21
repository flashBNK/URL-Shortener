from dependency_injector.containers import DeclarativeContainer
from dependency_injector.providers import Singleton, Factory

from infrastructure.databases.postgresql.session_manager import DatabaseSessionManager
from infrastructure.repositories.postgresql.link.uow import PostgreSQLLinkUnitOfWork
from services.url import UrlService
from services.safe_browsing import SafeBrowsingService
from settings import settings

class Container(DeclarativeContainer):
    session_manager = Singleton(DatabaseSessionManager)
    url_service = Singleton(UrlService)
    safe_browsing_service = Singleton(SafeBrowsingService, api_key=settings.app.safe_browsing_api_key.get_secret_value())

    link_uow_factory = Factory(PostgreSQLLinkUnitOfWork)