import { createContext, useContext, useEffect, useState } from "react";
import {
  login as solicitarLogin,
  buscarUsuario,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setCarregandoAuth(false);
        return;
      }

      try {
        const dadosUsuario = await buscarUsuario(token);
        setUsuario(dadosUsuario);
      } catch {
        localStorage.removeItem("access_token");
        setUsuario(null);
      } finally {
        setCarregandoAuth(false);
      }
    }

    verificarSessao();
  }, []);

  async function entrar(email, senha) {
    const dados = await solicitarLogin(email, senha);

    localStorage.setItem("access_token", dados.access_token);

    try {
      const dadosUsuario = await buscarUsuario(dados.access_token);
      setUsuario(dadosUsuario);
      return dadosUsuario;
    } catch (error) {
      localStorage.removeItem("access_token");
      setUsuario(null);
      throw error;
    }
  }

  function sair() {
    localStorage.removeItem("access_token");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregandoAuth, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return contexto;
}
