import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  CheckCircle2,
  History,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { listarProdutos } from "../services/produtoService";
import {
  listarMovimentacoes,
  cadastrarMovimentacao,
} from "../services/movimentacaoService";

import "./Movimentacoes.css";

const formularioInicial = {
  produto_id: "",
  tipo: "entrada",
  quantidade: "",
  motivo: "",
};

function mensagemErro(error) {
  const detalhe = error.response?.data?.detail;

  if (typeof detalhe === "string") return detalhe;

  if (Array.isArray(detalhe)) {
    return detalhe.map((item) => item.msg).join(" ");
  }

  return "Não foi possível concluir a operação. Verifique se o backend está conectado.";
}

function formatarData(valor) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarQuantidade(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });
}

function Movimentacoes() {
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);

  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroProduto, setFiltroProduto] = useState("");
  const [busca, setBusca] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const [listaProdutos, listaMovimentacoes] = await Promise.all([
        listarProdutos(),
        listarMovimentacoes({
          tipo: filtroTipo,
          produto_id: filtroProduto,
        }),
      ]);

      setProdutos(listaProdutos);
      setMovimentacoes(listaMovimentacoes);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }, [filtroTipo, filtroProduto]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const movimentacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    if (!termo) return movimentacoes;

    return movimentacoes.filter((movimentacao) => {
      return (
        (movimentacao.produto_nome || "")
          .toLocaleLowerCase("pt-BR")
          .includes(termo) ||
        (movimentacao.motivo || "").toLocaleLowerCase("pt-BR").includes(termo)
      );
    });
  }, [movimentacoes, busca]);

  const totalEntradas = useMemo(
    () =>
      movimentacoesFiltradas
        .filter((item) => item.tipo === "entrada")
        .reduce((total, item) => total + Number(item.quantidade || 0), 0),
    [movimentacoesFiltradas],
  );

  const totalSaidas = useMemo(
    () =>
      movimentacoesFiltradas
        .filter((item) => item.tipo === "saida")
        .reduce((total, item) => total + Number(item.quantidade || 0), 0),
    [movimentacoesFiltradas],
  );

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function salvarMovimentacao(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const quantidade = Number(formulario.quantidade);
    const produto = produtos.find((item) => item.id === formulario.produto_id);

    if (!produto) {
      setErro("Selecione um produto ativo.");
      return;
    }

    if (
      formulario.quantidade === "" ||
      !Number.isFinite(quantidade) ||
      quantidade <= 0
    ) {
      setErro("Informe uma quantidade maior que zero.");
      return;
    }

    if (formulario.motivo.trim().length < 3) {
      setErro("Informe um motivo com pelo menos 3 caracteres.");
      return;
    }

    if (
      formulario.tipo === "saida" &&
      quantidade > Number(produto.quantidade_estoque)
    ) {
      setErro(
        `Estoque insuficiente. Saldo disponível: ${formatarQuantidade(
          produto.quantidade_estoque,
        )}.`,
      );
      return;
    }

    setSalvando(true);

    try {
      const resultado = await cadastrarMovimentacao({
        produto_id: formulario.produto_id,
        tipo: formulario.tipo,
        quantidade,
        motivo: formulario.motivo.trim(),
      });

      setSucesso(
        `${formulario.tipo === "entrada" ? "Entrada" : "Saída"} registrada. ` +
          `Saldo atualizado: ${formatarQuantidade(resultado.saldo_posterior)}.`,
      );

      setFormulario(formularioInicial);
      await carregarDados();
    } catch (error) {
      setErro(mensagemErro(error));
      await carregarDados();
    } finally {
      setSalvando(false);
    }
  }

  const saldoSelecionado = produtos.find(
    (produto) => produto.id === formulario.produto_id,
  );

  return (
    <main className="movimentacoes-page">
      <header className="movimentacoes-header">
        <div>
          <span className="movimentacoes-breadcrumb">GESTÃO DE ESTOQUE</span>
          <h1>Movimentações</h1>
          <p>Registre entradas e saídas e acompanhe o histórico do estoque.</p>
        </div>

        <button
          type="button"
          className="mov-botao-secundario"
          onClick={carregarDados}
          disabled={carregando}
        >
          <RefreshCw size={17} />
          Atualizar dados
        </button>
      </header>

      {erro && (
        <div className="mov-mensagem erro" role="alert">
          <AlertTriangle size={18} />
          <span>{erro}</span>
          <button type="button" onClick={() => setErro("")} aria-label="Fechar">
            <X size={17} />
          </button>
        </div>
      )}

      {sucesso && (
        <div className="mov-mensagem sucesso" role="status">
          <CheckCircle2 size={18} />
          <span>{sucesso}</span>
          <button
            type="button"
            onClick={() => setSucesso("")}
            aria-label="Fechar"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="mov-resumo">
        <article className="mov-resumo-card">
          <div className="mov-resumo-icone entradas">
            <ArrowDownToLine size={23} />
          </div>
          <div>
            <span>Quantidade em entradas</span>
            <strong>{formatarQuantidade(totalEntradas)}</strong>
            <small>Somatório dos registros exibidos</small>
          </div>
        </article>

        <article className="mov-resumo-card">
          <div className="mov-resumo-icone saidas">
            <ArrowUpFromLine size={23} />
          </div>
          <div>
            <span>Quantidade em saídas</span>
            <strong>{formatarQuantidade(totalSaidas)}</strong>
            <small>Somatório dos registros exibidos</small>
          </div>
        </article>

        <article className="mov-resumo-card">
          <div className="mov-resumo-icone historico">
            <History size={23} />
          </div>
          <div>
            <span>Movimentações listadas</span>
            <strong>{movimentacoesFiltradas.length}</strong>
            <small>Até 500 registros por consulta</small>
          </div>
        </article>
      </section>

      <section className="mov-cadastro-card">
        <div className="mov-secao-titulo">
          <div className="mov-titulo-icone">
            <ArrowDownToLine size={21} />
          </div>
          <div>
            <h2>Registrar movimentação</h2>
            <p>Informe o produto, o tipo e a quantidade movimentada.</p>
          </div>
        </div>

        <form className="mov-formulario" onSubmit={salvarMovimentacao}>
          <div className="mov-campos-grid">
            <label className="campo-mov campo-largo">
              Produto *
              <select
                name="produto_id"
                value={formulario.produto_id}
                onChange={atualizarCampo}
                required
              >
                <option value="">Selecione um produto</option>
                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} — Estoque:{" "}
                    {formatarQuantidade(produto.quantidade_estoque)}
                  </option>
                ))}
              </select>
            </label>

            {saldoSelecionado && (
              <div className="mov-saldo-atual campo-largo">
                <span>Saldo atual do produto selecionado</span>
                <strong>
                  {formatarQuantidade(saldoSelecionado.quantidade_estoque)}
                </strong>
              </div>
            )}

            <label className="campo-mov">
              Tipo de movimentação *
              <select
                name="tipo"
                value={formulario.tipo}
                onChange={atualizarCampo}
                required
              >
                <option value="entrada">Entrada de estoque</option>
                <option value="saida">Saída de estoque</option>
              </select>
            </label>

            <label className="campo-mov">
              Quantidade *
              <input
                type="number"
                name="quantidade"
                value={formulario.quantidade}
                onChange={atualizarCampo}
                min="0.001"
                step="0.001"
                required
                placeholder="Ex.: 10"
              />
            </label>

            <label className="campo-mov campo-largo">
              Motivo da movimentação *
              <textarea
                name="motivo"
                value={formulario.motivo}
                onChange={atualizarCampo}
                minLength={3}
                maxLength={250}
                rows={3}
                required
                placeholder="Ex.: Reposição de mercadoria, venda, perda ou ajuste de inventário."
              />
            </label>
          </div>

          <div className="mov-formulario-rodape">
            <p>
              O saldo será atualizado automaticamente após a confirmação da
              movimentação.
            </p>

            <button
              type="submit"
              className="mov-botao-principal"
              disabled={salvando || produtos.length === 0}
            >
              {salvando
                ? "Registrando..."
                : formulario.tipo === "entrada"
                  ? "Registrar entrada"
                  : "Registrar saída"}
            </button>
          </div>

          {produtos.length === 0 && !carregando && (
            <p className="mov-aviso">
              Cadastre ao menos um produto ativo antes de registrar uma
              movimentação.
            </p>
          )}
        </form>
      </section>

      <section className="mov-historico-card">
        <div className="mov-historico-topo">
          <div>
            <h2>Histórico de movimentações</h2>
            <p>Consulte o tipo, o motivo e os saldos de cada operação.</p>
          </div>
        </div>

        <div className="mov-filtros">
          <label className="mov-busca">
            <Search size={18} />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar produto ou motivo..."
            />
          </label>

          <select
            aria-label="Filtrar por produto"
            value={filtroProduto}
            onChange={(event) => setFiltroProduto(event.target.value)}
          >
            <option value="">Todos os produtos</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por tipo"
            value={filtroTipo}
            onChange={(event) => setFiltroTipo(event.target.value)}
          >
            <option value="">Entradas e saídas</option>
            <option value="entrada">Somente entradas</option>
            <option value="saida">Somente saídas</option>
          </select>
        </div>

        <div className="mov-tabela-container">
          <table className="mov-tabela">
            <thead>
              <tr>
                <th>Data e hora</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Saldo anterior</th>
                <th>Saldo posterior</th>
                <th>Motivo</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan="7" className="mov-vazio">
                    Carregando histórico...
                  </td>
                </tr>
              ) : movimentacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="mov-vazio">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              ) : (
                movimentacoesFiltradas.map((item) => {
                  const entrada = item.tipo === "entrada";

                  return (
                    <tr key={item.id}>
                      <td>{formatarData(item.criado_em)}</td>

                      <td>
                        <strong className="mov-produto-nome">
                          {item.produto_nome}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`mov-tipo ${
                            entrada ? "entrada" : "saida"
                          }`}
                        >
                          {entrada ? (
                            <ArrowDownToLine size={14} />
                          ) : (
                            <ArrowUpFromLine size={14} />
                          )}
                          {entrada ? "Entrada" : "Saída"}
                        </span>
                      </td>

                      <td>
                        <strong
                          className={
                            entrada ? "mov-valor-entrada" : "mov-valor-saida"
                          }
                        >
                          {entrada ? "+" : "−"}
                          {formatarQuantidade(item.quantidade)}
                        </strong>
                      </td>

                      <td>{formatarQuantidade(item.saldo_anterior)}</td>
                      <td>
                        <strong>
                          {formatarQuantidade(item.saldo_posterior)}
                        </strong>
                      </td>
                      <td className="mov-motivo">{item.motivo}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Movimentacoes;
