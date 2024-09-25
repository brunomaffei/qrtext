import { db, storage } from "@/app/firebase";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const message = formData.get("message");
    const image = formData.get("image");
    const displayTime = parseInt(formData.get("displayTime"), 10) || 10;
    // Adicione isso no início da função POST
    const validTypes = ["image/jpeg", "image/png"];

    if (image) {
      // Verifica se é um arquivo válido
      if (!(image instanceof File) || !validTypes.includes(image.type)) {
        return new Response(
          JSON.stringify({ error: "O arquivo de imagem deve ser JPG ou PNG." }),
          { status: 400 }
        );
      }
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
      // Verifica se é um arquivo válido
      if (!(image instanceof File)) {
        return new Response(
          JSON.stringify({ error: "O arquivo de imagem é inválido." }),
          { status: 400 }
        );
      }

      const imageName = `${id}-${image.name}`;
      const storageRef = ref(storage, `uploads/${imageName}`);
      await uploadBytes(storageRef, image);

      imageUrl = await getDownloadURL(storageRef);
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
        const storageRef = ref(storage, messageData.imageUrl);
        await deleteObject(storageRef);
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
