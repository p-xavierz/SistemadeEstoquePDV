
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings


client = AsyncIOMotorClient(settings.MONGODB_URL)

database = client[settings.MONGODB_DATABASE]


async def iniciar_conexao():
    await client.admin.command("ping")
    await database.users.create_index("email", unique=True)

    await database.caixas.create_index(
        "status",
        unique=True,
        partialFilterExpression={"status": "aberto"},
        name="unico_caixa_aberto",
    )


async def verificar_conexao():
    await client.admin.command("ping")


async def fechar_conexao():
    client.close()
