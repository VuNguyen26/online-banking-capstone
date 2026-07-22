export const DEPOSIT_STATUS = {
  Active: 0n,
  Withdrawn: 1n,
  ManualRenewed: 2n,
  AutoRenewed: 3n,
} as const

export type DepositStatusLabel =
  | 'Active'
  | 'Withdrawn'
  | 'Manually renewed'
  | 'Automatically renewed'

export function getDepositStatusLabel(
  status: bigint,
): DepositStatusLabel {
  switch (status) {
    case DEPOSIT_STATUS.Active:
      return 'Active'
    case DEPOSIT_STATUS.Withdrawn:
      return 'Withdrawn'
    case DEPOSIT_STATUS.ManualRenewed:
      return 'Manually renewed'
    case DEPOSIT_STATUS.AutoRenewed:
      return 'Automatically renewed'
    default:
      throw new Error(`Unknown deposit status: ${status}`)
  }
}
