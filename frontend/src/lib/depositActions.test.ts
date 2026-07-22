import type {
  DepositRecord,
  PendingInterestState,
} from '../contracts/models'
import {
  getDepositActionAvailability,
  canClaimPendingInterest,
} from './depositActions'
import {
  DEPOSIT_STATUS,
} from './deposits'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const OTHER_ACCOUNT =
  '0x1111111111111111111111111111111111111111'

const MATURITY_AT =
  1_000_000n

const GRACE_PERIOD =
  172_800n

const ACTIVE_DEPOSIT:
  DepositRecord = {
    depositId: 7n,
    planId: 1n,
    principal: 500_000_000n,
    startedAt: 500_000n,
    maturityAt: MATURITY_AT,
    tenorDays: 180n,
    aprBpsAtOpen: 200n,
    penaltyBpsAtOpen: 750n,
    status:
      DEPOSIT_STATUS.Active,
  }

function createClaim(
  overrides:
    Partial<PendingInterestState> = {},
): PendingInterestState {
  return {
    depositId: 7n,
    amount: 4_000_000n,
    claimant: ACCOUNT,
    ...overrides,
  }
}

describe('deposit action availability', () => {
  it('allows only early withdrawal before maturity', () => {
    expect(
      getDepositActionAvailability(
        ACTIVE_DEPOSIT,
        MATURITY_AT - 1n,
        GRACE_PERIOD,
        false,
      ),
    ).toEqual({
      timing: {
        graceEndsAt:
          MATURITY_AT +
          GRACE_PERIOD,
        canEarlyWithdraw: true,
        canWithdrawAtMaturity: false,
        canManualRenew: false,
        canAutoRenew: false,
      },
      isActive: true,
      canEarlyWithdraw: true,
      canWithdrawAtMaturity: false,
      canManualRenew: false,
      canAutoRenew: false,
    })
  })

  it('allows maturity withdrawal and manual renewal at exact maturity', () => {
    const availability =
      getDepositActionAvailability(
        ACTIVE_DEPOSIT,
        MATURITY_AT,
        GRACE_PERIOD,
        false,
      )

    expect(
      availability.canEarlyWithdraw,
    ).toBe(false)

    expect(
      availability.canWithdrawAtMaturity,
    ).toBe(true)

    expect(
      availability.canManualRenew,
    ).toBe(true)

    expect(
      availability.canAutoRenew,
    ).toBe(false)
  })

  it('enables auto-renew and keeps maturity withdrawal available at exact grace end', () => {
    const availability =
      getDepositActionAvailability(
        ACTIVE_DEPOSIT,
        MATURITY_AT +
          GRACE_PERIOD,
        GRACE_PERIOD,
        false,
      )

    expect(
      availability.canWithdrawAtMaturity,
    ).toBe(true)

    expect(
      availability.canManualRenew,
    ).toBe(false)

    expect(
      availability.canAutoRenew,
    ).toBe(true)
  })

  it('disables every lifecycle action for a settled deposit', () => {
    const availability =
      getDepositActionAvailability(
        {
          ...ACTIVE_DEPOSIT,
          status:
            DEPOSIT_STATUS.Withdrawn,
        },
        MATURITY_AT +
          GRACE_PERIOD,
        GRACE_PERIOD,
        false,
      )

    expect(
      availability.isActive,
    ).toBe(false)

    expect(
      availability.canEarlyWithdraw,
    ).toBe(false)

    expect(
      availability.canWithdrawAtMaturity,
    ).toBe(false)

    expect(
      availability.canManualRenew,
    ).toBe(false)

    expect(
      availability.canAutoRenew,
    ).toBe(false)
  })

  it('disables every lifecycle action while SavingCore is paused', () => {
    const availability =
      getDepositActionAvailability(
        ACTIVE_DEPOSIT,
        MATURITY_AT,
        GRACE_PERIOD,
        true,
      )

    expect(
      availability.isActive,
    ).toBe(true)

    expect(
      availability.canEarlyWithdraw,
    ).toBe(false)

    expect(
      availability.canWithdrawAtMaturity,
    ).toBe(false)

    expect(
      availability.canManualRenew,
    ).toBe(false)

    expect(
      availability.canAutoRenew,
    ).toBe(false)
  })

  it('allows C1 claims only for the current positive claimant while unpaused', () => {
    expect(
      canClaimPendingInterest(
        createClaim(),
        ACCOUNT.toLowerCase(),
        false,
      ),
    ).toBe(true)

    expect(
      canClaimPendingInterest(
        createClaim({
          claimant:
            OTHER_ACCOUNT,
        }),
        ACCOUNT,
        false,
      ),
    ).toBe(false)

    expect(
      canClaimPendingInterest(
        createClaim({
          amount: 0n,
        }),
        ACCOUNT,
        false,
      ),
    ).toBe(false)

    expect(
      canClaimPendingInterest(
        createClaim(),
        ACCOUNT,
        true,
      ),
    ).toBe(false)
  })
})
