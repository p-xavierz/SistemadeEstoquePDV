from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.core.security import criar_token_acesso, verificar_senha
from app.database.connection import database
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse


router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

security = HTTPBearer(auto_error=False)


def usuario_publico(usuario: dict) -> dict:
    return {
        "id": usuario["id"],
        "nome": usuario["nome"],
        "email": usuario["email"],
        "perfil": usuario["perfil"],
        "ativo": usuario["ativo"],
        "criado_em": usuario["criado_em"],
    }


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


@router.post("/login", response_model=TokenResponse)
async def login(dados: LoginRequest):
    email = str(dados.email).strip().lower()

    usuario = await database.users.find_one({"email": email})

    if (
        not usuario
        or not usuario.get("ativo", False)
        or not verificar_senha(dados.senha, usuario["senha_hash"])
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
        )

    token = criar_token_acesso(usuario["id"])

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def meu_usuario(
    usuario: dict = Depends(obter_usuario_atual),
):
    return usuario_publico(usuario)