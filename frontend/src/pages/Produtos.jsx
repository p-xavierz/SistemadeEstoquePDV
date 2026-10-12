import { useCallback, useEffect, useState } from "react";

import {
  AlertTriangle,
  Package,
  Plus,
  Search,
  Pencil,
  Power,
  RefreshCw,
  X,
} from "lucide-react";

import {
  listarProdutos,
  cadastrarProduto,
  atualizarProduto,
  excluirProduto,
} from "../services/produtoService";

import { listarCategorias } from "../services/categoriaService";

import "./Produtos.css";

const formularioInicial = {
  nome: "",
  codigo: "",
  categoria_id: "",
  descricao: "",
  preco_custo: "",
  preco_venda: "",
  quantidade_estoque: "0",
  estoque_minimo: "0",
};

function mensagemErro(error) {
  const detalhe = error.response?.data?.detail;

  if (typeof detalhe === "string") {
    return detalhe;
  }

  if (Array.isArray(detalhe)) {
    return detalhe.map((item) => item.msg).join(" ");
  }

  return "Não foi possível concluir a operação. Verifique a conexão com o servidor.";
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarDados = useCallback(async (termo = "") => {
    setCarregando(true);
    setErro("");

    try {
      const filtros = termo.trim() ? { busca: termo.trim() } : {};

      const [listaProdutos, listaCategorias] = await Promise.all([
        listarProdutos(filtros),
        listarCategorias(),
      ]);

      setProdutos(
        Array.isArray(listaProdutos)
          ? listaProdutos
          : listaProdutos?.items || [],
      );

      setCategorias(
        Array.isArray(listaCategorias)
          ? listaCategorias
          : listaCategorias?.items || [],
      );
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function abrirCadastro() {
    setProdutoEditando(null);
    setFormulario({ ...formularioInicial });
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirEdicao(produto) {
    setProdutoEditando(produto);

    setFormulario({
      nome: produto.nome || "",
      codigo: produto.codigo || "",
      categoria_id: produto.categoria_id || "",
      descricao: produto.descricao || "",
      preco_custo: String(produto.preco_custo ?? ""),
      preco_venda: String(produto.preco_venda ?? ""),
      estoque_minimo: String(produto.estoque_minimo ?? "0"),
      quantidade_estoque: String(produto.quantidade_estoque ?? "0"),
    });

    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setProdutoEditando(null);
    setFormulario({ ...formularioInicial });
    setErro("");
  }

  async function salvarProduto(event) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    const dados = {
      nome: formulario.nome.trim(),
      codigo: formulario.codigo.trim(),
      categoria_id: formulario.categoria_id,
      descricao: formulario.descricao.trim() || null,
      preco_custo: Number(formulario.preco_custo),
      preco_venda: Number(formulario.preco_venda),
      estoque_minimo: Number(formulario.estoque_minimo),
    };

    if (
      !dados.nome ||
      !dados.codigo ||
      !dados.categoria_id ||
      formulario.preco_custo === "" ||
      formulario.preco_venda === "" ||
      formulario.estoque_minimo === ""
    ) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (
      !Number.isFinite(dados.preco_custo) ||
      !Number.isFinite(dados.preco_venda) ||
      !Number.isFinite(dados.estoque_minimo) ||
      dados.preco_custo < 0 ||
      dados.preco_venda < 0 ||
      dados.estoque_minimo < 0
    ) {
      setErro("Informe valores numéricos válidos e não negativos.");
      return;
    }

    if (!produtoEditando) {
      dados.quantidade_estoque = Number(formulario.quantidade_estoque);

      if (
        formulario.quantidade_estoque === "" ||
        !Number.isFinite(dados.quantidade_estoque) ||
        dados.quantidade_estoque < 0
      ) {
        setErro("Informe uma quantidade inicial válida.");
        return;
      }
    }

    setSalvando(true);

    try {
      if (produtoEditando) {
        await atualizarProduto(produtoEditando.id, dados);
        setSucesso("Produto atualizado com sucesso.");
      } else {
        await cadastrarProduto(dados);
        setSucesso("Produto cadastrado com sucesso.");
      }

      setModalAberto(false);
      setProdutoEditando(null);
      setFormulario({ ...formularioInicial });

      await carregarDados(busca);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function handleDesativar(produto) {
    const confirmar = window.confirm(
      `Deseja realmente desativar o produto "${produto.nome}"? Ele deixará de aparecer na listagem padrão.`,
    );

    if (!confirmar) return;

    setErro("");
    setSucesso("");

    try {
      await excluirProduto(produto.id);

      setSucesso(`Produto "${produto.nome}" desativado com sucesso.`);

      await carregarDados(busca);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <main className="produtos-page">
      <header className="produtos-header">
        <div>
          <span className="produtos-breadcrumb">GESTÃO DE ESTOQUE</span>

          <h1>Produtos</h1>

          <p>Cadastre, consulte e gerencie os produtos do seu negócio.</p>
        </div>

        <button
          type="button"
          className="produto-botao-principal"
          onClick={abrirCadastro}
        >
          <Plus size={19} />
          Novo produto
        </button>
      </header>

      {erro && !modalAberto && (
        <div className="produto-mensagem erro" role="alert">
          <AlertTriangle size={18} />
          <span>{erro}</span>

          <button type="button" onClick={() => setErro("")} aria-label="Fechar">
            <X size={17} />
          </button>
        </div>
      )}

      {sucesso && (
        <div className="produto-mensagem sucesso" role="status">
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

      <section className="produtos-resumo">
        <div className="produto-resumo-icone">
          <Package size={25} />
        </div>

        <div>
          <span>Produtos cadastrados</span>
          <strong>{produtos.length}</strong>
          <small>Itens ativos encontrados na consulta atual</small>
        </div>
      </section>

      <section className="produtos-lista-card">
        <div className="produtos-lista-topo">
          <div>
            <h2>Todos os produtos</h2>
            <p>Consulte os preços e acompanhe os níveis de estoque.</p>
          </div>

          <button
            type="button"
            className="produto-botao-secundario"
            onClick={() => carregarDados(busca)}
            disabled={carregando}
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        <form
          className="produtos-busca"
          onSubmit={(event) => {
            event.preventDefault();
            carregarDados(busca);
          }}
        >
          <Search size={19} />

          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Pesquisar por nome ou código..."
            maxLength={120}
          />

          <button type="submit">Pesquisar</button>
        </form>

        <div className="produtos-tabela-container">
          <table className="produtos-tabela">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço de venda</th>
                <th>Estoque atual</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan="6" className="produtos-vazio">
                    Carregando produtos...
                  </td>
                </tr>
              ) : produtos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="produtos-vazio">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                produtos.map((produto) => {
                  const categoria = categorias.find(
                    (item) => item.id === produto.categoria_id,
                  );

                  const estoqueBaixo =
                    Number(produto.quantidade_estoque) <=
                    Number(produto.estoque_minimo);

                  return (
                    <tr key={produto.id}>
                      <td>
                        <div className="produto-nome">
                          <strong>{produto.nome}</strong>
                          <span>Código: {produto.codigo}</span>
                        </div>
                      </td>

                      <td>{categoria?.nome || "Categoria não encontrada"}</td>

                      <td className="produto-preco">
                        {moeda(produto.preco_venda)}
                      </td>

                      <td>
                        <div
                          className={`produto-estoque ${
                            estoqueBaixo ? "baixo" : ""
                          }`}
                        >
                          {estoqueBaixo && <AlertTriangle size={15} />}

                          <strong>{produto.quantidade_estoque}</strong>

                          <span>mín. {produto.estoque_minimo}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`produto-status ${
                            estoqueBaixo ? "status-atencao" : "status-ok"
                          }`}
                        >
                          {estoqueBaixo ? "Estoque baixo" : "Disponível"}
                        </span>
                      </td>

                      <td>
                        <div className="produto-acoes">
                          <button
                            type="button"
                            className="produto-acao editar"
                            onClick={() => abrirEdicao(produto)}
                            title="Editar produto"
                            aria-label={`Editar ${produto.nome}`}
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            className="produto-acao desativar"
                            onClick={() => handleDesativar(produto)}
                            title="Desativar produto"
                            aria-label={`Desativar ${produto.nome}`}
                          >
                            <Power size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAberto && (
        <div className="produto-modal-fundo">
          <section
            className="produto-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="produto-modal-titulo"
          >
            <header className="produto-modal-header">
              <div>
                <span>GESTÃO DE ESTOQUE</span>

                <h2 id="produto-modal-titulo">
                  {produtoEditando ? "Editar produto" : "Cadastrar produto"}
                </h2>
              </div>

              <button
                type="button"
                className="produto-modal-fechar"
                onClick={fecharModal}
                disabled={salvando}
                aria-label="Fechar formulário"
              >
                <X size={21} />
              </button>
            </header>

            <form className="produto-formulario" onSubmit={salvarProduto}>
              {erro && (
                <div className="produto-mensagem erro" role="alert">
                  <AlertTriangle size={18} />
                  <span>{erro}</span>
                </div>
              )}

              <div className="produto-campos-grid">
                <label className="campo-produto campo-largo">
                  Nome do produto *
                  <input
                    name="nome"
                    value={formulario.nome}
                    onChange={atualizarCampo}
                    minLength={2}
                    maxLength={120}
                    required
                    autoFocus
                  />
                </label>

                <label className="campo-produto">
                  Código / SKU *
                  <input
                    name="codigo"
                    value={formulario.codigo}
                    onChange={atualizarCampo}
                    maxLength={50}
                    required
                  />
                </label>

                <label className="campo-produto">
                  Categoria *
                  <select
                    name="categoria_id"
                    value={formulario.categoria_id}
                    onChange={atualizarCampo}
                    required
                  >
                    <option value="">Selecione uma categoria</option>

                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="campo-produto">
                  Preço de custo (R$) *
                  <input
                    type="number"
                    name="preco_custo"
                    value={formulario.preco_custo}
                    onChange={atualizarCampo}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <label className="campo-produto">
                  Preço de venda (R$) *
                  <input
                    type="number"
                    name="preco_venda"
                    value={formulario.preco_venda}
                    onChange={atualizarCampo}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                {!produtoEditando && (
                  <label className="campo-produto">
                    Estoque inicial *
                    <input
                      type="number"
                      name="quantidade_estoque"
                      value={formulario.quantidade_estoque}
                      onChange={atualizarCampo}
                      min="0"
                      step="0.001"
                      required
                    />
                  </label>
                )}

                <label className="campo-produto">
                  Estoque mínimo *
                  <input
                    type="number"
                    name="estoque_minimo"
                    value={formulario.estoque_minimo}
                    onChange={atualizarCampo}
                    min="0"
                    step="0.001"
                    required
                  />
                </label>

                <label className="campo-produto campo-largo">
                  Descrição
                  <textarea
                    name="descricao"
                    value={formulario.descricao}
                    onChange={atualizarCampo}
                    maxLength={500}
                    rows={3}
                  />
                </label>
              </div>

              {produtoEditando && (
                <p className="produto-aviso-estoque">
                  O estoque atual é de {produtoEditando.quantidade_estoque}.
                  Para alterá-lo, utilize o módulo Movimentações.
                </p>
              )}

              <footer className="produto-formulario-acoes">
                <button
                  type="button"
                  className="produto-botao-secundario"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="produto-botao-principal"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : produtoEditando
                      ? "Salvar alterações"
                      : "Cadastrar produto"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default Produtos;
