
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import ReturnDocument

from app.core.dependencies import obter_usuario_atual
from app.database.connection import client, database
from app.schemas.movimentacoes import (
    MovimentacaoCreate,
    MovimentacaoResponse,
)


router = APIRouter(
    prefix="/api/movimentacoes",
    tags=["Movimentações de estoque"],
    dependencies=[Depends(obter_usuario_atual)],
)


@router.post(
    "",
    response_model=MovimentacaoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def criar_movimentacao(
    dados: MovimentacaoCreate,
    usuario: dict = Depends(obter_usuario_atual),
):
    quantidade = dados.quantidade
    agora = datetime.now(timezone.utc)

    async with await client.start_session() as session:
        async with session.start_transaction():
            produto_filtro = {
                "id": dados.produto_id,
                "ativo": True,
            }

            if dados.tipo == "entrada":
                produto_anterior = (
                    await database.produtos.find_one_and_update(
                        produto_filtro,
                        {"$inc": {"quantidade_estoque": quantidade}},
                        return_document=ReturnDocument.BEFORE,
                        session=session,
                    )
                )
            else:
                produto_anterior = (
                    await database.produtos.find_one_and_update(
                        {
                            **produto_filtro,
                            "quantidade_estoque": {"$gte": quantidade},
                        },
                        {"$inc": {"quantidade_estoque": -quantidade}},
                        return_document=ReturnDocument.BEFORE,
                        session=session,
                    )
                )

            if produto_anterior is None:
                produto_atual = await database.produtos.find_one(
                    produto_filtro,
                    session=session,
                )

                if not produto_atual:
                    raise HTTPException(
                        status_code=404,
                        detail="Produto não encontrado ou inativo.",
                    )

                if dados.tipo == "saida":
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            "Estoque insuficiente. Saldo disponível: "
                            f"{produto_atual['quantidade_estoque']}."
                        ),
                    )

                raise HTTPException(
                    status_code=409,
                    detail="Não foi possível atualizar o estoque.",
                )

            saldo_anterior = float(
                produto_anterior["quantidade_estoque"]
            )

            saldo_posterior = (
                saldo_anterior + quantidade
                if dados.tipo == "entrada"
                else saldo_anterior - quantidade
            )

            movimentacao = {
                "id": str(uuid4()),
                "produto_id": dados.produto_id,
                "produto_nome": produto_anterior["nome"],
                "tipo": dados.tipo,
                "quantidade": quantidade,
                "saldo_anterior": saldo_anterior,
                "saldo_posterior": saldo_posterior,
                "motivo": dados.motivo.strip(),
                "usuario_id": usuario["id"],
                "criado_em": agora,
            }

            await database.movimentacoes.insert_one(
                movimentacao,
                session=session,
            )

            await database.produtos.update_one(
                {"id": dados.produto_id},
                {"$set": {"atualizado_em": agora}},
                session=session,
            )

    return movimentacao


@router.get("", response_model=list[MovimentacaoResponse])
async def listar_movimentacoes(
    produto_id: str | None = Query(default=None),
    tipo: str | None = Query(
        default=None,
        pattern="^(entrada|saida)$",
    ),
    limite: int = Query(default=100, ge=1, le=500),
):
    filtro = {}

    if produto_id:
        filtro["produto_id"] = produto_id

    if tipo:
        filtro["tipo"] = tipo

    cursor = (
        database.movimentacoes.find(filtro)
        .sort("criado_em", -1)
        .limit(limite)
    )

    return await cursor.to_list(length=limite)


@router.get(
    "/{movimentacao_id}",
    response_model=MovimentacaoResponse,
)
async def buscar_movimentacao(movimentacao_id: str):
    movimentacao = await database.movimentacoes.find_one(
        {"id": movimentacao_id}
    )

    if not movimentacao:
        raise HTTPException(
            status_code=404,
            detail="Movimentação não encontrada.",
        )

    return movimentacao
