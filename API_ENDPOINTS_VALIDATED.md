# 📋 Endpoints da API - Validação Completa

## 🎯 Base URL
```
http://localhost:8000/api
```

## ✅ Endpoints Validados

### 1. **Autenticação**
- **POST** `/users/login`
  - Payload: `{ username: string, password: string }`
  - Retorna: `{ token: string, user: {...} }`
  - **Status**: ✅ Validado

### 2. **Usuários - Clientes (role id = 1)**
- **GET** `/users/customers?page=1&limit=10`
  - Query params: `page?`, `limit?`, `search?`, `is_active?`
  - Retorna:
    ```json
    {
      "success": true,
      "data": [...],
      "pagination": {
        "total": 12,
        "page": 1,
        "limit": 10,
        "totalPages": 2,
        "hasNextPage": true,
        "hasPrevPage": false
      },
      "meta": {
        "showing": "1-10 de 12",
        "currentPage": 1,
        "perPage": 10,
        "type": "customers"
      },
      "metrics": {
        "total_customers": 12,
        "active_customers": 12,
        ...
      }
    }
    ```
  - **Filtro**: Retorna apenas users com `role_id = 1` (role "user")
  - **Status**: ✅ Validado

- **GET** `/users/:id` (para cliente específico)
  - Retorna:
    ```json
    {
      "success": true,
      "data": {
        "id": 15,
        "username": "juliana.maganga",
        "email": "juliana.maganga@example.com",
        "firstName": "Juliana",
        "lastName": "Maganga",
        "fullName": "Juliana Maganga",
        "phone": "+258843334567",
        "bi": "2345617890124",
        "isActive": true,
        "points": 12000,
        "level": "Platinum",
        "balance": 0,
        "pointsToNextLevel": 3000,
        "role": {
          "id": 1,
          "name": "user",
          "description": "Default user role"
        },
        "metrics": {
          "totalPurchases": 0,
          "totalSpent": 0,
          "transfers": {...},
          "rewards": {...},
          ...
        }
      }
    }
    ```
  - **Status**: ✅ Validado

- **POST** `/users` (criar cliente)
  - Payload: `{ username, email, password, firstName, lastName, phone, bi, role: "user" }`
  - Retorna: User criado
  - **Status**: ✅ Validado

- **PUT** `/users/:id` (atualizar cliente)
  - Payload: `{ firstName?, lastName?, email?, phone?, bi?, ... }`
  - Retorna: User atualizado
  - **Status**: ✅ Validado

- **DELETE** `/users/:id` (eliminar cliente)
  - Retorna: void
  - **Status**: ✅ Validado

### 3. **Usuários - Funcionários (role id != 1)**
- **GET** `/users/employees?page=1&limit=10`
  - Query params: `page?`, `limit?`, `search?`, `is_active?`
  - Retorna: `{ success: true, data: [...], pagination: {...}, meta: {...} }`
  - **Filtro**: Retorna apenas users com `role_id != 1` (exclui role "user")
  - **Status**: ✅ Validado

- **GET** `/users` (todos os usuários, sem filtro de role)
  - Retorna: `{ success: true, data: [...], pagination: {...}, meta: {...} }`
  - **Status**: ✅ Validado

### 4. **Estabelecimentos**
- **GET** `/establishments?all=true&includeInactive=true`
  - Query params: `all?`, `includeInactive?`
  - Retorna: Array ou `{ data: [...] }` ou `{ establishments: [...] }`
  - **Status**: ✅ Validado

- **GET** `/establishments/:id`
  - Retorna: `{ success: true, data: {...} }` ou objeto direto
  - **Status**: ✅ Validado

- **POST** `/establishments`
  - Payload: `FormData` (multipart/form-data) com imagens
  - Retorna: Establishment criado
  - **Status**: ✅ Validado

- **PUT** `/establishments/:id`
  - Payload: `FormData` (multipart/form-data) com imagens
  - Retorna: Establishment atualizado
  - **Status**: ✅ Validado

- **DELETE** `/establishments/:id`
  - Retorna: void
  - **Status**: ✅ Validado

## 🔍 Diferenças Importantes

### `/api/users/customers` vs `/api/users/employees` vs `/api/users`

| Endpoint | Filtro | Retorna |
|----------|--------|---------|
| `/api/users/customers` | `role_id = 1` (role "user") | Clientes do sistema de pontos |
| `/api/users/employees` | `role_id != 1` | Funcionários/staff |
| `/api/users` | Sem filtro | Todos os usuários |

### ⚠️ Endpoint `/api/customers` está DESABILITADO

O endpoint `/api/customers` está desabilitado no `app.js`:
```javascript
// Rotas de clientes (microcrédito) - DESABILITADO para sistema de pontos
// A tabela "customers" não existe no banco maktubia_points
// Use /api/users/customers para listar clientes do sistema de pontos
// const microcreditCustomerRoutes = require('./routes/customerRoutes');
// app.use("/api/customers", microcreditCustomerRoutes);
```

**✅ Usar `/api/users/customers` ao invés de `/api/customers`**

## 📊 Formato de Resposta - Clientes

### Listagem de Clientes (`GET /users/customers`)
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "username": "juliana.maganga",
      "email": "juliana.maganga@example.com",
      "firstName": "Juliana",
      "lastName": "Maganga",
      "fullName": "Juliana Maganga",
      "phone": "+258843334567",
      "bi": "2345617890124",
      "isActive": true,
      "lastLogin": null,
      "createdAt": "2025-11-01T20:02:31.490Z",
      "updatedAt": "2025-11-01T20:02:31.490Z",
      "points": 12000,
      "level": "Platinum",
      "balance": 0,
      "pointsToNextLevel": 3000,
      "role": {
        "id": 1,
        "name": "user",
        "description": "Default user role"
      },
      "permissions": {},
      "createdBy": null,
      "metrics": {
        "totalPurchases": 0,
        "totalSpent": 0,
        "firstPurchaseDate": null,
        "lastPurchaseDate": null,
        "maxPurchaseAmount": 0,
        "minPurchaseAmount": 0,
        "uniqueEstablishmentsVisited": 0,
        "totalPointTransactions": 0,
        "pointsEarned": 0,
        "pointsSpent": 0,
        "pointsBalance": 12000,
        "transfers": {
          "sent": 0,
          "received": 0,
          "pointsTransferredOut": 0,
          "pointsTransferredIn": 0
        },
        "rewards": {
          "redeemed": 0,
          "pointsSpent": 0
        },
        "daysSinceLastLogin": null,
        "daysSinceRegistration": 0,
        "activityStatus": "never_logged_in"
      }
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "meta": {
    "showing": "1-10 de 12",
    "currentPage": 1,
    "perPage": 10,
    "type": "customers"
  },
  "metrics": {
    "total_customers": 12,
    "active_customers": 12,
    "inactive_customers": 0,
    ...
  }
}
```

### Detalhes de Cliente (`GET /users/:id`)
Mesmo formato acima, mas `data` é um objeto único, não um array.

## 🔧 Mudanças Aplicadas

1. ✅ **customerService.getAll**: Usa `/users/customers` ao invés de `/customers`
2. ✅ **customerService.getById**: Usa `/users/:id` ao invés de `/customers/:id`
3. ✅ **customerService.create**: Usa `/users` com `role: "user"` ao invés de `/customers`
4. ✅ **customerService.update**: Usa `/users/:id` ao invés de `/customers/:id`
5. ✅ **customerService.delete**: Usa `/users/:id` ao invés de `/customers/:id`

## 📝 Notas Importantes

1. **Clientes são Users**: No sistema de pontos, clientes são `users` com `role_id = 1` (role "user")
2. **Funcionários são Users**: Funcionários são `users` com `role_id != 1`
3. **Não há tabela `customers`**: A tabela `customers` é do sistema de microcrédito, não existe neste banco
4. **Endpoints corretos**:
   - Clientes: `/api/users/customers` (listagem), `/api/users/:id` (detalhes)
   - Funcionários: `/api/users/employees` (listagem), `/api/users/:id` (detalhes)
   - Todos: `/api/users` (sem filtro)

