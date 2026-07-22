export const translations = {
  vi: {
    heroTitle:
      'Bảng điều khiển tiết kiệm on-chain của bạn',
    heroDescription:
      'Khám phá các gói tiết kiệm có kỳ hạn và theo dõi SafeBank trực tiếp trên Ethereum Sepolia.',
    testnetTitle:
      'Chỉ dành cho mục đích minh họa trên testnet.',
    testnetDescription:
      'mUSDC và Sepolia ETH không có giá trị thực. Không sử dụng ví đang lưu giữ tài sản có giá trị.',
    language:
      'Ngôn ngữ',
    vietnamese:
      'Tiếng Việt',
    english:
      'English',
    applicationNavigation:
      'Điều hướng ứng dụng',
    userPortal:
      'Người dùng',
    adminPortal:
      'Quản trị',
    adminHeroTitle:
      'Bảng điều khiển quản trị SafeBank',
    adminHeroDescription:
      'Theo dõi cấu hình, thanh khoản và trạng thái vận hành của SafeBank trực tiếp trên Ethereum Sepolia.',
    adminOverviewDescription:
      'Dữ liệu công khai được đọc trực tiếp từ các hợp đồng SavingCore và VaultManager.',
    adminLoading:
      'Đang tải dữ liệu quản trị Sepolia',
    adminLoadError:
      'Không thể tải dữ liệu quản trị.',
    adminRetry:
      'Thử tải lại',
    adminPlanCount:
      'Tổng số gói',
    adminDepositCount:
      'Tổng số khoản gửi',
    adminVaultBalance:
      'Số dư VaultManager',
    adminConfigurationEyebrow:
      'Cấu hình on-chain',
    adminConfigurationHeading:
      'Cấu hình và phân quyền',
    adminConfigurationDescription:
      'Kiểm tra owner, trạng thái pause và các quan hệ contract đang được lưu trên Sepolia.',
    adminConfigurationWarning:
      'Ít nhất một quan hệ contract không khớp với deployment đã đồng bộ.',
    adminOwner:
      'Owner hiện tại',
    adminPendingOwner:
      'Pending owner',
    adminConnectedWalletRole:
      'Quyền của ví đang kết nối',
    adminOwnerAccess:
      'Quyền owner',
    adminReadOnlyAccess:
      'Chỉ đọc',
    adminFeeReceiver:
      'Địa chỉ nhận phí',
    adminNone:
      'Không có',
    adminActive:
      'Đang hoạt động',
    adminPaused:
      'Đang tạm dừng',
    adminRelationshipsHeading:
      'Quan hệ contract',
    adminRelationshipMatched:
      'Khớp',
    adminRelationshipMismatch:
      'Không khớp',
    adminVaultEyebrow:
      'Thanh khoản C2',
    adminVaultHeading:
      'Trạng thái VaultManager',
    adminVaultDescription:
      'Theo dõi quỹ lãi, phần dự trữ và thanh khoản có thể rút mà không sử dụng tiền gốc của người gửi.',
    adminVaultHealthy:
      'Đủ thanh khoản',
    adminVaultUnderfunded:
      'Thiếu thanh khoản',
    adminVaultUnderfundedWarning:
      'VaultManager hiện không đủ để bảo đảm toàn bộ phần lãi đã dự trữ.',
    adminReservedInterest:
      'Tổng lãi đã dự trữ',
    adminAvailableLiquidity:
      'Thanh khoản khả dụng',
    adminFundingShortfall:
      'Phần thiếu hụt',
    adminConnectedWalletLiquidity:
      'Nguồn tiền của ví đang kết nối',
    adminWalletBalance:
      'Số dư mUSDC của ví',
    adminVaultAllowance:
      'Allowance dành cho VaultManager',
    adminWalletDisconnected:
      'Kết nối ví để xem số dư và allowance.',
    adminPlansEyebrow:
      'Danh mục sản phẩm',
    adminPlansHeading:
      'Quản lý saving plan',
    adminPlansDescription:
      'Theo dõi toàn bộ gói tiết kiệm, bao gồm cả các gói đang tắt. Các thay đổi chỉ có hiệu lực khi được owner của SavingCore ký.',
    adminEnablePlan:
      'Bật saving plan',
    adminDisablePlan:
      'Tắt saving plan',
    adminPlanUpdating:
      'Đang cập nhật plan...',
    adminPlanStatusUpdate:
      'Cập nhật trạng thái saving plan',
    adminConnectWalletAction:
      'Kết nối ví để thực hiện hành động quản trị.',
    adminSwitchSepoliaAction:
      'Chuyển ví sang Ethereum Sepolia để tiếp tục.',
    adminSavingCoreOwnerRequired:
      'Chỉ SavingCore owner mới có thể thực hiện hành động này.',
    adminNewApr:
      'APR mới',
    adminUpdateApr:
      'Cập nhật APR',
    adminAprUpdate:
      'Cập nhật APR saving plan',
    adminAprFormatError:
      'Nhập APR hợp lệ với tối đa hai chữ số thập phân.',
    adminAprRangeError:
      'APR phải nằm trong khoảng 0,01% đến 100%.',
    adminAprUnchanged:
      'Nhập APR khác với giá trị hiện tại.',
    adminCreatePlanHeading:
      'Tạo saving plan mới',
    adminCreatePlanDescription:
      'Các giá trị được ghi trực tiếp vào SavingCore sau khi owner xác nhận giao dịch.',
    adminPlanTenorDays:
      'Kỳ hạn (ngày)',
    adminPlanAprPercent:
      'APR (%)',
    adminMinimumDeposit:
      'Tiền gửi tối thiểu (mUSDC)',
    adminMaximumDeposit:
      'Tiền gửi tối đa (mUSDC)',
    adminEarlyPenaltyPercent:
      'Phạt rút sớm (%)',
    adminEnablePlanInitially:
      'Bật plan ngay sau khi tạo',
    adminCreatePlan:
      'Tạo plan',
    adminCreatingPlan:
      'Đang tạo plan...',
    adminCreatePlanTransaction:
      'Tạo saving plan',
    adminCreatePlanTenorError:
      'Kỳ hạn phải là số nguyên từ 1 đến 3650 ngày.',
    adminCreatePlanAmountError:
      'Nhập số tiền mUSDC hợp lệ với tối đa 6 chữ số thập phân.',
    adminCreatePlanDepositRangeError:
      'Tiền gửi tối đa phải lớn hơn hoặc bằng mức tối thiểu dương.',
    adminCreatePlanPenaltyError:
      'Mức phạt phải nằm trong khoảng 0% đến 100% và có tối đa hai chữ số thập phân.',
    adminVaultManagerOwnerRequired:
      'Chỉ VaultManager owner mới có thể thực hiện hành động này.',
    adminVaultFundingHeading:
      'Nạp quỹ lãi',
    adminVaultFundingDescription:
      'Approve đúng số tiền cho VaultManager, sau đó gửi giao dịch fundVault riêng biệt.',
    adminVaultFundingAmount:
      'Số tiền nạp (mUSDC)',
    adminApproveVaultFunding:
      'Approve đúng số tiền',
    adminApprovingVaultFunding:
      'Đang approve...',
    adminFundVault:
      'Nạp VaultManager',
    adminFundingVault:
      'Đang nạp quỹ...',
    adminVaultFundingApproval:
      'Approve mUSDC cho VaultManager',
    adminVaultFundingTransaction:
      'Nạp quỹ VaultManager',
    adminVaultAmountPositive:
      'Số tiền nạp phải lớn hơn 0.',
    adminVaultAmountInvalid:
      'Nhập số tiền mUSDC hợp lệ với tối đa 6 chữ số thập phân.',
    adminVaultInsufficientBalance:
      'Ví đang kết nối không có đủ mUSDC.',
    adminVaultWithdrawHeading:
      'Rút thanh khoản khả dụng',
    adminVaultWithdrawDescription:
      'Chỉ rút phần vượt ngoài nghĩa vụ lãi đã dự trữ. Tiền được chuyển cho VaultManager owner hiện tại.',
    adminVaultWithdrawAmount:
      'Số tiền rút (mUSDC)',
    adminWithdrawVault:
      'Rút thanh khoản khả dụng',
    adminWithdrawingVault:
      'Đang rút thanh khoản...',
    adminVaultWithdrawTransaction:
      'Rút tiền từ VaultManager',
    adminVaultWithdrawPositive:
      'Số tiền rút phải lớn hơn 0.',
    adminVaultWithdrawExceedsAvailable:
      'Số tiền rút không được vượt quá thanh khoản khả dụng.',
    adminVaultWithdrawPaused:
      'Hãy unpause VaultManager trước khi rút thanh khoản.',
    adminFeeReceiverUpdateHeading:
      'Cập nhật fee receiver',
    adminFeeReceiverUpdateDescription:
      'Địa chỉ mới sẽ nhận các khoản phí do VaultManager phân phối.',
    adminNewFeeReceiver:
      'Fee receiver mới',
    adminUpdateFeeReceiver:
      'Cập nhật fee receiver',
    adminUpdatingFeeReceiver:
      'Đang cập nhật...',
    adminFeeReceiverTransaction:
      'Cập nhật fee receiver',
    adminFeeReceiverInvalid:
      'Nhập địa chỉ Ethereum hợp lệ.',
    adminFeeReceiverZeroError:
      'Fee receiver không được là zero address.',
    adminFeeReceiverUnchanged:
      'Nhập địa chỉ khác fee receiver hiện tại.',
    adminContractCurrentlyPaused:
      'Contract hiện đang tạm dừng.',
    adminContractCurrentlyActive:
      'Contract hiện đang hoạt động.',
    adminPauseContract:
      'Pause contract',
    adminUnpauseContract:
      'Unpause contract',
    adminUpdatingPauseState:
      'Đang cập nhật trạng thái...',
    adminPauseStateTransaction:
      'cập nhật trạng thái pause',
    adminDepositInspectionKicker:
      'Tra cứu on-chain',
    adminDepositInspectionHeading:
      'Kiểm tra khoản tiền gửi',
    adminDepositInspectionDescription:
      'Nhập deposit ID để đọc snapshot trực tiếp từ SavingCore. Chức năng này hoàn toàn chỉ đọc.',
    adminDepositId:
      'Deposit ID',
    adminDepositSearch:
      'Tra cứu deposit',
    adminDepositSearching:
      'Đang tra cứu...',
    adminDepositLoading:
      'Đang đọc dữ liệu deposit từ Sepolia...',
    adminDepositIdError:
      'Deposit ID phải là số nguyên dương.',
    adminDepositReadError:
      'Không thể đọc deposit. Hãy kiểm tra ID và thử lại.',
    adminDepositResult:
      'Deposit',
    adminDepositPlanId:
      'Plan ID',
    adminDepositStartedAt:
      'Thời điểm bắt đầu',
    adminDepositMaturityAt:
      'Thời điểm đáo hạn',
    adminDepositStatusActive:
      'Đang hoạt động',
    adminDepositStatusWithdrawn:
      'Đã rút',
    adminDepositStatusManualRenewed:
      'Đã tái tục thủ công',
    adminDepositStatusAutoRenewed:
      'Đã tự động tái tục',
    adminDepositStatusUnknown:
      'Không xác định',
    walletEyebrow:
      'Ví trình duyệt',
    walletHeading:
      'Kết nối ví',
    walletStatusChecking:
      'Đang kiểm tra',
    walletStatusUnavailable:
      'Không khả dụng',
    walletStatusDisconnected:
      'Chưa kết nối',
    walletStatusConnected:
      'Đã kết nối',
    walletChecking:
      'Đang kiểm tra ví trình duyệt EIP-1193…',
    walletUnavailableTitle:
      'Không phát hiện ví trình duyệt',
    walletUnavailableBody:
      'Cài đặt hoặc bật ví EIP-1193 như MetaMask để thực hiện giao dịch SafeBank. Bạn vẫn có thể xem dữ liệu công khai trên Sepolia mà không cần kết nối.',
    walletDisconnectedTitle:
      'Ví của bạn chưa được kết nối',
    walletDisconnectedBody:
      'Kết nối ví để xem số dư mUSDC, hạn mức đã cấp và các khoản tiền gửi thuộc sở hữu của bạn.',
    walletWaiting:
      'Đang chờ ví…',
    walletConnect:
      'Kết nối ví',
    connectedAccount:
      'Tài khoản đã kết nối',
    walletChainId:
      'Chain ID của ví',
    unknown:
      'Không xác định',
    wrongNetwork:
      'Sai mạng',
    wrongNetworkBody:
      'SafeBank được triển khai trên Ethereum Sepolia. Các giao dịch thay đổi trạng thái sẽ bị vô hiệu hóa cho đến khi ví chuyển sang đúng mạng.',
    switchingNetwork:
      'Đang chuyển mạng…',
    switchToSepolia:
      'Chuyển sang Sepolia',
    contractsEyebrow:
      'Triển khai công khai đã xác minh',
    contractsHeading:
      'Hợp đồng trên Sepolia',
    view:
      'Xem',
    viewSource:
      'Xem mã nguồn',
    onEtherscan:
      'trên Etherscan',
    contractsNotice:
      'Việc xác minh mã nguồn giúp tăng tính minh bạch nhưng không thay thế kiểm toán bảo mật chuyên nghiệp.',
    loadingState:
      'Đang tải trạng thái Sepolia',
    loadingDescription:
      'Đang đọc các gói tiết kiệm, trạng thái giao thức và dữ liệu vault trực tiếp từ các hợp đồng đã triển khai.',
    loadErrorTitle:
      'Không thể tải trạng thái SafeBank',
    publicStateUnavailable:
      'Dữ liệu công khai trên Sepolia hiện không khả dụng.',
    retryPublicReads:
      'Thử tải lại dữ liệu',
    faucetMinting:
      'Đang tạo mUSDC thử nghiệm…',
    faucetMint:
      'Nhận 1.000 mUSDC thử nghiệm',
    faucetDescription:
      'Faucet công khai trên Sepolia. Token thử nghiệm không có giá trị thực.',
    faucetSuccess:
      'Đã nhận mUSDC thử nghiệm thành công.',
    openDepositEyebrow:
      'Giao dịch người dùng',
    openDepositHeading:
      'Mở khoản tiết kiệm có kỳ hạn',
    openDepositDescription:
      'Phê duyệt token và mở khoản gửi là hai giao dịch riêng biệt. SafeBank không yêu cầu hạn mức token không giới hạn.',
    savingPlan:
      'Gói tiết kiệm',
    noEnabledPlans:
      'Không có gói đang hoạt động',
    plan:
      'Gói',
    days:
      'ngày',
    depositAmount:
      'Số tiền gửi',
    depositAmountHelp:
      'Nhập số thập phân có không quá 6 chữ số sau dấu phẩy.',
    allowedRange:
      'Khoảng cho phép',
    estimatedInterest:
      'Tiền lãi ước tính',
    connectBeforeDeposit:
      'Hãy kết nối ví trước khi phê duyệt hoặc mở khoản gửi.',
    switchBeforeTransaction:
      'Chuyển ví sang Ethereum Sepolia trước khi gửi giao dịch.',
    savingCorePaused:
      'SavingCore đang tạm dừng. Hiện không thể mở khoản gửi mới.',
    approvingMusdc:
      'Đang phê duyệt mUSDC…',
    approveExactMusdc:
      'Phê duyệt đúng số lượng mUSDC',
    openingDeposit:
      'Đang mở khoản gửi…',
    openDeposit:
      'Mở khoản gửi',
    musdcApproval:
      'Phê duyệt mUSDC',
    depositOpening:
      'Mở khoản gửi',
    transactionAwaitingSignature:
      'Xác nhận yêu cầu trong ví.',
    transactionSubmitted:
      'Giao dịch đã được gửi.',
    transactionConfirming:
      'Đang chờ xác nhận giao dịch.',
    transactionConfirmed:
      'Giao dịch đã được xác nhận.',
    transactionFailed:
      'Giao dịch thất bại.',
    viewTransaction:
      'Xem giao dịch trên Etherscan',
    portfolioEyebrow:
      'Danh mục',
    portfolioHeading:
      'Các khoản tiền gửi có kỳ hạn',
    portfolioConnect:
      'Kết nối ví để xem chứng chỉ tiền gửi và các khoản lãi hoãn trả.',
    portfolioLoading:
      'Đang tải danh mục SafeBank của bạn…',
    portfolioLoadError:
      'Không thể tải danh mục của bạn.',
    portfolioUnavailable:
      'Dữ liệu danh mục hiện không khả dụng.',
    certificate:
      'chứng chỉ',
    certificates:
      'chứng chỉ',
    portfolioPaused:
      'SavingCore đang tạm dừng. Các thao tác tài chính tạm thời không khả dụng, nhưng dữ liệu danh mục vẫn được hiển thị.',
    noOwnedCertificates:
      'Ví này hiện không sở hữu chứng chỉ tiền gửi SafeBank nào.',
    depositCertificate:
      'Chứng chỉ tiền gửi',
    nftCertificate:
      'Chứng chỉ NFT',
    deposit:
      'Khoản gửi',
    principal:
      'Tiền gốc',
    aprAtOpening:
      'APR khi mở',
    earlyPenalty:
      'Phí rút trước hạn',
    started:
      'Ngày bắt đầu',
    maturity:
      'Ngày đáo hạn',
    graceEnds:
      'Kết thúc thời gian gia hạn',
    currentlyAvailable:
      'Hiện có thể thực hiện',
    noLifecycleAction:
      'Hiện không có thao tác vòng đời nào khả dụng.',
    actionEarlyWithdrawal:
      'Rút trước hạn',
    actionMaturityWithdrawal:
      'Rút khi đáo hạn',
    actionManualRenewal:
      'Tái tục thủ công',
    actionAutoRenewal:
      'Tái tục tự động',
    depositStatusActive:
      'Đang hoạt động',
    depositStatusWithdrawn:
      'Đã rút',
    depositStatusManualRenewed:
      'Đã tái tục thủ công',
    depositStatusAutoRenewed:
      'Đã tái tục tự động',
    lifecycleAwaitingSignature:
      'Xác nhận thao tác vòng đời trong ví.',
    lifecycleSubmitted:
      'Giao dịch vòng đời đã được gửi.',
    lifecycleConfirmed:
      'Giao dịch vòng đời đã được xác nhận.',
    lifecycleFailed:
      'Giao dịch vòng đời thất bại.',
    lifecycleAction:
      'Thao tác vòng đời khoản gửi',
    renewalPlan:
      'Gói tái tục',
    selectRenewalPlan:
      'Hãy chọn một gói tái tục đang hoạt động.',
    noRenewalPlan:
      'Không có gói tiết kiệm đang hoạt động để tái tục thủ công.',
    earlyWithdrawDeposit:
      'Rút trước hạn khoản gửi',
    maturityWithdrawDeposit:
      'Rút khoản gửi khi đáo hạn',
    manualRenewDeposit:
      'Tái tục thủ công khoản gửi',
    automaticRenewDeposit:
      'Tái tục tự động khoản gửi',
    withdrawingEarly:
      'Đang rút trước hạn…',
    withdrawEarly:
      'Rút trước hạn',
    withdrawingAtMaturity:
      'Đang rút khoản gửi…',
    withdrawAtMaturity:
      'Rút khi đáo hạn',
    renewingDeposit:
      'Đang tái tục khoản gửi…',
    renewManually:
      'Tái tục thủ công',
    autoRenewingDeposit:
      'Đang tái tục tự động…',
    autoRenew:
      'Tái tục tự động',
    principalFirstSettlement:
      'Thanh toán tiền gốc trước',
    deferredInterestClaims:
      'Các khoản lãi hoãn trả',
    deferredInterestDescription:
      'Các khoản này được xác định theo claimant mapping hiện tại trên chuỗi và có thể vẫn tồn tại khi ví không còn sở hữu chứng chỉ NFT ban đầu.',
    noDeferredInterest:
      'Không có khoản lãi hoãn trả chưa thanh toán nào được gán cho ví này.',
    deferredInterestForDeposit:
      'Lãi hoãn trả của khoản gửi',
    interestPending:
      'mUSDC đang chờ',
    claimAvailable:
      'Có thể nhận',
    claimUnavailable:
      'Chưa thể nhận',
    claimPendingInterest:
      'Nhận lãi đang chờ của khoản gửi',
    claimingInterest:
      'Đang nhận lãi…',
    claimDeferredInterest:
      'Nhận lãi hoãn trả',
    switchBeforeClaim:
      'Chuyển ví sang Ethereum Sepolia trước khi nhận khoản lãi này.',
    claimsPaused:
      'SavingCore đang tạm dừng. Các thao tác nhận lãi hoãn trả tạm thời không khả dụng.',
    deferredInterestClaim:
      'Nhận lãi hoãn trả',
    claimAwaitingSignature:
      'Xác nhận thao tác nhận lãi trong ví.',
    claimSubmitted:
      'Yêu cầu nhận lãi đã được gửi.',
    claimConfirming:
      'Đang chờ xác nhận yêu cầu nhận lãi.',
    claimConfirmed:
      'Đã nhận lãi hoãn trả thành công.',
    claimFailed:
      'Yêu cầu nhận lãi hoãn trả thất bại.',
    liveContractReads:
      'Dữ liệu trực tiếp từ hợp đồng',
    protocolStatus:
      'Trạng thái giao thức',
    refreshState:
      'Làm mới trạng thái',
    protocolSavingPlans:
      'Số gói tiết kiệm',
    totalDeposits:
      'Tổng số khoản gửi',
    protocolPaused:
      'Tạm dừng',
    protocolActive:
      'Đang hoạt động',
    latestBlockTimestamp:
      'Dấu thời gian block mới nhất',
    gracePeriod:
      'Thời gian gia hạn',
    accountEyebrow:
      'Ví đã kết nối',
    musdcAccountHeading:
      'Tài khoản mUSDC',
    accountConnectDescription:
      'Kết nối ví để đọc số dư mUSDC và hạn mức phê duyệt chính xác cho SavingCore.',
    accountMusdcBalance:
      'Số dư mUSDC',
    accountSavingCoreAllowance:
      'Hạn mức cho SavingCore',
    musdcTestTokenNotice:
      'mUSDC là token thử nghiệm công khai có 6 chữ số thập phân và không có giá trị thực tế.',
    termDeposits:
      'Tiền gửi có kỳ hạn',
    savingPlansHeading:
      'Các gói tiết kiệm',
    noSavingPlans:
      'Hiện không có gói tiết kiệm nào khả dụng.',
    planTerm:
      'Kỳ hạn',
    planEnabled:
      'Đang hoạt động',
    planDisabled:
      'Không hoạt động',
    depositRange:
      'Khoảng tiền gửi',
    c2Transparency:
      'Minh bạch C2',
    interestVaultHeading:
      'Kho lãi suất',
    vaultBalance:
      'Số dư kho lãi',
    reservedInterest:
      'Lãi đã dự trữ',
    availableLiquidity:
      'Thanh khoản khả dụng',
    fundingShortfall:
      'Phần thiếu hụt nguồn vốn',
    interestVaultUnderfunded:
      'Kho lãi chưa đủ vốn',
    underfundedDescription:
      'Việc thanh toán khi đáo hạn có thể hoãn trả lãi theo C1, và tái tục có lãi dương có thể thất bại cho đến khi kho được bổ sung vốn.',
    zeroShortfallNotice:
      'Mức thiếu hụt bằng 0 chỉ là ảnh chụp kế toán, không phải cam kết chuyên môn về khả năng thanh toán.',
    connectedToSepolia:
      'Đã kết nối với Ethereum Sepolia.',
    dismissWalletError:
      'Đóng thông báo lỗi ví',
    lifecycleTimingDescription:
      'Khả năng thực hiện các thao tác vòng đời được tính theo dấu thời gian của block Sepolia mới nhất, không theo đồng hồ trên thiết bị của bạn.',
    openErrorPlanRequired:
      'Hãy chọn một gói tiết kiệm đang hoạt động.',
    openErrorPlanDisabled:
      'Gói tiết kiệm đã chọn hiện đang bị vô hiệu hóa.',
    openErrorInvalidAmount:
      'Nhập số tiền mUSDC hợp lệ với tối đa 6 chữ số thập phân.',
    openErrorAmountNotPositive:
      'Số tiền gửi phải lớn hơn 0.',
    openErrorBelowMinimum:
      'Số tiền thấp hơn mức gửi tối thiểu của gói này.',
    openErrorAboveMaximum:
      'Số tiền vượt quá mức gửi tối đa của gói này.',
    openErrorInsufficientBalance:
      'Ví đang kết nối không có đủ mUSDC.',
    transactionErrorRejected:
      'Bạn đã từ chối giao dị trong ví.',
    transactionErrorUnknown:
      'Giao dị thất bại do nguyên nhân không xác định.',
    transactionErrorInvalidHash:
      'Ví trả về mã giao dị không hợp lệ.',
    transactionErrorReceiptUnavailable:
      'Không thể tải biên nhận giao dị.',
    transactionErrorMinedReverted:
      'Giao dị đã được ghi vào block nhưng bị hoàn tác.',
    walletErrorRequestRejected:
      'Bạn đã từ chối yêu cầu trong ví.',
    walletErrorReadState:
      'Không thể đọc trạng thái ví trên trình duyệt.',
    walletErrorNotDetected:
      'Không phát hiện ví trình duyệt hỗ trợ EIP-1193.',
    walletErrorConnect:
      'Không thể kết nối ví trình duyệt.',
    walletErrorSwitchSepolia:
      'Không thể chuyển sang Ethereum Sepolia.',
    walletErrorConnectBeforeTransaction:
      'Hãy kết nối ví trước khi gửi giao dị.',
    walletErrorSwitchBeforeTransaction:
      'Hãy chuyển ví sang Ethereum Sepolia trước khi gửi giao dị.',
    safeBankReadErrorFallback:
      'Không thể tải dữ liệu SafeBank từ Ethereum Sepolia.',
  },
  en: {
    heroTitle:
      'Your on-chain savings dashboard',
    heroDescription:
      'Explore term-deposit plans and monitor SafeBank directly on Ethereum Sepolia.',
    testnetTitle:
      'Testnet demonstration only.',
    testnetDescription:
      'mUSDC and Sepolia ETH have no real-world value. Do not use a wallet holding valuable assets.',
    language:
      'Language',
    vietnamese:
      'Vietnamese',
    english:
      'English',
    applicationNavigation:
      'Application navigation',
    userPortal:
      'User banking',
    adminPortal:
      'Administration',
    adminHeroTitle:
      'SafeBank administration dashboard',
    adminHeroDescription:
      'Monitor SafeBank configuration, liquidity and operational status directly on Ethereum Sepolia.',
    adminOverviewDescription:
      'Public data is read directly from the SavingCore and VaultManager contracts.',
    adminLoading:
      'Loading Sepolia administration data',
    adminLoadError:
      'Unable to load administration data.',
    adminRetry:
      'Try again',
    adminPlanCount:
      'Total plans',
    adminDepositCount:
      'Total deposits',
    adminVaultBalance:
      'VaultManager balance',
    adminConfigurationEyebrow:
      'On-chain configuration',
    adminConfigurationHeading:
      'Configuration and authorization',
    adminConfigurationDescription:
      'Inspect contract owners, pause states and stored Sepolia relationships.',
    adminConfigurationWarning:
      'At least one contract relationship does not match the synchronized deployment.',
    adminOwner:
      'Current owner',
    adminPendingOwner:
      'Pending owner',
    adminConnectedWalletRole:
      'Connected wallet access',
    adminOwnerAccess:
      'Owner access',
    adminReadOnlyAccess:
      'Read-only',
    adminFeeReceiver:
      'Fee receiver',
    adminNone:
      'None',
    adminActive:
      'Active',
    adminPaused:
      'Paused',
    adminRelationshipsHeading:
      'Contract relationships',
    adminRelationshipMatched:
      'Matched',
    adminRelationshipMismatch:
      'Mismatch',
    adminVaultEyebrow:
      'C2 liquidity',
    adminVaultHeading:
      'VaultManager status',
    adminVaultDescription:
      'Monitor the interest vault, reserved obligations and liquidity withdrawable without using depositor principal.',
    adminVaultHealthy:
      'Healthy',
    adminVaultUnderfunded:
      'Underfunded',
    adminVaultUnderfundedWarning:
      'VaultManager does not fully cover reserved interest obligations.',
    adminReservedInterest:
      'Reserved interest',
    adminAvailableLiquidity:
      'Available liquidity',
    adminFundingShortfall:
      'Funding shortfall',
    adminConnectedWalletLiquidity:
      'Connected wallet funding source',
    adminWalletBalance:
      'Wallet mUSDC balance',
    adminVaultAllowance:
      'VaultManager allowance',
    adminWalletDisconnected:
      'Connect a wallet to view balance and allowance.',
    adminPlansEyebrow:
      'Product catalogue',
    adminPlansHeading:
      'Saving plan management',
    adminPlansDescription:
      'Inspect every saving plan, including disabled plans. Changes require a transaction signed by the SavingCore owner.',
    adminEnablePlan:
      'Enable plan',
    adminDisablePlan:
      'Disable plan',
    adminPlanUpdating:
      'Updating plan...',
    adminPlanStatusUpdate:
      'Saving plan status update',
    adminConnectWalletAction:
      'Connect a wallet to perform this admin action.',
    adminSwitchSepoliaAction:
      'Switch the wallet to Ethereum Sepolia to continue.',
    adminSavingCoreOwnerRequired:
      'Only the SavingCore owner can perform this action.',
    adminNewApr:
      'New APR',
    adminUpdateApr:
      'Update APR',
    adminAprUpdate:
      'Saving plan APR update',
    adminAprFormatError:
      'Enter a valid APR with at most two decimal places.',
    adminAprRangeError:
      'APR must be between 0.01% and 100%.',
    adminAprUnchanged:
      'Enter an APR different from the current value.',
    adminCreatePlanHeading:
      'Create a new saving plan',
    adminCreatePlanDescription:
      'Values are written directly to SavingCore after the owner confirms the transaction.',
    adminPlanTenorDays:
      'Tenor (days)',
    adminPlanAprPercent:
      'APR (%)',
    adminMinimumDeposit:
      'Minimum deposit (mUSDC)',
    adminMaximumDeposit:
      'Maximum deposit (mUSDC)',
    adminEarlyPenaltyPercent:
      'Early withdrawal penalty (%)',
    adminEnablePlanInitially:
      'Enable the plan immediately',
    adminCreatePlan:
      'Create plan',
    adminCreatingPlan:
      'Creating plan...',
    adminCreatePlanTransaction:
      'Saving plan creation',
    adminCreatePlanTenorError:
      'Tenor must be an integer from 1 to 3650 days.',
    adminCreatePlanAmountError:
      'Enter a valid mUSDC amount with at most 6 decimal places.',
    adminCreatePlanDepositRangeError:
      'Maximum deposit must be greater than or equal to the positive minimum deposit.',
    adminCreatePlanPenaltyError:
      'Penalty must be between 0% and 100% with at most two decimal places.',
    adminVaultManagerOwnerRequired:
      'Only the VaultManager owner can perform this action.',
    adminVaultFundingHeading:
      'Fund the interest vault',
    adminVaultFundingDescription:
      'Approve the exact amount for VaultManager, then submit a separate fundVault transaction.',
    adminVaultFundingAmount:
      'Funding amount (mUSDC)',
    adminApproveVaultFunding:
      'Approve exact amount',
    adminApprovingVaultFunding:
      'Approving...',
    adminFundVault:
      'Fund VaultManager',
    adminFundingVault:
      'Funding vault...',
    adminVaultFundingApproval:
      'VaultManager mUSDC approval',
    adminVaultFundingTransaction:
      'VaultManager funding',
    adminVaultAmountPositive:
      'Funding amount must be greater than zero.',
    adminVaultAmountInvalid:
      'Enter a valid mUSDC amount with at most 6 decimal places.',
    adminVaultInsufficientBalance:
      'The connected wallet does not have enough mUSDC.',
    adminVaultWithdrawHeading:
      'Withdraw available liquidity',
    adminVaultWithdrawDescription:
      'Withdraw only funds exceeding reserved interest obligations. Funds are sent to the current VaultManager owner.',
    adminVaultWithdrawAmount:
      'Withdrawal amount (mUSDC)',
    adminWithdrawVault:
      'Withdraw available liquidity',
    adminWithdrawingVault:
      'Withdrawing liquidity...',
    adminVaultWithdrawTransaction:
      'VaultManager withdrawal',
    adminVaultWithdrawPositive:
      'Withdrawal amount must be greater than zero.',
    adminVaultWithdrawExceedsAvailable:
      'Withdrawal cannot exceed available liquidity.',
    adminVaultWithdrawPaused:
      'Unpause VaultManager before withdrawing liquidity.',
    adminFeeReceiverUpdateHeading:
      'Update fee receiver',
    adminFeeReceiverUpdateDescription:
      'The new address will receive fees distributed by VaultManager.',
    adminNewFeeReceiver:
      'New fee receiver',
    adminUpdateFeeReceiver:
      'Update fee receiver',
    adminUpdatingFeeReceiver:
      'Updating...',
    adminFeeReceiverTransaction:
      'Fee receiver update',
    adminFeeReceiverInvalid:
      'Enter a valid Ethereum address.',
    adminFeeReceiverZeroError:
      'Fee receiver must not be the zero address.',
    adminFeeReceiverUnchanged:
      'Enter an address different from the current fee receiver.',
    adminContractCurrentlyPaused:
      'The contract is currently paused.',
    adminContractCurrentlyActive:
      'The contract is currently active.',
    adminPauseContract:
      'Pause contract',
    adminUnpauseContract:
      'Unpause contract',
    adminUpdatingPauseState:
      'Updating pause state...',
    adminPauseStateTransaction:
      'pause-state update',
    adminDepositInspectionKicker:
      'On-chain inspection',
    adminDepositInspectionHeading:
      'Inspect a deposit',
    adminDepositInspectionDescription:
      'Enter a deposit ID to read its snapshot directly from SavingCore. This feature is strictly read-only.',
    adminDepositId:
      'Deposit ID',
    adminDepositSearch:
      'Search deposit',
    adminDepositSearching:
      'Searching...',
    adminDepositLoading:
      'Reading deposit data from Sepolia...',
    adminDepositIdError:
      'Deposit ID must be a positive whole number.',
    adminDepositReadError:
      'Deposit could not be read. Check the ID and try again.',
    adminDepositResult:
      'Deposit',
    adminDepositPlanId:
      'Plan ID',
    adminDepositStartedAt:
      'Started at',
    adminDepositMaturityAt:
      'Maturity at',
    adminDepositStatusActive:
      'Active',
    adminDepositStatusWithdrawn:
      'Withdrawn',
    adminDepositStatusManualRenewed:
      'Manually renewed',
    adminDepositStatusAutoRenewed:
      'Automatically renewed',
    adminDepositStatusUnknown:
      'Unknown',
    walletEyebrow:
      'Browser wallet',
    walletHeading:
      'Wallet connection',
    walletStatusChecking:
      'Checking',
    walletStatusUnavailable:
      'Unavailable',
    walletStatusDisconnected:
      'Disconnected',
    walletStatusConnected:
      'Connected',
    walletChecking:
      'Checking for an EIP-1193 browser wallet…',
    walletUnavailableTitle:
      'Browser wallet not detected',
    walletUnavailableBody:
      'Install or enable an EIP-1193 wallet such as MetaMask to send SafeBank transactions. Public Sepolia data remains available without connecting.',
    walletDisconnectedTitle:
      'Your wallet is disconnected',
    walletDisconnectedBody:
      'Connect explicitly to view your mUSDC balance, allowance and owned deposits.',
    walletWaiting:
      'Waiting for wallet…',
    walletConnect:
      'Connect wallet',
    connectedAccount:
      'Connected account',
    walletChainId:
      'Wallet chain ID',
    unknown:
      'Unknown',
    wrongNetwork:
      'Wrong network',
    wrongNetworkBody:
      'SafeBank is deployed on Ethereum Sepolia. State-changing actions remain disabled until your wallet switches networks.',
    switchingNetwork:
      'Switching network…',
    switchToSepolia:
      'Switch to Sepolia',
    contractsEyebrow:
      'Verified public deployment',
    contractsHeading:
      'Sepolia contracts',
    view:
      'View',
    viewSource:
      'View source',
    onEtherscan:
      'on Etherscan',
    contractsNotice:
      'Source verification improves transparency but is not a professional security audit.',
    loadingState:
      'Loading Sepolia state',
    loadingDescription:
      'Reading plans, protocol status and vault accounting directly from the deployed contracts.',
    loadErrorTitle:
      'Unable to load SafeBank state',
    publicStateUnavailable:
      'The public Sepolia state is unavailable.',
    retryPublicReads:
      'Retry public reads',
    faucetMinting:
      'Minting test mUSDC…',
    faucetMint:
      'Mint 1,000 test mUSDC',
    faucetDescription:
      'Permissionless Sepolia test faucet. Tokens have no real-world value.',
    faucetSuccess:
      'Test mUSDC minted successfully.',
    openDepositEyebrow:
      'User transaction',
    openDepositHeading:
      'Open a term deposit',
    openDepositDescription:
      'Approval and deposit opening are separate transactions. SafeBank never requests an unlimited token allowance.',
    savingPlan:
      'Saving plan',
    noEnabledPlans:
      'No enabled plans',
    plan:
      'Plan',
    days:
      'days',
    depositAmount:
      'Deposit amount',
    depositAmountHelp:
      'Enter a decimal amount with no more than six fractional digits.',
    allowedRange:
      'Allowed range',
    estimatedInterest:
      'Estimated interest',
    connectBeforeDeposit:
      'Connect your wallet before approving or opening a deposit.',
    switchBeforeTransaction:
      'Switch your wallet to Ethereum Sepolia before sending a transaction.',
    savingCorePaused:
      'SavingCore is paused. New deposits are temporarily unavailable.',
    approvingMusdc:
      'Approving mUSDC…',
    approveExactMusdc:
      'Approve exact mUSDC amount',
    openingDeposit:
      'Opening deposit…',
    openDeposit:
      'Open deposit',
    musdcApproval:
      'mUSDC approval',
    depositOpening:
      'Deposit opening',
    transactionAwaitingSignature:
      'Confirm the request in your wallet.',
    transactionSubmitted:
      'Transaction submitted.',
    transactionConfirming:
      'Waiting for transaction confirmation.',
    transactionConfirmed:
      'Transaction confirmed.',
    transactionFailed:
      'Transaction failed.',
    viewTransaction:
      'View transaction on Etherscan',
    portfolioEyebrow:
      'Portfolio',
    portfolioHeading:
      'Your term deposits',
    portfolioConnect:
      'Connect your wallet to view deposit certificates and deferred-interest claims.',
    portfolioLoading:
      'Loading your SafeBank portfolio…',
    portfolioLoadError:
      'Your portfolio could not be loaded.',
    portfolioUnavailable:
      'Portfolio data is unavailable.',
    certificate:
      'certificate',
    certificates:
      'certificates',
    portfolioPaused:
      'SavingCore is paused. Financial actions are temporarily unavailable, but portfolio data remains visible.',
    noOwnedCertificates:
      'This wallet does not currently own any SafeBank deposit certificates.',
    depositCertificate:
      'Deposit certificate',
    nftCertificate:
      'NFT certificate',
    deposit:
      'Deposit',
    principal:
      'Principal',
    aprAtOpening:
      'APR at opening',
    earlyPenalty:
      'Early penalty',
    started:
      'Started',
    maturity:
      'Maturity',
    graceEnds:
      'Grace ends',
    currentlyAvailable:
      'Currently available',
    noLifecycleAction:
      'No lifecycle action is currently available.',
    actionEarlyWithdrawal:
      'Early withdrawal',
    actionMaturityWithdrawal:
      'Maturity withdrawal',
    actionManualRenewal:
      'Manual renewal',
    actionAutoRenewal:
      'Auto-renewal',
    depositStatusActive:
      'Active',
    depositStatusWithdrawn:
      'Withdrawn',
    depositStatusManualRenewed:
      'Manually renewed',
    depositStatusAutoRenewed:
      'Automatically renewed',
    lifecycleAwaitingSignature:
      'Confirm the lifecycle action in your wallet.',
    lifecycleSubmitted:
      'Lifecycle transaction submitted.',
    lifecycleConfirmed:
      'Lifecycle transaction confirmed.',
    lifecycleFailed:
      'Lifecycle transaction failed.',
    lifecycleAction:
      'Deposit lifecycle action',
    renewalPlan:
      'Renewal plan',
    selectRenewalPlan:
      'Select an enabled renewal plan.',
    noRenewalPlan:
      'No enabled saving plan is available for manual renewal.',
    earlyWithdrawDeposit:
      'Early withdraw deposit',
    maturityWithdrawDeposit:
      'Withdraw deposit at maturity',
    manualRenewDeposit:
      'Manually renew deposit',
    automaticRenewDeposit:
      'Auto-renew deposit',
    withdrawingEarly:
      'Withdrawing early…',
    withdrawEarly:
      'Withdraw early',
    withdrawingAtMaturity:
      'Withdrawing deposit…',
    withdrawAtMaturity:
      'Withdraw at maturity',
    renewingDeposit:
      'Renewing deposit…',
    renewManually:
      'Renew manually',
    autoRenewingDeposit:
      'Auto-renewing deposit…',
    autoRenew:
      'Auto-renew',
    principalFirstSettlement:
      'Principal-first settlement',
    deferredInterestClaims:
      'Deferred-interest claims',
    deferredInterestDescription:
      'These claims are determined by the current on-chain claimant mapping and may exist even when this wallet no longer owns the original NFT certificate.',
    noDeferredInterest:
      'No unpaid deferred interest is assigned to this wallet.',
    deferredInterestForDeposit:
      'Deferred interest for deposit',
    interestPending:
      'mUSDC pending',
    claimAvailable:
      'Claim available',
    claimUnavailable:
      'Claim unavailable',
    claimPendingInterest:
      'Claim pending interest for deposit',
    claimingInterest:
      'Claiming interest…',
    claimDeferredInterest:
      'Claim deferred interest',
    switchBeforeClaim:
      'Switch your wallet to Ethereum Sepolia before claiming this interest.',
    claimsPaused:
      'SavingCore is paused. Deferred-interest claims are temporarily unavailable.',
    deferredInterestClaim:
      'Deferred-interest claim',
    claimAwaitingSignature:
      'Confirm the interest claim in your wallet.',
    claimSubmitted:
      'Interest claim submitted.',
    claimConfirming:
      'Waiting for claim confirmation.',
    claimConfirmed:
      'Deferred interest claimed successfully.',
    claimFailed:
      'Deferred-interest claim failed.',
    liveContractReads:
      'Live contract reads',
    protocolStatus:
      'Protocol status',
    refreshState:
      'Refresh state',
    protocolSavingPlans:
      'Saving plans',
    totalDeposits:
      'Total deposits',
    protocolPaused:
      'Paused',
    protocolActive:
      'Active',
    latestBlockTimestamp:
      'Latest block timestamp',
    gracePeriod:
      'Grace period',
    accountEyebrow:
      'Connected wallet',
    musdcAccountHeading:
      'mUSDC account',
    accountConnectDescription:
      'Connect your wallet to read its mUSDC balance and exact SavingCore allowance.',
    accountMusdcBalance:
      'mUSDC balance',
    accountSavingCoreAllowance:
      'SavingCore allowance',
    musdcTestTokenNotice:
      'mUSDC is a public test token with six decimals and no real-world value.',
    termDeposits:
      'Term deposits',
    savingPlansHeading:
      'Saving plans',
    noSavingPlans:
      'No saving plans are currently available.',
    planTerm:
      'Term',
    planEnabled:
      'Enabled',
    planDisabled:
      'Disabled',
    depositRange:
      'Deposit range',
    c2Transparency:
      'C2 transparency',
    interestVaultHeading:
      'Interest vault',
    vaultBalance:
      'Vault balance',
    reservedInterest:
      'Reserved interest',
    availableLiquidity:
      'Available liquidity',
    fundingShortfall:
      'Funding shortfall',
    interestVaultUnderfunded:
      'Interest vault is underfunded',
    underfundedDescription:
      'Maturity settlement may defer interest under C1, and positive-interest renewal may fail until the vault is funded.',
    zeroShortfallNotice:
      'Zero shortfall is an accounting snapshot, not a professional solvency guarantee.',
    connectedToSepolia:
      'Connected to Ethereum Sepolia.',
    dismissWalletError:
      'Dismiss wallet error',
    lifecycleTimingDescription:
      'Lifecycle availability is calculated from the latest Sepolia block timestamp, not your device clock.',
    openErrorPlanRequired:
      'Select an enabled saving plan.',
    openErrorPlanDisabled:
      'The selected saving plan is disabled.',
    openErrorInvalidAmount:
      'Enter a valid mUSDC amount with up to six decimal places.',
    openErrorAmountNotPositive:
      'The deposit amount must be greater than zero.',
    openErrorBelowMinimum:
      'The amount is below this plan’s minimum deposit.',
    openErrorAboveMaximum:
      'The amount exceeds this plan’s maximum deposit.',
    openErrorInsufficientBalance:
      'Your connected wallet does not have enough mUSDC.',
    transactionErrorRejected:
      'The transaction was rejected in your wallet.',
    transactionErrorUnknown:
      'The transaction failed for an unknown reason.',
    transactionErrorInvalidHash:
      'The wallet returned an invalid transaction hash.',
    transactionErrorReceiptUnavailable:
      'The transaction receipt could not be loaded.',
    transactionErrorMinedReverted:
      'The transaction was mined but reverted.',
    walletErrorRequestRejected:
      'The request was rejected in your wallet.',
    walletErrorReadState:
      'Unable to read the browser wallet state.',
    walletErrorNotDetected:
      'No EIP-1193 browser wallet was detected.',
    walletErrorConnect:
      'Unable to connect the browser wallet.',
    walletErrorSwitchSepolia:
      'Unable to switch to Ethereum Sepolia.',
    walletErrorConnectBeforeTransaction:
      'Connect your wallet before sending a transaction.',
    walletErrorSwitchBeforeTransaction:
      'Switch your wallet to Ethereum Sepolia before sending a transaction.',
    safeBankReadErrorFallback:
      'Unable to load SafeBank data from Ethereum Sepolia.',
  },
} as const

export type Language =
  keyof typeof translations

export type TranslationKey =
  keyof typeof translations.vi
