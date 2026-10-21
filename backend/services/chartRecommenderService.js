/**
 * Chart Recommendation Engine
 * Analyzes selected fields, data types, and cardinalities to recommend the best visualizations.
 */

function recommendChartTypes({ dimensionCol, measureCol, secondaryDimCol, secondaryMeasCol }) {
  const recommendations = [];

  // Scenario 1: Only measure selected -> KPI Card is #1
  if (!dimensionCol && measureCol) {
    recommendations.push({
      chartType: 'kpi',
      title: 'KPI Metric Card',
      recommended: true,
      reason: 'Single numeric measure without dimension is best displayed as a prominent KPI card.',
    });
    recommendations.push({
      chartType: 'table',
      title: 'Data Table',
      recommended: false,
      reason: 'Inspect underlying data rows in tabular format.',
    });
    return recommendations;
  }

  // Scenario 2: Date Dimension + Numeric Measure -> Line / Area charts
  if (dimensionCol && dimensionCol.dataType === 'date' && measureCol) {
    recommendations.push({
      chartType: 'line',
      title: 'Line Chart',
      recommended: true,
      reason: 'Date dimension detected. Line charts excel at visualizing trends and continuous time-series.',
    });
    recommendations.push({
      chartType: 'area',
      title: 'Area Chart',
      recommended: true,
      reason: 'Great for emphasizing volume and magnitude of trend over time.',
    });
    recommendations.push({
      chartType: 'column',
      title: 'Column Chart',
      recommended: false,
      reason: 'Discrete periods (e.g. months, years) can also be compared vertically.',
    });
    recommendations.push({
      chartType: 'table',
      title: 'Data Table',
      recommended: false,
      reason: 'View detailed period-by-period values.',
    });
    return recommendations;
  }

  // Scenario 3: Categorical Dimension + Numeric Measure
  if (dimensionCol && measureCol) {
    const isLowCardinality = (dimensionCol.uniqueCount || 10) <= 7;

    recommendations.push({
      chartType: 'column',
      title: 'Column Chart',
      recommended: true,
      reason: 'Optimal for comparing discrete categories side-by-side.',
    });
    recommendations.push({
      chartType: 'bar',
      title: 'Bar Chart (Horizontal)',
      recommended: true,
      reason: 'Horizontal bars provide great readability for long category names.',
    });

    if (isLowCardinality) {
      recommendations.push({
        chartType: 'donut',
        title: 'Donut Chart',
        recommended: true,
        reason: `${dimensionCol.displayName || dimensionCol.columnName} has few categories (${dimensionCol.uniqueCount || 'low'}), ideal for part-to-whole share.`,
      });
      recommendations.push({
        chartType: 'pie',
        title: 'Pie Chart',
        recommended: false,
        reason: 'Displays proportional composition.',
      });
    }

    recommendations.push({
      chartType: 'line',
      title: 'Line Chart',
      recommended: false,
      reason: 'Can highlight categorical progression.',
    });
    recommendations.push({
      chartType: 'table',
      title: 'Data Table',
      recommended: false,
      reason: 'Sortable detailed tabular view.',
    });

    return recommendations;
  }

  // Scenario 4: Two Numeric Measures (Scatter Plot)
  if (dimensionCol && dimensionCol.dataType === 'number' && measureCol && measureCol.dataType === 'number') {
    recommendations.push({
      chartType: 'scatter',
      title: 'Scatter Plot',
      recommended: true,
      reason: 'Both fields are numeric. Scatter plots reveal correlation and clustering.',
    });
    recommendations.push({
      chartType: 'column',
      title: 'Column Chart',
      recommended: false,
      reason: 'Categorical distribution of the first measure against the second.',
    });
    return recommendations;
  }

  // Default fallback recommendations
  return [
    { chartType: 'column', title: 'Column Chart', recommended: true, reason: 'Standard general-purpose visualization.' },
    { chartType: 'bar', title: 'Bar Chart', recommended: false, reason: 'Horizontal comparison.' },
    { chartType: 'line', title: 'Line Chart', recommended: false, reason: 'Trend visualization.' },
    { chartType: 'donut', title: 'Donut Chart', recommended: false, reason: 'Proportion breakdown.' },
    { chartType: 'table', title: 'Data Table', recommended: false, reason: 'Raw tabular exploration.' },
  ];
}

module.exports = {
  recommendChartTypes,
};
