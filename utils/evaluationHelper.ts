// utils/evaluationHelper.ts
import { PhysicalTests } from '../types';

export type PerformanceRating = 'excellent' | 'very_good' | 'good' | 'average' | 'needs_improvement';

export interface RatingResult {
  rating: PerformanceRating;
  labelAr: string;
  labelFr: string;
  badgeColor: string;
  scoreDisplay: string;
}

export interface SportRecommendation {
  categoryAr: string;
  categoryFr: string;
  primaryQualityAr: string;
  primaryQualityFr: string;
  recommendedSportsAr: string[];
  recommendedSportsFr: string[];
  talentTitleAr: string;
  talentTitleFr: string;
  icon: string;
  descriptionAr: string;
}

// Map each physical test field to its sports recommendation profile
export const TEST_SPORT_RECOMMENDATIONS: Record<string, SportRecommendation> = {
  vma: {
    categoryAr: 'التحمل والتنفس (VMA)',
    categoryFr: 'Endurance & Capacité Aérobie',
    primaryQualityAr: 'القدرة الأكسجينية القصوى والتحمل الدوري التنفسي',
    primaryQualityFr: 'Capacité Aérobie Maximale & Endurance Cardio-respiratoire',
    recommendedSportsAr: ['ألعاب القوى (المسافات الطويلة والمتوسطة)', 'كرة القدم', 'كرة السلة', 'سباق الدراجات', 'السباحة (الافتتاحية)'],
    recommendedSportsFr: ['Athlétisme (Demi-fond & Fond)', 'Football', 'Basketball', 'Cyclisme', 'Natation'],
    talentTitleAr: 'بطل التحمل الدوري التنفسي 🫁',
    talentTitleFr: 'Champion d\'Endurance 🫁',
    icon: '🫁',
    descriptionAr: 'يتميز هذا المتعلم بقدرة هوائية عالية تمكنه من الاستمرار في المجهودات البدنية طويلة المدى وتناسب الألعاب الجماعية وسباقات التحمل.'
  },
  vitesse30m: {
    categoryAr: 'السرعة الانفجارية (30م)',
    categoryFr: 'Vitesse d\'Explosivité (30m)',
    primaryQualityAr: 'سرعة التفاعل، التردد الحركي والقوة السريعة',
    primaryQualityFr: 'Vitesse de Réaction, Fréquence Gestuelle & Force Rapide',
    recommendedSportsAr: ['ألعاب القوى (سباقات السرعة 100م/200م)', 'كرة اليد (الهجوم السريع)', 'كرة القدم (الأجنحة)', 'الرغبي', 'الملاكمة'],
    recommendedSportsFr: ['Athlétisme (Sprint 100m/200m)', 'Handball (Contre-attaque)', 'Football (Ailiers)', 'Rugby', 'Boxe'],
    talentTitleAr: 'صاروخ السرعة الانفجارية ⚡',
    talentTitleFr: 'Fusée de Vitesse ⚡',
    icon: '⚡',
    descriptionAr: 'يمتلك المتعلم أليافاً عضلية سريعة تسمح له بالتسارع الفوري والانطلاق السريع، مما يجعله متميزاً في سباقات السرعة والهجمات المرتدة.'
  },
  sautVertical: {
    categoryAr: 'القوة الانفجارية العمودية (القفز العمودي)',
    categoryFr: 'Détente Verticale (Sargent Test)',
    primaryQualityAr: 'القوة الانفجارية للأطراف السفلى والارتقاء',
    primaryQualityFr: 'Puissance Explosive des Membres Inférieurs',
    recommendedSportsAr: ['كرة الطائرة (الكبس والصد)', 'كرة السلة (الارتداد والارتقاء)', 'حراسة المرمى في كرة القدم', 'القفز العالي'],
    recommendedSportsFr: ['Volleyball (Smash & Contre)', 'Basketball (Rebond & Dunk)', 'Gardien de But', 'Saut en Hauteur'],
    talentTitleAr: 'نجم الارتقاء العمودي 🚀',
    talentTitleFr: 'Étoile de Détente Verticale 🚀',
    icon: '🚀',
    descriptionAr: 'قدرة ممتازة على الارتقاء والتفوق في الكرات العالية، مما يمنحه أسبقية كبيرة في الكرة الطائرة وكرة السلة وحراسة المرمى.'
  },
  sautHorizontal: {
    categoryAr: 'القوة الانفجارية الأفقية (القفز الأفقي)',
    categoryFr: 'Détente Horizontale (Saut en Longueur)',
    primaryQualityAr: 'القوة الانفجارية الأفقية والاندفاع',
    primaryQualityFr: 'Explosivité Horizontale & Impulsion',
    recommendedSportsAr: ['ألعاب القوى (القفز الطولي والكمي)', 'كرة اليد (الارتكاز والقفز)', 'التايكوندو والكاراتيه', 'سباق الحواجز'],
    recommendedSportsFr: ['Athlétisme (Saut en Longueur & Triplesaut)', 'Handball', 'Taekwondo & Karate', 'Course de Haies'],
    talentTitleAr: 'بطل الوثب الأفقي 📐',
    talentTitleFr: 'Champion de Saut en Longueur 📐',
    icon: '📐',
    descriptionAr: 'يتمتع بقوة دفعة أفقية ممتازة تمكنه من اجتياز مسافات طويلة في الوثب والتسديد أثناء القفز في كرة اليد.'
  },
  lancerMedball: {
    categoryAr: 'القوة الانفجارية للطرف العلوي (رمي الكرة الطبية)',
    categoryFr: 'Force Explosive du Haut du Corps (Lancer Médical Ball)',
    primaryQualityAr: 'قوة العضلات الصدرية والكتفين والجذع',
    primaryQualityFr: 'Force Explosive Pectorale, Épaules & Tronc',
    recommendedSportsAr: ['ألعاب القوى (رمي الجلة والرمح والقرص)', 'كرة اليد (التسديد القوي)', 'كرة الماء', 'السباحة (الدفعة الأولى)'],
    recommendedSportsFr: ['Athlétisme (Lancer de Poids & Javelot)', 'Handball (Tirs puissants)', 'Water-polo', 'Natation'],
    talentTitleAr: 'عملاق القوة والرمي 💥',
    talentTitleFr: 'Géant de Lancer & Puissance 💥',
    icon: '💥',
    descriptionAr: 'يمتلك قوة عضلية انفجارية عالية في الجذع والطرف العلوي، مما يؤهله للتفوق في رياضات الرمي والتسديدات القوية.'
  },
  souplesseAssis: {
    categoryAr: 'المرونة الخلفية (مرونة جلوس)',
    categoryFr: 'Souplesse Tronc & Ischio-jambiers (Assis)',
    primaryQualityAr: 'مطاطية العضلات الخلفية ومرونة العمود الفقري',
    primaryQualityFr: 'Extensibilité Ischio-jambière & Flexibilité Rachidienne',
    recommendedSportsAr: ['الجمباز الفني والإيقاعي', 'الفنون القتالية (التايكوندو والتاي بوكسينغ)', 'السباحة', 'التعبير الجسدي والرقص'],
    recommendedSportsFr: ['Gymnastique Artistique & Rythmique', 'Arts Martiaux (Taekwondo)', 'Natation', 'Danse'],
    talentTitleAr: 'مرونة ورشاقة عالية 🧘',
    talentTitleFr: 'Souplesse Exceptionnelle 🧘',
    icon: '🧘',
    descriptionAr: 'مدى حركي واسع ومطاطية عضلية ممتازة تقلل من خطر الإصابات وتساعد في أداء الحركات المركبة بجمالية وسلاسة.'
  },
  souplesseDebout: {
    categoryAr: 'المرونة العمودية (مرونة وقوف)',
    categoryFr: 'Souplesse Verticale (Debout)',
    primaryQualityAr: 'مرونة العمود الفقري والحوض',
    primaryQualityFr: 'Flexibilité Rachidienne & Pelvienne',
    recommendedSportsAr: ['الجمباز', 'الكاراتيه والتايكوندو', 'الغطس والسباحة', 'رياضات التوازن'],
    recommendedSportsFr: ['Gymnastique', 'Karate & Taekwondo', 'Plongeon & Natation', 'Sports d\'Équilibre'],
    talentTitleAr: 'بطل المرونة والانثناء 🧘‍♂️',
    talentTitleFr: 'Champion de Flexibilité 🧘‍♂️',
    icon: '🧘‍♂️',
    descriptionAr: 'انثناء ممتاز للجذع واستجابة مرنة للمفاصل تتيح تنفيذ الركلات العالية والمهارات الجمبازية المعقدة.'
  },
  equilibreStatique: {
    categoryAr: 'التوازن الثابت (Flamant Rose)',
    categoryFr: 'Équilibre Statique (Flamant Rose)',
    primaryQualityAr: 'التحكم الدهليزي والتوازن العضلي المفاصل والتركيز',
    primaryQualityFr: 'Contrôle Vestibulaire, Équilibre & Capacité de Concentration',
    recommendedSportsAr: ['الجمباز (عارضة التوازن)', 'الرماية بالقوس والسهم', 'الجودو والفنون القتالية', 'التزلج والتوازن الرياضي'],
    recommendedSportsFr: ['Gymnastique (Poutre d\'Équilibre)', 'Tir à l\'Arc', 'Judo & Judo', 'Sports de Glisse'],
    talentTitleAr: 'توازن فولاذي وتركيز عالي ⚖️',
    talentTitleFr: 'Équilibre d\'Acier & Concentration ⚖️',
    icon: '⚖️',
    descriptionAr: 'قدرة فائقة على الثبات العصبي العضلي والتحكم في مركز ثقل الجسم تحت الضغوط الحركية.'
  }
};

// Evaluate student performance value according to Moroccan EPS Standards (Secondary / High School level)
export function evaluateTestPerformance(
  testKey: string,
  value: number | undefined,
  gender: 'M' | 'F' = 'M'
): RatingResult {
  if (value === undefined || value === null || isNaN(value) || value <= 0) {
    return {
      rating: 'needs_improvement',
      labelAr: 'غير مسجل',
      labelFr: 'Non évalué',
      badgeColor: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700',
      scoreDisplay: '-'
    };
  }

  let rating: PerformanceRating = 'average';

  switch (testKey) {
    case 'vma': {
      // VMA in km/h
      const thresholds = gender === 'M' ? [16, 14.5, 13, 11] : [14.5, 13, 11.5, 10];
      if (value >= thresholds[0]) rating = 'excellent';
      else if (value >= thresholds[1]) rating = 'very_good';
      else if (value >= thresholds[2]) rating = 'good';
      else if (value >= thresholds[3]) rating = 'average';
      else rating = 'needs_improvement';
      break;
    }
    case 'vitesse30m': {
      // 30m Sprint in seconds (Lower is better)
      const thresholds = gender === 'M' ? [4.2, 4.6, 5.0, 5.5] : [4.6, 5.0, 5.5, 6.0];
      if (value <= thresholds[0]) rating = 'excellent';
      else if (value <= thresholds[1]) rating = 'very_good';
      else if (value <= thresholds[2]) rating = 'good';
      else if (value <= thresholds[3]) rating = 'average';
      else rating = 'needs_improvement';
      break;
    }
    case 'sautVertical': {
      // Vertical Jump in cm
      const thresholds = gender === 'M' ? [50, 42, 35, 28] : [42, 35, 28, 22];
      if (value >= thresholds[0]) rating = 'excellent';
      else if (value >= thresholds[1]) rating = 'very_good';
      else if (value >= thresholds[2]) rating = 'good';
      else if (value >= thresholds[3]) rating = 'average';
      else rating = 'needs_improvement';
      break;
    }
    case 'sautHorizontal': {
      // Horizontal Jump in cm (e.g. 210cm) or m (e.g. 2.1m)
      const normVal = value < 10 ? value * 100 : value; // normalize meters to cm
      const thresholds = gender === 'M' ? [220, 195, 170, 145] : [180, 160, 140, 120];
      if (normVal >= thresholds[0]) rating = 'excellent';
      else if (normVal >= thresholds[1]) rating = 'very_good';
      else if (normVal >= thresholds[2]) rating = 'good';
      else if (normVal >= thresholds[3]) rating = 'average';
      else rating = 'needs_improvement';
      break;
    }
    case 'lancerMedball': {
      // Medball throw in meters or cm
      const normVal = value > 25 ? value / 100 : value; // normalize cm to meters
      const thresholds = gender === 'M' ? [7.5, 6.5, 5.5, 4.5] : [6.0, 5.0, 4.2, 3.5];
      if (normVal >= thresholds[0]) rating = 'excellent';
      else if (normVal >= thresholds[1]) rating = 'very_good';
      else if (normVal >= thresholds[2]) rating = 'good';
      else if (normVal >= thresholds[3]) rating = 'average';
      else rating = 'needs_improvement';
      break;
    }
    case 'souplesseAssis':
    case 'souplesseDebout': {
      // Flexibility in cm
      const thresholds = gender === 'M' ? [25, 20, 15, 10] : [28, 23, 18, 12];
      if (value >= thresholds[0]) rating = 'excellent';
      else if (value >= thresholds[1]) rating = 'very_good';
      else if (value >= thresholds[2]) rating = 'good';
      else if (value >= thresholds[3]) rating = 'average';
      else rating = 'needs_improvement';
      break;
    }
    case 'equilibreStatique': {
      // Balance in seconds
      const thresholds = gender === 'M' ? [45, 30, 20, 10] : [45, 30, 20, 10];
      if (value >= thresholds[0]) rating = 'excellent';
      else if (value >= thresholds[1]) rating = 'very_good';
      else if (value >= thresholds[2]) rating = 'good';
      else if (value >= thresholds[3]) rating = 'average';
      else rating = 'needs_improvement';
      break;
    }
    default:
      rating = 'average';
  }

  const ratingMap: Record<PerformanceRating, { ar: string; fr: string; style: string }> = {
    excellent: {
      ar: 'ممتاز 🌟',
      fr: 'Excellent 🌟',
      style: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 font-extrabold'
    },
    very_good: {
      ar: 'جيد جداً 🟢',
      fr: 'Très Bon 🟢',
      style: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 font-bold'
    },
    good: {
      ar: 'جيد 🔵',
      fr: 'Bon 🔵',
      style: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-700 font-bold'
    },
    average: {
      ar: 'متوسط 🟡',
      fr: 'Moyen 🟡',
      style: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/80 dark:text-sky-200 dark:border-sky-700'
    },
    needs_improvement: {
      ar: 'يحتاج تطوير 🟠',
      fr: 'À Améliorer 🟠',
      style: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/80 dark:text-orange-200 dark:border-orange-700'
    }
  };

  const info = ratingMap[rating];

  return {
    rating,
    labelAr: info.ar,
    labelFr: info.fr,
    badgeColor: info.style,
    scoreDisplay: String(value)
  };
}

// Calculate normalized athletic score (0 - 100 points) for multi-test composite scoring
export function calculateTestPoints(
  testKey: string,
  value: number | undefined,
  gender: 'M' | 'F' = 'M'
): number {
  if (value === undefined || value === null || isNaN(value) || value <= 0) return 0;

  const evalRes = evaluateTestPerformance(testKey, value, gender);
  switch (evalRes.rating) {
    case 'excellent': return 95;
    case 'very_good': return 82;
    case 'good': return 68;
    case 'average': return 52;
    case 'needs_improvement': return 35;
    default: return 0;
  }
}
