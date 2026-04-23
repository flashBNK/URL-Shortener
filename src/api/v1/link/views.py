from fastapi import APIRouter, status, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import ResponseValidationError

from api.v1.link.models import LinkSchema, CreateLinkSchema
from domain.link.exceptions import LinkNotFoundError, LinkIsExist, InvalidUrlError, UnsafeUrlError
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
        request: Request,
        usecase: AbstractRedirectLinkUseCase = Depends(redirect_link_use_case),
) -> RedirectResponse | HTTPException:
    ip = request.client.host
    user_agent = request.headers.get("User-Agent")
    try:
        link = await usecase.execute(short_url, ip=ip, user_agent=user_agent)
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
    except LinkIsExist as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except (InvalidUrlError, UnsafeUrlError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc))


    schema = LinkSchema(
        id=link.id,
        short_url=link.short_url,
        url=link.url,
        total=link.total
    )

    return JSONResponse(schema.model_dump(mode="json"), status_code=status.HTTP_201_CREATED)