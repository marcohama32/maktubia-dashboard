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

  // Construir URL completa (remover /api duplicado se houver)
  let targetUrl = `${BACKEND_URL}/${apiPath}`;
  // Garantir que não há duplicação de /api
  targetUrl = targetUrl.replace(/\/api\/api\//g, "/api/");

  try {
    // Obter token do header Authorization
    const authHeader = req.headers.authorization;

    // Preparar body apenas se necessário (POST, PUT, PATCH)
    let requestBody = undefined;
    if (req.method !== "GET" && req.method !== "DELETE" && req.body) {
      // Se body já é objeto, usar diretamente; se for string, parsear JSON
      if (typeof req.body === "string") {
        try {
          requestBody = JSON.parse(req.body);
        } catch {
          requestBody = req.body;
        }
      } else {
        requestBody = req.body;
      }
    }

    // Fazer requisição para o backend
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: requestBody,
      params: req.query, // Query params (para GET requests)
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
    console.error("URL:", targetUrl);
    console.error("Method:", req.method);
    res.status(500).json({
      error: "Erro ao fazer proxy da requisição",
      message: error.message,
    });
  }
}

