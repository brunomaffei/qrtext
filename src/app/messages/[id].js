import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function MessagePage() {
  const router = useRouter();
  const { id } = router.query;
  const [messageData, setMessageData] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchMessage = async () => {
        try {
          const res = await fetch(
            `${window.location.origin}/api/messages?id=${id}`
          );
          if (!res.ok) {
            throw new Error("Erro ao buscar a mensagem");
          }
          const data = await res.json();
          setMessageData(data);
        } catch (error) {
          console.error("Erro:", error);
          setMessageData({ error: error.message });
        }
      };

      fetchMessage();
    }
  }, [id]);

  if (!messageData) {
    return <p>Carregando...</p>;
  }

  if (messageData.error) {
    return <p>{messageData.error}</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Mensagem Confidencial</h1>
        <p className="text-gray-800 mb-4">{messageData.message}</p>
        {messageData.imageUrl && (
          <Image
            src={messageData.imageUrl}
            alt="Imagem Confidencial"
            width={500}
            height={300}
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
        )}
      </div>
    </div>
  );
}
