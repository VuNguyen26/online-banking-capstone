import { getDepositTiming } from './time'

const maturityAt = 1_000_000n
const gracePeriod = 172_800n
const graceEndsAt = maturityAt + gracePeriod

describe('deposit lifecycle timing', () => {
  it('allows only early withdrawal before maturity', () => {
    expect(
      getDepositTiming(
        maturityAt,
        maturityAt - 1n,
        gracePeriod,
      ),
    ).toEqual({
      graceEndsAt,
      canEarlyWithdraw: true,
      canWithdrawAtMaturity: false,
      canManualRenew: false,
      canAutoRenew: false,
    })
  })

  it('supports maturity withdrawal and manual renewal at exact maturity', () => {
    expect(
      getDepositTiming(
        maturityAt,
        maturityAt,
        gracePeriod,
      ),
    ).toEqual({
      graceEndsAt,
      canEarlyWithdraw: false,
      canWithdrawAtMaturity: true,
      canManualRenew: true,
      canAutoRenew: false,
    })
  })

  it('keeps manual renewal open immediately before grace end', () => {
    const timing = getDepositTiming(
      maturityAt,
      graceEndsAt - 1n,
      gracePeriod,
    )

    expect(timing.canManualRenew).toBe(true)
    expect(timing.canAutoRenew).toBe(false)
    expect(timing.canWithdrawAtMaturity).toBe(true)
  })

  it('closes manual renewal and enables auto renewal at exact grace end', () => {
    expect(
      getDepositTiming(
        maturityAt,
        graceEndsAt,
        gracePeriod,
      ),
    ).toEqual({
      graceEndsAt,
      canEarlyWithdraw: false,
      canWithdrawAtMaturity: true,
      canManualRenew: false,
      canAutoRenew: true,
    })
  })
})
