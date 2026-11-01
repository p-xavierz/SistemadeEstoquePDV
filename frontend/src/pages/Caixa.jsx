import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Clock3,
  History,
  LockKeyhole,
  LockKeyholeOpen,
  RefreshCw,
  Wallet,
} from "lucide-react";

import {
  abrirCaixa,
  consultarCaixaAtual,
  fecharCaixa,
  listarHistoricoCaixa,
  registrarMovimentacaoCaixa,
} from "../services/caixaService";

import "./Caixa.css";

const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const dataHora = (valor) => {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleString("pt-BR");
};

function mensagemErro(erro) {
  const detalhe = erro?.response?.data?.detail;

  if (typeof detalhe === "string") return detalhe;

  if (Array.isArray(detalhe)) {
    return detalhe.map((item) => item.msg).join(", ");
  }

  return "Não foi possível concluir a operação. Verifique a conexão com a API.";
}

export default function Caixa() {
  const [dados, setDados] = useState({
    aberto: false,
    caixa: null,
    resumo: null,
  });

  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [valorInicial, setValorInicial] = useState("0,00");
  const [tipoMovimentacao, setTipoMovimentacao] = useState("entrada");
  const [valorMovimentacao, setValorMovimentacao] = useState("");
  const [motivo, setMotivo] = useState("");
  const [valorContado, setValorContado] = useState("");

  const carregarDados = useCallback(async (mostrarCarregamento = true) => {
    if (mostrarCarregamento) {
      setCarregando(true);
    }

    setErro("");

    try {
      const [atual, listaHistorico] = await Promise.all([
        consultarCaixaAtual(),
        listarHistoricoCaixa(50),
      ]);

      setDados(atual);

      const lista = Array.isArray(listaHistorico)
        ? listaHistorico
        : (listaHistorico?.historico ?? listaHistorico?.caixas ?? []);

      setHistorico(lista);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      if (mostrarCarregamento) {
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    // Executa a primeira consulta em uma tarefa assíncrona.
    const inicial = window.setTimeout(() => {
      carregarDados();
    }, 0);

    // Atualiza quando o usuário retorna à aba.
    function aoVoltarParaPagina() {
      if (document.visibilityState === "visible") {
        carregarDados(false);
      }
    }

    document.addEventListener("visibilitychange", aoVoltarParaPagina);

    // Atualiza automaticamente a cada 5 segundos.
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        carregarDados(false);
      }
    }, 5000);

    return () => {
      window.clearTimeout(inicial);
      window.clearInterval(intervalo);

      document.removeEventListener("visibilitychange", aoVoltarParaPagina);
    };
  }, [carregarDados]);

  async function executarOperacao(operacao, mensagem) {
    setErro("");
    setSucesso("");
    setSalvando(true);

    try {
      await operacao();
      setSucesso(mensagem);
      await carregarDados();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  function converterValor(valor) {
    const normalizado = String(valor)
      .trim()
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    return Number(normalizado);
  }

  async function handleAbrirCaixa(e) {
    e.preventDefault();

    const valor = converterValor(valorInicial);

    if (!Number.isFinite(valor) || valor < 0) {
      setErro("Informe um valor inicial válido.");
      return;
    }

    await executarOperacao(
      () => abrirCaixa(valor),
      "Caixa aberto com sucesso.",
    );
  }

  async function handleMovimentacao(e) {
    e.preventDefault();

    const valor = converterValor(valorMovimentacao);

    if (!Number.isFinite(valor) || valor <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }

    if (motivo.trim().length < 3) {
      setErro("Informe um motivo com pelo menos 3 caracteres.");
      return;
    }

    await executarOperacao(
      () =>
        registrarMovimentacaoCaixa({
          tipo: tipoMovimentacao,
          valor,
          motivo,
        }),
      tipoMovimentacao === "entrada"
        ? "Entrada registrada com sucesso."
        : "Saída registrada com sucesso.",
    );

    setValorMovimentacao("");
    setMotivo("");
  }

  async function handleFecharCaixa(e) {
    e.preventDefault();

    const valor = converterValor(valorContado);

    if (!Number.isFinite(valor) || valor < 0) {
      setErro("Informe o valor contado corretamente.");
      return;
    }

    const confirmar = window.confirm(
      `Deseja fechar o caixa com ${moeda(valor)} contados?`,
    );

    if (!confirmar) return;

    await executarOperacao(
      () => fecharCaixa(valor),
      "Caixa fechado com sucesso.",
    );

    setValorContado("");
  }

  const resumo = dados.resumo || {};
  const caixa = dados.caixa;
  const aberto = dados.aberto;

  return (
    <main className="caixa-page">
      <header className="caixa-header">
        <div>
          <span className="caixa-eyebrow">FINANCEIRO</span>
          <h1>Controle de Caixa</h1>
          <p>Acompanhe entradas, saídas, vendas e o fechamento diário.</p>
        </div>

        <button
          type="button"
          className="caixa-button caixa-button-secondary"
          onClick={carregarDados}
          disabled={carregando || salvando}
        >
          <RefreshCw size={17} />
          Atualizar
        </button>
      </header>

      {erro && (
        <div className="caixa-alerta caixa-alerta-erro" role="alert">
          <AlertCircle size={19} />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="caixa-alerta caixa-alerta-sucesso" role="status">
          <span>{sucesso}</span>
        </div>
      )}

      {carregando ? (
        <div className="caixa-loading">
          <RefreshCw size={22} />
          <span>Carregando informações do caixa...</span>
        </div>
      ) : (
        <>
          <section className="caixa-status-card">
            <div className="caixa-status-icon">
              {aberto ? (
                <LockKeyholeOpen size={26} />
              ) : (
                <LockKeyhole size={26} />
              )}
            </div>

            <div className="caixa-status-info">
              <span className="caixa-label">STATUS DO CAIXA</span>
              <h2>{aberto ? "Caixa aberto" : "Caixa fechado"}</h2>
              <p>
                {aberto
                  ? `Aberto em ${dataHora(caixa?.aberto_em)}`
                  : "Abra o caixa para começar a registrar vendas e movimentações."}
              </p>
            </div>

            <span
              className={`caixa-status-badge ${
                aberto ? "status-aberto" : "status-fechado"
              }`}
            >
              {aberto ? "Em operação" : "Encerrado"}
            </span>
          </section>

          {!aberto ? (
            <section className="caixa-panel caixa-abertura-panel">
              <div className="caixa-panel-title">
                <Wallet size={21} />
                <div>
                  <h2>Abrir novo caixa</h2>
                  <p>Informe o dinheiro disponível no início da operação.</p>
                </div>
              </div>

              <form onSubmit={handleAbrirCaixa} className="caixa-form">
                <label htmlFor="valor-inicial">Valor inicial (R$)</label>
                <input
                  id="valor-inicial"
                  type="text"
                  inputMode="decimal"
                  value={valorInicial}
                  onChange={(e) => setValorInicial(e.target.value)}
                  placeholder="Ex.: 100,00"
                  required
                />

                <button
                  className="caixa-button caixa-button-primary"
                  type="submit"
                  disabled={salvando}
                >
                  <LockKeyholeOpen size={17} />
                  {salvando ? "Abrindo..." : "Abrir caixa"}
                </button>
              </form>
            </section>
          ) : (
            <>
              <section className="caixa-metricas">
                <article className="caixa-metrica">
                  <div className="caixa-metrica-icon">
                    <Wallet size={21} />
                  </div>
                  <span>Saldo esperado em dinheiro</span>
                  <strong>{moeda(resumo.saldo_esperado)}</strong>
                  <small>
                    Valor inicial + vendas em dinheiro + entradas − saídas
                  </small>
                </article>

                <article className="caixa-metrica">
                  <div className="caixa-metrica-icon">
                    <Banknote size={21} />
                  </div>
                  <span>Valor inicial</span>
                  <strong>{moeda(caixa?.valor_inicial)}</strong>
                  <small>Valor informado na abertura</small>
                </article>

                <article className="caixa-metrica">
                  <div className="caixa-metrica-icon metrica-entrada">
                    <ArrowUpCircle size={21} />
                  </div>
                  <span>Total de entradas</span>
                  <strong>{moeda(resumo.total_entradas)}</strong>
                  <small>Entradas financeiras manuais</small>
                </article>

                <article className="caixa-metrica">
                  <div className="caixa-metrica-icon metrica-saida">
                    <ArrowDownCircle size={21} />
                  </div>
                  <span>Total de saídas</span>
                  <strong>{moeda(resumo.total_saidas)}</strong>
                  <small>Saídas financeiras manuais</small>
                </article>
              </section>

              <section className="caixa-panel">
                <div className="caixa-panel-title">
                  <Banknote size={21} />
                  <div>
                    <h2>Resumo das vendas</h2>
                    <p>Valores das vendas vinculadas a este caixa.</p>
                  </div>
                </div>

                <div className="caixa-vendas-grid">
                  <div>
                    <span>Dinheiro</span>
                    <strong>{moeda(resumo.vendas_dinheiro)}</strong>
                  </div>
                  <div>
                    <span>Pix</span>
                    <strong>{moeda(resumo.vendas_pix)}</strong>
                  </div>
                  <div>
                    <span>Cartão de crédito</span>
                    <strong>{moeda(resumo.vendas_cartao_credito)}</strong>
                  </div>
                  <div>
                    <span>Cartão de débito</span>
                    <strong>{moeda(resumo.vendas_cartao_debito)}</strong>
                  </div>
                  <div>
                    <span>Transferência</span>
                    <strong>{moeda(resumo.vendas_transferencia)}</strong>
                  </div>
                  <div className="caixa-total-vendas">
                    <span>Total vendido</span>
                    <strong>{moeda(resumo.total_vendas)}</strong>
                    <small>{resumo.quantidade_vendas || 0} venda(s)</small>
                  </div>
                </div>
              </section>

              <section className="caixa-duas-colunas">
                <div className="caixa-panel">
                  <div className="caixa-panel-title">
                    <ArrowUpCircle size={21} />
                    <div>
                      <h2>Nova movimentação</h2>
                      <p>Registre reforços, despesas ou retiradas.</p>
                    </div>
                  </div>

                  <form onSubmit={handleMovimentacao} className="caixa-form">
                    <label htmlFor="tipo-movimentacao">Tipo</label>
                    <select
                      id="tipo-movimentacao"
                      value={tipoMovimentacao}
                      onChange={(e) => setTipoMovimentacao(e.target.value)}
                    >
                      <option value="entrada">Entrada de dinheiro</option>
                      <option value="saida">Saída de dinheiro</option>
                    </select>

                    <label htmlFor="valor-movimentacao">Valor (R$)</label>
                    <input
                      id="valor-movimentacao"
                      type="text"
                      inputMode="decimal"
                      value={valorMovimentacao}
                      onChange={(e) => setValorMovimentacao(e.target.value)}
                      placeholder="Ex.: 50,00"
                      required
                    />

                    <label htmlFor="motivo-movimentacao">Motivo</label>
                    <input
                      id="motivo-movimentacao"
                      type="text"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ex.: Reforço de troco"
                      maxLength={250}
                      required
                    />

                    <button
                      type="submit"
                      className="caixa-button caixa-button-primary"
                      disabled={salvando}
                    >
                      {salvando ? "Salvando..." : "Registrar movimentação"}
                    </button>
                  </form>
                </div>

                <div className="caixa-panel">
                  <div className="caixa-panel-title">
                    <LockKeyhole size={21} />
                    <div>
                      <h2>Fechamento do caixa</h2>
                      <p>Informe o valor contado fisicamente.</p>
                    </div>
                  </div>

                  <div className="caixa-fechamento-resumo">
                    <span>Saldo esperado em dinheiro</span>
                    <strong>{moeda(resumo.saldo_esperado)}</strong>
                    <p>Considere apenas o dinheiro físico ao contar o caixa.</p>
                  </div>

                  <form onSubmit={handleFecharCaixa} className="caixa-form">
                    <label htmlFor="valor-contado">Valor contado (R$)</label>
                    <input
                      id="valor-contado"
                      type="text"
                      inputMode="decimal"
                      value={valorContado}
                      onChange={(e) => setValorContado(e.target.value)}
                      placeholder="Ex.: 350,00"
                      required
                    />

                    <button
                      type="submit"
                      className="caixa-button caixa-button-danger"
                      disabled={salvando}
                    >
                      <LockKeyhole size={17} />
                      {salvando ? "Fechando..." : "Fechar caixa"}
                    </button>
                  </form>
                </div>
              </section>

              <section className="caixa-panel">
                <div className="caixa-panel-title">
                  <History size={21} />
                  <div>
                    <h2>Movimentações recentes</h2>
                    <p>Entradas e saídas registradas nesta sessão.</p>
                  </div>
                </div>

                {!resumo.movimentacoes?.length ? (
                  <p className="caixa-vazio">
                    Nenhuma movimentação financeira registrada neste caixa.
                  </p>
                ) : (
                  <div className="caixa-tabela-wrapper">
                    <table className="caixa-tabela">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Tipo</th>
                          <th>Motivo</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumo.movimentacoes.map((item) => (
                          <tr key={item.id}>
                            <td>{dataHora(item.criado_em)}</td>
                            <td>
                              <span
                                className={`caixa-tipo ${
                                  item.tipo === "entrada"
                                    ? "tipo-entrada"
                                    : "tipo-saida"
                                }`}
                              >
                                {item.tipo === "entrada" ? "Entrada" : "Saída"}
                              </span>
                            </td>
                            <td>{item.motivo}</td>
                            <td
                              className={
                                item.tipo === "entrada"
                                  ? "valor-positivo"
                                  : "valor-negativo"
                              }
                            >
                              {item.tipo === "saida" ? "− " : "+ "}
                              {moeda(item.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          <section className="caixa-panel">
            <div className="caixa-panel-title">
              <Clock3 size={21} />
              <div>
                <h2>Histórico de caixas</h2>
                <p>Consulte as sessões anteriores e seus resultados.</p>
              </div>
            </div>

            {!historico.length ? (
              <p className="caixa-vazio">Nenhum caixa no histórico.</p>
            ) : (
              <div className="caixa-tabela-wrapper">
                <table className="caixa-tabela">
                  <thead>
                    <tr>
                      <th>Abertura</th>
                      <th>Fechamento</th>
                      <th>Status</th>
                      <th>Valor inicial</th>
                      <th>Valor contado</th>
                      <th>Diferença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((item) => (
                      <tr key={item.id}>
                        <td>{dataHora(item.aberto_em)}</td>
                        <td>{dataHora(item.fechado_em)}</td>
                        <td>
                          <span
                            className={`caixa-status-badge ${
                              item.status === "aberto"
                                ? "status-aberto"
                                : "status-fechado"
                            }`}
                          >
                            {item.status === "aberto" ? "Aberto" : "Fechado"}
                          </span>
                        </td>
                        <td>{moeda(item.valor_inicial)}</td>
                        <td>
                          {item.valor_contado == null
                            ? "—"
                            : moeda(item.valor_contado)}
                        </td>
                        <td
                          className={
                            Number(item.diferenca) < 0
                              ? "valor-negativo"
                              : Number(item.diferenca) > 0
                                ? "valor-positivo"
                                : ""
                          }
                        >
                          {item.diferenca == null ? "—" : moeda(item.diferenca)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
