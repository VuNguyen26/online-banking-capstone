import {
  calculateEarlyWithdrawalPenalty,
  calculateSimpleInterest,
} from './finance'

describe('SafeBank financial calculations', () => {
  it('matches the Solidity floor-rounded canonical interest', () => {
    expect(
      calculateSimpleInterest(
        100_000_000n,
        200n,
        180n,
      ),
    ).toBe(986_301n)
  })

  it('calculates the snapshotted early penalty', () => {
    expect(
      calculateEarlyWithdrawalPenalty(
        100_000_000n,
        750n,
      ),
    ).toBe(7_500_000n)
  })

  it('uses integer floor rounding', () => {
    expect(
      calculateSimpleInterest(1n, 200n, 180n),
    ).toBe(0n)

    expect(
      calculateEarlyWithdrawalPenalty(1n, 750n),
    ).toBe(0n)
  })

  it('rejects negative inputs', () => {
    expect(() =>
      calculateSimpleInterest(-1n, 200n, 180n),
    ).toThrow()

    expect(() =>
      calculateEarlyWithdrawalPenalty(1n, -1n),
    ).toThrow()
  })
})
