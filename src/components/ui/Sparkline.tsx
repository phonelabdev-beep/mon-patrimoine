export type SparklinePoint = {
  label: string
  value: number
}

const WIDTH = 400
const HEIGHT = 150
const PADDING_X = 6
const PADDING_TOP = 14
const PADDING_BOTTOM = 22

/**
 * Tendance en mini-graphique (contrat "stat tile" : ligne en teinte neutre,
 * dernier point en accent, aire à ~10% d'opacité) — pas d'axe ni d'infobulle,
 * la valeur courante est déjà portée par le chiffre héros affiché au-dessus.
 */
export default function Sparkline({ points }: { points: SparklinePoint[] }) {
  if (points.length < 2) return null

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = (WIDTH - PADDING_X * 2) / (points.length - 1)
  const baseline = HEIGHT - PADDING_BOTTOM

  function coords(i: number, value: number): [number, number] {
    const x = PADDING_X + i * stepX
    const y = PADDING_TOP + (1 - (value - min) / span) * (baseline - PADDING_TOP)
    return [x, y]
  }

  const pathD = points
    .map((p, i) => {
      const [x, y] = coords(i, p.value)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const [firstX] = coords(0, points[0].value)
  const [lastX, lastY] = coords(points.length - 1, points[points.length - 1].value)
  const aireD = `${pathD} L${lastX.toFixed(1)},${baseline} L${firstX.toFixed(1)},${baseline} Z`
  const afficherToutesLesEtiquettes = points.length <= 6

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[150px] w-full" preserveAspectRatio="none" role="img" aria-label="Évolution du patrimoine">
        <defs>
          <linearGradient id="sparkline-aire" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a1a1aa" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#a1a1aa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PADDING_X} y1={baseline} x2={WIDTH - PADDING_X} y2={baseline} stroke="#27272a" strokeWidth={1} />
        <path d={aireD} fill="url(#sparkline-aire)" stroke="none" />
        <path
          d={pathD}
          fill="none"
          stroke="#a1a1aa"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 5px rgba(161,161,170,0.4))' }}
        />
        <circle cx={lastX} cy={lastY} r={5} fill="#818cf8" stroke="#18181b" strokeWidth={2} />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-zinc-500">
        {points.map((p, i) => {
          const visible = afficherToutesLesEtiquettes || i === 0 || i === points.length - 1
          return (
            <span key={p.label} className={i === points.length - 1 ? 'font-medium text-zinc-300' : ''}>
              {visible ? p.label : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}
