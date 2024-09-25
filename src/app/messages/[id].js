import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function MessagePage() {
  const router = useRouter();
  const { id } = router.query;
  const [messageData, setMessageData] = useState(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/messages?id=${id}`)
        .then((res) => res.json())
        .then((data) => setMessageData(data));
    }
  }, [id]);

  if (!messageData) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Mensagem Confidencial</h1>
        <p className="text-gray-800 mb-4">{messageData.message}</p>
        {messageData.imagePath && (
          <Image
            src={messageData.imagePath}
            alt="Imagem Confidencial"
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
        )}
      </div>
    </div>
  );
}
