/**
 * Predictor - ML prediction page for student performance.
 * Purpose: Form to predict if a student will pass math based on their profile.
 * Data source: ML API at https://eduinsights-base-repo.onrender.com/predict
 */
import { useState, useEffect, useRef } from 'react'
import { useMLPredict } from '../hooks/useMLPredict'
import styles from './Predictor.module.css'

const MAX_HISTORY = 5

// Opciones para los dropdowns
const ETHNICITY_OPTIONS = [
  { value: '', label: 'Seleccionar grupo' },
  { value: 'group A', label: 'Group A' },
  { value: 'group B', label: 'Group B' },
  { value: 'group C', label: 'Group C' },
  { value: 'group D', label: 'Group D' },
  { value: 'group E', label: 'Group E' },
]

const PARENTAL_EDUCATION_OPTIONS = [
  { value: '', label: 'Seleccionar nivel' },
  { value: "some high school", label: "Some High School" },
  { value: "high school", label: "High School" },
  { value: "some college", label: "Some College" },
  { value: "associate's degree", label: "Associate's Degree" },
  { value: "bachelor's degree", label: "Bachelor's Degree" },
  { value: "master's degree", label: "Master's Degree" },
]

export default function Predictor() {
  const { predict, result, loading, error, reset } = useMLPredict()
  const [history, setHistory] = useState([])
  const [formData, setFormData] = useState({
    gender: 'male',
    ethnicity: '',
    parental_education: '',
    lunch: 'standard',
    test_prep: 'completed',
    reading_score: 75,
    writing_score: 68,
  })
  const lastInputRef = useRef(null)

  const handlePredict = async () => {
    // Validar campos requeridos
    if (!formData.ethnicity || !formData.parental_education) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    const inputData = {
      gender: formData.gender,
      ethnicity: formData.ethnicity,
      parental_education: formData.parental_education,
      lunch: formData.lunch,
      test_prep: formData.test_prep === 'completed' ? 'completed' : 'none',
      reading_score: formData.reading_score,
      writing_score: formData.writing_score,
    }

    lastInputRef.current = inputData
    await predict(inputData)
  }

  const handleReset = () => {
    setFormData({
      gender: 'male',
      ethnicity: '',
      parental_education: '',
      lunch: 'standard',
      test_prep: 'completed',
      reading_score: 75,
      writing_score: 68,
    })
    reset()
  }

  // Agregar al historial cuando hay un resultado exitoso
  useEffect(() => {
    if (!result || loading) return
    const input = lastInputRef.current
    if (input == null) return

    const historyItem = {
      id: Date.now(),
      timestamp: new Date(),
      input,
      prediction: result.prediction,
      label: result.label,
      confidence: result.confidence || (result.probabilities?.pass || 0),
    }

    setHistory((prev) => [historyItem, ...prev].slice(0, MAX_HISTORY))
    lastInputRef.current = null
  }, [result, loading])

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    if (isToday) {
      return `Hoy, ${formatTime(date)}`
    }
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.predictor}>
      <header className={styles.header}>
        <h1>Predictor de Rendimiento</h1>
        <p className={styles.subtitle}>
          Ingresa los datos del estudiante para predecir si aprobará matemáticas con base en su perfil académico.
        </p>
      </header>

      <div className={styles.layout}>
        {/* Panel Izquierdo - Formulario */}
        <div className={styles.formPanel}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🎓</span>
              <h2 className={styles.cardTitle}>Datos del Estudiante</h2>
            </div>

            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handlePredict(); }}>
              {/* Género - Pill Buttons */}
              <div className={styles.field}>
                <label className={styles.label}>Género</label>
                <div className={styles.pillGroup}>
                  <button
                    type="button"
                    className={`${styles.pillButton} ${formData.gender === 'male' ? styles.pillActive : ''}`}
                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                  >
                    Masculino
                  </button>
                  <button
                    type="button"
                    className={`${styles.pillButton} ${formData.gender === 'female' ? styles.pillActive : ''}`}
                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                  >
                    Femenino
                  </button>
                </div>
              </div>

              {/* Grupo Étnico - Dropdown */}
              <div className={styles.field}>
                <label className={styles.label}>Grupo Étnico / Raza</label>
                <select
                  className={styles.select}
                  value={formData.ethnicity}
                  onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                  required
                >
                  {ETHNICITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Educación Parental - Dropdown */}
              <div className={styles.field}>
                <label className={styles.label}>Nivel Educativo de Padres</label>
                <select
                  className={styles.select}
                  value={formData.parental_education}
                  onChange={(e) => setFormData({ ...formData, parental_education: e.target.value })}
                  required
                >
                  {PARENTAL_EDUCATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Almuerzo - Pill Buttons */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Tipo de Almuerzo
                  <span className={styles.tooltipIcon} title="Indicador de nivel socioeconómico">ℹ️</span>
                </label>
                <div className={styles.pillGroup}>
                  <button
                    type="button"
                    className={`${styles.pillButton} ${formData.lunch === 'standard' ? styles.pillActive : ''}`}
                    onClick={() => setFormData({ ...formData, lunch: 'standard' })}
                  >
                    Estándar
                  </button>
                  <button
                    type="button"
                    className={`${styles.pillButton} ${formData.lunch === 'free/reduced' ? styles.pillActive : ''}`}
                    onClick={() => setFormData({ ...formData, lunch: 'free/reduced' })}
                  >
                    Reducido/Libre
                  </button>
                </div>
              </div>

              {/* Curso de Preparación - Toggle */}
              <div className={styles.field}>
                <label className={styles.label}>Curso de Preparación</label>
                <div className={styles.toggleContainer}>
                  <span className={styles.toggleLabel}>
                    {formData.test_prep === 'completed' ? 'Completado' : 'No completado'}
                  </span>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={formData.test_prep === 'completed'}
                      onChange={(e) =>
                        setFormData({ ...formData, test_prep: e.target.checked ? 'completed' : 'none' })
                      }
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              {/* Reading Score - Slider */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Puntuación de Lectura
                  <span className={styles.scoreValue}>{formData.reading_score}</span>
                </label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.reading_score}
                    onChange={(e) => setFormData({ ...formData, reading_score: parseInt(e.target.value) })}
                    className={styles.slider}
                  />
                  <div className={styles.sliderLabels}>
                    <span>0</span>
                    <span>100</span>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.reading_score}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                    setFormData({ ...formData, reading_score: val })
                  }}
                  className={styles.numberInput}
                />
              </div>

              {/* Writing Score - Slider */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Puntuación de Escritura
                  <span className={styles.scoreValue}>{formData.writing_score}</span>
                </label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.writing_score}
                    onChange={(e) => setFormData({ ...formData, writing_score: parseInt(e.target.value) })}
                    className={styles.slider}
                  />
                  <div className={styles.sliderLabels}>
                    <span>0</span>
                    <span>100</span>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.writing_score}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                    setFormData({ ...formData, writing_score: val })
                  }}
                  className={styles.numberInput}
                />
              </div>

              {/* Botones de Acción */}
              <div className={styles.actions}>
                <button type="submit" disabled={loading} className={styles.predictButton}>
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Analizando...
                    </>
                  ) : (
                    <>
                      <span>📊</span>
                      Predecir Resultado
                    </>
                  )}
                </button>
                <button type="button" onClick={handleReset} className={styles.clearButton}>
                  Limpiar
                </button>
              </div>
            </form>
          </div>

          {/* Sección Informativa */}
          <div className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <span className={styles.infoIcon}>💡</span>
              <h3 className={styles.infoTitle}>¿Cómo funciona este modelo?</h3>
            </div>
            <p className={styles.infoText}>
              Este predictor utiliza un algoritmo de Bosques Aleatorios (Random Forest) entrenado con más de 1,000
              registros históricos. Analiza la correlación entre el entorno socioeconómico y el desempeño académico previo
              para generar una probabilidad estadística con un margen de error del 4.2%.
            </p>
            <button className={styles.docsButton}>Ver Documentación</button>
          </div>
        </div>

        {/* Panel Derecho - Resultado e Historial */}
        <div className={styles.resultPanel}>
          {/* Panel de Resultado */}
          <div className={styles.resultCard}>
            {!result && !loading && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📊</div>
                <p className={styles.emptyText}>
                  Completa el formulario y presiona Predecir para ver el resultado
                </p>
              </div>
            )}

            {loading && (
              <div className={styles.loadingState}>
                <div className={styles.spinnerLarge}></div>
                <p className={styles.loadingText}>Consultando el modelo...</p>
              </div>
            )}

            {result && !loading && (
              <>
                {result.prediction === 1 || result.label === 'Aprueba' ? (
                  <div className={styles.resultSuccess}>
                    <div className={styles.resultIconSuccess}>✅</div>
                    <div className={styles.resultBadgeSuccess}>Predicción: Aprueba</div>
                    <p className={styles.resultDescription}>
                      Basado en los datos proporcionados, el estudiante tiene una alta probabilidad de aprobar el examen
                      de matemáticas.
                    </p>
                    <div className={styles.confidenceBar}>
                      <div className={styles.confidenceHeader}>
                        <span className={styles.confidenceLabel}>Confianza del modelo</span>
                        <span className={styles.confidenceValue}>
                          {((result.confidence || result.probabilities?.pass || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFillSuccess}
                          style={{
                            width: `${((result.confidence || result.probabilities?.pass || 0) * 100).toFixed(0)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.resultDanger}>
                    <div className={styles.resultIconDanger}>⚠️</div>
                    <div className={styles.resultBadgeDanger}>Predicción: EN RIESGO</div>
                    <p className={styles.resultDescription}>
                      El modelo predice que este estudiante podría reprobar matemáticas.
                    </p>
                    <div className={styles.confidenceBar}>
                      <div className={styles.confidenceHeader}>
                        <span className={styles.confidenceLabel}>Confianza del modelo</span>
                        <span className={styles.confidenceValue}>
                          {((result.confidence || result.probabilities?.fail || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFillDanger}
                          style={{
                            width: `${((result.confidence || result.probabilities?.fail || 0) * 100).toFixed(0)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className={styles.errorState}>
                <p className={styles.errorText}>{error.message || 'Error al realizar la predicción'}</p>
                <button onClick={handlePredict} className={styles.retryButton}>
                  Intentar de nuevo
                </button>
              </div>
            )}
          </div>

          {/* Historial de Predicciones */}
          <div className={styles.historyCard}>
            <div className={styles.historyHeader}>
              <h3 className={styles.historyTitle}>Historial Reciente</h3>
              {history.length > 0 && <span className={styles.historyLink}>Ver todo</span>}
            </div>
            {history.length === 0 ? (
              <p className={styles.historyEmpty}>Las predicciones de esta sesión aparecerán aquí</p>
            ) : (
              <div className={styles.historyList}>
                {history.map((item) => (
                  <div key={item.id} className={styles.historyItem}>
                    <div className={styles.historyIcon}>👤</div>
                    <div className={styles.historyContent}>
                      <div className={styles.historyMeta}>
                        <span className={styles.historyId}>Estudiante #{item.id.toString().slice(-4)}</span>
                        <span className={styles.historyTime}>{formatDate(item.timestamp)}</span>
                      </div>
                      <div className={styles.historyResult}>
                        <span
                          className={`${styles.historyBadge} ${
                            item.prediction === 1 || item.label === 'Aprueba'
                              ? styles.historyBadgeSuccess
                              : styles.historyBadgeDanger
                          }`}
                        >
                          {item.prediction === 1 || item.label === 'Aprueba' ? 'Aprueba' : 'Reprueba'}
                        </span>
                        <span className={styles.historyConfidence}>
                          Confianza: {((item.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
