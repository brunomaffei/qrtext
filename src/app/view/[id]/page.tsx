"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function ViewMessage({ params }: { params: { id: string } }) {
  const [messageData, setMessageData] = useState<{
    message: string;
    imageUrl?: string;
    displayTime: number;
  } | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await fetch(`/api/messages?id=${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessageData(data);
          setRemainingTime(data.displayTime);

          // Inicia a contagem regressiva
          const countdown = setInterval(() => {
            setRemainingTime((prevTime) => {
              if (prevTime <= 1) {
                clearInterval(countdown);
                handleDeleteMessage(); // Chama a função de deletar mensagem quando o tempo acabar
                return 0; // Define o tempo restante como 0
              }
              return prevTime - 1; // Decrementa o tempo
            });
          }, 1000);

          // Limpa o intervalo quando o componente é desmontado
          return () => clearInterval(countdown);
        } else if (res.status === 410) {
          setMessageData(null); // Define que a mensagem expirou
          setIsVisible(false);
        }
      } catch (error) {
        console.error("Erro ao buscar a mensagem:", error);
      }
    };

    fetchMessage();
  }, [params.id]);

  const handleDeleteMessage = async () => {
    try {
      await fetch(`/api/messages?id=${params.id}`, { method: "DELETE" });
      setMessageData(null);
      setIsVisible(false);
    } catch (error) {
      console.error("Erro ao deletar a mensagem:", error);
    }
  };

  if (!messageData) {
    return (
      <div className="min-h-screen text-black flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full text-center">
          <h2 className="text-xl font-bold mb-4">Mensagem não encontrada</h2>
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Gerar Novo QR Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      {isVisible ? (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
          <h2 className="text-xl font-bold mb-4">Mensagem Confidencial:</h2>
          <p>{messageData.message}</p>
          {messageData.imageUrl && (
            <img
              src={messageData.imageUrl}
              alt="Imagem da mensagem"
              className="mt-4 rounded-lg"
            />
          )}
          <div className="mt-4 text-lg">
            Tempo restante: {remainingTime} segundos
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full text-center">
          <h2 className="text-xl font-bold mb-4">Mensagem Expirada</h2>
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Gerar Novo QR Code
          </button>
        </div>
      )}
    </div>
  );
}
