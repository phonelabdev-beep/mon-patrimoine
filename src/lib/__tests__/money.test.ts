import { describe, it, expect } from 'vitest'
import { parseEURInputToCents } from '../money'

describe('parseEURInputToCents', () => {
  it('convertit une saisie simple en centimes', () => {
    expect(parseEURInputToCents('80')).toBe(8000)
  })

  it('accepte la virgule et le point comme séparateur décimal', () => {
    expect(parseEURInputToCents('12,34')).toBe(1234)
    expect(parseEURInputToCents('12.34')).toBe(1234)
  })

  it('rejette les montants négatifs (aucun champ de l\'app ne doit en accepter)', () => {
    expect(parseEURInputToCents('-80')).toBeNull()
    expect(parseEURInputToCents('-12,34')).toBeNull()
  })

  it('rejette une saisie vide ou non numérique', () => {
    expect(parseEURInputToCents('')).toBeNull()
    expect(parseEURInputToCents('abc')).toBeNull()
  })
})
