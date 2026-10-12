
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.database.connection import database


security = HTTPBearer(auto_error=False)


async def obter_usuario_atual(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    erro = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise erro

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        usuario_id = payload.get("sub")

        if not usuario_id:
            raise erro

    except JWTError:
        raise erro

    usuario = await database.users.find_one({"id": usuario_id})

    if not usuario or not usuario.get("ativo", False):
        raise erro

    return usuario
