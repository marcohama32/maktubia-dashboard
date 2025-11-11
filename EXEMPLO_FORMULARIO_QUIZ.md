# Exemplo Detalhado: Formulário de Quiz (RewardType_Quiz)

## Visão Geral

Este documento fornece um exemplo detalhado de como implementar o formulário de criação de campanhas do tipo **Quiz** (RewardType_Quiz), incluindo a interface para gerenciar questões.

## Estrutura de Dados

### Questão Individual
```typescript
interface QuizQuestion {
  id: string;                    // ID único da questão (ex: "q1", "q2")
  question: string;              // Texto da pergunta (obrigatório)
  options: string[];             // Array de opções (mín. 2, obrigatório)
  correct_answer: number;        // Índice da resposta correta (0-based, obrigatório)
  points?: number;               // Pontos por resposta correta (opcional, padrão: quiz_points_per_correct)
  explanation?: string;          // Explicação da resposta (opcional)
}
```

### Estrutura Completa da Campanha Quiz
```typescript
interface QuizCampaign {
  // Campos comuns
  establishment_id: number;
  campaign_name: string;
  sponsor_name: string;
  valid_from: string;            // YYYY-MM-DD
  valid_until: string;           // YYYY-MM-DD
  description?: string;
  type: "RewardType_Quiz";
  
  // Campos específicos do Quiz
  quiz_questions: QuizQuestion[]; // Array de questões (obrigatório, mín. 1)
  quiz_points_per_correct?: number; // Pontos por resposta correta (opcional, padrão: 10)
  quiz_max_attempts?: number;     // Máximo de tentativas (opcional, padrão: 3)
  quiz_time_limit_seconds?: number; // Limite de tempo em segundos (opcional)
  total_points_limit?: number;   // Limite total de pontos (opcional)
  
  // Outros campos opcionais
  status?: "Rascunho" | "Activo" | "Parado" | "Cancelado" | "Concluído" | "Expirado";
  image?: File;
  qr_code_image?: File;
}
```

---

## Interface do Formulário

### Layout Sugerido

```
┌─────────────────────────────────────────────────────────┐
│  Nova Campanha - Quiz                                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [← Voltar para seleção de tipo]                        │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ❓ Questões                                      │   │
│  │ Responde perguntas no app e ganha pontos        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Informações Básicas                              │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ Estabelecimento: [Dropdown ▼]                   │   │
│  │ Nome da Campanha: [________________]            │   │
│  │ Patrocinador: [________________]                │   │
│  │ Descrição: [________________]                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Configurações do Quiz                           │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ Pontos por Resposta Correta: [10]              │   │
│  │ Máximo de Tentativas: [3]                      │   │
│  │ Limite de Tempo (segundos): [300]              │   │
│  │ Limite Total de Pontos: [10000]                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Questões do Quiz                                 │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ [+ Adicionar Questão]                           │   │
│  │                                                  │   │
│  │ ┌─ Questão 1 ───────────────────────────────┐ │   │
│  │ │ Pergunta: [Qual é a capital?]             │ │   │
│  │ │ Opções:                                    │ │   │
│  │ │   [1] [Maputo]        [✓ Resposta Correta]│ │   │
│  │ │   [2] [Beira]                              │ │   │
│  │ │   [3] [Nampula]                            │ │   │
│  │ │   [4] [Quelimane]                          │ │   │
│  │ │   [+ Adicionar Opção]                      │ │   │
│  │ │ Pontos: [10]                                │ │   │
│  │ │ Explicação: [Maputo é a capital...]        │ │   │
│  │ │ [🗑️ Remover]                               │ │   │
│  │ └────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │ ┌─ Questão 2 ───────────────────────────────┐ │   │
│  │ │ ...                                        │ │   │
│  │ └────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Período                                            │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ Data de Início: [2025-01-01]                     │   │
│  │ Data de Término: [2025-12-31]                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Imagem e QR Code                                 │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ [Upload Imagem] [Upload QR Code]                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  [Cancelar]  [Salvar como Rascunho]  [Criar Campanha]   │
└─────────────────────────────────────────────────────────┘
```

---

## Componente React Sugerido

### Estado do Formulário
```typescript
const [formData, setFormData] = useState({
  establishment_id: 0,
  campaign_name: "",
  sponsor_name: "",
  valid_from: "",
  valid_until: "",
  description: "",
  type: "RewardType_Quiz",
  quiz_points_per_correct: 10,
  quiz_max_attempts: 3,
  quiz_time_limit_seconds: undefined,
  total_points_limit: undefined,
  quiz_questions: [] as QuizQuestion[],
  status: "Rascunho",
});
```

### Gerenciamento de Questões

#### Adicionar Questão
```typescript
const addQuestion = () => {
  const newQuestion: QuizQuestion = {
    id: `q${formData.quiz_questions.length + 1}`,
    question: "",
    options: ["", ""], // Mínimo 2 opções
    correct_answer: 0,
    points: formData.quiz_points_per_correct || 10,
    explanation: "",
  };
  
  setFormData(prev => ({
    ...prev,
    quiz_questions: [...prev.quiz_questions, newQuestion],
  }));
};
```

#### Atualizar Questão
```typescript
const updateQuestion = (questionId: string, field: keyof QuizQuestion, value: any) => {
  setFormData(prev => ({
    ...prev,
    quiz_questions: prev.quiz_questions.map(q =>
      q.id === questionId ? { ...q, [field]: value } : q
    ),
  }));
};
```

#### Adicionar Opção à Questão
```typescript
const addOptionToQuestion = (questionId: string) => {
  setFormData(prev => ({
    ...prev,
    quiz_questions: prev.quiz_questions.map(q =>
      q.id === questionId
        ? { ...q, options: [...q.options, ""] }
        : q
    ),
  }));
};
```

#### Remover Opção da Questão
```typescript
const removeOptionFromQuestion = (questionId: string, optionIndex: number) => {
  setFormData(prev => ({
    ...prev,
    quiz_questions: prev.quiz_questions.map(q => {
      if (q.id === questionId) {
        const newOptions = q.options.filter((_, i) => i !== optionIndex);
        // Ajustar correct_answer se necessário
        let newCorrectAnswer = q.correct_answer;
        if (optionIndex <= q.correct_answer && newCorrectAnswer > 0) {
          newCorrectAnswer--;
        }
        return {
          ...q,
          options: newOptions,
          correct_answer: newCorrectAnswer,
        };
      }
      return q;
    }),
  }));
};
```

#### Remover Questão
```typescript
const removeQuestion = (questionId: string) => {
  setFormData(prev => ({
    ...prev,
    quiz_questions: prev.quiz_questions.filter(q => q.id !== questionId),
  }));
};
```

---

## Validações

### Validação de Questões
```typescript
const validateQuizQuestions = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (formData.quiz_questions.length === 0) {
    errors.push("Adicione pelo menos uma questão");
  }
  
  formData.quiz_questions.forEach((q, index) => {
    if (!q.question || q.question.trim() === "") {
      errors.push(`Questão ${index + 1}: Pergunta é obrigatória`);
    }
    
    if (!q.options || q.options.length < 2) {
      errors.push(`Questão ${index + 1}: Adicione pelo menos 2 opções`);
    }
    
    const hasEmptyOptions = q.options.some(opt => !opt || opt.trim() === "");
    if (hasEmptyOptions) {
      errors.push(`Questão ${index + 1}: Todas as opções devem ser preenchidas`);
    }
    
    if (q.correct_answer < 0 || q.correct_answer >= q.options.length) {
      errors.push(`Questão ${index + 1}: Resposta correta inválida`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
```

### Validação Completa
```typescript
const validateForm = (): boolean => {
  // Validações comuns
  if (!formData.establishment_id || formData.establishment_id === 0) {
    setError("Selecione um estabelecimento");
    return false;
  }
  
  if (!formData.campaign_name || formData.campaign_name.trim() === "") {
    setError("Nome da campanha é obrigatório");
    return false;
  }
  
  if (!formData.sponsor_name || formData.sponsor_name.trim() === "") {
    setError("Nome do patrocinador é obrigatório");
    return false;
  }
  
  if (!formData.valid_from || !formData.valid_until) {
    setError("Data de início e término são obrigatórias");
    return false;
  }
  
  // Validações específicas do Quiz
  const quizValidation = validateQuizQuestions();
  if (!quizValidation.valid) {
    setError(quizValidation.errors.join("\n"));
    return false;
  }
  
  return true;
};
```

---

## Exemplo de JSON Final

### Payload Enviado ao Backend
```json
{
  "establishment_id": 321,
  "campaign_name": "Quiz de Conhecimento sobre Moçambique",
  "sponsor_name": "Loja XYZ",
  "valid_from": "2025-01-01",
  "valid_until": "2025-12-31",
  "description": "Teste seus conhecimentos sobre Moçambique e ganhe pontos!",
  "type": "RewardType_Quiz",
  "quiz_questions": [
    {
      "id": "q1",
      "question": "Qual é a capital de Moçambique?",
      "options": ["Maputo", "Beira", "Nampula", "Quelimane"],
      "correct_answer": 0,
      "points": 10,
      "explanation": "Maputo é a capital e maior cidade de Moçambique"
    },
    {
      "id": "q2",
      "question": "Quantas províncias tem Moçambique?",
      "options": ["8", "10", "11", "12"],
      "correct_answer": 2,
      "points": 10,
      "explanation": "Moçambique tem 11 províncias"
    },
    {
      "id": "q3",
      "question": "Qual é a moeda oficial de Moçambique?",
      "options": ["Metical", "Rand", "Dólar", "Euro"],
      "correct_answer": 0,
      "points": 10,
      "explanation": "O Metical (MZN) é a moeda oficial de Moçambique"
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

## Interface Visual Sugerida

### Card de Questão
```tsx
<div className="rounded-lg border-2 border-gray-200 p-4 mb-4">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-lg font-semibold">Questão {index + 1}</h3>
    <button
      onClick={() => removeQuestion(q.id)}
      className="text-red-600 hover:text-red-800"
    >
      🗑️ Remover
    </button>
  </div>
  
  <div className="mb-3">
    <label className="block text-sm font-medium mb-1">
      Pergunta <span className="text-red-500">*</span>
    </label>
    <textarea
      value={q.question}
      onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
      rows={2}
      className="w-full rounded border px-3 py-2"
      placeholder="Digite a pergunta..."
    />
  </div>
  
  <div className="mb-3">
    <label className="block text-sm font-medium mb-2">
      Opções <span className="text-red-500">*</span> (mín. 2)
    </label>
    {q.options.map((option, optIndex) => (
      <div key={optIndex} className="flex items-center gap-2 mb-2">
        <input
          type="radio"
          name={`correct-${q.id}`}
          checked={q.correct_answer === optIndex}
          onChange={() => updateQuestion(q.id, "correct_answer", optIndex)}
          className="h-4 w-4"
        />
        <input
          type="text"
          value={option}
          onChange={(e) => {
            const newOptions = [...q.options];
            newOptions[optIndex] = e.target.value;
            updateQuestion(q.id, "options", newOptions);
          }}
          className="flex-1 rounded border px-3 py-2"
          placeholder={`Opção ${optIndex + 1}`}
        />
        {q.options.length > 2 && (
          <button
            onClick={() => removeOptionFromQuestion(q.id, optIndex)}
            className="text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        )}
        {q.correct_answer === optIndex && (
          <span className="text-green-600 font-medium">✓ Resposta Correta</span>
        )}
      </div>
    ))}
    <button
      onClick={() => addOptionToQuestion(q.id)}
      className="text-blue-600 hover:text-blue-800 text-sm"
    >
      + Adicionar Opção
    </button>
  </div>
  
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium mb-1">Pontos</label>
      <input
        type="number"
        value={q.points || formData.quiz_points_per_correct || 10}
        onChange={(e) => updateQuestion(q.id, "points", Number(e.target.value))}
        min="1"
        className="w-full rounded border px-3 py-2"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Explicação</label>
      <textarea
        value={q.explanation || ""}
        onChange={(e) => updateQuestion(q.id, "explanation", e.target.value)}
        rows={2}
        className="w-full rounded border px-3 py-2"
        placeholder="Explicação da resposta..."
      />
    </div>
  </div>
</div>
```

---

## Fluxo de Criação

1. **Usuário seleciona tipo "Questões"**
   - Formulário específico de Quiz é exibido

2. **Preenche informações básicas**
   - Estabelecimento, nome, patrocinador, descrição

3. **Configura parâmetros do Quiz**
   - Pontos por resposta correta
   - Máximo de tentativas
   - Limite de tempo (opcional)
   - Limite total de pontos (opcional)

4. **Adiciona questões**
   - Clica em "+ Adicionar Questão"
   - Preenche pergunta, opções, resposta correta
   - Pode adicionar/remover opções
   - Define pontos e explicação (opcional)

5. **Validação**
   - Verifica se há pelo menos 1 questão
   - Verifica se cada questão tem pelo menos 2 opções
   - Verifica se todas as opções estão preenchidas
   - Verifica se resposta correta é válida

6. **Envio**
   - Converte `quiz_questions` para JSON
   - Envia via API

---

## Melhorias Futuras

### Editor Visual de Questões
- Drag & drop para reordenar questões
- Preview da questão como aparecerá no app
- Validação em tempo real

### Templates de Questões
- Salvar questões como templates
- Importar questões de outras campanhas
- Biblioteca de questões comuns

### Estatísticas
- Mostrar total de pontos possíveis
- Tempo estimado para completar o quiz
- Número de questões configuradas

---

## Referências

- Backend: `src/controllers/campaignsController.js` - `startQuiz`, `answerQuizQuestion`, `finishQuiz`
- Model: `src/models/QuizAttemptsModel.js`
- Frontend: `src/pages/admin/campaigns/new.tsx`




