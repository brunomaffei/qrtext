import { addDoc, collection, deleteDoc, doc, getDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { db, storage } from "../../firebase";

export async function POST(req) {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  try {
    const formData = await req.formData();
    const message = formData.get("message");
    const image = formData.get("image");
    const displayTime = parseInt(formData.get("displayTime"), 10) || 10;

    if (!message && !image) {
      return new Response(
        JSON.stringify({ error: "Nenhuma mensagem ou imagem fornecida." }),
        { status: 400 }
      );
    }

    // Validação do tipo de arquivo
    const validTypes = ["image/jpeg", "image/png"];
    if (image && !validTypes.includes(image.type)) {
      return new Response(
        JSON.stringify({ error: "O arquivo de imagem deve ser JPG ou PNG." }),
        { status: 400 }
      );
    }

    if (!message && !image) {
      return new Response(
        JSON.stringify({ error: "Nenhuma mensagem ou imagem fornecida." }),
        { status: 400 }
      );
    }

    let imageUrl = null;
    const id = uuidv4();

    // Upload da imagem para o Firebase Storage
    if (image) {
      const imageName = `${id}-${image.name}`;
      const storageRef = ref(storage, `uploads/${imageName}`);

      try {
        console.log("Iniciando a conversão da imagem para arrayBuffer");
        const fileBuffer = await image.arrayBuffer();
        console.log("Tamanho do buffer da imagem:", fileBuffer.byteLength);

        console.log("Iniciando o upload da imagem");
        await uploadBytes(storageRef, new Uint8Array(fileBuffer));
        console.log("Upload da imagem concluído");

        console.log("Obtendo a URL de download da imagem");
        imageUrl = await getDownloadURL(storageRef);
        console.log("URL de download da imagem obtida:", imageUrl);
      } catch (uploadError) {
        console.error("Erro ao fazer upload da imagem:", uploadError.message);
        return new Response(
          JSON.stringify({ error: "Erro ao fazer upload da imagem." }),
          { status: 500 }
        );
      }
    }
    // Salva a mensagem e a URL da imagem no Firestore
    const docRef = await addDoc(collection(db, "messages"), {
      message,
      imageUrl,
      displayTime,
      createdAt: Date.now(),
    });

    return new Response(JSON.stringify({ id: docRef.id }), { status: 200 });
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

  if (!id) {
    return new Response(
      JSON.stringify({ error: "ID da mensagem não fornecido." }),
      { status: 400 }
    );
  }

  try {
    const docRef = doc(db, "messages", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return new Response(
        JSON.stringify({ error: "Mensagem não encontrada." }),
        { status: 404 }
      );
    }

    const messageData = docSnap.data();
    const currentTime = Date.now();
    const timeElapsed = (currentTime - messageData.createdAt) / 1000;

    if (timeElapsed > messageData.displayTime) {
      // Deletar a mensagem do Firestore
      await deleteDoc(docRef);

      // Deletar a imagem do Firebase Storage (se houver)
      if (messageData.imageUrl) {
        const fileName = messageData.imageUrl.split("/uploads/")[1]; // Extrai o nome do arquivo do caminho completo
        if (fileName) {
          const storageRef = ref(storage, `uploads/${fileName}`);
          await deleteObject(storageRef);
        }
      }

      return new Response(
        JSON.stringify({ error: "Mensagem expirada e deletada." }),
        { status: 410 }
      );
    }

    return new Response(JSON.stringify(messageData), { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar a mensagem:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao processar a requisição.",
      }),
      { status: 500 }
    );
  }
}
