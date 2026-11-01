from contextlib import asynccontextmanager
from app.routers.categorias import router as categorias_router
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers.produtos import router as produtos_router
from app.routers.movimentacoes import router as movimentacoes_router
from app.routers import vendas
from app.routers.caixa import router as caixa_router

from app.database.connection import (
    iniciar_conexao,
    verificar_conexao,
    fechar_conexao,
)
from app.routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await iniciar_conexao()
    try:
        yield
    finally:
        await fechar_conexao()


app = FastAPI(
    title="Sistema de Estoque e PDV",
    description="API para gerenciamento de estoque, vendas e caixa.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(categorias_router)
app.include_router(produtos_router)
app.include_router(movimentacoes_router)
app.include_router(vendas.router)
app.include_router(caixa_router)

@app.get("/")
async def inicio():
    return {
        "mensagem": "API do Sistema de Estoque e PDV",
        "status": "online",
    }


@app.get("/api/health")
async def verificar_saude():
    try:
        await verificar_conexao()
        return {
            "status": "ok",
            "servico": "backend",
            "banco": "conectado",
        }
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível conectar ao banco de dados.",
        )