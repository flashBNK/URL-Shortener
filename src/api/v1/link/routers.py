from fastapi import APIRouter
from .views import router as link_router

router = APIRouter(tags=['link'])
router.include_router(link_router)