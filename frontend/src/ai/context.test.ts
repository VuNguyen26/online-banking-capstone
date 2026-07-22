import {
  ZeroAddress,
} from 'ethers'
import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'
import type {
  SafeBankDashboardData,
} from '../contracts/dashboard'
import {
  SAFE_BANK_DEPLOYMENT,
} from '../contracts/generated/contracts'
import {
  buildBankingAssistantContext,
  buildRiskAssistantContext,
} from './context'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

function createBankingData():
  SafeBankDashboardData {
  return {
    plans: [
      {
        planId: 1n,
        tenorDays: 180n,
        aprBps: 200n,
        minDeposit: 100_000_000n,
        maxDeposit:
          10_000_000_000n,
        earlyWithdrawPenaltyBps:
          750n,
        enabled: true,
      },
    ],
    ownedDeposits: [
      {
        depositId: 1n,
        planId: 1n,
        principal:
          1_000_000_000n,
        startedAt:
          1_700_000_000n,
        maturityAt:
          1_715_552_000n,
        tenorDays: 180n,
        aprBpsAtOpen: 200n,
        penaltyBpsAtOpen: 750n,
        status: 0n,
      },
    ],
    pendingInterestClaims: [
      {
        depositId: 2n,
        amount: 5_000_000n,
        claimant: ACCOUNT,
      },
    ],
    protocolStatus: {
      planCount: 1n,
      depositCount: 2n,
      savingCorePaused: false,
      vaultManagerPaused: false,
      totalReservedInterest:
        20_000_000n,
      gracePeriodSeconds:
        172_800n,
      bpsDenominator: 10_000n,
      latestBlockTimestamp:
        1_715_552_001n,
    },
    vaultMetrics: {
      vaultBalance:
        100_000_000n,
      totalReservedInterest:
        20_000_000n,
      availableLiquidity:
        80_000_000n,
      fundingShortfall: 0n,
    },
    tokenAccountState: {
      balance:
        2_000_000_000n,
      allowance:
        500_000_000n,
    },
  }
}

function createAdminData():
  AdminDashboardData {
  const {
    MockUSDC,
    VaultManager,
    SavingCore,
  } = SAFE_BANK_DEPLOYMENT.contracts

  return {
    configuration: {
      savingCoreOwner: ACCOUNT,
      savingCorePendingOwner:
        ZeroAddress,
      vaultManagerOwner: ACCOUNT,
      vaultManagerPendingOwner:
        ZeroAddress,
      feeReceiver: ACCOUNT,
      savingCoreToken:
        MockUSDC.address,
      savingCoreVaultManager:
        VaultManager.address,
      vaultManagerToken:
        MockUSDC.address,
      vaultManagerSavingCore:
        SavingCore.address,
      savingCorePaused: false,
      vaultManagerPaused: true,
    },
    authorization: {
      isSavingCoreOwner: true,
      isVaultManagerOwner: true,
      isSavingCorePendingOwner:
        false,
      isVaultManagerPendingOwner:
        false,
    },
    plans:
      createBankingData().plans,
    depositCount: 2n,
    vaultMetrics: {
      vaultBalance:
        10_000_000n,
      totalReservedInterest:
        20_000_000n,
      availableLiquidity: 0n,
      fundingShortfall:
        10_000_000n,
    },
    tokenAccountState: null,
  }
}

describe('AI context builders', () => {
  it('builds a serializable banking snapshot with deterministic calculations', () => {
    const context =
      buildBankingAssistantContext(
        createBankingData(),
        ACCOUNT,
      )

    expect(context.network).toBe(
      'Ethereum Sepolia',
    )
    expect(context.plans[0]).toMatchObject({
      apr: '2%',
      tenorDays: '180',
      earlyWithdrawalPenalty:
        '7.5%',
    })
    expect(
      context.deposits[0],
    ).toMatchObject({
      principal: '1000 mUSDC',
      estimatedInterest:
        '9.863013 mUSDC',
      estimatedEarlyWithdrawalPenalty:
        '75 mUSDC',
      estimatedNetPrincipalAfterPenalty:
        '925 mUSDC',
      status: 'active',
      availableActions: {
        canEarlyWithdraw: false,
        canWithdrawAtMaturity: true,
        canManualRenew: true,
        canAutoRenew: false,
      },
    })
    expect(
      context.protocol
        .latestBlockTimestampUtc,
    ).toMatch(/ UTC$/u)
    expect(() =>
      JSON.stringify(context),
    ).not.toThrow()
  })

  it('builds a serializable risk snapshot without signer or contract objects', () => {
    const context =
      buildRiskAssistantContext(
        createAdminData(),
      )

    expect(
      context.configuration
        .savingCorePendingOwner,
    ).toBeNull()
    expect(
      context.relationships
        .allRelationshipsValid,
    ).toBe(true)
    expect(context.vault).toEqual({
      vaultBalance: '10 mUSDC',
      totalReservedInterest:
        '20 mUSDC',
      availableLiquidity:
        '0 mUSDC',
      fundingShortfall:
        '10 mUSDC',
      isUnderfunded: true,
    })
    expect(
      context.configuration
        .vaultManagerPaused,
    ).toBe(true)
    expect(() =>
      JSON.stringify(context),
    ).not.toThrow()
  })
})