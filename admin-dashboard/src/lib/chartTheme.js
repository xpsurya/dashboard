export const COLORS = {
  accent: '#3182CE',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#94A3B8',
  grid: 'rgba(148,163,184,0.12)',
};

export const baseOption = {
  backgroundColor: 'transparent',
  textStyle: { fontFamily: 'Plus Jakarta Sans', color: COLORS.text },
  grid: { left: 8, right: 16, top: 40, bottom: 4, containLabel: true },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#1C2541',
    borderColor: '#334155',
    textStyle: { color: '#E2E8F0', fontSize: 12 },
  },
  legend: { top: 0, left: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: COLORS.text, fontSize: 11 } },
};

export const axis = ({ axisLabel, ...rest } = {}) => ({
  axisLine: { lineStyle: { color: '#334155' } },
  axisTick: { show: false },
  splitLine: { lineStyle: { color: COLORS.grid } },
  nameTextStyle: { color: '#64748B', fontSize: 10 },
  ...rest,
  axisLabel: { color: COLORS.text, fontSize: 11, ...axisLabel },
});

export const fade = (hex) => ({
  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [{ offset: 0, color: `${hex}55` }, { offset: 1, color: `${hex}00` }],
});
