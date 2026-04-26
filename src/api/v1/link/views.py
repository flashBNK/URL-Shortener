from fastapi import APIRouter, status, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import ResponseValidationError

from api.v1.link.models import LinkSchema, CreateLinkSchema, GroupByCountryLinkSchema
from domain.link.exceptions import LinkNotFoundError, LinkIsExist, InvalidUrlError, UnsafeUrlError
from domain.link.models import CreateLinkDTO
from usecases.link.find_by_short_url.abstract import AbstractFindByShortUrlLinkUseCase
from usecases.link.redirect.abstract import AbstractRedirectLinkUseCase
from usecases.link.create.abstract import AbstractCreateLinkUseCase
from usecases.link.group_by_country.abstract import AbstractGroupByCountryLinkUseCase
from .dependencies import find_by_short_url_link_use_case, create_link_use_case, redirect_link_use_case, stats_link_use_case

router = APIRouter(prefix="/link")
short_router = APIRouter()


@short_router.get("/{short_url}", response_model=LinkSchema)
async def redirect_link(short_url: str,
        request: Request,
        usecase: AbstractRedirectLinkUseCase = Depends(redirect_link_use_case),
) -> RedirectResponse | HTTPException:
    ip = request.headers.get("X-Forwarded-For")
    if ip:
        ip = ip.split(",")[0].strip()
    else:
        ip = request.client.host  # fallback для локальной разработки

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


@router.get("/{short_url}/stats", response_model=LinkSchema)
async def stats_link(
        short_url: str,
        usecase: AbstractGroupByCountryLinkUseCase = Depends(stats_link_use_case),
):
    try:
        stats_link_dto = await usecase.execute(short_url)
    except LinkNotFoundError:
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    schema = GroupByCountryLinkSchema(
        link_id=stats_link_dto.link_id,
        total=stats_link_dto.total,
        by_country=stats_link_dto.by_country,
    )

    return JSONResponse(schema.model_dump(mode="json"), status_code=status.HTTP_200_OK)