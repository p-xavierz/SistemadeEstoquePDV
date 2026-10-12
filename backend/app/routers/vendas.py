
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import ReturnDocument

from app.core.dependencies import obter_usuario_atual
from app.database.connection import client, database
from app.schemas.vendas import VendaCreate, VendaResponse


router = APIRouter(
    prefix="/api/vendas",
    tags=["Vendas"],
    dependencies=[Depends(obter_usuario_atual)],
)


@router.post(
    "",
    response_model=VendaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def criar_venda(
    dados: VendaCreate,
    usuario: dict = Depends(obter_usuario_atual),
):
    agora = datetime.now(timezone.utc)
    venda_id = str(uuid4())
    itens_venda = []
    subtotal_geral = 0.0

    async with await client.start_session() as session:
        async with session.start_transaction():
            # Primeiro, valida os produtos e calcula os valores.
            for item in dados.itens:
                produto = await database.produtos.find_one(
                    {
                        "id": item.produto_id,
                        "ativo": True,
                    },
                    session=session,
                )

                if not produto:
                    raise HTTPException(
                        status_code=404,
                        detail=(
                            f"Produto {item.produto_id} não encontrado "
                            "ou inativo."
                        ),
                    )

                preco = round(float(produto["preco_venda"]), 2)
                quantidade = float(item.quantidade)
                subtotal_item = round(preco * quantidade, 2)

                itens_venda.append(
                    {
                        "produto_id": produto["id"],
                        "produto_nome": produto["nome"],
                        "codigo": produto["codigo"],
                        "quantidade": quantidade,
                        "preco_unitario": preco,
                        "subtotal": subtotal_item,
                    }
                )

                subtotal_geral += subtotal_item

            subtotal_geral = round(subtotal_geral, 2)
            desconto = round(float(dados.desconto), 2)

            if desconto > subtotal_geral:
                raise HTTPException(
                    status_code=422,
                    detail="O desconto não pode ser maior que o subtotal.",
                )

            total = round(subtotal_geral - desconto, 2)

            # Baixa o estoque. A condição impede saldo negativo.
            for item in itens_venda:
                produto_anterior = (
                    await database.produtos.find_one_and_update(
                        {
                            "id": item["produto_id"],
                            "ativo": True,
                            "quantidade_estoque": {
                                "$gte": item["quantidade"]
                            },
                        },
                        {
                            "$inc": {
                                "quantidade_estoque": -item["quantidade"]
                            },
                            "$set": {"atualizado_em": agora},
                        },
                        return_document=ReturnDocument.BEFORE,
                        session=session,
                    )
                )

                if produto_anterior is None:
                    produto_atual = await database.produtos.find_one(
                        {"id": item["produto_id"]},
                        session=session,
                    )

                    if not produto_atual or not produto_atual.get("ativo", False):
                        raise HTTPException(
                            status_code=404,
                            detail=(
                                f"O produto {item['produto_nome']} "
                                "não está mais disponível."
                            ),
                        )

                    raise HTTPException(
                        status_code=409,
                        detail=(
                            f"Estoque insuficiente para "
                            f"{item['produto_nome']}. "
                            f"Saldo disponível: "
                            f"{produto_atual['quantidade_estoque']}."
                        ),
                    )

                saldo_anterior = float(
                    produto_anterior["quantidade_estoque"]
                )
                saldo_posterior = round(
                    saldo_anterior - item["quantidade"], 6
                )

                # Mantém o histórico de movimentações de estoque.
                await database.movimentacoes.insert_one(
                    {
                        "id": str(uuid4()),
                        "produto_id": item["produto_id"],
                        "produto_nome": item["produto_nome"],
                        "tipo": "saida",
                        "quantidade": item["quantidade"],
                        "saldo_anterior": saldo_anterior,
                        "saldo_posterior": saldo_posterior,
                        "motivo": f"Venda {venda_id}",
                        "usuario_id": usuario["id"],
                        "criado_em": agora,
                    },
                    session=session,
                )

            venda = {
                "id": venda_id,
                "itens": itens_venda,
                "subtotal": subtotal_geral,
                "desconto": desconto,
                "total": total,
                "forma_pagamento": dados.forma_pagamento,
                "cliente_nome": (
                    dados.cliente_nome.strip()
                    if dados.cliente_nome
                    else None
                ),
                "observacao": (
                    dados.observacao.strip()
                    if dados.observacao
                    else None
                ),
                "usuario_id": usuario["id"],
                "criado_em": agora,
            }

            await database.vendas.insert_one(venda, session=session)

    return venda


@router.get("", response_model=list[VendaResponse])
async def listar_vendas(
    limite: int = Query(default=100, ge=1, le=500),
    forma_pagamento: str | None = Query(
        default=None,
        pattern="^(dinheiro|pix|cartao_credito|cartao_debito|transferencia)$",
    ),
):
    filtro = {}

    if forma_pagamento:
        filtro["forma_pagamento"] = forma_pagamento

    cursor = (
        database.vendas.find(filtro)
        .sort("criado_em", -1)
        .limit(limite)
    )

    return await cursor.to_list(length=limite)


@router.get("/{venda_id}", response_model=VendaResponse)
async def buscar_venda(venda_id: str):
    venda = await database.vendas.find_one({"id": venda_id})

    if not venda:
        raise HTTPException(
            status_code=404,
            detail="Venda não encontrada.",
        )

    return venda
