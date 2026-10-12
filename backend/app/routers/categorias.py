
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import obter_usuario_atual
from app.database.connection import database
from app.schemas.categorias import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaResponse,
)

router = APIRouter(
    prefix="/api/categorias",
    tags=["Categorias"],
    dependencies=[Depends(obter_usuario_atual)],
)


@router.post("", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
async def criar_categoria(dados: CategoriaCreate):
    nome = dados.nome.strip()

    if len(nome) < 2 or len(nome) > 80:
        raise HTTPException(
            status_code=422,
            detail="O nome deve ter entre 2 e 80 caracteres.",
        )

    existente = await database.categorias.find_one(
        {"nome_normalizado": nome.casefold()}
    )

    if existente:
        raise HTTPException(
            status_code=409,
            detail="Já existe uma categoria ativa com esse nome.",
        )

    agora = datetime.now(timezone.utc)

    categoria = {
        "id": str(uuid4()),
        "nome": nome,
        "nome_normalizado": nome.casefold(),
        "descricao": dados.descricao.strip() if dados.descricao else None,
        "ativa": True,
        "criado_em": agora,
        "atualizado_em": agora,
    }

    await database.categorias.insert_one(categoria)
    return categoria


@router.get("", response_model=list[CategoriaResponse])
async def listar_categorias(
    incluir_inativas: bool = Query(default=False),
):
    filtro = {} if incluir_inativas else {"ativa": True}

    cursor = database.categorias.find(filtro).sort("nome", 1)
    return await cursor.to_list(length=500)


@router.get("/{categoria_id}", response_model=CategoriaResponse)
async def buscar_categoria(categoria_id: str):
    categoria = await database.categorias.find_one({"id": categoria_id})

    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    return categoria


@router.put("/{categoria_id}", response_model=CategoriaResponse)
async def atualizar_categoria(categoria_id: str, dados: CategoriaUpdate):
    atualizacoes = dados.model_dump(exclude_unset=True)

    if not atualizacoes:
        raise HTTPException(status_code=400, detail="Nenhuma alteração informada.")

    categoria = await database.categorias.find_one({"id": categoria_id})

    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    if "nome" in atualizacoes:
        if atualizacoes["nome"] is None:
         raise HTTPException(
                status_code=422,
                detail="O nome não pode ser vazio.",
        )

        nome = atualizacoes["nome"].strip()

        if len(nome) < 2 or len(nome) > 80:
            raise HTTPException(
                status_code=422,
                detail="O nome deve ter entre 2 e 80 caracteres.",
            )

        existente = await database.categorias.find_one({
            "nome_normalizado": nome.casefold(),
            "id": {"$ne": categoria_id},
        })

        if existente:
            raise HTTPException(
                status_code=409,
                detail="Já existe uma categoria com esse nome.",
            )

        atualizacoes["nome"] = nome
        atualizacoes["nome_normalizado"] = nome.casefold()

    if "descricao" in atualizacoes and atualizacoes["descricao"] is not None:
        atualizacoes["descricao"] = atualizacoes["descricao"].strip()

    atualizacoes["atualizado_em"] = datetime.now(timezone.utc)

    await database.categorias.update_one(
        {"id": categoria_id},
        {"$set": atualizacoes},
    )

    return await database.categorias.find_one({"id": categoria_id})


@router.delete("/{categoria_id}")
async def desativar_categoria(categoria_id: str):
    categoria = await database.categorias.find_one({"id": categoria_id})

    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    produtos_vinculados = await database.produtos.count_documents({
        "categoria_id": categoria_id,
        "ativo": True,
    })

    if produtos_vinculados:
        raise HTTPException(
            status_code=409,
            detail="Não é possível desativar uma categoria com produtos ativos vinculados.",
        )

    await database.categorias.update_one(
        {"id": categoria_id},
        {
            "$set": {
                "ativa": False,
                "atualizado_em": datetime.now(timezone.utc),
            }
        },
    )

    return {"mensagem": "Categoria desativada com sucesso."}
