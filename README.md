# Debugando Agent

API NestJS que recebe o enunciado e a tentativa de um exercício de estruturas de dados e devolve uma ajuda gerada por um modelo local via [Ollama](https://ollama.com). O modelo orienta o aluno sem entregar a resposta.

O endpoint de negócio é `POST /tutor/assist`. A aplicação monta o prompt, chama `POST {OLLAMA_BASE_URL}/api/chat` e devolve o texto do modelo.

## Configuração inicial

Pré-requisitos:

- [Node.js](https://nodejs.org) (versão atual LTS)
- [pnpm](https://pnpm.io)
- [Ollama](https://ollama.com/download) instalado e acessível na máquina

Na raiz do repositório:

```bash
pnpm install
cp .env.example .env
```

Edite o `.env`. A aplicação recusa subir se `OLLAMA_MODEL` ou `OLLAMA_SYSTEM_PROMPT` estiverem vazios. O modelo usado neste ambiente é `qwen2.5:7b`. O texto de `OLLAMA_SYSTEM_PROMPT` está na seção [System prompt](#system-prompt).

```bash
PORT=3000

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_TEMPERATURE=0
OLLAMA_TOP_P=0.1
OLLAMA_TIMEOUT_MS=60000
```

| Variável | Obrigatória | Padrão | Uso |
| --- | --- | --- | --- |
| `PORT` | não | `3000` | Porta HTTP da API |
| `OLLAMA_BASE_URL` | não | `http://localhost:11434` | URL do daemon do Ollama, sem barra no final |
| `OLLAMA_MODEL` | sim | — | Nome do modelo já baixado no Ollama. Neste ambiente: `qwen2.5:7b` |
| `OLLAMA_SYSTEM_PROMPT` | sim | — | Instrução de sistema enviada em toda chamada. Ver [System prompt](#system-prompt) |
| `OLLAMA_TEMPERATURE` | não | `0` | `temperature` das opções do chat |
| `OLLAMA_TOP_P` | não | `0.1` | `top_p` das opções do chat |
| `OLLAMA_TIMEOUT_MS` | não | `60000` | Tempo máximo, em milissegundos, da chamada ao Ollama |

Valores numéricos inválidos também impedem a inicialização. O arquivo `.env` não entra no git.

## System prompt

Cole este valor em `OLLAMA_SYSTEM_PROMPT`. As aspas duplas preservam as quebras de linha. O modelo recebe, além desta instrução, um bloco `[CONTEXTO DA QUESTÃO]` com nível, estrutura, enunciado e a tentativa do aluno.

```bash
OLLAMA_SYSTEM_PROMPT="Você é o tutor de uma plataforma de ensino de estruturas de dados. A API só te chama quando o aluno errou. A mensagem do usuário traz um bloco [CONTEXTO DA QUESTÃO] com Nível, Estrutura, Enunciado e Solução. A Solução é a tentativa incorreta do aluno, não a resposta oficial.

Objetivo: ajudar o aluno a chegar na resposta certa sem entregá-la.

Regras:
- Use o Nível para calibrar a linguagem e a Estrutura para manter o foco no conceito pedido.
- Compare a tentativa com o enunciado e aponte um único ponto de atenção.
- Não revele a resposta correta, o resultado final, o código corrigido nem o algoritmo completo.
- Não reescreva a solução do aluno já consertada.
- Não dê um passo a passo que resolva o exercício até o fim.
- Termine com uma pergunta curta que faça o aluno dar o próximo passo.
- Responda em português, em no máximo dois parágrafos curtos."
```

## Rodar o modelo

O nome em `OLLAMA_MODEL` precisa existir localmente antes da primeira chamada.

1. Inicie o daemon. No Linux ele costuma subir como serviço; se a porta `11434` não responder, rode:

```bash
ollama serve
```

2. Baixe o modelo configurado no `.env`:

```bash
ollama pull qwen2.5:7b
```

3. Confira se o daemon enxerga o modelo:

```bash
curl http://localhost:11434/api/tags
```

A lista em `models` deve incluir `qwen2.5:7b`.

## Subir a API

Desenvolvimento, com reload:

```bash
pnpm start:dev
```

Produção. Gere o artefato e execute o processo compilado:

```bash
pnpm build
pnpm start:prod
```

`pnpm start:prod` roda `node dist/main`. Com `PORT=3000`, a base é `http://localhost:3000`. O log esperado é `Servidor rodando na porta 3000!`.

`GET /` responde o texto `Hello World!` e serve só para confirmar que o processo está no ar. Não depende do Ollama.

## `POST /tutor/assist`

Envia o contexto de um exercício e recebe a resposta do modelo.

`Content-Type: application/json`

### Corpo da requisição

Todos os campos são string não vazia. Espaços nas pontas são removidos antes de montar o prompt. Campo desconhecido é rejeitado.

| Campo | Descrição |
| --- | --- |
| `level` | Nível do exercício |
| `structureType` | Estrutura ou assunto (por exemplo `for`, `array`) |
| `statement` | Enunciado |
| `solution` | Tentativa incorreta enviada pelo aluno |

```json
{
  "level": "iniciante",
  "structureType": "for",
  "statement": "Imprima os números de 1 a 5",
  "solution": "for (let i = 1; i <= 5; i++) console.log(i);"
}
```

### Resposta de sucesso

`200 OK`

```json
{
  "reply": "O laço começa em 1 e para quando i passa de 5. Cada volta imprime o valor atual de i.",
  "model": "qwen2.5:7b"
}
```

| Campo | Descrição |
| --- | --- |
| `reply` | Texto devolvido pelo modelo |
| `model` | Nome do modelo que gerou a resposta |

O texto de `reply` varia a cada execução. `model` acompanha `OLLAMA_MODEL`. Com o `.env` deste ambiente, o valor é `qwen2.5:7b`.

### Erros

Validação (`400 Bad Request`). `message` é uma lista das regras que falharam:

```json
{
  "statusCode": 400,
  "message": [
    "level should not be empty",
    "statement must be a string"
  ],
  "error": "Bad Request"
}
```

Ollama indisponível, modelo ausente ou resposta vazia (`503 Service Unavailable`):

```json
{
  "statusCode": 503,
  "message": "Unable to reach Ollama chat API",
  "error": "Service Unavailable"
}
```

`message` também pode ser `Ollama request failed with status <código>` ou `Ollama returned an empty or invalid chat response`.

## Chamada com curl

```bash
curl -s -X POST http://localhost:3000/tutor/assist \
  -H 'Content-Type: application/json' \
  -d '{
    "level": "iniciante",
    "structureType": "for",
    "statement": "Imprima os números de 1 a 5",
    "solution": "for (let i = 1; i <= 5; i++) console.log(i);"
  }'
```

## Postman, Insomnia e Bruno

1. Crie uma requisição `POST`.
2. URL: `http://localhost:3000/tutor/assist`.
3. Header: `Content-Type` = `application/json`.
4. Body no formato raw / JSON, com os quatro campos do exemplo acima.
5. Envie. O status esperado é `200` e o corpo tem `reply` e `model`.

Para reproduzir o `400`, apague `solution` ou acrescente um campo que não existe no contrato, como `"extra": true`. Para reproduzir o `503`, pare o Ollama ou use um `OLLAMA_MODEL` que não foi baixado e reinicie a API.

## Testes

```bash
pnpm test
pnpm test:e2e
pnpm test:cov
```

`pnpm test:e2e` sobe o `AppModule`, então o `.env` precisa ter `OLLAMA_MODEL` e `OLLAMA_SYSTEM_PROMPT` preenchidos. O e2e atual só cobre `GET /` e não chama o Ollama.
