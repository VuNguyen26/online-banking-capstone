import {
  ZeroAddress,
  getAddress,
} from 'ethers'

import {
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CHAIN_ID_HEX,
  SEPOLIA_CHAIN_ID_NUMBER,
  SEPOLIA_EXPLORER_URL,
  SEPOLIA_PUBLIC_RPC_URL,
  getAddressExplorerUrl,
  getTransactionExplorerUrl,
} from './network'

import { SAFE_BANK_DEPLOYMENT } from '../contracts/generated/contracts'

describe('Sepolia network configuration', () => {
  it('uses Ethereum Sepolia chain identifiers', () => {
    expect(SEPOLIA_CHAIN_ID).toBe(11_155_111n)
    expect(SEPOLIA_CHAIN_ID_NUMBER).toBe(11_155_111)
    expect(SEPOLIA_CHAIN_ID_HEX).toBe('0xaa36a7')
    expect(SAFE_BANK_DEPLOYMENT.chainId).toBe(
      SEPOLIA_CHAIN_ID_NUMBER,
    )
  })

  it('uses only public frontend-safe URLs', () => {
    expect(SEPOLIA_PUBLIC_RPC_URL).toBe(
      'https://ethereum-sepolia-rpc.publicnode.com',
    )

    expect(SEPOLIA_EXPLORER_URL).toBe(
      'https://sepolia.etherscan.io',
    )

    expect(SEPOLIA_PUBLIC_RPC_URL).not.toContain(
      'TESTNET_PRIVATE_KEY',
    )

    expect(SEPOLIA_PUBLIC_RPC_URL).not.toContain(
      'ETHERSCAN_API_KEY',
    )
  })

  it('builds Sepolia explorer links', () => {
    const address =
      SAFE_BANK_DEPLOYMENT.contracts.SavingCore.address

    const transactionHash = `0x${'1'.repeat(64)}`

    expect(getAddressExplorerUrl(address)).toBe(
      `${SEPOLIA_EXPLORER_URL}/address/${address}`,
    )

    expect(
      getTransactionExplorerUrl(transactionHash),
    ).toBe(
      `${SEPOLIA_EXPLORER_URL}/tx/${transactionHash}`,
    )
  })

  it('contains three valid nonzero contract addresses', () => {
    for (
      const contract of Object.values(
        SAFE_BANK_DEPLOYMENT.contracts,
      )
    ) {
      expect(getAddress(contract.address)).toBe(
        contract.address,
      )

      expect(contract.address).not.toBe(ZeroAddress)
    }
  })
})
