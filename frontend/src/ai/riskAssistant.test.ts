import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  RiskAssistantContext,
} from './context'
import {
  riskAssistantClient,
} from './riskAssistant'

const OWNER =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

function createContext():
  RiskAssistantContext {
  return {
    network: 'Ethereum Sepolia',
    testToken: 'mUSDC',
    depositCount: '3',
    configuration: {
      savingCoreOwner: OWNER,
      savingCorePendingOwner: null,
      vaultManagerOwner: OWNER,
      vaultManagerPendingOwner: null,
      feeReceiver: OWNER,
      savingCorePaused: false,
      vaultManagerPaused: true,
    },
    authorization: {
      isSavingCoreOwner: true,
      isVaultManagerOwner: true,
      isSavingCorePendingOwner: false,
      isVaultManagerPendingOwner: false,
    },
    relationships: {
      savingCoreTokenMatches: true,
      savingCoreVaultManagerMatches: true,
      vaultManagerTokenMatches: true,
      vaultManagerSavingCoreMatches: true,
      allRelationshipsValid: true,
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
    connectedWalletFundingSource:
      null,
  }
}

describe('riskAssistantClient', () => {
  it('explains an underfunded vault without claiming solvency', async () => {
    const response =
      await riskAssistantClient.ask({
        question:
          'Vault đang thiếu thanh khoản như thế nào?',
        language: 'vi',
        context: createContext(),
      })

    expect(response.mode).toBe('risk')
    expect(response.sections).toHaveLength(
      4,
    )
    expect(
      response.sections[0].text,
    ).toContain('10 mUSDC')
    expect(
      response.sections[1].text,
    ).toContain(
      'chưa bao phủ toàn bộ',
    )
    expect(
      response.sections[2].text,
    ).toContain(
      'không phải bảo đảm',
    )
  })

  it('reports contract relationship mismatches in English', async () => {
    const context = createContext()

    context.relationships
      .vaultManagerSavingCoreMatches =
      false

    context.relationships
      .allRelationshipsValid = false

    const response =
      await riskAssistantClient.ask({
        question:
          'Check contract relationships.',
        language: 'en',
        context,
      })

    expect(
      response.sections[0].text,
    ).toContain(
      'VaultManager → SavingCore',
    )
    expect(
      response.sections[0].text,
    ).toContain('1 relationship')
    expect(
      response.sections[2].text,
    ).toContain(
      'do not prove',
    )
  })

  it('explains owners and connected-wallet authorization', async () => {
    const response =
      await riskAssistantClient.ask({
        question:
          'Ví này có quyền owner nào?',
        language: 'vi',
        context: createContext(),
      })

    expect(
      response.sections[0].text,
    ).toContain(OWNER)
    expect(
      response.sections[0].text,
    ).toContain(
      'SavingCore owner: có',
    )
    expect(
      response.sections[1].text,
    ).toContain(
      'không thể nhận quyền',
    )
    expect(
      response.sections[2].text,
    ).toContain('private key')
  })

  it('explains plan risk parameters from the snapshot', async () => {
    const response =
      await riskAssistantClient.ask({
        question:
          'Phân tích plan 1 và APR.',
        language: 'vi',
        context: createContext(),
      })

    expect(
      response.sections[0].text,
    ).toContain('2%')
    expect(
      response.sections[0].text,
    ).toContain('7.5%')
    expect(
      response.sections[2].text,
    ).toContain(
      'không phải tư vấn tài chính',
    )
  })

  it('returns a read-only overview for an unmatched question', async () => {
    const response =
      await riskAssistantClient.ask({
        question:
          'Tổng quan rủi ro hiện tại.',
        language: 'vi',
        context: createContext(),
      })

    expect(
      response.sections[0].text,
    ).toContain('3 khoản gửi')
    expect(
      response.sections[1].text,
    ).toContain(
      'không thực hiện pause',
    )
    expect(
      response.sections[2].text,
    ).toContain(
      'không phải kiểm toán',
    )
  })

  it('rejects invalid input and supports cancellation', async () => {
    await expect(
      riskAssistantClient.ask({
        question:
          'Đọc https://example.com',
        language: 'vi',
        context: createContext(),
      }),
    ).rejects.toThrow(
      'Assistant question is invalid',
    )

    const controller =
      new AbortController()

    controller.abort()

    await expect(
      riskAssistantClient.ask(
        {
          question:
            'Kiểm tra vault.',
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