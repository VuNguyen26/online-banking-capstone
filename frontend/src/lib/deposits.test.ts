import {
  DEPOSIT_STATUS,
  getDepositStatusLabel,
} from './deposits'

describe('deposit status mapping', () => {
  it('maps every SavingCore deposit status', () => {
    expect(
      getDepositStatusLabel(DEPOSIT_STATUS.Active),
    ).toBe('Active')

    expect(
      getDepositStatusLabel(DEPOSIT_STATUS.Withdrawn),
    ).toBe('Withdrawn')

    expect(
      getDepositStatusLabel(
        DEPOSIT_STATUS.ManualRenewed,
      ),
    ).toBe('Manually renewed')

    expect(
      getDepositStatusLabel(
        DEPOSIT_STATUS.AutoRenewed,
      ),
    ).toBe('Automatically renewed')
  })

  it('rejects unknown status values', () => {
    expect(() =>
      getDepositStatusLabel(4n),
    ).toThrow('Unknown deposit status')
  })
})
