import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowLeftRight,
  ShoppingCart,
  Wallet,
  LogOut,
  Menu,
  X,
  Boxes,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import "./AppLayout.css";

const itensMenu = [
  {
    nome: "Dashboard",
    caminho: "/dashboard",
    icone: LayoutDashboard,
  },
  {
    nome: "Produtos",
    caminho: "/produtos",
    icone: Package,
  },
  {
    nome: "Categorias",
    caminho: "/categorias",
    icone: Tags,
  },
  {
    nome: "Movimentações",
    caminho: "/movimentacoes",
    icone: ArrowLeftRight,
  },
  {
    nome: "Ponto de venda",
    caminho: "/pdv",
    icone: ShoppingCart,
  },
  {
    nome: "Controle de Caixa",
    caminho: "/caixa",
    icone: Wallet,
  },
];

const titulos = {
  "/dashboard": "Dashboard",
  "/produtos": "Produtos",
  "/categorias": "Categorias",
  "/movimentacoes": "Movimentações",
  "/pdv": "Ponto de venda",
  "/caixa": "Controle de caixa",
};

function AppLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const titulo = titulos[location.pathname] || "Sistema de Estoque";
  const nomeUsuario = usuario?.nome || usuario?.email || "Administrador";
  const perfilUsuario = usuario?.perfil || "Usuário";

  function handleLogout() {
    sair();
    setMenuAberto(false);
    navigate("/login", { replace: true });
  }

  function navegarPara(caminho) {
    setMenuAberto(false);
    navigate(caminho);
  }

  return (
    <div className="app-layout">
      {menuAberto && (
        <button
          className="app-sidebar-overlay"
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside
        className={`app-sidebar ${menuAberto ? "app-sidebar-aberto" : ""}`}
      >
        <div className="app-brand">
          <div className="app-brand-icon">
            <Boxes size={25} />
          </div>

          <div className="app-brand-text">
            <strong>Estoque &amp; PDV</strong>
            <span>GESTÃO INTELIGENTE</span>
          </div>

          <button
            className="app-sidebar-close"
            type="button"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="app-menu-label">MENU PRINCIPAL</div>

        <nav className="app-navigation" aria-label="Navegação principal">
          {itensMenu.map((item) => {
            const Icone = item.icone;

            return (
              <NavLink
                key={item.caminho}
                to={item.caminho}
                end
                onClick={() => setMenuAberto(false)}
                className={({ isActive }) =>
                  `app-nav-link ${isActive ? "active" : ""}`
                }
              >
                <Icone size={19} />
                <span>{item.nome}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="app-sidebar-bottom">
          <div className="app-sidebar-user">
            <div className="app-user-avatar">
              {nomeUsuario.charAt(0).toUpperCase()}
            </div>

            <div className="app-user-info">
              <strong title={nomeUsuario}>{nomeUsuario}</strong>
              <span>{perfilUsuario}</span>
            </div>
          </div>

          <button
            type="button"
            className="app-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            className="app-mobile-menu"
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu de navegação"
            aria-expanded={menuAberto}
          >
            <Menu size={22} />
          </button>

          <div className="app-page-heading">
            <span>GESTÃO DE ESTOQUE</span>
            <h1>{titulo}</h1>
          </div>

          <div className="app-topbar-user">
            <div className="app-user-avatar">
              {nomeUsuario.charAt(0).toUpperCase()}
            </div>

            <div className="app-user-info">
              <strong>{nomeUsuario}</strong>
              <span>{perfilUsuario}</span>
            </div>
          </div>
        </header>

        <main className="app-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
