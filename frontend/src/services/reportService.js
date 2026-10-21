import api from './api';

export const reportService = {
  async getReports() {
    const res = await api.get('/reports');
    return res.data;
  },

  async getReportById(id) {
    const res = await api.get(`/reports/${id}`);
    return res.data;
  },

  async createReport(data) {
    const res = await api.post('/reports', data);
    return res.data;
  },

  async updateReport(id, data) {
    const res = await api.put(`/reports/${id}`, data);
    return res.data;
  },

  async deleteReport(id) {
    const res = await api.delete(`/reports/${id}`);
    return res.data;
  },
};
