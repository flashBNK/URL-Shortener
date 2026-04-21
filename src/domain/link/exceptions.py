class LinkNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__( f"Link is not found.")

class LinkIsExist(Exception):
    def __init__(self, field: str, value: str):
        super().__init__(f'Link with {field} "{value}" already exists.')


class LinkAlreadyExist(Exception):
    def __init__(self) -> None:
        super().__init__( f"Link already exists.")


class InvalidUrlError(Exception):
    def __init__(self) -> None:
        super().__init__( f"Invalid url.")


class UnsafeUrlError(Exception):
    def __init__(self) -> None:
        super().__init__( f"Unsafe url.")