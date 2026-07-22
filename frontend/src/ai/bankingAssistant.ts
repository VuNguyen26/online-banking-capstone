import type {
  BankingAssistantContext,
} from './context'
import type {
  AssistantAnswer,
  AssistantClient,
} from './models'
import {
  requireAssistantQuestion,
} from './safety'

type BankingIntent =
  | 'overview'
  | 'plan'
  | 'apr'
  | 'penalty'
  | 'deposit'
  | 'maturity'
  | 'renewal'
  | 'pending-interest'
  | 'vault'

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

function classifyBankingIntent(
  question: string,
): BankingIntent {
  const normalized =
    normalizeForIntent(question)

  if (
    includesAny(normalized, [
      'pending interest',
      'deferred interest',
      'lai hoan',
      'lai dang cho',
      'claim interest',
      'nhan lai',
    ])
  ) {
    return 'pending-interest'
  }

  if (
    includesAny(normalized, [
      'renew',
      'renewal',
      'tai tuc',
      'auto renew',
      'manual renew',
    ])
  ) {
    return 'renewal'
  }

  if (
    includesAny(normalized, [
      'maturity',
      'mature',
      'grace period',
      'dao han',
      'gia han',
      'khi nao rut',
    ])
  ) {
    return 'maturity'
  }

  if (
    includesAny(normalized, [
      'penalty',
      'early withdrawal',
      'withdraw early',
      'phat',
      'rut som',
      'rut truoc han',
    ])
  ) {
    return 'penalty'
  }

  if (
    includesAny(normalized, [
      'apr',
      'interest rate',
      'lai suat',
      'tien lai',
    ])
  ) {
    return 'apr'
  }

  if (
    includesAny(normalized, [
      'underfunded',
      'vault',
      'liquidity',
      'shortfall',
      'thanh khoan',
      'thieu von',
      'kho lai',
    ])
  ) {
    return 'vault'
  }

  if (
    includesAny(normalized, [
      'deposit',
      'certificate',
      'khoan gui',
      'chung chi',
    ])
  ) {
    return 'deposit'
  }

  if (
    includesAny(normalized, [
      'plan',
      'saving plan',
      'goi',
      'goi tiet kiem',
      'goi gui',
    ])
  ) {
    return 'plan'
  }

  return 'overview'
}

function extractReferencedId(
  question: string,
  kind: 'plan' | 'deposit',
): string | null {
  const normalized =
    normalizeForIntent(question)

  const expression =
    kind === 'plan'
      ? /(?:plan|goi)\s*#?\s*(\d+)/u
      : /(?:deposit|khoan gui|chung chi)\s*#?\s*(\d+)/u

  return (
    expression.exec(normalized)?.[1] ??
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
  language: 'vi' | 'en',
  fact: string,
  explanation: string,
  caution: string,
  nextStep: string,
): AssistantAnswer {
  return {
    mode: 'banking',
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

function getSelectedPlan(
  context: BankingAssistantContext,
  question: string,
) {
  const referencedId =
    extractReferencedId(
      question,
      'plan',
    )

  if (referencedId !== null) {
    return (
      context.plans.find(
        (plan) =>
          plan.planId ===
          referencedId,
      ) ?? null
    )
  }

  return (
    context.plans.find(
      (plan) => plan.enabled,
    ) ??
    context.plans[0] ??
    null
  )
}

function getSelectedDeposit(
  context: BankingAssistantContext,
  question: string,
) {
  const referencedId =
    extractReferencedId(
      question,
      'deposit',
    )

  if (referencedId !== null) {
    return (
      context.deposits.find(
        (deposit) =>
          deposit.depositId ===
          referencedId,
      ) ?? null
    )
  }

  return context.deposits[0] ?? null
}

function buildOverviewAnswer(
  context: BankingAssistantContext,
  language: 'vi' | 'en',
): AssistantAnswer {
  const enabledPlans =
    context.plans.filter(
      (plan) => plan.enabled,
    ).length

  if (language === 'vi') {
    return answer(
      language,
      `SafeBank hiện có ${context.protocol.planCount} gói, trong đó ${enabledPlans} gói đang bật; ví hiện tại có ${context.deposits.length} chứng chỉ và ${context.pendingInterestClaims.length} khoản lãi hoãn trả.`,
      'Trợ lý này chỉ giải thích snapshot dữ liệu đã được ứng dụng đọc từ Ethereum Sepolia. Nó không kết nối ví, không ký và không gửi giao dịch.',
      'mUSDC và Sepolia ETH chỉ là tài sản testnet, không có giá trị thực. Nội dung này không phải tư vấn tài chính.',
      'Bạn có thể hỏi cụ thể về một gói, khoản gửi, ngày đáo hạn, phí rút trước hạn hoặc lãi đang chờ.',
    )
  }

  return answer(
    language,
    `SafeBank currently has ${context.protocol.planCount} plans, including ${enabledPlans} enabled plans; this wallet has ${context.deposits.length} certificates and ${context.pendingInterestClaims.length} deferred-interest claims.`,
    'This assistant only explains the snapshot already read by the application from Ethereum Sepolia. It cannot connect a wallet, sign, or submit transactions.',
    'mUSDC and Sepolia ETH are testnet assets with no real-world value. This is not financial advice.',
    'Ask about a specific plan, deposit, maturity date, early-withdrawal penalty, or pending-interest claim.',
  )
}

function buildPlanAnswer(
  context: BankingAssistantContext,
  question: string,
  language: 'vi' | 'en',
): AssistantAnswer {
  const plan =
    getSelectedPlan(context, question)

  if (plan === null) {
    return language === 'vi'
      ? answer(
          language,
          'Snapshot hiện tại không có gói tiết kiệm nào.',
          'Không có điều khoản plan để trợ lý giải thích.',
          'Trạng thái này có thể thay đổi sau khi dữ liệu Sepolia được làm mới.',
          'Dùng nút làm mới trạng thái trong giao diện để đọc lại dữ liệu công khai.',
        )
      : answer(
          language,
          'The current snapshot contains no saving plans.',
          'There are no plan terms for the assistant to explain.',
          'This may change after the Sepolia data is refreshed.',
          'Use the interface refresh action to reload public state.',
        )
  }

  if (language === 'vi') {
    return answer(
      language,
      `Gói #${plan.planId}: kỳ hạn ${plan.tenorDays} ngày, APR ${plan.apr}, khoảng gửi ${plan.minimumDeposit}–${plan.maximumDeposit}, phí rút trước hạn ${plan.earlyWithdrawalPenalty}, trạng thái ${plan.enabled ? 'đang bật' : 'đã tắt'}.`,
      'APR là tỷ lệ năm. SafeBank dùng lãi đơn theo tiền gốc, APR và số ngày kỳ hạn; điều khoản được chốt cho khoản gửi khi mở.',
      plan.enabled
        ? 'Gói đang bật vẫn có thể thay đổi trạng thái sau khi snapshot được làm mới. Con số lãi là phép tính deterministic và không phải cam kết lợi nhuận.'
        : 'Gói đang tắt không nhận khoản gửi mới. Con số lãi là phép tính deterministic và không phải cam kết lợi nhuận.',
      'Kiểm tra gói tương ứng trong mục Các gói tiết kiệm trước khi tự chọn mở khoản gửi.',
    )
  }

  return answer(
    language,
    `Plan #${plan.planId}: ${plan.tenorDays}-day tenor, ${plan.apr} APR, deposit range ${plan.minimumDeposit}–${plan.maximumDeposit}, ${plan.earlyWithdrawalPenalty} early-withdrawal penalty, and it is ${plan.enabled ? 'enabled' : 'disabled'}.`,
    'APR is an annual rate. SafeBank uses simple interest from principal, APR, and tenor days; terms are snapshotted when a deposit is opened.',
    plan.enabled
      ? 'An enabled plan may still change state after the snapshot is refreshed. Deterministic interest estimates are not guaranteed returns.'
      : 'A disabled plan cannot accept new deposits. Deterministic interest estimates are not guaranteed returns.',
    'Review the matching card in Saving plans before choosing to open a deposit yourself.',
  )
}

function buildAprAnswer(
  context: BankingAssistantContext,
  question: string,
  language: 'vi' | 'en',
): AssistantAnswer {
  const deposit =
    getSelectedDeposit(
      context,
      question,
    )

  if (deposit !== null) {
    if (language === 'vi') {
      return answer(
        language,
        `Khoản gửi #${deposit.depositId} có APR đã chốt ${deposit.aprAtOpen}, kỳ hạn ${deposit.tenorDays} ngày và lãi đơn ước tính ${deposit.estimatedInterest}.`,
        'APR của khoản gửi được snapshot tại lúc mở, nên việc owner thay đổi APR của plan sau đó không thay đổi điều khoản đã chốt của chứng chỉ này.',
        'Đây là ước tính deterministic, không phải cam kết lợi nhuận. Lãi có thể được trả ngay hoặc ghi nhận thành lãi hoãn trả theo cơ chế principal-first nếu VaultManager thiếu nguồn lãi.',
        'Xem thẻ khoản gửi và trạng thái vault trước khi tự chọn thao tác vòng đời.',
      )
    }

    return answer(
      language,
      `Deposit #${deposit.depositId} has a snapshotted APR of ${deposit.aprAtOpen}, a ${deposit.tenorDays}-day tenor, and estimated simple interest of ${deposit.estimatedInterest}.`,
      'The deposit APR is snapshotted at opening, so a later plan APR update does not alter this certificate’s stored terms.',
      'This deterministic estimate is not a guaranteed return. Interest may be paid immediately or recorded as deferred interest under principal-first settlement if VaultManager lacks interest funding.',
      'Review the deposit card and vault status before choosing a lifecycle action yourself.',
    )
  }

  return buildPlanAnswer(
    context,
    question,
    language,
  )
}

function buildPenaltyAnswer(
  context: BankingAssistantContext,
  question: string,
  language: 'vi' | 'en',
): AssistantAnswer {
  const deposit =
    getSelectedDeposit(
      context,
      question,
    )

  if (deposit === null) {
    return buildPlanAnswer(
      context,
      question,
      language,
    )
  }

  if (language === 'vi') {
    return answer(
      language,
      `Khoản gửi #${deposit.depositId} có mức phạt đã chốt ${deposit.earlyWithdrawalPenaltyRate}; tiền phạt ước tính ${deposit.estimatedEarlyWithdrawalPenalty} và tiền gốc ròng ước tính còn ${deposit.estimatedNetPrincipalAfterPenalty}.`,
      'Rút trước hạn kết thúc khoản gửi, không trả lãi và khấu trừ phí từ tiền gốc theo điều khoản được snapshot khi mở.',
      'Các giá trị trên là phép tính từ snapshot hiện tại. Giao dịch thật vẫn phải được bạn tự kiểm tra và xác nhận trong ví.',
      'Mở thẻ khoản gửi và dùng nút Rút trước hạn chỉ khi thao tác đó đang được giao diện cho phép.',
    )
  }

  return answer(
    language,
    `Deposit #${deposit.depositId} has a snapshotted penalty rate of ${deposit.earlyWithdrawalPenaltyRate}; the estimated penalty is ${deposit.estimatedEarlyWithdrawalPenalty}, leaving estimated net principal of ${deposit.estimatedNetPrincipalAfterPenalty}.`,
    'Early withdrawal closes the deposit, pays no interest, and deducts the snapshotted penalty from principal.',
    'These values are calculated from the current snapshot. You must still review and confirm any real transaction in your wallet.',
    'Open the deposit card and use Withdraw early only when the interface marks that action as available.',
  )
}

function buildDepositAnswer(
  context: BankingAssistantContext,
  question: string,
  language: 'vi' | 'en',
): AssistantAnswer {
  const deposit =
    getSelectedDeposit(
      context,
      question,
    )

  if (deposit === null) {
    return language === 'vi'
      ? answer(
          language,
          'Ví hiện tại không có chứng chỉ tiền gửi nào trong snapshot.',
          'Dữ liệu chứng chỉ chỉ xuất hiện sau khi ví được kết nối và ứng dụng xác định quyền sở hữu NFT trên Sepolia.',
          'Không có chứng chỉ trong snapshot không chứng minh rằng ví chưa từng tương tác với SafeBank.',
          'Kết nối đúng ví và làm mới dữ liệu danh mục.',
        )
      : answer(
          language,
          'The current wallet has no deposit certificates in this snapshot.',
          'Certificate data appears only after a wallet is connected and the application resolves NFT ownership on Sepolia.',
          'No certificate in this snapshot does not prove that the wallet has never interacted with SafeBank.',
          'Connect the correct wallet and refresh the portfolio data.',
        )
  }

  if (language === 'vi') {
    return answer(
      language,
      `Khoản gửi #${deposit.depositId}: trạng thái ${deposit.status}, tiền gốc ${deposit.principal}, APR ${deposit.aprAtOpen}, đáo hạn ${deposit.maturityAtUtc}.`,
      'Trạng thái và điều khoản được lấy từ snapshot on-chain đã định dạng. Các thao tác khả dụng được tính theo timestamp block Sepolia mới nhất.',
      'Không dùng đồng hồ thiết bị để quyết định cửa sổ đáo hạn hoặc gia hạn.',
      'Xem phần “Hiện có thể thực hiện” trên thẻ khoản gửi trước khi tự chọn hành động.',
    )
  }

  return answer(
    language,
    `Deposit #${deposit.depositId}: status ${deposit.status}, principal ${deposit.principal}, APR ${deposit.aprAtOpen}, and maturity ${deposit.maturityAtUtc}.`,
    'The status and terms come from the formatted on-chain snapshot. Available actions are derived from the latest Sepolia block timestamp.',
    'Do not use the device clock to determine maturity or grace-window eligibility.',
    'Review “Currently available” on the deposit card before choosing an action yourself.',
  )
}

function buildMaturityAnswer(
  context: BankingAssistantContext,
  question: string,
  language: 'vi' | 'en',
): AssistantAnswer {
  const deposit =
    getSelectedDeposit(
      context,
      question,
    )

  if (deposit === null) {
    return buildDepositAnswer(
      context,
      question,
      language,
    )
  }

  const actions =
    deposit.availableActions

  if (language === 'vi') {
    return answer(
      language,
      `Khoản gửi #${deposit.depositId} đáo hạn lúc ${deposit.maturityAtUtc}; thời gian gia hạn kết thúc lúc ${deposit.graceEndsAtUtc}. Rút khi đáo hạn: ${actions.canWithdrawAtMaturity ? 'có thể' : 'chưa thể'}; tái tục thủ công: ${actions.canManualRenew ? 'có thể' : 'chưa thể'}; auto-renew: ${actions.canAutoRenew ? 'có thể' : 'chưa thể'}.`,
      'Manual renewal chỉ khả dụng từ thời điểm đáo hạn đến trước khi grace period kết thúc. Permissionless auto-renew khả dụng từ thời điểm grace period kết thúc.',
      'Khả năng thao tác dựa trên timestamp block Sepolia mới nhất và có thể thay đổi sau khi làm mới dữ liệu.',
      'Làm mới trạng thái rồi kiểm tra các nút đang được bật trên thẻ khoản gửi.',
    )
  }

  return answer(
    language,
    `Deposit #${deposit.depositId} matures at ${deposit.maturityAtUtc}; its grace period ends at ${deposit.graceEndsAtUtc}. Maturity withdrawal: ${actions.canWithdrawAtMaturity ? 'available' : 'not available'}; manual renewal: ${actions.canManualRenew ? 'available' : 'not available'}; auto-renewal: ${actions.canAutoRenew ? 'available' : 'not available'}.`,
    'Manual renewal is available from maturity until the grace period ends. Permissionless auto-renewal becomes available when the grace period has ended.',
    'Eligibility uses the latest Sepolia block timestamp and may change after the state is refreshed.',
    'Refresh the state and review which buttons are enabled on the deposit card.',
  )
}

function buildRenewalAnswer(
  context: BankingAssistantContext,
  question: string,
  language: 'vi' | 'en',
): AssistantAnswer {
  const deposit =
    getSelectedDeposit(
      context,
      question,
    )

  if (deposit === null) {
    return buildDepositAnswer(
      context,
      question,
      language,
    )
  }

  const enabledPlans =
    context.plans.filter(
      (plan) => plan.enabled,
    ).length

  if (language === 'vi') {
    return answer(
      language,
      `Khoản gửi #${deposit.depositId}: tái tục thủ công ${deposit.availableActions.canManualRenew ? 'đang khả dụng' : 'chưa khả dụng'}, auto-renew ${deposit.availableActions.canAutoRenew ? 'đang khả dụng' : 'chưa khả dụng'}; hiện có ${enabledPlans} gói đang bật để chọn theo giao diện.`,
      'Tái tục tạo một khoản gửi mới theo điều khoản plan được chọn. Khoản cũ được chuyển sang trạng thái đã tái tục và không bị chỉnh sửa ngược.',
      'Tái tục có phần lãi dương có thể thất bại khi VaultManager thiếu nguồn lãi cần thiết.',
      'Kiểm tra cửa sổ thời gian, trạng thái vault và plan đang bật trước khi tự gửi yêu cầu tái tục.',
    )
  }

  return answer(
    language,
    `Deposit #${deposit.depositId}: manual renewal is ${deposit.availableActions.canManualRenew ? 'available' : 'not available'}, auto-renewal is ${deposit.availableActions.canAutoRenew ? 'available' : 'not available'}, and ${enabledPlans} enabled plans are currently selectable in the interface.`,
    'Renewal creates a new deposit using the selected plan terms. The old deposit is moved to a renewed status rather than being retroactively edited.',
    'A positive-interest renewal may fail when VaultManager lacks the required interest funding.',
    'Review the timing window, vault state, and enabled plan before submitting a renewal yourself.',
  )
}

function buildPendingInterestAnswer(
  context: BankingAssistantContext,
  question: string,
  language: 'vi' | 'en',
): AssistantAnswer {
  const referencedDepositId =
    extractReferencedId(
      question,
      'deposit',
    )

  const claim =
    referencedDepositId === null
      ? context.pendingInterestClaims[0] ??
        null
      : context.pendingInterestClaims.find(
          (item) =>
            item.depositId ===
            referencedDepositId,
        ) ?? null

  if (claim === null) {
    return language === 'vi'
      ? answer(
          language,
          'Snapshot hiện tại không có khoản lãi hoãn trả nào được gán cho ví này.',
          'Lãi hoãn trả chỉ xuất hiện khi settlement trả tiền gốc trước và ghi nhận phần lãi chưa thanh toán cho claimant.',
          'Không có claim trong snapshot hiện tại không phải là cam kết rằng vault luôn đủ vốn.',
          'Làm mới danh mục sau các giao dịch settlement hoặc sau khi vault được bổ sung vốn.',
        )
      : answer(
          language,
          'The current snapshot contains no deferred-interest claim assigned to this wallet.',
          'Deferred interest appears when settlement returns principal first and records unpaid interest for a claimant.',
          'No claim in the current snapshot is not a guarantee that the vault is always fully funded.',
          'Refresh the portfolio after settlement transactions or after the vault is funded.',
        )
  }

  if (language === 'vi') {
    return answer(
      language,
      `Khoản gửi #${claim.depositId} có ${claim.amount} lãi đang chờ, được gán cho claimant ${claim.claimant}.`,
      'Claimant được snapshot trong mapping on-chain tại thời điểm lãi bị hoãn; việc chuyển NFT sau đó không tự chuyển quyền claim này.',
      'Khả năng nhận lãi còn phụ thuộc trạng thái pause và nguồn tiền hiện tại của VaultManager.',
      'Kiểm tra mục Các khoản lãi hoãn trả và tự dùng nút Nhận lãi khi giao diện đánh dấu có thể nhận.',
    )
  }

  return answer(
    language,
    `Deposit #${claim.depositId} has ${claim.amount} pending interest assigned to claimant ${claim.claimant}.`,
    'The claimant is snapshotted in the on-chain mapping when interest is deferred; transferring the NFT later does not automatically transfer this claim.',
    'Claim availability also depends on pause state and current VaultManager funding.',
    'Review Deferred-interest claims and use the claim button yourself when the interface marks it available.',
  )
}

function buildVaultAnswer(
  context: BankingAssistantContext,
  language: 'vi' | 'en',
): AssistantAnswer {
  const vault = context.vault

  if (language === 'vi') {
    return answer(
      language,
      `VaultManager: số dư ${vault.vaultBalance}, lãi dự trữ ${vault.totalReservedInterest}, thanh khoản khả dụng ${vault.availableLiquidity}, thiếu hụt ${vault.fundingShortfall}. Trạng thái thiếu vốn: ${vault.isUnderfunded ? 'có' : 'không theo snapshot hiện tại'}.`,
      vault.isUnderfunded
        ? 'Funding shortfall lớn hơn 0 cho biết số dư vault chưa bao phủ toàn bộ nghĩa vụ lãi dự trữ. Khi đó settlement có thể ghi nhận lãi để nhận sau theo C1.'
        : 'Funding shortfall đang bằng 0, nghĩa là số dư vault hiện bao phủ toàn bộ nghĩa vụ lãi dự trữ theo công thức kế toán của hợp đồng.',
      'Funding shortfall chỉ phản ánh snapshot kế toán hiện tại, không phải bảo đảm chuyên môn về khả năng thanh toán trong tương lai.',
      'Làm mới trạng thái vault trước khi tự thực hiện rút khi đáo hạn hoặc tái tục.',
    )
  }

  return answer(
    language,
    `VaultManager: balance ${vault.vaultBalance}, reserved interest ${vault.totalReservedInterest}, available liquidity ${vault.availableLiquidity}, and funding shortfall ${vault.fundingShortfall}. Underfunded: ${vault.isUnderfunded ? 'yes' : 'not in the current snapshot'}.`,
    vault.isUnderfunded
      ? 'A funding shortfall above zero means the vault balance does not cover all reserved-interest obligations. Settlement may then record interest for later claiming under C1.'
      : 'A zero funding shortfall means the current vault balance covers all reserved-interest obligations according to the contract accounting formula.',
    'Funding shortfall only describes the current accounting snapshot. It is not a professional guarantee of future solvency.',
    'Refresh the vault state before choosing maturity withdrawal or renewal yourself.',
  )
}

function generateBankingAnswer(
  context: BankingAssistantContext,
  question: string,
  language: 'vi' | 'en',
): AssistantAnswer {
  switch (
    classifyBankingIntent(question)
  ) {
    case 'plan':
      return buildPlanAnswer(
        context,
        question,
        language,
      )
    case 'apr':
      return buildAprAnswer(
        context,
        question,
        language,
      )
    case 'penalty':
      return buildPenaltyAnswer(
        context,
        question,
        language,
      )
    case 'deposit':
      return buildDepositAnswer(
        context,
        question,
        language,
      )
    case 'maturity':
      return buildMaturityAnswer(
        context,
        question,
        language,
      )
    case 'renewal':
      return buildRenewalAnswer(
        context,
        question,
        language,
      )
    case 'pending-interest':
      return buildPendingInterestAnswer(
        context,
        question,
        language,
      )
    case 'vault':
      return buildVaultAnswer(
        context,
        language,
      )
    case 'overview':
      return buildOverviewAnswer(
        context,
        language,
      )
  }
}

export const bankingAssistantClient:
  AssistantClient<BankingAssistantContext> = {
    async ask(request, signal) {
      throwIfAborted(signal)

      const question =
        requireAssistantQuestion(
          request.question,
        )

      const response =
        generateBankingAnswer(
          request.context,
          question,
          request.language,
        )

      throwIfAborted(signal)

      return response
    },
  }