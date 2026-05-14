const apiRegistry = {
  auth: {
    signup: { method: 'POST', path: '/api/auth/signup', auth: false },
    login: { method: 'POST', path: '/api/auth/login', auth: false },
    logout: { method: 'POST', path: '/api/auth/logout', auth: true },
    me: { method: 'GET', path: '/api/auth/me', auth: true },
  },
  
  farmers: {
    getAll: { method: 'GET', path: '/api/farmers', auth: true },
    getById: { method: 'GET', path: '/api/farmers/:id', auth: true },
    create: { method: 'POST', path: '/api/farmers', auth: true },
  },
  
  drivers: {
    getAll: { method: 'GET', path: '/api/drivers', auth: true },
    getById: { method: 'GET', path: '/api/drivers/:id', auth: true },
    login: { method: 'POST', path: '/api/drivers/login', auth: false },
  },

  harvester: {
    getAll: { method: 'GET', path: '/api/harvester-jobs', auth: true },
    create: { method: 'POST', path: '/api/harvester-jobs', auth: true },
  },

  rentals: {
    getAll: { method: 'GET', path: '/api/rentals', auth: true },
  },

  health: { method: 'GET', path: '/api/health', auth: false },
};

module.exports = apiRegistry;
