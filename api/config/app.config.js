process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

process.env.LOCALE = process.env.LOCALE || 'es-ES';

process.env.APP_KEY = process.env.APP_KEY || '83c1987fea5ec03414eba8d1ecc44b6d';

process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || '';
process.env.DB_PASS = process.env.DB_PASS || '';
process.env.DB_NAME = process.env.DB_NAME || 'veychi';
process.env.DB_PORT = process.env.DB_PORT || 27017;

process.env.AUTH_HEADER = process.env.AUTH_HEADER || 'Authorization';

process.env.JWT_KEY = process.env.JWT_KEY || 'secret-debug';
process.env.JWT_EXP = process.env.JWT_EXP || '3 days';

process.env.PORT = process.env.PORT || 3535;