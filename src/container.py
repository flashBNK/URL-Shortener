from dependency_injector.containers import DeclarativeContainer
from dependency_injector.providers import Singleton, Factory

from infrastructure.databases.postgresql.session_manager import DatabaseSessionManager

from infrastructure.repositories.postgresql.link.uow import PostgreSQLLinkUnitOfWork


class Container(DeclarativeContainer):
    session_manager = Singleton(DatabaseSessionManager)


    link_uow_factory = Factory(PostgreSQLLinkUnitOfWork)