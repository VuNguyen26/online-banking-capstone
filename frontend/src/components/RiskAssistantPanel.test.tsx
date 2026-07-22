import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type {
  RiskAssistantContext,
} from '../ai/context'
import type {
  AssistantAnswer,
  AssistantClient,
} from '../ai/models'
import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'
import {
  SAFE_BANK_DEPLOYMENT,
} from '../contracts/generated/contracts'
import {
  LanguageProvider,
} from '../i18n/LanguageProvider'
import {
  RiskAssistantPanel,
} from './RiskAssistantPanel'

const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000'

const OWNER =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

function createData():
  AdminDashboardData {
  const {
    MockUSDC,
    VaultManager,
    SavingCore,
  } = SAFE_BANK_DEPLOYMENT.contracts

  return {
    configuration: {
      savingCoreOwner: OWNER,
      savingCorePendingOwner:
        ZERO_ADDRESS,
      vaultManagerOwner: OWNER,
      vaultManagerPendingOwner:
        ZERO_ADDRESS,
      feeReceiver: OWNER,
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
    depositCount: 3n,
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

function createAnswer(
  language: 'vi' | 'en',
): AssistantAnswer {
  return {
    mode: 'risk',
    language,
    sections: [
      {
        kind: 'fact',
        text:
          language === 'vi'
            ? 'Phát hiện thiếu hụt 10 mUSDC.'
            : 'Detected a 10 mUSDC shortfall.',
      },
      {
        kind: 'explanation',
        text: 'Explanation.',
      },
      {
        kind: 'caution',
        text: 'Caution.',
      },
      {
        kind: 'next-step',
        text: 'Next step.',
      },
    ],
  }
}

function renderPanel(
  client: AssistantClient<RiskAssistantContext>,
) {
  render(
    <LanguageProvider>
      <RiskAssistantPanel
        data={createData()}
        client={client}
      />
    </LanguageProvider>,
  )
}

describe('RiskAssistantPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('uses Vietnamese by default and submits a risk snapshot', async () => {
    const user = userEvent.setup()

    const ask = vi.fn(
      async (request) =>
        createAnswer(
          request.language,
        ),
    )

    renderPanel({ ask })

    expect(
      screen.getByRole('heading', {
        name: 'Trợ lý Rủi ro AI',
      }),
    ).toBeInTheDocument()

    await user.type(
      screen.getByRole('textbox', {
        name: 'Câu hỏi của bạn',
      }),
      'Vault có thiếu vốn không?',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Hỏi trợ lý',
      }),
    )

    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({
        question:
          'Vault có thiếu vốn không?',
        language: 'vi',
        context:
          expect.objectContaining({
            network:
              'Ethereum Sepolia',
            depositCount: '3',
            vault:
              expect.objectContaining({
                fundingShortfall:
                  '10 mUSDC',
                isUnderfunded: true,
              }),
            relationships:
              expect.objectContaining({
                allRelationshipsValid:
                  true,
              }),
          }),
      }),
      expect.any(AbortSignal),
    )

    expect(
      await screen.findByText(
        'Phát hiện thiếu hụt 10 mUSDC.',
      ),
    ).toBeInTheDocument()
  })

  it('follows the saved English language preference', () => {
    localStorage.setItem(
      'safebank.language',
      'en',
    )

    renderPanel({
      ask: vi.fn(
        async (request) =>
          createAnswer(
            request.language,
          ),
      ),
    })

    expect(
      screen.getByRole('heading', {
        name: 'AI Risk Assistant',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByPlaceholderText(
        'Example: Is the vault underfunded or do all contract relationships match?',
      ),
    ).toBeInTheDocument()
  })
})