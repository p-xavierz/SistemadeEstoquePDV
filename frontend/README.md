# Sistema de Estoque e PDV

Sistema web para gerenciamento de estoque, produtos, categorias, movimentações e vendas, com controle de caixa integrado.

O projeto está em desenvolvimento e utiliza React no frontend, FastAPI no backend e MongoDB para persistência dos dados.

## Funcionalidades

### Dashboard

- Indicadores gerais do sistema
- Quantidade de produtos cadastrados
- Valor estimado do estoque
- Resumo de vendas do dia
- Produtos com estoque baixo
- Vendas recentes

### Gestão de produtos

- Cadastro de produtos
- Consulta e organização dos produtos
- Controle de quantidades em estoque
- Integração com categorias

### Categorias

- Cadastro e gerenciamento de categorias
- Organização dos produtos

### Movimentações de estoque

- Registro e consulta de movimentações
- Acompanhamento das alterações no estoque

### PDV - Ponto de Venda

- Registro de vendas
- Seleção de produtos
- Cálculo de subtotal, descontos e total
- Registro da forma de pagamento
- Atualização do estoque após a venda
- Vinculação das novas vendas ao caixa aberto

### Controle de Caixa

- Abertura de caixa com saldo inicial
- Registro de entradas e saídas financeiras
- Resumo de vendas por forma de pagamento
- Cálculo do saldo esperado em dinheiro
- Fechamento com conferência do valor contado
- Identificação de diferenças no fechamento
- Histórico de caixas
- Atualização periódica dos indicadores

### Autenticação

- Login de usuários
- Autenticação baseada em token
- Proteção das rotas do sistema

## Tecnologias utilizadas

### Frontend

- React
- JavaScript
- Vite
- React Router
- Axios
- Lucide React
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- Motor (driver assíncrono do MongoDB)
- Pydantic

### Banco de dados

- MongoDB Community Server
- Replica set local para operações transacionais

### Versionamento

- Git
- GitHub

## Estrutura do projeto

```text
SistemadeEstoquePDV/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── database/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── main.py
│   └── .venv/              # Não versionado
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── node_modules/       # Não versionado
│
├── .gitignore
└── README.md
```

A estrutura pode evoluir conforme novas funcionalidades forem adicionadas.

## Requisitos

Para executar o projeto localmente:

- Node.js e Yarn
- Python
- MongoDB Community Server
- MongoDB configurado com replica set
- Git (opcional, para versionamento)

## Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/p-xavierz/SistemadeEstoquePDV.git
cd SistemadeEstoquePDV
```

### 2. Configurar o backend

No terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Instale as dependências Python conforme o arquivo de dependências do backend.

Se o projeto possuir `requirements.txt`:

```powershell
pip install -r requirements.txt
```

Configure as variáveis de ambiente utilizadas pelo backend, incluindo a conexão com o MongoDB.

Não publique senhas ou credenciais reais no repositório.

### 3. Configurar o MongoDB

Inicie o MongoDB Community Server.

O ambiente local de desenvolvimento utiliza:

- Banco de dados: `estoque_pdv`
- Replica set: `rs0`

O replica set é necessário para as transações utilizadas no registro das vendas.

A configuração da conexão deve ser feita conforme as variáveis de ambiente do backend.

### 4. Iniciar o backend

Dentro da pasta `backend`, com o ambiente virtual ativado:

```powershell
python -m uvicorn app.main:app --reload --port 8001
```

API:

http://localhost:8001

Documentação interativa:

http://localhost:8001/docs

Verificação de saúde:

http://localhost:8001/api/health

### 5. Configurar o frontend

Abra outro terminal e execute:

```powershell
cd frontend
yarn install
```

### 6. Iniciar o frontend

```powershell
yarn dev
```

Acesse:

http://localhost:5173

## Fluxo básico de utilização

1. Inicie o MongoDB e o backend.
2. Inicie o frontend.
3. Faça login no sistema.
4. Cadastre categorias e produtos.
5. Abra uma sessão no Controle de Caixa.
6. Registre vendas pelo PDV.
7. Consulte os indicadores e as movimentações.
8. Confira o dinheiro físico e feche o caixa.

O backend exige um caixa aberto para registrar novas vendas.

## Regras do Controle de Caixa

O saldo esperado considera apenas os valores que compõem o dinheiro físico:

Saldo esperado =
Valor inicial

- Vendas em dinheiro
- Entradas manuais

* Saídas manuais

Os recebimentos por Pix, cartão e transferência são apresentados separadamente.

No fechamento:

Diferença = Valor contado - Saldo esperado

- Diferença igual a zero: caixa conferido
- Diferença positiva: sobra de dinheiro
- Diferença negativa: falta de dinheiro

As vendas anteriores à implementação do Controle de Caixa podem não possuir vínculo com uma sessão de caixa.

## Segurança

O projeto utiliza autenticação para proteger os endpoints e as páginas internas.

Boas práticas de desenvolvimento:

- Não publicar arquivos `.env`
- Não publicar credenciais ou tokens
- Não versionar ambientes virtuais
- Não versionar `node_modules`
- Não enviar backups do banco ao GitHub
- Utilizar arquivos de exemplo para documentar variáveis de ambiente

## Estado do projeto

**Em desenvolvimento.**

Funcionalidades implementadas até o momento:

- [x] Estrutura inicial do frontend e backend
- [x] Conexão com MongoDB
- [x] Autenticação
- [x] Gestão de produtos
- [x] Gestão de categorias
- [x] Movimentações de estoque
- [x] PDV
- [x] Dashboard
- [x] Controle de Caixa
- [x] Atualização periódica dos indicadores do caixa

## Próximas melhorias

- [ ] Relatórios financeiros e de vendas
- [ ] Filtros por período
- [ ] Histórico detalhado das sessões de caixa
- [ ] Comprovantes de venda
- [ ] Permissões por perfil de usuário
- [ ] Testes automatizados
- [ ] Melhorias de experiência e responsividade
- [ ] Preparação para implantação em produção

## Autor

**Patrick Xavier**

Desenvolvimento de software e soluções web.

GitHub: https://github.com/p-xavierz

---

Projeto desenvolvido para estudo e evolução prática de um sistema de gestão comercial.
