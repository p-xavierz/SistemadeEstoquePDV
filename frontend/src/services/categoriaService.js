import api from "./authService";

export async function listarCategorias(incluirInativas = true) {
  const response = await api.get("/categorias", {
    params: { incluir_inativas: incluirInativas },
  });

  return response.data;
}

export async function cadastrarCategoria(dados) {
  const response = await api.post("/categorias", dados);
  return response.data;
}

export async function atualizarCategoria(id, dados) {
  const response = await api.put(`/categorias/${id}`, dados);
  return response.data;
}

export async function desativarCategoria(id) {
  const response = await api.delete(`/categorias/${id}`);
  return response.data;
}
