"use client";
import { useRouter } from "next/navigation";
import React from "react";
import { useEffect, useState } from "react";

export default function ViewMessage({ params }: { params: any }) {
  const [messageData, setMessageData] = useState<{
    message: string;
    imagePath?: string;
  } | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMessage = async () => {
      const res = await fetch(`/api/messages?id=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessageData(data);
        setRemainingTime(data.displayTime); // Define o tempo restante

        // Configura o temporizador para atualizar a contagem regressiva
        const timer = setInterval(() => {
          setRemainingTime((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setIsVisible(false); // Esconde a mensagem quando expirar
              return 0;
            }
            return prev - 1; // Diminui o tempo restante
          });
        }, 1000); // Atualiza a cada segundo

        return () => clearInterval(timer); // Limpa o temporizador
      } else {
        console.error("Erro ao buscar a mensagem:", res.status);
      }
    };
    fetchMessage();
  }, [params.id]);

  if (!messageData) return <p>Carregando...</p>;

  return (
    <div className="min-h-screen text-black flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      {isVisible ? (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
          <h2 className="text-xl font-bold mb-4">Mensagem Confidencial:</h2>
          <p>{messageData.message}</p>
          {messageData.imagePath && (
            <img
              src={messageData.imagePath}
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
