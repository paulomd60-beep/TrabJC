# API de Gerenciamento de Pedidos
- **Aluno:** _Paulo Miguel Dias_
- **RA:** _44895992_

```bash
npm install
npm start        # sobe a API em http://localhost:3000 (porta alterável via PORT)
npm test         # roda os testes automatizados (Jest + Supertest)
```

## Rotas

| Método | Rota                    | Descrição                  | Respostas                          |
|--------|-------------------------|----------------------------|------------------------------------|
| POST   | `/pedidos`              | Cadastra um pedido         | 201; 400 (dados inválidos)         |
| GET    | `/pedidos`              | Lista os pedidos           | 200                                |
| GET    | `/pedidos/:id`          | Consulta um pedido         | 200; 404 (inexistente)             |
| PATCH  | `/pedidos/:id/status`   | Atualiza o status          | 200; 400 (inválido); 404           |

Erros inesperados retornam **500** com mensagem genérica (o detalhe fica só no log do servidor).

## Exemplos

Criação:

```http
POST /pedidos
{ "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal" }
```

Resposta (201):

```json
{ "id": 1, "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal", "status": "recebido" }
```

Atualização de status:

```http
PATCH /pedidos/1/status
{ "status": "em_preparacao" }
```

Resposta de erro (400):

```json
{ "erro": "Dados inválidos", "detalhes": ["valor deve ser numérico e maior que zero"] }
```

## Regras de validação

- `cliente`: texto obrigatório, não vazio mesmo após remover espaços das extremidades (o valor é salvo já sem esses espaços).
- `valor`: número (não aceita texto) maior que zero.
- `tipo`: `entrega`, `retirada` ou `local`.
- `prioridade`: `baixa`, `normal`, `alta` ou `urgente`.
- `status`: `recebido`, `em_preparacao`, `enviado`, `entregue` ou `cancelado`. Todo pedido novo nasce como `recebido`.

### Transições de status permitidas

| De              | Para                        |
|-----------------|-----------------------------|
| `recebido`      | `em_preparacao`, `cancelado`|
| `em_preparacao` | `enviado`, `cancelado`      |
| `enviado`       | `entregue`, `cancelado`     |
| `entregue`      | (status final)              |
| `cancelado`     | (status final)              |

Transição fora dessa tabela retorna 400 com mensagem explicativa. Se o ID não existir, a resposta é 404 (checado antes do status).

## Arquitetura

```
src/
  server.js              # inicia o servidor (listen)
  app.js                 # configura o Express (middlewares e rotas)
  routes/                # mapeia URL + método para o controller
  controllers/           # lê a requisição, chama o service, devolve a resposta HTTP
  services/              # regras de negócio, validações e armazenamento em memória
  middlewares/           # tratamento centralizado de erros (400 JSON, 404, 500)
  errors/                # AppError: erro previsto com status HTTP
tests/                   # testes automatizados
evidencias/              # prints do Postman
postman/                 # coleção Postman para importar
```

Fluxo: **rota → controller → service**. O controller não contém regra de negócio; o service lança `AppError` (400/404) e o middleware de erro converte tudo em resposta JSON. `app.js` é separado de `server.js` para os testes usarem o app sem abrir porta.

## Padrão implementado

Camadas (routes / controllers / services) com tratamento de erros centralizado em middleware.

## Uso de IA

IA (Claude) foi utilizada como apoio na criação deste projeto

