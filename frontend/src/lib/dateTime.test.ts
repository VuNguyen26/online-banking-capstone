import {
  formatUnixTimestampUtc,
  unixSecondsToDate,
} from './dateTime'

describe('UTC blockchain timestamp formatting', () => {
  it('converts Unix seconds without using local time', () => {
    expect(
      unixSecondsToDate(
        1_700_000_000n,
      ).toISOString(),
    ).toBe(
      '2023-11-14T22:13:20.000Z',
    )
  })

  it('formats timestamps explicitly as UTC', () => {
    expect(
      formatUnixTimestampUtc(
        1_700_000_000n,
      ),
    ).toContain('UTC')
  })

  it('rejects negative or unsafe timestamps', () => {
    expect(() =>
      unixSecondsToDate(-1n),
    ).toThrow(
      'Unix timestamp must fit',
    )

    expect(() =>
      unixSecondsToDate(
        BigInt(
          Number.MAX_SAFE_INTEGER,
        ),
      ),
    ).toThrow(
      'Unix timestamp must fit',
    )
  })
})
