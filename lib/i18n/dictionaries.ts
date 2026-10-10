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
  };
  home: {
    headline: string;
    sub: string;
    heroLabel: string;
    ctaCatalog: string;
    ctaOffers: string;
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
  };
  offers: {
    title: string;
    sub: string;
    empty: string;
    back: string;
    relatedProduct: string;
  };
  product: {
    addToCart: string;
    unavailable: string;
    specs: string;
    priceOnRequest: string;
  };
  cart: {
    title: string;
    empty: string;
    continue: string;
    remove: string;
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
    linkErrorUnsupported: string;
    linkErrorNotFound: string;
    linkErrorUnauthorized: string;
    linkSuccess: string;
    unlinkSuccess: string;
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
  },
  home: {
    headline: "ندرةٌ تُختار، وحضورٌ يُقدَّم بهدوء",
    sub: "بيتٌ معاصر للعَود والخشب النادر — كتالوج دقيق، واكتشافٌ مُنَسَّق، وطلب يُجهَّز للنقاش مع الفريق.",
    heroLabel: "بيت العَود النادر",
    ctaCatalog: "تصفح الكتالوج",
    ctaOffers: "عروض مختارة",
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
  },
  offers: {
    title: "عروض مختارة",
    sub: "عروض تنشرها RARE OUD بعناية — ليست متاجر تجّار ولا قوائم بائعين.",
    empty: "لا توجد عروض منشورة حالياً.",
    back: "كل العروض",
    relatedProduct: "منتج من الكتالوج",
  },
  product: {
    addToCart: "أضف إلى قائمة الطلب",
    unavailable: "غير متوفر حالياً",
    specs: "المواصفات",
    priceOnRequest: "السعر عند الطلب",
  },
  cart: {
    title: "قائمة الطلب",
    empty: "قائمة الطلب فارغة.",
    continue: "متابعة الطلب",
    remove: "إزالة",
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
    linkErrorUnsupported: "نوع ربط غير مدعوم.",
    linkErrorNotFound: "السجل غير موجود.",
    linkErrorUnauthorized: "غير مصرّح.",
    linkSuccess: "تم ربط المحادثة.",
    unlinkSuccess: "تمت إزالة الربط.",
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
  },
  home: {
    headline: "Rarity, chosen. Presence, presented with quiet.",
    sub: "A contemporary house of oud and rare wood — precise cataloguing, curated discovery, and retail requests prepared for considered conversation.",
    heroLabel: "House of rare oud",
    ctaCatalog: "Browse catalog",
    ctaOffers: "Curated offers",
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
  },
  offers: {
    title: "Curated offers",
    sub: "Carefully published presentations by RARE OUD — not trader storefronts or seller listings.",
    empty: "No published offers yet.",
    back: "All offers",
    relatedProduct: "Related catalog product",
  },
  product: {
    addToCart: "Add to request list",
    unavailable: "Currently unavailable",
    specs: "Specifications",
    priceOnRequest: "Price on request",
  },
  cart: {
    title: "Request list",
    empty: "Your request list is empty.",
    continue: "Continue request",
    remove: "Remove",
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
    linkErrorUnsupported: "Unsupported link type.",
    linkErrorNotFound: "Record not found.",
    linkErrorUnauthorized: "Unauthorized.",
    linkSuccess: "Conversation linked.",
    unlinkSuccess: "Link removed.",
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
  },
};

const dictionaries: Record<Locale, Dict> = { ar, en };

export type Dictionary = Dict;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
