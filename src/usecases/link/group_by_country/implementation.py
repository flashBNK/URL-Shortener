from domain.link.models import GroupByCountryLinkDTO

from .abstract import AbstractGroupByCountryLinkUseCase


class PostgreSQLGroupByCountryLinkUseCase(AbstractGroupByCountryLinkUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, short_url: str) -> GroupByCountryLinkDTO:

        async with self._uow as uow:
            link = await uow.repository.find_by_short_url(short_url)
            clink_link = await uow.click_repository.get_by_link_id(link.id)

        by_country = dict()
        for click_link in clink_link:
            key = click_link.country or "other"
            by_country[key] = by_country.get(key, 0) + 1

        stats_link = GroupByCountryLinkDTO(
            link_id=link.id,
            total=link.total,
            by_country=by_country
        )

        return stats_link