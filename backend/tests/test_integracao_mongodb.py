
from pymongo import MongoClient
import os

import pytest
from fastapi.testclient import TestClient

PRODUTO_ID = "produto-integracao-teste-001"
USUARIO_TESTE = {"id": "usuario-integracao-teste", "ativo": True}


@pytest.fixture(scope="module")
def cliente_integracao():
    # Confere o ambiente antes de importar a aplicação.
    if os.getenv("MONGODB_DATABASE") != "estoque_pdv_test":
        raise RuntimeError(
            "Banco incorreto. Os testes exigem estoque_pdv_test."
        )

    # Importações feitas somente após carregar .env.test.
    from app.core.config import settings
    from app.core.dependencies import obter_usuario_atual
    from app.main import app

    if settings.MONGODB_DATABASE != "estoque_pdv_test":
        raise RuntimeError(
            "A aplicação foi inicializada com o banco incorreto."
        )

    mongo = MongoClient(
        settings.MONGODB_URL,
        serverSelectionTimeoutMS=3000,
    )

    try:
        mongo.admin.command("ping")
        banco = mongo[settings.MONGODB_DATABASE]

        app.dependency_overrides[obter_usuario_atual] = (
            lambda: USUARIO_TESTE
        )

        # O contexto inicia a aplicação e a conexão Motor real.
        with TestClient(app) as cliente:
            yield cliente, banco

    finally:
        app.dependency_overrides.pop(obter_usuario_atual, None)
        mongo.close()


@pytest.fixture
def produto_integracao(cliente_integracao):
    _, banco = cliente_integracao

    # Limpa exclusivamente os registros deste produto de teste.
    banco.movimentacoes.delete_many({"produto_id": PRODUTO_ID})
    banco.produtos.delete_many({"id": PRODUTO_ID})

    banco.produtos.insert_one({
        "id": PRODUTO_ID,
        "nome": "Produto de integração",
        "ativo": True,
        "quantidade_estoque": 10.0,
    })

    yield banco

    # Remove apenas os registros pertencentes a este teste.
    banco.movimentacoes.delete_many({"produto_id": PRODUTO_ID})
    banco.produtos.delete_many({"id": PRODUTO_ID})


def dados_movimentacao(tipo, quantidade):
    return {
        "produto_id": PRODUTO_ID,
        "tipo": tipo,
        "quantidade": quantidade,
        "motivo": "Teste de integração",
    }


def test_entrada_persiste_estoque_e_movimentacao(
    cliente_integracao, produto_integracao
):
    cliente, banco = cliente_integracao

    resposta = cliente.post(
        "/api/movimentacoes",
        json=dados_movimentacao("entrada", 5),
    )

    assert resposta.status_code == 201

    produto = banco.produtos.find_one({"id": PRODUTO_ID})
    movimentacao = banco.movimentacoes.find_one({
        "produto_id": PRODUTO_ID,
        "tipo": "entrada",
    })

    assert produto["quantidade_estoque"] == 15
    assert movimentacao is not None
    assert movimentacao["saldo_anterior"] == 10
    assert movimentacao["saldo_posterior"] == 15


def test_saida_persiste_estoque_e_movimentacao(
    cliente_integracao, produto_integracao
):
    cliente, banco = cliente_integracao

    resposta = cliente.post(
        "/api/movimentacoes",
        json=dados_movimentacao("saida", 3),
    )

    assert resposta.status_code == 201

    produto = banco.produtos.find_one({"id": PRODUTO_ID})
    movimentacao = banco.movimentacoes.find_one({
        "produto_id": PRODUTO_ID,
        "tipo": "saida",
    })

    assert produto["quantidade_estoque"] == 7
    assert movimentacao is not None
    assert movimentacao["saldo_anterior"] == 10
    assert movimentacao["saldo_posterior"] == 7


def test_saida_acima_do_estoque_nao_altera_banco(
    cliente_integracao, produto_integracao
):
    cliente, banco = cliente_integracao

    resposta = cliente.post(
        "/api/movimentacoes",
        json=dados_movimentacao("saida", 11),
    )

    assert resposta.status_code == 409

    produto = banco.produtos.find_one({"id": PRODUTO_ID})
    movimentacoes = list(
        banco.movimentacoes.find({"produto_id": PRODUTO_ID})
    )

    assert produto["quantidade_estoque"] == 10
    assert movimentacoes == []
