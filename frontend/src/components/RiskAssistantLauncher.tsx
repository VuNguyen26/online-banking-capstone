import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'
import {
  useLanguage,
} from '../i18n/useLanguage'
import {
  AssistantLauncher,
} from './AssistantLauncher'
import {
  RiskAssistantPanel,
} from './RiskAssistantPanel'

type RiskAssistantLauncherProps = {
  data: AdminDashboardData
}

export function RiskAssistantLauncher({
  data,
}: RiskAssistantLauncherProps) {
  const { t } = useLanguage()

  return (
    <AssistantLauncher
      openLabel={t('aiOpenAssistant')}
      closeLabel={t('aiCloseAssistant')}
      dialogLabel={t('aiRiskTitle')}
      robotTitle={t('aiRobotTitle')}
      neonLabel={t('aiNeonAssistantLabel')}
    >
      <RiskAssistantPanel
        data={data}
      />
    </AssistantLauncher>
  )
}