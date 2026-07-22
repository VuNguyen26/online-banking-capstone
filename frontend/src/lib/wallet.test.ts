import {
  UNKNOWN_CHAIN_CODE,
  USER_REJECTED_REQUEST_CODE,
  getProviderErrorCode,
  isSepoliaChain,
  isUnknownChainError,
  isUserRejectedRequest,
  normalizeWalletAccounts,
  parseWalletChainId,
  shortenAddress,
} from './wallet'

describe('wallet utilities', () => {
  it('normalizes valid wallet accounts', () => {
    expect(
      normalizeWalletAccounts([
        '0xa998526b0a5f23680f50fa3677f5c6576dba89d9',
        123,
        'invalid-address',
      ]),
    ).toEqual([
      '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9',
    ])
  })

  it('returns an empty array for invalid account payloads', () => {
    expect(normalizeWalletAccounts(null)).toEqual([])
    expect(normalizeWalletAccounts('0x1234')).toEqual([])
    expect(normalizeWalletAccounts({})).toEqual([])
  })

  it('parses EIP-1193 hexadecimal chain IDs', () => {
    expect(parseWalletChainId('0xaa36a7')).toBe(
      11_155_111n,
    )

    expect(parseWalletChainId('0x7a69')).toBe(31_337n)
    expect(parseWalletChainId('invalid')).toBeNull()
    expect(parseWalletChainId(null)).toBeNull()
  })

  it('recognizes Ethereum Sepolia only', () => {
    expect(isSepoliaChain(11_155_111n)).toBe(true)
    expect(isSepoliaChain(31_337n)).toBe(false)
    expect(isSepoliaChain(null)).toBe(false)
  })

  it('shortens checksummed addresses', () => {
    expect(
      shortenAddress(
        '0xA998526b0A5F23680f50fa3677f5c6576Dba89d9',
      ),
    ).toBe('0xA998…89d9')
  })

  it('recognizes standard wallet error codes', () => {
    const rejectedError = {
      code: USER_REJECTED_REQUEST_CODE,
    }

    const unknownChainError = {
      code: UNKNOWN_CHAIN_CODE,
    }

    expect(getProviderErrorCode(rejectedError)).toBe(4001)
    expect(isUserRejectedRequest(rejectedError)).toBe(true)
    expect(isUnknownChainError(rejectedError)).toBe(false)

    expect(getProviderErrorCode(unknownChainError)).toBe(
      4902,
    )

    expect(isUnknownChainError(unknownChainError)).toBe(
      true,
    )

    expect(isUserRejectedRequest(new Error('failure'))).toBe(
      false,
    )
  })
})
