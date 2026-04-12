from fastapi import APIRouter, status, Depends
from fastapi.responses import JSONResponse

from api.v1.link.models import LinkSchema, CreateLinkSchema, UpdateLinkSchema, ListLinksSchema
from usecases.link.get.abstract import AbstractGetLinkUseCase
from .dependencies import get_link_use_case


router = APIRouter(prefix="/link", tags=["Link"])


@router.get("/{short_url}", response_model=LinkSchema)
async def get_link(short_url: str,
        usecase: AbstractGetLinkUseCase = Depends(get_link_use_case)
    ) -> JSONResponse:

    link = await usecase.execute(short_url)

    if not link:
        return JSONResponse({}, status_code=status.HTTP_404_NOT_FOUND)

    schema = LinkSchema(
        id=link.id,
        short_url=link.short_url,
        url=link.url,
    )
    return JSONResponse(schema.model_dump(mode="json"), status_code=status.HTTP_200_OK)