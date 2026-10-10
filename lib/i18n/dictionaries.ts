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
    offers: string;
    kpiRetail: string;
    kpiDeals: string;
    kpiWholesale: string;
    kpiUnread: string;
    kpiIdle: string;
    recentRequests: string;
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
    colEmail: string;
    colDeals: string;
    colDeal: string;
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
    searchPlaceholder: string;
    search: string;
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
    traderActivate: string;
    traderDisable: string;
    categorySave: string;
    categoryNameAr: string;
    categoryNameEn: string;
    categorySortOrder: string;
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
      slug: string;
      titleAr: string;
      titleEn: string;
      summaryAr: string;
      summaryEn: string;
      linkedDeal: string;
      linkedProduct: string;
      none: string;
      sortOrder: string;
      saveOffer: string;
      createDraft: string;
      offerCurrentStatus: string;
      offerPublishNote: string;
      setStatusTo: string;
      productNameAr: string;
      productNameEn: string;
      descriptionAr: string;
      descriptionEn: string;
      specsAr: string;
      specsEn: string;
      category: string;
      retailPrice: string;
      currency: string;
      currencyHelp: string;
      currencyPlaceholder: string;
      statusLabel: string;
      availabilityLabel: string;
      availabilityHelp: string;
      wholesaleEligible: string;
      wholesaleEligibleHelp: string;
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
    offers: string;
    profile: string;
    logout: string;
    welcome: string;
    lead: string;
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
    negTitle: string;
    negHint: string;
    negAction: string;
    negMessage: string;
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
    offersTitle: string;
    offersLead: string;
    offersEmpty: string;
    offersOpenPublic: string;
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
  };
  auth: {
    adminTitle: string;
    traderTitle: string;
    traderHint: string;
    loginError: string;
    showPassword: string;
    hidePassword: string;
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
    cartAria: "قائمة الطلب — {n} قطعة",
  },
  home: {
    headline: "عودٌ نادر، صُنع ليبقى",
    sub: "قطع مختارة بعناية، تُصنع بيد حرفيّ وتُسلَّم بما يليق بها.",
    heroLabel: "RARE OUD",
    ctaCatalog: "استكشف المجموعة",
    ctaOffers: "عروض مختارة",
    ctaStory: "قصتنا",
    handoffTitle: "كيف يتم الطلب؟",
    handoffStep1: "أضف القطع إلى قائمة الطلب",
    handoffStep2: "أدخل بيانات التواصل",
    handoffStep3: "افتح واتساب لإرسال الطلب للفريق",
    traderBandTitle: "للتجّار",
    traderBandLead: "اقترح صفقة، تفاوض، ونشحن لك من مخزون RARE OUD.",
    traderBandCta: "دخول التجّار",
    latestPieces: "أحدث القطع",
    viewCollection: "عرض المجموعة",
    introEyebrow: "البيت",
    introTitle: "عمقٌ ثقافي، ودقّة معاصرة",
    introBody:
      "RARE OUD تجمع بين إحساس البيت الثقافي الرفيع ومنصة رقمية هادئة — حيث تُقدَّم المادة والندرة والحضور، لا كسلعةٍ عابرة.",
    featuredEyebrow: "المختارات",
    featuredTitle: "قطعٌ تستحق الانتباه",
    featuredIntro: "اختيارٌ مُنَسَّق من الكتالوج المنشور — بتراتبية بصرية، لا بشبكةٍ متماثلة.",
    featuredLead: "القطعة الأبرز",
    featuredEmpty: "لا توجد منتجات منشورة للعرض حالياً.",
    available: "متوفر",
    unavailable: "غير متوفر",
    categoriesEyebrow: "المجموعات",
    categoriesTitle: "مساران في كونٍ واحد",
    categoriesIntro: "فئتان قائمتان في المنصة — عالَمان بصريان ضمن هوية RARE OUD.",
    categoriesCta: "استكشف",
    categoryDescInstruments: "اكتشف المجموعة الأولى من الكتالوج.",
    categoryDescAccessories: "اكتشف المجموعة الثانية من الكتالوج.",
    oudEyebrow: "الندرة",
    oudTitle: "مادّةٌ نادرة، واختيارٌ واعٍ",
    oudBody:
      "العَود والخشب النادر يُفهمان هنا كمادةٍ وحضور — لا كزخرفة. نختار بهدوء، ونقدّم بدقّة.",
    oudDetail: "محتوى تحريري قابل للاستبدال عند اعتماد النصوص النهائية.",
    discoveryEyebrow: "اكتشاف",
    discoveryTitle: "اختيارٌ مُنَسَّق",
    discoverySub: "عروض وتنسيقات تنشرها RARE OUD بعناية — ليست قوائم بائعين.",
    discoveryEmpty: "لا توجد عروض منشورة حالياً. تصفّح الكتالوج للاطلاع على المجموعة.",
    discoveryCta: "عرض العروض",
    principlesEyebrow: "المبادئ",
    principlesTitle: "ما نلتزم به",
    principleRare: "نادر",
    principleSelected: "مختار",
    principleAuthentic: "أصيل",
    principleConsidered: "مُتَأَنٍّ",
    finalCtaTitle: "أكمل رحلة الاكتشاف",
    finalCtaSub: "انتقل إلى الكتالوج أو العروض المختارة — وابدأ طلباً يُجهَّز للنقاش مع فريق RARE OUD.",
    finalCtaButton: "إلى الكتالوج",
    finalCtaSecondary: "عروض مختارة",
    viewProduct: "عرض المنتج",
    footerTagline: "عَود وخشب نادر — بذوقٍ ثقافي معاصر.",
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
  },
  catalog: {
    title: "الكتالوج",
    empty: "المجموعة قيد التجهيز",
    emptyHint: "نضيف قطعاً جديدة قريباً.",
    search: "بحث",
    filters: "تصفية",
    allCategories: "كل الفئات",
    lead: "قطع مختارة بعناية من العود والآلات الوترية والملحقات. اختر القطعة التي تلفت نظرك وأضفها إلى قائمة الطلب.",
    photoCaption: "الصورة قيد التصوير",
    filtersTitle: "تصفية وترتيب",
    typeLabel: "النوع",
    priceLabel: "السعر",
    priceMin: "الحد الأدنى",
    priceMax: "الحد الأقصى",
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
    sub: "عروض تنشرها RARE OUD بعناية — ليست متاجر تجّار ولا قوائم بائعين.",
    empty: "لا توجد عروض منشورة حالياً.",
    back: "كل العروض",
    relatedProduct: "منتج من الكتالوج",
    viewOffer: "عرض التفاصيل",
    eyebrow: "مختارات RARE OUD",
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
    offers: "العروض",
    kpiRetail: "طلبات بانتظار الإدارة",
    kpiDeals: "صفقات بانتظار الرد",
    kpiWholesale: "جملة بانتظار الرد",
    kpiUnread: "محادثات غير مقروءة",
    kpiIdle: "لا شيء بانتظارك",
    recentRequests: "أحدث طلبات التجزئة",
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
    imagesTitle: "صور المنتج",
    imagesEmpty: "لا صور بعد — تظهر لوحة المادة في المتجر.",
    imagesLimits: "JPEG أو PNG أو WebP · حتى 8 ميغابايت · الضلع الأطول ≥ 1600 بكسل · حد 8 صور",
    imagesAdd: "إضافة صورة",
    imagesAltAr: "النص البديل (عربي)",
    imagesAltEn: "النص البديل (إنجليزي)",
    imagesPrimary: "الرئيسية",
    imagesRemove: "حذف",
    imagesMoveEarlier: "تحريك للأمام",
    imagesMoveLater: "تحريك للخلف",
    imagesUploading: "جارٍ الرفع…",
    imagesErrorType: "نوع الملف غير مدعوم.",
    imagesErrorSize: "الملف أكبر من 8 ميغابايت.",
    imagesErrorDim: "الضلع الأطول يجب أن يكون 1600 بكسل على الأقل.",
    imagesErrorMax: "وصلت إلى الحد الأقصى (8 صور).",
    imagesErrorGeneric: "تعذّر رفع الصورة.",
    quickProduct: "منتج",
    quickOffer: "عرض",
    quickTrader: "حساب تاجر",
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
    colEmail: "البريد الإلكتروني",
    colDeals: "الصفقات",
    colDeal: "الصفقة",
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
      "مجموعة الإطلاق فقط (الآلات الوترية، الإكسسوارات). يمكن تعديل التسميات والترتيب؛ إضافة فئات جديدة غير متاحة.",
    offersLead: "عروض عامة منسّقة من الإدارة — ليست متاجر للتجّار.",
    newOffer: "عرض جديد",
    searchPlaceholder: "ابحث بالاسم أو الهاتف",
    search: "بحث",
    emptyTitle: "لا يوجد شيء هنا بعد",
    emptyBody: "ستظهر السجلات هنا عند إنشائها.",
    newTrader: "إضافة تاجر",
    traderCreateTitle: "إنشاء حساب تاجر",
    traderCreateLead: "حسابات تُنشأ من الإدارة فقط. لا تسجيل ذاتي.",
    traderEmail: "البريد الإلكتروني",
    traderPassword: "كلمة مرور مؤقتة (8 أحرف على الأقل)",
    traderDisplayName: "الاسم المعروض",
    traderCompany: "الشركة (اختياري)",
    traderPhone: "الهاتف (اختياري)",
    traderNotes: "ملاحظات الإدارة",
    traderCreateSubmit: "إنشاء التاجر",
    traderCreated: "تم الإنشاء.",
    traderActivate: "تفعيل",
    traderDisable: "تعطيل",
    categorySave: "حفظ التسميات",
    categoryNameAr: "الاسم (عربي)",
    categoryNameEn: "الاسم (إنجليزي)",
    categorySortOrder: "ترتيب العرض",
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
      slug: "المعرّف (Slug)",
      titleAr: "العنوان (عربي)",
      titleEn: "العنوان (إنجليزي)",
      summaryAr: "الملخص (عربي)",
      summaryEn: "الملخص (إنجليزي)",
      linkedDeal: "صفقة مرتبطة (اختياري)",
      linkedProduct: "منتج من الكتالوج (اختياري)",
      none: "بدون",
      sortOrder: "ترتيب العرض",
      saveOffer: "حفظ العرض",
      createDraft: "إنشاء مسودة",
      offerCurrentStatus: "الحالة الحالية",
      offerPublishNote: "النشر دائماً بقرار صريح.",
      setStatusTo: "تعيين الحالة: {status}",
      productNameAr: "الاسم (عربي)",
      productNameEn: "الاسم (إنجليزي)",
      descriptionAr: "الوصف (عربي)",
      descriptionEn: "الوصف (إنجليزي)",
      specsAr: "المواصفات (عربي)",
      specsEn: "المواصفات (إنجليزي)",
      category: "الفئة (مجموعة الإطلاق فقط)",
      retailPrice: "سعر التجزئة",
      currency: "رمز العملة",
      currencyHelp: "قابل للضبط — القيمة التجارية الافتراضية ما زالت مفتوحة.",
      currencyPlaceholder: "مثال: TEST لبيانات الاختبار فقط",
      statusLabel: "الحالة",
      availabilityLabel: "التوفر",
      availabilityHelp: "علامة توفر للتجزئة، وليست مخزوناً.",
      wholesaleEligible: "مؤهَّل للجملة",
      wholesaleEligibleHelp: "علامة فقط — لا واجهة جملة مرتبطة بها حالياً.",
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
    offers: "العروض العامة",
    profile: "حسابي",
    logout: "خروج",
    welcome: "أهلاً، {name}",
    lead: "فاوض على الصفقات وقدّم طلبات الجملة من مخزون RARE OUD — هذه البوابة ليست متجراً.",
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
    entriesCount: "{n} إدخالات",
    colReference: "المرجع",
    colTitle: "العنوان",
    colKind: "النوع",
    colStatus: "الحالة",
    colEntries: "الإدخالات",
    newDealTitle: "اقتراح صفقة",
    newDealLead:
      "صفقات الكتالوج تشير إلى منتج قائم في RARE OUD. الفرص خارج الكتالوج تبقى خارجه حتى تقرر الإدارة لاحقاً غير ذلك — ولا يحدث ذلك تلقائياً.",
    sectionType: "نوع الصفقة",
    sectionTerms: "الشروط التجارية",
    sectionMessage: "الرسالة الأولى",
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
    negTitle: "ردّك في التفاوض",
    negHint: "تفاوض منظّم وليس محادثة. اختر متابعة أو عرضاً مقابلاً أو قبولاً أو إغلاقاً.",
    negAction: "الإجراء",
    negMessage: "الرسالة",
    negPrice: "السعر المقترح",
    negCurrency: "العملة",
    negQty: "الكمية",
    negConditions: "الشروط / ملاحظات",
    negRecorded: "تم تسجيل إدخال التفاوض.",
    negSubmit: "إرسال الإدخال",
    wsTitle: "الطلب بالجملة",
    wsLead:
      "اطلب كميات بالجملة من كتالوج RARE OUD. هذه ليست واجهة متجر للتجّار ولا تُنشئ صفقات أو طلبات تجزئة.",
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
      "تغييرات الحساب تتم عبر إدارة RARE OUD. هذه ليست هوية بائع عامة.",
    offersTitle: "العروض العامة المختارة",
    offersLead: "عروض RARE OUD المنشورة فقط — وليست متاجر للتجّار.",
    offersEmpty: "لا توجد عروض منشورة بعد.",
    offersOpenPublic: "فتح صفحة العروض العامة",
  },
  inbox: {
    title: "صندوق واتساب",
    subtitle:
      "محادثات واتساب الحقيقية من قاعدة البيانات. لا بيانات تجريبية.",
    empty: "لا توجد محادثات بعد. ستظهر عند وصول رسائل واتساب حقيقية.",
    backToList: "كل المحادثات",
    lastMessage: "آخر رسالة",
    unread: "غير مقروء",
    connection: "حالة الاتصال",
    outboundDisabled: "الإرسال معطّل (WHATSAPP_OUTBOUND_ENABLED)",
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
    unsupported: "نوع غير مدعوم (نص فقط في هذه المرحلة)",
    sendFailed: "تعذّر الإرسال. راجع حالة الرسالة.",
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
      "نجمع بيانات التواصل اللازمة لتجهيز طلبك (الاسم والهاتف والملاحظات ووجهة الشحن) ونستخدمها للتواصل عبر واتساب مع فريق RARE OUD فقط. لا نبيع بياناتك ولا نعالج مدفوعات إلكترونية عبر الموقع. ملفات تعريف الارتباط المستخدمة ضرورية للجلسة واللغة. للاستفسار راسلنا عبر صفحة التواصل.",
  },
  auth: {
    adminTitle: "دخول الإدارة",
    traderTitle: "دخول التجّار",
    traderHint: "الحسابات تُنشأ من الإدارة فقط — لا تسجيل ذاتي عام.",
    loginError: "البريد أو كلمة المرور غير صحيحة.",
    showPassword: "إظهار",
    hidePassword: "إخفاء",
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
    headline: "A rare oud, made to last.",
    sub: "Pieces chosen with care, shaped by hand, delivered with the respect they deserve.",
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
    categoryDescAccessories: "Discover the second collection in the catalog.",
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
    finalCtaTitle: "Continue the discovery",
    finalCtaSub: "Move to the catalog or curated offers — and begin a request prepared for discussion with the RARE OUD team.",
    finalCtaButton: "Go to catalog",
    finalCtaSecondary: "Curated offers",
    viewProduct: "View product",
    footerTagline: "Oud & rare wood — contemporary cultural taste.",
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
  },
  catalog: {
    title: "Catalog",
    empty: "The collection is being prepared",
    emptyHint: "New pieces will appear here soon.",
    search: "Search",
    filters: "Filters",
    allCategories: "All categories",
    lead: "Pieces chosen with care: oud, string instruments and accessories. Pick what catches your eye and add it to your request list.",
    photoCaption: "Photography in progress",
    filtersTitle: "Filter & sort",
    typeLabel: "Type",
    priceLabel: "Price",
    priceMin: "Min",
    priceMax: "Max",
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
    sub: "Carefully published presentations by RARE OUD — not trader storefronts or seller listings.",
    empty: "No published offers yet.",
    back: "All offers",
    relatedProduct: "Related catalog product",
    viewOffer: "View offer",
    eyebrow: "Curated by RARE OUD",
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
    offers: "Offers",
    kpiRetail: "Requests needing admin",
    kpiDeals: "Deals awaiting reply",
    kpiWholesale: "Wholesale awaiting reply",
    kpiUnread: "Unread conversations",
    kpiIdle: "Nothing waiting for you",
    recentRequests: "Recent retail requests",
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
    imagesTitle: "Product images",
    imagesEmpty: "No images yet — the material plate shows on the storefront.",
    imagesLimits: "JPEG, PNG, or WebP · max 8 MB · longest side ≥ 1600 px · max 8 images",
    imagesAdd: "Add image",
    imagesAltAr: "Alt text (Arabic)",
    imagesAltEn: "Alt text (English)",
    imagesPrimary: "Primary",
    imagesRemove: "Remove",
    imagesMoveEarlier: "Move earlier",
    imagesMoveLater: "Move later",
    imagesUploading: "Uploading…",
    imagesErrorType: "Unsupported file type.",
    imagesErrorSize: "File exceeds 8 MB.",
    imagesErrorDim: "Longest side must be at least 1600 px.",
    imagesErrorMax: "Maximum of 8 images reached.",
    imagesErrorGeneric: "Could not upload the image.",
    quickProduct: "Product",
    quickOffer: "Offer",
    quickTrader: "Trader account",
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
    colEmail: "Email",
    colDeals: "Deals",
    colDeal: "Deal",
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
      "Launch set only (String Musical Instruments, Accessories). Labels and order can be edited; adding categories is not available.",
    offersLead: "Admin-curated public presentations — not trader storefronts.",
    newOffer: "New offer",
    searchPlaceholder: "Search name or phone",
    search: "Search",
    emptyTitle: "Nothing here yet",
    emptyBody: "Records will appear here once they are created.",
    newTrader: "Add trader",
    traderCreateTitle: "Create trader account",
    traderCreateLead: "Admin-provisioned only. No self-registration.",
    traderEmail: "Email",
    traderPassword: "Temporary password (min 8)",
    traderDisplayName: "Display name",
    traderCompany: "Company (optional)",
    traderPhone: "Phone (optional)",
    traderNotes: "Admin notes",
    traderCreateSubmit: "Create trader",
    traderCreated: "Created.",
    traderActivate: "Activate",
    traderDisable: "Disable",
    categorySave: "Save labels",
    categoryNameAr: "Name (Arabic)",
    categoryNameEn: "Name (English)",
    categorySortOrder: "Sort order",
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
      slug: "Slug",
      titleAr: "Title (Arabic)",
      titleEn: "Title (English)",
      summaryAr: "Summary (Arabic)",
      summaryEn: "Summary (English)",
      linkedDeal: "Optional linked deal",
      linkedProduct: "Optional catalog product",
      none: "None",
      sortOrder: "Sort order",
      saveOffer: "Save offer",
      createDraft: "Create draft",
      offerCurrentStatus: "Current status",
      offerPublishNote: "Publishing is always explicit.",
      setStatusTo: "Set status: {status}",
      productNameAr: "Name (Arabic)",
      productNameEn: "Name (English)",
      descriptionAr: "Description (Arabic)",
      descriptionEn: "Description (English)",
      specsAr: "Specs (Arabic)",
      specsEn: "Specs (English)",
      category: "Category (launch set only)",
      retailPrice: "Retail price",
      currency: "Currency code",
      currencyHelp: "Configurable — commercial default is still open.",
      currencyPlaceholder: "e.g. TEST for fixtures only",
      statusLabel: "Status",
      availabilityLabel: "Availability",
      availabilityHelp: "Retail flag, not inventory.",
      wholesaleEligible: "Wholesale eligible",
      wholesaleEligibleHelp: "Flag only — no wholesale UI is attached to it yet.",
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
    offers: "Public offers",
    profile: "Profile",
    logout: "Sign out",
    welcome: "Welcome, {name}",
    lead: "Negotiate deals and submit wholesale requests against RARE OUD stock — this is not a storefront.",
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
    entriesCount: "{n} entries",
    colReference: "Reference",
    colTitle: "Title",
    colKind: "Kind",
    colStatus: "Status",
    colEntries: "Entries",
    newDealTitle: "Propose a deal",
    newDealLead:
      "Catalog deals reference an existing RARE OUD product. Non-catalog opportunities stay outside the catalog until an admin later chooses otherwise — never automatic.",
    sectionType: "Deal type",
    sectionTerms: "Commercial terms",
    sectionMessage: "Opening message",
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
    negTitle: "Negotiation response",
    negHint:
      "Structured negotiation — not chat. Choose continue, counter, accept, or close.",
    negAction: "Action",
    negMessage: "Message",
    negPrice: "Proposed price",
    negCurrency: "Currency",
    negQty: "Quantity",
    negConditions: "Conditions / notes",
    negRecorded: "Negotiation entry recorded.",
    negSubmit: "Submit entry",
    wsTitle: "Wholesale ordering",
    wsLead:
      "Request wholesale quantities from RARE OUD’s catalog. This is not a trader storefront and does not create deals or retail requests.",
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
      "Profile changes are managed by RARE OUD admin. This is not a public seller identity.",
    offersTitle: "Public curated offers",
    offersLead: "Published RARE OUD presentations only — not trader storefronts.",
    offersEmpty: "No published offers yet.",
    offersOpenPublic: "Open public offers page",
  },
  inbox: {
    title: "WhatsApp inbox",
    subtitle:
      "Real WhatsApp conversations from the database. No demo data.",
    empty: "No conversations yet. They appear when real WhatsApp messages arrive.",
    backToList: "All conversations",
    lastMessage: "Last message",
    unread: "Unread",
    connection: "Connection",
    outboundDisabled: "Outbound disabled (WHATSAPP_OUTBOUND_ENABLED)",
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
    unsupported: "Unsupported type (text only in this stage)",
    sendFailed: "Send failed. Check the message status.",
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
  },
  common: {
    language: "AR",
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
      "We collect contact details needed to prepare your request (name, phone, notes, and destination) and use them only to communicate with the RARE OUD team via WhatsApp. We do not sell your data and the site does not process online payments. Cookies used are limited to session and language. Contact us via the contact page for questions.",
  },
  auth: {
    adminTitle: "Admin sign in",
    traderTitle: "Trader sign in",
    traderHint: "Accounts are provisioned by RARE OUD admin. No public registration.",
    loginError: "Email or password is incorrect.",
    showPassword: "Show",
    hidePassword: "Hide",
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
