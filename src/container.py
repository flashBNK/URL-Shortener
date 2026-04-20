from dependency_injector.containers import DeclarativeContainer
from dependency_injector.providers import Singleton, Factory

from infrastructure.databases.postgresql.session_manager import DatabaseSessionManager
from infrastructure.repositories.postgresql.link.uow import PostgreSQLLinkUnitOfWork
from services.url import UrlService

class Container(DeclarativeContainer):
    session_manager = Singleton(DatabaseSessionManager)
    url_service = Singleton(UrlService)

    link_uow_factory = Factory(PostgreSQLLinkUnitOfWork)