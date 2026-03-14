import { useState, useMemo, useCallback } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import styles from './DataExplorer.module.css'

const TABLE_NAME = 'students'

const COLUMNS = [
  { key: 'id', label: '#', sortable: true },
  { key: 'gender', label: 'Género', sortable: true, type: 'genderBadge' },
  { key: 'ethnicity', label: 'Grupo', sortable: true },
  { key: 'parental_education', label: 'Educ. Parental', sortable: true },
  { key: 'lunch', label: 'Almuerzo', sortable: false, type: 'lunchBadge' },
  { key: 'test_prep', label: 'Curso Prep.', sortable: true, type: 'prepBadge' },
  { key: 'math_score', label: 'Matemáticas', sortable: true, type: 'score' },
  { key: 'reading_score', label: 'Lectura', sortable: true, type: 'score' },
  { key: 'writing_score', label: 'Escritura', sortable: true, type: 'score' },
  { key: 'pass_math', label: 'Resultado', sortable: true, type: 'resultBadge' },
]

const PAGE_SIZES = [10, 25, 50]

const PARENTAL_LEVELS = [
  "some high school",
  "high school",
  "some college",
  "associate's degree",
  "bachelor's degree",
  "master's degree",
]

function exportToCSV(data, columns, filename = 'estudiantes_export.csv') {
  const headers = columns.map((c) => c.label).join(',')
  const rows = data.map((row) =>
    columns.map((c) => {
      const v = row[c.key]
      return typeof v === 'string' && v.includes(',') ? `"${v}"` : v
    }).join(',')
  )
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function ScoreCell({ value }) {
  return (
    <div className={styles.scoreCell}>
      <span className={styles.scoreValue}>{value}</span>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function Badge({ type, value }) {
  if (type === 'genderBadge') {
    const isMale = value === 'male'
    return (
      <span className={`${styles.badge} ${isMale ? styles.badgeMale : styles.badgeFemale}`}>
        {isMale ? 'Male' : 'Female'}
      </span>
    )
  }
  if (type === 'lunchBadge') {
    const isStandard = value === 'standard'
    return (
      <span className={`${styles.badge} ${isStandard ? styles.badgeGreen : styles.badgeGray}`}>
        {isStandard ? 'Estándar' : 'Reducido'}
      </span>
    )
  }
  if (type === 'prepBadge') {
    const completed = value === 'completed'
    return (
      <span className={`${styles.badge} ${completed ? styles.badgeGreen : styles.badgeGray}`}>
        {completed ? 'Completado' : 'Ninguno'}
      </span>
    )
  }
  if (type === 'resultBadge') {
    const passed = value === 1
    return (
      <span className={`${styles.badge} ${passed ? styles.badgePass : styles.badgeFail}`}>
        {passed ? '✅ Aprobó' : '❌ Reprobó'}
      </span>
    )
  }
  return <span>{value ?? '—'}</span>
}

function SkeletonTable({ rows = 10 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <div key={i} className={styles.skeletonRow}>
      {Array.from({ length: 10 }).map((_, j) => (
        <div key={j} className={styles.skeletonCell} />
      ))}
    </div>
  ))
}

export default function DataExplorer() {
  const [filters, setFilters] = useState({
    gender: '',
    parental_education: '',
    test_prep: '',
    pass_math: '',
    math_min: 0,
    math_max: 100,
  })
  const [appliedFilters, setAppliedFilters] = useState({})
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sortKey, setSortKey] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)

  const supabaseFilters = useMemo(() => {
    const f = {}
    if (appliedFilters.gender) f.gender = appliedFilters.gender
    if (appliedFilters.parental_education) f.parental_education = appliedFilters.parental_education
    if (appliedFilters.test_prep) f.test_prep = appliedFilters.test_prep
    if (appliedFilters.pass_math !== '' && appliedFilters.pass_math !== undefined) {
      f.pass_math = Number(appliedFilters.pass_math)
    }
    return f
  }, [appliedFilters])

  const { data: rawData, loading, error, refetch } = useSupabase(TABLE_NAME, supabaseFilters)

  const filteredData = useMemo(() => {
    if (!rawData) return []
    return rawData.filter((row) => {
      const min = appliedFilters.math_min ?? 0
      const max = appliedFilters.math_max ?? 100
      if (row.math_score < min || row.math_score > max) return false
      return true
    })
  }, [rawData, appliedFilters.math_min, appliedFilters.math_max])

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortAsc ? cmp : -cmp
    })
  }, [filteredData, sortKey, sortAsc])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const pageData = sortedData.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = useCallback((key) => {
    const col = COLUMNS.find((c) => c.key === key)
    if (!col?.sortable) return
    setSortKey((prev) => {
      if (prev === key && !sortAsc) {
        setSortAsc(true)
        return null
      }
      if (prev === key) {
        setSortAsc(false)
        return key
      }
      setSortAsc(true)
      return key
    })
  }, [sortAsc])

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters })
    setPage(0)
  }

  const handleClearFilters = () => {
    const cleared = { gender: '', parental_education: '', test_prep: '', pass_math: '', math_min: 0, math_max: 100 }
    setFilters(cleared)
    setAppliedFilters({})
    setPage(0)
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setPage(0)
  }

  const renderPageButtons = () => {
    const buttons = []
    const maxVisible = 5
    let start = Math.max(0, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible)
    if (end - start < maxVisible) start = Math.max(0, end - maxVisible)

    if (start > 0) {
      buttons.push(
        <button key={0} className={`${styles.pageBtn} ${page === 0 ? styles.pageBtnActive : ''}`} onClick={() => setPage(0)}>1</button>
      )
      if (start > 1) buttons.push(<span key="start-ellipsis">...</span>)
    }

    for (let i = start; i < end; i++) {
      buttons.push(
        <button
          key={i}
          className={`${styles.pageBtn} ${page === i ? styles.pageBtnActive : ''}`}
          onClick={() => setPage(i)}
        >
          {i + 1}
        </button>
      )
    }

    if (end < totalPages) {
      if (end < totalPages - 1) buttons.push(<span key="end-ellipsis">...</span>)
      buttons.push(
        <button key={totalPages - 1} className={`${styles.pageBtn} ${page === totalPages - 1 ? styles.pageBtnActive : ''}`} onClick={() => setPage(totalPages - 1)}>{totalPages}</button>
      )
    }

    return buttons
  }

  const renderCellContent = (col, row) => {
    const value = row[col.key]
    if (col.type === 'score') return <ScoreCell value={value} />
    if (col.type) return <Badge type={col.type} value={value} />
    if (col.key === 'id') return `#${String(value).padStart(3, '0')}`
    return value ?? '—'
  }

  if (error) {
    return (
      <div className={styles.explorer}>
        <div className={styles.errorBanner}>
          <p>No se pudo conectar con la base de datos. Verifica tu configuración.</p>
          <button className={styles.retryButton} onClick={refetch}>Reintentar</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.explorer}>
      <header className={styles.header}>
        <h1>Explorador de Datos</h1>
        <p className={styles.subtitle}>Filtra, ordena y exporta el dataset completo</p>
      </header>

      <div className={styles.filterCard}>
        <div className={styles.filterHeader}>
          <span className={styles.filterIcon}>🔍</span>
          Filtros de Búsqueda
        </div>
        <div className={styles.filterGrid}>
          <div className={styles.filterField}>
            <label>Género</label>
            <select
              className={styles.filterSelect}
              value={filters.gender}
              onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className={styles.filterField}>
            <label>Educación Parental</label>
            <select
              className={styles.filterSelect}
              value={filters.parental_education}
              onChange={(e) => setFilters((f) => ({ ...f, parental_education: e.target.value }))}
            >
              <option value="">Todos</option>
              {PARENTAL_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label>Curso de Prep.</label>
            <select
              className={styles.filterSelect}
              value={filters.test_prep}
              onChange={(e) => setFilters((f) => ({ ...f, test_prep: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="completed">Completado</option>
              <option value="none">No completado</option>
            </select>
          </div>

          <div className={styles.filterField}>
            <label>Resultado</label>
            <select
              className={styles.filterSelect}
              value={filters.pass_math}
              onChange={(e) => setFilters((f) => ({ ...f, pass_math: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="1">Aprobó</option>
              <option value="0">Reprobó</option>
            </select>
          </div>

          <div className={styles.filterField}>
            <label>Math Score (Rango)</label>
            <div className={styles.rangeGroup}>
              <input
                type="number"
                className={styles.filterInput}
                value={filters.math_min}
                min={0}
                max={100}
                onChange={(e) => setFilters((f) => ({ ...f, math_min: Number(e.target.value) || 0 }))}
              />
              <span className={styles.rangeSeparator}>–</span>
              <input
                type="number"
                className={styles.filterInput}
                value={filters.math_max}
                min={0}
                max={100}
                onChange={(e) => setFilters((f) => ({ ...f, math_max: Number(e.target.value) || 100 }))}
              />
            </div>
          </div>

          <div className={styles.filterActions}>
            <button className={styles.btnPrimary} onClick={handleApplyFilters}>
              Aplicar Filtros
            </button>
            <button className={styles.btnSecondary} onClick={handleClearFilters}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <p className={styles.resultsSummary}>
        Mostrando <strong>{sortedData.length}</strong> de <strong>1,000</strong> estudiantes
      </p>

      <div className={styles.tableCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.tableTitle}>
            <h3>Resultados</h3>
            <span className={styles.countBadge}>{sortedData.length}</span>
          </div>
          <button
            className={styles.exportBtn}
            onClick={() => exportToCSV(sortedData, COLUMNS)}
            disabled={loading || !sortedData.length}
          >
            ⬇ Exportar CSV
          </button>
        </div>

        {loading ? (
          <SkeletonTable />
        ) : sortedData.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Ningún estudiante coincide con los filtros aplicados.</p>
            <button className={styles.btnSecondary} onClick={handleClearFilters}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className={col.sortable ? styles.sortable : ''}
                        onClick={() => col.sortable && handleSort(col.key)}
                      >
                        {col.label}
                        {sortKey === col.key && (
                          <span className={styles.sortArrow}>{sortAsc ? ' ↑' : ' ↓'}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((row) => (
                    <tr key={row.id}>
                      {COLUMNS.map((col) => (
                        <td key={col.key}>{renderCellContent(col, row)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <div className={styles.paginationLeft}>
                <span>Filas por página:</span>
                <select
                  className={styles.pageSizeSelect}
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className={styles.paginationCenter}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  ←
                </button>
                {renderPageButtons()}
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  →
                </button>
              </div>

              <div className={styles.paginationRight}>
                Página {page + 1} de {totalPages}
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.infoBar}>
        <span>ℹ️ Dataset: Students Performance in Exams — Kaggle</span>
      </div>
    </div>
  )
}
