import {
  useMemo,
} from 'react'

import {
  bankingAssistantClient,
} from '../ai/bankingAssistant'
import {
  buildBankingAssistantContext,
  type BankingAssistantContext,
} from '../ai/context'
import type {
  AssistantClient,
} from '../ai/models'
import type {
  SafeBankDashboardData,
} from '../contracts/dashboard'
import {
  useLanguage,
} from '../i18n/useLanguage'
import {
  AssistantPanel,
  type AssistantPanelLabels,
} from './AssistantPanel'

type BankingAssistantPanelProps = {
  data: SafeBankDashboardData
  account: string | null
  client?: AssistantClient<BankingAssistantContext>
}

export function BankingAssistantPanel({
  data,
  account,
  client = bankingAssistantClient,
}: BankingAssistantPanelProps) {
  const {
    language,
    t,
  } = useLanguage()

  const context =
    useMemo(
      () =>
        buildBankingAssistantContext(
          data,
          account,
        ),
      [
        data,
        account,
      ],
    )

  const labels =
    useMemo<AssistantPanelLabels>(
      () => ({
        questionLabel:
          t('aiQuestionLabel'),
        questionPlaceholder:
          t(
            'aiBankingQuestionPlaceholder',
          ),
        suggestedQuestionsLabel:
          t('aiSuggestedQuestions'),
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

  const suggestedQuestions =
    useMemo(
      () => [
        t('aiBankingSuggestionPlans'),
        t('aiBankingSuggestionApr'),
        t('aiBankingSuggestionPenalty'),
        t('aiBankingSuggestionMaturity'),
        t('aiBankingSuggestionVault'),
      ],
      [t],
    )

  return (
    <AssistantPanel
      title={t('aiBankingTitle')}
      description={t(
        'aiBankingDescription',
      )}
      readOnlyNotice={t(
        'aiReadOnlyNotice',
      )}
      language={language}
      context={context}
      client={client}
      suggestedQuestions={
        suggestedQuestions
      }
      labels={labels}
    />
  )
}