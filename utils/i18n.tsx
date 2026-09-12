import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'fr';

export interface Translations {
  // Navigation
  appName: string;
  appSubtitle: string;
  navPhysicalTests: string;
  navMeasurements: string;
  navClasses: string;
  navImportExport: string;
  navSettings: string;

  // Classes Screen
  classesTitle: string;
  classesSubtitle: string;

  // Sub-navigation Physical Tests & VMA
  tabPhysicalTestsList: string;
  tabPhysicalLucLeger: string;
  tabLucLeger: string;

  // General terms
  class: string;
  classNamePlaceholder: string;
  student: string;
  students: string;
  studentsList: string;
  studentNumber: string;
  studentName: string;
  gender: string;
  male: string;
  female: string;
  unspecified: string;
  date: string;
  save: string;
  cancel: string;
  delete: string;
  export: string;
  import: string;
  searchPlaceholder: string;
  emptyStudentsNotice: string;
  success: string;
  error: string;
  confirm: string;
  actions: string;
  completed: string;
  empty: string;

  // Measurements & Anthropometry
  measurementsTitle: string;
  measurementsSubtitle: string;
  height: string;
  heightUnit: string;
  weight: string;
  weightUnit: string;
  bmi: string;
  bmiCategory: string;
  bmiUnderweight: string;
  bmiNormal: string;
  bmiOverweight: string;
  bmiObese: string;
  heartRate: string;
  heartRateUnit: string;
  heartRateRest: string;
  heartRateEffort: string;
  quickTableMode: string;
  individualMode: string;
  classStats: string;
  avgHeight: string;
  avgWeight: string;
  avgHeartRate: string;
  avgBmi: string;

  // Physical tests
  physicalTestsTitle: string;
  physicalTestsSubtitle: string;
  athletics: string;
  morphologyHealth: string;
  sprint30m: string;
  longJump: string;
  verticalJump: string;
  medballThrow: string;
  flexibilitySitting: string;
  flexibilityStanding: string;
  staticBalance: string;
  vmaTitle: string;
  vmaUnit: string;
  tabPhysicalTestsList: string;
  tabPhysicalLucLeger: string;
  startVmaFieldTest: string;
  viewPhysicalTestsList: string;
  secondsUnit: string;
  metersUnit: string;
  cmUnit: string;

  // Import / Export
  importExportTitle: string;
  importExportSubtitle: string;
  importStudentsCard: string;
  importStudentsDesc: string;
  importPhysicalCard: string;
  importPhysicalDesc: string;
  downloadTemplatesCard: string;
  downloadTemplatesDesc: string;
  exportResultsCard: string;
  exportResultsDesc: string;
  templatePhysical: string;
  templateStudents: string;
  exportLucLeger: string;
  exportVmaGroupsWord: string;
  exportPhysicalExcel: string;
  exportMeasurementsExcel: string;
  backupRestoreCard: string;
  backupRestoreDesc: string;
  exportBackup: string;
  importBackup: string;

  // Settings
  settingsTitle: string;
  settingsSubtitle: string;
  languageSelect: string;
  arabicLang: string;
  frenchLang: string;
  groupSizeLabel: string;
  groupSizeDesc: string;
  sessionDateTime: string;
  sessionDateTimeDesc: string;
  aboutApp: string;
  aboutAppDesc: string;
  devTitle: string;
  dev1Name: string;
  dev1Role: string;
  dev2Name: string;
  dev2Role: string;
  directorate: string;
  exportClassPhysicalExcel: string;
  exportClassMeasurementsExcel: string;
  exportClassVmaExcel: string;
  developer: string;
  allRightsReserved: string;
}

const translations: Record<Language, Translations> = {
  ar: {
    appName: "روائز التربية البدنية والرياضية",
    appSubtitle: "الاختبارات البدنية والقياسات البيومترية",
    navPhysicalTests: "الاختبارات البدنية",
    navMeasurements: "القياسات (الطول/الوزن/النبض)",
    navClasses: "لائحة الأقسام",
    navImportExport: "استيراد وتصدير",
    navSettings: "الإعدادات",

    classesTitle: "لوائح الأقسام والإحصائيات",
    classesSubtitle: "معاينة كافة الأقسام المستوردة ومتابعة نسب إنجاز الاختبارات والتقييمات لكل قسم",

    tabPhysicalTestsList: "بطاقة وسجل الاختبارات البدنية",
    tabPhysicalLucLeger: "اختبار السرعة الهوائية (Luc Léger VMA)",
    tabLucLeger: "اختبار VMA (Luc Léger 20m)",

    class: "القسم",
    classNamePlaceholder: "مثال: 6ème A أو 1APIC-1",
    student: "تلميذ",
    students: "تلاميذ",
    studentsList: "لائحة التلاميذ",
    studentNumber: "رقم التلميذ",
    studentName: "الاسم والنسب",
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
    unspecified: "غير محدد",
    date: "التاريخ",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    export: "تصدير",
    import: "استيراد",
    searchPlaceholder: "بحث بالاسم أو الرقم...",
    emptyStudentsNotice: "لا يوجد تلاميذ في هذا القسم. استخدم زر الاستيراد لإضافة تلاميذ.",
    success: "تم بنجاح",
    error: "خطأ",
    confirm: "تأكيد",
    actions: "الإجراءات",
    completed: "مكتمل",
    empty: "فارغ",

    measurementsTitle: "القياسات البيومترية والأنثروبومترية",
    measurementsSubtitle: "تسجيل الطول والوزن ومعدل النبض وحساب مؤشر كتلة الجسم (IMC)",
    height: "الطول",
    heightUnit: "سم",
    weight: "الوزن",
    weightUnit: "كغ",
    bmi: "مؤشر كتلة الجسم (IMC)",
    bmiCategory: "الحالة البدنية",
    bmiUnderweight: "نقص وزن",
    bmiNormal: "وزن طبيعي",
    bmiOverweight: "زيادة وزن",
    bmiObese: "سمنة",
    heartRate: "دقات القلب (النبض)",
    heartRateUnit: "نبضة/دقيقة",
    heartRateRest: "نبض الراحة",
    heartRateEffort: "نبض الجهد",
    quickTableMode: "إدخال سريع بالجدول",
    individualMode: "بطاقة التلميذ الفردية",
    classStats: "إحصائيات القسم",
    avgHeight: "متوسط الطول",
    avgWeight: "متوسط الوزن",
    avgHeartRate: "متوسط النبض",
    avgBmi: "متوسط IMC",

    physicalTestsTitle: "الاختبارات البدنية",
    physicalTestsSubtitle: "تقييم عناصر اللياقة البدنية والسرعة والارتقاء والمرونة والتوازن وقيمة VMA",
    athletics: "ألعاب القوى والمهارات الحركية",
    morphologyHealth: "البنية والصحة العامة",
    sprint30m: "30 م سرعة",
    longJump: "القفز الأفقي",
    verticalJump: "القفز العمودي (سارجنت)",
    medballThrow: "رمي الكرة الطبية (3 كلغ)",
    flexibilitySitting: "المرونة في وضعية الجلوس",
    flexibilityStanding: "المرونة في وضعية الوقوف",
    staticBalance: "التوازن الثابت",
    vmaTitle: "السرعة القصوى الهوائية (VMA)",
    vmaUnit: "كم/س",
    startVmaFieldTest: "إجراء اختبار Luc Léger الميداني",
    viewPhysicalTestsList: "عرض بطاقة وسجل الاختبارات البدنية",
    secondsUnit: "ث",
    metersUnit: "م",
    cmUnit: "سم",

    importExportTitle: "مركز الاستيراد والتصدير",
    importExportSubtitle: "استيراد وتصدير لوائح التلاميذ والنتائج ونماذج العمل الجاهزة",
    importStudentsCard: "استيراد لائحة التلاميذ",
    importStudentsDesc: "استيراد أسماء وأرقام التلاميذ مباشرة من ملف إكسيل لمنظومة مسار أو المعتمد.",
    importPhysicalCard: "استيراد الاختبارات البدنية و VMA",
    importPhysicalDesc: "استيراد النتائج والقياسات من ملف Excel مع إمكانية المزامنة الفورية مع لائحة التلاميذ وقيم VMA.",
    downloadTemplatesCard: "تحميل النماذج الجاهزة",
    downloadTemplatesDesc: "تحميل ملفات Excel فارغة ومجهزة بأعمدة منظمة جاهزة للطباعة أو التعبئة الرقمية.",
    exportResultsCard: "تصدير نتائج الاختبارات",
    exportResultsDesc: "تصدير نتائج اختبارات VMA Luc Léger، الاختبارات البدنية، والقياسات البيومترية إلى صيغ Excel و Word.",
    templatePhysical: "نموذج الاختبارات البدنية والقياسات",
    templateStudents: "نموذج لائحة التلاميذ",
    exportLucLeger: "تصدير نتائج اختبار Luc Léger (Excel)",
    exportVmaGroupsWord: "تصدير مجموعات VMA المتجانسة (Word)",
    exportPhysicalExcel: "تصدير الاختبارات البدنية كاملة (Excel)",
    exportMeasurementsExcel: "تصدير القياسات البيومترية و IMC (Excel)",
    backupRestoreCard: "النسخ الاحتياطي والاستعادة",
    backupRestoreDesc: "حفظ نسخة كاملة من جميع بيانات وأقسام التطبيق واستعادتها في أي وقت.",
    exportBackup: "تصدير نسخة احتياطية (JSON)",
    importBackup: "استعادة نسخة احتياطية (JSON)",

    settingsTitle: "الإعدادات العامة",
    settingsSubtitle: "تخصيص اللغة وإعدادات الجلسة والمجموعات",
    languageSelect: "لغة التطبيق (Langue)",
    arabicLang: "العربية (RTL)",
    frenchLang: "Français (LTR)",
    groupSizeLabel: "عدد التلاميذ في كل مجموعة متجانسة",
    groupSizeDesc: "يستخدم لحساب وتقسيم التلاميذ لمجموعات متقاربة المستوى حسب VMA.",
    sessionDateTime: "تاريخ وتوقيت الجلسة",
    sessionDateTimeDesc: "اتركه فارغاً لاستخدام التاريخ والتوقيت التلقائي الحالي أثناء الاختبار.",
    aboutApp: "حول التطبيق",
    aboutAppDesc: "تطبيق متكامل لمدرسي مادة التربية البدنية والرياضية لإدارة الاختبارات البدنية، اختبار السرعة القصوى الهوائية (Luc Léger 20m VMA)، القياسات البيومترية، وتشكيل مجموعات متجانسة وحساب مؤشرات اللياقة البدنية.",
    devTitle: "برمجة وتطوير",
    dev1Name: "حماني عمر",
    dev1Role: "أستاذ التعليم الثانوي الإعدادي",
    dev2Name: "سنوسي أمين",
    dev2Role: "مفتش التربية البدنية والرياضية",
    directorate: "مديرية تاوريرت",
    exportClassPhysicalExcel: "تصدير الاختبارات البدنية (Excel)",
    exportClassMeasurementsExcel: "تصدير القياسات و IMC (Excel)",
    exportClassVmaExcel: "تصدير نتائج VMA (Excel)",
    developer: "برمجة وتطوير: حماني عمر (أستاذ التعليم الثانوي الإعدادي) - سنوسي أمين (مفتش التربية البدنية والرياضية) | مديرية تاوريرت",
    allRightsReserved: "جميع الحقوق محفوظة."
  },
  fr: {
    appName: "Batterie des Tests EPS",
    appSubtitle: "Tests physiques et biométrie",
    navPhysicalTests: "Tests physiques",
    navMeasurements: "Mesures biométriques",
    navClasses: "Liste des classes",
    navImportExport: "Import & Export",
    navSettings: "Paramètres",

    classesTitle: "Fiches et Statistiques des Classes",
    classesSubtitle: "Consultez l'ensemble des classes importées et suivez l'état d'avancement des évaluations",

    tabPhysicalTestsList: "Fiches et saisie des tests physiques",
    tabPhysicalLucLeger: "Test VMA (Luc Léger 20m)",
    tabLucLeger: "Test VMA (Luc Léger 20m)",

    class: "Classe",
    classNamePlaceholder: "Ex: 3ème 2 ou 1APIC-1",
    student: "Élève",
    students: "Élèves",
    studentsList: "Liste des élèves",
    studentNumber: "N° d'élève",
    studentName: "Nom et Prénom",
    gender: "Sexe",
    male: "Masculin (G)",
    female: "Féminin (F)",
    unspecified: "Non précisé",
    date: "Date",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    export: "Exporter",
    import: "Importer",
    searchPlaceholder: "Rechercher par nom ou numéro...",
    emptyStudentsNotice: "Aucun élève dans cette classe. Utilisez le bouton d'import pour charger une liste.",
    success: "Succès",
    error: "Erreur",
    confirm: "Confirmer",
    actions: "Actions",
    completed: "Rempli",
    empty: "Vide",

    measurementsTitle: "Mesures biométriques et anthropométriques",
    measurementsSubtitle: "Enregistrement de la taille, du poids, de la fréquence cardiaque et calcul de l'IMC",
    height: "Taille",
    heightUnit: "cm",
    weight: "Poids",
    weightUnit: "kg",
    bmi: "Indice de Masse Corporelle (IMC)",
    bmiCategory: "Statut pondéral",
    bmiUnderweight: "Insuffisance pondérale",
    bmiNormal: "Poids normal",
    bmiOverweight: "Surpoids",
    bmiObese: "Obésité",
    heartRate: "Fréquence cardiaque (Pouls)",
    heartRateUnit: "bpm",
    heartRateRest: "Pouls de repos",
    heartRateEffort: "Pouls d'effort",
    quickTableMode: "Saisie rapide en tableau",
    individualMode: "Fiche élève individuelle",
    classStats: "Statistiques de la classe",
    avgHeight: "Taille moyenne",
    avgWeight: "Poids moyen",
    avgHeartRate: "Pouls moyen",
    avgBmi: "IMC moyen",

    physicalTestsTitle: "Tests physiques",
    physicalTestsSubtitle: "Évaluation de la vitesse, détente, lancer, souplesse, équilibre et valeur VMA",
    athletics: "Athlétisme & Qualités motrices",
    morphologyHealth: "Morphologie & Santé",
    sprint30m: "Vitesse 30 mètres",
    longJump: "Saut en longueur",
    verticalJump: "Détente verticale (Sargent)",
    medballThrow: "Lancer de médecine-ball (3kg)",
    flexibilitySitting: "Souplesse en position assise",
    flexibilityStanding: "Souplesse en position debout",
    staticBalance: "Équilibre statique",
    vmaTitle: "Vitesse Maximale Aérobie (VMA)",
    vmaUnit: "km/h",
    startVmaFieldTest: "Passer le test Luc Léger VMA",
    viewPhysicalTestsList: "Retour à la fiche des tests",
    secondsUnit: "s",
    metersUnit: "m",
    cmUnit: "cm",

    importExportTitle: "Centre d'Importation & Exportation",
    importExportSubtitle: "Gestion des listes, résultats d'évaluation et modèles prêts à l'emploi",
    importStudentsCard: "Importer la liste des élèves",
    importStudentsDesc: "Importer les noms et identifiants directement depuis un fichier Excel Massar ou Moutamad.",
    importPhysicalCard: "Importer les tests physiques et VMA",
    importPhysicalDesc: "Importer les résultats depuis un classeur Excel avec synchronisation automatique VMA et liste d'élèves.",
    downloadTemplatesCard: "Télécharger les modèles vierges",
    downloadTemplatesDesc: "Obtenir des gabarits Excel structurés avec les colonnes adaptées, prêts à être remplis.",
    exportResultsCard: "Exporter les résultats",
    exportResultsDesc: "Exporter les bilans d'évaluation VMA Luc Léger, tests physiques et mesures aux formats Excel et Word.",
    templatePhysical: "Modèle Tests Physiques & Mesures",
    templateStudents: "Modèle Liste des élèves",
    exportLucLeger: "Exporter résultats Luc Léger (Excel)",
    exportVmaGroupsWord: "Rapport des groupes VMA (Word)",
    exportPhysicalExcel: "Bilan complet tests physiques (Excel)",
    exportMeasurementsExcel: "Fiche des mesures et IMC (Excel)",
    backupRestoreCard: "Sauvegarde & Restauration",
    backupRestoreDesc: "Sauvegarder l'ensemble des données de l'application dans un fichier et les restaurer à tout moment.",
    exportBackup: "Sauvegarder tout (JSON)",
    importBackup: "Restaurer sauvegarde (JSON)",

    settingsTitle: "Paramètres généraux",
    settingsSubtitle: "Choix de la langue, options de séance et répartition des groupes",
    languageSelect: "Langue de l'application",
    arabicLang: "العربية (Arabe - RTL)",
    frenchLang: "Français (French - LTR)",
    groupSizeLabel: "Effectif par groupe d'affinité",
    groupSizeDesc: "Détermine la taille des groupes homogènes constitués selon la VMA.",
    sessionDateTime: "Date et heure de la séance",
    sessionDateTimeDesc: "Laisser vide pour utiliser automatiquement la date et l'heure actuelles.",
    aboutApp: "À propos de l'application",
    aboutAppDesc: "Application conçue pour les enseignants d'EPS afin de faciliter l'évaluation des tests physiques, le test navette Luc Léger (VMA 20m), le suivi des mensurations et la constitution de groupes homogènes.",
    devTitle: "Programmation et Développement",
    dev1Name: "Hamani Omar",
    dev1Role: "Professeur de l'enseignement secondaire collégial",
    dev2Name: "Sanoussi Amine",
    dev2Role: "Inspecteur de l'éducation physique et sportive",
    directorate: "Direction Provinciale de Taourirt",
    exportClassPhysicalExcel: "Exporter tests physiques (Excel)",
    exportClassMeasurementsExcel: "Exporter mesures & IMC (Excel)",
    exportClassVmaExcel: "Exporter résultats VMA (Excel)",
    developer: "Programmation et Développement : Hamani Omar (Professeur de l'enseignement secondaire collégial) - Sanoussi Amine (Inspecteur EPS) | Direction Provinciale de Taourirt",
    allRightsReserved: "Tous droits réservés."
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  setLanguage: () => {},
  t: translations.ar,
  isRtl: true
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('eps_app_lang');
    return (saved === 'fr' || saved === 'ar') ? saved : 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('eps_app_lang', lang);
  };

  useEffect(() => {
    const isRtl = language === 'ar';
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: translations[language],
    isRtl: language === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
