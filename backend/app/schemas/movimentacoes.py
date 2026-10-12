
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class MovimentacaoCreate(BaseModel):
    produto_id: str
    tipo: Literal["entrada", "saida"]
    quantidade: float = Field(gt=0)
    motivo: str = Field(min_length=3, max_length=250)


class MovimentacaoResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    produto_id: str
    produto_nome: str
    tipo: Literal["entrada", "saida"]
    quantidade: float
    saldo_anterior: float
    saldo_posterior: float
    motivo: str
    usuario_id: str
    criado_em: datetime
