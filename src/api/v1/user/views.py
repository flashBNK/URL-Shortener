from fastapi import APIRouter, status, Depends, HTTPException
from fastapi.responses import JSONResponse

from .models import CreateUserSchema, UserSchema
from domain.user.models import CreateUserDTO, UserDTO
from domain.user.exceptions import UserNotFound
from .dependencies import create_user_use_case, get_user_use_case
from usecases.user.create.abstract import AbstractCreateUserUseCase
from usecases.user.get.abstract import AbstractGetUserUseCase
from infrastructure.repositories.postgresql.user.exceptions import UserIsExist

router = APIRouter(prefix="/user")


@router.post("/", response_model=UserSchema)
async def create_link(
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


@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: int,
    usecase: AbstractGetUserUseCase = Depends(get_user_use_case),
) -> JSONResponse:
    try:
        user = await usecase.execute(user_id)
    except UserNotFound as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return JSONResponse(_to_schema(user).model_dump(mode="json"), status_code=status.HTTP_200_OK)


def _to_schema(dto: UserDTO):
    return UserSchema(
        id=dto.id,
        username=dto.username,
        email=dto.email,
        created_at=dto.created_at,
        is_active=dto.is_active,
    )