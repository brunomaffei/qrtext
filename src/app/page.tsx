"use client";
import { QRCodeCanvas } from "qrcode.react";
import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [qrValue, setQrValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [displayTime, setDisplayTime] = useState(10);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!message && !image) {
      alert("Por favor, insira uma mensagem ou imagem.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("message", message);
    if (image) {
      formData.append("image", image, image.name);
    }
    formData.append("displayTime", displayTime.toString());

    try {
      const res = await fetch(`${window.location.origin}/api/messages`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorMessage = await res.json();
        console.error("Erro ao enviar mensagem:", errorMessage);
        alert(`Erro: ${errorMessage}`);
        return;
      }

      const data = await res.json();
      setQrValue(`${window.location.origin}/view/${data.id}`);
      setMessage("");
    } catch (error) {
      console.error("Erro de rede:", error);
      alert("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        alert("Apenas imagens JPG e PNG são permitidas.");
        setImage(null);
        return;
      }
      setImage(file);
    } else {
      setImage(null);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Escaneie o QR Code para acessar sua mensagem: ${qrValue}`
  )}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Mensagens Confidenciais com QR CODE
        </h1>
        <p className="text-gray-600 text-lg">
          Gere um QR Code para uma mensagem secreta com uma imagem opcional.
        </p>
      </header>

      {qrValue ? (
        <div className="text-center flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Escaneie o QR Code:
          </h2>
          <div className="inline-block bg-white p-4 rounded-lg shadow-lg">
            <QRCodeCanvas value={qrValue} size={256} />
          </div>
          <button
            onClick={() => {
              setQrValue("");
              setMessage("");
              setImage(null);
            }}
            className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Gerar nova mensagem
          </button>
          {/* O botão de compartilhar é gerado na visualização da mensagem */}
          <button
            onClick={() => window.open(whatsappUrl)}
            className="mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded-lg"
          >
            Compartilhar via WhatsApp
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem confidencial aqui..."
              rows={4}
              className="w-full text-black p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={displayTime}
              onChange={(e) => setDisplayTime(parseInt(e.target.value))}
              placeholder="Tempo em segundos"
              min="1"
              max="10" // Opcional
              className="w-full text-black p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="file"
              accept="image/jpeg, image/png"
              onChange={handleFileChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className={`w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition-colors ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Gerando..." : "Gerar QR Code"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
