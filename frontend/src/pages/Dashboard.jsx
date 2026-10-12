import { useNavigate } from "react-router-dom";
import {
  Package,
  Tags,
  ShoppingCart,
  ArrowLeftRight,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

import "./Dashboard.css";

const modulos = [
  {
    nome: "Produtos",
    descricao: "Cadastre, consulte e gerencie seus produtos.",
    caminho: "/produtos",
    icone: Package,
  },
  {
    nome: "Categorias",
    descricao: "Organize os produtos por categoria.",
    caminho: "/categorias",
    icone: Tags,
  },
  {
    nome: "Ponto de venda",
    descricao: "Acesse o PDV e registre as vendas.",
    caminho: "/pdv",
    icone: ShoppingCart,
  },
  {
    nome: "Movimentações",
    descricao: "Consulte entradas, saídas e histórico do estoque.",
    caminho: "/movimentacoes",
    icone: ArrowLeftRight,
  },
];

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <span className="dashboard-eyebrow">VISÃO GERAL</span>

          <h2>Bem-vindo ao seu painel!</h2>

          <p>Gerencie produtos, estoque e vendas em um só lugar.</p>
        </div>

        <div className="dashboard-welcome-icon">
          <Package size={32} />
        </div>
      </section>

      <section className="dashboard-notice">
        <div className="dashboard-notice-icon">
          <CheckCircle2 size={22} />
        </div>

        <div>
          <strong>Área administrativa</strong>

          <p>
            Utilize o menu lateral para navegar pelos módulos. Os dados exibidos
            em cada módulo dependem da integração com a API.
          </p>
        </div>
      </section>

      <section className="dashboard-modules-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Acesso rápido</h2>
            <p>Selecione o módulo que deseja acessar.</p>
          </div>
        </div>

        <div className="dashboard-module-grid">
          {modulos.map((modulo) => {
            const Icone = modulo.icone;

            return (
              <button
                type="button"
                className="dashboard-module-card"
                key={modulo.caminho}
                onClick={() => navigate(modulo.caminho)}
              >
                <div className="dashboard-module-icon">
                  <Icone size={24} />
                </div>

                <div className="dashboard-module-text">
                  <h3>{modulo.nome}</h3>
                  <p>{modulo.descricao}</p>
                </div>

                <ArrowUpRight className="dashboard-module-arrow" size={19} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-secondary-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Outros recursos</h2>
            <p>Módulos adicionais do sistema.</p>
          </div>
        </div>

        <button
          type="button"
          className="dashboard-secondary-card"
          onClick={() => {
            window.alert(
              "O módulo de caixa será desenvolvido em uma etapa posterior.",
            );
          }}
        >
          <div className="dashboard-module-icon">
            <Wallet size={23} />
          </div>

          <div>
            <h3>Controle de caixa</h3>
            <p>Área prevista para acompanhar entradas e saídas financeiras.</p>
            <span className="dashboard-module-status">
              Desenvolvimento futuro
            </span>
          </div>
        </button>
      </section>
    </div>
  );
}

export default Dashboard;
