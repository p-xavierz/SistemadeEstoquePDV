
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_movimentacoes_sem_token_retornam_401():
    response = client.get("/api/movimentacoes")

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Token inválido ou expirado."
    }


def test_movimentacoes_com_token_invalido_retornam_401():
    response = client.get(
        "/api/movimentacoes",
        headers={"Authorization": "Bearer token-invalido"},
    )

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Token inválido ou expirado."
    }
