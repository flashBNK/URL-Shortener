from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, Response
from fastapi.security import HTTPAuthorizationCredentials

from api.v1.auth.dependencies import get_user_by_token_use_case
from domain.token.exceptions import TokenExpiredError, TokenNotFoundError
from domain.user.exceptions import UserIsExist, UserNotFound, WrongPasswordError
from domain.user.models import ChangePasswordDTO, CreateUserDTO, PasswordDTO, UserDTO, UserUpdateDTO
from limiter import limiter
from usecases.token.get_user_by_token.abstract import AbstractGetUserByTokenUseCase
from usecases.user.change_password.abstract import AbstractChangePasswordUserUseCase
from usecases.user.create.abstract import AbstractCreateUserUseCase
from usecases.user.delete.abstract import AbstractDeleteUserUseCase
from usecases.user.update.abstract import AbstractUpdateUserUseCase

from .dependencies import (
    change_password_user_use_case,
    create_user_use_case,
    delete_user_use_case,
    get_current_user_optional,
    security_scheme,
    update_user_use_case,
)
from .models import ChangePasswordSchema, CreateUserSchema, PasswordSchema, UpdateUserSchema, UserSchema

router = APIRouter(prefix="/user")


@router.post("", response_model=UserSchema)
@limiter.limit("5/hour")
async def create_user(
        request: Request,
        payload: CreateUserSchema,
        usecase: AbstractCreateUserUseCase = Depends(create_user_use_case),
) -> JSONResponse:
    dto = CreateUserDTO(
        username=payload.username,
        email=payload.email,
        password=payload.password,
    )

    try:
        user = await usecase.execute(dto)
    except UserIsExist as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return JSONResponse(_to_schema(user).model_dump(mode="json"), status_code=status.HTTP_201_CREATED)


@router.get("/me", response_model=UserSchema)
async def get_user_me(
        credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
        usecase: AbstractGetUserByTokenUseCase = Depends(get_user_by_token_use_case)
) -> JSONResponse:
    access_token = credentials.credentials
    try:
        user = await usecase.execute(access_token)
    except (UserNotFound, TokenNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (TokenExpiredError, WrongPasswordError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    return JSONResponse(_to_schema(user).model_dump(mode="json"))


@router.patch("", response_model=UserSchema)
@limiter.limit("30/hour")
async def update_user(
    request: Request,
    payload: UpdateUserSchema,
    user: UserDTO | None = Depends(get_current_user_optional),
    usecase: AbstractUpdateUserUseCase = Depends(update_user_use_case)
) -> JSONResponse:
    if user is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this object.")

    dto = UserUpdateDTO(
        email=payload.email,
        username=payload.username,
    )

    try:
        user = await usecase.execute(user.id, dto)
    except UserNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    except UserIsExist as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return JSONResponse(_to_schema(user).model_dump(mode="json"), status_code=status.HTTP_200_OK)


@router.put("/change-password")
@limiter.limit("30/hour")
async def change_password(
    request: Request,
    payload: ChangePasswordSchema,
    user: UserDTO | None = Depends(get_current_user_optional),
    usecase: AbstractChangePasswordUserUseCase = Depends(change_password_user_use_case)
):
    if user is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this object.")

    dto = ChangePasswordDTO(
        current_password=payload.current_password,
        new_password=payload.new_password,
    )

    try:
        await usecase.execute(user.id, dto)
    except UserNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    except UserIsExist as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except WrongPasswordError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("")
@limiter.limit("30/hour")
async def delete_user(
    request: Request,
    schema: PasswordSchema,
    user: UserDTO | None = Depends(get_current_user_optional),
    usecase: AbstractDeleteUserUseCase = Depends(delete_user_use_case)
):
    if user is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this object.")

    dto = PasswordDTO(current_password=schema.current_password)

    try:
        await usecase.execute(user.id, dto)
    except UserNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except WrongPasswordError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _to_schema(dto: UserDTO):
    return UserSchema(
        id=dto.id,
        username=dto.username,
        email=dto.email,
        created_at=dto.created_at,
        is_active=dto.is_active,
    )