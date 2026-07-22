import {
  act,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { vi } from 'vitest'

import { useWallet } from '../hooks/useWallet'
import type {
  BrowserEthereumProvider,
  EthereumEventListener,
  EthereumRequestArguments,
} from '../types/ethereum'
import { WalletProvider } from './WalletProvider'

const ACCOUNT_ONE =
  '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9'

const ACCOUNT_TWO =
  '0xcf779EC5D80573D3254054a17c5B4f0117491662'

class MockEthereumProvider {
  isMetaMask = true
  authorizedAccounts: string[]
  requestedAccounts: string[]
  chainId: string

  private readonly listeners = new Map<
    string,
    Set<EthereumEventListener>
  >()

  request = vi.fn(
    async ({
      method,
      params,
    }: EthereumRequestArguments) => {
      switch (method) {
        case 'eth_accounts':
          return this.authorizedAccounts
        case 'eth_requestAccounts':
          this.authorizedAccounts = [
            ...this.requestedAccounts,
          ]

          return this.authorizedAccounts
        case 'eth_chainId':
          return this.chainId
        case 'wallet_switchEthereumChain': {
          const [network] =
            (params ?? []) as Array<{
              chainId: string
            }>

          this.chainId = network.chainId
          this.emit(
            'chainChanged',
            this.chainId,
          )

          return null
        }
        case 'wallet_addEthereumChain': {
          const [network] =
            (params ?? []) as Array<{
              chainId: string
            }>

          this.chainId = network.chainId
          this.emit(
            'chainChanged',
            this.chainId,
          )

          return null
        }
        default:
          throw new Error(
            `Unsupported method: ${method}`,
          )
      }
    },
  )

  constructor({
    authorizedAccounts = [],
    requestedAccounts = [],
    chainId = '0xaa36a7',
  }: {
    authorizedAccounts?: string[]
    requestedAccounts?: string[]
    chainId?: string
  } = {}) {
    this.authorizedAccounts = authorizedAccounts
    this.requestedAccounts = requestedAccounts
    this.chainId = chainId
  }

  on(
    eventName:
      | 'accountsChanged'
      | 'chainChanged',
    listener: EthereumEventListener,
  ) {
    const eventListeners =
      this.listeners.get(eventName) ??
      new Set<EthereumEventListener>()

    eventListeners.add(listener)
    this.listeners.set(
      eventName,
      eventListeners,
    )
  }

  removeListener(
    eventName:
      | 'accountsChanged'
      | 'chainChanged',
    listener: EthereumEventListener,
  ) {
    this.listeners
      .get(eventName)
      ?.delete(listener)
  }

  emit(
    eventName:
      | 'accountsChanged'
      | 'chainChanged',
    value: unknown,
  ) {
    for (
      const listener of
      this.listeners.get(eventName) ?? []
    ) {
      listener(value)
    }
  }
}

function installEthereum(
  ethereum: MockEthereumProvider,
) {
  Object.defineProperty(
    window,
    'ethereum',
    {
      configurable: true,
      value:
        ethereum as unknown as
          BrowserEthereumProvider,
    },
  )
}

function removeEthereum() {
  Object.defineProperty(
    window,
    'ethereum',
    {
      configurable: true,
      value: undefined,
    },
  )
}

function WalletProbe() {
  const wallet = useWallet()

  return (
    <div>
      <output data-testid="status">
        {wallet.status}
      </output>

      <output data-testid="account">
        {wallet.account ?? 'none'}
      </output>

      <output data-testid="chain-id">
        {wallet.chainId?.toString() ?? 'none'}
      </output>

      <output data-testid="is-sepolia">
        {String(wallet.isSepolia)}
      </output>

      <output data-testid="error">
        {wallet.error ?? 'none'}
      </output>

      <button
        type="button"
        onClick={() => {
          void wallet.connectWallet()
        }}
      >
        Connect wallet
      </button>

      <button
        type="button"
        onClick={() => {
          void wallet.switchToSepolia()
        }}
      >
        Switch network
      </button>
    </div>
  )
}

function renderWallet(
  children: ReactNode = <WalletProbe />,
) {
  return render(
    <WalletProvider>
      {children}
    </WalletProvider>,
  )
}

afterEach(() => {
  removeEthereum()
})

describe('WalletProvider', () => {
  it('reports an unavailable browser wallet', async () => {
    removeEthereum()

    renderWallet()

    expect(
      await screen.findByTestId('status'),
    ).toHaveTextContent('unavailable')

    expect(
      screen.getByTestId('account'),
    ).toHaveTextContent('none')
  })

  it('reads a disconnected Sepolia wallet without prompting', async () => {
    const ethereum =
      new MockEthereumProvider()

    installEthereum(ethereum)
    renderWallet()

    expect(
      await screen.findByTestId('status'),
    ).toHaveTextContent('disconnected')

    expect(
      screen.getByTestId('chain-id'),
    ).toHaveTextContent('11155111')

    expect(ethereum.request).not.toHaveBeenCalledWith({
      method: 'eth_requestAccounts',
    })
  })

  it('connects only after an explicit user action', async () => {
    const user = userEvent.setup()

    const ethereum =
      new MockEthereumProvider({
        requestedAccounts: [ACCOUNT_ONE],
      })

    installEthereum(ethereum)
    renderWallet()

    expect(
      await screen.findByTestId('status'),
    ).toHaveTextContent('disconnected')

    await user.click(
      screen.getByRole('button', {
        name: 'Connect wallet',
      }),
    )

    await waitFor(() => {
      expect(
        screen.getByTestId('status'),
      ).toHaveTextContent('connected')
    })

    expect(
      screen.getByTestId('account'),
    ).toHaveTextContent(ACCOUNT_ONE)

    expect(ethereum.request).toHaveBeenCalledWith({
      method: 'eth_requestAccounts',
    })
  })

  it('reacts to account changes from the wallet', async () => {
    const ethereum =
      new MockEthereumProvider({
        authorizedAccounts: [ACCOUNT_ONE],
      })

    installEthereum(ethereum)
    renderWallet()

    expect(
      await screen.findByTestId('account'),
    ).toHaveTextContent(ACCOUNT_ONE)

    act(() => {
      ethereum.emit(
        'accountsChanged',
        [ACCOUNT_TWO],
      )
    })

    expect(
      screen.getByTestId('account'),
    ).toHaveTextContent(ACCOUNT_TWO)

    act(() => {
      ethereum.emit('accountsChanged', [])
    })

    expect(
      screen.getByTestId('status'),
    ).toHaveTextContent('disconnected')
  })

  it('reacts to chain changes from the wallet', async () => {
    const ethereum =
      new MockEthereumProvider({
        authorizedAccounts: [ACCOUNT_ONE],
        chainId: '0x7a69',
      })

    installEthereum(ethereum)
    renderWallet()

    expect(
      await screen.findByTestId('is-sepolia'),
    ).toHaveTextContent('false')

    act(() => {
      ethereum.emit(
        'chainChanged',
        '0xaa36a7',
      )
    })

    expect(
      screen.getByTestId('is-sepolia'),
    ).toHaveTextContent('true')
  })

  it('requests a switch to Ethereum Sepolia', async () => {
    const user = userEvent.setup()

    const ethereum =
      new MockEthereumProvider({
        authorizedAccounts: [ACCOUNT_ONE],
        chainId: '0x7a69',
      })

    installEthereum(ethereum)
    renderWallet()

    expect(
      await screen.findByTestId('is-sepolia'),
    ).toHaveTextContent('false')

    await user.click(
      screen.getByRole('button', {
        name: 'Switch network',
      }),
    )

    await waitFor(() => {
      expect(
        screen.getByTestId('is-sepolia'),
      ).toHaveTextContent('true')
    })

    expect(ethereum.request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [
        {
          chainId: '0xaa36a7',
        },
      ],
    })
  })
})
