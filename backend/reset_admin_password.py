
import asyncio
from getpass import getpass

from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import EmailStr, TypeAdapter, ValidationError

from app.core.config import settings
from app.core.security import hash_senha


async def redefinir_senha():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DATABASE]

    try:
        await client.admin.command("ping")

        email_digitado = input("E-mail do administrador: ").strip().lower()

        try:
            email = str(
                TypeAdapter(EmailStr).validate_python(email_digitado)
            ).lower()
        except ValidationError:
            print("E-mail inválido.")
            return

        usuario = await database.users.find_one({
            "email": email,
            "perfil": "admin",
        })

        if not usuario:
            print("Administrador não encontrado.")
            return

        senha = getpass("Nova senha (mínimo 12 caracteres): ")
        confirmacao = getpass("Confirme a nova senha: ")

        if len(senha) < 12:
            print("A senha precisa ter pelo menos 12 caracteres.")
            return

        if senha != confirmacao:
            print("As senhas não são iguais.")
            return

        await database.users.update_one(
            {"id": usuario["id"]},
            {"$set": {"senha_hash": hash_senha(senha)}},
        )

        print("Senha do administrador atualizada com sucesso.")

    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(redefinir_senha())