
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


TipoMovimentacaoCaixa = Literal["entrada", "saida"]


class AberturaCaixaCreate(BaseModel):
    valor_inicial: float = Field(ge=0)


class MovimentacaoCaixaCreate(BaseModel):
    tipo: TipoMovimentacaoCaixa
    valor: float = Field(gt=0)
    motivo: str = Field(min_length=3, max_length=250)


class FechamentoCaixaCreate(BaseModel):
    valor_contado: float = Field(ge=0)


class MovimentacaoCaixaResponse(BaseModel):
    id: str
    caixa_id: str
    tipo: TipoMovimentacaoCaixa
    valor: float
    motivo: str
    usuario_id: str
    criado_em: datetime


class CaixaResponse(BaseModel):
    id: str
    status: Literal["aberto", "fechado"]
    valor_inicial: float
    aberto_por: str
    aberto_em: datetime
    fechado_em: datetime | None = None
    valor_contado: float | None = None
    saldo_esperado: float | None = None
    diferenca: float | None = None
