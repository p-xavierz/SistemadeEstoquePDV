from datetime import datetime, timedelta, timezone

from jose import jwt
from pwdlib import PasswordHash

from app.core.config import settings


password_hasher = PasswordHash.recommended()


def hash_senha(senha: str) -> str:
    return password_hasher.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return password_hasher.verify(senha, senha_hash)


def criar_token_acesso(user_id: str) -> str:
    agora = datetime.now(timezone.utc)

    payload = {
        "sub": user_id,
        "iat": agora,
        "exp": agora
        + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )