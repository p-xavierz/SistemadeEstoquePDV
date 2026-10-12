import asyncio
from datetime import datetime, timezone
from getpass import getpass
from uuid import uuid4

from pydantic import EmailStr, TypeAdapter, ValidationError
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError

from app.core.config import settings
from app.core.security import hash_senha


async def criar_administrador():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DATABASE]

    try:
        await client.admin.command("ping")
        await database.users.create_index("email", unique=True)

        nome = input("Nome do administrador: ").strip()
        email_digitado = input("E-mail do administrador: ").strip().lower()

        if not nome:
            print("Erro: o nome não pode ficar vazio.")
            return

        try:
            email = str(
                TypeAdapter(EmailStr).validate_python(email_digitado)
            ).lower()
        except ValidationError:
            print("Erro: informe um e-mail válido.")
            return

        existente = await database.users.find_one({"email": email})

        if existente:
            print("Já existe uma conta com esse e-mail.")
            return

        senha = getpass("Crie uma senha (mínimo 12 caracteres): ")
        confirmacao = getpass("Confirme a senha: ")

        if len(senha) < 12:
            print("Erro: a senha precisa ter pelo menos 12 caracteres.")
            return

        if senha != confirmacao:
            print("Erro: as senhas não são iguais.")
            return

        usuario = {
            "id": str(uuid4()),
            "nome": nome,
            "email": email,
            "senha_hash": hash_senha(senha),
            "perfil": "admin",
            "ativo": True,
            "criado_em": datetime.now(timezone.utc).isoformat(),
        }

        try:
            await database.users.insert_one(usuario)
        except DuplicateKeyError:
            print("Já existe uma conta com esse e-mail.")
            return

        print("\nAdministrador criado com sucesso!")
        print(f"E-mail: {email}")
        print("A senha não foi armazenada em texto puro.")

    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(criar_administrador())