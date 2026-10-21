import api from './api';

export const queryService = {
  async executeAggregation(datasetId, config) {
    const res = await api.post(`/queries/${datasetId}/aggregate`, config);
    return res.data;
  },

  async getDistinctValues(datasetId, columnName) {
    const res = await api.get(`/queries/${datasetId}/distinct/${encodeURIComponent(columnName)}`);
    return res.data;
  },

  async getRecommendations(datasetId, dimensionField, measureField) {
    const params = new URLSearchParams();
    if (dimensionField) params.append('dimensionField', dimensionField);
    if (measureField) params.append('measureField', measureField);
    const res = await api.get(`/queries/${datasetId}/recommendations?${params.toString()}`);
    return res.data;
  },
};
