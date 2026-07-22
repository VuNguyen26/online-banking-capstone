import {
  Interface,
  JsonRpcProvider,
} from 'ethers'

import {
  MOCK_USDC_ABI,
  SAFE_BANK_DEPLOYMENT,
  SAVING_CORE_ABI,
  VAULT_MANAGER_ABI,
} from './generated/contracts'

import {
  createPublicProvider,
  createSafeBankContracts,
} from './client'

describe('SafeBank contract client', () => {
  it('creates a static Sepolia read provider', () => {
    const provider = createPublicProvider()

    expect(provider).toBeInstanceOf(JsonRpcProvider)

    provider.destroy()
  })

  it('creates contracts at canonical deployment addresses', () => {
    const provider = createPublicProvider()
    const contracts = createSafeBankContracts(provider)

    expect(contracts.mockUsdc.target).toBe(
      SAFE_BANK_DEPLOYMENT.contracts.MockUSDC.address,
    )

    expect(contracts.vaultManager.target).toBe(
      SAFE_BANK_DEPLOYMENT.contracts.VaultManager.address,
    )

    expect(contracts.savingCore.target).toBe(
      SAFE_BANK_DEPLOYMENT.contracts.SavingCore.address,
    )

    provider.destroy()
  })

  it('contains exact user transaction signatures', () => {
    const tokenInterface = new Interface(MOCK_USDC_ABI)
    const coreInterface = new Interface(SAVING_CORE_ABI)

    expect(
      tokenInterface.getFunction(
        'approve(address,uint256)',
      ),
    ).not.toBeNull()

    expect(
      coreInterface.getFunction(
        'openDeposit(uint256,uint256)',
      ),
    ).not.toBeNull()

    expect(
      coreInterface.getFunction(
        'manualRenew(uint256,uint256)',
      ),
    ).not.toBeNull()

    expect(
      coreInterface.getFunction('autoRenew(uint256)'),
    ).not.toBeNull()
  })

  it('contains the required C1 and C2 read functions', () => {
    const coreInterface = new Interface(SAVING_CORE_ABI)
    const vaultInterface = new Interface(
      VAULT_MANAGER_ABI,
    )

    expect(
      coreInterface.getFunction(
        'pendingInterest(uint256)',
      ),
    ).not.toBeNull()

    expect(
      coreInterface.getFunction(
        'interestClaimant(uint256)',
      ),
    ).not.toBeNull()

    expect(
      vaultInterface.getFunction(
        'totalReservedInterest()',
      ),
    ).not.toBeNull()

    expect(
      vaultInterface.getFunction(
        'availableLiquidity()',
      ),
    ).not.toBeNull()

    expect(
      vaultInterface.getFunction(
        'fundingShortfall()',
      ),
    ).not.toBeNull()
  })
})
