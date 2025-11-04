import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { IncomingMessage } from "http";

// Desabilitar body parser para multipart/form-data
// O body parser será desabilitado dinamicamente no handler
export const config = {
  api: {
    bodyParser: false, // Desabilitar completamente - vamos processar manualmente
  },
};

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

    // Detectar Content-Type
    const contentType = req.headers["content-type"] || "";
    const isMultipart = contentType.includes("multipart/form-data");

    // Preparar headers
    const headers: any = {
      ...(authHeader && { Authorization: authHeader }),
    };

    // Para multipart/form-data, passar o Content-Type original com boundary
    if (isMultipart) {
      headers["Content-Type"] = contentType;
    } else {
      headers["Content-Type"] = "application/json";
    }

    // Preparar body apenas se necessário (POST, PUT, PATCH)
    let requestBody = undefined;
    if (req.method !== "GET" && req.method !== "DELETE" && req.method !== "HEAD") {
      if (isMultipart) {
        // Para FormData, usar o stream diretamente do request
        // O req é um IncomingMessage, podemos passar como stream
        requestBody = req as any;
      } else {
        // Para JSON, fazer parse manual do body
        if (req.body) {
          try {
            // Se já é objeto, usar diretamente
            if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
              requestBody = req.body;
            } else {
              // Se é string ou buffer, fazer parse JSON
              const bodyStr = typeof req.body === "string" ? req.body : req.body.toString();
              requestBody = bodyStr ? JSON.parse(bodyStr) : undefined;
            }
          } catch (e) {
            // Se não conseguir parsear, usar como está
            requestBody = req.body;
          }
        }
      }
    }

    // Preparar query params (remover 'path' que é usado para routing)
    const queryParams: any = { ...req.query };
    delete queryParams.path; // Remover 'path' dos query params

    // Fazer requisição para o backend
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: requestBody,
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      headers,
      validateStatus: () => true, // Não lançar erro para qualquer status
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Retornar resposta com os headers corretos
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Erro no proxy:", error.message);
    console.error("URL:", targetUrl);
    console.error("Method:", req.method);
    console.error("Content-Type:", req.headers["content-type"]);
    res.status(500).json({
      error: "Erro ao fazer proxy da requisição",
      message: error.message,
    });
  }
}

