/**
 * Dashboard - Main dashboard page for EduInsights.
 * Purpose: Display KPIs and charts for student performance analysis.
 * Data source: Supabase 'students' table via useSupabase hook.
 */
import { useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import KpiCard from '../components/ui/KpiCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import HorizontalBarChart from '../components/charts/HorizontalBarChart'
import GroupedBarChart from '../components/charts/GroupedBarChart'
import ScatterChartWidget from '../components/charts/ScatterChartWidget'
import PieChartWidget from '../components/charts/PieChartWidget'
import styles from './Dashboard.module.css'

const TABLE_NAME = 'students'

export default function Dashboard() {
  const { data, loading, error, refetch } = useSupabase(TABLE_NAME)

  // KPI 1: Promedio General de Matemáticas
  const mathAverage = useMemo(() => {
    if (!data || data.length === 0) return 0
    const sum = data.reduce((acc, student) => acc + (student.math_score || 0), 0)
    return (sum / data.length).toFixed(1)
  }, [data])

  // KPI 2: Tasa de Aprobación
  const approvalRate = useMemo(() => {
    if (!data || data.length === 0) return 0
    const passed = data.filter((s) => s.pass_math === 1).length
    return Math.round((passed / data.length) * 100)
  }, [data])

  // KPI 3: Impacto del Curso de Preparación
  const prepCourseImpact = useMemo(() => {
    if (!data || data.length === 0) return 0
    const withPrep = data.filter((s) => s.test_prep === 'completed')
    const withoutPrep = data.filter((s) => s.test_prep === 'none' || !s.test_prep)

    if (withPrep.length === 0 || withoutPrep.length === 0) return 0

    const avgWithPrep = withPrep.reduce((acc, s) => acc + (s.math_score || 0), 0) / withPrep.length
    const avgWithoutPrep = withoutPrep.reduce((acc, s) => acc + (s.math_score || 0), 0) / withoutPrep.length

    return (avgWithPrep - avgWithoutPrep).toFixed(1)
  }, [data])

  // KPI 4: Total de Estudiantes
  const totalStudents = data?.length || 0

  // Gráfica 1: Promedio por Nivel Educativo de los Padres (Barra Horizontal)
  const educationPerformance = useMemo(() => {
    if (!data || data.length === 0) return []

    const grouped = {}
    data.forEach((student) => {
      const edu = student.parental_education || 'unknown'
      if (!grouped[edu]) {
        grouped[edu] = { sum: 0, count: 0 }
      }
      grouped[edu].sum += student.math_score || 0
      grouped[edu].count += 1
    })

    return Object.entries(grouped)
      .map(([education, stats]) => ({
        education,
        average: stats.count > 0 ? stats.sum / stats.count : 0,
      }))
      .sort((a, b) => b.average - a.average)
  }, [data])

  // Gráfica 2: Comparación de Scores por Materia (Barras Agrupadas)
  const scoresBySubject = useMemo(() => {
    if (!data || data.length === 0) return []

    const grouped = { male: { math: [], reading: [], writing: [] }, female: { math: [], reading: [], writing: [] } }

    data.forEach((student) => {
      const gender = student.gender?.toLowerCase() === 'male' ? 'male' : 'female'
      if (student.math_score != null) grouped[gender].math.push(student.math_score)
      if (student.reading_score != null) grouped[gender].reading.push(student.reading_score)
      if (student.writing_score != null) grouped[gender].writing.push(student.writing_score)
    })

    const avg = (arr) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

    return [
      {
        gender: 'Female',
        math: avg(grouped.female.math),
        reading: avg(grouped.female.reading),
        writing: avg(grouped.female.writing),
      },
      {
        gender: 'Male',
        math: avg(grouped.male.math),
        reading: avg(grouped.male.reading),
        writing: avg(grouped.male.writing),
      },
    ]
  }, [data])

  // Gráfica 3: Reading vs Writing Score (Scatter Plot)
  const readingWritingData = useMemo(() => {
    if (!data || data.length === 0) return []
    return data
      .filter((s) => s.reading_score != null && s.writing_score != null)
      .map((s) => ({
        reading_score: s.reading_score,
        writing_score: s.writing_score,
        test_prep: s.test_prep || 'none',
      }))
  }, [data])

  // Gráfica 4: Distribución por Grupo Étnico (Pie Chart)
  const ethnicityDistribution = useMemo(() => {
    if (!data || data.length === 0) return []

    const grouped = {}
    data.forEach((student) => {
      const ethnicity = (student.ethnicity || 'unknown').trim()
      // Normalizar formato: "group A" -> "Group A", "group B" -> "Group B", etc.
      const normalized = ethnicity
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      grouped[normalized] = (grouped[normalized] || 0) + 1
    })

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  if (error) {
    return (
      <div className={styles.errorBanner}>
        <p>No se pudo conectar con la base de datos. Verifica tu configuración.</p>
        <button onClick={refetch} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Dashboard de Rendimiento</h1>
        <p className={styles.subtitle}>Análisis general del dataset de 1,000 estudiantes</p>
      </header>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KpiCard
          title="Promedio Matemáticas"
          value={`${mathAverage}`}
          subtitle="sobre 100 puntos"
          icon="📐"
          color="primary"
        />
        <KpiCard
          title="Tasa de Aprobación"
          value={`${approvalRate}%`}
          subtitle="estudiantes con score ≥ 60"
          icon="✅"
          color={approvalRate > 60 ? 'success' : 'danger'}
        />
        <KpiCard
          title="Mejora con Prep Course"
          value={`+${prepCourseImpact} pts`}
          subtitle="vs estudiantes sin preparación"
          icon="📚"
          color="success"
        />
        <KpiCard
          title="Total Estudiantes"
          value={totalStudents.toLocaleString()}
          subtitle="en el dataset"
          icon="👥"
          color="primary"
        />
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Fila 1 de Gráficas */}
          <div className={styles.chartsRow}>
            <HorizontalBarChart
              data={educationPerformance}
              xKey="education"
              yKey="average"
              title="Rendimiento por Educación Familiar"
              subtitle="Promedio de math_score agrupado por nivel educativo de los padres"
              color="#4F46E5"
            />
            <GroupedBarChart
              data={scoresBySubject}
              xKey="gender"
              bars={[
                { key: 'math', label: 'Math', color: '#4F46E5' },
                { key: 'reading', label: 'Reading', color: '#10B981' },
                { key: 'writing', label: 'Writing', color: '#F59E0B' },
              ]}
              title="Comparación de Scores por Materia"
              subtitle="Promedio de math, reading y writing por género"
            />
          </div>

          {/* Fila 2 de Gráficas */}
          <div className={styles.chartsRow2}>
            <div className={styles.scatterContainer}>
              <ScatterChartWidget
                data={readingWritingData}
                xKey="reading_score"
                yKey="writing_score"
                categoryKey="test_prep"
                title="Reading vs Writing Score"
                subtitle="Coloreado por completar curso de preparación"
                colors={{ completed: '#4F46E5', none: '#94A3B8' }}
              />
            </div>
            <div className={styles.pieContainer}>
              <PieChartWidget
                data={ethnicityDistribution}
                nameKey="name"
                valueKey="value"
                title="Distribución por Grupo Étnico"
                subtitle="Porcentaje de estudiantes por grupo"
                centerText={`${totalStudents}\nalumnos`}
                colors={['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
