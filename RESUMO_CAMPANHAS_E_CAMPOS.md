# Resumo: Campanhas e Campos - Maktubia Points

## 📊 Status das Campanhas

| Campanha | Status | Tipo no Sistema | Disponível para Merchant |
|----------|--------|-----------------|-------------------------|
| **Oferta Automática** | ✅ Implementada | `RewardType_Auto` | ❌ Não |
| **Sorteio** | ✅ Implementada | `RewardType_Draw` | ✅ Sim |
| **Troca** | ✅ Implementada | `RewardType_Exchange` | ✅ Sim |
| **Oferta de Desconto por Marcação** | ❌ **FALTANDO** | - | - |

---

## 1️⃣ Campanha Oferta Automática (RewardType_Auto)

### Campos Específicos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `auto_points_amount` | number | ✅ Sim | Quantidade de pontos concedidos automaticamente |
| `auto_points_condition` | string | ❌ Não | Condição para receber os pontos (texto livre) |

### Campos Comuns Usados

- `accumulation_rate` - Taxa de acumulação (ex: 0.1 = 1 MT = 10 pts)
- `total_points_limit` - Limite total de pontos (plafond)
- `campaign_name` - Nome da campanha
- `sponsor_name` - Nome do patrocinador
- `valid_from` - Data de início
- `valid_until` - Data de término
- `reward_value_mt` - Valor da recompensa em MT
- `reward_points_cost` - Custo em pontos

### Exemplo de Uso
```json
{
  "type": "RewardType_Auto",
  "auto_points_amount": 100,
  "auto_points_condition": "Aderir à campanha",
  "total_points_limit": 10000
}
```

---

## 2️⃣ Campanha Sorteio (RewardType_Draw)

### Campos Específicos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `draw_min_spend` | number | ✅ Sim | Valor mínimo de compra para participar (MT) |
| `draw_prize_description` | string | ✅ Sim | Descrição dos prémios do sorteio |
| `draw_date` | string (YYYY-MM-DD) | ✅ Sim | Data do sorteio |
| `draw_chances_per_purchase` | number | ❌ Não | Número de chances por compra |
| `draw_winners_count` | number | ❌ Não | Número de vencedores |
| `draw_participation_condition` | string | ❌ Não | Condição de participação |
| `draw_periodicity` | "daily"\|"weekly"\|"monthly"\|"event" | ❌ Não | Periodicidade do sorteio |
| `draw_points_per_participation` | number | ❌ Não | Pontos por participação |
| `draw_prizes_list` | array | ❌ Não | Lista de prémios |

### Campos Comuns Usados

- `min_purchase_amount` - Valor mínimo de compra (mapeado para `draw_min_spend`)
- `reward_description` - Descrição dos prémios (mapeado para `draw_prize_description`)
- `reward_points_cost` - Custo em pontos para participar

### Exemplo de Uso
```json
{
  "type": "RewardType_Draw",
  "draw_min_spend": 100.00,
  "draw_prize_description": "Prémio: Smartphone, Tablet, Fones de ouvido",
  "draw_date": "2025-12-25",
  "draw_chances_per_purchase": 1,
  "draw_winners_count": 3
}
```

---

## 3️⃣ Campanha Troca (RewardType_Exchange)

### Campos Específicos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `exchange_min_points_required` | number | ✅ Sim | Pontos mínimos necessários para trocar |
| `exchange_prizes_list` | array | ❌ Não | Lista de prémios disponíveis para troca |

**Estrutura de `exchange_prizes_list`:**
```json
[
  {
    "name": "Produto X",
    "price_mt": 50.00,
    "points_required": 1000
  },
  {
    "name": "Serviço Y",
    "price_mt": 30.00,
    "points_required": 500
  }
]
```

### Campos Comuns Usados

- `reward_description` - Descrição do que pode ser trocado
- `reward_points_cost` - Custo em pontos da recompensa
- `reward_stock` - Estoque disponível (deixe vazio para ilimitado)
- `reward_value_mt` - Valor em MT da recompensa

### Exemplo de Uso
```json
{
  "type": "RewardType_Exchange",
  "exchange_min_points_required": 1000,
  "reward_description": "Produto X, Serviço Y, Desconto de 20%",
  "reward_points_cost": 1000,
  "reward_stock": 100,
  "reward_value_mt": 50.00
}
```

---

## 4️⃣ Campanha Oferta de Desconto por Marcação ❌ **NÃO IMPLEMENTADA**

### Campos Esperados (Sugestão)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `booking_required` | boolean | ✅ Sim | Se requer marcação/reserva |
| `booking_discount_type` | "percentual"\|"fixo" | ✅ Sim | Tipo de desconto |
| `booking_discount_value` | number | ✅ Sim | Valor do desconto |
| `booking_min_advance_days` | number | ❌ Não | Dias mínimos de antecedência |
| `booking_max_advance_days` | number | ❌ Não | Dias máximos de antecedência |
| `booking_service_types` | array | ❌ Não | Tipos de serviços elegíveis |
| `booking_points_earned` | number | ❌ Não | Pontos ganhos ao marcar |
| `booking_confirmation_required` | boolean | ❌ Não | Se requer confirmação |

### Status
- ❌ **NÃO EXISTE no código atual**
- ⚠️ Existe `RewardType_Voucher` mas não é específico para marcações

### Ação Necessária
1. Criar novo tipo: `RewardType_Booking` ou `RewardType_Appointment`
2. Implementar campos específicos
3. Adicionar validações
4. Criar formulário no frontend
5. Adicionar ao backend

---

## 📋 Campos Comuns a Todas as Campanhas

### Informações Básicas (Obrigatórias)
- `establishment_id` - ID do estabelecimento
- `campaign_name` - Nome da campanha
- `sponsor_name` - Nome do patrocinador
- `valid_from` - Data de início (YYYY-MM-DD)
- `valid_until` - Data de término (YYYY-MM-DD)
- `reward_value_mt` - Valor da recompensa em MT
- `reward_points_cost` - Custo em pontos

### Informações Básicas (Opcionais)
- `description` - Descrição geral da campanha
- `redemption_deadline` - Prazo para resgate
- `status` - Status: "Rascunho" | "Activo" | "Parado" | "Cancelado" | "Concluído" | "Expirado"
- `is_active` - Se a campanha está ativa (padrão: true)

### Imagens e QR Code
- `image` - Arquivo de imagem principal (File)
- `qr_code_image` - Arquivo de QR code (File)

### Configurações Avançadas
- `accumulation_rate` - Taxa de acumulação (ex: 0.1 = 1 MT = 10 pts)
- `bonus_multiplier` - Multiplicador de bônus (ex: 2.0 = dobra os pontos)
- `min_purchase_amount` - Valor mínimo de compra (MT)
- `max_purchase_amount` - Valor máximo de compra (MT)
- `total_points_limit` - Limite total de pontos (plafond)
- `daily_limit_per_client` - Limite diário por cliente
- `transaction_limit` - Limite por transação
- `campaign_limit_per_client` - Limite total por cliente na campanha
- `new_customers_only` - Apenas novos clientes
- `vip_only` - Apenas clientes VIP
- `points_expiry_days` - Dias para expiração dos pontos
- `notes` - Notas adicionais

### Comunicação
- `notify_push` - Notificação push
- `notify_sms` - Notificação SMS
- `notify_email` - Notificação email
- `notify_whatsapp` - Notificação WhatsApp
- `communication_budget` - Orçamento de comunicação
- `communication_credits_used` - Créditos de comunicação usados

### Localização e Pagamento
- `allowed_locations` - IDs das localizações permitidas (array)
- `allowed_payment_methods` - Métodos de pagamento permitidos (array)

---

## 📁 Localização no Código

### Frontend
- **Admin:** `src/pages/admin/campaigns/new.tsx`
- **Merchant:** `src/pages/merchant/campaigns/new.tsx`
- **Serviços:** `src/services/campaigns.service.ts`

### Documentação
- `FORMULARIOS_CAMPANHAS_POR_TIPO.md` - Documentação completa
- `ANALISE_CAMPANHAS_MAKTUBIA.md` - Análise detalhada

---

## ✅ Checklist de Implementação

### Para Campanha Oferta de Desconto por Marcação

- [ ] Criar tipo `RewardType_Booking` no backend
- [ ] Adicionar campos específicos no schema do backend
- [ ] Implementar validações no backend
- [ ] Adicionar tipo no frontend (`campaignTypes` array)
- [ ] Criar formulário no frontend (Admin)
- [ ] Criar formulário no frontend (Merchant)
- [ ] Adicionar campos no `CreateCampaignDTO`
- [ ] Adicionar validações no frontend
- [ ] Atualizar documentação
- [ ] Testar criação de campanha
- [ ] Testar validações

---

## 📝 Notas Importantes

1. **Campanha Oferta Automática** não está disponível para merchants (apenas admin)
2. **Campanha Sorteio** e **Campanha Troca** estão disponíveis para merchants
3. **Campanha Oferta de Desconto por Marcação** precisa ser implementada
4. Existem outras campanhas no sistema (Quiz, Referral, Challenge, Party, Voucher) que não foram mencionadas nos requisitos







