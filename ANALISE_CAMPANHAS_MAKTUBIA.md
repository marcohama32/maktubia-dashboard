# Análise das Campanhas Maktubia Points

## Resumo Executivo

Este documento analisa as campanhas existentes no sistema Maktubia Points e compara com os requisitos mencionados.

## Campanhas Requeridas vs Implementadas

### ✅ Campanhas Implementadas

1. **Campanha Oferta Automática** (RewardType_Auto) ✅
2. **Campanha Sorteio** (RewardType_Draw) ✅
3. **Campanha Troca** (RewardType_Exchange) ✅

### ❌ Campanhas Faltando

4. **Campanha Oferta de Desconto por Marcação** ❌ **NÃO IMPLEMENTADA**

### ⚠️ Campanhas Adicionais no Sistema (não mencionadas nos requisitos)

- RewardType_Quiz (Questões)
- RewardType_Referral (Indicação)
- RewardType_Challenge (Desafio)
- RewardType_Party (Votação)
- RewardType_Voucher (Voucher) - Pode ser relacionado, mas não é exatamente "Oferta de Desconto por Marcação"

---

## Detalhamento das Campanhas Existentes

### 1️⃣ Campanha Oferta Automática (RewardType_Auto)

**Descrição:** Cliente ganha pontos automaticamente ao aderir à campanha.

#### Campos Específicos
- **auto_points_amount** (obrigatório) - Quantidade de pontos a serem concedidos automaticamente
- **auto_points_condition** (opcional) - Condição para receber os pontos (texto livre)

#### Campos Comuns Usados
- **accumulation_rate** (opcional) - Taxa de acumulação (ex: 0.1 = 1 MT = 10 pts)
- **total_points_limit** (opcional) - Limite total de pontos (plafond)
- **campaign_name** (obrigatório) - Nome da campanha
- **sponsor_name** (obrigatório) - Nome do patrocinador
- **valid_from** (obrigatório) - Data de início
- **valid_until** (obrigatório) - Data de término
- **reward_value_mt** (obrigatório) - Valor da recompensa em MT
- **reward_points_cost** (obrigatório) - Custo em pontos

#### Localização no Código
- Tipo: `RewardType_Auto`
- Arquivo: `src/pages/admin/campaigns/new.tsx` (linha 148-154)
- Arquivo: `src/pages/merchant/campaigns/new.tsx` (não disponível para merchant)

---

### 2️⃣ Campanha Sorteio (RewardType_Draw)

**Descrição:** Cada compra acima de um valor dá uma chance de ganhar prémios.

#### Campos Específicos
- **draw_min_spend** (obrigatório) - Valor mínimo de compra para participar (MT)
- **draw_prize_description** (obrigatório) - Descrição dos prémios do sorteio
- **draw_date** (obrigatório) - Data do sorteio (formato: YYYY-MM-DD)
- **draw_chances_per_purchase** (opcional) - Número de chances por compra
- **draw_winners_count** (opcional) - Número de vencedores
- **draw_participation_condition** (opcional) - Condição de participação
- **draw_periodicity** (opcional) - Periodicidade: "daily" | "weekly" | "monthly" | "event"
- **draw_points_per_participation** (opcional) - Pontos por participação
- **draw_prizes_list** (opcional) - Lista de prémios

#### Campos Comuns Usados
- **min_purchase_amount** (mapeado para draw_min_spend) - Valor mínimo de compra
- **reward_description** (mapeado para draw_prize_description) - Descrição dos prémios
- **reward_points_cost** (opcional) - Custo em pontos para participar

#### Localização no Código
- Tipo: `RewardType_Draw`
- Arquivo: `src/pages/admin/campaigns/new.tsx` (linha 156-162)
- Arquivo: `src/pages/merchant/campaigns/new.tsx` (linha 190-195) - ✅ Disponível para merchant

---

### 3️⃣ Campanha Troca (RewardType_Exchange)

**Descrição:** Troca pontos por produtos, serviços ou descontos.

#### Campos Específicos
- **exchange_min_points_required** (obrigatório) - Pontos mínimos necessários para trocar
- **exchange_prizes_list** (opcional) - Lista de prémios disponíveis para troca
  - Estrutura: Array de objetos com `name`, `price_mt`, `points_required`

#### Campos Comuns Usados
- **reward_description** (obrigatório) - Descrição do que pode ser trocado
- **reward_points_cost** (obrigatório) - Custo em pontos da recompensa
- **reward_stock** (opcional) - Estoque disponível (deixe vazio para ilimitado)
- **reward_value_mt** (opcional) - Valor em MT da recompensa

#### Localização no Código
- Tipo: `RewardType_Exchange`
- Arquivo: `src/pages/admin/campaigns/new.tsx` (linha 164-170)
- Arquivo: `src/pages/merchant/campaigns/new.tsx` (linha 197-202) - ✅ Disponível para merchant

---

### 4️⃣ Campanha Oferta de Desconto por Marcação ❌ **NÃO IMPLEMENTADA**

**Descrição:** Cliente marca/reserva um serviço e recebe um desconto.

#### Campos Esperados (sugestão baseada no conceito)
- **booking_required** (obrigatório) - Se requer marcação/reserva
- **booking_discount_type** (obrigatório) - Tipo de desconto: "percentual" | "fixo"
- **booking_discount_value** (obrigatório) - Valor do desconto
- **booking_min_advance_days** (opcional) - Dias mínimos de antecedência para marcação
- **booking_max_advance_days** (opcional) - Dias máximos de antecedência para marcação
- **booking_service_types** (opcional) - Tipos de serviços elegíveis
- **booking_points_earned** (opcional) - Pontos ganhos ao marcar
- **booking_confirmation_required** (opcional) - Se requer confirmação

#### Status
- ❌ **NÃO EXISTE no código atual**
- ⚠️ Existe `RewardType_Voucher` que pode ter funcionalidade similar, mas não é específico para marcações

#### Ação Necessária
- Criar novo tipo: `RewardType_Booking` ou `RewardType_Appointment`
- Implementar campos específicos para marcação/reserva
- Adicionar validações específicas
- Criar formulário no frontend

---

## Campos Comuns a Todas as Campanhas

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

### Comunicação
- **notify_push** (opcional) - Notificação push
- **notify_sms** (opcional) - Notificação SMS
- **notify_email** (opcional) - Notificação email
- **notify_whatsapp** (opcional) - Notificação WhatsApp
- **communication_budget** (opcional) - Orçamento de comunicação
- **communication_credits_used** (opcional) - Créditos de comunicação usados

### Localização e Pagamento
- **allowed_locations** (opcional) - IDs das localizações permitidas
- **allowed_payment_methods** (opcional) - Métodos de pagamento permitidos

---

## Arquivos Relevantes

### Frontend
- `src/pages/admin/campaigns/new.tsx` - Formulário de criação (Admin)
- `src/pages/merchant/campaigns/new.tsx` - Formulário de criação (Merchant)
- `src/services/campaigns.service.ts` - Serviço de campanhas (interfaces e tipos)

### Documentação
- `FORMULARIOS_CAMPANHAS_POR_TIPO.md` - Documentação completa dos formulários

---

## Recomendações

1. **Implementar Campanha Oferta de Desconto por Marcação**
   - Criar novo tipo `RewardType_Booking` ou `RewardType_Appointment`
   - Adicionar campos específicos para marcação/reserva
   - Implementar validações
   - Adicionar ao formulário de criação

2. **Revisar Campanhas Adicionais**
   - Verificar se as campanhas extras (Quiz, Referral, Challenge, Party, Voucher) devem ser mantidas ou removidas
   - Alinhar com os requisitos do negócio

3. **Documentação**
   - Atualizar documentação com a nova campanha quando implementada
   - Garantir que todos os campos estejam documentados

---

## Conclusão

Das 4 campanhas mencionadas nos requisitos:
- ✅ 3 estão implementadas (Oferta Automática, Sorteio, Troca)
- ❌ 1 está faltando (Oferta de Desconto por Marcação)

É necessário implementar a **Campanha Oferta de Desconto por Marcação** para completar os requisitos.







