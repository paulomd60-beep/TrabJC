const pedidoService = require('../services/pedidoService');

// Controllers só lidam com req/res; as regras ficam no service.
function criar(req, res, next) {
  try {
    const pedido = pedidoService.criar(req.body);
    res.status(201).json(pedido);
  } catch (err) {
    next(err);
  }
}

function listar(req, res, next) {
  try {
    res.status(200).json(pedidoService.listar());
  } catch (err) {
    next(err);
  }
}

function buscarPorId(req, res, next) {
  try {
    res.status(200).json(pedidoService.buscarPorId(req.params.id));
  } catch (err) {
    next(err);
  }
}

function atualizarStatus(req, res, next) {
  try {
    const pedido = pedidoService.atualizarStatus(req.params.id, req.body);
    res.status(200).json(pedido);
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, listar, buscarPorId, atualizarStatus };
