import api from "./authService";

export async function consultarCaixaAtual() {
  const resposta = await api.get("/caixa/atual");
  return resposta.data;
}

export async function abrirCaixa(valorInicial) {
  const resposta = await api.post("/caixa/abertura", {
    valor_inicial: Number(valorInicial),
  });

  return resposta.data;
}

export async function registrarMovimentacaoCaixa(dados) {
  const resposta = await api.post("/caixa/movimentacoes", {
    tipo: dados.tipo,
    valor: Number(dados.valor),
    motivo: dados.motivo.trim(),
  });

  return resposta.data;
}

export async function fecharCaixa(valorContado) {
  const resposta = await api.post("/caixa/fechamento", {
    valor_contado: Number(valorContado),
  });

  return resposta.data;
}

export async function listarMovimentacoesCaixa(limite = 100) {
  const resposta = await api.get("/caixa/movimentacoes", {
    params: { limite },
  });

  return resposta.data;
}

export async function listarHistoricoCaixa(limite = 50) {
  const resposta = await api.get("/caixa/historico", {
    params: { limite },
  });

  return resposta.data;
}
