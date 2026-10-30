import type { Locale } from "./config";

type Dict = {
  brand: string;
  nav: {
    home: string;
    catalog: string;
    offers: string;
    cart: string;
    contact: string;
    admin: string;
    story: string;
    traders: string;
    primaryAria: string;
    mobileAria: string;
    languageAria: string;
    /** Supports `{n}` placeholder for the item count. */
    cartAria: string;
  };
  home: {
    headline: string;
    sub: string;
    heroLabel: string;
    ctaCatalog: string;
    ctaOffers: string;
    ctaStory: string;
    handoffTitle: string;
    handoffStep1: string;
    handoffStep2: string;
    handoffStep3: string;
    traderBandTitle: string;
    traderBandLead: string;
    traderBandCta: string;
    latestPieces: string;
    viewCollection: string;
    introEyebrow: string;
    introTitle: string;
    introBody: string;
    featuredEyebrow: string;
    featuredTitle: string;
    featuredIntro: string;
    featuredLead: string;
    featuredEmpty: string;
    available: string;
    unavailable: string;
    categoriesEyebrow: string;
    categoriesTitle: string;
    categoriesIntro: string;
    categoriesCta: string;
    categoryDescInstruments: string;
    categoryDescAccessories: string;
    categoryDescEconomy: string;
    categoryDescMid: string;
    categoryDescProfessional: string;
    categoryDescVip: string;
    oudEyebrow: string;
    oudTitle: string;
    oudBody: string;
    oudDetail: string;
    discoveryEyebrow: string;
    discoveryTitle: string;
    discoverySub: string;
    discoveryEmpty: string;
    discoveryCta: string;
    principlesEyebrow: string;
    principlesTitle: string;
    principleRare: string;
    principleSelected: string;
    principleAuthentic: string;
    principleConsidered: string;
    heroFeatRare: string;
    heroFeatSelected: string;
    heroFeatAuthentic: string;
    heroFeatConsidered: string;
    finalCtaTitle: string;
    finalCtaSub: string;
    finalCtaButton: string;
    finalCtaSecondary: string;
    viewProduct: string;
    footerTagline: string;
    footerRights: string;
    footerExplore: string;
    search: string;
    searchPlaceholder: string;
    searchEmpty: string;
    searchResults: string;
    closeSearch: string;
    shortcutCatalog: string;
    shortcutAvailable: string;
    shortcutLatest: string;
    shortcutOffers: string;
    shortcutCategories: string;
    pieces: string;
    featuredInstrumentEyebrow: string;
    mosaicEyebrow: string;
    mosaicTitle: string;
    curatedRailEyebrow: string;
    curatedRailTitle: string;
    latestRailEyebrow: string;
    latestRailTitle: string;
    secondaryRailEyebrow: string;
    secondaryRailTitle: string;
    attributeEyebrow: string;
    attributeTitle: string;
    attributeAll: string;
    filterAvailable: string;
    filterUnavailable: string;
    quickView: string;
    quickViewClose: string;
    viewDetails: string;
    compare: string;
    compareAdd: string;
    compareRemove: string;
    compareTitle: string;
    compareEmpty: string;
    compareClear: string;
    compareMax: string;
    price: string;
    requestPiece: string;
    featuredOfferEyebrow: string;
    featuredOfferCta: string;
  };
  catalog: {
    title: string;
    empty: string;
    emptyHint: string;
    search: string;
    filters: string;
    allCategories: string;
    lead: string;
    photoCaption: string;
    filtersTitle: string;
    typeLabel: string;
    priceLabel: string;
    priceMin: string;
    priceMax: string;
    /** Hint shown beside price inputs (currency is commercially open). */
    priceCurrencyHint: string;
    /** Short adornment inside min/max fields. */
    priceCurrencyShort: string;
    showResultsForms: {
      zero: string;
      one: string;
      two: string;
      few: string;
      many: string;
      other: string;
    };
    priceApply: string;
    sortLabel: string;
    sortNew: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    clearAll: string;
    clearFilters: string;
    activeFilters: string;
    removeFilter: string;
    noResults: string;
    noResultsHint: string;
    resultsUpdated: string;
    showResults: string;
    loadMore: string;
    showing: string;
    quickAdd: string;
    quickAdded: string;
    priceFrom: string;
    priceTo: string;
    searchLabel: string;
  };
  offers: {
    title: string;
    sub: string;
    empty: string;
    back: string;
    relatedProduct: string;
    viewOffer: string;
    eyebrow: string;
    askAbout: string;
  };
  product: {
    addToCart: string;
    unavailable: string;
    specs: string;
    priceOnRequest: string;
    available: string;
    unavailableReason: string;
    contactUs: string;
    added: string;
    description: string;
    related: string;
    breadcrumb: string;
    addedToast: string;
    viewCart: string;
    galleryLabel: string;
    galleryShowImage: string;
    galleryEnlarge: string;
    galleryPrev: string;
    galleryNext: string;
    galleryCounter: string;
    priceWas: string;
    priceNow: string;
    onSale: string;
    extras: string;
    oudSpecs: {
      title: string;
      wood: string;
      measures: string;
      details: string;
      back: string;
      face: string;
      pegs: string;
      fingerboard: string;
      bridge: string;
      faceWidth: string;
      faceDepth: string;
      faceLength: string;
      neckLength: string;
      stringLength: string;
      standardNeck: string;
      standardNeckYes: string;
      standardNeckNo: string;
      finish: string;
      mm: string;
    };
  };
  cart: {
    title: string;
    empty: string;
    continue: string;
    remove: string;
    emptyTitle: string;
    emptyBody: string;
    listLabel: string;
    /** `{n}` = total pieces. */
    itemsCount: string;
    /** `{name}` placeholder. */
    qtyLabel: string;
    /** `{name}` placeholder. */
    removeAria: string;
    increase: string;
    decrease: string;
    unitPrice: string;
    lineTotal: string;
    summaryTitle: string;
    summaryTotal: string;
    summaryNote: string;
  };
  request: {
    title: string;
    name: string;
    phone: string;
    phonePlaceholder: string;
    phoneHelper: string;
    notes: string;
    country: string;
    shippingNote: string;
    submit: string;
    success: string;
    openWhatsApp: string;
    handoffHint: string;
    messagePreview: string;
    listEmpty: string;
    /** Contains a `{link}` placeholder replaced by the privacy link. */
    privacyConsent: string;
    privacyLink: string;
    successTitle: string;
    referenceLabel: string;
    copyReference: string;
    copyMessage: string;
    copied: string;
    copyFailed: string;
    nextStep: string;
    emptyTitle: string;
    emptyBody: string;
    summaryTitle: string;
    backToCart: string;
    submitting: string;
    opening: string;
  };
  admin: {
    login: string;
    dashboard: string;
    products: string;
    categories: string;
    customers: string;
    requests: string;
    inbox: string;
    logout: string;
    traders: string;
    deals: string;
    wholesale: string;
    brokerage: string;
    offers: string;
    promos: string;
    kpiRetail: string;
    kpiDeals: string;
    kpiWholesale: string;
    kpiBrokerage: string;
    kpiUnread: string;
    kpiIdle: string;
    recentRequests: string;
    actionQueue: string;
    activityFeed: string;
    actionOpen: string;
    actionEmpty: string;
    activityEmpty: string;
    nextActorAdmin: string;
    lastConnected: string;
    neverConnected: string;
    reauthenticate: string;
    viewAll: string;
    openInbox: string;
    noRequests: string;
    newProduct: string;
    edit: string;
    publishedCount: string;
    connection: string;
    outbound: string;
    colThumb: string;
    colSlug: string;
    colName: string;
    colStatus: string;
    colAvailability: string;
    colPrice: string;
    colCategory: string;
    imagesTitle: string;
    imagesEmpty: string;
    imagesLimits: string;
    imagesAdd: string;
    imagesFileLabel: string;
    imagesKindVideo: string;
    imagesAfterSaveHint: string;
    imagesAltAr: string;
    imagesAltEn: string;
    imagesPrimary: string;
    imagesRemove: string;
    imagesMoveEarlier: string;
    imagesMoveLater: string;
    imagesUploading: string;
    imagesErrorType: string;
    imagesErrorSize: string;
    imagesErrorDim: string;
    imagesErrorMax: string;
    imagesErrorGeneric: string;
    quickProduct: string;
    quickOffer: string;
    quickTrader: string;
    waitingToday: string;
    waitingTodayZero: string;
    filterAll: string;
    filterRetail: string;
    filterDeals: string;
    filterWholesale: string;
    trendUp: string;
    trendDown: string;
    trendFlat: string;
    contentHealth: string;
    contentHealthRatio: string;
    contentHealthMissing: string;
    contentHealthComplete: string;
    pipeline: string;
    pipelineLegend: string;
    domainMixTitle: string;
    whatsappNoun: string;
    whatsappLastMessage: string;
    whatsappNoMessage: string;
    piecesCount: string;
    commandSearch: string;
    commandPlaceholder: string;
    commandEmpty: string;
    commandSearching: string;
    manageHub: string;
    settings: string;
    savedToast: string;
  };
  adminUi: {
    colReference: string;
    colCustomer: string;
    colCountry: string;
    colTotal: string;
    colTrader: string;
    colTitle: string;
    colKind: string;
    colEntries: string;
    colMode: string;
    colLines: string;
    colPhone: string;
    colNotes: string;
    colRequests: string;
    colCreated: string;
    colLastEvent: string;
    colItems: string;
    colHandoff: string;
    colLastRequest: string;
    colShipping: string;
    colEmail: string;
    colDeals: string;
    colDeal: string;
    handoffOpened: string;
    handoffPrepared: string;
    handoffNone: string;
    shippingPlaceholder: string;
    waitingOnYou: string;
    actionView: string;
    actionNegotiate: string;
    actionReview: string;
    requestsLead: string;
    dealsLead: string;
    wholesaleLead: string;
    customersLead: string;
    tradersLead: string;
    categoriesLead: string;
    offersLead: string;
    newOffer: string;
    promosLead: string;
    newPromo: string;
    deletePromo: string;
    promoStatus: Record<string, string>;
    promoTone: Record<string, string>;
    searchPlaceholder: string;
    searchRequests: string;
    searchDeals: string;
    searchWholesale: string;
    searchProducts: string;
    search: string;
    filterTabs: string;
    filterAll: string;
    filterWaiting: string;
    negotiationThread: string;
    emptyTitle: string;
    emptyBody: string;
    newTrader: string;
    traderCreateTitle: string;
    traderCreateLead: string;
    traderEmail: string;
    traderPassword: string;
    traderDisplayName: string;
    traderCompany: string;
    traderPhone: string;
    traderNotes: string;
    traderCreateSubmit: string;
    traderCreated: string;
    traderTempPasswordTitle: string;
    traderTempPasswordLead: string;
    traderTempPasswordCopy: string;
    traderTempPasswordCopied: string;
    traderTempPasswordAck: string;
    traderTempPasswordClose: string;
    traderActivate: string;
    traderDisable: string;
    traderDisableTitle: string;
    traderDisableBody: string;
    traderResetPassword: string;
    traderResetPasswordConfirmTitle: string;
    traderResetPasswordConfirmBody: string;
    traderResetPasswordConfirmLabel: string;
    categorySave: string;
    categoryNameAr: string;
    categoryNameEn: string;
    categorySortOrder: string;
    resultsLabel: string;
    categorySlug: string;
    categoryProducts: string;
    categoryActions: string;
    categoryCreate: string;
    categoryEdit: string;
    categoryDelete: string;
    categoryDeleteConfirm: string;
    categoryDeleteBlocked: string;
    categoryDeleteLaunch: string;
    categorySlugExists: string;
    categoryInvalid: string;
    categorySaved: string;
    customerWaTitle: string;
    customerWaEmpty: string;
    customerWaOpen: string;
    customerNotesSave: string;
    customerNotesSaved: string;
    customerNotesFailed: string;
    customerNotesInvalid: string;
    customerNotesHelper: string;
    kindCatalog: string;
    kindNonCatalog: string;
    modeRequestQuote: string;
    modeProposePrice: string;
    status: {
      retail: Record<string, string>;
      deal: Record<string, string>;
      wholesale: Record<string, string>;
      trader: Record<string, string>;
      offer: Record<string, string>;
    };
    /** Catalog product status (draft / published / archived). */
    productStatus: Record<string, string>;
    /** Retail availability flag (available / unavailable). */
    availability: Record<string, string>;
    /** Detail page headings, field labels and stepper copy. */
    detail: {
      retailEvent: Record<string, string>;
      actor: Record<string, string>;
      langAr: string;
      langEn: string;
      locale: string;
      destination: string;
      shippingMethod: string;
      shippingUnconfirmed: string;
      subtotal: string;
      handoffPrepared: string;
      handoffOpened: string;
      lines: string;
      qty: string;
      customerNotes: string;
      linkedConversation: string;
      linkedConversationOpen: string;
      linkedConversationNone: string;
      storedMessage: string;
      handoffPayload: string;
      auditEvents: string;
      noEvents: string;
      traderNotes: string;
      productReference: string;
      nonCatalogNoProduct: string;
      commercialSnapshot: string;
      conditions: string;
      negotiationHistory: string;
      terms: string;
      publicOfferTitle: string;
      publicOfferBody: string;
      createDraftOffer: string;
      linesSnapshot: string;
      proposedPrice: string;
      noProposedPrice: string;
      quotedUnit: string;
      catalogRetailRef: string;
      wholesaleRequestTitle: string;
      editOffer: string;
      newOfferTitle: string;
      newOfferLead: string;
      newProductTitle: string;
      stepperLabel: string;
      stepDone: string;
      stepCurrent: string;
      stepUpcoming: string;
      stepEnded: string;
    };
    /** Control forms (request / wholesale / offer / product). */
    form: {
      operations: string;
      operationsHint: string;
      moveTo: string;
      note: string;
      noteOptional: string;
      applyTransition: string;
      apply: string;
      statusUpdated: string;
      terminalNoTransitions: string;
      retrigger: string;
      handoffRegenerated: string;
      openHandoff: string;
      handoffMarkedOpened: string;
      adminOperations: string;
      terminalStatus: string;
      blockedUntilQuote: string;
      provideQuote: string;
      quoteHint: string;
      quoteCurrency: string;
      quotedUnitPrice: string;
      quoteMessage: string;
      saveQuote: string;
      quoteSaved: string;
      shippingTitle: string;
      carrier: string;
      trackingReference: string;
      saveShipping: string;
      shippingSaved: string;
      slug: string;
      titleAr: string;
      titleEn: string;
      summaryAr: string;
      summaryEn: string;
      bodyAr: string;
      bodyEn: string;
      ctaLabelAr: string;
      ctaLabelEn: string;
      href: string;
      hrefHelp: string;
      tone: string;
      imagePath: string;
      startsAt: string;
      endsAt: string;
      savePromo: string;
      linkedDeal: string;
      linkedProduct: string;
      none: string;
      sortOrder: string;
      saveOffer: string;
      createDraft: string;
      offerCurrentStatus: string;
      offerPublishNote: string;
      plateAck: string;
      plateAckHelp: string;
      publishNeedsTitleAr: string;
      publishNeedsSummaryAr: string;
      publishNeedsProductOrPlate: string;
      publishNeedsNameAr: string;
      publishNeedsImage: string;
      publishRulesHint: string;
      setStatusTo: string;
      productNameAr: string;
      productNameEn: string;
      descriptionAr: string;
      descriptionEn: string;
      specsAr: string;
      specsEn: string;
      specsHelp: string;
      oudSpecsTitle: string;
      oudSpecsHint: string;
      oudWoodTitle: string;
      oudMeasuresTitle: string;
      oudDetailsTitle: string;
      oudWoodBack: string;
      oudWoodFace: string;
      oudWoodPegs: string;
      oudWoodFingerboard: string;
      oudWoodBridge: string;
      oudFaceWidth: string;
      oudFaceDepth: string;
      oudFaceLength: string;
      oudNeckLength: string;
      oudStringLength: string;
      oudStandardNeck: string;
      oudStandardNeckUnset: string;
      oudStandardNeckYes: string;
      oudStandardNeckNo: string;
      oudFinish: string;
      oudMm: string;
      oudAr: string;
      oudEn: string;
      category: string;
      retailPrice: string;
      compareAtPrice: string;
      compareAtHelp: string;
      currency: string;
      currencyHelp: string;
      currencyPlaceholder: string;
      statusLabel: string;
      availabilityLabel: string;
      availabilityHelp: string;
      wholesaleEligible: string;
      wholesaleEligibleHelp: string;
      storeBadges: string;
      storeBadgesHelp: string;
      badgeNew: string;
      badgeFeatured: string;
      badgeSale: string;
      previewStorefront: string;
      saveProduct: string;
      saving: string;
    };
  };
  trader: {
    brand: string;
    overview: string;
    deals: string;
    newDeal: string;
    wholesale: string;
    wholesaleRequests: string;
    brokerage: string;
    newBrokerage: string;
    taskBrokerageTitle: string;
    taskBrokerageBody: string;
    offers: string;
    profile: string;
    logout: string;
    welcome: string;
    waitingToday: string;
    waitingTodayZero: string;
    lead: string;
    homeTasksTitle: string;
    taskDealTitle: string;
    taskDealBody: string;
    taskWholesaleTitle: string;
    taskWholesaleBody: string;
    myDeals: string;
    waitingTitle: string;
    waitingIdle: string;
    openRecord: string;
    offersNow: string;
    viewAllOffers: string;
    /* P6b/c — trader portal polish */
    dealStatus: Record<string, string>;
    wholesaleStatus: Record<string, string>;
    requestMode: Record<string, string>;
    dealKind: Record<string, string>;
    actorRole: Record<string, string>;
    dealAction: Record<string, string>;
    wholesaleEvent: Record<string, string>;
    accountStatus: Record<string, string>;
    unknownStatus: string;
    waitingOnYou: string;
    waitingOnAdmin: string;
    dealsTitle: string;
    dealsEmpty: string;
    dealsEmptyBody: string;
    dealsTabList: string;
    dealsTabAll: string;
    dealsTabWaiting: string;
    dealsTabNegotiating: string;
    dealsTabClosed: string;
    wsTabList: string;
    wsTabAll: string;
    wsTabWaiting: string;
    wsTabOpen: string;
    wsTabClosed: string;
    accountRequestHelp: string;
    entriesCount: string;
    colReference: string;
    colTitle: string;
    colKind: string;
    colStatus: string;
    colEntries: string;
    newDealTitle: string;
    newDealLead: string;
    sectionType: string;
    sectionTerms: string;
    sectionMessage: string;
    sectionReview: string;
    wizardStepOf: string;
    wizardBack: string;
    wizardNext: string;
    wizardEdit: string;
    wizardLeaveConfirm: string;
    wizardNeedTitle: string;
    wizardNeedProduct: string;
    recentActivity: string;
    recentActivityEmpty: string;
    activityDeal: string;
    activityWholesale: string;
    maxQtyPerPiece: string;
    wsPickerSearch: string;
    wsPickerAllCategories: string;
    wsSelectedCount: string;
    wsReviewSend: string;
    wsReviewTitle: string;
    wsAddPiece: string;
    wsRemovePiece: string;
    wsQtyFor: string;
    wsQtyIncrease: string;
    wsQtyDecrease: string;
    dealTypeLabel: string;
    dealTitleLabel: string;
    productLabel: string;
    productPlaceholder: string;
    nonCatalogNote: string;
    priceOptional: string;
    currencyLabel: string;
    quantityLabel: string;
    conditionsLabel: string;
    initialMessageLabel: string;
    submitProposal: string;
    submitting: string;
    dealProduct: string;
    dealNonCatalog: string;
    dealSnapshot: string;
    dealQtyShort: string;
    dealConditions: string;
    dealHistory: string;
    dealTerms: string;
    dealClosed: string;
    dealWaitingBanner: string;
    dealWaitingAdmin: string;
    dealRejected: string;
    dealRejectedWithReason: string;
    negTitle: string;
    negHint: string;
    negAction: string;
    negMessage: string;
    negRejectReason: string;
    negRejectReasonHint: string;
    conflictWarningTitle: string;
    negPrice: string;
    negCurrency: string;
    negQty: string;
    negConditions: string;
    negRecorded: string;
    negSubmit: string;
    wsTitle: string;
    wsLead: string;
    wsMyRequests: string;
    wsNewRequest: string;
    wsEmpty: string;
    wsEmptyBody: string;
    wsColReference: string;
    wsColMode: string;
    wsColStatus: string;
    wsColLines: string;
    wsLinesCount: string;
    wsDetailTitle: string;
    wsYourNotes: string;
    wsLines: string;
    wsQty: string;
    wsProposed: string;
    wsQuoted: string;
    wsRetailRef: string;
    wsQuoteTitle: string;
    wsQuotedAt: string;
    wsQuoteCurrency: string;
    wsQuoteMessage: string;
    wsQuoteLines: string;
    wsQuoteBanner: string;
    wsHistory: string;
    wsTraderResponse: string;
    wsModeLabel: string;
    wsFormHint: string;
    wsColProduct: string;
    wsColRetail: string;
    wsColQty: string;
    wsColUnitPrice: string;
    wsColCurrency: string;
    wsNoProducts: string;
    wsNotes: string;
    wsSubmit: string;
    wsActions: string;
    wsReviewQuote: string;
    wsNoteOptional: string;
    wsAccept: string;
    wsDecline: string;
    wsResponseRecorded: string;
    wsCancel: string;
    wsCancelled: string;
    wsNoActions: string;
    profileTitle: string;
    profileName: string;
    profileEmail: string;
    profileCompany: string;
    profilePhone: string;
    profileStatus: string;
    profileNote: string;
    prefsTitle: string;
    prefsLead: string;
    prefsCategories: string;
    prefsCategoriesHint: string;
    prefsNotes: string;
    prefsSave: string;
    prefsSaved: string;
    notifications: string;
    notificationsTitle: string;
    notificationsLead: string;
    notificationsEmpty: string;
    notificationsEmptyBody: string;
    notificationsMarkAll: string;
    notificationsMarkRead: string;
    notificationsOpen: string;
    offersTitle: string;
    offersLead: string;
    offersEmpty: string;
    /** Back link on trader offer detail (stays in /trader). */
    offersBack: string;
    offersRelatedProduct: string;
    offersStartDeal: string;
    confirmCancel: string;
    negConfirmAcceptTitle: string;
    negConfirmAcceptBody: string;
    negConfirmCloseTitle: string;
    negConfirmCloseBody: string;
    negConfirmRejectTitle: string;
    negConfirmRejectBody: string;
    wsConfirmAcceptTitle: string;
    wsConfirmAcceptBody: string;
    wsConfirmDeclineTitle: string;
    wsConfirmDeclineBody: string;
    wsConfirmCancelTitle: string;
    wsConfirmCancelBody: string;
    actionErrorUnauthorized: string;
    actionErrorNotAllowed: string;
    actionErrorInvalid: string;
    actionErrorGeneric: string;
    actionError: Record<string, string>;
  };
  inbox: {
    title: string;
    subtitle: string;
    empty: string;
    backToList: string;
    lastMessage: string;
    unread: string;
    connection: string;
    outboundDisabled: string;
    outboundEnabled: string;
    replyPlaceholder: string;
    send: string;
    sending: string;
    inbound: string;
    outbound: string;
    statusPending: string;
    statusSent: string;
    statusFailed: string;
    statusReceived: string;
    unsupported: string;
    sendFailed: string;
    sendBlocked: string;
    sendSuccess: string;
    notLinked: string;
    healthDisconnected: string;
    healthConnecting: string;
    healthConnected: string;
    healthReconnecting: string;
    healthAuthRequired: string;
    healthError: string;
    openConversation: string;
    noMessages: string;
    refresh: string;
    statusSending: string;
    businessContext: string;
    linkType: string;
    linkRecordId: string;
    linkSave: string;
    linkClear: string;
    linkChange: string;
    linkedAs: string;
    linkHistory: string;
    linkAuditSet: string;
    linkAuditChange: string;
    linkAuditClear: string;
    linkConfirmHint: string;
    openLinkedRecord: string;
    typeRetail: string;
    typeDeal: string;
    typeWholesale: string;
    contextStatus: string;
    contextUpdated: string;
    contextIdentity: string;
    contextTitle: string;
    contextDealKind: string;
    contextRequestMode: string;
    contextProduct: string;
    contextLines: string;
    contextLatestNegotiation: string;
    contextReference: string;
    linkErrorUnsupported: string;
    linkErrorNotFound: string;
    linkErrorUnauthorized: string;
    linkSuccess: string;
    unlinkSuccess: string;
    conversations: string;
    selectConversation: string;
    selectConversationHint: string;
    /** A13 filter tabs */
    tabAll: string;
    tabUnread: string;
    tabLinked: string;
    tabUnlinked: string;
    searchPlaceholder: string;
    /** A18 / composer disabled reasons (dict only — no technical text) */
    connected: string;
    connecting: string;
    disconnected: string;
    authRequired: string;
    error: string;
    sendingPaused: string;
    rateLimited: string;
    linkAccount: string;
    reconnect: string;
    nonText: string;
    retry: string;
    newMessages: string;
    linkRecord: string;
    unlinkConfirm: string;
    pickRecord: string;
    searchRecords: string;
    openContext: string;
    confirmLink: string;
    confirmUnlink: string;
    lengthNearLimit: string;
    emptyThread: string;
    /** WhatsApp account pairing panel (admin link account) */
    pairingTitle: string;
    pairingHint: string;
    pairingPhone: string;
    pairingSubmit: string;
    pairingAwaiting: string;
    pairingCodeLabel: string;
    pairingQrOptional: string;
    pairingConnected: string;
    pairingNotLinked: string;
    pairingError: string;
    pairingLogout: string;
  };
  common: {
    language: string;
    loading: string;
    save: string;
    cancel: string;
    edit: string;
    create: string;
    menu: string;
    close: string;
    email: string;
    password: string;
    signIn: string;
    errorTitle: string;
    errorBody: string;
    errorRetry: string;
    errorNotFound: string;
    errorForbidden: string;
    errorSession: string;
    errorOffline: string;
    backOnline: string;
    toastDismiss: string;
    goToPortal: string;
    signOut: string;
    navOps: string;
    navCatalog: string;
    navPeople: string;
    switchOn: string;
    switchOff: string;
    paginationPrevious: string;
    paginationNext: string;
    /** Supports `{page}` and `{pages}` placeholders. */
    paginationPageOf: string;
    timelineLabel: string;
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    greetingNamed: string;
  };
  contact: {
    title: string;
    lead: string;
    whatsapp: string;
    hours: string;
    location: string;
    missingNumber: string;
  };
  privacy: {
    title: string;
    updated: string;
    body: string;
    tocLabel: string;
    placeholderBanner: string;
    s1Title: string;
    s1Body: string;
    s2Title: string;
    s2Body: string;
    s3Title: string;
    s3Body: string;
  };
  terms: {
    title: string;
    fallbackBody: string;
  };
  auth: {
    adminTitle: string;
    traderTitle: string;
    traderHint: string;
    loginError: string;
    loginLocked: string;
    totpLabel: string;
    totpRequired: string;
    totpInvalid: string;
    totpEnrollRequired: string;
    totpEnrollButton: string;
    showPassword: string;
    hidePassword: string;
    sessionInvalidatedNotice: string;
  };
  forcePasswordChange: {
    title: string;
    subtitle: string;
    explanation: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    mismatch: string;
    submit: string;
    strengthLabel: string;
    strengthWeak: string;
    strengthFair: string;
    strengthGood: string;
    strengthStrong: string;
    strengthVeryStrong: string;
    ruleLength: string;
    ruleNotTemp: string;
    ruleNotEmail: string;
    errorCurrentWrong: string;
    errorWeak: string;
    errorSameAsTemp: string;
    errorSameAsEmail: string;
    success: string;
    signOut: string;
    showPassword: string;
    hidePassword: string;
  };
  changePassword: {
    sectionTitle: string;
    sectionLead: string;
    submit: string;
    success: string;
  };
  seo: {
    catalogDescription: string;
    productFallbackDescription: string;
    privacyDescription: string;
  };
};

const ar: Dict = {
  brand: "RARE OUD",
  nav: {
    home: "الرئيسية",
    catalog: "الكتالوج",
    offers: "عروض مختارة",
    cart: "قائمة الطلب",
    contact: "تواصل",
    admin: "الإدارة",
    story: "قصتنا",
    traders: "التجّار",
    primaryAria: "التنقل الرئيسي",
    mobileAria: "قائمة الجوال",
    languageAria: "التبديل إلى الإنجليزية",
    cartAria: "قائمة الطلب ({n} قطعة)",
  },
  home: {
    /** Hero H1 — light tashkeel so marks stay attached in Amiri */
    headline: "عودٌ نادر صُنع ليبقى",
    sub: "قطع مختارة بعناية تُصنع بيد حرفيّ وتُسلَّم بما يليق بها.",
    heroLabel: "RARE OUD",
    ctaCatalog: "استكشف المجموعة",
    ctaOffers: "عروض مختارة",
    ctaStory: "قصتنا",
    handoffTitle: "كيف يتم الطلب؟",
    handoffStep1: "أضف القطع إلى قائمة الطلب",
    handoffStep2: "أدخل بيانات التواصل",
    handoffStep3: "افتح واتساب لإرسال الطلب للفريق",
    traderBandTitle: "للتجّار",
    traderBandLead: "اقترح صفقة وفاوض ونشحن لك من مخزون RARE OUD.",
    traderBandCta: "دخول التجّار",
    latestPieces: "أحدث القطع",
    viewCollection: "عرض المجموعة",
    introEyebrow: "البيت",
    introTitle: "عمق ثقافي ودقة معاصرة",
    introBody:
      "RARE OUD تجمع بين إحساس البيت الثقافي الرفيع ومنصة رقمية هادئة حيث تُقدَّم المادة والندرة والحضور لا كسلعة عابرة.",
    featuredEyebrow: "المختارات",
    featuredTitle: "قطع تستحق الانتباه",
    featuredIntro: "اختيار منسّق من الكتالوج المنشور بتراتبية بصرية لا بشبكة متماثلة.",
    featuredLead: "القطعة الأبرز",
    featuredEmpty: "لا توجد منتجات منشورة للعرض حالياً.",
    available: "متوفر",
    unavailable: "غير متوفر",
    categoriesEyebrow: "المجموعات",
    categoriesTitle: "مساران في كون واحد",
    categoriesIntro: "فئتان قائمتان في المنصة عالمان بصريان ضمن هوية RARE OUD.",
    categoriesCta: "استكشف",
    categoryDescInstruments: "اكتشف المجموعة الأولى من الكتالوج.",
    categoryDescAccessories: "إكسسوارات مختارة للسفر والعزف اليومي.",
    categoryDescEconomy: "عود ورشة للممارسة والعزف اليومي.",
    categoryDescMid: "عود متوازن للاستخدام المنتظم والاستوديو.",
    categoryDescProfessional: "عود حفلات بنبرة أوضح واستجابة سريعة.",
    categoryDescVip: "قطع نادرة بأخشاب مختارة وتشطيب أتيليه.",
    oudEyebrow: "الندرة",
    oudTitle: "مادة نادرة واختيار واعٍ",
    oudBody:
      "العود والخشب النادر يُفهمان هنا كمادة وحضور لا كزخرفة. نختار بهدوء ونقدّم بدقة.",
    oudDetail: "محتوى تحريري قابل للاستبدال عند اعتماد النصوص النهائية.",
    discoveryEyebrow: "اكتشاف",
    discoveryTitle: "اختيار منسّق",
    discoverySub: "عروض وتنسيقات تنشرها RARE OUD بعناية وليست قوائم بائعين.",
    discoveryEmpty: "لا توجد عروض منشورة حالياً. تصفّح الكتالوج للاطلاع على المجموعة.",
    discoveryCta: "عرض العروض",
    principlesEyebrow: "المبادئ",
    principlesTitle: "ما نلتزم به",
    principleRare: "نادر",
    principleSelected: "مختار",
    principleAuthentic: "أصيل",
    principleConsidered: "متأنٍّ",
    heroFeatRare: "قطع لا تتكرر في المخزون",
    heroFeatSelected: "انتقاء يدوي بهدوء ودقة",
    heroFeatAuthentic: "مادة وحرفة بمعايير البيت",
    heroFeatConsidered: "تقديم بلا استعجال تجاري",
    finalCtaTitle: "أكمل رحلة الاكتشاف",
    finalCtaSub: "انتقل إلى الكتالوج أو العروض المختارة وابدأ طلباً يُجهَّز للنقاش مع فريق RARE OUD.",
    finalCtaButton: "إلى الكتالوج",
    finalCtaSecondary: "عروض مختارة",
    viewProduct: "عرض المنتج",
    footerTagline: "عود وخشب نادر بذوق ثقافي معاصر.",
    footerRights: "جميع الحقوق محفوظة.",
    footerExplore: "استكشف",
    search: "بحث",
    searchPlaceholder: "ابحث في الكتالوج…",
    searchEmpty: "لا نتائج مطابقة.",
    searchResults: "نتائج",
    closeSearch: "إغلاق البحث",
    shortcutCatalog: "الكتالوج",
    shortcutAvailable: "المتاح الآن",
    shortcutLatest: "الأحدث",
    shortcutOffers: "عروض مختارة",
    shortcutCategories: "المجموعات",
    pieces: "قطعة",
    featuredInstrumentEyebrow: "قطعة مميزة",
    mosaicEyebrow: "اكتشاف",
    mosaicTitle: "استكشاف المجموعة",
    curatedRailEyebrow: "مختارات",
    curatedRailTitle: "عروض منشورة",
    latestRailEyebrow: "حديثاً",
    latestRailTitle: "أحدث المنشورات",
    secondaryRailEyebrow: "مجموعة",
    secondaryRailTitle: "مزيد من القطع",
    attributeEyebrow: "تصفية",
    attributeTitle: "اكتشف حسب الفئة والتوفر",
    attributeAll: "الكل",
    filterAvailable: "متوفر",
    filterUnavailable: "غير متوفر",
    quickView: "نظرة سريعة",
    quickViewClose: "إغلاق",
    viewDetails: "التفاصيل الكاملة",
    compare: "مقارنة",
    compareAdd: "أضف للمقارنة",
    compareRemove: "إزالة",
    compareTitle: "مقارنة القطع",
    compareEmpty: "اختر قطعاً للمقارنة.",
    compareClear: "مسح",
    compareMax: "حد أقصى 3 قطع",
    price: "السعر",
    requestPiece: "أضف إلى الطلب",
    featuredOfferEyebrow: "عرض مختار",
    featuredOfferCta: "تفاصيل العرض",
  },
  catalog: {
    title: "الكتالوج",
    empty: "المجموعة قيد التجهيز",
    emptyHint: "نضيف قطعاً جديدة قريباً.",
    search: "بحث",
    filters: "تصفية",
    allCategories: "كل الفئات",
    lead: "أربع درجات من العود — اقتصادي، متوسط، احترافي، VIP — مع إكسسوارات مختارة. اختر القطعة التي تلفت نظرك وأضفها إلى قائمة الطلب.",
    photoCaption: "الصورة قيد التصوير",
    filtersTitle: "تصفية وترتيب",
    typeLabel: "النوع",
    priceLabel: "السعر",
    priceMin: "الحد الأدنى",
    priceMax: "الحد الأقصى",
    priceCurrencyHint: "رمز العملة كما في الكتالوج (مثال USD)",
    priceCurrencyShort: "عملة",
    showResultsForms: {
      zero: "عرض {n} قطعة",
      one: "عرض قطعة واحدة",
      two: "عرض قطعتين",
      few: "عرض {n} قطع",
      many: "عرض {n} قطعة",
      other: "عرض {n} قطعة",
    },
    priceApply: "تطبيق",
    sortLabel: "الترتيب",
    sortNew: "الأحدث",
    sortPriceAsc: "السعر: من الأقل إلى الأعلى",
    sortPriceDesc: "السعر: من الأعلى إلى الأقل",
    clearAll: "مسح الكل",
    clearFilters: "مسح الفلاتر",
    activeFilters: "الفلاتر المطبّقة",
    removeFilter: "إزالة الفلتر: {label}",
    noResults: "لا نتائج مطابقة",
    noResultsHint: "جرّب تغيير الفلاتر أو مسحها لعرض كل القطع.",
    resultsUpdated: "تم تحديث النتائج: {n}",
    showResults: "عرض {n} قطعة",
    loadMore: "عرض المزيد",
    showing: "عرض {shown} من {total}",
    quickAdd: "إضافة سريعة إلى الطلب",
    quickAdded: "تمت إضافة {name} إلى قائمة الطلب",
    priceFrom: "من {value}",
    priceTo: "إلى {value}",
    searchLabel: "ابحث في المجموعة",
  },
  offers: {
    title: "عروض مختارة",
    sub: "عروض تنشرها RARE OUD بعناية وليست متاجر تجّار ولا قوائم بائعين.",
    empty: "لا توجد عروض منشورة حالياً.",
    back: "كل العروض",
    relatedProduct: "منتج من الكتالوج",
    viewOffer: "عرض التفاصيل",
    eyebrow: "مختارات RARE OUD",
    askAbout: "اسأل عن هذا العرض",
  },
  product: {
    addToCart: "أضف إلى قائمة الطلب",
    unavailable: "غير متوفر حالياً",
    specs: "المواصفات",
    priceOnRequest: "السعر عند الطلب",
    available: "متوفر",
    unavailableReason: "هذه القطعة غير متاحة للطلب حالياً.",
    contactUs: "تحدث معنا",
    added: "تمت الإضافة",
    description: "الوصف",
    related: "قطع ذات صلة",
    breadcrumb: "مسار التنقل",
    addedToast: "تمت إضافة {name} إلى قائمة الطلب",
    viewCart: "عرض القائمة",
    galleryLabel: "صور المنتج",
    galleryShowImage: "عرض الصورة {n}",
    galleryEnlarge: "تكبير الصورة",
    galleryPrev: "الصورة السابقة",
    galleryNext: "الصورة التالية",
    galleryCounter: "الصورة {current} من {total}",
    priceWas: "كان",
    priceNow: "الآن",
    onSale: "سعر مخفّض",
    extras: "ميزات إضافية",
    oudSpecs: {
      title: "مواصفات العود",
      wood: "نوع الخشب",
      measures: "مقاسات العود",
      details: "المواصفات",
      back: "الظهر",
      face: "الوجه",
      pegs: "المفاتيح",
      fingerboard: "لوحة الأصابع",
      bridge: "مربط الأوتار",
      faceWidth: "عرض الوجه",
      faceDepth: "عمق الظهر",
      faceLength: "طول الوجه",
      neckLength: "طول الزند",
      stringLength: "طول الوتر",
      standardNeck: "الزند عياري",
      standardNeckYes: "عياري",
      standardNeckNo: "غير عياري",
      finish: "نوع الطلاء",
      mm: "مم",
    },
  },
  cart: {
    title: "قائمة الطلب",
    empty: "قائمة الطلب فارغة.",
    continue: "متابعة الطلب",
    remove: "إزالة",
    emptyTitle: "قائمة الطلب فارغة",
    emptyBody:
      "أضف قطعاً من الكتالوج لتبدأ طلبك، ثم أرسله إلى فريق RARE OUD عبر واتساب.",
    listLabel: "القطع في قائمة الطلب",
    itemsCount: "{n} قطعة",
    qtyLabel: "الكمية: {name}",
    removeAria: "إزالة {name} من قائمة الطلب",
    increase: "زيادة الكمية",
    decrease: "إنقاص الكمية",
    unitPrice: "سعر القطعة",
    lineTotal: "الإجمالي",
    summaryTitle: "ملخص الطلب",
    summaryTotal: "المجموع المرجعي",
    summaryNote:
      "المجموع مرجعي وليس فاتورة — لا يوجد دفع على الموقع. يُؤكَّد السعر والشحن مع الفريق.",
  },
  request: {
    title: "تفاصيل الطلب",
    name: "الاسم",
    phone: "الهاتف",
    phonePlaceholder: "+963…",
    phoneHelper: "مع رمز الدولة",
    notes: "ملاحظات",
    country: "بلد الوجهة",
    shippingNote:
      "خيارات الشحن تعتمد على الوجهة. إن لم تُعرض طريقة، سيُؤكَّد الشحن مع فريق RARE OUD.",
    submit: "تجهيز الطلب للتسليم",
    success: "تم تجهيز طلبك. مرجعك:",
    openWhatsApp: "فتح واتساب للتواصل",
    handoffHint:
      "هذه ليست عملية دفع. افتح واتساب لإرسال تفاصيل الطلب لفريق RARE OUD.",
    messagePreview: "نص الرسالة المعدّة:",
    listEmpty: "قائمة الطلب فارغة.",
    privacyConsent:
      "بتجهيز الطلب فإنك توافق على استخدام بياناتك للتواصل معك عبر واتساب فقط، وفق {link}.",
    privacyLink: "سياسة الخصوصية",
    successTitle: "تم تجهيز طلبك",
    referenceLabel: "المرجع",
    copyReference: "نسخ المرجع",
    copyMessage: "نسخ نص الرسالة",
    copied: "تم النسخ",
    copyFailed: "تعذّر النسخ",
    nextStep: "الخطوة التالية: افتح واتساب وأرسل الرسالة المعدّة إلى فريق RARE OUD.",
    emptyTitle: "لا توجد قطع في طلبك",
    emptyBody: "أضف قطعاً من الكتالوج أولاً، ثم عُد لإكمال الطلب.",
    summaryTitle: "قطع الطلب",
    backToCart: "العودة إلى قائمة الطلب",
    submitting: "جارٍ التجهيز…",
    opening: "جارٍ الفتح…",
  },
  admin: {
    login: "تسجيل دخول الإدارة",
    dashboard: "لوحة التحكم",
    products: "المنتجات",
    categories: "الفئات",
    customers: "العملاء",
    requests: "طلبات التجزئة",
    inbox: "صندوق واتساب",
    logout: "خروج",
    traders: "التجّار",
    deals: "الصفقات",
    wholesale: "الجملة",
    brokerage: "الوساطة",
    offers: "العروض",
    promos: "الترويج",
    kpiRetail: "طلبات تجزئة جديدة",
    kpiDeals: "صفقات بانتظار الرد",
    kpiWholesale: "طلبات جملة",
    kpiBrokerage: "وساطة نشطة",
    kpiUnread: "محادثات غير مقروءة",
    kpiIdle: "لا شيء بانتظارك",
    recentRequests: "أحدث طلبات التجزئة",
    actionQueue: "بانتظار إجراءك",
    activityFeed: "آخر النشاط",
    actionOpen: "فتح",
    actionEmpty: "لا شيء بانتظارك",
    activityEmpty: "لا أحداث بعد.",
    nextActorAdmin: "بانتظار الإدارة",
    lastConnected: "آخر اتصال",
    neverConnected: "لم يُسجَّل اتصال بعد",
    reauthenticate: "إعادة المصادقة",
    viewAll: "عرض الكل",
    openInbox: "فتح الصندوق",
    noRequests: "لا طلبات بعد.",
    newProduct: "إضافة منتج",
    edit: "تعديل",
    publishedCount: "منتجات منشورة",
    connection: "حالة واتساب",
    outbound: "الإرسال",
    colThumb: "صورة",
    colSlug: "المعرّف",
    colName: "الاسم",
    colStatus: "الحالة",
    colAvailability: "التوفر",
    colPrice: "السعر",
    colCategory: "الفئة",
    imagesTitle: "صور وفيديو المنتج",
    imagesEmpty: "لا وسائط بعد — ارفع صورة أو فيديو أعلاه.",
    imagesLimits:
      "صورة: JPEG / PNG / WebP حتى 8 ميغابايت (الضلع الأطول ≥ 1600 بكسل) · فيديو: MP4 / WebM حتى 48 ميغابايت · حد 8 ملفات",
    imagesAdd: "رفع صورة أو فيديو",
    imagesFileLabel: "اختر صورة أو فيديو",
    imagesKindVideo: "فيديو",
    imagesAfterSaveHint:
      "احفظ بيانات المنتج أولاً — بعدها ستُفتح صفحة التعديل لرفع الصور والفيديو.",
    imagesAltAr: "النص البديل (عربي)",
    imagesAltEn: "النص البديل (إنجليزي)",
    imagesPrimary: "الرئيسية",
    imagesRemove: "حذف",
    imagesMoveEarlier: "تحريك للأمام",
    imagesMoveLater: "تحريك للخلف",
    imagesUploading: "جارٍ الرفع…",
    imagesErrorType: "نوع الملف غير مدعوم. استخدم صورة JPEG/PNG/WebP أو فيديو MP4/WebM.",
    imagesErrorSize: "الملف أكبر من الحد المسموح (8 ميغابايت للصورة أو 48 للفيديو).",
    imagesErrorDim: "للصور: الضلع الأطول يجب أن يكون 1600 بكسل على الأقل.",
    imagesErrorMax: "وصلت إلى الحد الأقصى (8 ملفات).",
    imagesErrorGeneric: "تعذّر رفع الملف.",
    quickProduct: "منتج",
    quickOffer: "عرض",
    quickTrader: "حساب تاجر",
    waitingToday: "{n} أمور بانتظارك اليوم · {date}",
    waitingTodayZero: "لا شيء بانتظارك اليوم · {date}",
    filterAll: "الكل {n}",
    filterRetail: "تجزئة",
    filterDeals: "صفقات",
    filterWholesale: "جملة",
    trendUp: "+{n} عن أمس",
    trendDown: "−{n} عن أمس",
    trendFlat: "بلا تغيير",
    contentHealth: "صحة المحتوى",
    contentHealthRatio: "{have} من {total}",
    contentHealthMissing: "{n} قطع تنتظر صوراً خاصة بها",
    contentHealthComplete: "كل القطع المنشورة لها صور",
    pipeline: "مسار الطلبات",
    pipelineLegend: "جديد · متابعة · فُتح · مكتمل",
    domainMixTitle: "توزيع المسارات",
    whatsappNoun: "واتساب",
    whatsappLastMessage: "آخر رسالة {relative}",
    whatsappNoMessage: "لا رسائل بعد",
    piecesCount: "{n} قطع",
    commandSearch: "بحث أو أمر",
    commandPlaceholder: "ابحث عن طلب أو منتج أو تاجر…",
    commandEmpty: "لا نتائج",
    commandSearching: "جاري البحث…",
    manageHub: "إدارة",
    settings: "الأمان",
    savedToast: "تم الحفظ.",
  },
  adminUi: {
    colReference: "المرجع",
    colCustomer: "العميل",
    colCountry: "الدولة",
    colTotal: "الإجمالي",
    colTrader: "التاجر",
    colTitle: "العنوان",
    colKind: "النوع",
    colEntries: "الإدخالات",
    colMode: "الوضع",
    colLines: "البنود",
    colPhone: "الهاتف",
    colNotes: "ملاحظات",
    colRequests: "الطلبات",
    colCreated: "تاريخ الإنشاء",
    colLastEvent: "آخر حدث",
    colItems: "البنود",
    colHandoff: "التحويل",
    colLastRequest: "آخر طلب",
    colShipping: "الشحن",
    colEmail: "البريد الإلكتروني",
    colDeals: "الصفقات",
    colDeal: "الصفقة",
    handoffOpened: "فُتح",
    handoffPrepared: "جاهز",
    handoffNone: "—",
    shippingPlaceholder: "—",
    waitingOnYou: "بانتظارك",
    actionView: "عرض",
    actionNegotiate: "تفاوض",
    actionReview: "مراجعة",
    requestsLead: "طلبات التجزئة الواردة من المتجر، الأحدث أولاً.",
    dealsLead:
      "مساحة التفاوض مع التجّار: اقتراح، متابعة، عرض مقابل، قبول، إغلاق. منفصلة عن طلبات التجزئة.",
    wholesaleLead:
      "طلبات الجملة من التجّار، منفصلة عن طلبات التجزئة والصفقات. عرض سعر وتأكيد وإكمال فقط.",
    customersLead:
      "جهات الاتصال الناتجة عن طلبات التجزئة. يمكن البحث بالهاتف وهو ليس هوية فريدة.",
    tradersLead: "حسابات التجّار تُنشأ من الإدارة فقط. لا تسجيل عام.",
    categoriesLead:
      "إدارة فئات الكتالوج: إنشاء وتعديل الأسماء والترتيب. لا يمكن حذف فئة تحتوي على منتجات.",
    offersLead: "عروض عامة منسّقة من الإدارة — ليست متاجر للتجّار.",
    newOffer: "عرض جديد",
    promosLead:
      "شرائط ترويجية للصفحة الرئيسية — تظهر فقط عندما تكون منشورة وضمن الفترة إن وُجدت.",
    newPromo: "شريط ترويجي جديد",
    deletePromo: "حذف الشريط",
    promoStatus: {
      draft: "مسودة",
      published: "منشور",
    },
    promoTone: {
      ink: "حبر",
      plum: "برقوقي",
      sand: "رملي",
    },
    searchPlaceholder: "ابحث بالاسم أو الهاتف",
    searchRequests: "ابحث بالمرجع أو العميل",
    searchDeals: "ابحث بالمرجع أو التاجر",
    searchWholesale: "ابحث بالمرجع أو التاجر",
    searchProducts: "ابحث بالاسم أو التصنيف",
    search: "بحث",
    filterTabs: "تصفية القائمة",
    filterAll: "الكل",
    filterWaiting: "بانتظارك",
    negotiationThread: "سجل التفاوض",
    emptyTitle: "لا يوجد شيء هنا بعد",
    emptyBody: "ستظهر السجلات هنا عند إنشائها.",
    newTrader: "إضافة تاجر",
    traderCreateTitle: "إنشاء حساب تاجر",
    traderCreateLead:
      "حسابات تُنشأ من الإدارة فقط. تُولَّد كلمة مرور مؤقتة وتُعرض مرة واحدة بعد الإنشاء.",
    traderEmail: "البريد الإلكتروني",
    traderPassword: "كلمة مرور مؤقتة (8 أحرف على الأقل)",
    traderDisplayName: "الاسم المعروض",
    traderCompany: "الشركة (اختياري)",
    traderPhone: "الهاتف (اختياري)",
    traderNotes: "ملاحظات الإدارة",
    traderCreateSubmit: "إنشاء التاجر",
    traderCreated: "تم الإنشاء.",
    traderTempPasswordTitle: "كلمة المرور المؤقتة",
    traderTempPasswordLead:
      "انسخ كلمة المرور الآن — لن تُعرض مرة أخرى بعد الإغلاق.",
    traderTempPasswordCopy: "نسخ",
    traderTempPasswordCopied: "تم النسخ",
    traderTempPasswordAck: "لقد نسختُ كلمة المرور وسأسلّمها للتاجر بأمان.",
    traderTempPasswordClose: "تم — إغلاق",
    traderActivate: "تفعيل",
    traderDisable: "تعطيل",
    traderResetPassword: "إعادة تعيين كلمة المرور",
    traderResetPasswordConfirmTitle: "إعادة تعيين كلمة مرور التاجر؟",
    traderResetPasswordConfirmBody:
      "ستُنشأ كلمة مرور مؤقتة جديدة، والقديمة لن تعمل بعد الآن. سيُطلب من التاجر تغييرها فوراً عند دخوله.",
    traderResetPasswordConfirmLabel: "إعادة تعيين",
    traderDisableTitle: "تعطيل حساب التاجر؟",
    traderDisableBody: "لن يستطيع التاجر الدخول حتى يُعاد تفعيله. سجلاته تبقى ظاهرة.",
    categorySave: "حفظ التسميات",
    categoryNameAr: "الاسم (عربي)",
    categoryNameEn: "الاسم (إنجليزي)",
    categorySortOrder: "ترتيب العرض",
    resultsLabel: "نتيجة",
    categorySlug: "المعرّف (slug)",
    categoryProducts: "المنتجات",
    categoryActions: "إجراءات",
    categoryCreate: "فئة جديدة",
    categoryEdit: "تعديل الفئة",
    categoryDelete: "حذف",
    categoryDeleteConfirm: "حذف هذه الفئة نهائياً؟",
    categoryDeleteBlocked: "لا يمكن حذف فئة تحتوي على منتجات. انقل المنتجات أو احذفها أولاً.",
    categoryDeleteLaunch: "فئات الإطلاق الأساسية لا تُحذف.",
    categorySlugExists: "هذا المعرّف مستخدم بالفعل.",
    categoryInvalid: "بيانات الفئة غير صالحة.",
    categorySaved: "تم الحفظ.",
    customerWaTitle: "محادثات واتساب",
    customerWaEmpty: "لا توجد محادثات واتساب مرتبطة برقم هذا العميل.",
    customerWaOpen: "فتح المحادثة",
    customerNotesSave: "حفظ الملاحظات",
    customerNotesSaved: "تم حفظ الملاحظات.",
    customerNotesFailed: "تعذّر حفظ الملاحظات.",
    customerNotesInvalid: "الملاحظة أطول من المسموح.",
    customerNotesHelper:
      "ملاحظات داخلية للإدارة فقط. لا تغيّر حالة الطلب ولا محادثة واتساب.",
    kindCatalog: "من الكتالوج",
    kindNonCatalog: "خارج الكتالوج",
    modeRequestQuote: "طلب عرض سعر",
    modeProposePrice: "اقتراح سعر",
    status: {
      retail: {
        draft: "مسودة",
        ready_for_handoff: "جاهز للتحويل",
        handoff_opened: "فُتح واتساب",
        in_follow_up: "قيد المتابعة",
        completed: "مكتمل",
        cancelled: "ملغى",
      },
      deal: {
        proposed: "مقترحة",
        negotiating: "قيد التفاوض",
        accepted: "مقبولة",
        rejected: "مرفوضة",
        closed: "مغلقة",
      },
      wholesale: {
        submitted: "مُقدَّم",
        under_review: "قيد المراجعة",
        quote_provided: "تم تقديم عرض السعر",
        confirmed: "مؤكد",
        completed: "مكتمل",
        cancelled: "ملغى",
      },
      trader: {
        active: "نشط",
        disabled: "معطّل",
      },
      offer: {
        draft: "مسودة",
        published: "منشور",
        unpublished: "غير منشور",
      },
    },
    productStatus: {
      draft: "مسودة",
      published: "منشور",
      archived: "مؤرشف",
    },
    availability: {
      available: "متوفر",
      unavailable: "غير متوفر",
    },
    detail: {
      retailEvent: {
        prepared: "تحضير التحويل",
        opened: "فتح التحويل",
        status_changed: "تغيير الحالة",
        retriggered: "إعادة توليد التحويل",
      },
      actor: { customer: "العميل", admin: "الإدارة", trader: "التاجر" },
      langAr: "العربية",
      langEn: "الإنجليزية",
      locale: "لغة الطلب",
      destination: "بلد الوجهة",
      shippingMethod: "طريقة الشحن",
      shippingUnconfirmed: "غير محددة — يُؤكَّد مع الفريق",
      subtotal: "المجموع الفرعي",
      handoffPrepared: "تحضير التحويل",
      handoffOpened: "فتح التحويل",
      lines: "البنود",
      qty: "الكمية",
      customerNotes: "ملاحظات العميل",
      linkedConversation: "محادثة واتساب المرتبطة",
      linkedConversationOpen: "فتح في الصندوق",
      linkedConversationNone:
        "لا محادثة مرتبطة بعد — اربط المحادثة من صندوق الوارد عند اكتمال اتصال واتساب.",
      storedMessage: "رسالة واتساب المحفوظة",
      handoffPayload: "بيانات التحويل المهيكلة",
      auditEvents: "سجل الأحداث",
      noEvents: "لا أحداث بعد.",
      traderNotes: "ملاحظات التاجر",
      productReference: "المنتج المرتبط",
      nonCatalogNoProduct: "خارج الكتالوج — لم يُنشأ منتج",
      commercialSnapshot: "الشروط التجارية الحالية",
      conditions: "الشروط والملاحظات",
      negotiationHistory: "سجل التفاوض",
      terms: "الشروط",
      publicOfferTitle: "عرض عام منسّق",
      publicOfferBody:
        "اختياري وبقرار صريح. قبول الصفقة لا ينشر أي عرض تلقائياً.",
      createDraftOffer: "إنشاء مسودة عرض من هذه الصفقة",
      linesSnapshot: "البنود (لقطات تاريخية)",
      proposedPrice: "السعر المقترح",
      noProposedPrice: "لا سعر مقترح (وضع طلب عرض سعر)",
      quotedUnit: "سعر الوحدة المعروض",
      catalogRetailRef: "مرجع سعر التجزئة في الكتالوج",
      wholesaleRequestTitle: "طلب جملة",
      editOffer: "تعديل العرض",
      newOfferTitle: "عرض منسّق جديد",
      newOfferLead: "يُنشأ كمسودة. النشر العام يتطلب إجراء نشر صريحاً.",
      newProductTitle: "منتج جديد",
      stepperLabel: "مسار الحالة",
      stepDone: "مكتملة",
      stepCurrent: "الحالية",
      stepUpcoming: "قادمة",
      stepEnded: "منتهية",
    },
    form: {
      operations: "العمليات",
      operationsHint:
        "الانتقالات تُنفَّذ على الخادم وتُسجَّل في السجل. إعادة التحويل تُنشئ رسالة واتساب جديدة على الطلب نفسه — دون طلب مكرر.",
      moveTo: "الانتقال إلى",
      note: "ملاحظة",
      noteOptional: "ملاحظة (اختياري)",
      applyTransition: "تطبيق الانتقال",
      apply: "تطبيق",
      statusUpdated: "تم تحديث الحالة.",
      terminalNoTransitions: "حالة نهائية — لا انتقالات متاحة.",
      retrigger: "إعادة توليد التحويل",
      handoffRegenerated: "أُعيد توليد التحويل على الطلب نفسه.",
      openHandoff: "فتح تحويل واتساب",
      handoffMarkedOpened: "سُجّل فتح التحويل.",
      adminOperations: "عمليات الإدارة",
      terminalStatus: "حالة نهائية.",
      blockedUntilQuote: "(محجوب حتى تقديم عرض السعر — استخدم نموذج العرض)",
      provideQuote: "تقديم عرض سعر",
      quoteHint:
        "مسار عرض سعر بسيط فقط — دون دفع أو تكاليف شحن أو نظام محاسبي.",
      quoteCurrency: "عملة العرض",
      quotedUnitPrice: "سعر الوحدة المعروض",
      quoteMessage: "رسالة العرض",
      saveQuote: "حفظ العرض ← تم تقديم عرض السعر",
      quoteSaved: "تم حفظ عرض السعر.",
      shippingTitle: "بيانات الشحن",
      carrier: "شركة الشحن",
      trackingReference: "رقم التتبع",
      saveShipping: "حفظ الشحن",
      shippingSaved: "تم حفظ بيانات الشحن.",
      slug: "المعرّف (Slug)",
      titleAr: "العنوان (عربي)",
      titleEn: "العنوان (إنجليزي)",
      summaryAr: "الملخص (عربي)",
      summaryEn: "الملخص (إنجليزي)",
      bodyAr: "النص (عربي)",
      bodyEn: "النص (إنجليزي)",
      ctaLabelAr: "نص الزر (عربي)",
      ctaLabelEn: "نص الزر (إنجليزي)",
      href: "رابط داخلي",
      hrefHelp: "مسار داخلي يبدأ بـ / مثل /catalog أو /offers/slug",
      tone: "النبرة البصرية",
      imagePath: "مسار الصورة (اختياري)",
      startsAt: "يبدأ في (اختياري)",
      endsAt: "ينتهي في (اختياري)",
      savePromo: "حفظ الشريط",
      linkedDeal: "صفقة مرتبطة (اختياري)",
      linkedProduct: "منتج من الكتالوج (اختياري)",
      none: "بدون",
      sortOrder: "ترتيب العرض",
      saveOffer: "حفظ العرض",
      createDraft: "إنشاء مسودة",
      offerCurrentStatus: "الحالة الحالية",
      offerPublishNote: "النشر دائماً بقرار صريح.",
      plateAck:
        "أقرّ أن العرض يعتمد لوحة المادة دون منتج مرتبط في الكتالوج.",
      plateAckHelp: "مطلوب عند النشر بدون منتج مرتبط (لا يوجد حقل صورة للعرض).",
      publishNeedsTitleAr: "النشر يتطلب عنواناً عربياً.",
      publishNeedsSummaryAr: "النشر يتطلب ملخصاً عربياً.",
      publishNeedsProductOrPlate:
        "اربط منتجاً من الكتالوج أو أكّد إقرار لوحة المادة.",
      publishNeedsNameAr: "النشر يتطلب اسماً عربياً للمنتج.",
      publishNeedsImage: "النشر يتطلب صورة واحدة على الأقل. ارفع صورة ثم أعد المحاولة.",
      publishRulesHint: "للنشر: اسم عربي وصورة واحدة على الأقل.",
      setStatusTo: "تعيين الحالة: {status}",
      productNameAr: "الاسم (عربي)",
      productNameEn: "الاسم (إنجليزي)",
      descriptionAr: "الوصف (عربي)",
      descriptionEn: "الوصف (إنجليزي)",
      specsAr: "ميزات إضافية (عربي)",
      specsEn: "ميزات إضافية (إنجليزي)",
      specsHelp: "نص حر يظهر تحت مواصفات العود فقط — ليس بنوداً مستقلة.",
      oudSpecsTitle: "مواصفات العود (اختياري)",
      oudSpecsHint: "املأ ما ينطبق على هذه القطعة. الحقول الفارغة لا تظهر في المتجر.",
      oudWoodTitle: "نوع الخشب",
      oudMeasuresTitle: "مقاسات العود",
      oudDetailsTitle: "المواصفات",
      oudWoodBack: "الظهر",
      oudWoodFace: "الوجه",
      oudWoodPegs: "المفاتيح",
      oudWoodFingerboard: "لوحة الأصابع",
      oudWoodBridge: "مربط الأوتار",
      oudFaceWidth: "عرض الوجه",
      oudFaceDepth: "عمق الظهر",
      oudFaceLength: "طول الوجه",
      oudNeckLength: "طول الزند",
      oudStringLength: "طول الوتر",
      oudStandardNeck: "الزند عياري",
      oudStandardNeckUnset: "غير محدد",
      oudStandardNeckYes: "عياري",
      oudStandardNeckNo: "غير عياري",
      oudFinish: "نوع الطلاء",
      oudMm: "بالملليمتر",
      oudAr: "عربي",
      oudEn: "إنجليزي",
      category: "الفئة",
      retailPrice: "سعر التجزئة",
      compareAtPrice: "السعر السابق (اختياري)",
      compareAtHelp: "اتركه فارغاً إن لم يكن هناك سعر سابق. يظهر الخصم فقط إذا كان أعلى من سعر التجزئة.",
      currency: "رمز العملة",
      currencyHelp: "قابل للضبط — القيمة التجارية الافتراضية ما زالت مفتوحة.",
      currencyPlaceholder: "مثال: TEST لبيانات الاختبار فقط",
      statusLabel: "الحالة",
      availabilityLabel: "التوفر",
      availabilityHelp: "علامة توفر للتجزئة، وليست مخزوناً.",
      wholesaleEligible: "مؤهَّل للجملة",
      wholesaleEligibleHelp: "علامة فقط — لا واجهة جملة مرتبطة بها حالياً.",
      storeBadges: "شارات المتجر",
      storeBadgesHelp: "تظهر على بطاقة المنتج وصورة القطعة. يتحكم الأدمن بكل شارة بشكل مستقل.",
      badgeNew: "جديد",
      badgeFeatured: "مميّز",
      badgeSale: "خصم",
      previewStorefront: "معاينة في المتجر",
      saveProduct: "حفظ المنتج",
      saving: "جارٍ الحفظ…",
    },
  },
  trader: {
    brand: "بوابة التجّار",
    overview: "الرئيسية",
    deals: "صفقاتي",
    newDeal: "اقتراح صفقة",
    wholesale: "الجملة",
    wholesaleRequests: "طلبات الجملة",
    brokerage: "الوساطة",
    newBrokerage: "طلب وساطة",
    taskBrokerageTitle: "اطلب وساطة",
    taskBrokerageBody: "رأينا قطعة؟ نعاينها ونرسل عرضاً قبل الشراء.",
    offers: "العروض العامة",
    profile: "حسابي",
    logout: "خروج",
    welcome: "أهلاً، {name}",
    waitingToday: "{n} أمور بانتظارك اليوم · {date}",
    waitingTodayZero: "لا شيء بانتظارك اليوم · {date}",
    lead: "فاوض على الصفقات وقدّم طلبات الجملة من مخزون RARE OUD — هذه البوابة ليست متجراً.",
    homeTasksTitle: "ابدأ من هنا",
    taskDealTitle: "اقترح صفقة",
    taskDealBody: "قدّم عرضاً تجارياً على قطعة من الكتالوج أو خارجها.",
    taskWholesaleTitle: "اطلب بالجملة",
    taskWholesaleBody: "اختر القطع والكميات؛ الإدارة ترد بعرض السعر.",
    myDeals: "صفقاتي ({n})",
    waitingTitle: "بانتظارك",
    waitingIdle: "لا شيء بانتظارك الآن",
    openRecord: "فتح",
    offersNow: "العروض المتاحة الآن",
    viewAllOffers: "عرض الكل",
    dealStatus: {
      proposed: "مقترحة",
      negotiating: "قيد التفاوض",
      accepted: "مقبولة",
      rejected: "مرفوضة",
      closed: "مغلقة",
    },
    wholesaleStatus: {
      submitted: "مُرسل",
      under_review: "قيد المراجعة",
      quote_provided: "تم تقديم عرض السعر",
      confirmed: "مؤكَّد",
      completed: "مكتمل",
      cancelled: "ملغى",
    },
    requestMode: {
      request_quote: "طلب عرض سعر",
      propose_price: "اقتراح سعر الوحدة",
    },
    dealKind: {
      catalog: "صفقة من الكتالوج",
      non_catalog: "فرصة خارج الكتالوج",
    },
    actorRole: { trader: "التاجر", admin: "الإدارة" },
    dealAction: {
      propose: "اقتراح",
      continue: "متابعة",
      counter: "عرض مقابل",
      accept: "قبول",
      reject: "رفض",
      close: "إغلاق",
    },
    wholesaleEvent: {
      submitted: "تم الإرسال",
      status_changed: "تغيّرت الحالة",
      quote_provided: "تم تقديم عرض السعر",
      trader_accepted: "قبل التاجر العرض",
      trader_declined: "رفض التاجر العرض",
    },
    accountStatus: { active: "نشط", disabled: "معطّل" },
    unknownStatus: "غير معروف",
    waitingOnYou: "بانتظارك",
    waitingOnAdmin: "بانتظار الإدارة",
    dealsTitle: "مقترحات صفقاتي",
    dealsEmpty: "لا توجد مقترحات بعد",
    dealsEmptyBody: "ابدأ بتقديم أول مقترح صفقة إلى RARE OUD.",
    dealsTabList: "تصفية الصفقات",
    dealsTabAll: "الكل",
    dealsTabWaiting: "بانتظاري",
    dealsTabNegotiating: "قيد التفاوض",
    dealsTabClosed: "مغلقة",
    wsTabList: "تصفية طلبات الجملة",
    wsTabAll: "الكل",
    wsTabWaiting: "بانتظاري",
    wsTabOpen: "مفتوحة",
    wsTabClosed: "مغلقة",
    accountRequestHelp: "لا تملك حساباً؟ اطلب حساب تاجر عبر واتساب",
    entriesCount: "{n} إدخالات",
    colReference: "المرجع",
    colTitle: "العنوان",
    colKind: "النوع",
    colStatus: "الحالة",
    colEntries: "الإدخالات",
    newDealTitle: "اقتراح صفقة",
    newDealLead:
      "اقترح صفقة على قطعة من الكتالوج أو فرصة جديدة؛ يراجعها الفريق.",
    sectionType: "الطلب",
    sectionTerms: "الشروط",
    sectionMessage: "الرسالة الأولى",
    sectionReview: "المراجعة",
    wizardStepOf: "{current} من {total}",
    wizardBack: "رجوع",
    wizardNext: "التالي",
    wizardEdit: "تعديل",
    wizardLeaveConfirm: "لديك مسودة غير مرسلة. هل تريد المغادرة؟",
    wizardNeedTitle: "أدخل عنوان الصفقة للمتابعة.",
    wizardNeedProduct: "اختر منتجاً من الكتالوج للمتابعة.",
    recentActivity: "نشاطي الأخير",
    recentActivityEmpty: "لا نشاط حديث بعد.",
    activityDeal: "صفقة {ref}",
    activityWholesale: "طلب جملة {ref}",
    maxQtyPerPiece: "الكمية القصوى لكل قطعة {n}",
    wsPickerSearch: "بحث عن قطعة",
    wsPickerAllCategories: "الكل",
    wsSelectedCount: "{n} قطعة محددة",
    wsReviewSend: "مراجعة وإرسال",
    wsReviewTitle: "مراجعة الطلب",
    wsAddPiece: "إضافة",
    wsRemovePiece: "إزالة",
    wsQtyFor: "كمية {name}",
    wsQtyIncrease: "زيادة الكمية",
    wsQtyDecrease: "إنقاص الكمية",
    dealTypeLabel: "نوع الصفقة",
    dealTitleLabel: "الموضوع / العنوان",
    productLabel: "منتج من الكتالوج",
    productPlaceholder: "اختر المنتج",
    nonCatalogNote:
      "المقترحات خارج الكتالوج لا تُنشئ ولا تعدّل أي منتجات أو تصنيفات.",
    priceOptional: "السعر المقترح (اختياري)",
    currencyLabel: "العملة",
    quantityLabel: "الكمية",
    conditionsLabel: "الشروط / ملاحظات",
    initialMessageLabel: "الرسالة الأولى",
    submitProposal: "إرسال المقترح",
    submitting: "جارٍ الإرسال…",
    dealProduct: "المنتج",
    dealNonCatalog: "خارج الكتالوج (بلا ربط بمنتج)",
    dealSnapshot: "الملخص التجاري",
    dealQtyShort: "الكمية",
    dealConditions: "الشروط / ملاحظات",
    dealHistory: "سجل التفاوض",
    dealTerms: "الشروط",
    dealClosed: "هذه الصفقة {status}. التفاوض مغلق.",
    dealWaitingBanner: "ردّت الإدارة — بانتظار ردّك على هذه الصفقة.",
    dealWaitingAdmin: "بانتظار ردّ إدارة RARE OUD.",
    dealRejected: "رُفضت هذه الصفقة.",
    dealRejectedWithReason: "رُفضت هذه الصفقة: {reason}",
    negTitle: "ردّك في التفاوض",
    negHint: "تفاوض منظّم وليس محادثة. اختر متابعة أو عرضاً مقابلاً أو قبولاً أو رفضاً أو إغلاقاً.",
    negAction: "الإجراء",
    negMessage: "الرسالة",
    negRejectReason: "سبب الرفض (اختياري)",
    negRejectReasonHint: "يظهر السبب للتاجر إن وُجد",
    conflictWarningTitle: "تحذير: صفقات نشطة أخرى على نفس المنتج",
    negPrice: "السعر المقترح",
    negCurrency: "العملة",
    negQty: "الكمية",
    negConditions: "الشروط / ملاحظات",
    negRecorded: "تم تسجيل إدخال التفاوض.",
    negSubmit: "إرسال الإدخال",
    wsTitle: "طلب بالجملة",
    wsLead: "اختر القطع والكميات من مخزون RARE OUD.",
    wsMyRequests: "طلباتي بالجملة",
    wsNewRequest: "طلب جديد",
    wsEmpty: "لا توجد طلبات جملة بعد",
    wsEmptyBody: "اختر القطع والكميات وستردّ الإدارة بعرض السعر.",
    wsColReference: "المرجع",
    wsColMode: "النمط",
    wsColStatus: "الحالة",
    wsColLines: "البنود",
    wsLinesCount: "{n} بنود",
    wsDetailTitle: "طلب جملة",
    wsYourNotes: "ملاحظاتك",
    wsLines: "البنود (لقطات وقت الإرسال)",
    wsQty: "الكمية",
    wsProposed: "سعرك المقترح",
    wsQuoted: "سعر الوحدة المعروض",
    wsRetailRef: "مرجع التجزئة في الكتالوج (ليس سعر جملة)",
    wsQuoteTitle: "عرض السعر",
    wsQuotedAt: "تاريخ العرض",
    wsQuoteCurrency: "عملة العرض",
    wsQuoteMessage: "رسالة الإدارة",
    wsQuoteLines: "أسعار الوحدة حسب البند",
    wsQuoteBanner: "وصلك عرض سعر — راجعه ثم اقبله أو ارفضه.",
    wsHistory: "السجل",
    wsTraderResponse: "ردّك على العرض",
    wsModeLabel: "نمط الطلب",
    wsFormHint:
      "لا تفرض المنصة سعر جملة. استخدم «طلب عرض سعر» إلا إذا كنت تقترح سعر وحدة خاصاً بك. سعر التجزئة المعروض مرجع فقط وليس سعر جملة. الحد الأدنى للطلب غير مفروض، والحد الأقصى للكمية ({max}) حدّ أمان تقني فقط.",
    wsColProduct: "المنتج",
    wsColRetail: "تجزئة الكتالوج (مرجع)",
    wsColQty: "الكمية",
    wsColUnitPrice: "سعر الوحدة عندك",
    wsColCurrency: "العملة",
    wsNoProducts: "لا توجد منتجات منشورة مؤهلة للجملة.",
    wsNotes: "ملاحظات",
    wsSubmit: "إرسال طلب الجملة",
    wsActions: "الإجراءات",
    wsReviewQuote: "راجع عرض السعر ثم اقبله (نيّة تنفيذ) أو ارفضه.",
    wsNoteOptional: "ملاحظة (اختياري)",
    wsAccept: "قبول العرض",
    wsDecline: "رفض",
    wsResponseRecorded: "تم تسجيل ردّك.",
    wsCancel: "إلغاء الطلب",
    wsCancelled: "تم إلغاء الطلب.",
    wsNoActions: "لا إجراءات متاحة للتاجر في هذه الحالة.",
    profileTitle: "حسابي",
    profileName: "الاسم المعروض",
    profileEmail: "البريد الإلكتروني",
    profileCompany: "الشركة",
    profilePhone: "الهاتف",
    profileStatus: "الحالة",
    profileNote:
      "تغييرات الحساب تتم عبر إدارة RARE OUD. حدّث تفضيلات الصفقات أدناه لمساعدة المطابقة.",
    prefsTitle: "تفضيلات الصفقات",
    prefsLead:
      "أخبر الإدارة بأنواع المنتجات التي تهمّك — لا يظهر هذا للمتسوقين.",
    prefsCategories: "فئات الاهتمام",
    prefsCategoriesHint: "اختر فئة أو أكثر من فئات الإطلاق.",
    prefsNotes: "ملاحظات التفضيل",
    prefsSave: "حفظ التفضيلات",
    prefsSaved: "تم حفظ التفضيلات.",
    notifications: "الإشعارات",
    notificationsTitle: "مركز الحالة",
    notificationsLead:
      "تحديثات عن صفقاتك وطلبات الجملة — اقرأها من هنا دون مغادرة البوابة.",
    notificationsEmpty: "لا إشعارات بعد",
    notificationsEmptyBody:
      "عند رد الإدارة على صفقة أو طلب جملة سيظهر التحديث هنا.",
    notificationsMarkAll: "تعليم الكل كمقروء",
    notificationsMarkRead: "مقروء",
    notificationsOpen: "فتح",
    offersTitle: "العروض العامة المختارة",
    offersLead: "عروض RARE OUD المنشورة فقط — وليست متاجر للتجّار.",
    offersEmpty: "لا توجد عروض منشورة بعد.",
    offersBack: "العودة إلى العروض",
    offersRelatedProduct: "المنتج المرتبط",
    offersStartDeal: "بدء صفقة من هذا العرض",
    confirmCancel: "إلغاء",
    negConfirmAcceptTitle: "قبول هذه الصفقة؟",
    negConfirmAcceptBody: "القبول يُقفل التفاوض ويسجّل موافقتك على الشروط الحالية.",
    negConfirmCloseTitle: "إغلاق هذه الصفقة؟",
    negConfirmCloseBody: "الإغلاق يُنهي التفاوض دون قبول. لا يمكن التراجع من هنا.",
    negConfirmRejectTitle: "رفض هذه الصفقة؟",
    negConfirmRejectBody: "الرفض يُنهي الصفقة. يمكنك إضافة سبب يظهر للتاجر.",
    wsConfirmAcceptTitle: "قبول عرض السعر؟",
    wsConfirmAcceptBody: "القبول يعني نيّة التنفيذ على الأسعار المعروضة.",
    wsConfirmDeclineTitle: "رفض عرض السعر؟",
    wsConfirmDeclineBody: "رفض العرض يُلغي طلب الجملة. يمكنك إرسال طلب جديد لاحقاً.",
    wsConfirmCancelTitle: "إلغاء طلب الجملة؟",
    wsConfirmCancelBody: "سيُلغى الطلب ولن تتمكن من تعديله بعد الإلغاء.",
    actionErrorUnauthorized: "انتهت جلستك. سجّل الدخول من جديد.",
    actionErrorNotAllowed: "هذا الإجراء غير متاح لهذه الحالة.",
    actionErrorInvalid: "تعذّر إرسال البيانات. راجع الحقول وحاول مرة أخرى.",
    actionErrorGeneric: "تعذّر إكمال العملية. حاول مرة أخرى.",
    actionError: {},
  },
  inbox: {
    title: "صندوق واتساب",
    subtitle: "محادثات واتساب",
    empty: "لا توجد محادثات بعد. ستظهر عند وصول رسائل واتساب حقيقية.",
    backToList: "كل المحادثات",
    lastMessage: "آخر رسالة",
    unread: "غير مقروء",
    connection: "حالة الاتصال",
    outboundDisabled: "الإرسال معطّل",
    outboundEnabled: "الإرسال مفعّل",
    replyPlaceholder: "اكتب ردّاً نصياً…",
    send: "إرسال",
    sending: "جارٍ الإرسال…",
    inbound: "واردة",
    outbound: "صادرة",
    statusPending: "قيد الإرسال",
    statusSent: "أُرسلت",
    statusFailed: "فشل الإرسال",
    statusReceived: "مستلمة",
    unsupported: "مرفق",
    sendFailed: "لم تُرسل — إعادة المحاولة",
    sendBlocked: "لا يمكن الإرسال بينما الإرسال معطّل.",
    sendSuccess: "أُدرجت الرسالة في قائمة الإرسال.",
    notLinked: "غير مرتبط",
    healthDisconnected: "غير متصل",
    healthConnecting: "جارٍ الاتصال",
    healthConnected: "متصل",
    healthReconnecting: "إعادة الاتصال",
    healthAuthRequired: "مطلوب مصادقة",
    healthError: "خطأ",
    openConversation: "فتح",
    noMessages: "لا رسائل في هذه المحادثة.",
    refresh: "تحديث",
    statusSending: "جارٍ الإرسال",
    businessContext: "سياق العمل",
    linkType: "نوع السجل",
    linkRecordId: "معرّف السجل",
    linkSave: "ربط",
    linkClear: "إزالة الربط",
    linkChange: "تغيير الربط",
    linkedAs: "مرتبط بـ",
    linkHistory: "سجل الربط",
    linkAuditSet: "ربط",
    linkAuditChange: "تغيير الربط",
    linkAuditClear: "إزالة الربط",
    linkConfirmHint: "الربط لا يغيّر حالة السجل التجاري.",
    openLinkedRecord: "فتح السجل في الإدارة",
    typeRetail: "طلب تجزئة",
    typeDeal: "اقتراح صفقة",
    typeWholesale: "طلب جملة",
    contextStatus: "الحالة",
    contextUpdated: "آخر تحديث",
    contextIdentity: "الهوية",
    contextTitle: "العنوان",
    contextDealKind: "نوع الصفقة",
    contextRequestMode: "وضع الطلب",
    contextProduct: "المنتج",
    contextLines: "البنود",
    contextLatestNegotiation: "آخر تفاوض",
    contextReference: "المرجع / المعرّف",
    linkErrorUnsupported: "نوع ربط غير مدعوم.",
    linkErrorNotFound: "السجل غير موجود.",
    linkErrorUnauthorized: "غير مصرّح.",
    linkSuccess: "تم ربط المحادثة.",
    unlinkSuccess: "تمت إزالة الربط.",
    conversations: "المحادثات",
    selectConversation: "اختر محادثة",
    selectConversationHint: "اختر محادثة من القائمة لعرض الرسائل وسياق العمل.",
    tabAll: "الكل",
    tabUnread: "غير مقروءة",
    tabLinked: "مرتبطة",
    tabUnlinked: "غير مرتبطة",
    searchPlaceholder: "بحث بالاسم أو الهاتف…",
    connected: "متصل",
    connecting: "جارٍ الاتصال…",
    disconnected: "غير متصل",
    authRequired: "يتطلب ربط الحساب",
    error: "خطأ في الاتصال",
    sendingPaused: "الإرسال عبر واتساب متوقف مؤقتاً",
    rateLimited: "تم بلوغ حد الإرسال، حاول بعد قليل",
    linkAccount: "ربط الحساب",
    reconnect: "إعادة الاتصال",
    nonText: "مرفق",
    retry: "إعادة المحاولة",
    newMessages: "رسائل جديدة ↓",
    linkRecord: "ربط بسجل",
    unlinkConfirm: "إزالة الربط؟",
    pickRecord: "اختيار سجل",
    searchRecords: "بحث بالمرجع…",
    openContext: "التفاصيل",
    confirmLink: "تأكيد الربط",
    confirmUnlink: "تأكيد إزالة الربط",
    lengthNearLimit: "قرب الحد الأقصى",
    emptyThread: "لا رسائل بعد",
    pairingTitle: "ربط حساب واتساب",
    pairingHint:
      "أدخل رقم الهاتف مع رمز الدولة، ثم أدخل الرمز الظاهر في واتساب على الهاتف: الأجهزة المرتبطة ← ربط جهاز ← الربط برقم الهاتف.",
    pairingPhone: "رقم الهاتف مع رمز الدولة (أرقام فقط)",
    pairingSubmit: "طلب رمز الربط",
    pairingAwaiting: "بانتظار إدخال الرمز على الهاتف",
    pairingCodeLabel: "رمز الربط",
    pairingQrOptional: "عرض رمز QR أيضاً",
    pairingConnected: "الحساب مرتبط ومتصل",
    pairingNotLinked: "لا يوجد حساب مرتبط",
    pairingError: "تعذّر ربط الحساب، تحقق من الرقم وحاول مرة أخرى",
    pairingLogout: "تسجيل الخروج من الحساب",
  },
  common: {
    language: "EN",
    loading: "جارٍ التحميل…",
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تعديل",
    create: "إنشاء",
    menu: "القائمة",
    close: "إغلاق",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signIn: "دخول",
    errorTitle: "تعذّر إكمال العملية",
    errorBody:
      "حاول مرة أخرى. وإن استمرت المشكلة تواصل معنا عبر واتساب.",
    errorRetry: "إعادة المحاولة",
    errorNotFound: "الصفحة غير موجودة",
    errorForbidden: "هذا القسم غير متاح لحسابك",
    errorSession: "انتهت جلستك. سجّل الدخول من جديد.",
    errorOffline: "لا يوجد اتصال بالإنترنت",
    backOnline: "عاد الاتصال بالإنترنت",
    toastDismiss: "إغلاق الإشعار",
    goToPortal: "الانتقال إلى بوابتك",
    signOut: "تسجيل الخروج",
    navOps: "التشغيل",
    navCatalog: "الكتالوج",
    navPeople: "الأشخاص",
    switchOn: "مفعّل",
    switchOff: "متوقف",
    paginationPrevious: "السابق",
    paginationNext: "التالي",
    paginationPageOf: "صفحة {page} من {pages}",
    timelineLabel: "سجل النشاط",
    greetingMorning: "صباح الخير",
    greetingAfternoon: "طاب يومك",
    greetingEvening: "مساء الخير",
    greetingNamed: "{greeting}، {name}",
  },
  contact: {
    title: "تواصل معنا",
    lead: "للاستفسار عن قطعة أو طلب تجاري، راسل فريق RARE OUD عبر واتساب.",
    whatsapp: "تحدث معنا على واتساب",
    hours: "الرد خلال ساعات العمل — الأحد إلى الخميس.",
    location: "سوريا · شحن دولي حسب الاتفاق.",
    missingNumber: "رقم واتساب غير مُعدّ بعد في البيئة.",
  },
  privacy: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: أكتوبر 2026",
    body:
      "[PLACEHOLDER — نص تجريبي] يُستبدل بنص قانوني يعتمده العميل قبل الإطلاق.",
    tocLabel: "محتويات الصفحة",
    placeholderBanner:
      "نص تجريبي — PLACEHOLDER. يستبدل بنص الخصوصية القانوني المعتمد من العميل قبل الإطلاق. ليس نصاً قانونياً.",
    s1Title: "ما نجمعه",
    s1Body:
      "[PLACEHOLDER] قسم تجريبي يوضح هيكل الصفحة فقط. يضع العميل هنا نص جمع البيانات المعتمد.",
    s2Title: "كيف نستخدمها",
    s2Body:
      "[PLACEHOLDER] قسم تجريبي. يضع العميل هنا نص استخدام البيانات والتواصل المعتمد.",
    s3Title: "ملفات الارتباط والتواصل",
    s3Body:
      "[PLACEHOLDER] قسم تجريبي. يضع العميل هنا نص ملفات الارتباط وقنوات التواصل المعتمد.",
  },
  terms: {
    title: "شروط الاستخدام",
    fallbackBody: "محتوى الشروط قيد الإعداد.",
  },
  auth: {
    adminTitle: "دخول الإدارة",
    traderTitle: "دخول التجّار",
    traderHint: "الحسابات تُنشأ من الإدارة فقط — لا تسجيل ذاتي عام.",
    loginError: "البريد أو كلمة المرور غير صحيحة.",
    loginLocked: "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.",
    totpLabel: "رمز التحقق أو الاسترداد",
    totpRequired: "أدخل رمز التحقق أو رمز الاسترداد.",
    totpInvalid: "رمز التحقق غير صحيح.",
    totpEnrollRequired: "فعّل التحقق بخطوتين من إعدادات الأمان قبل الدخول.",
    totpEnrollButton: "ابدأ تفعيل التحقق بخطوتين",
    showPassword: "إظهار",
    hidePassword: "إخفاء",
    sessionInvalidatedNotice:
      "تم تغيير كلمة المرور من جهاز آخر. سجّل الدخول من جديد.",
  },
  forcePasswordChange: {
    title: "عيّن كلمة مرور جديدة",
    subtitle: "هذه خطوة لمرة واحدة",
    explanation:
      "أعادت الإدارة تعيين كلمة مرور حسابك. لأسباب أمنية لا تستطيع الإدارة رؤية كلمة مرورك الحالية في أي وقت — عليك اختيار كلمة مرور جديدة الآن قبل المتابعة.",
    currentPassword: "كلمة المرور المؤقتة الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    mismatch: "كلمتا المرور غير متطابقتين",
    submit: "تعيين كلمة المرور والمتابعة",
    strengthLabel: "قوة كلمة المرور",
    strengthWeak: "ضعيفة",
    strengthFair: "مقبولة",
    strengthGood: "جيدة",
    strengthStrong: "قوية",
    strengthVeryStrong: "قوية جداً",
    ruleLength: "10 أحرف على الأقل",
    ruleNotTemp: "مختلفة عن كلمة المرور المؤقتة",
    ruleNotEmail: "مختلفة عن بريدك الإلكتروني",
    errorCurrentWrong: "كلمة المرور الحالية غير صحيحة.",
    errorWeak: "كلمة المرور يجب أن تكون 10 أحرف على الأقل.",
    errorSameAsTemp: "لا يمكن استخدام كلمة المرور المؤقتة نفسها.",
    errorSameAsEmail: "لا يمكن أن تكون كلمة المرور بريدك الإلكتروني.",
    success: "تم تعيين كلمة المرور. سجّلنا خروجك من الأجهزة الأخرى.",
    signOut: "تسجيل الخروج",
    showPassword: "إظهار",
    hidePassword: "إخفاء",
  },
  changePassword: {
    sectionTitle: "تغيير كلمة المرور",
    sectionLead: "استخدم كلمة مرور قوية خاصة بهذا الحساب فقط.",
    submit: "تحديث كلمة المرور",
    success: "تم تحديث كلمة المرور.",
  },
  seo: {
    catalogDescription:
      "تصفّح المجموعة المنشورة من RARE OUD — قطع مختارة بعناية، يمكن إضافتها إلى قائمة الطلب وإرسالها للفريق عبر واتساب.",
    productFallbackDescription:
      "قطعة من مجموعة RARE OUD المنشورة. اطّلع على التفاصيل وأضفها إلى قائمة الطلب.",
    privacyDescription:
      "كيف تجمع RARE OUD بيانات التواصل اللازمة لتجهيز طلبك وكيف تستخدمها.",
  },
};

const en: Dict = {
  brand: "RARE OUD",
  nav: {
    home: "Home",
    catalog: "Catalog",
    offers: "Curated offers",
    cart: "Request list",
    contact: "Contact",
    admin: "Admin",
    story: "Our story",
    traders: "Traders",
    primaryAria: "Primary navigation",
    mobileAria: "Mobile navigation",
    languageAria: "Switch to Arabic",
    cartAria: "Request list — {n} items",
  },
  home: {
    headline: "A rare oud made to last",
    sub: "Pieces chosen with care, shaped by hand, and delivered with the respect they deserve.",
    heroLabel: "RARE OUD",
    ctaCatalog: "Explore the collection",
    ctaOffers: "Curated offers",
    ctaStory: "Our story",
    handoffTitle: "How requesting works",
    handoffStep1: "Add pieces to your request list",
    handoffStep2: "Enter your contact details",
    handoffStep3: "Open WhatsApp to send the request to the team",
    traderBandTitle: "For traders",
    traderBandLead: "Propose a deal, negotiate, and we ship from RARE OUD stock.",
    traderBandCta: "Trader sign in",
    latestPieces: "Latest pieces",
    viewCollection: "View collection",
    introEyebrow: "The house",
    introTitle: "Cultural depth, contemporary precision",
    introBody:
      "RARE OUD joins the quiet authority of a cultural house with a modern digital platform — where material, rarity, and presence are presented with care, never as disposable commerce.",
    featuredEyebrow: "Featured",
    featuredTitle: "Pieces that merit attention",
    featuredIntro: "A curated reading of the published catalog — hierarchical, not a uniform grid.",
    featuredLead: "Lead piece",
    featuredEmpty: "No published products to feature yet.",
    available: "Available",
    unavailable: "Unavailable",
    categoriesEyebrow: "Collections",
    categoriesTitle: "Two paths, one universe",
    categoriesIntro: "The two launch categories on the platform — distinct visual worlds within the RARE OUD identity.",
    categoriesCta: "Explore",
    categoryDescInstruments: "Discover the first collection in the catalog.",
    categoryDescAccessories: "Selected accessories for travel and daily play.",
    categoryDescEconomy: "Workshop ouds for practice and everyday playing.",
    categoryDescMid: "Balanced ouds for regular use and studio work.",
    categoryDescProfessional: "Concert ouds with clearer tone and quick response.",
    categoryDescVip: "Rare pieces with selected woods and atelier finishing.",
    oudEyebrow: "Rarity",
    oudTitle: "Rare material, considered selection",
    oudBody:
      "Oud and rare wood are understood here as material and presence — not ornament. We choose quietly. We present with precision.",
    oudDetail: "Editorial placeholder — replace when final approved copy is provided.",
    discoveryEyebrow: "Discovery",
    discoveryTitle: "A curated selection",
    discoverySub: "Offers and presentations published by RARE OUD with care — not seller listings.",
    discoveryEmpty: "No curated offers published yet. Browse the catalog to explore the collection.",
    discoveryCta: "View offers",
    principlesEyebrow: "Principles",
    principlesTitle: "What we hold to",
    principleRare: "Rare",
    principleSelected: "Selected",
    principleAuthentic: "Authentic",
    principleConsidered: "Considered",
    heroFeatRare: "Pieces that do not repeat",
    heroFeatSelected: "Quiet hand selection",
    heroFeatAuthentic: "Material and craft of the house",
    heroFeatConsidered: "Presented without commercial haste",
    finalCtaTitle: "Continue the discovery",
    finalCtaSub: "Move to the catalog or curated offers — and begin a request prepared for discussion with the RARE OUD team.",
    finalCtaButton: "Go to catalog",
    finalCtaSecondary: "Curated offers",
    viewProduct: "View product",
    footerTagline: "Oud and rare wood with contemporary cultural taste.",
    footerRights: "All rights reserved.",
    footerExplore: "Explore",
    search: "Search",
    searchPlaceholder: "Search the catalog…",
    searchEmpty: "No matching results.",
    searchResults: "Results",
    closeSearch: "Close search",
    shortcutCatalog: "Catalog",
    shortcutAvailable: "Available now",
    shortcutLatest: "Latest",
    shortcutOffers: "Curated offers",
    shortcutCategories: "Collections",
    pieces: "pieces",
    featuredInstrumentEyebrow: "Featured piece",
    mosaicEyebrow: "Discovery",
    mosaicTitle: "Explore the collection",
    curatedRailEyebrow: "Curated",
    curatedRailTitle: "Published offers",
    latestRailEyebrow: "Latest",
    latestRailTitle: "Recently published",
    secondaryRailEyebrow: "Collection",
    secondaryRailTitle: "More pieces",
    attributeEyebrow: "Filter",
    attributeTitle: "Discover by category & availability",
    attributeAll: "All",
    filterAvailable: "Available",
    filterUnavailable: "Unavailable",
    quickView: "Quick view",
    quickViewClose: "Close",
    viewDetails: "Full details",
    compare: "Compare",
    compareAdd: "Add to compare",
    compareRemove: "Remove",
    compareTitle: "Compare pieces",
    compareEmpty: "Select pieces to compare.",
    compareClear: "Clear",
    compareMax: "Up to 3 pieces",
    price: "Price",
    requestPiece: "Add to request",
    featuredOfferEyebrow: "Featured offer",
    featuredOfferCta: "View offer",
  },
  catalog: {
    title: "Catalog",
    empty: "The collection is being prepared",
    emptyHint: "New pieces will appear here soon.",
    search: "Search",
    filters: "Filters",
    allCategories: "All categories",
    lead: "Four oud tiers — economy, mid, professional, VIP — plus selected accessories. Pick what catches your eye and add it to your request list.",
    photoCaption: "Photography in progress",
    filtersTitle: "Filter & sort",
    typeLabel: "Type",
    priceLabel: "Price",
    priceMin: "Min",
    priceMax: "Max",
    priceCurrencyHint: "Catalog currency code (e.g. USD)",
    priceCurrencyShort: "ccy",
    showResultsForms: {
      zero: "Show {n} pieces",
      one: "Show {n} piece",
      two: "Show {n} pieces",
      few: "Show {n} pieces",
      many: "Show {n} pieces",
      other: "Show {n} pieces",
    },
    priceApply: "Apply",
    sortLabel: "Sort",
    sortNew: "Newest",
    sortPriceAsc: "Price: low to high",
    sortPriceDesc: "Price: high to low",
    clearAll: "Clear all",
    clearFilters: "Clear filters",
    activeFilters: "Active filters",
    removeFilter: "Remove filter: {label}",
    noResults: "No matching results",
    noResultsHint: "Try changing or clearing the filters to see every piece.",
    resultsUpdated: "Results updated: {n}",
    showResults: "Show {n} pieces",
    loadMore: "Show more",
    showing: "Showing {shown} of {total}",
    quickAdd: "Quick add to request",
    quickAdded: "{name} added to your request list",
    priceFrom: "From {value}",
    priceTo: "To {value}",
    searchLabel: "Search the collection",
  },
  offers: {
    title: "Curated offers",
    sub: "Carefully published presentations by RARE OUD. Not trader storefronts or seller listings.",
    empty: "No published offers yet.",
    back: "All offers",
    relatedProduct: "Related catalog product",
    viewOffer: "View offer",
    eyebrow: "Curated by RARE OUD",
    askAbout: "Ask about this offer",
  },
  product: {
    addToCart: "Add to request list",
    unavailable: "Currently unavailable",
    specs: "Specifications",
    priceOnRequest: "Price on request",
    available: "Available",
    unavailableReason: "This piece is not available to request right now.",
    contactUs: "Talk to us",
    added: "Added",
    description: "Description",
    related: "Related pieces",
    breadcrumb: "Breadcrumb",
    addedToast: "{name} added to your request list",
    viewCart: "View list",
    galleryLabel: "Product images",
    galleryShowImage: "Show image {n}",
    galleryEnlarge: "Enlarge image",
    galleryPrev: "Previous image",
    galleryNext: "Next image",
    galleryCounter: "Image {current} of {total}",
    priceWas: "Was",
    priceNow: "Now",
    onSale: "On offer",
    extras: "Extra features",
    oudSpecs: {
      title: "Oud specifications",
      wood: "Wood type",
      measures: "Oud measurements",
      details: "Specifications",
      back: "Back",
      face: "Face",
      pegs: "Keys",
      fingerboard: "Fingerboard",
      bridge: "String holder",
      faceWidth: "Face width",
      faceDepth: "Back depth",
      faceLength: "Face length",
      neckLength: "Neck length",
      stringLength: "String length",
      standardNeck: "Standard neck",
      standardNeckYes: "Standard",
      standardNeckNo: "Non-standard",
      finish: "Finish type",
      mm: "mm",
    },
  },
  cart: {
    title: "Request list",
    empty: "Your request list is empty.",
    continue: "Continue request",
    remove: "Remove",
    emptyTitle: "Your request list is empty",
    emptyBody:
      "Add pieces from the catalog to start your request, then send it to the RARE OUD team on WhatsApp.",
    listLabel: "Pieces in your request list",
    itemsCount: "{n} pieces",
    qtyLabel: "Quantity: {name}",
    removeAria: "Remove {name} from the request list",
    increase: "Increase quantity",
    decrease: "Decrease quantity",
    unitPrice: "Unit price",
    lineTotal: "Total",
    summaryTitle: "Request summary",
    summaryTotal: "Reference total",
    summaryNote:
      "The total is a reference, not an invoice — nothing is paid on the site. Price and shipping are confirmed with the team.",
  },
  request: {
    title: "Request details",
    name: "Name",
    phone: "Phone",
    phonePlaceholder: "+963…",
    phoneHelper: "Include country code",
    notes: "Notes",
    country: "Destination country",
    shippingNote:
      "Shipping options depend on destination. If no method is shown, shipping will be confirmed with the RARE OUD team.",
    submit: "Prepare request for handoff",
    success: "Your request is ready. Reference:",
    openWhatsApp: "Open WhatsApp handoff",
    handoffHint:
      "This is not a payment. Open WhatsApp to send your request details to the RARE OUD team.",
    messagePreview: "Prepared message:",
    listEmpty: "Your request list is empty.",
    privacyConsent:
      "By preparing this request you agree that your details are used only to contact you on WhatsApp, as described in our {link}.",
    privacyLink: "privacy policy",
    successTitle: "Your request is ready",
    referenceLabel: "Reference",
    copyReference: "Copy reference",
    copyMessage: "Copy message text",
    copied: "Copied",
    copyFailed: "Could not copy",
    nextStep: "Next: open WhatsApp and send the prepared message to the RARE OUD team.",
    emptyTitle: "No pieces in your request",
    emptyBody: "Add pieces from the catalog first, then come back to complete your request.",
    summaryTitle: "Pieces in this request",
    backToCart: "Back to request list",
    submitting: "Preparing…",
    opening: "Opening…",
  },
  admin: {
    login: "Admin sign in",
    dashboard: "Dashboard",
    products: "Products",
    categories: "Categories",
    customers: "Customers",
    requests: "Retail requests",
    inbox: "WhatsApp inbox",
    logout: "Sign out",
    traders: "Traders",
    deals: "Deals",
    wholesale: "Wholesale",
    brokerage: "Brokerage",
    offers: "Offers",
    promos: "Promos",
    kpiRetail: "New retail requests",
    kpiDeals: "Deals awaiting reply",
    kpiWholesale: "Wholesale requests",
    kpiBrokerage: "Active brokerage",
    kpiUnread: "Unread conversations",
    kpiIdle: "Nothing waiting for you",
    recentRequests: "Recent retail requests",
    actionQueue: "Needs your action",
    activityFeed: "Recent activity",
    actionOpen: "Open",
    actionEmpty: "Nothing waiting for you",
    activityEmpty: "No events yet.",
    nextActorAdmin: "Waiting on admin",
    lastConnected: "Last connected",
    neverConnected: "No connection recorded yet",
    reauthenticate: "Re-authenticate",
    viewAll: "View all",
    openInbox: "Open inbox",
    noRequests: "No requests yet.",
    newProduct: "New product",
    edit: "Edit",
    publishedCount: "Published products",
    connection: "WhatsApp status",
    outbound: "Outbound",
    colThumb: "Thumb",
    colSlug: "Slug",
    colName: "Name",
    colStatus: "Status",
    colAvailability: "Availability",
    colPrice: "Price",
    colCategory: "Category",
    imagesTitle: "Product images & video",
    imagesEmpty: "No media yet — upload an image or video below.",
    imagesLimits:
      "Image: JPEG / PNG / WebP up to 8 MB (longest side ≥ 1600 px) · Video: MP4 / WebM up to 48 MB · max 8 files",
    imagesAdd: "Upload image or video",
    imagesFileLabel: "Choose image or video",
    imagesKindVideo: "Video",
    imagesAfterSaveHint:
      "Save the product details first — you will then open the edit page to upload images and video.",
    imagesAltAr: "Alt text (Arabic)",
    imagesAltEn: "Alt text (English)",
    imagesPrimary: "Primary",
    imagesRemove: "Remove",
    imagesMoveEarlier: "Move earlier",
    imagesMoveLater: "Move later",
    imagesUploading: "Uploading…",
    imagesErrorType:
      "Unsupported file type. Use JPEG/PNG/WebP images or MP4/WebM video.",
    imagesErrorSize: "File exceeds the limit (8 MB for images, 48 MB for video).",
    imagesErrorDim: "For images: longest side must be at least 1600 px.",
    imagesErrorMax: "Maximum of 8 media files reached.",
    imagesErrorGeneric: "Could not upload the file.",
    quickProduct: "Product",
    quickOffer: "Offer",
    quickTrader: "Trader account",
    waitingToday: "{n} items waiting today · {date}",
    waitingTodayZero: "Nothing waiting today · {date}",
    filterAll: "All {n}",
    filterRetail: "Retail",
    filterDeals: "Deals",
    filterWholesale: "Wholesale",
    trendUp: "+{n} vs yesterday",
    trendDown: "−{n} vs yesterday",
    trendFlat: "Unchanged",
    contentHealth: "Catalog health",
    contentHealthRatio: "{have} of {total}",
    contentHealthMissing: "{n} pieces still need their own photos",
    contentHealthComplete: "Every published piece has photos",
    pipeline: "Request path",
    pipelineLegend: "New · Follow-up · Opened · Done",
    domainMixTitle: "Domain mix",
    whatsappNoun: "WhatsApp",
    whatsappLastMessage: "Last message {relative}",
    whatsappNoMessage: "No messages yet",
    piecesCount: "{n} pieces",
    commandSearch: "Search or command",
    commandPlaceholder: "Search a request, product, or trader…",
    commandEmpty: "No results",
    commandSearching: "Searching…",
    manageHub: "Manage",
    settings: "Security",
    savedToast: "Saved.",
  },
  adminUi: {
    colReference: "Reference",
    colCustomer: "Customer",
    colCountry: "Country",
    colTotal: "Total",
    colTrader: "Trader",
    colTitle: "Title",
    colKind: "Kind",
    colEntries: "Entries",
    colMode: "Mode",
    colLines: "Lines",
    colPhone: "Phone",
    colNotes: "Notes",
    colRequests: "Requests",
    colCreated: "Created",
    colLastEvent: "Last event",
    colItems: "Items",
    colHandoff: "Handoff",
    colLastRequest: "Last request",
    colShipping: "Shipping",
    colEmail: "Email",
    colDeals: "Deals",
    colDeal: "Deal",
    handoffOpened: "Opened",
    handoffPrepared: "Prepared",
    handoffNone: "—",
    shippingPlaceholder: "—",
    waitingOnYou: "Waiting on you",
    actionView: "View",
    actionNegotiate: "Negotiate",
    actionReview: "Review",
    requestsLead: "Retail requests from the storefront, newest first.",
    dealsLead:
      "Negotiation workspace with traders: propose, continue, counter, accept, close. Separate from retail requests.",
    wholesaleLead:
      "Trader wholesale requests, separate from retail requests and deals. Quote, confirm and complete only.",
    customersLead:
      "Contact records from retail requests. Phone is searchable but not a unique identity.",
    tradersLead: "Accounts are provisioned by admin only. No public registration.",
    categoriesLead:
      "Manage catalog categories: create, edit names and order. A category with products cannot be deleted.",
    offersLead: "Admin-curated public presentations — not trader storefronts.",
    newOffer: "New offer",
    promosLead:
      "Homepage promo bands — shown only when published and inside any set date window.",
    newPromo: "New promo band",
    deletePromo: "Delete band",
    promoStatus: {
      draft: "Draft",
      published: "Published",
    },
    promoTone: {
      ink: "Ink",
      plum: "Plum",
      sand: "Sand",
    },
    searchPlaceholder: "Search name or phone",
    searchRequests: "Search reference or customer",
    searchDeals: "Search reference or trader",
    searchWholesale: "Search reference or trader",
    searchProducts: "Search name or category",
    search: "Search",
    filterTabs: "Filter list",
    filterAll: "All",
    filterWaiting: "Waiting on you",
    negotiationThread: "Negotiation history",
    emptyTitle: "Nothing here yet",
    emptyBody: "Records will appear here once they are created.",
    newTrader: "Add trader",
    traderCreateTitle: "Create trader account",
    traderCreateLead:
      "Admin-provisioned only. A temporary password is generated and shown once after create.",
    traderEmail: "Email",
    traderPassword: "Temporary password (min 8)",
    traderDisplayName: "Display name",
    traderCompany: "Company (optional)",
    traderPhone: "Phone (optional)",
    traderNotes: "Admin notes",
    traderCreateSubmit: "Create trader",
    traderCreated: "Created.",
    traderTempPasswordTitle: "Temporary password",
    traderTempPasswordLead:
      "Copy the password now — it will not be shown again after you close this dialog.",
    traderTempPasswordCopy: "Copy",
    traderTempPasswordCopied: "Copied",
    traderTempPasswordAck:
      "I have copied the password and will share it with the trader securely.",
    traderTempPasswordClose: "Done — close",
    traderActivate: "Activate",
    traderDisable: "Disable",
    traderResetPassword: "Reset password",
    traderResetPasswordConfirmTitle: "Reset this trader's password?",
    traderResetPasswordConfirmBody:
      "A new temporary password will be generated and the old one will stop working. The trader will be required to change it immediately at their next sign-in.",
    traderResetPasswordConfirmLabel: "Reset",
    traderDisableTitle: "Disable this trader?",
    traderDisableBody: "They will not be able to sign in until reactivated. Their records stay visible.",
    categorySave: "Save labels",
    categoryNameAr: "Name (Arabic)",
    categoryNameEn: "Name (English)",
    categorySortOrder: "Sort order",
    resultsLabel: "results",
    categorySlug: "Slug",
    categoryProducts: "Products",
    categoryActions: "Actions",
    categoryCreate: "New category",
    categoryEdit: "Edit category",
    categoryDelete: "Delete",
    categoryDeleteConfirm: "Delete this category permanently?",
    categoryDeleteBlocked:
      "A category with products cannot be deleted. Move or delete its products first.",
    categoryDeleteLaunch: "Core launch categories cannot be deleted.",
    categorySlugExists: "That slug is already in use.",
    categoryInvalid: "Invalid category data.",
    categorySaved: "Saved.",
    customerWaTitle: "WhatsApp conversations",
    customerWaEmpty: "No WhatsApp conversations match this customer's phone.",
    customerWaOpen: "Open conversation",
    customerNotesSave: "Save notes",
    customerNotesSaved: "Notes saved.",
    customerNotesFailed: "Could not save notes.",
    customerNotesInvalid: "The note is longer than allowed.",
    customerNotesHelper:
      "Internal admin notes only. Saving does not change a request status or a WhatsApp conversation.",
    kindCatalog: "Catalog",
    kindNonCatalog: "Non-catalog",
    modeRequestQuote: "Request quote",
    modeProposePrice: "Propose price",
    status: {
      retail: {
        draft: "Draft",
        ready_for_handoff: "Ready for handoff",
        handoff_opened: "Handoff opened",
        in_follow_up: "In follow-up",
        completed: "Completed",
        cancelled: "Cancelled",
      },
      deal: {
        proposed: "Proposed",
        negotiating: "Negotiating",
        accepted: "Accepted",
        rejected: "Rejected",
        closed: "Closed",
      },
      wholesale: {
        submitted: "Submitted",
        under_review: "Under review",
        quote_provided: "Quote provided",
        confirmed: "Confirmed",
        completed: "Completed",
        cancelled: "Cancelled",
      },
      trader: {
        active: "Active",
        disabled: "Disabled",
      },
      offer: {
        draft: "Draft",
        published: "Published",
        unpublished: "Unpublished",
      },
    },
    productStatus: {
      draft: "Draft",
      published: "Published",
      archived: "Archived",
    },
    availability: {
      available: "Available",
      unavailable: "Unavailable",
    },
    detail: {
      retailEvent: {
        prepared: "Handoff prepared",
        opened: "Handoff opened",
        status_changed: "Status changed",
        retriggered: "Handoff retriggered",
      },
      actor: { customer: "Customer", admin: "Admin", trader: "Trader" },
      langAr: "Arabic",
      langEn: "English",
      locale: "Request language",
      destination: "Destination",
      shippingMethod: "Shipping method",
      shippingUnconfirmed: "Not set — confirm with team",
      subtotal: "Subtotal",
      handoffPrepared: "Handoff prepared",
      handoffOpened: "Handoff opened",
      lines: "Lines",
      qty: "Qty",
      customerNotes: "Customer notes",
      linkedConversation: "Linked WhatsApp conversation",
      linkedConversationOpen: "Open in inbox",
      linkedConversationNone:
        "No linked conversation yet — link from the inbox once WhatsApp is connected.",
      storedMessage: "Stored WhatsApp message",
      handoffPayload: "Structured handoff payload",
      auditEvents: "Audit events",
      noEvents: "No events yet.",
      traderNotes: "Trader notes",
      productReference: "Product reference",
      nonCatalogNoProduct: "Non-catalog — no product created",
      commercialSnapshot: "Commercial snapshot",
      conditions: "Conditions",
      negotiationHistory: "Negotiation history",
      terms: "Terms",
      publicOfferTitle: "Public curated offer",
      publicOfferBody:
        "Optional and explicit. Accepting a deal never auto-publishes an offer.",
      createDraftOffer: "Create draft offer from this deal",
      linesSnapshot: "Lines (historical snapshots)",
      proposedPrice: "Proposed",
      noProposedPrice: "No proposed price (quote mode)",
      quotedUnit: "Quoted unit",
      catalogRetailRef: "Catalog retail ref.",
      wholesaleRequestTitle: "Wholesale request",
      editOffer: "Edit offer",
      newOfferTitle: "New curated offer",
      newOfferLead:
        "Creates a draft. Public visibility requires an explicit publish action.",
      newProductTitle: "New product",
      stepperLabel: "Status progress",
      stepDone: "Done",
      stepCurrent: "Current",
      stepUpcoming: "Upcoming",
      stepEnded: "Ended",
    },
    form: {
      operations: "Operations",
      operationsHint:
        "Transitions are server-side and audited. Retrigger regenerates the wa.me message on this same request — no duplicate request is created.",
      moveTo: "Move to",
      note: "Note",
      noteOptional: "Note (optional)",
      applyTransition: "Apply transition",
      apply: "Apply",
      statusUpdated: "Status updated.",
      terminalNoTransitions: "Terminal status — no transitions.",
      retrigger: "Retrigger handoff",
      handoffRegenerated: "Handoff regenerated on the same request.",
      openHandoff: "Open WhatsApp handoff",
      handoffMarkedOpened: "Handoff marked opened.",
      adminOperations: "Admin operations",
      terminalStatus: "Terminal status.",
      blockedUntilQuote: "(blocked until quote — use the quotation form)",
      provideQuote: "Provide quotation",
      quoteHint:
        "Simple quote workflow only — no payment, shipping rates, or ERP.",
      quoteCurrency: "Quote currency",
      quotedUnitPrice: "Quoted unit price",
      quoteMessage: "Quote message",
      saveQuote: "Save quotation → quote provided",
      quoteSaved: "Quotation saved.",
      shippingTitle: "Shipping details",
      carrier: "Carrier",
      trackingReference: "Tracking reference",
      saveShipping: "Save shipping",
      shippingSaved: "Shipping details saved.",
      slug: "Slug",
      titleAr: "Title (Arabic)",
      titleEn: "Title (English)",
      summaryAr: "Summary (Arabic)",
      summaryEn: "Summary (English)",
      bodyAr: "Body (Arabic)",
      bodyEn: "Body (English)",
      ctaLabelAr: "CTA label (Arabic)",
      ctaLabelEn: "CTA label (English)",
      href: "Internal link",
      hrefHelp: "Internal path starting with / e.g. /catalog or /offers/slug",
      tone: "Visual tone",
      imagePath: "Image path (optional)",
      startsAt: "Starts at (optional)",
      endsAt: "Ends at (optional)",
      savePromo: "Save promo band",
      linkedDeal: "Optional linked deal",
      linkedProduct: "Optional catalog product",
      none: "None",
      sortOrder: "Sort order",
      saveOffer: "Save offer",
      createDraft: "Create draft",
      offerCurrentStatus: "Current status",
      offerPublishNote: "Publishing is always explicit.",
      plateAck:
        "I confirm this offer relies on the material plate with no linked catalog product.",
      plateAckHelp:
        "Required when publishing without a linked product (offers have no image field).",
      publishNeedsTitleAr: "Publishing requires an Arabic title.",
      publishNeedsSummaryAr: "Publishing requires an Arabic summary.",
      publishNeedsProductOrPlate:
        "Link a catalog product or confirm the material-plate acknowledgement.",
      publishNeedsNameAr: "Publishing requires an Arabic product name.",
      publishNeedsImage:
        "Publishing requires at least one image. Upload an image, then try again.",
      publishRulesHint: "To publish: Arabic name and at least one image.",
      setStatusTo: "Set status: {status}",
      productNameAr: "Name (Arabic)",
      productNameEn: "Name (English)",
      descriptionAr: "Description (Arabic)",
      descriptionEn: "Description (English)",
      specsAr: "Extra features (Arabic)",
      specsEn: "Extra features (English)",
      specsHelp: "Free text shown only as extra features — not a separate spec list.",
      oudSpecsTitle: "Oud specifications (optional)",
      oudSpecsHint: "Fill only what applies. Empty fields stay hidden on the storefront.",
      oudWoodTitle: "Wood type",
      oudMeasuresTitle: "Oud measurements",
      oudDetailsTitle: "Specifications",
      oudWoodBack: "Back",
      oudWoodFace: "Face",
      oudWoodPegs: "Keys",
      oudWoodFingerboard: "Fingerboard",
      oudWoodBridge: "String holder",
      oudFaceWidth: "Face width",
      oudFaceDepth: "Back depth",
      oudFaceLength: "Face length",
      oudNeckLength: "Neck length",
      oudStringLength: "String length",
      oudStandardNeck: "Standard neck",
      oudStandardNeckUnset: "Not set",
      oudStandardNeckYes: "Standard",
      oudStandardNeckNo: "Non-standard",
      oudFinish: "Finish type",
      oudMm: "Millimetres",
      oudAr: "Arabic",
      oudEn: "English",
      category: "Category",
      retailPrice: "Retail price",
      compareAtPrice: "Compare-at price (optional)",
      compareAtHelp: "Leave empty if there is no prior price. A discount shows only when this is higher than retail.",
      currency: "Currency code",
      currencyHelp: "Configurable — commercial default is still open.",
      currencyPlaceholder: "e.g. TEST for fixtures only",
      statusLabel: "Status",
      availabilityLabel: "Availability",
      availabilityHelp: "Retail flag, not inventory.",
      wholesaleEligible: "Wholesale eligible",
      wholesaleEligibleHelp: "Flag only — no wholesale UI is attached to it yet.",
      storeBadges: "Store badges",
      storeBadgesHelp: "Shown on the product card and plate. Each badge is independent.",
      badgeNew: "New",
      badgeFeatured: "Featured",
      badgeSale: "Sale",
      previewStorefront: "Preview on storefront",
      saveProduct: "Save product",
      saving: "Saving…",
    },
  },
  trader: {
    brand: "Trader portal",
    overview: "Home",
    deals: "My deals",
    newDeal: "Propose deal",
    wholesale: "Wholesale",
    wholesaleRequests: "Wholesale requests",
    brokerage: "Brokerage",
    newBrokerage: "New brokerage",
    taskBrokerageTitle: "Request brokerage",
    taskBrokerageBody: "Saw a piece? We inspect and quote before purchase.",
    offers: "Public offers",
    profile: "Profile",
    logout: "Sign out",
    welcome: "Welcome, {name}",
    waitingToday: "{n} items waiting today · {date}",
    waitingTodayZero: "Nothing waiting today · {date}",
    lead: "Negotiate deals and submit wholesale requests against RARE OUD stock — this is not a storefront.",
    homeTasksTitle: "Start here",
    taskDealTitle: "Propose a deal",
    taskDealBody: "Submit a commercial proposal on a catalog or non-catalog piece.",
    taskWholesaleTitle: "Order wholesale",
    taskWholesaleBody: "Choose pieces and quantities; admin responds with a quote.",
    myDeals: "My deals ({n})",
    waitingTitle: "Waiting on you",
    waitingIdle: "Nothing waiting for you right now",
    openRecord: "Open",
    offersNow: "Offers available now",
    viewAllOffers: "View all",
    dealStatus: {
      proposed: "Proposed",
      negotiating: "Negotiating",
      accepted: "Accepted",
      rejected: "Rejected",
      closed: "Closed",
    },
    wholesaleStatus: {
      submitted: "Submitted",
      under_review: "Under review",
      quote_provided: "Quote provided",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
    },
    requestMode: {
      request_quote: "Request quote",
      propose_price: "Propose unit price",
    },
    dealKind: {
      catalog: "Catalog deal",
      non_catalog: "Non-catalog opportunity",
    },
    actorRole: { trader: "Trader", admin: "RARE OUD" },
    dealAction: {
      propose: "Proposal",
      continue: "Continue",
      counter: "Counter",
      accept: "Accept",
      reject: "Reject",
      close: "Close",
    },
    wholesaleEvent: {
      submitted: "Submitted",
      status_changed: "Status changed",
      quote_provided: "Quote provided",
      trader_accepted: "Trader accepted quote",
      trader_declined: "Trader declined quote",
    },
    accountStatus: { active: "Active", disabled: "Disabled" },
    unknownStatus: "Unknown",
    waitingOnYou: "Waiting on you",
    waitingOnAdmin: "Waiting on RARE OUD",
    dealsTitle: "My deal proposals",
    dealsEmpty: "No proposals yet",
    dealsEmptyBody: "Start by sending your first deal proposal to RARE OUD.",
    dealsTabList: "Filter deals",
    dealsTabAll: "All",
    dealsTabWaiting: "Waiting on me",
    dealsTabNegotiating: "Negotiating",
    dealsTabClosed: "Closed",
    wsTabList: "Filter wholesale requests",
    wsTabAll: "All",
    wsTabWaiting: "Waiting on me",
    wsTabOpen: "Open",
    wsTabClosed: "Closed",
    accountRequestHelp: "Need an account? Request trader access via WhatsApp",
    entriesCount: "{n} entries",
    colReference: "Reference",
    colTitle: "Title",
    colKind: "Kind",
    colStatus: "Status",
    colEntries: "Entries",
    newDealTitle: "Propose a deal",
    newDealLead:
      "Propose a deal on a catalog piece or a new opportunity; the team will review it.",
    sectionType: "Request",
    sectionTerms: "Terms",
    sectionMessage: "Opening message",
    sectionReview: "Review",
    wizardStepOf: "{current} of {total}",
    wizardBack: "Back",
    wizardNext: "Next",
    wizardEdit: "Edit",
    wizardLeaveConfirm: "You have an unsaved draft. Leave anyway?",
    wizardNeedTitle: "Enter a deal title to continue.",
    wizardNeedProduct: "Pick a catalog product to continue.",
    recentActivity: "Recent activity",
    recentActivityEmpty: "No recent activity yet.",
    activityDeal: "Deal {ref}",
    activityWholesale: "Wholesale {ref}",
    maxQtyPerPiece: "Maximum quantity per piece is {n}",
    wsPickerSearch: "Search products",
    wsPickerAllCategories: "All",
    wsSelectedCount: "{n} selected",
    wsReviewSend: "Review & send",
    wsReviewTitle: "Review request",
    wsAddPiece: "Add",
    wsRemovePiece: "Remove",
    wsQtyFor: "Quantity for {name}",
    wsQtyIncrease: "Increase quantity",
    wsQtyDecrease: "Decrease quantity",
    dealTypeLabel: "Deal type",
    dealTitleLabel: "Subject / title",
    productLabel: "Catalog product",
    productPlaceholder: "Select product",
    nonCatalogNote:
      "Non-catalog proposals do not create or modify products/categories.",
    priceOptional: "Proposed price (optional)",
    currencyLabel: "Currency",
    quantityLabel: "Quantity",
    conditionsLabel: "Conditions / notes",
    initialMessageLabel: "Initial message",
    submitProposal: "Submit proposal",
    submitting: "Submitting…",
    dealProduct: "Product",
    dealNonCatalog: "Non-catalog (no product link)",
    dealSnapshot: "Commercial snapshot",
    dealQtyShort: "qty",
    dealConditions: "Conditions / notes",
    dealHistory: "Negotiation history",
    dealTerms: "Terms",
    dealClosed: "This deal is {status}. Negotiation is closed.",
    dealWaitingBanner: "RARE OUD has responded — your reply is needed on this deal.",
    dealWaitingAdmin: "Waiting for a reply from RARE OUD.",
    dealRejected: "This deal was rejected.",
    dealRejectedWithReason: "This deal was rejected: {reason}",
    negTitle: "Negotiation response",
    negHint:
      "Structured negotiation — not chat. Choose continue, counter, accept, reject, or close.",
    negAction: "Action",
    negMessage: "Message",
    negRejectReason: "Reject reason (optional)",
    negRejectReasonHint: "Shown to the trader when provided",
    conflictWarningTitle:
      "Warning: other active catalog deals on this product",
    negPrice: "Proposed price",
    negCurrency: "Currency",
    negQty: "Quantity",
    negConditions: "Conditions / notes",
    negRecorded: "Negotiation entry recorded.",
    negSubmit: "Submit entry",
    wsTitle: "Wholesale request",
    wsLead: "Choose pieces and quantities from RARE OUD stock.",
    wsMyRequests: "My wholesale requests",
    wsNewRequest: "New request",
    wsEmpty: "No wholesale requests yet",
    wsEmptyBody: "Choose pieces and quantities; admin will respond with a quote.",
    wsColReference: "Reference",
    wsColMode: "Mode",
    wsColStatus: "Status",
    wsColLines: "Lines",
    wsLinesCount: "{n} lines",
    wsDetailTitle: "Wholesale request",
    wsYourNotes: "Your notes",
    wsLines: "Lines (snapshots at submission)",
    wsQty: "Qty",
    wsProposed: "Your proposed price",
    wsQuoted: "Quoted unit price",
    wsRetailRef: "Catalog retail ref. (not wholesale pricing)",
    wsQuoteTitle: "Quotation",
    wsQuotedAt: "Provided",
    wsQuoteCurrency: "Quote currency",
    wsQuoteMessage: "Message from RARE OUD",
    wsQuoteLines: "Unit prices by line",
    wsQuoteBanner: "A quotation is ready — review it, then accept or decline.",
    wsHistory: "History",
    wsTraderResponse: "Your response to the quote",
    wsModeLabel: "Request mode",
    wsFormHint:
      "No wholesale list price is invented by the platform. Use “Request quote” unless you are proposing your own unit price. Catalog retail shown below is a reference only — not wholesale pricing. MOQ is not enforced. Quantity max {max} is a technical safety limit only.",
    wsColProduct: "Product",
    wsColRetail: "Catalog retail (ref.)",
    wsColQty: "Qty",
    wsColUnitPrice: "Your unit price",
    wsColCurrency: "Currency",
    wsNoProducts: "No wholesale-eligible published products.",
    wsNotes: "Notes",
    wsSubmit: "Submit wholesale request",
    wsActions: "Actions",
    wsReviewQuote: "Review the quotation, then accept (fulfillment intent) or decline.",
    wsNoteOptional: "Note (optional)",
    wsAccept: "Accept quotation",
    wsDecline: "Decline",
    wsResponseRecorded: "Response recorded.",
    wsCancel: "Cancel request",
    wsCancelled: "Request cancelled.",
    wsNoActions: "No trader actions for this status.",
    profileTitle: "Profile",
    profileName: "Display name",
    profileEmail: "Email",
    profileCompany: "Company",
    profilePhone: "Phone",
    profileStatus: "Status",
    profileNote:
      "Profile changes are managed by RARE OUD admin. Update deal preferences below to help matching.",
    prefsTitle: "Deal preferences",
    prefsLead:
      "Tell admin which product types interest you — never shown to shoppers.",
    prefsCategories: "Interest categories",
    prefsCategoriesHint: "Select one or more launch categories.",
    prefsNotes: "Preference notes",
    prefsSave: "Save preferences",
    prefsSaved: "Preferences saved.",
    notifications: "Notifications",
    notificationsTitle: "Status center",
    notificationsLead:
      "Updates on your deals and wholesale requests — stay informed inside the portal.",
    notificationsEmpty: "No notifications yet",
    notificationsEmptyBody:
      "When admin responds on a deal or wholesale request, it will appear here.",
    notificationsMarkAll: "Mark all read",
    notificationsMarkRead: "Read",
    notificationsOpen: "Open",
    offersTitle: "Public curated offers",
    offersLead: "Published RARE OUD presentations only — not trader storefronts.",
    offersEmpty: "No published offers yet.",
    offersBack: "Back to offers",
    offersRelatedProduct: "Related product",
    offersStartDeal: "Start a deal from this offer",
    confirmCancel: "Cancel",
    negConfirmAcceptTitle: "Accept this deal?",
    negConfirmAcceptBody:
      "Accepting locks negotiation and records your agreement to the current terms.",
    negConfirmCloseTitle: "Close this deal?",
    negConfirmCloseBody:
      "Closing ends negotiation without accepting. This cannot be undone here.",
    negConfirmRejectTitle: "Reject this deal?",
    negConfirmRejectBody:
      "Rejecting ends the deal. You can add a reason shown to the trader.",
    wsConfirmAcceptTitle: "Accept this quotation?",
    wsConfirmAcceptBody:
      "Accepting records fulfillment intent on the quoted prices.",
    wsConfirmDeclineTitle: "Decline this quotation?",
    wsConfirmDeclineBody:
      "Declining cancels the wholesale request. You can submit a new one later.",
    wsConfirmCancelTitle: "Cancel this wholesale request?",
    wsConfirmCancelBody:
      "The request will be cancelled and cannot be edited afterwards.",
    actionErrorUnauthorized: "Your session has expired. Please sign in again.",
    actionErrorNotAllowed: "This action is not available for the current status.",
    actionErrorInvalid: "The form could not be sent. Check the fields and try again.",
    actionErrorGeneric: "Could not complete that action. Please try again.",
    actionError: {},
  },
  inbox: {
    title: "WhatsApp inbox",
    subtitle: "WhatsApp conversations",
    empty: "No conversations yet. They appear when real WhatsApp messages arrive.",
    backToList: "All conversations",
    lastMessage: "Last message",
    unread: "Unread",
    connection: "Connection",
    outboundDisabled: "Outbound disabled",
    outboundEnabled: "Outbound enabled",
    replyPlaceholder: "Type a text reply…",
    send: "Send",
    sending: "Sending…",
    inbound: "Inbound",
    outbound: "Outbound",
    statusPending: "Pending",
    statusSent: "Sent",
    statusFailed: "Failed",
    statusReceived: "Received",
    unsupported: "Attachment",
    sendFailed: "Not sent — retry",
    sendBlocked: "Cannot send while outbound is disabled.",
    sendSuccess: "Message queued for delivery.",
    notLinked: "Not linked",
    healthDisconnected: "Disconnected",
    healthConnecting: "Connecting",
    healthConnected: "Connected",
    healthReconnecting: "Reconnecting",
    healthAuthRequired: "Authentication required",
    healthError: "Error",
    openConversation: "Open",
    noMessages: "No messages in this conversation.",
    refresh: "Refresh",
    statusSending: "Sending",
    businessContext: "Business context",
    linkType: "Record type",
    linkRecordId: "Record ID",
    linkSave: "Link",
    linkClear: "Remove link",
    linkChange: "Change link",
    linkedAs: "Linked as",
    linkHistory: "Link history",
    linkAuditSet: "Linked",
    linkAuditChange: "Link changed",
    linkAuditClear: "Link removed",
    linkConfirmHint: "Linking never changes the business record status.",
    openLinkedRecord: "Open admin record",
    typeRetail: "Retail request",
    typeDeal: "Deal proposal",
    typeWholesale: "Wholesale request",
    contextStatus: "Status",
    contextUpdated: "Last update",
    contextIdentity: "Identity",
    contextTitle: "Title",
    contextDealKind: "Deal kind",
    contextRequestMode: "Request mode",
    contextProduct: "Product",
    contextLines: "Lines",
    contextLatestNegotiation: "Latest negotiation",
    contextReference: "Reference / ID",
    linkErrorUnsupported: "Unsupported link type.",
    linkErrorNotFound: "Record not found.",
    linkErrorUnauthorized: "Unauthorized.",
    linkSuccess: "Conversation linked.",
    unlinkSuccess: "Link removed.",
    conversations: "Conversations",
    selectConversation: "Select a conversation",
    selectConversationHint:
      "Choose a conversation from the list to see messages and business context.",
    tabAll: "All",
    tabUnread: "Unread",
    tabLinked: "Linked",
    tabUnlinked: "Unlinked",
    searchPlaceholder: "Search by name or phone…",
    connected: "Connected",
    connecting: "Connecting…",
    disconnected: "Disconnected",
    authRequired: "Account linking required",
    error: "Connection error",
    sendingPaused: "WhatsApp sending is temporarily paused",
    rateLimited: "Sending limit reached, try again shortly",
    linkAccount: "Link account",
    reconnect: "Reconnect",
    nonText: "Attachment",
    retry: "Retry",
    newMessages: "New messages ↓",
    linkRecord: "Link to record",
    unlinkConfirm: "Remove link?",
    pickRecord: "Pick a record",
    searchRecords: "Search by reference…",
    openContext: "Details",
    confirmLink: "Confirm link",
    confirmUnlink: "Confirm unlink",
    lengthNearLimit: "Near character limit",
    emptyThread: "No messages yet",
    pairingTitle: "Link WhatsApp account",
    pairingHint:
      "Enter the phone number with country code, then type the code shown here into WhatsApp on that phone: Linked devices → Link a device → Link with phone number.",
    pairingPhone: "Phone with country code (digits only)",
    pairingSubmit: "Request pairing code",
    pairingAwaiting: "Waiting for the code to be entered on the phone",
    pairingCodeLabel: "Pairing code",
    pairingQrOptional: "Also show QR code",
    pairingConnected: "Account linked and connected",
    pairingNotLinked: "No account linked",
    pairingError: "Could not link the account. Check the number and try again",
    pairingLogout: "Log out account",
  },
  common: {
    language: "العربية",
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    create: "Create",
    menu: "Menu",
    close: "Close",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    errorTitle: "Something went wrong",
    errorBody:
      "Please try again. If it continues, contact us on WhatsApp.",
    errorRetry: "Try again",
    errorNotFound: "Page not found",
    errorForbidden: "This area isn't available for your account",
    errorSession: "Your session has expired. Please sign in again.",
    errorOffline: "You're offline",
    backOnline: "You're back online",
    toastDismiss: "Dismiss notification",
    goToPortal: "Go to your portal",
    signOut: "Sign out",
    navOps: "Operations",
    navCatalog: "Catalog",
    navPeople: "People",
    switchOn: "On",
    switchOff: "Off",
    paginationPrevious: "Previous",
    paginationNext: "Next",
    paginationPageOf: "Page {page} of {pages}",
    timelineLabel: "Activity timeline",
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    greetingNamed: "{greeting}, {name}",
  },
  contact: {
    title: "Contact us",
    lead: "For a piece inquiry or commercial request, message the RARE OUD team on WhatsApp.",
    whatsapp: "Message us on WhatsApp",
    hours: "We reply during business hours — Sunday to Thursday.",
    location: "Syria · International shipping by arrangement.",
    missingNumber: "WhatsApp number is not configured in the environment yet.",
  },
  privacy: {
    title: "Privacy policy",
    updated: "Last updated: October 2026",
    body:
      "[PLACEHOLDER — draft copy] Replace with client-approved legal text before launch.",
    tocLabel: "On this page",
    placeholderBanner:
      "PLACEHOLDER draft text. Replace with the client’s approved privacy policy before launch. This is not legal copy.",
    s1Title: "What we collect",
    s1Body:
      "[PLACEHOLDER] Sample section for page structure only. Client supplies approved data-collection wording.",
    s2Title: "How we use it",
    s2Body:
      "[PLACEHOLDER] Sample section. Client supplies approved use-of-data wording.",
    s3Title: "Cookies and contact",
    s3Body:
      "[PLACEHOLDER] Sample section. Client supplies approved cookies and contact wording.",
  },
  terms: {
    title: "Terms of use",
    fallbackBody: "Terms content is being prepared.",
  },
  auth: {
    adminTitle: "Admin sign in",
    traderTitle: "Trader sign in",
    traderHint: "Accounts are provisioned by RARE OUD admin. No public registration.",
    loginError: "Email or password is incorrect.",
    loginLocked: "Too many attempts. Wait a moment and try again.",
    totpLabel: "2FA or recovery code",
    totpRequired: "Enter your authenticator or recovery code.",
    totpInvalid: "That verification code is not valid.",
    totpEnrollRequired: "Turn on two-factor authentication in security settings before signing in.",
    totpEnrollButton: "Start 2FA enrollment",
    showPassword: "Show",
    hidePassword: "Hide",
    sessionInvalidatedNotice:
      "Your password was changed on another device. Please sign in again.",
  },
  forcePasswordChange: {
    title: "Set a new password",
    subtitle: "This is a one-time step",
    explanation:
      "An admin reset your account's password. For security reasons, admins can never see your actual password — you need to choose a new one now before continuing.",
    currentPassword: "Current temporary password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    mismatch: "Passwords don't match",
    submit: "Set password and continue",
    strengthLabel: "Password strength",
    strengthWeak: "Weak",
    strengthFair: "Fair",
    strengthGood: "Good",
    strengthStrong: "Strong",
    strengthVeryStrong: "Very strong",
    ruleLength: "At least 10 characters",
    ruleNotTemp: "Different from the temporary password",
    ruleNotEmail: "Different from your email",
    errorCurrentWrong: "The current password is incorrect.",
    errorWeak: "Password must be at least 10 characters.",
    errorSameAsTemp: "You can't reuse the temporary password.",
    errorSameAsEmail: "Your password can't be your email address.",
    success: "Password set. We signed you out of other devices.",
    signOut: "Sign out",
    showPassword: "Show",
    hidePassword: "Hide",
  },
  changePassword: {
    sectionTitle: "Change password",
    sectionLead: "Use a strong password unique to this account.",
    submit: "Update password",
    success: "Password updated.",
  },
  seo: {
    catalogDescription:
      "Browse the published RARE OUD collection — pieces chosen with care, ready to add to your request list and send to the team on WhatsApp.",
    productFallbackDescription:
      "A piece from the published RARE OUD collection. View the details and add it to your request list.",
    privacyDescription:
      "How RARE OUD collects the contact details needed to prepare your request, and how they are used.",
  },
};

const dictionaries: Record<Locale, Dict> = { ar, en };

export type Dictionary = Dict;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
