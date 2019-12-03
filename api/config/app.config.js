process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

process.env.LOCALE = process.env.LOCALE || 'es-ES';

process.env.APP_KEY = process.env.APP_KEY || '83c1987fea5ec03414eba8d1ecc44b6d';
process.env.NAME_PATTERN = '^[a-zA-ZñÑáéíóúÁÉÍÓÚ\' ]';

process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASS = process.env.DB_PASS || '';
process.env.DB_NAME = process.env.DB_NAME || 'veychi';

process.env.AUTH_HEADER = process.env.AUTH_HEADER || 'Authorization';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-debug';

process.env.PORT = process.env.PORT || 3535;