import { formatUnits, parseUnits } from 'ethers'

export const MOCK_USDC_DECIMALS = 6

const MUSDC_AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/

export function isValidMusdcAmount(value: string): boolean {
  const normalizedValue = value.trim()

  return (
    normalizedValue.length > 0 &&
    MUSDC_AMOUNT_PATTERN.test(normalizedValue)
  )
}

export function parseMusdcAmount(value: string): bigint {
  const normalizedValue = value.trim()

  if (!isValidMusdcAmount(normalizedValue)) {
    throw new Error(
      'Enter a non-negative mUSDC amount with no more than 6 decimal places.',
    )
  }

  return parseUnits(normalizedValue, MOCK_USDC_DECIMALS)
}

export function formatMusdcAmount(value: bigint): string {
  const formatted = formatUnits(value, MOCK_USDC_DECIMALS)
  const [wholePart, fractionPart] = formatted.split('.')

  if (!fractionPart) {
    return wholePart
  }

  const trimmedFraction = fractionPart.replace(/0+$/, '')

  return trimmedFraction.length > 0
    ? `${wholePart}.${trimmedFraction}`
    : wholePart
}
