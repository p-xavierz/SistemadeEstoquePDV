
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoriaCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=80)
    descricao: str | None = Field(default=None, max_length=250)


class CategoriaUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=80)
    descricao: str | None = Field(default=None, max_length=250)
    ativa: bool | None = None


class CategoriaResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    nome: str
    descricao: str | None = None
    ativa: bool = True
    criado_em: datetime
    atualizado_em: datetime
