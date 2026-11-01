from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import obter_usuario_atual
from app.database.connection import database
from app.schemas.caixa import (
    AberturaCaixaCreate,
    FechamentoCaixaCreate,
    MovimentacaoCaixaCreate,
)


router = APIRouter(
    prefix="/api/caixa",
    tags=["Controle de Caixa"],
    dependencies=[Depends(obter_usuario_atual)],
)


def dinheiro(valor):
    return round(float(valor or 0), 2)


async def calcular_resumo(caixa):
    caixa_id = caixa["id"]
    aberto_em = caixa["aberto_em"]

    vendas = await database.vendas.find(
        {"caixa_id": caixa_id},
        {"_id": 0},
    ).to_list(length=None)

    vendas_dinheiro = sum(
        dinheiro(venda.get("total"))
        for venda in vendas
        if venda.get("forma_pagamento") == "dinheiro"
    )

    vendas_pix = sum(
        dinheiro(venda.get("total"))
        for venda in vendas
        if venda.get("forma_pagamento") == "pix"
    )

    vendas_cartao_credito = sum(
        dinheiro(venda.get("total"))
        for venda in vendas
        if venda.get("forma_pagamento") == "cartao_credito"
    )

    vendas_cartao_debito = sum(
        dinheiro(venda.get("total"))
        for venda in vendas
        if venda.get("forma_pagamento") == "cartao_debito"
    )

    vendas_transferencia = sum(
        dinheiro(venda.get("total"))
        for venda in vendas
        if venda.get("forma_pagamento") == "transferencia"
    )

    movimentacoes = await database.movimentacoes_caixa.find(
        {"caixa_id": caixa_id},
        {"_id": 0},
    ).to_list(length=None)

    entradas = sum(
        dinheiro(item["valor"])
        for item in movimentacoes
        if item["tipo"] == "entrada"
    )

    saidas = sum(
        dinheiro(item["valor"])
        for item in movimentacoes
        if item["tipo"] == "saida"
    )

    saldo_esperado = dinheiro(
        caixa["valor_inicial"] + vendas_dinheiro + entradas - saidas
    )

    return {
        "vendas_dinheiro": dinheiro(vendas_dinheiro),
        "vendas_pix": dinheiro(vendas_pix),
        "vendas_cartao_credito": dinheiro(vendas_cartao_credito),
        "vendas_cartao_debito": dinheiro(vendas_cartao_debito),
        "vendas_transferencia": dinheiro(vendas_transferencia),
        "total_vendas": dinheiro(
            vendas_dinheiro
            + vendas_pix
            + vendas_cartao_credito
            + vendas_cartao_debito
            + vendas_transferencia
        ),
        "quantidade_vendas": len(vendas),
        "total_entradas": dinheiro(entradas),
        "total_saidas": dinheiro(saidas),
        "saldo_esperado": saldo_esperado,
        "movimentacoes": sorted(
            movimentacoes,
            key=lambda item: item["criado_em"],
            reverse=True,
        ),
    }


@router.post("/abertura", status_code=status.HTTP_201_CREATED)
async def abrir_caixa(
    dados: AberturaCaixaCreate,
    usuario: dict = Depends(obter_usuario_atual),
):
    caixa = await database.caixas.find_one(
        {"status": "aberto"},
        {"_id": 0},
    )

    if caixa:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um caixa aberto. Feche-o antes de abrir outro.",
        )

    agora = datetime.now(timezone.utc)

    caixa = {
        "id": str(uuid4()),
        "status": "aberto",
        "valor_inicial": dinheiro(dados.valor_inicial),
        "aberto_por": usuario["id"],
        "aberto_em": agora,
        "fechado_em": None,
        "valor_contado": None,
        "saldo_esperado": None,
        "diferenca": None,
    }

    try:
        await database.caixas.insert_one(caixa)
    except Exception:
        # Protege também contra duas tentativas de abertura simultâneas.
        caixa_aberto = await database.caixas.find_one(
            {"status": "aberto"},
            {"_id": 0},
        )

        if caixa_aberto:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um caixa aberto.",
            )

        raise

    return {
        "mensagem": "Caixa aberto com sucesso.",
        "caixa": caixa,
    }


@router.get("/atual")
async def consultar_caixa_atual():
    caixa = await database.caixas.find_one(
        {"status": "aberto"},
        {"_id": 0},
    )

    if not caixa:
        return {
            "aberto": False,
            "caixa": None,
            "resumo": None,
        }

    resumo = await calcular_resumo(caixa)

    return {
        "aberto": True,
        "caixa": caixa,
        "resumo": resumo,
    }


@router.post("/movimentacoes", status_code=status.HTTP_201_CREATED)
async def registrar_movimentacao(
    dados: MovimentacaoCaixaCreate,
    usuario: dict = Depends(obter_usuario_atual),
):
    caixa = await database.caixas.find_one(
        {"status": "aberto"}
    )

    if not caixa:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Abra o caixa antes de registrar movimentações.",
        )

    movimentacao = {
        "id": str(uuid4()),
        "caixa_id": caixa["id"],
        "tipo": dados.tipo,
        "valor": dinheiro(dados.valor),
        "motivo": dados.motivo.strip(),
        "usuario_id": usuario["id"],
        "criado_em": datetime.now(timezone.utc),
    }

    await database.movimentacoes_caixa.insert_one(movimentacao)

    return {
        "mensagem": "Movimentação registrada com sucesso.",
        "movimentacao": movimentacao,
    }


@router.get("/movimentacoes")
async def listar_movimentacoes_caixa(
    limite: int = Query(default=100, ge=1, le=500),
):
    caixa = await database.caixas.find_one(
        {"status": "aberto"}
    )

    if not caixa:
        return []

    cursor = (
        database.movimentacoes_caixa.find(
            {"caixa_id": caixa["id"]},
            {"_id": 0},
        )
        .sort("criado_em", -1)
        .limit(limite)
    )

    return await cursor.to_list(length=limite)


@router.post("/fechamento")
async def fechar_caixa(
    dados: FechamentoCaixaCreate,
    usuario: dict = Depends(obter_usuario_atual),
):
    caixa = await database.caixas.find_one(
        {"status": "aberto"}
    )

    if not caixa:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não existe um caixa aberto para fechar.",
        )

    resumo = await calcular_resumo(caixa)
    valor_contado = dinheiro(dados.valor_contado)
    saldo_esperado = resumo["saldo_esperado"]
    diferenca = dinheiro(valor_contado - saldo_esperado)
    agora = datetime.now(timezone.utc)

    resultado = await database.caixas.update_one(
        {
            "id": caixa["id"],
            "status": "aberto",
        },
        {
            "$set": {
                "status": "fechado",
                "fechado_em": agora,
                "fechado_por": usuario["id"],
                "valor_contado": valor_contado,
                "saldo_esperado": saldo_esperado,
                "diferenca": diferenca,
            }
        },
    )

    if resultado.modified_count != 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O caixa já foi fechado ou sofreu alteração.",
        )

    return {
        "mensagem": "Caixa fechado com sucesso.",
        "caixa_id": caixa["id"],
        "valor_inicial": dinheiro(caixa["valor_inicial"]),
        "vendas_dinheiro": resumo["vendas_dinheiro"],
        "total_entradas": resumo["total_entradas"],
        "total_saidas": resumo["total_saidas"],
        "saldo_esperado": saldo_esperado,
        "valor_contado": valor_contado,
        "diferenca": diferenca,
        "fechado_em": agora,
    }


@router.get("/historico")
async def listar_historico_caixa(
    limite: int = Query(default=50, ge=1, le=200),
):
    cursor = (
        database.caixas.find({}, {"_id": 0})
        .sort("aberto_em", -1)
        .limit(limite)
    )

    return await cursor.to_list(length=limite)
