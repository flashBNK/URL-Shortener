from fastapi import APIRouter, status, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, Response

from .models import LoginUserSchema, RefreshTokenSchema, TokenSchema
from api.v1.user.models import UserSchema
from api.v1.user.dependencies import get_current_user_optional
from domain.user.models import UserDTO
from domain.token.exceptions import TokenExpiredError, TokenNotFoundError
from domain.user.exceptions import UserNotFound
from domain.token.models import LoginUserDTO, RefreshTokenDTO
from usecases.token.create.abstract import AbstractCreateTokenUseCase
from usecases.token.refresh.abstract import AbstractRefreshTokenUseCase
from usecases.token.logout.abstract import AbstractLogoutTokenUseCase
from .dependencies import create_token_use_case, refresh_token_use_case, logout_token_use_case

from limiter import limiter

router = APIRouter(prefix="/auth")


@router.post("/token", response_model=TokenSchema)
@limiter.limit("10/hour")
async def create_token(
        request: Request,
        payload: LoginUserSchema,
        usecase: AbstractCreateTokenUseCase = Depends(create_token_use_case)
) -> JSONResponse:
    dto = LoginUserDTO(
        username=payload.username,
        password=payload.password,
    )

    try:
        token = await usecase.execute(dto)
    except UserNotFound as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


    schema = TokenSchema(
        access_token=token.access_token,
        refresh_token=token.refresh_token,
        refresh_token_expires_in=token.refresh_token_expires_in,
        access_token_expires_in=token.access_token_expires_in,
    )

    return JSONResponse(schema.model_dump(mode="json"), status_code=status.HTTP_201_CREATED)


@router.post("/token/refresh", response_model=TokenSchema)
async def refresh(
        payload: RefreshTokenSchema,
        usecase: AbstractRefreshTokenUseCase = Depends(refresh_token_use_case)
) -> JSONResponse:
    dto = RefreshTokenDTO(
        refresh_token=payload.refresh_token,
    )

    try:
        token = await usecase.execute(dto)
    except TokenNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    schema = TokenSchema(
        access_token=token.access_token,
        refresh_token=token.refresh_token,
        refresh_token_expires_in=token.refresh_token_expires_in,
        access_token_expires_in=token.access_token_expires_in,
    )

    return JSONResponse(schema.model_dump(mode="json"), status_code=status.HTTP_201_CREATED)


@router.post("/logout", response_model=UserSchema)
async def logout(
    user: UserDTO = Depends(get_current_user_optional),
    usecase: AbstractLogoutTokenUseCase = Depends(logout_token_use_case)
) -> Response:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You are not authorized.")
    try:
        await usecase.execute(user.id)
    except TokenNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return Response(status_code=status.HTTP_204_NO_CONTENT)