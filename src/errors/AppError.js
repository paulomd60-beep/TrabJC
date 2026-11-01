// Erro de negócio/validação com status HTTP associado.
class AppError extends Error {
  constructor(message, status = 400, detalhes) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.detalhes = detalhes;
  }
}

module.exports = AppError;
