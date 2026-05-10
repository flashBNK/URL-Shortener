import yaml

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr
import yaml
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class _AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR.parent / "config" / ".env",
        env_prefix="APP_",          # читает APP_SECRET_KEY, APP_SAFE_BROWSING_API_KEY
        extra="ignore",
    )

    name: str = "URL-Shortener"
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    secret_key: SecretStr           # берётся из APP_SECRET_KEY в .env
    safe_browsing_api_key: SecretStr  # берётся из APP_SAFE_BROWSING_API_KEY в .env


class _DatabaseSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR.parent / "config" / ".env",
        env_prefix="DB_",
        extra="ignore",
    )

    user: str
    password: SecretStr
    host: str = "localhost"
    port: int = 5432
    name: str = "db"

    def get_database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.user}:"
            f"{self.password.get_secret_value()}"
            f"@{self.host}:{self.port}/{self.name}"
        )


class _Settings(BaseSettings):
    app: _AppSettings
    database: _DatabaseSettings

    @classmethod
    def load(cls) -> "_Settings":
        path = BASE_DIR.parent / "config" / "config.yaml"
        if not path.exists():
            raise FileNotFoundError(f"Could not find config.yaml in {path}")

        with open(path) as file:
            data = yaml.safe_load(file)

        # Секреты settings подтянет из .env сам через model_config
        return cls(
            app=_AppSettings(**data.get("app", {})),
            database=_DatabaseSettings(**data.get("database", {})),
        )


settings = _Settings.load()