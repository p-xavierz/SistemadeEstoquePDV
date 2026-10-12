import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { listarProdutos } from "../services/produtoService";
import { registrarVenda } from "../services/vendaService";
import "./PDV.css";

const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);

function mensagemErro(error) {
  const detalhe = error?.response?.data?.detail;

  if (typeof detalhe === "string") return detalhe;
  if (Array.isArray(detalhe)) {
    return detalhe.map((item) => item.msg).join(" ");
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

export default function PDV() {
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [desconto, setDesconto] = useState("0");
  const [clienteNome, setClienteNome] = useState("");
  const [observacao, setObservacao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarProdutos = useCallback(async () => {
    setCarregando(true);

    try {
      const dados = await listarProdutos();
      setProdutos(dados.filter((produto) => produto.ativo !== false));
      setErro("");
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return produtos.filter((produto) => {
      const corresponde =
        !termo ||
        produto.nome?.toLocaleLowerCase("pt-BR").includes(termo) ||
        produto.codigo?.toLocaleLowerCase("pt-BR").includes(termo);

      return corresponde && Number(produto.quantidade_estoque) > 0;
    });
  }, [produtos, busca]);

  const subtotal = useMemo(
    () =>
      Number(
        carrinho
          .reduce(
            (total, item) => total + item.quantidade * Number(item.preco_venda),
            0,
          )
          .toFixed(2),
      ),
    [carrinho],
  );

  const descontoNumerico = Math.max(0, Number(desconto) || 0);
  const total = Math.max(0, Number((subtotal - descontoNumerico).toFixed(2)));
  const descontoInvalido = descontoNumerico > subtotal;

  function adicionarProduto(produto) {
    setErro("");
    setSucesso("");

    setCarrinho((atual) => {
      const existente = atual.find((item) => item.id === produto.id);

      if (existente) {
        if (existente.quantidade + 1 > Number(produto.quantidade_estoque)) {
          setErro(`Estoque insuficiente para ${produto.nome}.`);
          return atual;
        }

        return atual.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item,
        );
      }

      return [
        ...atual,
        {
          ...produto,
          quantidade: 1,
        },
      ];
    });
  }

  function alterarQuantidade(produtoId, variacao) {
    setErro("");
    setCarrinho((atual) =>
      atual
        .map((item) => {
          if (item.id !== produtoId) return item;

          const quantidade = item.quantidade + variacao;

          if (quantidade > Number(item.quantidade_estoque)) {
            setErro(`Estoque insuficiente para ${item.nome}.`);
            return item;
          }

          return { ...item, quantidade };
        })
        .filter((item) => item.quantidade > 0),
    );
  }

  function removerProduto(produtoId) {
    setCarrinho((atual) => atual.filter((item) => item.id !== produtoId));
  }

  async function finalizarVenda(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (carrinho.length === 0) {
      setErro("Adicione pelo menos um produto ao carrinho.");
      return;
    }

    if (descontoInvalido) {
      setErro("O desconto não pode ser maior que o subtotal.");
      return;
    }

    setFinalizando(true);

    try {
      const venda = await registrarVenda({
        itens: carrinho.map((item) => ({
          produto_id: item.id,
          quantidade: item.quantidade,
        })),
        forma_pagamento: formaPagamento,
        desconto: Number(descontoNumerico.toFixed(2)),
        cliente_nome: clienteNome.trim() || null,
        observacao: observacao.trim() || null,
      });

      setSucesso(`Venda registrada! Total: ${moeda(venda.total)}.`);
      setCarrinho([]);
      setDesconto("0");
      setClienteNome("");
      setObservacao("");
      setBusca("");

      await carregarProdutos();
    } catch (error) {
      setErro(mensagemErro(error));
      await carregarProdutos();
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <main className="pdv-page">
      <header className="pdv-header">
        <button
          type="button"
          className="pdv-back"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Painel
        </button>

        <div>
          <span className="pdv-eyebrow">OPERAÇÃO DE CAIXA</span>
          <h1>Ponto de venda</h1>
          <p>Selecione os produtos e registre uma venda.</p>
        </div>

        <div className="pdv-header-icon">
          <ShoppingCart size={24} />
        </div>
      </header>

      {erro && (
        <div className="pdv-alert pdv-alert-error" role="alert">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="pdv-alert pdv-alert-success" role="status">
          <CheckCircle2 size={19} />
          {sucesso}
        </div>
      )}

      <div className="pdv-layout">
        <section className="pdv-panel pdv-products">
          <div className="pdv-panel-heading">
            <div>
              <h2>Produtos disponíveis</h2>
              <p>Selecione um produto para adicionar à venda.</p>
            </div>
            <span className="pdv-count">{produtosFiltrados.length}</span>
          </div>

          <label className="pdv-search">
            <Search size={19} />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome ou código..."
            />
          </label>

          {carregando ? (
            <div className="pdv-empty">Carregando produtos...</div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="pdv-empty">
              Nenhum produto com estoque disponível foi encontrado.
            </div>
          ) : (
            <div className="pdv-product-list">
              {produtosFiltrados.map((produto) => {
                const noCarrinho = carrinho.find(
                  (item) => item.id === produto.id,
                );

                return (
                  <article className="pdv-product" key={produto.id}>
                    <div className="pdv-product-info">
                      <span className="pdv-product-code">
                        Cód. {produto.codigo}
                      </span>
                      <h3>{produto.nome}</h3>
                      <p>Estoque: {produto.quantidade_estoque}</p>
                      <strong>{moeda(produto.preco_venda)}</strong>
                    </div>

                    <button
                      type="button"
                      className="pdv-add"
                      onClick={() => adicionarProduto(produto)}
                      aria-label={`Adicionar ${produto.nome}`}
                    >
                      <Plus size={19} />
                      {noCarrinho ? noCarrinho.quantidade : "Adicionar"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="pdv-panel pdv-cart">
          <div className="pdv-panel-heading">
            <div>
              <h2>Carrinho</h2>
              <p>{carrinho.length} produto(s) diferente(s)</p>
            </div>
            <ShoppingCart size={22} />
          </div>

          {carrinho.length === 0 ? (
            <div className="pdv-cart-empty">
              <ShoppingCart size={34} />
              <strong>Seu carrinho está vazio</strong>
              <span>Adicione produtos para iniciar a venda.</span>
            </div>
          ) : (
            <div className="pdv-cart-items">
              {carrinho.map((item) => (
                <article className="pdv-cart-item" key={item.id}>
                  <div className="pdv-cart-item-top">
                    <div>
                      <strong>{item.nome}</strong>
                      <span>{moeda(item.preco_venda)} por unidade</span>
                    </div>
                    <button
                      type="button"
                      className="pdv-remove"
                      onClick={() => removerProduto(item.id)}
                      aria-label={`Remover ${item.nome}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="pdv-cart-item-bottom">
                    <div className="pdv-quantity">
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.id, -1)}
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={15} />
                      </button>
                      <span>{item.quantidade}</span>
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.id, 1)}
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <strong>{moeda(item.quantidade * item.preco_venda)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}

          <form className="pdv-checkout" onSubmit={finalizarVenda}>
            <label className="pdv-field">
              Cliente (opcional)
              <input
                value={clienteNome}
                onChange={(event) => setClienteNome(event.target.value)}
                maxLength={120}
                placeholder="Nome do cliente"
              />
            </label>

            <label className="pdv-field">
              Forma de pagamento
              <select
                value={formaPagamento}
                onChange={(event) => setFormaPagamento(event.target.value)}
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de crédito</option>
                <option value="cartao_debito">Cartão de débito</option>
                <option value="transferencia">Transferência</option>
              </select>
            </label>

            <label className="pdv-field">
              Desconto (R$)
              <input
                type="number"
                min="0"
                max={subtotal}
                step="0.01"
                value={desconto}
                onChange={(event) => setDesconto(event.target.value)}
              />
            </label>

            <label className="pdv-field">
              Observação (opcional)
              <input
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                maxLength={500}
                placeholder="Informações adicionais"
              />
            </label>

            <div className="pdv-totals">
              <div>
                <span>Subtotal</span>
                <strong>{moeda(subtotal)}</strong>
              </div>
              <div>
                <span>Desconto</span>
                <strong className="pdv-discount">
                  − {moeda(descontoNumerico)}
                </strong>
              </div>
              <div className="pdv-grand-total">
                <span>Total da venda</span>
                <strong>{moeda(total)}</strong>
              </div>
            </div>

            <button
              type="submit"
              className="pdv-finish"
              disabled={
                finalizando ||
                carregando ||
                carrinho.length === 0 ||
                descontoInvalido
              }
            >
              {finalizando ? "Registrando venda..." : "Finalizar venda"}
            </button>

            <p className="pdv-footnote">
              O estoque será atualizado após a confirmação do servidor.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
