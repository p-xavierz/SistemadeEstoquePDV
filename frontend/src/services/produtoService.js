import api from "./authService";

export async function listarProdutos(filtros = {}) {
  const response = await api.get("/produtos", {
    params: filtros,
  });

  return response.data;
}

export async function buscarProduto(id) {
  const response = await api.get(`/produtos/${id}`);
  return response.data;
}

export async function cadastrarProduto(dados) {
  const response = await api.post("/produtos", dados);
  return response.data;
}

export async function atualizarProduto(id, dados) {
  const response = await api.put(`/produtos/${id}`, dados);
  return response.data;
}

export async function excluirProduto(id) {
  const response = await api.delete(`/produtos/${id}`);
  return response.data;
}
