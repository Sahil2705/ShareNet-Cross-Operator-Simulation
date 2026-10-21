import api from './api';

export const dashboardService = {
  async getDashboards() {
    const res = await api.get('/dashboards');
    return res.data;
  },

  async getDashboardById(id) {
    const res = await api.get(`/dashboards/${id}`);
    return res.data;
  },

  async createDashboard(data) {
    const res = await api.post('/dashboards', data);
    return res.data;
  },

  async saveFullDashboard(id, data) {
    const res = await api.put(`/dashboards/${id}`, data);
    return res.data;
  },

  async deleteDashboard(id) {
    const res = await api.delete(`/dashboards/${id}`);
    return res.data;
  },

  async addWidget(dashboardId, widgetData) {
    const res = await api.post(`/dashboards/${dashboardId}/widgets`, widgetData);
    return res.data;
  },

  async deleteWidget(dashboardId, widgetId) {
    const res = await api.delete(`/dashboards/${dashboardId}/widgets/${widgetId}`);
    return res.data;
  },
};
