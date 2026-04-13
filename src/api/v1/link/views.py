from fastapi import APIRouter, status, Depends
from fastapi.responses import JSONResponse

from api.v1.link.models import LinkSchema, CreateLinkSchema, UpdateLinkSchema, ListLinksSchema
from domain.link.exceptions import LinkNotFoundError
from usecases.link.find_by_short_url.abstract import AbstractFindByShortUrlLinkUseCase
from .dependencies import find_by_short_url_link_use_case

router = APIRouter(prefix="/link")


@router.get("/{short_url}", response_model=LinkSchema)
async def find_link(short_url: str,
        usecase: AbstractFindByShortUrlLinkUseCase = Depends(find_by_short_url_link_use_case)
    ) -> JSONResponse:
    print(short_url)
    try:
        link = await usecase.execute(short_url)
    except LinkNotFoundError:
        return JSONResponse({"error": "Link not found"}, status_code=status.HTTP_404_NOT_FOUND)

    schema = LinkSchema(
        id=link.id,
        short_url=link.short_url,
        url=link.url,
    )
    return JSONResponse(schema.model_dump(mode="json"), status_code=status.HTTP_200_OK)