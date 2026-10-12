
import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
ARQUIVO_ENV_TEST = BACKEND_DIR / ".env.test"

if not ARQUIVO_ENV_TEST.exists():
    raise RuntimeError(
        "Arquivo .env.test não encontrado."
    )

load_dotenv(ARQUIVO_ENV_TEST, override=True)

if os.getenv("MONGODB_DATABASE") != "estoque_pdv_test":
    raise RuntimeError(
        "Banco de testes incorreto. Execução interrompida."
    )
