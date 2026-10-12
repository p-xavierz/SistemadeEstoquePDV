
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProdutoCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    codigo: str = Field(min_length=1, max_length=50)
    categoria_id: str
    descricao: str | None = Field(default=None, max_length=500)
    preco_custo: float = Field(ge=0)
    preco_venda: float = Field(ge=0)
    quantidade_estoque: float = Field(default=0, ge=0)
    estoque_minimo: float = Field(default=0, ge=0)


class ProdutoUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    
    nome: str | None = Field(default=None, min_length=2, max_length=120)
    codigo: str | None = Field(default=None, min_length=1, max_length=50)
    categoria_id: str | None = None
    descricao: str | None = Field(default=None, max_length=500)
    preco_custo: float | None = Field(default=None, ge=0)
    preco_venda: float | None = Field(default=None, ge=0)
    estoque_minimo: float | None = Field(default=None, ge=0)
    ativo: bool | None = None


class ProdutoResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    nome: str
    codigo: str
    categoria_id: str
    descricao: str | None = None
    preco_custo: float
    preco_venda: float
    quantidade_estoque: float
    estoque_minimo: float
    ativo: bool = True
    criado_em: datetime
    atualizado_em: datetime
