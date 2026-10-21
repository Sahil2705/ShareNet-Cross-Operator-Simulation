import api from './api';

export const connectorService = {
  async listConnectors() {
    const res = await api.get('/connectors/list');
    return res.data;
  },

  async testConnection(type, config) {
    const res = await api.post('/connectors/test', { type, config });
    return res.data;
  },

  async importConnectorData(type, config, name, description) {
    const res = await api.post('/connectors/import', { type, config, name, description });
    return res.data;
  },
};
