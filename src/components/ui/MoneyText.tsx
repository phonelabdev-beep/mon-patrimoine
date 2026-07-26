import { formatEUR } from '@/lib/money'

type MoneyTextProps = {
  cents: number
  className?: string
}

export default function MoneyText({ cents, className }: MoneyTextProps) {
  return <span className={className}>{formatEUR(cents)}</span>
}
