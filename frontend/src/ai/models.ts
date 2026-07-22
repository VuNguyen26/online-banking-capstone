import type {
  Language,
} from '../i18n/translations'

export type AssistantMode =
  | 'banking'
  | 'risk'

export type AssistantSectionKind =
  | 'fact'
  | 'explanation'
  | 'caution'
  | 'next-step'

export type AssistantAnswerSection = {
  kind: AssistantSectionKind
  text: string
}

export type AssistantAnswer = {
  mode: AssistantMode
  language: Language
  sections: readonly AssistantAnswerSection[]
}

export type AssistantRequest<TContext> = {
  question: string
  language: Language
  context: TContext
}

export type AssistantClient<TContext> = {
  ask: (
    request: AssistantRequest<TContext>,
    signal?: AbortSignal,
  ) => Promise<AssistantAnswer>
}