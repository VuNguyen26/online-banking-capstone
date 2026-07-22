import {
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {
  JsonRpcSigner,
} from 'ethers'
import { vi } from 'vitest'

import type {
  DepositRecord,
  SavingPlan,
} from '../contracts/models'
import type {
  DepositActionAvailability,
} from '../lib/depositActions'
import {
  DEPOSIT_STATUS,
} from '../lib/deposits'
import type {
  SafeBankDataContextValue,
} from '../providers/safebank-data-context'
import type {
  WalletContextValue,
} from '../providers/wallet-context'
import {
  DepositLifecycleActions,
  type CreateDepositLifecycleContracts,
} from './DepositLifecycleActions'

const ACCOUNT =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const TRANSACTION_HASH =
  `0x${'e'.repeat(64)}`

const DEPOSIT:
  DepositRecord = {
    depositId: 7n,
    planId: 1n,
    principal: 500_000_000n,
    startedAt: 1_000n,
    maturityAt: 2_000n,
    tenorDays: 180n,
    aprBpsAtOpen: 200n,
    penaltyBpsAtOpen: 750n,
    status:
      DEPOSIT_STATUS.Active,
  }

const PLANS: SavingPlan[] = [
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
  {
    planId: 2n,
    tenorDays: 365n,
    aprBps: 350n,
    minDeposit: 100_000_000n,
    maxDeposit:
      10_000_000_000n,
    earlyWithdrawPenaltyBps:
      500n,
    enabled: true,
  },
]

function createWallet(
  overrides:
    Partial<WalletContextValue> = {},
): WalletContextValue {
  return {
    status: 'connected',
    walletAvailable: true,
    account: ACCOUNT,
    chainId: 11_155_111n,
    isConnected: true,
    isSepolia: true,
    isConnecting: false,
    isSwitchingNetwork: false,
    error: null,
    connectWallet: vi.fn(
      async () => undefined,
    ),
    switchToSepolia: vi.fn(
      async () => undefined,
    ),
    getSigner: vi.fn(
      async () =>
        ({} as JsonRpcSigner),
    ),
    clearError: vi.fn(),
    ...overrides,
  }
}

function createSafeBank():
  SafeBankDataContextValue {
  return {
    status: 'ready',
    error: null,
    refresh: vi.fn(
      async () => undefined,
    ),
    data: null,
  }
}

function createAvailability(
  overrides:
    Partial<DepositActionAvailability> = {},
): DepositActionAvailability {
  return {
    timing: {
      graceEndsAt: 174_800n,
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
    ...overrides,
  }
}

function createTransaction() {
  return {
    hash: TRANSACTION_HASH,
    wait: vi.fn(
      async () => ({
        status: 1,
      }),
    ),
  }
}

describe('DepositLifecycleActions', () => {
  it('executes early withdrawal and refreshes after confirmation', async () => {
    const user = userEvent.setup()
    const safeBank =
      createSafeBank()

    const earlyWithdraw = vi.fn(
      async () =>
        createTransaction(),
    )

    const createWriteContracts:
      CreateDepositLifecycleContracts =
      vi.fn(() => ({
        savingCore: {
          earlyWithdraw,
        },
      }))

    render(
      <DepositLifecycleActions
        wallet={createWallet()}
        safeBank={safeBank}
        deposit={DEPOSIT}
        availability={
          createAvailability()
        }
        enabledPlans={PLANS}
        createWriteContracts={
          createWriteContracts
        }
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name:
          'Rút trước hạn khoản gửi 7',
      }),
    )

    const earlyWithdrawalDialog =
      screen.getByRole('dialog', {
        name: 'Xác nhận rút trước hạn',
      })

    expect(
      earlyWithdrawalDialog,
    ).toHaveTextContent('#7')
    expect(
      earlyWithdrawalDialog,
    ).toHaveTextContent('500 mUSDC')
    expect(
      earlyWithdrawalDialog,
    ).toHaveTextContent('7.5%')
    expect(
      earlyWithdrawalDialog,
    ).toHaveTextContent('37.5 mUSDC')
    expect(
      earlyWithdrawalDialog,
    ).toHaveTextContent('462.5 mUSDC')

    expect(
      earlyWithdraw,
    ).not.toHaveBeenCalled()

    expect(
      safeBank.refresh,
    ).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'Tiếp tục đến ví',
      }),
    )

    await waitFor(() => {
      expect(
        screen.getByText(
          'Giao dịch vòng đời đã được xác nhận.',
        ),
      ).toBeInTheDocument()
    })

    expect(
      earlyWithdraw,
    ).toHaveBeenCalledWith(7n)

    expect(
      safeBank.refresh,
    ).toHaveBeenCalledTimes(1)
  })

  it('executes maturity withdrawal with the exact deposit ID', async () => {
    const user = userEvent.setup()
    const safeBank =
      createSafeBank()

    const withdrawAtMaturity =
      vi.fn(
        async () =>
          createTransaction(),
      )

    render(
      <DepositLifecycleActions
        wallet={createWallet()}
        safeBank={safeBank}
        deposit={DEPOSIT}
        availability={
          createAvailability({
            timing: {
              graceEndsAt:
                174_800n,
              canEarlyWithdraw:
                false,
              canWithdrawAtMaturity:
                true,
              canManualRenew: true,
              canAutoRenew: false,
            },
            canEarlyWithdraw:
              false,
            canWithdrawAtMaturity:
              true,
            canManualRenew: true,
          })
        }
        enabledPlans={PLANS}
        createWriteContracts={() => ({
          savingCore: {
            withdrawAtMaturity,
          },
        })}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name:
          'Rút khoản gửi khi đáo hạn 7',
      }),
    )

    const maturityWithdrawalDialog =
      screen.getByRole('dialog', {
        name: 'Xác nhận rút khi đáo hạn',
      })

    expect(
      maturityWithdrawalDialog,
    ).toHaveTextContent('#7')
    expect(
      maturityWithdrawalDialog,
    ).toHaveTextContent('500 mUSDC')
    expect(
      maturityWithdrawalDialog,
    ).toHaveTextContent('2%')

    expect(
      withdrawAtMaturity,
    ).not.toHaveBeenCalled()
    expect(
      safeBank.refresh,
    ).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'Tiếp tục đến ví',
      }),
    )

    await waitFor(() => {
      expect(
        withdrawAtMaturity,
      ).toHaveBeenCalledWith(7n)
    })

    expect(
      safeBank.refresh,
    ).toHaveBeenCalledTimes(1)
  })

  it('manually renews into the selected enabled plan', async () => {
    const user = userEvent.setup()
    const safeBank =
      createSafeBank()

    const manualRenew = vi.fn(
      async () =>
        createTransaction(),
    )

    render(
      <DepositLifecycleActions
        wallet={createWallet()}
        safeBank={safeBank}
        deposit={DEPOSIT}
        availability={
          createAvailability({
            timing: {
              graceEndsAt:
                174_800n,
              canEarlyWithdraw:
                false,
              canWithdrawAtMaturity:
                true,
              canManualRenew: true,
              canAutoRenew: false,
            },
            canEarlyWithdraw:
              false,
            canWithdrawAtMaturity:
              true,
            canManualRenew: true,
          })
        }
        enabledPlans={PLANS}
        createWriteContracts={() => ({
          savingCore: {
            manualRenew,
          },
        })}
      />,
    )

    await user.selectOptions(
      screen.getByLabelText(
        'Gói tái tục',
      ),
      '2',
    )

    await user.click(
      screen.getByRole('button', {
        name:
          'Tái tục thủ công khoản gửi 7',
      }),
    )

    const manualRenewalDialog =
      screen.getByRole('dialog', {
        name: 'Xác nhận tái tục thủ công',
      })

    expect(
      manualRenewalDialog,
    ).toHaveTextContent('#7')
    expect(
      manualRenewalDialog,
    ).toHaveTextContent('500 mUSDC')
    expect(
      manualRenewalDialog,
    ).toHaveTextContent('#2')
    expect(
      manualRenewalDialog,
    ).toHaveTextContent('365 ngày')
    expect(
      manualRenewalDialog,
    ).toHaveTextContent('3.5%')
    expect(
      manualRenewalDialog,
    ).toHaveTextContent('5%')

    expect(manualRenew).not.toHaveBeenCalled()
    expect(
      safeBank.refresh,
    ).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'Tiếp tục đến ví',
      }),
    )

    await waitFor(() => {
      expect(
        manualRenew,
      ).toHaveBeenCalledWith(
        7n,
        2n,
      )
    })

    expect(
      safeBank.refresh,
    ).toHaveBeenCalledTimes(1)
  })

  it('executes permissionless auto-renew after grace', async () => {
    const user = userEvent.setup()
    const safeBank =
      createSafeBank()

    const autoRenew = vi.fn(
      async () =>
        createTransaction(),
    )

    render(
      <DepositLifecycleActions
        wallet={createWallet()}
        safeBank={safeBank}
        deposit={DEPOSIT}
        availability={
          createAvailability({
            timing: {
              graceEndsAt:
                174_800n,
              canEarlyWithdraw:
                false,
              canWithdrawAtMaturity:
                true,
              canManualRenew: false,
              canAutoRenew: true,
            },
            canEarlyWithdraw:
              false,
            canWithdrawAtMaturity:
              true,
            canManualRenew: false,
            canAutoRenew: true,
          })
        }
        enabledPlans={PLANS}
        createWriteContracts={() => ({
          savingCore: {
            autoRenew,
          },
        })}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name:
          'Tái tục tự động khoản gửi 7',
      }),
    )

    const autoRenewalDialog =
      screen.getByRole('dialog', {
        name: 'Xác nhận tái tục tự động',
      })

    expect(
      autoRenewalDialog,
    ).toHaveTextContent('#7')
    expect(
      autoRenewalDialog,
    ).toHaveTextContent('500 mUSDC')
    expect(
      autoRenewalDialog,
    ).toHaveTextContent('#1')
    expect(
      autoRenewalDialog,
    ).toHaveTextContent('2%')

    expect(autoRenew).not.toHaveBeenCalled()
    expect(
      safeBank.refresh,
    ).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'Tiếp tục đến ví',
      }),
    )

    await waitFor(() => {
      expect(
        autoRenew,
      ).toHaveBeenCalledWith(7n)
    })

    expect(
      safeBank.refresh,
    ).toHaveBeenCalledTimes(1)
  })

  it('disables every visible lifecycle action on the wrong network', () => {
    render(
      <DepositLifecycleActions
        wallet={createWallet({
          chainId: 31_337n,
          isSepolia: false,
        })}
        safeBank={createSafeBank()}
        deposit={DEPOSIT}
        availability={
          createAvailability({
            timing: {
              graceEndsAt:
                174_800n,
              canEarlyWithdraw:
                false,
              canWithdrawAtMaturity:
                true,
              canManualRenew: true,
              canAutoRenew: false,
            },
            canEarlyWithdraw:
              false,
            canWithdrawAtMaturity:
              true,
            canManualRenew: true,
          })
        }
        enabledPlans={PLANS}
      />,
    )

    for (
      const button of
        screen.getAllByRole('button')
    ) {
      expect(button).toBeDisabled()
    }

    expect(
      screen.getByLabelText(
        'Gói tái tục',
      ),
    ).toBeDisabled()

    expect(
      screen.getByText(
        /Chuyển ví sang Ethereum Sepolia trước khi gửi giao dịch/,
      ),
    ).toBeInTheDocument()
  })

  it('renders no controls when no lifecycle action is eligible', () => {
    const { container } = render(
      <DepositLifecycleActions
        wallet={createWallet()}
        safeBank={createSafeBank()}
        deposit={DEPOSIT}
        availability={
          createAvailability({
            timing: {
              graceEndsAt:
                174_800n,
              canEarlyWithdraw:
                false,
              canWithdrawAtMaturity:
                false,
              canManualRenew: false,
              canAutoRenew: false,
            },
            isActive: false,
            canEarlyWithdraw:
              false,
            canWithdrawAtMaturity:
              false,
            canManualRenew: false,
            canAutoRenew: false,
          })
        }
        enabledPlans={PLANS}
      />,
    )

    expect(
      container,
    ).toBeEmptyDOMElement()
  })

  it('does not offer manual renewal when no enabled plan exists', () => {
    render(
      <DepositLifecycleActions
        wallet={createWallet()}
        safeBank={createSafeBank()}
        deposit={DEPOSIT}
        availability={
          createAvailability({
            timing: {
              graceEndsAt:
                174_800n,
              canEarlyWithdraw:
                false,
              canWithdrawAtMaturity:
                true,
              canManualRenew: true,
              canAutoRenew: false,
            },
            canEarlyWithdraw:
              false,
            canWithdrawAtMaturity:
              true,
            canManualRenew: true,
          })
        }
        enabledPlans={[]}
      />,
    )

    expect(
      screen.getByText(
        /Không có gói tiết kiệm đang hoạt động/,
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name:
          'Tái tục thủ công khoản gửi 7',
      }),
    ).toBeDisabled()
  })

  it('uses one pending controller for competing maturity actions', async () => {
    const user = userEvent.setup()

    let resolveReceipt!: (
      value: {
        status: number
      },
    ) => void

    const receiptPromise =
      new Promise<{
        status: number
      }>((resolve) => {
        resolveReceipt = resolve
      })

    const manualRenew = vi.fn(
      async () => ({
        hash: TRANSACTION_HASH,
        wait: () =>
          receiptPromise,
      }),
    )

    const withdrawAtMaturity =
      vi.fn(
        async () =>
          createTransaction(),
      )

    render(
      <DepositLifecycleActions
        wallet={createWallet()}
        safeBank={createSafeBank()}
        deposit={DEPOSIT}
        availability={
          createAvailability({
            timing: {
              graceEndsAt:
                174_800n,
              canEarlyWithdraw:
                false,
              canWithdrawAtMaturity:
                true,
              canManualRenew: true,
              canAutoRenew: false,
            },
            canEarlyWithdraw:
              false,
            canWithdrawAtMaturity:
              true,
            canManualRenew: true,
          })
        }
        enabledPlans={PLANS}
        createWriteContracts={() => ({
          savingCore: {
            manualRenew,
            withdrawAtMaturity,
          },
        })}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name:
          'Tái tục thủ công khoản gửi 7',
      }),
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Tiếp tục đến ví',
      }),
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name:
            'Rút khoản gửi khi đáo hạn 7',
        }),
      ).toBeDisabled()
    })

    expect(
      withdrawAtMaturity,
    ).not.toHaveBeenCalled()

    resolveReceipt({
      status: 1,
    })

    await waitFor(() => {
      expect(
        screen.getByText(
          'Giao dịch vòng đời đã được xác nhận.',
        ),
      ).toBeInTheDocument()
    })
  })
})
