import type {
  Language,
} from '../i18n/translations'
import type {
  RiskAssistantContext,
} from './context'
import type {
  AssistantAnswer,
  AssistantClient,
} from './models'
import {
  requireAssistantQuestion,
} from './safety'

type RiskIntent =
  | 'overview'
  | 'vault'
  | 'pause'
  | 'relationships'
  | 'ownership'
  | 'plan'

type RelationshipKey =
  keyof RiskAssistantContext['relationships']

function normalizeForIntent(
  value: string,
): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
}

function includesAny(
  value: string,
  terms: readonly string[],
): boolean {
  return terms.some(
    (term) => value.includes(term),
  )
}

function classifyRiskIntent(
  question: string,
): RiskIntent {
  const normalized =
    normalizeForIntent(question)

  if (
    includesAny(normalized, [
      'relationship',
      'configuration',
      'contract link',
      'mapping',
      'lien ket',
      'cau hinh',
      'khop dia chi',
    ])
  ) {
    return 'relationships'
  }

  if (
    includesAny(normalized, [
      'owner',
      'pending owner',
      'authorization',
      'permission',
      'role',
      'chu so huu',
      'phan quyen',
      'quyen truy cap',
    ])
  ) {
    return 'ownership'
  }

  if (
    includesAny(normalized, [
      'pause',
      'paused',
      'unpause',
      'tam dung',
      'dung hoat dong',
    ])
  ) {
    return 'pause'
  }

  if (
    includesAny(normalized, [
      'plan',
      'apr',
      'penalty',
      'saving product',
      'goi tiet kiem',
      'lai suat',
      'muc phat',
    ])
  ) {
    return 'plan'
  }

  if (
    includesAny(normalized, [
      'vault',
      'liquidity',
      'reserved interest',
      'shortfall',
      'underfunded',
      'thanh khoan',
      'lai du tru',
      'thieu hut',
      'thieu von',
      'kho lai',
    ])
  ) {
    return 'vault'
  }

  return 'overview'
}

function extractReferencedPlanId(
  question: string,
): string | null {
  const normalized =
    normalizeForIntent(question)

  return (
    /(?:plan|goi)\s*#?\s*(\d+)/u
      .exec(normalized)?.[1] ??
    null
  )
}

function createAbortError(): Error {
  const error = new Error(
    'The assistant request was cancelled.',
  )

  error.name = 'AbortError'

  return error
}

function throwIfAborted(
  signal?: AbortSignal,
): void {
  if (signal?.aborted) {
    throw createAbortError()
  }
}

function answer(
  language: Language,
  fact: string,
  explanation: string,
  caution: string,
  nextStep: string,
): AssistantAnswer {
  return {
    mode: 'risk',
    language,
    sections: [
      {
        kind: 'fact',
        text: fact,
      },
      {
        kind: 'explanation',
        text: explanation,
      },
      {
        kind: 'caution',
        text: caution,
      },
      {
        kind: 'next-step',
        text: nextStep,
      },
    ],
  }
}

function booleanStatus(
  value: boolean,
  language: Language,
): string {
  if (language === 'vi') {
    return value ? 'có' : 'không'
  }

  return value ? 'yes' : 'no'
}

function getRelationshipLabel(
  key: RelationshipKey,
  language: Language,
): string {
  const labels = {
    savingCoreTokenMatches:
      'SavingCore → MockUSDC',
    savingCoreVaultManagerMatches:
      'SavingCore → VaultManager',
    vaultManagerTokenMatches:
      'VaultManager → MockUSDC',
    vaultManagerSavingCoreMatches:
      'VaultManager → SavingCore',
    allRelationshipsValid:
      language === 'vi'
        ? 'Tất cả liên kết'
        : 'All relationships',
  } as const

  return labels[key]
}

function getMismatchedRelationships(
  context: RiskAssistantContext,
  language: Language,
): string[] {
  const relationshipKeys: readonly RelationshipKey[] =
    [
      'savingCoreTokenMatches',
      'savingCoreVaultManagerMatches',
      'vaultManagerTokenMatches',
      'vaultManagerSavingCoreMatches',
    ]

  return relationshipKeys
    .filter(
      (key) =>
        !context.relationships[key],
    )
    .map(
      (key) =>
        getRelationshipLabel(
          key,
          language,
        ),
    )
}

function buildOverviewAnswer(
  context: RiskAssistantContext,
  language: Language,
): AssistantAnswer {
  const pausedContracts = [
    context.configuration
      .savingCorePaused
      ? 'SavingCore'
      : null,
    context.configuration
      .vaultManagerPaused
      ? 'VaultManager'
      : null,
  ].filter(
    (value): value is string =>
      value !== null,
  )

  if (language === 'vi') {
    return answer(
      language,
      `Snapshot quản trị có ${context.plans.length} gói và ${context.depositCount} khoản gửi. Hợp đồng đang tạm dừng: ${pausedContracts.length === 0 ? 'không có' : pausedContracts.join(', ')}. Funding shortfall: ${context.vault.fundingShortfall}. Các liên kết hợp đồng đều khớp: ${booleanStatus(context.relationships.allRelationshipsValid, language)}.`,
      'Risk Assistant chỉ tổng hợp dữ liệu read-only đã được ứng dụng đọc từ Ethereum Sepolia. Nó không thực hiện pause, fund, withdraw, thay đổi plan hoặc ký giao dịch.',
      'Đây không phải kiểm toán bảo mật chuyên nghiệp và không phải bảo đảm SafeBank luôn đủ khả năng thanh toán.',
      'Kiểm tra riêng trạng thái vault, pause, liên kết hợp đồng và owner trước khi owner tự cân nhắc bất kỳ hành động quản trị nào.',
    )
  }

  return answer(
    language,
    `The administration snapshot contains ${context.plans.length} plans and ${context.depositCount} deposits. Paused contracts: ${pausedContracts.length === 0 ? 'none' : pausedContracts.join(', ')}. Funding shortfall: ${context.vault.fundingShortfall}. All contract relationships match: ${booleanStatus(context.relationships.allRelationshipsValid, language)}.`,
    'The Risk Assistant only summarizes read-only data already loaded by the application from Ethereum Sepolia. It cannot pause, fund, withdraw, change plans, or sign transactions.',
    'This is not a professional security audit and is not a guarantee that SafeBank will always remain solvent.',
    'Review vault state, pause state, contract relationships, and ownership separately before an owner considers any administrative action.',
  )
}

function buildVaultAnswer(
  context: RiskAssistantContext,
  language: Language,
): AssistantAnswer {
  const vault = context.vault

  if (language === 'vi') {
    return answer(
      language,
      `VaultManager có số dư ${vault.vaultBalance}, nghĩa vụ lãi dự trữ ${vault.totalReservedInterest}, thanh khoản khả dụng ${vault.availableLiquidity} và thiếu hụt ${vault.fundingShortfall}. Thiếu vốn theo snapshot: ${booleanStatus(vault.isUnderfunded, language)}.`,
      vault.isUnderfunded
        ? 'Funding shortfall lớn hơn 0 cho thấy số dư vault hiện chưa bao phủ toàn bộ nghĩa vụ lãi đã dự trữ. Settlement có thể phải ghi nhận phần lãi để claimant nhận sau.'
        : 'Funding shortfall đang bằng 0, nghĩa là số dư vault hiện bao phủ phần lãi đã dự trữ theo công thức kế toán của hợp đồng.',
      'Funding shortfall chỉ phản ánh snapshot hiện tại, không phải bảo đảm khả năng thanh toán trong tương lai và không thay thế kiểm toán chuyên nghiệp.',
      'Làm mới dữ liệu, so sánh vault balance với reserved interest và kiểm tra pause state trước khi owner tự cân nhắc fund hoặc withdraw.',
    )
  }

  return answer(
    language,
    `VaultManager has balance ${vault.vaultBalance}, reserved-interest obligations of ${vault.totalReservedInterest}, available liquidity of ${vault.availableLiquidity}, and a funding shortfall of ${vault.fundingShortfall}. Underfunded in this snapshot: ${booleanStatus(vault.isUnderfunded, language)}.`,
    vault.isUnderfunded
      ? 'A funding shortfall above zero means the current vault balance does not cover all reserved-interest obligations. Settlement may need to record interest for later claiming.'
      : 'A zero funding shortfall means the current vault balance covers reserved interest according to the contract accounting formula.',
    'Funding shortfall only describes the current snapshot. It is not a future solvency guarantee and does not replace a professional audit.',
    'Refresh the data, compare vault balance with reserved interest, and inspect pause state before an owner considers funding or withdrawal.',
  )
}

function buildPauseAnswer(
  context: RiskAssistantContext,
  language: Language,
): AssistantAnswer {
  const corePaused =
    context.configuration
      .savingCorePaused

  const vaultPaused =
    context.configuration
      .vaultManagerPaused

  if (language === 'vi') {
    return answer(
      language,
      `SavingCore đang tạm dừng: ${booleanStatus(corePaused, language)}. VaultManager đang tạm dừng: ${booleanStatus(vaultPaused, language)}.`,
      'Pause state có thể vô hiệu hóa các thao tác thay đổi trạng thái trong khi dữ liệu public read vẫn có thể được hiển thị. Mỗi hợp đồng có owner riêng chịu trách nhiệm quyết định pause hoặc unpause.',
      'Trạng thái active không chứng minh rằng mọi điều kiện tài chính hoặc cấu hình đều an toàn; trạng thái paused cũng không tự xác định nguyên nhân.',
      'Đối chiếu pause state với funding shortfall, liên kết hợp đồng và owner trước khi owner tự quyết định bước tiếp theo.',
    )
  }

  return answer(
    language,
    `SavingCore paused: ${booleanStatus(corePaused, language)}. VaultManager paused: ${booleanStatus(vaultPaused, language)}.`,
    'Pause state can disable state-changing actions while public read data remains visible. Each contract has its own owner responsible for pause or unpause decisions.',
    'An active state does not prove that every financial or configuration condition is safe, and a paused state does not identify its cause by itself.',
    'Compare pause state with funding shortfall, contract relationships, and ownership before an owner decides what to do next.',
  )
}

function buildRelationshipsAnswer(
  context: RiskAssistantContext,
  language: Language,
): AssistantAnswer {
  const mismatches =
    getMismatchedRelationships(
      context,
      language,
    )

  if (language === 'vi') {
    return answer(
      language,
      mismatches.length === 0
        ? 'Bốn liên kết SavingCore, VaultManager và MockUSDC đều khớp với deployment metadata đã đồng bộ.'
        : `Phát hiện ${mismatches.length} liên kết không khớp: ${mismatches.join(', ')}.`,
      'Các kiểm tra này so sánh địa chỉ đang lưu trong hợp đồng với địa chỉ deployment Sepolia mà frontend đã đồng bộ.',
      'Liên kết khớp không chứng minh mã nguồn không có lỗi. Liên kết không khớp là tín hiệu cấu hình cần được điều tra trước mọi thao tác quản trị.',
      'Mở mục Cấu hình và phân quyền, xác minh từng địa chỉ trên Etherscan và đối chiếu deployment metadata.',
    )
  }

  return answer(
    language,
    mismatches.length === 0
      ? 'All four relationships between SavingCore, VaultManager, and MockUSDC match the synchronized deployment metadata.'
      : `${mismatches.length} relationship mismatches were detected: ${mismatches.join(', ')}.`,
    'These checks compare addresses stored by the contracts with the synchronized Sepolia deployment addresses used by the frontend.',
    'Matching relationships do not prove that the code is defect-free. A mismatch is a configuration signal that should be investigated before administrative actions.',
    'Open Configuration and authorization, verify each address on Etherscan, and compare it with the deployment metadata.',
  )
}

function formatOptionalOwner(
  owner: string | null,
  language: Language,
): string {
  if (owner !== null) {
    return owner
  }

  return language === 'vi'
    ? 'không có'
    : 'none'
}

function buildOwnershipAnswer(
  context: RiskAssistantContext,
  language: Language,
): AssistantAnswer {
  const configuration =
    context.configuration

  const authorization =
    context.authorization

  if (language === 'vi') {
    return answer(
      language,
      `SavingCore owner: ${configuration.savingCoreOwner}; pending owner: ${formatOptionalOwner(configuration.savingCorePendingOwner, language)}. VaultManager owner: ${configuration.vaultManagerOwner}; pending owner: ${formatOptionalOwner(configuration.vaultManagerPendingOwner, language)}. Ví kết nối là SavingCore owner: ${booleanStatus(authorization.isSavingCoreOwner, language)}; là VaultManager owner: ${booleanStatus(authorization.isVaultManagerOwner, language)}.`,
      'Quyền owner và pending owner được đọc trực tiếp từ hợp đồng. Risk Assistant không thể nhận quyền, chấp nhận ownership hoặc ký thay ví đang kết nối.',
      'Địa chỉ owner hợp lệ không chứng minh khóa riêng tư đang được quản lý an toàn. Không chia sẻ private key, mnemonic hoặc seed phrase với ứng dụng hay trợ lý.',
      'Đối chiếu đầy đủ địa chỉ trên Etherscan và chỉ sử dụng các nút quản trị khi ví kết nối có đúng quyền on-chain.',
    )
  }

  return answer(
    language,
    `SavingCore owner: ${configuration.savingCoreOwner}; pending owner: ${formatOptionalOwner(configuration.savingCorePendingOwner, language)}. VaultManager owner: ${configuration.vaultManagerOwner}; pending owner: ${formatOptionalOwner(configuration.vaultManagerPendingOwner, language)}. Connected wallet is SavingCore owner: ${booleanStatus(authorization.isSavingCoreOwner, language)}; VaultManager owner: ${booleanStatus(authorization.isVaultManagerOwner, language)}.`,
    'Owner and pending-owner roles are read directly from the contracts. The Risk Assistant cannot accept ownership, obtain privileges, or sign for the connected wallet.',
    'A valid owner address does not prove that its private key is managed safely. Never provide private keys, mnemonics, or seed phrases to the application or assistant.',
    'Verify the full addresses on Etherscan and use administration controls only when the connected wallet has the required on-chain role.',
  )
}

function buildPlanAnswer(
  context: RiskAssistantContext,
  question: string,
  language: Language,
): AssistantAnswer {
  const referencedPlanId =
    extractReferencedPlanId(
      question,
    )

  const plan =
    referencedPlanId === null
      ? context.plans[0] ?? null
      : context.plans.find(
          (item) =>
            item.planId ===
            referencedPlanId,
        ) ?? null

  if (plan === null) {
    return language === 'vi'
      ? answer(
          language,
          'Snapshot quản trị hiện không có gói tiết kiệm nào.',
          'Không có APR, kỳ hạn, giới hạn tiền gửi hoặc mức phạt plan để phân tích.',
          'Dữ liệu có thể thay đổi sau khi trạng thái Sepolia được làm mới.',
          'Làm mới dữ liệu quản trị và kiểm tra lại danh mục gói.',
        )
      : answer(
          language,
          'The current administration snapshot contains no saving plans.',
          'There is no plan APR, tenor, deposit range, or penalty to analyze.',
          'The data may change after the Sepolia state is refreshed.',
          'Refresh administration data and inspect the plan catalogue again.',
        )
  }

  if (language === 'vi') {
    return answer(
      language,
      `Gói #${plan.planId}: kỳ hạn ${plan.tenorDays} ngày, APR ${plan.apr}, khoảng gửi ${plan.minimumDeposit}–${plan.maximumDeposit}, phí rút trước hạn ${plan.earlyWithdrawalPenalty}, trạng thái ${plan.enabled ? 'đang bật' : 'đã tắt'}.`,
      'APR và penalty là tham số sản phẩm có ảnh hưởng đến nghĩa vụ lãi dự trữ, trải nghiệm người gửi và kết quả khi rút trước hạn.',
      'Không thể kết luận mức APR hoặc penalty là phù hợp chỉ từ một snapshot. Đây không phải tư vấn tài chính hoặc đánh giá sản phẩm chuyên nghiệp.',
      'So sánh điều khoản plan với funding shortfall, reserved interest và các plan khác trước khi owner tự cân nhắc thay đổi.',
    )
  }

  return answer(
    language,
    `Plan #${plan.planId}: ${plan.tenorDays}-day tenor, ${plan.apr} APR, deposit range ${plan.minimumDeposit}–${plan.maximumDeposit}, ${plan.earlyWithdrawalPenalty} early-withdrawal penalty, and it is ${plan.enabled ? 'enabled' : 'disabled'}.`,
    'APR and penalty are product parameters that affect reserved-interest obligations, depositor experience, and early-withdrawal outcomes.',
    'A single snapshot cannot establish that an APR or penalty is appropriate. This is not financial advice or a professional product assessment.',
    'Compare the plan terms with funding shortfall, reserved interest, and other plans before an owner considers changing them.',
  )
}

function generateRiskAnswer(
  context: RiskAssistantContext,
  question: string,
  language: Language,
): AssistantAnswer {
  switch (
    classifyRiskIntent(question)
  ) {
    case 'vault':
      return buildVaultAnswer(
        context,
        language,
      )

    case 'pause':
      return buildPauseAnswer(
        context,
        language,
      )

    case 'relationships':
      return buildRelationshipsAnswer(
        context,
        language,
      )

    case 'ownership':
      return buildOwnershipAnswer(
        context,
        language,
      )

    case 'plan':
      return buildPlanAnswer(
        context,
        question,
        language,
      )

    case 'overview':
      return buildOverviewAnswer(
        context,
        language,
      )
  }
}

export const riskAssistantClient:
  AssistantClient<RiskAssistantContext> = {
    async ask(request, signal) {
      throwIfAborted(signal)

      const question =
        requireAssistantQuestion(
          request.question,
        )

      const response =
        generateRiskAnswer(
          request.context,
          question,
          request.language,
        )

      throwIfAborted(signal)

      return response
    },
  }