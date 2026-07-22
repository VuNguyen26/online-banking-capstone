import {
  validateOpenDeposit,
} from './openDeposit'

const PLAN = {
  planId: 1n,
  tenorDays: 180n,
  aprBps: 200n,
  minDeposit: 100_000_000n,
  maxDeposit: 10_000_000_000n,
  earlyWithdrawPenaltyBps: 750n,
  enabled: true,
}

describe('open-deposit validation', () => {
  it('parses six-decimal mUSDC and calculates interest with bigint', () => {
    expect(
      validateOpenDeposit({
        amountInput: '500.123456',
        plan: PLAN,
        tokenAccountState: {
          balance: 1_000_000_000n,
          allowance: 1_000_000_000n,
        },
      }),
    ).toEqual({
      amount: 500_123_456n,
      estimatedInterest:
        4_932_724n,
      needsApproval: false,
      error: null,
    })
  })

  it('rejects invalid precision and amounts below the minimum', () => {
    expect(
      validateOpenDeposit({
        amountInput: '100.0000001',
        plan: PLAN,
        tokenAccountState: null,
      }).error,
    ).toBe('invalid-amount')

    expect(
      validateOpenDeposit({
        amountInput: '99',
        plan: PLAN,
        tokenAccountState: null,
      }).error,
    ).toBe('below-minimum')
  })

  it('rejects amounts above the maximum or wallet balance', () => {
    expect(
      validateOpenDeposit({
        amountInput: '10001',
        plan: PLAN,
        tokenAccountState: null,
      }).error,
    ).toBe('above-maximum')

    expect(
      validateOpenDeposit({
        amountInput: '500',
        plan: PLAN,
        tokenAccountState: {
          balance: 400_000_000n,
          allowance: 1_000_000_000n,
        },
      }).error,
    ).toBe('insufficient-balance')
  })

  it('requires approval only when allowance is insufficient', () => {
    expect(
      validateOpenDeposit({
        amountInput: '500',
        plan: PLAN,
        tokenAccountState: {
          balance: 1_000_000_000n,
          allowance: 499_999_999n,
        },
      }).needsApproval,
    ).toBe(true)

    expect(
      validateOpenDeposit({
        amountInput: '500',
        plan: PLAN,
        tokenAccountState: {
          balance: 1_000_000_000n,
          allowance: 500_000_000n,
        },
      }).needsApproval,
    ).toBe(false)
  })

  it('rejects missing and disabled plans', () => {
    expect(
      validateOpenDeposit({
        amountInput: '500',
        plan: null,
        tokenAccountState: null,
      }).error,
    ).toBe('plan-required')

    expect(
      validateOpenDeposit({
        amountInput: '500',
        plan: {
          ...PLAN,
          enabled: false,
        },
        tokenAccountState: null,
      }).error,
    ).toBe('plan-disabled')
  })
})
