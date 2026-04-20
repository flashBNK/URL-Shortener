from fastapi import APIRouter, status, Depends, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import ResponseValidationError

from api.v1.link.models import LinkSchema, CreateLinkSchema
from domain.link.exceptions import LinkNotFoundError, LinkIsExist, InvalidUrlError
from domain.link.models import CreateLinkDTO
from usecases.link.find_by_short_url.abstract import AbstractFindByShortUrlLinkUseCase
from usecases.link.redirect.abstract import AbstractRedirectLinkUseCase
from usecases.link.create.abstract import AbstractCreateLinkUseCase
from .dependencies import find_by_short_url_link_use_case, create_link_use_case, redirect_link_use_case

router = APIRouter(prefix="/link")
short_router = APIRouter()


# @short_router.get("/")
# async def none():
#     return JSONResponse({}, status_code=status.HTTP_404_NOT_FOUND)
#

@short_router.get("/{short_url}", response_model=LinkSchema)
async def redirect_link(short_url: str,
        usecase: AbstractRedirectLinkUseCase = Depends(redirect_link_use_case)
) -> RedirectResponse | HTTPException:
    try:
        link = await usecase.execute(short_url)
    except LinkNotFoundError:
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    schema = LinkSchema(
        id=link.id,
        short_url=link.short_url,
        url=link.url,
        total=link.total,
    )

    return RedirectResponse(url=schema.url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get("/{short_url}", response_model=LinkSchema)
async def find_link(short_url: str,
        usecase: AbstractFindByShortUrlLinkUseCase = Depends(find_by_short_url_link_use_case)
):
    try:
        link = await usecase.execute(short_url)
    except LinkNotFoundError:
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    schema = LinkSchema(
        id=link.id,
        short_url=link.short_url,
        url=link.url,
        total=link.total,
    )
    return JSONResponse(schema.model_dump(mode='json'), status_code=status.HTTP_200_OK)


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
    except (LinkIsExist, InvalidUrlError) as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    schema = LinkSchema(
        id=link.id,
        short_url=link.short_url,
        url=link.url,
        total=link.total
    )

    return JSONResponse(schema.model_dump(mode="json"), status_code=status.HTTP_201_CREATED)