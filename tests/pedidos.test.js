const request = require('supertest');
const app = require('../src/app');
const pedidoService = require('../src/services/pedidoService');

const pedidoValido = {
  cliente: 'Carlos Silva',
  tipo: 'entrega',
  valor: 350,
  prioridade: 'normal',
};

beforeEach(() => pedidoService.resetar());

describe('POST /pedidos', () => {
  test('cria pedido válido e retorna 201 com status "recebido"', async () => {
    const res = await request(app).post('/pedidos').send(pedidoValido);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
  });

  test('remove espaços nas extremidades do cliente', async () => {
    const res = await request(app).post('/pedidos').send({ ...pedidoValido, cliente: '  Ana  ' });
    expect(res.status).toBe(201);
    expect(res.body.cliente).toBe('Ana');
  });

  test.each([
    ['cliente vazio', { cliente: '' }],
    ['cliente só com espaços', { cliente: '   ' }],
    ['cliente ausente', { cliente: undefined }],
    ['valor zero', { valor: 0 }],
    ['valor negativo', { valor: -10 }],
    ['valor em texto', { valor: '350' }],
    ['tipo desconhecido', { tipo: 'voador' }],
    ['prioridade desconhecida', { prioridade: 'maxima' }],
  ])('retorna 400 para %s', async (_nome, alteracao) => {
    const res = await request(app).post('/pedidos').send({ ...pedidoValido, ...alteracao });
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
    expect(Array.isArray(res.body.detalhes)).toBe(true);
  });

  test('retorna 400 para JSON malformado', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{ invalido');
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });
});

describe('GET /pedidos', () => {
  test('retorna lista vazia com 200', async () => {
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('lista os pedidos cadastrados', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    await request(app).post('/pedidos').send({ ...pedidoValido, cliente: 'Maria' });
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /pedidos/:id', () => {
  test('retorna pedido existente com 200', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).get('/pedidos/1');
    expect(res.status).toBe(200);
    expect(res.body.cliente).toBe('Carlos Silva');
  });

  test('retorna 404 para id inexistente', async () => {
    const res = await request(app).get('/pedidos/999');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });

  test('retorna 404 para id não numérico', async () => {
    const res = await request(app).get('/pedidos/abc');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /pedidos/:id/status', () => {
  beforeEach(async () => {
    await request(app).post('/pedidos').send(pedidoValido);
  });

  test('atualiza status com transição válida (200)', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'em_preparacao' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_preparacao');
  });

  test('permite cancelar um pedido recebido', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'cancelado' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelado');
  });

  test('retorna 400 para status desconhecido', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'voando' });
    expect(res.status).toBe(400);
  });

  test('retorna 400 quando status não é enviado', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({});
    expect(res.status).toBe(400);
  });

  test('retorna 400 para transição não permitida (recebido -> entregue)', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'entregue' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/transição/i);
  });

  test('pedido cancelado não pode mudar de status', async () => {
    await request(app).patch('/pedidos/1/status').send({ status: 'cancelado' });
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'recebido' });
    expect(res.status).toBe(400);
  });

  test('retorna 404 para id inexistente', async () => {
    const res = await request(app).patch('/pedidos/999/status').send({ status: 'enviado' });
    expect(res.status).toBe(404);
  });
});

describe('Erros gerais', () => {
  test('rota inexistente retorna 404 em JSON', async () => {
    const res = await request(app).get('/nada');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });

  test('erro inesperado retorna 500 sem vazar detalhes', async () => {
    const spy = jest.spyOn(pedidoService, 'listar').mockImplementation(() => {
      throw new Error('falha interna');
    });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ erro: 'Erro interno do servidor' });
    spy.mockRestore();
    errSpy.mockRestore();
  });
});
