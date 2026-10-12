import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LockKeyhole, Mail, Package, Eye, EyeOff } from "lucide-react";
import { login as autenticar } from "../services/authService";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const navigate = useNavigate();
  const { entrar } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      await entrar(email.trim(), senha);
      setSenha("");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error.response?.status === 401) {
        setErro("E-mail ou senha inválidos.");
      } else if (error.response?.status === 422) {
        setErro("Confira o formato do e-mail e os dados informados.");
      } else if (!error.response) {
        setErro(
          "Não foi possível conectar ao servidor. Verifique se o backend está funcionando.",
        );
      } else {
        setErro("Ocorreu um erro ao entrar. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-content">
          <div className="brand-icon">
            <Package size={34} />
          </div>

          <span className="brand-label">GESTÃO INTELIGENTE</span>
          <h1>Controle total do seu negócio.</h1>
          <p>
            Estoque, vendas e caixa em um só lugar. Mais controle para você
            tomar melhores decisões.
          </p>

          <div className="brand-footer">SISTEMA DE ESTOQUE &amp; PDV</div>
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-form-container">
          <div className="mobile-brand-icon">
            <Package size={30} />
          </div>

          <span className="form-eyebrow">BEM-VINDO DE VOLTA</span>
          <h2>Acesse sua conta</h2>
          <p className="form-description">
            Informe seus dados para entrar no sistema.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">E-mail</label>

            <div className="input-wrapper">
              <Mail size={19} />
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
                disabled={carregando}
              />
            </div>

            <label htmlFor="senha">Senha</label>

            <div className="input-wrapper">
              <LockKeyhole size={19} />
              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                autoComplete="current-password"
                required
                disabled={carregando}
              />

              <button
                className="password-toggle"
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                disabled={carregando}
              >
                {mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {erro && (
              <p className="login-error" role="alert">
                {erro}
              </p>
            )}

            {sucesso && (
              <p className="login-success" role="status">
                {sucesso}
              </p>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar no sistema"}
            </button>
          </form>

          <p className="login-security">
            <LockKeyhole size={14} />
            Acesso destinado a usuários autorizados.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
