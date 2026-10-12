
import asyncio

from app.database.connection import client, database


PRODUTO_ID = "81c31fe5-3219-4eec-a68a-84694e47ed09"


async def main():
    try:
        produto = await database.produtos.find_one(
            {"id": PRODUTO_ID}
        )

        if produto is None:
            print("FALHA: produto de teste não encontrado.")
            return

        saldo_antes = produto["quantidade_estoque"]

        print(f"Saldo original: {saldo_antes}")

        try:
            async with await client.start_session() as session:
                async with session.start_transaction():
                    resultado = await database.produtos.update_one(
                        {"id": PRODUTO_ID},
                        {"$inc": {"quantidade_estoque": 1}},
                        session=session,
                    )

                    if resultado.matched_count != 1:
                        raise RuntimeError(
                            "Produto não encontrado durante o teste."
                        )

                    temporario = await database.produtos.find_one(
                        {"id": PRODUTO_ID},
                        session=session,
                    )

                    print(
                        "Saldo dentro da transação:",
                        temporario["quantidade_estoque"],
                    )

                    # Simula uma falha antes do commit.
                    raise RuntimeError("FALHA_SIMULADA")

        except RuntimeError as erro:
            if str(erro) != "FALHA_SIMULADA":
                raise

            print("Falha simulada: transação abortada.")

        produto_final = await database.produtos.find_one(
            {"id": PRODUTO_ID}
        )

        if produto_final is None:
            print("FALHA: produto não encontrado após o teste.")
            return

        saldo_depois = produto_final["quantidade_estoque"]

        print(f"Saldo após o teste: {saldo_depois}")

        if saldo_depois == saldo_antes:
            print("APROVADO: o estoque foi preservado.")
        else:
            print("FALHA: o saldo foi alterado inesperadamente!")

    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
