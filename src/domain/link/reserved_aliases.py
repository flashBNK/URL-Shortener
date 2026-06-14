RESERVED_ALIASES = (
    "api",
    "assets",
    "dashboard",
    "public",
    "check",
    "account",
    "login",
    "register",
    "links",
    "404",
    "favicon.ico",
)


def is_reserved_alias(value: str) -> bool:
    return value.strip().casefold() in RESERVED_ALIASES
