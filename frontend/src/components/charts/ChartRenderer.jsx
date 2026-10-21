import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export default function ChartRenderer({
  chartType = 'column',
  data = {},
  title = '',
  height = 360,
  colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'],
}) {
  const { categories = [], values = [], seriesMap = {}, dimensionField = '', measureField = '', aggregation = '' } = data;

  const option = useMemo(() => {
    const isHorizontalBar = chartType === 'bar';
    const isColumn = chartType === 'column';
    const isLine = chartType === 'line';
    const isArea = chartType === 'area';
    const isPie = chartType === 'pie';
    const isDonut = chartType === 'donut';
    const isScatter = chartType === 'scatter';

    // 1. Pie and Donut Charts
    if (isPie || isDonut) {
      const pieData = categories.map((cat, idx) => ({
        name: cat,
        value: values[idx] || 0,
      }));

      return {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: <b>{c}</b> ({d}%)',
          backgroundColor: '#1e293b',
          borderColor: '#334155',
          textStyle: { color: '#f8fafc', fontSize: 12 },
        },
        legend: {
          orient: 'horizontal',
          bottom: 0,
          type: 'scroll',
          textStyle: { color: '#64748b', fontSize: 11 },
        },
        color: colors,
        series: [
          {
            name: measureField || 'Value',
            type: 'pie',
            radius: isDonut ? ['45%', '72%'] : '70%',
            center: ['50%', '45%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: isDonut ? 6 : 4,
              borderColor: '#ffffff',
              borderWidth: 2,
            },
            label: {
              show: true,
              formatter: '{b}: {d}%',
              fontSize: 11,
              color: '#475569',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 13,
                fontWeight: 'bold',
              },
            },
            data: pieData,
          },
        ],
      };
    }

    // 2. Scatter Plot
    if (isScatter) {
      const scatterData = (data.raw || []).map((r) => [
        Number(r.dimension || 0),
        Number(r.measure || 0),
      ]);

      return {
        tooltip: {
          trigger: 'item',
          formatter: (params) => `${dimensionField}: ${params.value[0]}<br/>${measureField}: ${params.value[1]}`,
          backgroundColor: '#1e293b',
          textStyle: { color: '#fff', fontSize: 12 },
        },
        grid: { left: '8%', right: '8%', top: '12%', bottom: '12%', containLabel: true },
        xAxis: {
          type: 'value',
          name: dimensionField,
          splitLine: { lineStyle: { color: '#f1f5f9' } },
        },
        yAxis: {
          type: 'value',
          name: measureField,
          splitLine: { lineStyle: { color: '#f1f5f9' } },
        },
        series: [
          {
            type: 'scatter',
            symbolSize: 14,
            data: scatterData,
            itemStyle: { color: colors[0], opacity: 0.8 },
          },
        ],
      };
    }

    // 3. Multi-series (if secondary dimension present)
    const hasSecondarySeries = Object.keys(seriesMap).length > 0;
    let series = [];

    if (hasSecondarySeries) {
      const secKeys = Object.keys(seriesMap);
      series = secKeys.map((secName, sIdx) => {
        const seriesData = categories.map((cat) => seriesMap[secName]?.[cat] || 0);
        return {
          name: secName,
          type: isHorizontalBar ? 'bar' : isLine || isArea ? 'line' : 'bar',
          stack: isArea ? 'Total' : undefined,
          smooth: isLine || isArea,
          areaStyle: isArea ? { opacity: 0.3 } : undefined,
          data: seriesData,
          itemStyle: { color: colors[sIdx % colors.length] },
        };
      });
    } else {
      // Single series standard
      series = [
        {
          name: `${aggregation || ''} ${measureField}`.trim(),
          type: isHorizontalBar ? 'bar' : isLine || isArea ? 'line' : 'bar',
          smooth: isLine || isArea,
          data: values,
          itemStyle: {
            color: isHorizontalBar
              ? {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 1,
                  y2: 0,
                  colorStops: [
                    { offset: 0, color: colors[0] },
                    { offset: 1, color: '#818cf8' },
                  ],
                }
              : isColumn
              ? {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: colors[0] },
                    { offset: 1, color: '#818cf8' },
                  ],
                }
              : colors[0],
            borderRadius: isHorizontalBar ? [0, 4, 4, 0] : isColumn ? [4, 4, 0, 0] : 0,
          },
          areaStyle: isArea
            ? {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: colors[0] + '80' },
                    { offset: 1, color: colors[0] + '05' },
                  ],
                },
              }
            : undefined,
        },
      ];
    }

    // Grid coordinates
    const categoryAxis = {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: isHorizontalBar ? 0 : categories.length > 6 ? 28 : 0,
        color: '#64748b',
        fontSize: 11,
        formatter: (val) => (String(val).length > 15 ? String(val).substring(0, 13) + '...' : val),
      },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    };

    const valueAxis = {
      type: 'value',
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        formatter: (val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val),
      },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    };

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: isLine || isArea ? 'line' : 'shadow' },
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: function (params) {
          if (!params || params.length === 0) return '';
          let res = `<div class="font-bold text-xs pb-1 border-b border-slate-600">${params[0].name}</div>`;
          params.forEach((p) => {
            const valFormatted = typeof p.value === 'number' ? p.value.toLocaleString() : p.value;
            res += `<div class="flex items-center gap-2 pt-1 text-xs">
              <span style="background:${p.color};width:8px;height:8px;border-radius:50%;display:inline-block"></span>
              <span class="text-slate-300">${p.seriesName}:</span>
              <span class="font-semibold text-white ml-auto">${valFormatted}</span>
            </div>`;
          });
          return res;
        },
      },
      legend: hasSecondarySeries
        ? {
            orient: 'horizontal',
            bottom: 0,
            type: 'scroll',
            textStyle: { color: '#64748b', fontSize: 11 },
          }
        : undefined,
      grid: {
        left: '4%',
        right: '4%',
        top: '10%',
        bottom: hasSecondarySeries || categories.length > 6 ? '18%' : '10%',
        containLabel: true,
      },
      xAxis: isHorizontalBar ? valueAxis : categoryAxis,
      yAxis: isHorizontalBar ? categoryAxis : valueAxis,
      series: series,
    };
  }, [chartType, categories, values, seriesMap, dimensionField, measureField, aggregation, colors]);

  if (categories.length === 0 && values.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 p-6 text-center"
      >
        <p className="text-sm font-medium">No chart data available</p>
        <p className="text-xs text-slate-400 mt-1">
          Drag fields into the configuration zones or adjust filters to view chart.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ height }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}
