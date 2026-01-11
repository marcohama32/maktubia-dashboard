# Formato CSV para Upload de Transações BCI

## Estrutura do Arquivo CSV

O arquivo CSV deve conter as seguintes colunas (em qualquer ordem, mas com os nomes exatos):

### Colunas Obrigatórias:

1. **Nome do Cliente** - Nome completo do cliente
2. **Telefone** - Número de telefone (formato: +258XXXXXXXXX)
3. **Número de Conta** - Número da conta bancária do cliente
4. **Data da Transação** - Data no formato YYYY-MM-DD (ex: 2026-01-15)
5. **Tipo de Transação** - Deve ser: POS, ATM ou ONLINE
6. **Valor** - Valor da transação em formato numérico (ex: 1500.00)

### Colunas Opcionais:

7. **Nome do Comerciante** - Nome do estabelecimento/comerciante
8. **Localização** - Cidade ou localização da transação

## Exemplo de Cabeçalho:

```
Nome do Cliente,Telefone,Número de Conta,Data da Transação,Tipo de Transação,Valor,Nome do Comerciante,Localização
```

## Exemplo de Linha de Dados:

```
João Silva,+258841234567,1234567890,2026-01-15,POS,1500.00,Supermercado Maputo,Maputo
```

## Formatos Aceitos:

### Nomes Alternativos Aceitos:

- **Nome do Cliente**: `nome`, `nome do cliente`, `customer`, `cliente`
- **Telefone**: `telefone`, `phone`, `número de telefone`
- **Número de Conta**: `conta`, `account`, `número de conta`
- **Data da Transação**: `data`, `date`, `data da transação`
- **Tipo de Transação**: `tipo`, `type`, `tipo de transação`
- **Valor**: `valor`, `amount`, `montante`
- **Nome do Comerciante**: `merchant`, `nome do comerciante`
- **Localização**: `localização`, `location`, `local`

## Regras de Validação:

1. O arquivo deve ter pelo menos uma linha de dados (além do cabeçalho)
2. A data deve estar no formato YYYY-MM-DD
3. O tipo de transação deve ser exatamente: POS, ATM ou ONLINE (case-insensitive)
4. O valor deve ser um número válido (pode usar ponto ou vírgula como separador decimal)
5. O telefone deve começar com +258 para números de Moçambique

## Arquivo de Exemplo:

Um arquivo de exemplo completo está disponível em: `public/bci-transacoes-exemplo.csv`

## Como Usar:

1. Prepare seu arquivo CSV seguindo o formato acima
2. Acesse a página de Upload CSV no dashboard BCI
3. Selecione a campanha para a qual deseja processar as transações
4. Faça upload do arquivo CSV
5. O sistema processará automaticamente e selecionará os vencedores

