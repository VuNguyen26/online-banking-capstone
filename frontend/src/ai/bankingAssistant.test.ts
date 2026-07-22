import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BankingAssistantContext,
} from './context'
import {
  bankingAssistantClient,
} from './bankingAssistant'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

function createContext():
  BankingAssistantContext {
  return {
    network: 'Ethereum Sepolia',
    testToken: 'mUSDC',
    account: ACCOUNT,
    protocol: {
      planCount: '1',
      depositCount: '2',
      savingCorePaused: false,
      vaultManagerPaused: false,
      gracePeriodDays: '2',
      latestBlockTimestampUtc:
        '15 May 2024, 12:00 UTC',
    },
    plans: [
      {
        planId: '1',
        tenorDays: '180',
        apr: '2%',
        minimumDeposit:
          '100 mUSDC',
        maximumDeposit:
          '10000 mUSDC',
        earlyWithdrawalPenalty:
          '7.5%',
        enabled: true,
      },
    ],
    deposits: [
      {
        depositId: '1',
        planId: '1',
        principal: '1000 mUSDC',
        tenorDays: '180',
        aprAtOpen: '2%',
        earlyWithdrawalPenaltyRate:
          '7.5%',
        estimatedInterest:
          '9.863013 mUSDC',
        estimatedEarlyWithdrawalPenalty:
          '75 mUSDC',
        estimatedNetPrincipalAfterPenalty:
          '925 mUSDC',
        status: 'active',
        startedAtUtc:
          '16 Nov 2023, 12:00 UTC',
        maturityAtUtc:
          '14 May 2024, 12:00 UTC',
        graceEndsAtUtc:
          '16 May 2024, 12:00 UTC',
        availableActions: {
          canEarlyWithdraw: false,
          canWithdrawAtMaturity: true,
          canManualRenew: true,
          canAutoRenew: false,
        },
      },
    ],
    pendingInterestClaims: [
      {
        depositId: '2',
        amount: '5 mUSDC',
        claimant: ACCOUNT,
      },
    ],
    vault: {
      vaultBalance: '10 mUSDC',
      totalReservedInterest:
        '20 mUSDC',
      availableLiquidity:
        '0 mUSDC',
      fundingShortfall:
        '10 mUSDC',
      isUnderfunded: true,
    },
    tokenAccount: {
      balance: '2000 mUSDC',
      savingCoreAllowance:
        '500 mUSDC',
    },
  }
}

describe('bankingAssistantClient', () => {
  it('explains a Vietnamese saving plan from deterministic context', async () => {
    const response =
      await bankingAssistantClient.ask({
        question:
          'Giải thích gói 1.',
        language: 'vi',
        context: createContext(),
      })

    expect(response.mode).toBe(
      'banking',
    )
    expect(response.sections).toHaveLength(
      4,
    )
    expect(
      response.sections[0].text,
    ).toContain('2%')
    expect(
      response.sections[0].text,
    ).toContain('180')
    expect(
      response.sections[2].text,
    ).toContain('không phải')
    expect(
      response.sections[2].text,
    ).toContain('Gói đang bật')
    expect(
      response.sections[2].text,
    ).not.toContain('Gói đang tắt')
  })

  it('explains maturity and available actions in English', async () => {
    const response =
      await bankingAssistantClient.ask({
        question:
          'When does deposit #1 mature?',
        language: 'en',
        context: createContext(),
      })

    expect(
      response.sections[0].text,
    ).toContain(
      '14 May 2024, 12:00 UTC',
    )
    expect(
      response.sections[0].text,
    ).toContain(
      'manual renewal: available',
    )
    expect(
      response.sections[2].text,
    ).toContain('Sepolia')
  })

  it('explains deferred interest and the fixed claimant', async () => {
    const response =
      await bankingAssistantClient.ask({
        question:
          'Giải thích lãi hoãn của deposit 2.',
        language: 'vi',
        context: createContext(),
      })

    expect(
      response.sections[0].text,
    ).toContain('5 mUSDC')
    expect(
      response.sections[0].text,
    ).toContain(ACCOUNT)
    expect(
      response.sections[1].text,
    ).toContain('NFT')
  })

  it('returns a safe overview for an unmatched question', async () => {
    const response =
      await bankingAssistantClient.ask({
        question:
          'SafeBank hoạt động thế nào?',
        language: 'vi',
        context: createContext(),
      })

    expect(
      response.sections[0].text,
    ).toContain('1 gói')
    expect(
      response.sections[1].text,
    ).toContain(
      'không ký và không gửi giao dịch',
    )
    expect(
      response.sections[2].text,
    ).toContain('testnet')
  })

  it('explains that a disabled plan cannot accept new deposits', async () => {
    const context = createContext()

    context.plans[0].enabled = false

    const response =
      await bankingAssistantClient.ask({
        question:
          'Explain plan 1.',
        language: 'en',
        context,
      })

    expect(
      response.sections[0].text,
    ).toContain('disabled')
    expect(
      response.sections[2].text,
    ).toContain(
      'A disabled plan cannot accept new deposits',
    )
  })

  it('explains an underfunded vault using the positive-shortfall branch', async () => {
    const response =
      await bankingAssistantClient.ask({
        question:
          'Is the vault underfunded?',
        language: 'en',
        context: createContext(),
      })

    expect(
      response.sections[0].text,
    ).toContain('10 mUSDC')
    expect(
      response.sections[1].text,
    ).toContain(
      'shortfall above zero',
    )
    expect(
      response.sections[2].text,
    ).toContain(
      'current accounting snapshot',
    )
  })

  it('explains a zero-shortfall vault using the funded branch', async () => {
    const context = createContext()

    context.vault = {
      vaultBalance: '20 mUSDC',
      totalReservedInterest:
        '20 mUSDC',
      availableLiquidity:
        '0 mUSDC',
      fundingShortfall:
        '0 mUSDC',
      isUnderfunded: false,
    }

    const response =
      await bankingAssistantClient.ask({
        question:
          'Vault có đang thiếu vốn không?',
        language: 'vi',
        context,
      })

    expect(
      response.sections[0].text,
    ).toContain(
      'không theo snapshot hiện tại',
    )
    expect(
      response.sections[1].text,
    ).toContain(
      'Funding shortfall đang bằng 0',
    )
    expect(
      response.sections[2].text,
    ).toContain(
      'snapshot kế toán hiện tại',
    )
  })
  it('rejects invalid input even when called without the UI', async () => {
    await expect(
      bankingAssistantClient.ask({
        question:
          'Phân tích https://example.com',
        language: 'vi',
        context: createContext(),
      }),
    ).rejects.toThrow(
      'Assistant question is invalid',
    )
  })

  it('supports request cancellation', async () => {
    const controller =
      new AbortController()

    controller.abort()

    await expect(
      bankingAssistantClient.ask(
        {
          question:
            'Giải thích APR.',
          language: 'vi',
          context: createContext(),
        },
        controller.signal,
      ),
    ).rejects.toMatchObject({
      name: 'AbortError',
    })
  })
})