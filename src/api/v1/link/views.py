from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, RedirectResponse, Response

from api.pydantic.paginate import Pagination
from api.v1.link.models import (
    CreateLinkSchema,
    GroupByCountryLinkSchema,
    LinkClickSchema,
    LinkSchema,
    LinkShortSchema,
    ListLinkClicksSchema,
    ListLinksSchema,
    UpdateLinkSchema,
)
from api.v1.user.dependencies import get_current_user_optional
from domain.link.exceptions import (
    InvalidUrlError,
    LinkAlreadyExist,
    LinkIsExist,
    LinkIsExpires,
    LinkIsNotActive,
    LinkNotFoundError,
    UnsafeUrlError,
)
from domain.link.models import CreateLinkDTO, LinkDTO, UpdateLinkDTO
from domain.pagination.paginate import PaginationDTO
from domain.token.exceptions import TokenNotFoundError
from domain.user.exceptions import AccessDenied, UserNotFound
from domain.user.models import UserDTO
from limiter import get_anon_key, get_auth_key, limiter
from settings import settings
from usecases.link.create.abstract import AbstractCreateLinkUseCase
from usecases.link.delete.abstract import AbstractDeleteLinkUseCase
from usecases.link.find_by_short_url.abstract import AbstractFindByShortUrlLinkUseCase
from usecases.link.get_links_me.abstract import AbstractGetMeLinksUseCase
from usecases.link.get_list_clicks.abstract import AbstractGetLinkClicksUseCase
from usecases.link.group_by_country.abstract import AbstractGroupByCountryLinkUseCase
from usecases.link.list_public_links.abstract import AbstractListPublicLinksUseCase
from usecases.link.redirect.abstract import AbstractRedirectLinkUseCase
from usecases.link.update.implementation import AbstractUpdateLinkUseCase
from utils.obfuscate_ip import obfuscate_ip

from .dependencies import (
    create_link_use_case,
    delete_link_use_case,
    find_by_short_url_link_use_case,
    get_link_clicks_use_case,
    get_me_links_use_case,
    list_public_links_use_case,
    redirect_link_use_case,
    stats_link_use_case,
    update_link_use_case,
)

router = APIRouter(prefix="/link")
short_router = APIRouter()


@short_router.get("/public", response_model=ListLinksSchema)
@limiter.limit("50/minute", key_func=get_anon_key)
@limiter.limit("200/minute", key_func=get_auth_key)
async def list_public_links(
        request: Request,
        paginate: Pagination = Depends(),
        usecase: AbstractListPublicLinksUseCase = Depends(list_public_links_use_case),
) -> JSONResponse:
    paginate_dto = PaginationDTO(limit=paginate.limit, offset=paginate.offset)
    links, total = await usecase.execute(paginate=paginate_dto)

    items = [
        LinkShortSchema(
            url=link.url,
            short_url=link.short_url,
            total=link.total,
            is_active=link.is_active,
            expires_at=link.expires_at,
        ) for link in links
    ]

    return JSONResponse(ListLinksSchema(
        items=items,
        total=total,
        offset=paginate.offset,
        limit=paginate.limit,
    ).model_dump(mode="json"), status_code=status.HTTP_200_OK)


@short_router.get("/{short_url}", response_model=LinkSchema)
@limiter.limit("20/minute", key_func=get_anon_key)
@limiter.limit("200/minute", key_func=get_auth_key)
async def redirect_link(
        short_url: str,
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
    except LinkIsNotActive:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    except LinkNotFoundError:
        frontend_base_url = settings.app.frontend_base_url.rstrip("/")
        return RedirectResponse(url=f"{frontend_base_url}/{short_url}", status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    except LinkIsExpires as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    return RedirectResponse(url=_to_schema(link).url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get("/me", response_model=ListLinksSchema)
@limiter.limit("100/minute")
async def links_me(
    request: Request,
    paginate: Pagination = Depends(),
    user: UserDTO | None = Depends(get_current_user_optional),
    usecase: AbstractGetMeLinksUseCase = Depends(get_me_links_use_case)
) -> JSONResponse:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You must be signed in to access")

    paginate_dto = PaginationDTO(limit=paginate.limit, offset=paginate.offset)

    try:
        links, total = await usecase.execute(user_id=user.id, paginate=paginate_dto)
    except UserNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except TokenNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found")

    items = [
        LinkShortSchema(
            url=link.url,
            short_url=link.short_url,
            total=link.total,
            is_active=link.is_active,
            expires_at=link.expires_at,
        ) for link in links
    ]

    return JSONResponse(ListLinksSchema(
        items=items,
        total=total,
        offset=paginate.offset,
        limit=paginate.limit,
    ).model_dump(mode="json"), status_code=status.HTTP_200_OK)


@router.delete("/{short_url}")
@limiter.limit("300/hour")
async def delete_link(
    request: Request,
    short_url: str,
    user: UserDTO | None = Depends(get_current_user_optional),
    usecase: AbstractDeleteLinkUseCase = Depends(delete_link_use_case),
) -> Response:
    if user is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this object.")

    try:
        await usecase.execute(user.id, short_url)
    except AccessDenied as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except LinkNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{short_url}", response_model=LinkSchema)
@limiter.limit("30/hour")
async def update_link(
    request: Request,
    short_url: str,
    payload: UpdateLinkSchema,
    user: UserDTO | None = Depends(get_current_user_optional),
    usecase: AbstractUpdateLinkUseCase = Depends(update_link_use_case)
) -> JSONResponse:
    if user is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this object.")

    dto = UpdateLinkDTO(
        short_url=payload.short_url,
        is_active=payload.is_active,
        expires_at=payload.expires_at,
        expires_at_set="expires_at" in payload.model_fields_set,
    )

    try:
        link = await usecase.execute(user_id=user.id, short_url=short_url, dto=dto)
    except AccessDenied as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except LinkNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    return JSONResponse(_to_schema(link).model_dump(mode="json"), status_code=status.HTTP_200_OK)



@router.get("/{short_url}", response_model=LinkSchema)
async def find_link(short_url: str,
        usecase: AbstractFindByShortUrlLinkUseCase = Depends(find_by_short_url_link_use_case)
):
    try:
        link = await usecase.execute(short_url)
    except LinkNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    return JSONResponse(_to_schema(link).model_dump(mode='json'), status_code=status.HTTP_200_OK)


@router.post("/", response_model=LinkSchema)
@limiter.limit("10/hour", key_func=get_anon_key)
@limiter.limit("100/hour", key_func=get_auth_key)
async def create_link(
        request: Request,
        payload: CreateLinkSchema,
        usecase: AbstractCreateLinkUseCase = Depends(create_link_use_case),
        user: UserDTO | None = Depends(get_current_user_optional),
) -> JSONResponse:
    user_id = user.id if user else None
    dto = CreateLinkDTO(
        short_url=None,
        url=payload.url,
        user_id=user_id,
        custom_alias=payload.custom_alias,
    )

    try:
        link = await usecase.execute(dto)
    except (LinkIsExist, LinkAlreadyExist,) as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except (InvalidUrlError, UnsafeUrlError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc))

    return JSONResponse(_to_schema(link).model_dump(mode="json"), status_code=status.HTTP_201_CREATED)


@router.get("/{short_url}/clicks", response_model=ListLinkClicksSchema)
@limiter.limit("100/minute")
async def list_clicks(
    request: Request,
    short_url: str,
    paginate: Pagination = Depends(),
    user: UserDTO | None = Depends(get_current_user_optional),
    usecase: AbstractGetLinkClicksUseCase = Depends(get_link_clicks_use_case)
) -> JSONResponse:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You must be signed in to access")

    paginate_dto = PaginationDTO(limit=paginate.limit, offset=paginate.offset)

    try:
        clicks, total = await usecase.execute(short_url=short_url, user_id=user.id, paginate=paginate_dto)
    except LinkNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    except AccessDenied as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    items = [
        LinkClickSchema(
            ip=obfuscate_ip(click.ip),
            country=click.country,
            user_agent=click.user_agent,
            clicked_at=click.clicked_at,
        ) for click in clicks
    ]

    return JSONResponse(ListLinkClicksSchema(
        items=items,
        total=total,
        offset=paginate.offset,
        limit=paginate.limit,
    ).model_dump(mode="json"), status_code=status.HTTP_200_OK)


@router.get("/{short_url}/stats", response_model=LinkSchema)
@limiter.limit("10/minute", key_func=get_anon_key)
@limiter.limit("100/minute", key_func=get_auth_key)
async def stats_link(
        request: Request,
        short_url: str,
        user: UserDTO | None = Depends(get_current_user_optional),
        usecase: AbstractGroupByCountryLinkUseCase = Depends(stats_link_use_case),
):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You must be signed in to access")
    try:
        stats_link_dto = await usecase.execute(short_url, user.id)
    except LinkNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    except AccessDenied as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    schema = GroupByCountryLinkSchema(
        link_id=stats_link_dto.link_id,
        total=stats_link_dto.total,
        by_country=stats_link_dto.by_country,
        clicks_by_device=stats_link_dto.clicks_by_device,
        clicks_by_date=stats_link_dto.clicks_by_date,
    )

    return JSONResponse(schema.model_dump(mode="json"), status_code=status.HTTP_200_OK)


def _to_schema(dto: LinkDTO) -> LinkSchema:
    return LinkSchema(
        id=dto.id,
        short_url=dto.short_url,
        url=dto.url,
        total=dto.total,
        is_active=dto.is_active,
        expires_at=dto.expires_at,
        user_id=dto.user_id,
    )
