# 🤖 Debugando Agent

API NestJS que recebe o enunciado e a solução de um exercício e devolve uma resposta gerada por um modelo local via [Ollama](https://ollama.com).

O único endpoint de negócio é `POST /tutor/assist`. A aplicação monta o prompt, chama `POST {OLLAMA_BASE_URL}/api/chat` e devolve o texto do modelo.

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

Edite o `.env`. A aplicação recusa subir se `OLLAMA_MODEL` ou `OLLAMA_SYSTEM_PROMPT` estiverem vazios.

```bash
PORT=3000

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_SYSTEM_PROMPT="Você é um tutor de programação. Explique o exercício sem reescrever a solução inteira."
OLLAMA_TEMPERATURE=0
OLLAMA_TOP_P=0.1
OLLAMA_TIMEOUT_MS=60000
```

| Variável | Obrigatória | Padrão | Uso |
| --- | --- | --- | --- |
| `PORT` | não | `3000` | Porta HTTP da API |
| `OLLAMA_BASE_URL` | não | `http://localhost:11434` | URL do daemon do Ollama, sem barra no final |
| `OLLAMA_MODEL` | sim | — | Nome do modelo já baixado no Ollama |
| `OLLAMA_SYSTEM_PROMPT` | sim | — | Instrução de sistema enviada em toda chamada |
| `OLLAMA_TEMPERATURE` | não | `0` | `temperature` das opções do chat |
| `OLLAMA_TOP_P` | não | `0.1` | `top_p` das opções do chat |
| `OLLAMA_TIMEOUT_MS` | não | `60000` | Tempo máximo, em milissegundos, da chamada ao Ollama |

Valores numéricos inválidos também impedem a inicialização. O arquivo `.env` não entra no git.

## Rodar o modelo

O nome em `OLLAMA_MODEL` precisa existir localmente antes da primeira chamada.

1. Inicie o daemon. No Linux ele costuma subir como serviço; se a porta `11434` não responder, rode:

```bash
ollama serve
```

2. Baixe o mesmo modelo configurado no `.env`:

```bash
ollama pull llama3.2
```

3. Confira se o daemon enxerga o modelo:

```bash
curl http://localhost:11434/api/tags
```

A lista em `models` deve incluir o nome usado em `OLLAMA_MODEL` (por exemplo `llama3.2`).

## Subir a API

```bash
# desenvolvimento, com reload
pnpm start:dev

# uma execução
pnpm start

# build e execução do artefato
pnpm build
pnpm start:prod
```

Com `PORT=3000`, a base é `http://localhost:3000`. O log esperado é `Servidor rodando na porta 3000!`.

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
| `solution` | Solução enviada pelo aluno |

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
  "model": "llama3.2"
}
```

| Campo | Descrição |
| --- | --- |
| `reply` | Texto devolvido pelo modelo |
| `model` | Nome do modelo que gerou a resposta |

O texto de `reply` varia a cada execução. `model` acompanha o valor configurado em `OLLAMA_MODEL`.

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
