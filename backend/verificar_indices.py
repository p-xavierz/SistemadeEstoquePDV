
import asyncio
from app.database.connection import database, client


async def main():
    try:
        indices = await database["produtos"].index_information()

        print("\nÍndices da coleção produtos:\n")

        for nome, detalhes in indices.items():
            print(f"Nome: {nome}")
            print(f"Detalhes: {detalhes}")
            print("-" * 50)
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
