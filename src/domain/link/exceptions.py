class LinkNotFoundError(Exception):

    def __init__(self) -> None:
        super().__init__( f"Link is not found.")