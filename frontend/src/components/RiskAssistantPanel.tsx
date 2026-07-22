import {
  useMemo,
} from 'react'

import {
  buildRiskAssistantContext,
  type RiskAssistantContext,
} from '../ai/context'
import type {
  AssistantClient,
} from '../ai/models'
import {
  riskAssistantClient,
} from '../ai/riskAssistant'
import type {
  AdminDashboardData,
} from '../contracts/adminDashboard'
import {
  useLanguage,
} from '../i18n/useLanguage'
import {
  AssistantPanel,
  type AssistantPanelLabels,
} from './AssistantPanel'

type RiskAssistantPanelProps = {
  data: AdminDashboardData
  client?: AssistantClient<RiskAssistantContext>
}

export function RiskAssistantPanel({
  data,
  client = riskAssistantClient,
}: RiskAssistantPanelProps) {
  const {
    language,
    t,
  } = useLanguage()

  const context =
    useMemo(
      () =>
        buildRiskAssistantContext(
          data,
        ),
      [data],
    )

  const labels =
    useMemo<AssistantPanelLabels>(
      () => ({
        questionLabel:
          t('aiQuestionLabel'),
        questionPlaceholder:
          t(
            'aiRiskQuestionPlaceholder',
          ),
        submit: t('aiSubmit'),
        submitting:
          t('aiSubmitting'),
        clear: t('aiClear'),
        responseHeading:
          t('aiResponseHeading'),
        loadingMessage:
          t('aiLoadingMessage'),
        failureMessage:
          t('aiFailureMessage'),
        characterCount: (
          current,
          maximum,
        ) =>
          `${current}/${maximum} ${t('aiCharacters')}`,
        validationMessages: {
          empty:
            t('aiValidationEmpty'),
          'too-long':
            t('aiValidationTooLong'),
          'url-not-supported':
            t('aiValidationUrl'),
        },
        sectionLabels: {
          fact: t('aiSectionFact'),
          explanation:
            t('aiSectionExplanation'),
          caution:
            t('aiSectionCaution'),
          'next-step':
            t('aiSectionNextStep'),
        },
      }),
      [t],
    )

  return (
    <AssistantPanel
      title={t('aiRiskTitle')}
      description={t(
        'aiRiskDescription',
      )}
      readOnlyNotice={t(
        'aiReadOnlyNotice',
      )}
      language={language}
      context={context}
      client={client}
      labels={labels}
    />
  )
}