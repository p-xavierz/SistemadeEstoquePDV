import api from "./authService";

export async function listarMovimentacoes(filtros = {}) {
  const params = {
    limite: 500,
  };

  if (filtros.produto_id) {
    params.produto_id = filtros.produto_id;
  }

  if (filtros.tipo) {
    params.tipo = filtros.tipo;
  }

  const response = await api.get("/movimentacoes", { params });
  return response.data;
}

export async function cadastrarMovimentacao(dados) {
  const response = await api.post("/movimentacoes", dados);
  return response.data;
}
