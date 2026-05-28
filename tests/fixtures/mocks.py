class MockSafeBrowsingService:
    async def check_url(self, url: str) -> bool:
        return True


class MockSafeBrowsingServiceDanger:
    async def check_url(self, url: str) -> bool:
        return False


class MockGeoService:
    async def get_country_by_ip(self, ip: str) -> str:
        return "Russia"