
from copy import deepcopy
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.dependencies import obter_usuario_atual
import app.routers.movimentacoes as rotas_movimentacoes


PRODUTO_ID = "produto-teste-001"
USUARIO = {"id": "usuario-teste-001", "ativo": True}


class TransacaoFalsa:
    def __init__(self, banco):
        self.banco = banco
        self.produto_original = None
        self.movimentacoes_originais = None

    async def __aenter__(self):
        self.produto_original = deepcopy(self.banco.produtos.produto)
        self.movimentacoes_originais = deepcopy(
            self.banco.movimentacoes.registros
        )
        return self

    async def __aexit__(self, tipo_erro, erro, traceback):
        if tipo_erro is not None:
            self.banco.produtos.produto = self.produto_original
            self.banco.movimentacoes.registros = (
                self.movimentacoes_originais
            )
        return False


class SessaoFalsa:
    def __init__(self, banco):
        self.banco = banco

    async def __aenter__(self):
        return self

    async def __aexit__(self, tipo_erro, erro, traceback):
        return False

    def start_transaction(self):
        return TransacaoFalsa(self.banco)


class ClienteFalso:
    def __init__(self, banco):
        self.banco = banco

    async def start_session(self):
        return SessaoFalsa(self.banco)


class ProdutosFalsos:
    def __init__(self):
        self.produto = {
            "id": PRODUTO_ID,
            "nome": "Produto de teste",
            "ativo": True,
            "quantidade_estoque": 10.0,
        }

    async def find_one_and_update(
        self, filtro, atualizacao, return_document=None, session=None
    ):
        produto = self.produto

        if produto["id"] != filtro.get("id"):
            return None

        if produto.get("ativo") is not True:
            return None

        estoque_minimo = filtro.get("quantidade_estoque", {}).get("$gte")

        if (
            estoque_minimo is not None
            and produto["quantidade_estoque"] < estoque_minimo
        ):
            return None

        anterior = deepcopy(produto)

        variacao = atualizacao["$inc"]["quantidade_estoque"]
        produto["quantidade_estoque"] += variacao

        return anterior

    async def find_one(self, filtro, session=None):
        produto = self.produto

        if (
            produto["id"] == filtro.get("id")
            and produto.get("ativo") is True
        ):
            return deepcopy(produto)

        return None

    async def update_one(self, filtro, atualizacao, session=None):
        if self.produto["id"] == filtro.get("id"):
            self.produto.update(atualizacao["$set"])


class MovimentacoesFalsas:
    def __init__(self):
        self.registros = []

    async def insert_one(self, documento, session=None):
        self.registros.append(deepcopy(documento))


class BancoFalso:
    def __init__(self):
        self.produtos = ProdutosFalsos()
        self.movimentacoes = MovimentacoesFalsas()



@pytest.fixture
def ambiente_teste(monkeypatch):
    banco = BancoFalso()

    monkeypatch.setattr(rotas_movimentacoes, "database", banco)
    monkeypatch.setattr(
        rotas_movimentacoes, "client", ClienteFalso(banco)
    )

    app.dependency_overrides[obter_usuario_atual] = lambda: USUARIO

    # Não usar "with": assim o TestClient não inicia o lifespan
    # que abre e fecha a conexão real com o MongoDB.
    cliente = TestClient(app)

    try:
        yield cliente, banco
    finally:
        app.dependency_overrides.pop(obter_usuario_atual, None)


def dados_movimentacao(tipo="entrada", quantidade=5):
    return {
        "produto_id": PRODUTO_ID,
        "tipo": tipo,
        "quantidade": quantidade,
        "motivo": "Reposição para teste",
    }


def test_entrada_atualiza_saldo_e_registra_movimentacao(
    ambiente_teste,
):
    cliente, banco = ambiente_teste

    resposta = cliente.post(
        "/api/movimentacoes",
        json=dados_movimentacao("entrada", 5),
    )

    assert resposta.status_code == 201
    assert banco.produtos.produto["quantidade_estoque"] == 15
    assert len(banco.movimentacoes.registros) == 1

    movimentacao = resposta.json()
    assert movimentacao["saldo_anterior"] == 10
    assert movimentacao["saldo_posterior"] == 15
    assert movimentacao["tipo"] == "entrada"


def test_saida_atualiza_saldo_e_registra_movimentacao(
    ambiente_teste,
):
    cliente, banco = ambiente_teste

    resposta = cliente.post(
        "/api/movimentacoes",
        json=dados_movimentacao("saida", 3),
    )

    assert resposta.status_code == 201
    assert banco.produtos.produto["quantidade_estoque"] == 7
    assert len(banco.movimentacoes.registros) == 1

    movimentacao = resposta.json()
    assert movimentacao["saldo_anterior"] == 10
    assert movimentacao["saldo_posterior"] == 7
    assert movimentacao["tipo"] == "saida"


def test_saida_acima_do_estoque_retorna_409(
    ambiente_teste,
):
    cliente, banco = ambiente_teste

    resposta = cliente.post(
        "/api/movimentacoes",
        json=dados_movimentacao("saida", 11),
    )

    assert resposta.status_code == 409
    assert "Estoque insuficiente" in resposta.json()["detail"]
    assert banco.produtos.produto["quantidade_estoque"] == 10
    assert banco.movimentacoes.registros == []


def test_quantidade_zero_retorna_422(ambiente_teste):
    cliente, banco = ambiente_teste

    resposta = cliente.post(
        "/api/movimentacoes",
        json=dados_movimentacao("entrada", 0),
    )

    assert resposta.status_code == 422
    assert banco.produtos.produto["quantidade_estoque"] == 10
    assert banco.movimentacoes.registros == []


def test_tipo_invalido_retorna_422(ambiente_teste):
    cliente, banco = ambiente_teste

    resposta = cliente.post(
        "/api/movimentacoes",
        json=dados_movimentacao("transferencia", 2),
    )

    assert resposta.status_code == 422
    assert banco.produtos.produto["quantidade_estoque"] == 10
    assert banco.movimentacoes.registros == []


def test_falha_ao_registrar_movimentacao_reverte_estoque(
    ambiente_teste, monkeypatch
):
    cliente, banco = ambiente_teste

    async def falhar_insert(documento, session=None):
        raise RuntimeError("Falha simulada ao registrar movimentação")

    monkeypatch.setattr(
        banco.movimentacoes, "insert_one", falhar_insert
    )

    with pytest.raises(RuntimeError):
        cliente.post(
            "/api/movimentacoes",
            json=dados_movimentacao("entrada", 5),
        )

    assert banco.produtos.produto["quantidade_estoque"] == 10
    assert banco.movimentacoes.registros == []
