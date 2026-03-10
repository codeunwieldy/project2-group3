interface Props {
  direction: 'up' | 'down' | 'flat'
  pct: number | null
}

export default function TrendArrow({ direction, pct }: Props) {
  if (direction === 'flat' || pct === null) {
    return <span className="text-gray-400 font-mono text-xs">—</span>
  }

  const isUp = direction === 'up'
  const arrow = isUp ? '▲' : '▼'
  const color = isUp ? 'text-emerald-600' : 'text-red-500'
  const sign = isUp ? '+' : ''

  return (
    <span className={`${color} text-xs font-semibold`}>
      {arrow} {sign}{pct.toFixed(1)}%
    </span>
  )
}
