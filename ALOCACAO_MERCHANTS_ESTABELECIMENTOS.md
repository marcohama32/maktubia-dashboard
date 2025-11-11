# Alocação de Merchants/Users a Estabelecimentos

## Visão Geral

O sistema permite que **usuários** (com role "admin" ou "merchant") sejam alocados a **estabelecimentos** através da criação de um registro **Merchant**. Quando um usuário é alocado a um estabelecimento, ele passa a ter permissões específicas para gerenciar campanhas daquele estabelecimento.

## Estrutura de Dados

### Merchant (Alocação)
Um **Merchant** é a relação entre um **User** e um **Establishment**, com permissões específicas:

```typescript
interface Merchant {
  merchant_id: number;
  user_id: number;              // ID do usuário alocado
  establishment_id: number;    // ID do estabelecimento
  can_create_campaigns: boolean; // Permissão para criar campanhas
  can_set_custom_points: boolean; // Permissão para definir pontos personalizados
  is_active: boolean;           // Status ativo/inativo
}
```

### Estabelecimento com Permissões do Merchant
Quando um merchant consulta seus estabelecimentos, recebe:

```typescript
interface EstablishmentWithMerchantPermissions {
  id: number;
  name: string;
  type?: string;
  address?: string;
  phone?: string;
  email?: string;
  merchant_permissions?: {
    can_create_campaigns: boolean;
    can_set_custom_points: boolean;
    merchant_id: number;
  };
}
```

## Fluxo de Alocação

### 1. Criar Merchant (Alocação)
**Endpoint:** `POST /api/merchants`

**Requisitos:**
- Apenas **admins** podem criar merchants
- O usuário deve ter role "admin" ou "merchant" (não pode ser "user")
- Um usuário pode ser alocado a múltiplos estabelecimentos
- Um estabelecimento pode ter múltiplos merchants

**Payload:**
```json
{
  "user_id": 123,
  "establishment_id": 456,
  "can_create_campaigns": true,
  "can_set_custom_points": false,
  "is_active": true
}
```

**Processo:**
1. Admin seleciona um usuário (com role "admin" ou "merchant")
2. Admin seleciona um estabelecimento
3. Admin define as permissões:
   - `can_create_campaigns`: permite criar e gerenciar campanhas
   - `can_set_custom_points`: permite definir pontos personalizados
4. Sistema cria o registro Merchant

### 2. Consultar Estabelecimentos do Merchant
**Endpoint:** `GET /api/establishments/merchants/establishments`

**Descrição:**
- Retorna todos os estabelecimentos aos quais o usuário autenticado está alocado
- Inclui as permissões do merchant para cada estabelecimento
- Usado pelo frontend para filtrar estabelecimentos disponíveis ao criar campanhas

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "name": "Loja Central",
      "type": "Retail",
      "merchant_permissions": {
        "can_create_campaigns": true,
        "can_set_custom_points": false,
        "merchant_id": 789
      }
    }
  ],
  "isMerchant": true,
  "isAdmin": false
}
```

## Criação de Campanhas

### Como Funciona

1. **Merchant autenticado** consulta seus estabelecimentos:
   ```typescript
   const response = await merchantsService.getMyEstablishments();
   const establishments = response.data || [];
   ```

2. **Filtra estabelecimentos** com permissão de criar campanhas:
   ```typescript
   const availableEstablishments = establishments.filter(e => 
     e.merchant_permissions?.can_create_campaigns
   );
   ```

3. **Seleciona estabelecimento** e cria campanha:
   ```typescript
   const campaignData = {
     establishment_id: selectedEstablishment.id,
     campaign_name: "Campanha de Verão",
     sponsor_name: "Patrocinador",
     valid_from: "2024-01-01",
     valid_until: "2024-12-31",
     // ... outros campos
   };
   
   await campaignsService.create(campaignData);
   ```

### Validações no Backend

O backend valida:
1. **Usuário autenticado** é merchant do estabelecimento
2. **Merchant tem permissão** `can_create_campaigns = true`
3. **Estabelecimento existe** e está ativo
4. **Dados da campanha** são válidos

### Endpoint de Criação
**Endpoint:** `POST /api/campaigns`

**Payload:**
```json
{
  "establishment_id": 456,
  "campaign_name": "Campanha de Verão",
  "sponsor_name": "Patrocinador",
  "valid_from": "2024-01-01",
  "valid_until": "2024-12-31",
  "status": "Rascunho",
  "accumulation_rate": 0.1,
  // ... outros campos opcionais
}
```

## Permissões e Controle de Acesso

### Hierarquia de Permissões

1. **Admin:**
   - Pode criar merchants (alocar usuários a estabelecimentos)
   - Pode ver todas as campanhas
   - Pode criar campanhas para qualquer estabelecimento
   - Pode gerenciar permissões de merchants

2. **Merchant (com permissão):**
   - Pode ver apenas seus estabelecimentos
   - Pode criar campanhas apenas para estabelecimentos onde tem `can_create_campaigns = true`
   - Pode editar apenas campanhas que criou

3. **Merchant (sem permissão):**
   - Pode ver seus estabelecimentos
   - **NÃO** pode criar campanhas

### Gerenciamento de Permissões

**Conceder permissão de campanhas:**
- `POST /api/merchants/:id/permissions/campaigns/grant`

**Revogar permissão de campanhas:**
- `POST /api/merchants/:id/permissions/campaigns/revoke`

**Conceder permissão de pontos personalizados:**
- `POST /api/merchants/:id/permissions/custom-points/grant`

**Revogar permissão de pontos personalizados:**
- `POST /api/merchants/:id/permissions/custom-points/revoke`

## Endpoints da API

### Merchants (Alocação)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/api/merchants` | Listar todos os merchants | Admin |
| `GET` | `/api/merchants/:id` | Buscar merchant por ID | Admin |
| `POST` | `/api/merchants` | Criar merchant (alocar usuário) | Admin |
| `PUT` | `/api/merchants/:id` | Atualizar merchant | Admin |
| `DELETE` | `/api/merchants/:id` | Deletar merchant | Admin |
| `GET` | `/api/merchants/establishment/:id` | Merchants de um estabelecimento | Admin |
| `GET` | `/api/merchants/user/:id` | Merchants de um usuário | Admin |
| `GET` | `/api/merchants/check` | Verificar se usuário é merchant | Autenticado |
| `GET` | `/api/establishments/merchants/establishments` | Estabelecimentos do merchant autenticado | Merchant |

### Campanhas

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/api/campaigns` | Listar todas as campanhas | Admin |
| `GET` | `/api/campaigns/my` | Campanhas do merchant autenticado | Merchant |
| `GET` | `/api/campaigns/:id` | Buscar campanha por ID | Autenticado |
| `GET` | `/api/campaigns/establishment/:id` | Campanhas de um estabelecimento | Autenticado |
| `POST` | `/api/campaigns` | Criar campanha | Admin ou Merchant (com permissão) |
| `PUT` | `/api/campaigns/:id` | Atualizar campanha | Admin ou Merchant (criador) |
| `DELETE` | `/api/campaigns/:id` | Deletar campanha | Admin |
| `POST` | `/api/campaigns/:id/status` | Mudar status da campanha | Admin ou Merchant (criador) |

## Fluxo Completo: Exemplo

### Cenário: Alocar usuário e criar campanha

1. **Admin cria merchant (aloca usuário):**
   ```
   POST /api/merchants
   {
     "user_id": 123,
     "establishment_id": 456,
     "can_create_campaigns": true,
     "can_set_custom_points": false,
     "is_active": true
   }
   ```

2. **Merchant faz login e consulta estabelecimentos:**
   ```
   GET /api/establishments/merchants/establishments
   ```
   Retorna estabelecimento 456 com `merchant_permissions.can_create_campaigns = true`

3. **Merchant cria campanha:**
   ```
   POST /api/campaigns
   {
     "establishment_id": 456,
     "campaign_name": "Promoção de Verão",
     "sponsor_name": "Empresa XYZ",
     "valid_from": "2024-01-01",
     "valid_until": "2024-12-31",
     "status": "Rascunho"
   }
   ```

4. **Backend valida:**
   - ✅ Usuário autenticado (ID: 123) é merchant do estabelecimento 456
   - ✅ Merchant tem `can_create_campaigns = true`
   - ✅ Estabelecimento existe e está ativo
   - ✅ Dados da campanha são válidos

5. **Campanha criada com sucesso!**

## Observações Importantes

1. **Um usuário pode ser alocado a múltiplos estabelecimentos:**
   - Cada alocação é um registro Merchant separado
   - Permissões são independentes por estabelecimento

2. **Um estabelecimento pode ter múltiplos merchants:**
   - Diferentes usuários podem gerenciar o mesmo estabelecimento
   - Cada um com suas próprias permissões

3. **Permissões são granulares:**
   - `can_create_campaigns`: controla criação/edição de campanhas
   - `can_set_custom_points`: controla definição de pontos personalizados
   - Podem ser concedidas/revogadas independentemente

4. **Validação no frontend:**
   - Frontend filtra estabelecimentos com `can_create_campaigns = true`
   - Mas o backend sempre valida novamente para segurança

5. **Role do usuário:**
   - Apenas usuários com role "admin" ou "merchant" podem ser alocados
   - Usuários com role "user" não podem ter merchants

## Código Frontend Relevante

### Serviços
- `src/services/merchants.service.ts` - Gerenciamento de merchants
- `src/services/campaigns.service.ts` - Gerenciamento de campanhas
- `src/services/establishment.service.ts` - Gerenciamento de estabelecimentos

### Páginas
- `src/pages/admin/merchants/new.tsx` - Criar merchant (alocação)
- `src/pages/admin/merchants/index.tsx` - Listar merchants
- `src/pages/admin/campaigns/new.tsx` - Criar campanha (admin)
- `src/pages/merchant/campaigns/new.tsx` - Criar campanha (merchant)

### Lógica de Filtro
```typescript
// Em src/pages/merchant/campaigns/new.tsx
const loadEstablishments = async () => {
  const response = await merchantsService.getMyEstablishments();
  // Filtrar apenas estabelecimentos com permissão
  const availableEstablishments = (response.data || []).filter(e => 
    e.merchant_permissions?.can_create_campaigns
  );
  setEstablishments(availableEstablishments);
};
```

