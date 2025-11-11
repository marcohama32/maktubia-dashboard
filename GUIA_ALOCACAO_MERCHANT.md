# Guia: Como Alocar um Merchant a um Estabelecimento

## 📋 Pré-requisitos

1. **Você precisa ser um ADMIN** - Apenas administradores podem fazer alocações
2. **O usuário deve ter role "admin" ou "merchant"** - Usuários com role "user" não podem ser alocados
3. **O estabelecimento deve existir** no sistema

## 🚀 Passo a Passo

### Passo 1: Acessar a Página de Merchants

1. Faça login como **admin**
2. No menu lateral, acesse **"Merchants"** ou navegue para:
   ```
   /admin/merchants
   ```

### Passo 2: Criar Nova Alocação

1. Na página de Merchants, clique no botão **"Novo Merchant"** ou **"Criar Merchant"**
2. Você será redirecionado para:
   ```
   /admin/merchants/new
   ```

### Passo 3: Preencher o Formulário

O formulário possui os seguintes campos:

#### 1. **Usuário** (Obrigatório) ⭐
- **Selecione um usuário** da lista
- Apenas usuários com role **"admin"** ou **"merchant"** aparecem na lista
- O formato exibido é: `Nome Completo (email) - role`

#### 2. **Estabelecimento** (Obrigatório) ⭐
- **Selecione um estabelecimento** da lista
- Todos os estabelecimentos cadastrados aparecem
- O formato exibido é: `Nome do Estabelecimento (Tipo)`

#### 3. **Permissões** (Opcionais)

##### ✅ **Pode criar campanhas**
- Marque esta opção se o merchant deve poder **criar e gerenciar campanhas** para este estabelecimento
- **Importante:** Sem esta permissão, o merchant não conseguirá criar campanhas

##### ✅ **Pode definir pontos personalizados**
- Marque esta opção se o merchant deve poder **definir taxas de pontos personalizadas** para este estabelecimento

##### ✅ **Ativo**
- Marque para manter o merchant ativo (recomendado)
- Se desmarcado, o merchant não poderá acessar o estabelecimento

### Passo 4: Salvar a Alocação

1. Clique no botão **"Criar Merchant"**
2. Aguarde a confirmação de sucesso
3. Você será redirecionado automaticamente para a página de detalhes do merchant criado

## 📝 Exemplo Prático

### Cenário: Alocar João Silva à Loja Central

1. **Acesse:** `/admin/merchants/new`

2. **Preencha:**
   - **Usuário:** João Silva (joao@exemplo.com) - merchant
   - **Estabelecimento:** Loja Central (Retail)
   - **Permissões:**
     - ✅ Pode criar campanhas
     - ❌ Pode definir pontos personalizados
     - ✅ Ativo

3. **Clique em:** "Criar Merchant"

4. **Resultado:** João Silva agora pode criar campanhas para a Loja Central!

## 🔍 Verificar Alocações Existentes

### Ver todos os Merchants
- Acesse: `/admin/merchants`
- Você verá uma lista com todas as alocações

### Ver Merchants de um Estabelecimento
- Na página de estabelecimentos, você pode ver quais merchants estão alocados

### Ver Estabelecimentos de um Merchant
- Quando o merchant faz login, ele vê apenas os estabelecimentos onde está alocado
- Endpoint: `GET /api/establishments/merchants/establishments`

## ⚠️ Observações Importantes

### 1. **Um usuário pode ter múltiplas alocações**
- O mesmo usuário pode ser alocado a **vários estabelecimentos**
- Cada alocação é **independente** com suas próprias permissões
- Exemplo:
  - João Silva → Loja Central (pode criar campanhas)
  - João Silva → Loja Norte (não pode criar campanhas)

### 2. **Um estabelecimento pode ter múltiplos merchants**
- Diferentes usuários podem gerenciar o **mesmo estabelecimento**
- Cada um com suas próprias permissões
- Exemplo:
  - João Silva → Loja Central (pode criar campanhas)
  - Maria Santos → Loja Central (pode criar campanhas)

### 3. **Permissões são específicas por estabelecimento**
- As permissões são **independentes** para cada alocação
- Um merchant pode ter permissão em um estabelecimento e não ter em outro

### 4. **Validações do Sistema**
- ❌ Não é possível alocar o mesmo usuário ao mesmo estabelecimento duas vezes
- ❌ Usuários com role "user" não podem ser alocados
- ✅ Admins podem ser alocados (útil para testes)

## 🔧 Gerenciar Permissões Após Criação

### Conceder/Revogar Permissão de Campanhas

1. Acesse a página de detalhes do merchant: `/admin/merchants/:id`
2. Use os botões de ação:
   - **"Conceder permissão de campanhas"** - Dá permissão para criar campanhas
   - **"Revogar permissão de campanhas"** - Remove permissão para criar campanhas

### Conceder/Revogar Permissão de Pontos Personalizados

1. Acesse a página de detalhes do merchant: `/admin/merchants/:id`
2. Use os botões de ação:
   - **"Conceder permissão de pontos personalizados"** - Dá permissão para definir pontos
   - **"Revogar permissão de pontos personalizados"** - Remove permissão para definir pontos

## 🎯 Após a Alocação

### O que o Merchant pode fazer:

1. **Fazer login** no sistema
2. **Ver seus estabelecimentos** alocados
3. **Criar campanhas** (se tiver permissão `can_create_campaigns = true`)
4. **Gerenciar campanhas** que criou

### O que o Merchant NÃO pode fazer:

1. ❌ Ver estabelecimentos onde não está alocado
2. ❌ Criar campanhas sem permissão
3. ❌ Editar campanhas de outros merchants
4. ❌ Ver campanhas de outros estabelecimentos

## 📊 Estrutura de Dados

Quando você cria uma alocação, o sistema cria um registro com:

```json
{
  "merchant_id": 123,
  "user_id": 456,
  "establishment_id": 789,
  "can_create_campaigns": true,
  "can_set_custom_points": false,
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

## 🔗 Endpoints da API

### Criar Alocação (Merchant)
```
POST /api/merchants
```

**Payload:**
```json
{
  "user_id": 456,
  "establishment_id": 789,
  "can_create_campaigns": true,
  "can_set_custom_points": false,
  "is_active": true
}
```

### Listar Todas as Alocações
```
GET /api/merchants
```
(Apenas admin)

### Ver Estabelecimentos do Merchant Autenticado
```
GET /api/establishments/merchants/establishments
```
(Usado pelo merchant após login)

## ❓ Perguntas Frequentes

### P: Posso alocar o mesmo usuário ao mesmo estabelecimento duas vezes?
**R:** Não, o sistema impede duplicatas. Você receberá um erro se tentar.

### P: O que acontece se eu desmarcar "Ativo"?
**R:** O merchant não poderá mais acessar o estabelecimento, mesmo que tenha permissões.

### P: Posso mudar as permissões depois?
**R:** Sim! Você pode editar o merchant e alterar as permissões a qualquer momento.

### P: Um merchant pode criar campanhas em estabelecimentos diferentes?
**R:** Sim, desde que tenha a permissão `can_create_campaigns = true` em cada estabelecimento.

### P: Como saber quais merchants estão alocados a um estabelecimento?
**R:** Na página de detalhes do estabelecimento ou na lista de merchants, você pode filtrar por estabelecimento.

## 🎓 Resumo Rápido

1. **Acesse:** `/admin/merchants/new`
2. **Selecione:** Usuário + Estabelecimento
3. **Configure:** Permissões (principalmente "Pode criar campanhas")
4. **Salve:** Clique em "Criar Merchant"
5. **Pronto!** O merchant agora pode gerenciar campanhas para aquele estabelecimento

---

**Dica:** Sempre marque "Pode criar campanhas" se o merchant precisa criar campanhas para o estabelecimento!

