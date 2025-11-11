# 📊 Endpoints para Dashboard do Merchant

## 🎯 Endpoints Atualmente Usados

### 1. **Estabelecimentos do Merchant**
- **GET** `/api/establishments/merchants/establishments`
- **Descrição**: Retorna os estabelecimentos do merchant autenticado
- **Uso**: `merchantsService.getMyEstablishments()`
- **Status**: ✅ Implementado

### 2. **Campanhas do Merchant**
- **GET** `/api/campaigns/my`
- **Query params**: `page?`, `limit?`, `status?`, `establishment_id?`
- **Descrição**: Retorna as campanhas do merchant autenticado
- **Uso**: `campaignsService.getMyCampaigns()`
- **Status**: ✅ Implementado

### 3. **Dashboard Geral**
- **GET** `/api/dashboard`
- **Query params**: `period?` (7d, 30d, 90d), `type?` (all, points, purchases, transfers, friends)
- **Descrição**: Dashboard geral do sistema (para usuários/clientes)
- **Uso**: `dashboardService.getDashboard()`
- **Status**: ✅ Implementado (mas é para clientes, não merchants)

## ✅ Endpoint Implementado para Dashboard do Merchant

### Endpoint Específico de Dashboard do Merchant
```
GET /api/merchant-dashboard/complete
```

**Query params:**
- `period?` (7d, 30d, 90d) - Período de análise
- `establishment_id?` (opcional) - Filtrar por estabelecimento específico

**Uso**: `dashboardService.getMerchantDashboard()`
**Status**: ✅ Implementado

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalCampaigns": 10,
      "activeCampaigns": 5,
      "inactiveCampaigns": 3,
      "totalParticipants": 1500,
      "totalPointsGiven": 50000,
      "totalRevenue": 250000,
      "totalPurchases": 200
    },
    "charts": {
      "campaigns_by_status": [...],
      "revenue_by_campaign": [...],
      "participants_by_campaign": [...],
      "revenue_timeline": [...]
    },
    "period": {
      "days": 30,
      "start_date": "2024-01-01",
      "end_date": "2024-01-30"
    }
  }
}
```

### Opção 2: Usar Endpoint de Campanhas com Métricas Agregadas
```
GET /api/campaigns/my?include_metrics=true&all=true
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": [...],
  "generalMetrics": {
    "totalCampaigns": 10,
    "activeCampaigns": 5,
    "totalParticipants": 1500,
    "totalPointsGiven": 50000,
    "totalRevenue": 250000
  }
}
```

## 📝 Recomendação

**Verificar no backend se existe:**
1. `/api/dashboard/merchant` - Endpoint específico para dashboard do merchant
2. `/api/merchants/dashboard` - Alternativa
3. `/api/dashboard?type=merchant` - Com parâmetro de tipo

**Se não existir, usar:**
- `/api/campaigns/my` com `limit=1000` para obter todas as campanhas
- Calcular métricas no frontend (como está sendo feito atualmente)

## 🔧 Implementação Atual

O dashboard do merchant agora:
1. ✅ Usa o endpoint `/api/merchant-dashboard/complete` para obter métricas e gráficos
2. ✅ Tem fallback para calcular métricas no frontend se o endpoint falhar
3. ✅ Suporta filtro por período (7d, 30d, 90d)
4. ✅ Suporta filtro por estabelecimento
5. ✅ Exibe métricas agregadas do backend
6. ✅ Exibe gráficos pré-calculados do backend

**Estrutura de Resposta Real:**
```json
{
  "success": true,
  "data": {
    "establishments": [
      {
        "establishment_id": 321,
        "est_id": "EST_1762556814134_k4wuf",
        "name": "Padaria Alberto"
      }
    ],
    "metrics": {
      "campaigns": {
        "total": 1,
        "active": 1,
        "inactive": 0,
        "by_type": { "RewardType_Auto": 1 },
        "by_status": { "Activo": 1 }
      },
      "purchases": {
        "total": 0,
        "confirmed": 0,
        "pending": 0,
        "rejected": 0,
        "conversion_rate": 0
      },
      "revenue": {
        "total": 0,
        "last_7_days": 0,
        "last_30_days": 0,
        "last_90_days": 0,
        "average_ticket": 0
      },
      "points": {
        "total_given": 0,
        "average_per_purchase": 0,
        "points_per_real": 0
      },
      "customers": {
        "unique_customers": 0,
        "purchases_per_customer": 0
      }
    },
    "period_stats": {
      "last_7_days": { "purchases": 0, "confirmed": 0, "revenue": 0, "points": 0 },
      "last_30_days": { "purchases": 0, "confirmed": 0, "revenue": 0, "points": 0 },
      "last_90_days": { "purchases": 0, "confirmed": 0, "revenue": 0, "points": 0 }
    },
    "establishment_stats": [...],
    "top_campaigns": [...],
    "campaigns": [...],
    "campaign_efficiency": [...],
    "period_comparison": {
      "current_period": { "days": 30, "purchases": 0, "revenue": 0, "points": 0 },
      "previous_period": { "days": 30, "purchases": 0, "revenue": 0, "points": 0 },
      "growth": { "revenue_growth": 0, "purchases_growth": 0 }
    },
    "performance_score": {
      "score": 35,
      "max_score": 100,
      "breakdown": {
        "conversion_rate": 0,
        "revenue_growth": 0,
        "active_campaigns_ratio": 1,
        "average_ticket": 0,
        "purchases_per_customer": 0
      }
    },
    "insights": [
      {
        "type": "no_purchases",
        "severity": "info",
        "message": "Ainda não há compras registradas. Considere promover suas campanhas.",
        "action": "promote_campaigns"
      }
    ],
    "summary": {
      "total_campaigns": 1,
      "active_campaigns": 1,
      "total_purchases": 0,
      "total_revenue": 0,
      "total_points_given": 0,
      "unique_customers": 0,
      "conversion_rate": 0,
      "average_ticket": 0,
      "points_per_real": 0
    }
  }
}
```

