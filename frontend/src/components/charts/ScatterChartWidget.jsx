/**
 * ScatterChartWidget - Reusable scatter plot with category colors.
 * To use: pass your data array and specify which keys map to the X and Y axes.
 * Props: data, xKey, yKey, title, subtitle, categoryKey, colors, height
 */
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import styles from './ChartWidget.module.css'

export default function ScatterChartWidget({
  data,
  xKey,
  yKey,
  title,
  subtitle,
  categoryKey,
  colors = { 'completed': '#4F46E5', 'none': '#94A3B8' },
  height = 280,
}) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
          No hay datos disponibles
        </div>
      </div>
    )
  }

  // Group data by category
  const groupedData = {}
  data.forEach((row) => {
    const category = row[categoryKey] || 'none'
    if (!groupedData[category]) {
      groupedData[category] = []
    }
    groupedData[category].push({
      x: row[xKey],
      y: row[yKey],
      ...row,
    })
  })

  const categoryLabels = {
    'completed': 'Completado',
    'none': 'No Completado',
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            type="number"
            dataKey="x"
            name={xKey}
            domain={[0, 100]}
            stroke="#64748B"
            fontSize={12}
            label={{ value: xKey, position: 'insideBottom', offset: -5, style: { fill: '#64748B' } }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yKey}
            domain={[0, 100]}
            stroke="#64748B"
            fontSize={12}
            label={{ value: yKey, angle: -90, position: 'insideLeft', style: { fill: '#64748B' } }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px', textAlign: 'right' }}
            iconType="circle"
            formatter={(value) => categoryLabels[value] || value}
          />
          {Object.entries(groupedData).map(([category, plotData]) => (
            <Scatter
              key={category}
              name={category}
              data={plotData}
              fill={colors[category] || colors['none']}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
