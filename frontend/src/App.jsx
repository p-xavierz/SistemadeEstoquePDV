import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./contexts/AuthContext";

import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Categorias from "./pages/Categorias";
import Movimentacoes from "./pages/Movimentacoes";
import PDV from "./pages/PDV";

function RotaProtegida() {
  const { usuario, carregandoAuth } = useAuth();

  if (carregandoAuth) {
    return <div className="app-loading">Verificando autenticação...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RotaProtegida />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/produtos" element={<Produtos />} />

            <Route path="/categorias" element={<Categorias />} />

            <Route path="/movimentacoes" element={<Movimentacoes />} />

            <Route path="/pdv" element={<PDV />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
