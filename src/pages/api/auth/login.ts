import type { NextApiRequest, NextApiResponse } from "next";

// Simulação de um banco de dados de usuários
const users = [
  {
    id: 1,
    email: "admin@example.com",
    // Em um sistema real, a senha seria hash
    password: "admin123",
    name: "Admin User"
  }
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password } = req.body;

  // Encontrar usuário
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Email ou senha inválidos" });
  }

  // Em um sistema real, você geraria um JWT token aqui
  const token = "fake-jwt-token";

  // Retorna o token e os dados do usuário (exceto a senha)
  const { password: _, ...userWithoutPassword } = user;
  res.status(200).json({
    token,
    user: userWithoutPassword
  });
}