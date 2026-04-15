from fastapi import APIRouter, status, Depends, HTTPException
from fastapi.responses import JSONResponse

from api.v1.link.models import LinkSchema, CreateLinkSchema
from domain.link.exceptions import LinkNotFoundError, LinkIsExist
from domain.link.models import CreateLinkDTO
from usecases.link.find_by_short_url.abstract import AbstractFindByShortUrlLinkUseCase
from usecases.link.create.abstract import AbstractCreateLinkUseCase
from .dependencies import find_by_short_url_link_use_case, create_link_use_case

router = APIRouter(prefix="/link")


@router.get("/{short_url}", response_model=LinkSchema)
async def find_link(short_url: str,
        usecase: AbstractFindByShortUrlLinkUseCase = Depends(find_by_short_url_link_use_case)
) -> JSONResponse:
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


@router.post("/", response_model=LinkSchema)
async def create_link(
        payload: CreateLinkSchema,
        usecase: AbstractCreateLinkUseCase = Depends(create_link_use_case)
) -> JSONResponse:
    dto = CreateLinkDTO(
        short_url=None,
        url=payload.url,
    )

    try:
        link = await usecase.execute(dto)
    except LinkIsExist as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    schema = LinkSchema(
        id=link.id,
        short_url=link.short_url,
        url=link.url,
    )

    return JSONResponse(schema.model_dump(mode="json"), status_code=status.HTTP_201_CREATED)