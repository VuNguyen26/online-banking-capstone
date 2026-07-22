export function formatBasisPoints(
  basisPoints: bigint,
): string {
  const whole = basisPoints / 100n
  const fraction = basisPoints % 100n

  if (fraction === 0n) {
    return `${whole}%`
  }

  const fractionText = fraction
    .toString()
    .padStart(2, '0')
    .replace(/0+$/, '')

  return `${whole}.${fractionText}%`
}

export function parsePercentageToBasisPoints(
  value: string,
): bigint {
  const normalized = value.trim()

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      normalized,
    )
  ) {
    throw new Error(
      'Percentage must be a non-negative number with at most two decimal places.',
    )
  }

  const [whole, fraction = ''] =
    normalized.split('.')

  return (
    BigInt(whole) * 100n +
    BigInt(fraction.padEnd(2, '0'))
  )
}