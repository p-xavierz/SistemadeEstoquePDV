import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Tags,
  X,
} from "lucide-react";

import {
  listarCategorias,
  cadastrarCategoria,
  atualizarCategoria,
  desativarCategoria,
} from "../services/categoriaService";

import "./Categorias.css";

const formularioInicial = {
  nome: "",
  descricao: "",
};

function mensagemErro(error) {
  const detalhe = error.response?.data?.detail;

  if (typeof detalhe === "string") return detalhe;

  if (Array.isArray(detalhe)) {
    return detalhe.map((item) => item.msg).join(" ");
  }

  return "Não foi possível concluir a operação. Verifique se o backend está conectado.";
}

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [busca, setBusca] = useState("");
  const [incluirInativas, setIncluirInativas] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarCategorias = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const dados = await listarCategorias(true);
      setCategorias(dados);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  const categoriasFiltradas = categorias.filter((categoria) => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    const correspondeBusca =
      !termo ||
      categoria.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
      (categoria.descricao || "").toLocaleLowerCase("pt-BR").includes(termo);

    return correspondeBusca && (incluirInativas || categoria.ativa);
  });

  const totalAtivas = categorias.filter((categoria) => categoria.ativa).length;
  const totalInativas = categorias.length - totalAtivas;

  function abrirCadastro() {
    setCategoriaEditando(null);
    setFormulario(formularioInicial);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirEdicao(categoria) {
    setCategoriaEditando(categoria);
    setFormulario({
      nome: categoria.nome,
      descricao: categoria.descricao || "",
    });
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setCategoriaEditando(null);
    setFormulario(formularioInicial);
    setErro("");
  }

  async function salvarCategoria(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const nome = formulario.nome.trim();
    const descricao = formulario.descricao.trim();

    if (nome.length < 2) {
      setErro("O nome deve ter pelo menos 2 caracteres.");
      return;
    }

    setSalvando(true);

    try {
      if (categoriaEditando) {
        await atualizarCategoria(categoriaEditando.id, {
          nome,
          descricao: descricao || null,
        });

        setSucesso("Categoria atualizada com sucesso.");
      } else {
        await cadastrarCategoria({
          nome,
          descricao: descricao || null,
        });

        setSucesso("Categoria cadastrada com sucesso.");
      }

      setModalAberto(false);
      setCategoriaEditando(null);
      setFormulario(formularioInicial);
      await carregarCategorias();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function handleDesativar(categoria) {
    const confirmar = window.confirm(
      `Deseja desativar a categoria "${categoria.nome}"?`,
    );

    if (!confirmar) return;

    setErro("");
    setSucesso("");

    try {
      await desativarCategoria(categoria.id);
      setSucesso(`Categoria "${categoria.nome}" desativada com sucesso.`);
      await carregarCategorias();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function reativarCategoria(categoria) {
    const confirmar = window.confirm(
      `Deseja reativar a categoria "${categoria.nome}"?`,
    );

    if (!confirmar) return;

    setErro("");
    setSucesso("");

    try {
      await atualizarCategoria(categoria.id, { ativa: true });
      setSucesso(`Categoria "${categoria.nome}" reativada com sucesso.`);
      await carregarCategorias();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <main className="categorias-page">
      <header className="categorias-header">
        <div>
          <span className="categorias-breadcrumb">GESTÃO DE ESTOQUE</span>
          <h1>Categorias</h1>
          <p>
            Organize seus produtos por grupos e facilite o controle do estoque.
          </p>
        </div>

        <button
          type="button"
          className="categoria-botao-principal"
          onClick={abrirCadastro}
        >
          <Plus size={19} />
          Nova categoria
        </button>
      </header>

      {erro && !modalAberto && (
        <div className="categoria-mensagem erro" role="alert">
          <AlertTriangle size={18} />
          <span>{erro}</span>
          <button type="button" onClick={() => setErro("")} aria-label="Fechar">
            <X size={17} />
          </button>
        </div>
      )}

      {sucesso && (
        <div className="categoria-mensagem sucesso" role="status">
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

      <section className="categorias-resumo">
        <article className="categoria-resumo-card">
          <div className="categoria-resumo-icone">
            <Tags size={23} />
          </div>
          <div>
            <span>Total de categorias</span>
            <strong>{categorias.length}</strong>
          </div>
        </article>

        <article className="categoria-resumo-card">
          <div className="categoria-resumo-icone ativo">
            <CheckCircle2 size={23} />
          </div>
          <div>
            <span>Ativas</span>
            <strong>{totalAtivas}</strong>
          </div>
        </article>

        <article className="categoria-resumo-card">
          <div className="categoria-resumo-icone inativo">
            <Power size={23} />
          </div>
          <div>
            <span>Inativas</span>
            <strong>{totalInativas}</strong>
          </div>
        </article>
      </section>

      <section className="categorias-lista-card">
        <div className="categorias-lista-topo">
          <div>
            <h2>Lista de categorias</h2>
            <p>Gerencie os grupos usados nos cadastros de produtos.</p>
          </div>

          <button
            type="button"
            className="categoria-botao-secundario"
            onClick={carregarCategorias}
            disabled={carregando}
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        <div className="categorias-filtros">
          <div className="categorias-busca">
            <Search size={18} />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Pesquisar categoria..."
            />
          </div>

          <label className="categorias-checkbox">
            <input
              type="checkbox"
              checked={incluirInativas}
              onChange={(event) => setIncluirInativas(event.target.checked)}
            />
            Mostrar categorias inativas
          </label>
        </div>

        <div className="categorias-tabela-container">
          <table className="categorias-tabela">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan="4" className="categorias-vazio">
                    Carregando categorias...
                  </td>
                </tr>
              ) : categoriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="4" className="categorias-vazio">
                    Nenhuma categoria encontrada.
                  </td>
                </tr>
              ) : (
                categoriasFiltradas.map((categoria) => (
                  <tr key={categoria.id}>
                    <td>
                      <div className="categoria-nome">
                        <div className="categoria-icone-linha">
                          <FolderOpen size={19} />
                        </div>
                        <strong>{categoria.nome}</strong>
                      </div>
                    </td>

                    <td className="categoria-descricao">
                      {categoria.descricao || "Sem descrição"}
                    </td>

                    <td>
                      <span
                        className={`categoria-status ${
                          categoria.ativa ? "ativa" : "inativa"
                        }`}
                      >
                        {categoria.ativa ? "Ativa" : "Inativa"}
                      </span>
                    </td>

                    <td>
                      <div className="categoria-acoes">
                        <button
                          type="button"
                          className="categoria-acao editar"
                          onClick={() => abrirEdicao(categoria)}
                          title="Editar categoria"
                          aria-label={`Editar ${categoria.nome}`}
                        >
                          <Pencil size={17} />
                        </button>

                        {categoria.ativa ? (
                          <button
                            type="button"
                            className="categoria-acao desativar"
                            onClick={() => handleDesativar(categoria)}
                            title="Desativar categoria"
                            aria-label={`Desativar ${categoria.nome}`}
                          >
                            <Power size={17} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="categoria-acao reativar"
                            onClick={() => reativarCategoria(categoria)}
                            title="Reativar categoria"
                            aria-label={`Reativar ${categoria.nome}`}
                          >
                            <CheckCircle2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAberto && (
        <div className="categoria-modal-fundo">
          <section
            className="categoria-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="categoria-modal-titulo"
          >
            <header className="categoria-modal-header">
              <div>
                <span>ORGANIZAÇÃO DE PRODUTOS</span>
                <h2 id="categoria-modal-titulo">
                  {categoriaEditando ? "Editar categoria" : "Nova categoria"}
                </h2>
              </div>

              <button
                type="button"
                className="categoria-modal-fechar"
                onClick={fecharModal}
                disabled={salvando}
                aria-label="Fechar formulário"
              >
                <X size={21} />
              </button>
            </header>

            <form className="categoria-formulario" onSubmit={salvarCategoria}>
              {erro && (
                <div className="categoria-mensagem erro" role="alert">
                  <AlertTriangle size={18} />
                  <span>{erro}</span>
                </div>
              )}

              <label className="campo-categoria">
                Nome da categoria *
                <input
                  name="nome"
                  value={formulario.nome}
                  onChange={atualizarCampo}
                  minLength={2}
                  maxLength={80}
                  required
                  autoFocus
                  placeholder="Ex.: Bebidas"
                />
              </label>

              <label className="campo-categoria">
                Descrição
                <textarea
                  name="descricao"
                  value={formulario.descricao}
                  onChange={atualizarCampo}
                  maxLength={250}
                  rows={4}
                  placeholder="Descreva quais produtos pertencem a esta categoria."
                />
              </label>

              {categoriaEditando && !categoriaEditando.ativa && (
                <p className="categoria-aviso">
                  Esta categoria está inativa. Para voltar a utilizá-la nos
                  produtos, reative-a pela lista de categorias.
                </p>
              )}

              <footer className="categoria-formulario-acoes">
                <button
                  type="button"
                  className="categoria-botao-secundario"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="categoria-botao-principal"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : categoriaEditando
                      ? "Salvar alterações"
                      : "Cadastrar categoria"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default Categorias;
