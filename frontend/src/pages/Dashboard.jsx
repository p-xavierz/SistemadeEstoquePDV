import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Wallet,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Tags,
  ClipboardList,
  Store,
  RefreshCw,
  Clock,
} from "lucide-react";

import { listarProdutos } from "../services/produtoService";
import { listarVendas } from "../services/vendaService";
import "./Dashboard.css";

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const formasPagamento = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
};

function inicioDoDia() {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  return data;
}

function formatarDataHora(valor) {
  if (!valor) return "Data não informada";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Data não informada";
  }

  return dataHora.format(data);
}

function saudacao() {
  const hora = new Date().getHours();

  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function Dashboard() {
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    try {
      const [dadosProdutos, dadosVendas] = await Promise.all([
        listarProdutos(),
        listarVendas({ limite: 500 }),
      ]);

      setProdutos(Array.isArray(dadosProdutos) ? dadosProdutos : []);
      setVendas(Array.isArray(dadosVendas) ? dadosVendas : []);
    } catch (error) {
      console.error("Erro ao carregar o Dashboard:", error);
      setErro(
        "Não foi possível carregar os dados. Verifique a conexão com o servidor e tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const indicadores = useMemo(() => {
    const inicio = inicioDoDia();

    const vendasHoje = vendas.filter((venda) => {
      if (!venda.criado_em) return false;

      const dataVenda = new Date(venda.criado_em);

      return !Number.isNaN(dataVenda.getTime()) && dataVenda >= inicio;
    });

    const totalVendidoHoje = vendasHoje.reduce(
      (total, venda) => total + Number(venda.total || 0),
      0,
    );

    const valorEstoque = produtos.reduce((total, produto) => {
      const quantidade = Number(produto.quantidade_estoque || 0);
      const custo = Number(produto.preco_custo || 0);

      return total + quantidade * custo;
    }, 0);

    const produtosEstoqueBaixo = produtos.filter((produto) => {
      const quantidade = Number(produto.quantidade_estoque || 0);
      const minimo = Number(produto.estoque_minimo || 0);

      return quantidade <= minimo;
    });

    return {
      totalProdutos: produtos.length,
      valorEstoque,
      totalVendidoHoje,
      quantidadeVendasHoje: vendasHoje.length,
      produtosEstoqueBaixo,
      vendasHoje,
    };
  }, [produtos, vendas]);

  const atalhos = [
    {
      titulo: "Produtos",
      descricao: "Cadastre e consulte produtos",
      destino: "/produtos",
      icone: Package,
    },
    {
      titulo: "Categorias",
      descricao: "Organize seus produtos",
      destino: "/categorias",
      icone: Tags,
    },
    {
      titulo: "Frente de caixa",
      descricao: "Registrar uma nova venda",
      destino: "/pdv",
      icone: Store,
    },
    {
      titulo: "Movimentações",
      descricao: "Consulte entradas e saídas",
      destino: "/movimentacoes",
      icone: ClipboardList,
    },
  ];

  return (
    <main className="dashboard">
      <section className="dashboard-cabecalho">
        <div>
          <span className="dashboard-sobretitulo">VISÃO GERAL</span>

          <h1>{saudacao()}!</h1>

          <p>Acompanhe os principais números e a situação do seu estoque.</p>
        </div>

        <button
          type="button"
          className="dashboard-atualizar"
          onClick={carregarDados}
          disabled={carregando}
        >
          <RefreshCw
            size={17}
            className={carregando ? "dashboard-girando" : ""}
          />
          Atualizar
        </button>
      </section>

      {erro && (
        <section className="dashboard-erro" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Não foi possível atualizar o painel</strong>
            <p>{erro}</p>
          </div>
          <button type="button" onClick={carregarDados}>
            Tentar novamente
          </button>
        </section>
      )}

      <section className="dashboard-indicadores">
        <article className="dashboard-indicador">
          <div className="dashboard-indicador-topo">
            <span>Produtos ativos</span>
            <div className="dashboard-icone icone-azul">
              <Package size={21} />
            </div>
          </div>

          <strong className="dashboard-valor">
            {carregando ? "—" : indicadores.totalProdutos}
          </strong>

          <span className="dashboard-indicador-legenda">
            Produtos disponíveis no cadastro
          </span>
        </article>

        <article className="dashboard-indicador">
          <div className="dashboard-indicador-topo">
            <span>Valor em estoque</span>
            <div className="dashboard-icone icone-verde">
              <Boxes size={21} />
            </div>
          </div>

          <strong className="dashboard-valor">
            {carregando ? "—" : moeda.format(indicadores.valorEstoque)}
          </strong>

          <span className="dashboard-indicador-legenda">
            Estimativa pelo custo dos produtos
          </span>
        </article>

        <article className="dashboard-indicador">
          <div className="dashboard-indicador-topo">
            <span>Vendas de hoje</span>
            <div className="dashboard-icone icone-roxo">
              <Wallet size={21} />
            </div>
          </div>

          <strong className="dashboard-valor">
            {carregando ? "—" : moeda.format(indicadores.totalVendidoHoje)}
          </strong>

          <span className="dashboard-indicador-legenda">
            Total registrado em vendas hoje
          </span>
        </article>

        <article className="dashboard-indicador">
          <div className="dashboard-indicador-topo">
            <span>Vendas realizadas</span>
            <div className="dashboard-icone icone-laranja">
              <ShoppingCart size={21} />
            </div>
          </div>

          <strong className="dashboard-valor">
            {carregando ? "—" : indicadores.quantidadeVendasHoje}
          </strong>

          <span className="dashboard-indicador-legenda">
            Quantidade de vendas de hoje
          </span>
        </article>
      </section>

      <section className="dashboard-conteudo">
        <div className="dashboard-painel dashboard-painel-estoque">
          <div className="dashboard-painel-cabecalho">
            <div>
              <h2>Estoque baixo</h2>
              <p>Produtos que precisam de atenção</p>
            </div>

            <span className="dashboard-contador-alerta">
              {carregando ? "—" : indicadores.produtosEstoqueBaixo.length}
            </span>
          </div>

          {carregando ? (
            <div className="dashboard-vazio">Carregando estoque...</div>
          ) : indicadores.produtosEstoqueBaixo.length === 0 ? (
            <div className="dashboard-estado-vazio">
              <div className="dashboard-estado-icone">
                <TrendingUp size={24} />
              </div>
              <strong>Estoque em dia!</strong>
              <p>Nenhum produto está no nível mínimo ou abaixo dele.</p>
            </div>
          ) : (
            <div className="dashboard-lista-estoque">
              {indicadores.produtosEstoqueBaixo
                .slice()
                .sort(
                  (a, b) =>
                    Number(a.quantidade_estoque || 0) -
                    Number(b.quantidade_estoque || 0),
                )
                .slice(0, 6)
                .map((produto) => {
                  const quantidade = Number(produto.quantidade_estoque || 0);
                  const minimo = Number(produto.estoque_minimo || 0);

                  return (
                    <div className="dashboard-item-estoque" key={produto.id}>
                      <div className="dashboard-produto-icone">
                        <Package size={19} />
                      </div>

                      <div className="dashboard-produto-info">
                        <strong>{produto.nome}</strong>
                        <span>Código: {produto.codigo}</span>
                      </div>

                      <div className="dashboard-estoque-quantidade">
                        <strong>{quantidade}</strong>
                        <span>Mínimo: {minimo}</span>
                      </div>
                    </div>
                  );
                })}

              {indicadores.produtosEstoqueBaixo.length > 6 && (
                <p className="dashboard-mais-itens">
                  E mais {indicadores.produtosEstoqueBaixo.length - 6}{" "}
                  produto(s) com estoque baixo.
                </p>
              )}
            </div>
          )}

          <Link to="/produtos" className="dashboard-link-painel">
            Consultar produtos
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="dashboard-painel dashboard-painel-vendas">
          <div className="dashboard-painel-cabecalho">
            <div>
              <h2>Vendas recentes</h2>
              <p>Últimas vendas registradas</p>
            </div>

            <div className="dashboard-cabecalho-icone">
              <Clock size={19} />
            </div>
          </div>

          {carregando ? (
            <div className="dashboard-vazio">Carregando vendas...</div>
          ) : vendas.length === 0 ? (
            <div className="dashboard-estado-vazio">
              <div className="dashboard-estado-icone">
                <ShoppingCart size={24} />
              </div>
              <strong>Nenhuma venda registrada</strong>
              <p>As vendas realizadas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="dashboard-lista-vendas">
              {vendas.slice(0, 5).map((venda) => (
                <div className="dashboard-item-venda" key={venda.id}>
                  <div className="dashboard-venda-icone">
                    <ShoppingCart size={18} />
                  </div>

                  <div className="dashboard-venda-info">
                    <strong>
                      {venda.cliente_nome?.trim() ||
                        `Venda #${String(venda.id).slice(-6)}`}
                    </strong>
                    <span>{formatarDataHora(venda.criado_em)}</span>
                    <span className="dashboard-venda-pagamento">
                      {formasPagamento[venda.forma_pagamento] ||
                        venda.forma_pagamento ||
                        "Pagamento não informado"}
                    </span>
                  </div>

                  <strong className="dashboard-venda-total">
                    {moeda.format(Number(venda.total || 0))}
                  </strong>
                </div>
              ))}
            </div>
          )}

          <Link to="/pdv" className="dashboard-link-painel">
            Abrir frente de caixa
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="dashboard-atalhos">
        <div className="dashboard-secao-titulo">
          <h2>Acesso rápido</h2>
          <p>Vá diretamente para as principais funções do sistema.</p>
        </div>

        <div className="dashboard-grade-atalhos">
          {atalhos.map((atalho) => {
            const Icone = atalho.icone;

            return (
              <Link
                to={atalho.destino}
                className="dashboard-atalho"
                key={atalho.destino}
              >
                <div className="dashboard-atalho-icone">
                  <Icone size={22} />
                </div>

                <div className="dashboard-atalho-texto">
                  <strong>{atalho.titulo}</strong>
                  <span>{atalho.descricao}</span>
                </div>

                <ArrowRight size={18} className="dashboard-atalho-seta" />
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
