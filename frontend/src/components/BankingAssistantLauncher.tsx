import type {
  SafeBankDashboardData,
} from '../contracts/dashboard'
import {
  useLanguage,
} from '../i18n/useLanguage'
import {
  AssistantLauncher,
} from './AssistantLauncher'
import {
  BankingAssistantPanel,
} from './BankingAssistantPanel'

type BankingAssistantLauncherProps = {
  data: SafeBankDashboardData
  account: string | null
}

export function BankingAssistantLauncher({
  data,
  account,
}: BankingAssistantLauncherProps) {
  const { t } = useLanguage()

  return (
    <AssistantLauncher
      openLabel={t('aiOpenAssistant')}
      closeLabel={t('aiCloseAssistant')}
      dialogLabel={t('aiBankingTitle')}
      robotTitle={t('aiRobotTitle')}
      neonLabel={t('aiNeonAssistantLabel')}
    >
      <BankingAssistantPanel
        data={data}
        account={account}
      />
    </AssistantLauncher>
  )
}