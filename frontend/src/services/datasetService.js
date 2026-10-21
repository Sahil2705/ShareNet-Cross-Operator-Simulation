import api from './api';

export const datasetService = {
  async uploadFileAndPreview(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async confirmImport(importConfig) {
    const res = await api.post('/datasets/confirm-import', importConfig);
    return res.data;
  },

  async getDatasets() {
    const res = await api.get('/datasets');
    return res.data;
  },

  async getDataset(id) {
    const res = await api.get(`/datasets/${id}`);
    return res.data;
  },

  async getDatasetPreview(id, options = {}) {
    const params = new URLSearchParams(options);
    const res = await api.get(`/datasets/${id}/preview?${params.toString()}`);
    return res.data;
  },

  async updateColumns(id, columns) {
    const res = await api.put(`/datasets/${id}/columns`, { columns });
    return res.data;
  },

  async deleteDataset(id) {
    const res = await api.delete(`/datasets/${id}`);
    return res.data;
  },
};
