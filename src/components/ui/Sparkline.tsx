export type SparklinePoint = {
  label: string
  value: number
}

const WIDTH = 400
const HEIGHT = 140
const PADDING_X = 8
const PADDING_Y = 16

/**
 * Tendance en mini-graphique (contrat "stat tile" : ligne en teinte neutre,
 * dernier point en accent) — pas d'axe ni d'infobulle, la valeur courante est
 * déjà portée par le chiffre héros affiché au-dessus.
 */
export default function Sparkline({ points }: { points: SparklinePoint[] }) {
  if (points.length < 2) return null

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = (WIDTH - PADDING_X * 2) / (points.length - 1)

  function coords(i: number, value: number): [number, number] {
    const x = PADDING_X + i * stepX
    const y = PADDING_Y + (1 - (value - min) / span) * (HEIGHT - PADDING_Y * 2)
    return [x, y]
  }

  const pathD = points
    .map((p, i) => {
      const [x, y] = coords(i, p.value)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const [lastX, lastY] = coords(points.length - 1, points[points.length - 1].value)
  const afficherToutesLesEtiquettes = points.length <= 6

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[140px] w-full" preserveAspectRatio="none" role="img" aria-label="Évolution du patrimoine">
        <path
          d={pathD}
          fill="none"
          stroke="#a1a1aa"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 5px rgba(161,161,170,0.4))' }}
        />
        <circle cx={lastX} cy={lastY} r={5} fill="#818cf8" stroke="#09090b" strokeWidth={2} />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-zinc-500">
        {points.map((p, i) => {
          const visible = afficherToutesLesEtiquettes || i === 0 || i === points.length - 1
          return (
            <span key={p.label} className={i === points.length - 1 ? 'text-zinc-300' : ''}>
              {visible ? p.label : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}
