/**
 * HorizontalBarChart - Bar chart with horizontal layout.
 * Purpose: Display performance by education level (vertical bars).
 * Props: data, xKey, yKey, title, subtitle, color, height
 */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import styles from './ChartWidget.module.css'

export default function HorizontalBarChart({
  data,
  xKey,
  yKey,
  title,
  subtitle,
  color = '#4F46E5',
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

  // Abreviar labels largos
  const formatLabel = (label) => {
    if (!label) return ''
    const abbrev = {
      "master's degree": "Master's",
      "bachelor's degree": "Bachelor's",
      "associate's degree": "Associate's",
      "some college": "Some College",
      "high school": "High School",
      "some high school": "Some HS"
    }
    return abbrev[label.toLowerCase()] || label
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis type="number" domain={[0, 100]} stroke="#64748B" fontSize={12} />
          <YAxis
            type="category"
            dataKey={xKey}
            width={90}
            stroke="#64748B"
            fontSize={12}
            tickFormatter={formatLabel}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
            formatter={(value) => [`${value.toFixed(1)}`, 'Promedio']}
            labelFormatter={(label) => formatLabel(label)}
          />
          <Bar dataKey={yKey} fill={color} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


