import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const BACKEND_URL = "http://72.60.20.31:8000/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Obter o path da URL
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join("/") : path || "";

  // Construir URL completa
  const targetUrl = `${BACKEND_URL}/${apiPath}`;

  try {
    // Obter token do header Authorization
    const authHeader = req.headers.authorization;

    // Fazer requisição para o backend
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      validateStatus: () => true, // Não lançar erro para qualquer status
    });

    // Retornar resposta com os headers corretos
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Erro no proxy:", error.message);
    res.status(500).json({
      error: "Erro ao fazer proxy da requisição",
      message: error.message,
    });
  }
}

