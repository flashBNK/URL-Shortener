class LinkNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__( "Link is not found.")

class LinkIsExist(Exception):
    def __init__(self, field: str, value: str):
        super().__init__(f'Link with {field} "{value}" already exists.')


class LinkAlreadyExist(Exception):
    def __init__(self) -> None:
        super().__init__( "Link already exists.")


class InvalidUrlError(Exception):
    def __init__(self) -> None:
        super().__init__( "Invalid url.")


class UnsafeUrlError(Exception):
    def __init__(self) -> None:
        super().__init__( "Unsafe url.")


class GetGeoError(Exception):
    def __init__(self) -> None:
        super().__init__( "Get geographic data failed.")


class LinkIsExpires(Exception):
    def __init__(self) -> None:
        super().__init__( "The link has expired. Please register or log in to create links without time limits.")


class LinkIsNotActive(Exception):
    def __init__(self) -> None:
        super().__init__( "The link not active.")