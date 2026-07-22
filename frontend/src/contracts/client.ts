import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  type ContractRunner,
  type Eip1193Provider,
  type Signer,
} from 'ethers'

import {
  MOCK_USDC_ABI,
  SAFE_BANK_DEPLOYMENT,
  SAVING_CORE_ABI,
  VAULT_MANAGER_ABI,
} from './generated/contracts'

import {
  SEPOLIA_CHAIN_ID_NUMBER,
  SEPOLIA_PUBLIC_RPC_URL,
} from '../config/network'

export type SafeBankContracts = {
  mockUsdc: Contract
  vaultManager: Contract
  savingCore: Contract
}

export function createPublicProvider(): JsonRpcProvider {
  return new JsonRpcProvider(
    SEPOLIA_PUBLIC_RPC_URL,
    SEPOLIA_CHAIN_ID_NUMBER,
    {
      staticNetwork: true,
    },
  )
}

export function createBrowserProvider(
  provider: Eip1193Provider,
): BrowserProvider {
  return new BrowserProvider(provider)
}

export function createSafeBankContracts(
  runner: ContractRunner,
): SafeBankContracts {
  return {
    mockUsdc: new Contract(
      SAFE_BANK_DEPLOYMENT.contracts.MockUSDC.address,
      MOCK_USDC_ABI,
      runner,
    ),
    vaultManager: new Contract(
      SAFE_BANK_DEPLOYMENT.contracts.VaultManager.address,
      VAULT_MANAGER_ABI,
      runner,
    ),
    savingCore: new Contract(
      SAFE_BANK_DEPLOYMENT.contracts.SavingCore.address,
      SAVING_CORE_ABI,
      runner,
    ),
  }
}

export function createReadOnlyContracts(): {
  provider: JsonRpcProvider
  contracts: SafeBankContracts
} {
  const provider = createPublicProvider()

  return {
    provider,
    contracts: createSafeBankContracts(provider),
  }
}

export function createSignerContracts(
  signer: Signer,
): SafeBankContracts {
  return createSafeBankContracts(signer)
}
