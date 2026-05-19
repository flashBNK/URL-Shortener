from user_agents import parse
from domain.link.models import GroupByCountryLinkDTO

from .abstract import AbstractGroupByCountryLinkUseCase


class PostgreSQLGroupByCountryLinkUseCase(AbstractGroupByCountryLinkUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, short_url: str, user_id: int) -> GroupByCountryLinkDTO:

        async with self._uow as uow:
            link = await uow.repository.find_by_short_url_and_check(short_url, user_id)
            click_links = await uow.click_repository.get_by_link_id(link.id)

        by_country = dict()
        clicks_by_date = dict()
        clicks_by_device = dict()
        for click_link in click_links:
            country = click_link.country or "other"
            by_country[country] = by_country.get(country, 0) + 1

            date = str(click_link.clicked_at)[:10]
            clicks_by_date[date] = clicks_by_date.get(date, 0) + 1

            ua_string = (click_link.user_agent or "").lower()
            ua = parse(ua_string)
            if ua.is_mobile or ua.is_tablet:
                device = "Mobile"
            elif ua.is_bot:
                device = "Bot"
            else:
                device = "Desktop"
            clicks_by_device[device] = clicks_by_device.get(device, 0) + 1


        stats_link = GroupByCountryLinkDTO(
            link_id=link.id,
            total=link.total,
            by_country=by_country,
            clicks_by_device=clicks_by_device,
            clicks_by_date=clicks_by_date,
        )

        return stats_link