
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


FormaPagamento = Literal[
    "dinheiro",
    "pix",
    "cartao_credito",
    "cartao_debito",
    "transferencia",
]


class ItemVendaCreate(BaseModel):
    produto_id: str = Field(min_length=1)
    quantidade: float = Field(gt=0)


class VendaCreate(BaseModel):
    itens: list[ItemVendaCreate] = Field(min_length=1, max_length=100)
    forma_pagamento: FormaPagamento
    desconto: float = Field(default=0, ge=0)
    cliente_nome: str | None = Field(default=None, max_length=120)
    observacao: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validar_itens(self):
        ids = [item.produto_id for item in self.itens]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Cada produto deve aparecer apenas uma vez na venda."
            )

        return self


class ItemVendaResponse(BaseModel):
    produto_id: str
    produto_nome: str
    codigo: str
    quantidade: float
    preco_unitario: float
    subtotal: float


class VendaResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    itens: list[ItemVendaResponse]
    subtotal: float
    desconto: float
    total: float
    forma_pagamento: FormaPagamento
    cliente_nome: str | None = None
    observacao: str | None = None
    usuario_id: str
    criado_em: datetime
