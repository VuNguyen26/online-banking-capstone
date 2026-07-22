import {
  formatMusdcAmount,
  isValidMusdcAmount,
  parseMusdcAmount,
} from './units'

describe('mUSDC amount utilities', () => {
  it('parses whole and fractional mUSDC using 6 decimals', () => {
    expect(parseMusdcAmount('1')).toBe(1_000_000n)
    expect(parseMusdcAmount('100.25')).toBe(100_250_000n)
    expect(parseMusdcAmount('0.000001')).toBe(1n)
    expect(parseMusdcAmount('1.234567')).toBe(1_234_567n)
  })

  it('rejects invalid or over-precision values', () => {
    const invalidValues = [
      '',
      ' ',
      '-1',
      '+1',
      '.5',
      '1.',
      '01',
      '1.2345678',
      '1,000',
      'abc',
    ]

    for (const value of invalidValues) {
      expect(isValidMusdcAmount(value)).toBe(false)
      expect(() => parseMusdcAmount(value)).toThrow()
    }
  })

  it('formats smallest units without unnecessary zeroes', () => {
    expect(formatMusdcAmount(0n)).toBe('0')
    expect(formatMusdcAmount(1n)).toBe('0.000001')
    expect(formatMusdcAmount(1_000_000n)).toBe('1')
    expect(formatMusdcAmount(100_250_000n)).toBe('100.25')
  })
})
