from fastapi import APIRouter, status, Depends, HTTPException
from fastapi.responses import JSONResponse

from .models import LoginUserSchema, RefreshTokenSchema, TokenSchema
from domain.token.exceptions import TokenExpiredError, TokenNotFoundError
from domain.token.models import LoginUserDTO, RefreshTokenDTO
from usecases.token.create.abstract import AbstractCreateTokenUseCase

from .dependencies import create_token_use_case

router = APIRouter(prefix="/auth")


@router.post("/token", response_model=TokenSchema)
async def create_token(
        payload: LoginUserSchema,
        usecase: AbstractCreateTokenUseCase = Depends(create_token_use_case)
) -> JSONResponse:
    dto = LoginUserDTO(
        username=payload.username,
        password=payload.password,
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
