/**
 * PieChartWidget - Reusable donut chart with custom center text.
 * To use: pass your data array and specify nameKey and valueKey.
 * Props: data, nameKey, valueKey, title, subtitle, centerText, colors, height
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import styles from './ChartWidget.module.css'

const DEFAULT_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export default function PieChartWidget({
  data,
  nameKey,
  valueKey,
  title,
  subtitle,
  centerText,
  colors = DEFAULT_COLORS,
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

  const chartData = data.map((row) => ({ name: String(row[nameKey]), value: Number(row[valueKey]) || 0 }))
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
            formatter={(value) => {
              const percent = ((value / total) * 100).toFixed(1)
              return [`${value} (${percent}%)`, 'Estudiantes']
            }}
          />
          {centerText && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: '14px', fontWeight: 600, fill: '#1E293B' }}
            >
              {centerText}
            </text>
          )}
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            formatter={(value, entry) => {
              const item = chartData.find((d) => d.name === value)
              const percent = item ? ((item.value / total) * 100).toFixed(1) : '0'
              return `${value} (${percent}%)`
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
