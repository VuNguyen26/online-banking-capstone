export const ASSISTANT_QUESTION_MAX_LENGTH =
  500

export type AssistantQuestionIssue =
  | 'empty'
  | 'too-long'
  | 'url-not-supported'

export type PreparedAssistantQuestion =
  | {
      ok: true
      question: string
    }
  | {
      ok: false
      issue: AssistantQuestionIssue
    }

const URL_PATTERN =
  /\bhttps?:\/\/\S+/iu

function replaceControlCharacters(
  value: string,
): string {
  return [...value]
    .map((character) => {
      const codePoint =
        character.codePointAt(0)

      if (
        codePoint !== undefined &&
        (codePoint <= 0x1f ||
          codePoint === 0x7f)
      ) {
        return ' '
      }

      return character
    })
    .join('')
}

function normalizeQuestion(
  value: string,
): string {
  return replaceControlCharacters(value)
    .replace(/\s+/gu, ' ')
    .trim()
}

export function prepareAssistantQuestion(
  value: string,
): PreparedAssistantQuestion {
  const question =
    normalizeQuestion(value)

  if (question.length === 0) {
    return {
      ok: false,
      issue: 'empty',
    }
  }

  if (
    [...question].length >
    ASSISTANT_QUESTION_MAX_LENGTH
  ) {
    return {
      ok: false,
      issue: 'too-long',
    }
  }

  if (URL_PATTERN.test(question)) {
    return {
      ok: false,
      issue: 'url-not-supported',
    }
  }

  return {
    ok: true,
    question,
  }
}

export class AssistantQuestionValidationError
  extends Error {
  readonly issue: AssistantQuestionIssue

  constructor(
    issue: AssistantQuestionIssue,
  ) {
    super(
      `Assistant question is invalid: ${issue}.`,
    )

    this.name =
      'AssistantQuestionValidationError'
    this.issue = issue
  }
}

export function requireAssistantQuestion(
  value: string,
): string {
  const prepared =
    prepareAssistantQuestion(value)

  if (!prepared.ok) {
    throw new AssistantQuestionValidationError(
      prepared.issue,
    )
  }

  return prepared.question
}