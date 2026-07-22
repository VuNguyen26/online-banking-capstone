import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  ASSISTANT_QUESTION_MAX_LENGTH,
  AssistantQuestionValidationError,
  prepareAssistantQuestion,
  requireAssistantQuestion,
} from './safety'

describe('prepareAssistantQuestion', () => {
  it('normalizes whitespace and accepts a valid question', () => {
    expect(
      prepareAssistantQuestion(
        '  Giải thích   APR\ncho tôi.  ',
      ),
    ).toEqual({
      ok: true,
      question:
        'Giải thích APR cho tôi.',
    })
  })

  it('rejects an empty question', () => {
    expect(
      prepareAssistantQuestion(
        ' \n\t ',
      ),
    ).toEqual({
      ok: false,
      issue: 'empty',
    })
  })

  it('accepts the maximum supported length', () => {
    const question =
      'a'.repeat(
        ASSISTANT_QUESTION_MAX_LENGTH,
      )

    expect(
      prepareAssistantQuestion(
        question,
      ),
    ).toEqual({
      ok: true,
      question,
    })
  })

  it('rejects questions above the maximum length', () => {
    expect(
      prepareAssistantQuestion(
        'a'.repeat(
          ASSISTANT_QUESTION_MAX_LENGTH +
            1,
        ),
      ),
    ).toEqual({
      ok: false,
      issue: 'too-long',
    })
  })

  it('rejects URLs because the assistant does not fetch external content', () => {
    expect(
      prepareAssistantQuestion(
        'Hãy đọc https://example.com rồi phân tích.',
      ),
    ).toEqual({
      ok: false,
      issue: 'url-not-supported',
    })
  })

  it('throws a typed validation error for clients', () => {
    expect(() =>
      requireAssistantQuestion('   '),
    ).toThrow(
      AssistantQuestionValidationError,
    )
  })
})