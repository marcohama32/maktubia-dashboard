# 📋 Requisitos do Backend para Usuários

## 🔍 Análise do Backend

### ✅ **CRIAÇÃO DE USUÁRIO** (`POST /api/users`)

#### **Campos Obrigatórios:**
- `username` (string): Nome de usuário único
- `password` (string): Senha (mínimo 6 caracteres, validada pelo backend)
- `first_name` (string) OU `name` (string): Primeiro nome (obrigatório)

#### **Campos Opcionais:**
- `email` (string): Email válido e único (se fornecido, deve ser válido)
- `last_name` (string): Sobrenome (pode ser vazio)
- `phone` (string): Telefone (validado pelo backend se fornecido)
- `role_id` (integer) OU `role` (string): ID do role ou nome do role (ex: "admin", "merchant", "user")
- `bi` (string): Bilhete de Identidade (legado, para compatibilidade)
- `tipo_documento` (string): Tipo de documento ("BI", "Passaporte", "Carta de Condução", "NUIT", "Outro")
- `numero_documento` (string): Número do documento (validado pelo backend baseado no tipo)
- `isActive` (boolean): Status ativo (padrão: true)
- `created_by` (integer): ID do usuário que criou (automático, preenchido pelo backend)

#### **Validações do Backend:**
1. **Username**: Deve ser único
2. **Email**: Se fornecido, deve ser válido e único
3. **Phone**: Se fornecido, deve ser válido (formato moçambicano) e único
4. **Documento**: Se `tipo_documento` ou `numero_documento` for fornecido, ambos devem ser fornecidos juntos
5. **Documento**: Formato validado baseado no tipo (BI: 13 dígitos, NUIT: 9 dígitos, etc.)
6. **Documento**: Número deve ser único
7. **Role**: Se `role` (nome) for fornecido, será convertido para `role_id` automaticamente
8. **Password**: Validado pelo backend (mínimo 6 caracteres, regras de segurança)

#### **Exemplo de Payload:**
```json
{
  "username": "joao.silva",
  "password": "senha123",
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "+258841234567",
  "tipo_documento": "BI",
  "numero_documento": "1234567890123",
  "role": "user",
  "isActive": true
}
```

---

### ✏️ **EDIÇÃO DE USUÁRIO** (`PUT /api/users/:id`)

#### **Campos Permitidos para Atualização:**
- `username` (string): Nome de usuário (deve ser único se alterado)
- `email` (string): Email (deve ser válido e único se alterado)
- `first_name` (string) OU `name` (string): Primeiro nome
- `last_name` (string) OU `lastName` (string): Sobrenome
- `phone` (string): Telefone (validado se fornecido)
- `bi` (string): Bilhete de Identidade (legado)
- `role_id` (integer) OU `role` (string): ID do role ou nome do role
- `is_active` (boolean) OU `isActive` (boolean): Status ativo

#### **Normalizações Automáticas do Backend:**
- `name` → `first_name` e `last_name` (dividido por espaços)
- `firstName` → `first_name`
- `lastName` → `last_name`
- `role` (nome) → `role_id` (conversão automática)
- `isActive` → `is_active`

#### **Campos NÃO Permitidos:**
- `password`: Use endpoint separado `/api/users/:id/change-password`
- `password_hash`: Não pode ser atualizado diretamente
- `user_id`: Não pode ser alterado
- `created_at`: Não pode ser alterado
- `updated_at`: Atualizado automaticamente pelo backend
- `last_login`: Atualizado automaticamente pelo backend

#### **Validações do Backend:**
1. Username deve ser único (se alterado)
2. Email deve ser válido e único (se alterado)
3. Phone deve ser válido (se fornecido)
4. Role deve existir (se fornecido)

#### **Exemplo de Payload:**
```json
{
  "name": "João Carlos Silva",
  "phone": "+258841234567",
  "role": "merchant",
  "isActive": true
}
```

---

### 👁️ **VISUALIZAÇÃO DE USUÁRIO** (`GET /api/users/:id`)

#### **Dados Retornados:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "username": "joao.silva",
    "email": "joao@example.com",
    "firstName": "João",
    "lastName": "Silva",
    "fullName": "João Silva",
    "phone": "+258841234567",
    "tipoDocumento": "BI",
    "numeroDocumento": "1234567890123",
    "bi": "1234567890123",
    "isActive": true,
    "lastLogin": "2025-11-06T18:00:00.000Z",
    "createdAt": "2025-11-01T10:00:00.000Z",
    "updatedAt": "2025-11-06T18:00:00.000Z",
    "role": {
      "id": 3,
      "name": "user",
      "description": "Cliente padrão do sistema de pontos"
    },
    "permissions": {},
    "createdBy": {
      "id": 1,
      "username": "admin",
      "fullName": "Admin Sistema",
      "role": "admin"
    },
    "points": 1000,
    "level": "Bronze",
    "balance": 100.50,
    "pointsToNextLevel": 250,
    "metrics": {
      "totalPurchases": 5,
      "totalSpent": 500.00,
      "pointsEarned": 5000,
      "pointsSpent": 4000,
      "pointsBalance": 1000
    }
  }
}
```

---

### 🗑️ **DELEÇÃO DE USUÁRIO** (`DELETE /api/users/:id`)

#### **Validações do Backend:**
1. **Não pode deletar próprio usuário**: O backend impede que um usuário delete a si mesmo
2. **Validação de integridade**: Verifica se o usuário pode ser deletado:
   - ❌ **NÃO pode deletar** se houver pontos na carteira (`wallets.points > 0` ou `wallets.balance > 0`)
   - ❌ **NÃO pode deletar** se houver compras confirmadas (`purchases.status = 'confirmed'`)
   - ✅ **Pode deletar** se não houver pontos e não houver compras confirmadas

#### **Resposta de Erro (se não pode deletar):**
```json
{
  "success": false,
  "error": "Não é possível deletar usuário com pontos na carteira. Os pontos devem ser cancelados ou transferidos primeiro.",
  "code": "VALIDATION_ERROR",
  "data": {
    "points": 1000,
    "balance": 100.50,
    "confirmedPurchases": 5
  }
}
```

#### **Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Usuário deletado com sucesso"
}
```

---

## 📝 **Resumo dos Campos**

### **Criação:**
| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| `username` | string | ✅ Sim | Único |
| `password` | string | ✅ Sim | Mínimo 6 caracteres |
| `name` OU `first_name` | string | ✅ Sim | - |
| `last_name` | string | ❌ Não | - |
| `email` | string | ❌ Não | Válido e único (se fornecido) |
| `phone` | string | ❌ Não | Formato moçambicano e único (se fornecido) |
| `tipo_documento` | string | ❌ Não | "BI", "Passaporte", "Carta de Condução", "NUIT", "Outro" |
| `numero_documento` | string | ❌ Não | Validado baseado no tipo (se fornecido) |
| `bi` | string | ❌ Não | Legado, para compatibilidade |
| `role` OU `role_id` | string/integer | ❌ Não | Role deve existir |
| `isActive` | boolean | ❌ Não | Padrão: true |

### **Edição:**
| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| `username` | string | ❌ Não | Único (se alterado) |
| `email` | string | ❌ Não | Válido e único (se alterado) |
| `name` OU `first_name` | string | ❌ Não | - |
| `last_name` OU `lastName` | string | ❌ Não | - |
| `phone` | string | ❌ Não | Formato moçambicano (se fornecido) |
| `bi` | string | ❌ Não | - |
| `role` OU `role_id` | string/integer | ❌ Não | Role deve existir |
| `isActive` OU `is_active` | boolean | ❌ Não | - |

### **Deleção:**
- Requer autenticação
- Não pode deletar próprio usuário
- Validação de integridade (pontos e compras confirmadas)

---

## 🔧 **Notas Importantes:**

1. **Nome**: O backend aceita `name` (completo) ou `first_name`/`last_name` (separados). Se `name` for fornecido, será dividido automaticamente.

2. **Role**: O backend aceita `role` (nome da role como string) ou `role_id` (ID numérico). Se `role` for fornecido, será convertido para `role_id` automaticamente.

3. **Documentos**: O backend suporta os novos campos `tipo_documento` e `numero_documento`, mas mantém `bi` para compatibilidade. Se ambos forem fornecidos, `tipo_documento` e `numero_documento` têm prioridade.

4. **Telefone**: O backend valida o formato moçambicano automaticamente.

5. **Senha**: Não pode ser atualizada via `PUT /api/users/:id`. Use `PUT /api/users/:id/change-password` com `currentPassword` e `newPassword`.

6. **Deleção**: O backend valida integridade antes de permitir deleção. Se houver pontos ou compras confirmadas, a deleção será bloqueada.





