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
  BankingAssistantContext,
} from '../ai/context'
import type {
  AssistantAnswer,
  AssistantClient,
} from '../ai/models'
import type {
  SafeBankDashboardData,
} from '../contracts/dashboard'
import {
  LanguageProvider,
} from '../i18n/LanguageProvider'
import {
  BankingAssistantPanel,
} from './BankingAssistantPanel'

function createData():
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
    ownedDeposits: [],
    pendingInterestClaims: [],
    protocolStatus: {
      planCount: 1n,
      depositCount: 0n,
      savingCorePaused: false,
      vaultManagerPaused: false,
      totalReservedInterest: 0n,
      gracePeriodSeconds:
        172_800n,
      bpsDenominator: 10_000n,
      latestBlockTimestamp:
        1_700_000_000n,
    },
    vaultMetrics: {
      vaultBalance: 0n,
      totalReservedInterest: 0n,
      availableLiquidity: 0n,
      fundingShortfall: 0n,
    },
    tokenAccountState: null,
  }
}

function createAnswer(
  language: 'vi' | 'en',
): AssistantAnswer {
  return {
    mode: 'banking',
    language,
    sections: [
      {
        kind: 'fact',
        text:
          language === 'vi'
            ? 'Dữ liệu đã xác minh.'
            : 'Verified data.',
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
  client: AssistantClient<BankingAssistantContext>,
) {
  render(
    <LanguageProvider>
      <BankingAssistantPanel
        data={createData()}
        account={null}
        client={client}
      />
    </LanguageProvider>,
  )
}

describe('BankingAssistantPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('uses Vietnamese by default and submits a structured snapshot', async () => {
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
        name: 'Trợ lý Ngân hàng AI',
      }),
    ).toBeInTheDocument()

    await user.type(
      screen.getByRole('textbox', {
        name: 'Câu hỏi của bạn',
      }),
      'Giải thích APR',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Hỏi trợ lý',
      }),
    )

    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'Giải thích APR',
        language: 'vi',
        context:
          expect.objectContaining({
            network:
              'Ethereum Sepolia',
            plans: [
              expect.objectContaining({
                planId: '1',
                apr: '2%',
              }),
            ],
          }),
      }),
      expect.any(AbortSignal),
    )

    expect(
      await screen.findByText(
        'Dữ liệu đã xác minh.',
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
        name: 'AI Banking Assistant',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('textbox', {
        name: 'Your question',
      }),
    ).toBeInTheDocument()
  })
})