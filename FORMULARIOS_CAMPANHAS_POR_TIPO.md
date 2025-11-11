# Documentação: Formulários de Campanhas por Tipo

## Visão Geral

Este documento descreve a estrutura completa dos formulários de criação de campanhas, incluindo campos comuns e campos específicos para cada um dos 7 tipos de campanha implementados no backend.

## Campos Comuns (Todos os Tipos)

### Informações Básicas
- **establishment_id** (obrigatório) - ID do estabelecimento
- **campaign_name** (obrigatório) - Nome da campanha
- **sponsor_name** (obrigatório) - Nome do patrocinador
- **description** (opcional) - Descrição geral da campanha

### Período
- **valid_from** (obrigatório) - Data de início (formato: YYYY-MM-DD)
- **valid_until** (obrigatório) - Data de término (formato: YYYY-MM-DD)
- **redemption_deadline** (opcional) - Prazo para resgate

### Status e Configurações
- **status** (opcional, padrão: "Rascunho") - Status da campanha
  - Valores: "Rascunho", "Activo", "Parado", "Cancelado", "Concluído", "Expirado"
- **is_active** (opcional, padrão: true) - Se a campanha está ativa

### Imagens e QR Code
- **image** (opcional) - Arquivo de imagem principal (File)
- **qr_code_image** (opcional) - Arquivo de QR code (File)

### Configurações Avançadas (Opcionais)
- **accumulation_rate** (opcional) - Taxa de acumulação (ex: 0.1 = 1 MT = 10 pts)
- **bonus_multiplier** (opcional) - Multiplicador de bônus (ex: 2.0 = dobra os pontos)
- **min_purchase_amount** (opcional) - Valor mínimo de compra (MT)
- **max_purchase_amount** (opcional) - Valor máximo de compra (MT)
- **total_points_limit** (opcional) - Limite total de pontos (plafond)
- **daily_limit_per_client** (opcional) - Limite diário por cliente
- **transaction_limit** (opcional) - Limite por transação
- **campaign_limit_per_client** (opcional) - Limite total por cliente na campanha
- **new_customers_only** (opcional) - Apenas novos clientes
- **vip_only** (opcional) - Apenas clientes VIP
- **points_expiry_days** (opcional) - Dias para expiração dos pontos
- **notes** (opcional) - Notas adicionais

---

## Campos Específicos por Tipo de Campanha

### 1️⃣ RewardType_Auto (Oferta Automática)

**Descrição:** Cliente ganha pontos automaticamente ao aderir à campanha.

#### Campos Específicos
- **auto_points_amount** (obrigatório) - Quantidade de pontos a serem concedidos automaticamente
- **auto_points_condition** (opcional) - Condição para receber os pontos (texto livre)

#### Campos Comuns Usados
- **accumulation_rate** (opcional) - Taxa de acumulação
- **total_points_limit** (opcional) - Limite total de pontos

#### Exemplo de Payload
```json
{
  "establishment_id": 321,
  "campaign_name": "Bem-vindo! Ganhe 100 pontos",
  "sponsor_name": "Loja XYZ",
  "valid_from": "2025-01-01",
  "valid_until": "2025-12-31",
  "type": "RewardType_Auto",
  "auto_points_amount": 100,
  "auto_points_condition": "Aderir à campanha",
  "total_points_limit": 10000,
  "status": "Activo"
}
```

---

### 2️⃣ RewardType_Draw (Sorteio)

**Descrição:** Cada compra acima de um valor dá uma chance de ganhar prémios.

#### Campos Específicos
- **draw_min_spend** (obrigatório) - Valor mínimo de compra para participar (MT)
- **draw_prize_description** (obrigatório) - Descrição dos prémios do sorteio
- **draw_date** (obrigatório) - Data do sorteio (formato: YYYY-MM-DD)
- **draw_chances_per_purchase** (opcional) - Número de chances por compra
- **draw_winners_count** (opcional) - Número de vencedores
- **draw_participation_condition** (opcional) - Condição de participação

#### Campos Comuns Usados
- **min_purchase_amount** (mapeado para draw_min_spend) - Valor mínimo de compra
- **reward_description** (mapeado para draw_prize_description) - Descrição dos prémios
- **reward_points_cost** (opcional) - Custo em pontos para participar

#### Exemplo de Payload
```json
{
  "establishment_id": 321,
  "campaign_name": "Sorteio de Natal",
  "sponsor_name": "Loja XYZ",
  "valid_from": "2025-12-01",
  "valid_until": "2025-12-25",
  "type": "RewardType_Draw",
  "draw_min_spend": 100.00,
  "draw_prize_description": "Prémio: Smartphone, Tablet, Fones de ouvido",
  "draw_date": "2025-12-25",
  "draw_chances_per_purchase": 1,
  "draw_winners_count": 3,
  "min_purchase_amount": 100.00,
  "status": "Activo"
}
```

---

### 3️⃣ RewardType_Exchange (Troca)

**Descrição:** Troca pontos por produtos, serviços ou descontos.

#### Campos Específicos
- **exchange_min_points_required** (obrigatório) - Pontos mínimos necessários para trocar
- **reward_description** (obrigatório) - Descrição do que pode ser trocado
- **reward_points_cost** (obrigatório) - Custo em pontos da recompensa
- **reward_stock** (opcional) - Estoque disponível (deixe vazio para ilimitado)
- **reward_value_mt** (opcional) - Valor em MT da recompensa

#### Campos Comuns Usados
- **reward_description** - Descrição dos itens disponíveis para troca
- **reward_points_cost** (mapeado para exchange_min_points_required) - Pontos necessários

#### Exemplo de Payload
```json
{
  "establishment_id": 321,
  "campaign_name": "Troque seus pontos",
  "sponsor_name": "Loja XYZ",
  "valid_from": "2025-01-01",
  "valid_until": "2025-12-31",
  "type": "RewardType_Exchange",
  "exchange_min_points_required": 1000,
  "reward_description": "Produto X, Serviço Y, Desconto de 20%",
  "reward_points_cost": 1000,
  "reward_stock": 100,
  "reward_value_mt": 50.00,
  "status": "Activo"
}
```

---

### 4️⃣ RewardType_Quiz (Questões)

**Descrição:** Responde perguntas no app e ganha pontos por cada resposta certa.

#### Campos Específicos
- **quiz_questions** (obrigatório) - Array de questões (JSON)
  - Estrutura de cada questão:
    ```json
    {
      "id": "q1",
      "question": "Qual é a capital de Moçambique?",
      "options": ["Maputo", "Beira", "Nampula", "Quelimane"],
      "correct_answer": 0,
      "points": 10,
      "explanation": "Maputo é a capital de Moçambique"
    }
    ```
- **quiz_points_per_correct** (opcional, padrão: 10) - Pontos por resposta correta
- **quiz_max_attempts** (opcional, padrão: 3) - Número máximo de tentativas
- **quiz_time_limit_seconds** (opcional) - Limite de tempo em segundos

#### Campos Comuns Usados
- **reward_points_cost** (mapeado para quiz_points_per_correct) - Pontos por resposta correta
- **total_points_limit** (opcional) - Limite total de pontos

#### Exemplo de Payload
```json
{
  "establishment_id": 321,
  "campaign_name": "Quiz de Conhecimento",
  "sponsor_name": "Loja XYZ",
  "valid_from": "2025-01-01",
  "valid_until": "2025-12-31",
  "type": "RewardType_Quiz",
  "quiz_questions": [
    {
      "id": "q1",
      "question": "Qual é a capital de Moçambique?",
      "options": ["Maputo", "Beira", "Nampula", "Quelimane"],
      "correct_answer": 0,
      "points": 10,
      "explanation": "Maputo é a capital de Moçambique"
    },
    {
      "id": "q2",
      "question": "Quantas províncias tem Moçambique?",
      "options": ["8", "10", "11", "12"],
      "correct_answer": 2,
      "points": 10,
      "explanation": "Moçambique tem 11 províncias"
    }
  ],
  "quiz_points_per_correct": 10,
  "quiz_max_attempts": 3,
  "quiz_time_limit_seconds": 300,
  "total_points_limit": 10000,
  "status": "Activo"
}
```

---

### 5️⃣ RewardType_Referral (Indicação)

**Descrição:** Convida amigos a registarem-se e ganha pontos por cada um.

#### Campos Específicos
- **referral_points_per_referral** (obrigatório) - Pontos ganhos por cada indicação
- **referral_min_referrals** (opcional, padrão: 1) - Número mínimo de indicações
- **referral_bonus_points** (opcional) - Pontos bônus adicionais
- **referral_requires_first_purchase** (opcional, padrão: true) - Requer primeira compra do indicado
- **referral_code** (opcional) - Código de referência único

#### Campos Comuns Usados
- **reward_points_cost** (mapeado para referral_points_per_referral) - Pontos por indicação
- **total_points_limit** (opcional) - Limite total de pontos

#### Exemplo de Payload
```json
{
  "establishment_id": 321,
  "campaign_name": "Indique e Ganhe",
  "sponsor_name": "Loja XYZ",
  "valid_from": "2025-01-01",
  "valid_until": "2025-12-31",
  "type": "RewardType_Referral",
  "referral_points_per_referral": 50,
  "referral_min_referrals": 1,
  "referral_bonus_points": 100,
  "referral_requires_first_purchase": true,
  "referral_code": "INDICA2025",
  "total_points_limit": 50000,
  "status": "Activo"
}
```

---

### 6️⃣ RewardType_Challenge (Desafio)

**Descrição:** Completa desafios e ganha pontos e prémios especiais.

#### Campos Específicos
- **challenge_objective** (obrigatório) - Objetivo do desafio
- **challenge_target_value** (obrigatório) - Valor alvo do desafio
- **challenge_target_type** (obrigatório) - Tipo de alvo
  - Valores: "visits", "spend", "purchases", "points"
- **challenge_reward_points** (obrigatório) - Pontos de recompensa
- **challenge_bonus_reward** (opcional) - Recompensa bônus adicional
- **challenge_progress_tracking** (opcional, padrão: true) - Rastrear progresso

#### Campos Comuns Usados
- **reward_description** (mapeado para challenge_objective) - Objetivo do desafio
- **reward_points_cost** (mapeado para challenge_reward_points) - Pontos de recompensa
- **total_points_limit** (opcional) - Limite total de pontos

#### Exemplo de Payload
```json
{
  "establishment_id": 321,
  "campaign_name": "Desafio de Compras",
  "sponsor_name": "Loja XYZ",
  "valid_from": "2025-01-01",
  "valid_until": "2025-12-31",
  "type": "RewardType_Challenge",
  "challenge_objective": "Faça 10 compras no mês",
  "challenge_target_value": 10,
  "challenge_target_type": "purchases",
  "challenge_reward_points": 500,
  "challenge_bonus_reward": "Desconto de 20% na próxima compra",
  "challenge_progress_tracking": true,
  "total_points_limit": 20000,
  "status": "Activo"
}
```

---

### 7️⃣ RewardType_Party (Votação)

**Descrição:** Vota e participa em eventos sociais, ganha pontos por participar.

#### Campos Específicos
- **party_voting_options** (obrigatório) - Array de opções de votação (JSON)
  - Formato: `["Opção 1", "Opção 2", "Opção 3"]`
  - Ou objeto: `[{"id": "opt1", "label": "Opção 1", "description": "..."}, ...]`
- **party_points_per_vote** (obrigatório) - Pontos ganhos por cada voto
- **party_winner_reward** (opcional) - Recompensa para o vencedor
- **party_voting_deadline** (opcional) - Prazo de votação (formato: YYYY-MM-DDTHH:mm)
- **party_results_date** (opcional) - Data dos resultados (formato: YYYY-MM-DDTHH:mm)

#### Campos Comuns Usados
- **reward_points_cost** (mapeado para party_points_per_vote) - Pontos por voto
- **total_points_limit** (opcional) - Limite total de pontos

#### Exemplo de Payload
```json
{
  "establishment_id": 321,
  "campaign_name": "Votação: Melhor Produto",
  "sponsor_name": "Loja XYZ",
  "valid_from": "2025-01-01",
  "valid_until": "2025-01-31",
  "type": "RewardType_Party",
  "party_voting_options": ["Produto A", "Produto B", "Produto C"],
  "party_points_per_vote": 5,
  "party_winner_reward": "Prémio especial para o vencedor",
  "party_voting_deadline": "2025-01-25T23:59:59",
  "party_results_date": "2025-01-26T10:00:00",
  "total_points_limit": 10000,
  "status": "Activo"
}
```

---

## Validações por Tipo

### RewardType_Auto
- ✅ `auto_points_amount` deve ser > 0

### RewardType_Draw
- ✅ `draw_min_spend` deve ser > 0
- ✅ `draw_prize_description` não pode estar vazio
- ✅ `draw_date` deve ser uma data válida

### RewardType_Exchange
- ✅ `exchange_min_points_required` deve ser > 0
- ✅ `reward_description` não pode estar vazio
- ✅ `reward_points_cost` deve ser > 0

### RewardType_Quiz
- ✅ `quiz_questions` deve ser um array com pelo menos 1 questão
- ✅ Cada questão deve ter: `question`, `options` (mín. 2), `correct_answer`
- ✅ `quiz_points_per_correct` deve ser > 0 (se fornecido)

### RewardType_Referral
- ✅ `referral_points_per_referral` deve ser > 0
- ✅ `referral_min_referrals` deve ser >= 1 (se fornecido)

### RewardType_Challenge
- ✅ `challenge_objective` não pode estar vazio
- ✅ `challenge_target_value` deve ser > 0
- ✅ `challenge_target_type` deve ser um dos valores válidos
- ✅ `challenge_reward_points` deve ser > 0

### RewardType_Party
- ✅ `party_voting_options` deve ser um array com pelo menos 2 opções
- ✅ `party_points_per_vote` deve ser > 0
- ✅ `party_voting_deadline` deve ser uma data/hora válida (se fornecido)

---

## Mapeamento de Campos Genéricos

O formulário mapeia automaticamente campos genéricos para campos específicos quando necessário:

| Campo Genérico | Campo Específico | Tipo de Campanha |
|---------------|------------------|------------------|
| `min_purchase_amount` | `draw_min_spend` | RewardType_Draw |
| `reward_description` | `draw_prize_description` | RewardType_Draw |
| `reward_description` | `challenge_objective` | RewardType_Challenge |
| `reward_points_cost` | `exchange_min_points_required` | RewardType_Exchange |
| `reward_points_cost` | `quiz_points_per_correct` | RewardType_Quiz |
| `reward_points_cost` | `referral_points_per_referral` | RewardType_Referral |
| `reward_points_cost` | `challenge_reward_points` | RewardType_Challenge |
| `reward_points_cost` | `party_points_per_vote` | RewardType_Party |

---

## Estrutura do Formulário no Frontend

### Fluxo de Criação

1. **Seleção de Tipo**
   - Usuário vê cards com os 7 tipos de campanha
   - Cada card mostra: ícone, nome, descrição
   - Ao clicar, abre o formulário específico

2. **Formulário Dinâmico**
   - Campos comuns sempre visíveis
   - Campos específicos aparecem baseados no tipo selecionado
   - Validação em tempo real

3. **Envio**
   - Validação completa antes de enviar
   - Mapeamento automático de campos genéricos para específicos
   - Upload de imagens via FormData

---

## Notas de Implementação

### Upload de Arquivos
- Use `FormData` quando houver arquivos (`image`, `qr_code_image`)
- Use JSON normal quando não houver arquivos

### Validação de JSON
- Campos JSON (`quiz_questions`, `party_voting_options`) devem ser validados antes do envio
- Fornecer feedback visual se o JSON for inválido

### Datas
- Use formato ISO 8601 para datas: `YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ss`
- Campos `datetime-local` no HTML geram formato correto automaticamente

### Campos Opcionais
- Não envie campos `undefined` ou `null` no payload
- Use spread operator condicional: `...(value && { field: value })`

---

## Exemplos de Uso

### Criar Campanha de Troca
```typescript
const campaignData = {
  establishment_id: 321,
  campaign_name: "Troque seus pontos",
  sponsor_name: "Loja XYZ",
  valid_from: "2025-01-01",
  valid_until: "2025-12-31",
  type: "RewardType_Exchange",
  reward_description: "Produto X, Serviço Y",
  reward_points_cost: 1000,
  reward_stock: 100,
  status: "Activo"
};
```

### Criar Campanha de Quiz
```typescript
const campaignData = {
  establishment_id: 321,
  campaign_name: "Quiz de Conhecimento",
  sponsor_name: "Loja XYZ",
  valid_from: "2025-01-01",
  valid_until: "2025-12-31",
  type: "RewardType_Quiz",
  quiz_questions: [
    {
      id: "q1",
      question: "Qual é a capital?",
      options: ["A", "B", "C", "D"],
      correct_answer: 0,
      points: 10
    }
  ],
  quiz_points_per_correct: 10,
  quiz_max_attempts: 3,
  status: "Activo"
};
```

---

## Referências

- Backend: `src/controllers/campaignsController.js`
- Schema: `src/utils/campaignSchema.js`
- Validator: `src/utils/campaignValidator.js`
- Frontend: `src/pages/admin/campaigns/new.tsx`




