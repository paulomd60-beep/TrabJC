const AppError = require('../errors/AppError');

const TIPOS = ['entrega', 'retirada', 'local'];
const PRIORIDADES = ['baixa', 'normal', 'alta', 'urgente'];
const STATUS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];

// Transições permitidas entre status.
const TRANSICOES = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: [],
};

// Armazenamento em memória.
let pedidos = [];
let proximoId = 1;

function validarCriacao(dados) {
  const erros = [];
  const corpo = dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {};

  if (typeof corpo.cliente !== 'string' || corpo.cliente.trim() === '') {
    erros.push('cliente é obrigatório e deve ser um texto não vazio');
  }
  if (typeof corpo.valor !== 'number' || !Number.isFinite(corpo.valor) || corpo.valor <= 0) {
    erros.push('valor deve ser numérico e maior que zero');
  }
  if (!TIPOS.includes(corpo.tipo)) {
    erros.push(`tipo inválido; valores aceitos: ${TIPOS.join(', ')}`);
  }
  if (!PRIORIDADES.includes(corpo.prioridade)) {
    erros.push(`prioridade inválida; valores aceitos: ${PRIORIDADES.join(', ')}`);
  }

  if (erros.length > 0) {
    throw new AppError('Dados inválidos', 400, erros);
  }
  return corpo;
}

function criar(dados) {
  const corpo = validarCriacao(dados);
  const pedido = {
    id: proximoId++,
    cliente: corpo.cliente.trim(),
    tipo: corpo.tipo,
    valor: corpo.valor,
    prioridade: corpo.prioridade,
    status: 'recebido',
  };
  pedidos.push(pedido);
  return pedido;
}

function listar() {
  return pedidos;
}

function buscarPorId(id) {
  const numero = Number(id);
  const pedido = Number.isInteger(numero) ? pedidos.find((p) => p.id === numero) : undefined;
  if (!pedido) {
    throw new AppError('Pedido não encontrado', 404);
  }
  return pedido;
}

function atualizarStatus(id, dados) {
  // 404 tem prioridade: primeiro garante que o pedido existe.
  const pedido = buscarPorId(id);
  const novoStatus = dados && typeof dados === 'object' ? dados.status : undefined;

  if (!STATUS.includes(novoStatus)) {
    throw new AppError('Dados inválidos', 400, [
      `status inválido; valores aceitos: ${STATUS.join(', ')}`,
    ]);
  }
  if (!TRANSICOES[pedido.status].includes(novoStatus)) {
    const permitidos = TRANSICOES[pedido.status];
    throw new AppError('Transição de status não permitida', 400, [
      `de "${pedido.status}" só é possível ir para: ${
        permitidos.length ? permitidos.join(', ') : '(nenhum, status final)'
      }`,
    ]);
  }

  pedido.status = novoStatus;
  return pedido;
}

// Usado apenas nos testes.
function resetar() {
  pedidos = [];
  proximoId = 1;
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizarStatus,
  resetar,
  TIPOS,
  PRIORIDADES,
  STATUS,
  TRANSICOES,
};
