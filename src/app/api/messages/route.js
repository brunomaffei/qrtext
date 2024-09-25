// src/app/api/messages/route.js
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";
import path from "path";

let messages = {};

export async function POST(req) {
  try {
    const formData = await req.formData();
    const message = formData.get("message");
    const image = formData.get("image");
    const displayTime = parseInt(formData.get("displayTime"), 10) || 10; // Tempo em segundos, padrão 10

    if (!message && !image) {
      return new Response(
        JSON.stringify({ error: "Nenhuma mensagem ou imagem fornecida." }),
        { status: 400 }
      );
    }

    const id = uuidv4();
    let imagePath = null;

    // Armazenar imagem se houver
    if (image) {
      // Valide se a imagem é um arquivo
      if (!(image instanceof File)) {
        return new Response(
          JSON.stringify({ error: "O arquivo de imagem é inválido." }),
          { status: 400 }
        );
      }

      const imageName = `${id}-${image.name}`;
      const filePath = path.join(process.cwd(), "public/uploads", imageName);
      const buffer = Buffer.from(await image.arrayBuffer());

      await fs.writeFile(filePath, buffer);
      imagePath = `/uploads/${imageName}`;
    }

    // Salva a mensagem, o caminho da imagem e o tempo de exibição
    messages[id] = { message, imagePath, createdAt: Date.now(), displayTime };

    return new Response(JSON.stringify({ id }), { status: 200 });
  } catch (error) {
    console.error("Erro no processamento da requisição:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao processar a requisição.",
      }),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!messages[id]) {
    return new Response(JSON.stringify({ error: "Mensagem não encontrada." }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify(messages[id]), { status: 200 });
}
