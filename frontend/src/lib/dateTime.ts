const MILLISECONDS_PER_SECOND =
  1_000n

const MAX_SAFE_DATE_SECONDS =
  BigInt(Number.MAX_SAFE_INTEGER) /
  MILLISECONDS_PER_SECOND

const utcFormatter =
  new Intl.DateTimeFormat(
    'en-GB',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    },
  )

export function unixSecondsToDate(
  timestampSeconds: bigint,
): Date {
  if (
    timestampSeconds < 0n ||
    timestampSeconds >
      MAX_SAFE_DATE_SECONDS
  ) {
    throw new Error(
      'Unix timestamp must fit within the JavaScript safe integer range.',
    )
  }

  return new Date(
    Number(
      timestampSeconds *
        MILLISECONDS_PER_SECOND,
    ),
  )
}

export function formatUnixTimestampUtc(
  timestampSeconds: bigint,
): string {
  return `${utcFormatter.format(
    unixSecondsToDate(
      timestampSeconds,
    ),
  )} UTC`
}
