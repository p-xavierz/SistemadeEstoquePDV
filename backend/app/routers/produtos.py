
from datetime import datetime, timezone
from uuid import uuid4
import re

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.errors import DuplicateKeyError

from app.core.dependencies import obter_usuario_atual
from app.database.connection import database
from app.schemas.produtos import (
    ProdutoCreate,
    ProdutoUpdate,
    ProdutoResponse,
)


router = APIRouter(
    prefix="/api/produtos",
    tags=["Produtos"],
    dependencies=[Depends(obter_usuario_atual)],
)


@router.post(
    "",
    response_model=ProdutoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def criar_produto(dados: ProdutoCreate):
    codigo = dados.codigo.strip()

    if not codigo:
        raise HTTPException(
            status_code=422,
            detail="O código não pode ser vazio.",
        )

    codigo_normalizado = codigo.casefold()

    existente = await database.produtos.find_one({
        "codigo_normalizado": codigo_normalizado
    })

    if existente:
        raise HTTPException(
            status_code=409,
            detail="Já existe um produto com esse código.",
        )

    categoria = await database.categorias.find_one({
        "id": dados.categoria_id,
        "ativa": True,
    })

    if not categoria:
        raise HTTPException(
            status_code=422,
            detail="Categoria não encontrada ou inativa.",
        )

    agora = datetime.now(timezone.utc)

    produto = {
        "id": str(uuid4()),
        "nome": dados.nome.strip(),
        "codigo": codigo,
        "codigo_normalizado": codigo_normalizado,
        "categoria_id": dados.categoria_id,
        "descricao": (
            dados.descricao.strip()
            if dados.descricao
            else None
        ),
        "preco_custo": dados.preco_custo,
        "preco_venda": dados.preco_venda,
        "quantidade_estoque": dados.quantidade_estoque,
        "estoque_minimo": dados.estoque_minimo,
        "ativo": True,
        "criado_em": agora,
        "atualizado_em": agora,
    }

    try:
        await database.produtos.insert_one(produto)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Já existe um produto com esse código.",
        )

    return produto



@router.get("", response_model=list[ProdutoResponse])
async def listar_produtos(
    incluir_inativos: bool = Query(default=False),
    categoria_id: str | None = Query(default=None),
    busca: str | None = Query(default=None, max_length=120),
):
    filtro = {} if incluir_inativos else {"ativo": True}

    if categoria_id:
        filtro["categoria_id"] = categoria_id

    if busca and busca.strip():
        termo = re.escape(busca.strip())
        filtro["$or"] = [
            {"nome": {"$regex": termo, "$options": "i"}},
            {"codigo": {"$regex": termo, "$options": "i"}},
        ]

    cursor = database.produtos.find(filtro).sort("nome", 1)
    return await cursor.to_list(length=500)


@router.get("/{produto_id}", response_model=ProdutoResponse)
async def buscar_produto(produto_id: str):
    produto = await database.produtos.find_one({"id": produto_id})

    if not produto:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado.",
        )

    return produto


@router.put("/{produto_id}", response_model=ProdutoResponse)
async def atualizar_produto(
    produto_id: str,
    dados: ProdutoUpdate,
):
    atualizacoes = dados.model_dump(exclude_unset=True)

    if not atualizacoes:
        raise HTTPException(
            status_code=400,
            detail="Nenhuma alteração informada.",
        )

    produto = await database.produtos.find_one({"id": produto_id})

    if not produto:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado.",
        )

    if "nome" in atualizacoes:
        nome = atualizacoes["nome"]

        if nome is None or not nome.strip():
            raise HTTPException(
                status_code=422,
                detail="O nome não pode ser vazio.",
            )

        atualizacoes["nome"] = nome.strip()

    if "codigo" in atualizacoes:
        codigo_recebido = atualizacoes["codigo"]

        if codigo_recebido is None or not codigo_recebido.strip():
            raise HTTPException(
                status_code=422,
                detail="O código não pode ser vazio.",
            )

        codigo = codigo_recebido.strip()
        codigo_normalizado = codigo.casefold()

        existente = await database.produtos.find_one({
            "codigo_normalizado": codigo_normalizado,
            "id": {"$ne": produto_id},
        })

        if existente:
            raise HTTPException(
                status_code=409,
                detail="Já existe outro produto com esse código.",
            )

        atualizacoes["codigo"] = codigo
        atualizacoes["codigo_normalizado"] = codigo_normalizado

    if "categoria_id" in atualizacoes:
        categoria_id = atualizacoes["categoria_id"]

        if not categoria_id:
            raise HTTPException(
                status_code=422,
                detail="Categoria inválida.",
            )

        categoria = await database.categorias.find_one({
            "id": categoria_id,
            "ativa": True,
        })

        if not categoria:
            raise HTTPException(
                status_code=422,
                detail="Categoria não encontrada ou inativa.",
            )

    if "descricao" in atualizacoes:
        descricao = atualizacoes["descricao"]

        atualizacoes["descricao"] = (
            descricao.strip() if descricao is not None else None
        )

    if "quantidade_estoque" in atualizacoes:
        raise HTTPException(
            status_code=400,
            detail="O estoque deve ser alterado pelo módulo de movimentações.",
        )

    atualizacoes["atualizado_em"] = datetime.now(timezone.utc)

    try:
        await database.produtos.update_one(
            {"id": produto_id},
            {"$set": atualizacoes},
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Já existe outro produto com esse código.",
        )

    return await database.produtos.find_one({"id": produto_id})


@router.delete("/{produto_id}")
async def desativar_produto(produto_id: str):
    produto = await database.produtos.find_one({"id": produto_id})

    if not produto:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado.",
        )

    if not produto.get("ativo", True):
        return {"mensagem": "O produto já está desativado."}

    await database.produtos.update_one(
        {"id": produto_id},
        {
            "$set": {
                "ativo": False,
                "atualizado_em": datetime.now(timezone.utc),
            }
        },
    )

    return {"mensagem": "Produto desativado com sucesso."}
