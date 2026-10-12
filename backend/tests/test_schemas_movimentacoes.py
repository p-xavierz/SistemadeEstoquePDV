
import pytest
from pydantic import ValidationError

from app.schemas.movimentacoes import MovimentacaoCreate


def dados_validos():
    return {
        "produto_id": "produto-teste",
        "tipo": "entrada",
        "quantidade": 5,
        "motivo": "Reposição de estoque",
    }


def test_movimentacao_valida():
    movimentacao = MovimentacaoCreate(**dados_validos())

    assert movimentacao.produto_id == "produto-teste"
    assert movimentacao.tipo == "entrada"
    assert movimentacao.quantidade == 5


def test_rejeita_quantidade_zero():
    dados = dados_validos()
    dados["quantidade"] = 0

    with pytest.raises(ValidationError):
        MovimentacaoCreate(**dados)


def test_rejeita_quantidade_negativa():
    dados = dados_validos()
    dados["quantidade"] = -3

    with pytest.raises(ValidationError):
        MovimentacaoCreate(**dados)


def test_rejeita_tipo_invalido():
    dados = dados_validos()
    dados["tipo"] = "transferencia"

    with pytest.raises(ValidationError):
        MovimentacaoCreate(**dados)


def test_rejeita_motivo_muito_curto():
    dados = dados_validos()
    dados["motivo"] = "oi"

    with pytest.raises(ValidationError):
        MovimentacaoCreate(**dados)
