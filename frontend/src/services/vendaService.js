import api from "./authService";

export async function registrarVenda(dados) {
  const response = await api.post("/vendas", dados);
  return response.data;
}

export async function listarVendas(filtros = {}) {
  const response = await api.get("/vendas", {
    params: filtros,
  });

  return response.data;
}

export async function buscarVenda(id) {
  const response = await api.get(`/vendas/${id}`);
  return response.data;
}
