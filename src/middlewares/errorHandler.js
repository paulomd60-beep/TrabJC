const AppError = require('../errors/AppError');

function naoEncontrado(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // JSON malformado enviado pelo cliente.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }

  // Erros previstos (validação, não encontrado).
  if (err instanceof AppError) {
    const corpo = { erro: err.message };
    if (err.detalhes) corpo.detalhes = err.detalhes;
    return res.status(err.status).json(corpo);
  }

  // Erros inesperados: registra no servidor e responde 500 genérico.
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = { naoEncontrado, errorHandler };
