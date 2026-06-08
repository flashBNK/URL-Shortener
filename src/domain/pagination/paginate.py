from dataclasses import dataclass


@dataclass(slots=True)
class PaginationDTO:
    limit: int
    offset: int