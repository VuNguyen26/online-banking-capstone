import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  formatBasisPoints,
  parsePercentageToBasisPoints,
} from './basisPoints'

describe('basis-point formatting', () => {
  it('formats whole and fractional percentages', () => {
    expect(formatBasisPoints(200n)).toBe('2%')
    expect(formatBasisPoints(750n)).toBe('7.5%')
    expect(formatBasisPoints(725n)).toBe('7.25%')
    expect(formatBasisPoints(1n)).toBe('0.01%')
  })

  it('parses percentage strings without floating point', () => {
    expect(
      parsePercentageToBasisPoints('2'),
    ).toBe(200n)

    expect(
      parsePercentageToBasisPoints('7.5'),
    ).toBe(750n)

    expect(
      parsePercentageToBasisPoints('7.25'),
    ).toBe(725n)

    expect(
      parsePercentageToBasisPoints(' 0.01 '),
    ).toBe(1n)
  })

  it('rejects malformed or over-precise values', () => {
    for (const value of [
      '',
      '-1',
      '1.234',
      'abc',
      '1.',
      '.5',
    ]) {
      expect(() =>
        parsePercentageToBasisPoints(value),
      ).toThrow()
    }
  })
})