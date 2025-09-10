// Use development environment for local testing
process.env.NODE_ENV = 'development';
require('dotenv').config();

const config = {
  roles: {
    USER: 'USER',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
  },

  defaultEmails: {
    superAdmin: process.env.SUPER_ADMIN_EMAIL,
  },

  nextauth: {
    production:
      process.env.NEXTAUTH_BACKOFFICE_URL ||
      process.env.PUBLIC_BACKOFFICE_BASE_URL ||
      'http://localhost:3001',
  },

  database: {
    url: process.env.DATABASE_URL,
  },
};

module.exports = { config };
