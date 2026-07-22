import {
  decodeDepositRecord,
  decodeSavingPlan,
} from './decode'

describe('contract tuple decoders', () => {
  it('decodes a SavingCore plan tuple', () => {
    expect(
      decodeSavingPlan(
        1n,
        [
          180n,
          200n,
          100_000_000n,
          10_000_000_000n,
          750n,
          true,
        ],
      ),
    ).toEqual({
      planId: 1n,
      tenorDays: 180n,
      aprBps: 200n,
      minDeposit: 100_000_000n,
      maxDeposit: 10_000_000_000n,
      earlyWithdrawPenaltyBps: 750n,
      enabled: true,
    })
  })

  it('decodes a named deposit result', () => {
    expect(
      decodeDepositRecord(
        7n,
        {
          planId: 1n,
          principal: 500_000_000n,
          startedAt: 1_000n,
          maturityAt: 2_000n,
          tenorDays: 180n,
          aprBpsAtOpen: 200n,
          penaltyBpsAtOpen: 750n,
          status: 0n,
        },
      ),
    ).toEqual({
      depositId: 7n,
      planId: 1n,
      principal: 500_000_000n,
      startedAt: 1_000n,
      maturityAt: 2_000n,
      tenorDays: 180n,
      aprBpsAtOpen: 200n,
      penaltyBpsAtOpen: 750n,
      status: 0n,
    })
  })

  it('accepts decimal integer strings without using floating point', () => {
    const plan = decodeSavingPlan(
      1n,
      [
        '180',
        '200',
        '100000000',
        '10000000000',
        '750',
        true,
      ],
    )

    expect(plan.minDeposit).toBe(
      100_000_000n,
    )

    expect(plan.maxDeposit).toBe(
      10_000_000_000n,
    )
  })

  it('rejects malformed or missing tuple fields', () => {
    expect(() =>
      decodeSavingPlan(
        1n,
        [
          180n,
          200n,
        ],
      ),
    ).toThrow('Missing tuple field')

    expect(() =>
      decodeDepositRecord(
        1n,
        {
          planId: -1n,
          principal: 1n,
          startedAt: 1n,
          maturityAt: 2n,
          tenorDays: 180n,
          aprBpsAtOpen: 200n,
          penaltyBpsAtOpen: 750n,
          status: 0n,
        },
      ),
    ).toThrow(
      'planId must be an unsigned integer',
    )
  })
})
