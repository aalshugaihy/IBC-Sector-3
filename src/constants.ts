import { Task } from './types';

export const INITIAL_TASKS: Omit<Task, 'id'>[] = [
  // Knowledge Management and Conferences (إدارة المعرفة والمؤتمرات)
  { refNo: "KM-01", title: "إطلاق سلسلة الحصاد المعرفي لمخرجات المشاريع", department: "إدارة المعرفة والمؤتمرات", month: "يناير", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-01-15', endDate: '2026-01-15' },
  { refNo: "KM-02", title: "نشر قصص نجاح نقل المعرفة في المشاريع", department: "إدارة المعرفة والمؤتمرات", month: "فبراير", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-02-15', endDate: '2026-02-15' },
  { refNo: "KM-03", title: "إطلاق سلسلة المجالات المهنية", department: "إدارة المعرفة والمؤتمرات", month: "مارس", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-03-15', endDate: '2026-03-15' },
  { refNo: "KM-04", title: "3 ورش توعوية لنقل المعرفة لمدراء المشاريع", department: "إدارة المعرفة والمؤتمرات", month: "أبريل", status: "ongoing", completionPercentage: 50, priority: 'medium', startDate: '2026-04-15', endDate: '2026-04-15' },
  { refNo: "KM-05", title: "3 ورش توعوية لنقل المعرفة لمدراء المشاريع", department: "إدارة المعرفة والمؤتمرات", month: "مايو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-05-15', endDate: '2026-05-15' },
  { refNo: "KM-06", title: "إعداد حقيبة تدريبية لكل مدير مشروع عن نقل المعرفة", department: "إدارة المعرفة والمؤتمرات", month: "يونيو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-06-15', endDate: '2026-06-15' },
  { refNo: "KM-07", title: "إطلاق جائزة نجم النشر المعرفي", department: "إدارة المعرفة والمؤتمرات", month: "يوليو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-07-15', endDate: '2026-07-15' },
  { refNo: "KM-08", title: "إطلاق جائزة الرئيس لنقل المعرفة في المشاريع", department: "إدارة المعرفة والمؤتمرات", month: "أغسطس", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-08-15', endDate: '2026-08-15' },
  { refNo: "KM-09", title: "تصوير حلقة بودكاست مع قائد جيومكاني", department: "إدارة المعرفة والمؤتمرات", month: "سبتمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-09-15', endDate: '2026-09-15' },
  { refNo: "KM-10", title: "تصوير حلقة بودكاست مع خبير جيومكاني", department: "إدارة المعرفة والمؤتمرات", month: "أكتوبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-10-15', endDate: '2026-10-15' },
  { refNo: "KM-11", title: "تصوير حلقة بودكاست مع ملهم جيومكاني", department: "إدارة المعرفة والمؤتمرات", month: "نوفمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-11-15', endDate: '2026-11-15' },
  { refNo: "KM-12", title: "إطلاق سلسلة التوصيات التطبيقية المستخلصة من المشاركة في المؤتمرات", department: "إدارة المعرفة والمؤتمرات", month: "ديسمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-12-15', endDate: '2026-12-15' },

  // Social Responsibility (إدارة المسؤولية المجتمعية)
  { refNo: "SR-01", title: "مبادرات تطوعية بيئية في أحد المحميات - بدء استقبال طلبات تمهير للخريجين", department: "إدارة المسؤولية المجتمعية", month: "يناير", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-01-15', endDate: '2026-01-15' },
  { refNo: "SR-02", title: "مبادرة تطوعية توافق شهر رمضان", department: "إدارة المسؤولية المجتمعية", month: "فبراير", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-02-15', endDate: '2026-02-15' },
  { refNo: "SR-03", title: "نشرة توعوية اليوم العالمي للخدمة الاجتماعية 17 مارس", department: "إدارة المسؤولية المجتمعية", month: "مارس", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-03-15', endDate: '2026-03-15' },
  { refNo: "SR-04", title: "ورشة عمل صناعة المبادرات + نشرة توعوية اليوم العالمي للسلامة والصحة المهنية 28 أبريل", department: "إدارة المسؤولية المجتمعية", month: "أبريل", status: "ongoing", completionPercentage: 50, priority: 'medium', startDate: '2026-04-15', endDate: '2026-04-15' },
  { refNo: "SR-05", title: "معسكر تدريبي بالشراكة مع شريك مسؤولية مجتمعية و الصحة المهنية", department: "إدارة المسؤولية المجتمعية", month: "مايو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-05-15', endDate: '2026-05-15' },
  { refNo: "SR-06", title: "إطلاق معجم المصطلحات الجيومكانية بلغة الصم", department: "إدارة المسؤولية المجتمعية", month: "يونيو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-06-15', endDate: '2026-06-15' },
  { refNo: "SR-07", title: "نشرة توعوية عن اليوم العالمي لمهارات الشباب 15 يوليو", department: "إدارة المسؤولية المجتمعية", month: "يوليو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-07-15', endDate: '2026-07-15' },
  { refNo: "SR-08", title: "نشرة توعوية اليوم العالمي للشباب 12 أغسطس", department: "إدارة المسؤولية المجتمعية", month: "أغسطس", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-08-15', endDate: '2026-08-15' },
  { refNo: "SR-09", title: "نشرات توعوية (اليوم العالمي للعمل الخيري 14 سبتمبر + اليوم العالمي للغة الإشارة 24 سبتمبر + اليوم العالمي للمسؤولية المجتمعية 25 سبتمبر)", department: "إدارة المسؤولية المجتمعية", month: "سبتمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-09-15', endDate: '2026-09-15' },
  { refNo: "SR-10", title: "حملة تبرع بالدم لمنسوبي الهيئة", department: "إدارة المسؤولية المجتمعية", month: "أكتوبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-10-15', endDate: '2026-10-15' },
  { refNo: "SR-11", title: "تخريج طلاب التدريب التعاوني", department: "إدارة المسؤولية المجتمعية", month: "نوفمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-11-15', endDate: '2026-11-15' },
  { refNo: "SR-12", title: "نشرات توعوية (اليوم العالمي لذوي الإعاقة 3 ديسمبر + اليوم العالمي للعمل التطوعي 5 ديسمبر)", department: "إدارة المسؤولية المجتمعية", month: "ديسمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-12-15', endDate: '2026-12-15' },

  // Professional Standards (إدارة المعايير المهنية)
  { refNo: "PS-01", title: "نشرة معرفية", department: "إدارة المعايير المهنية", month: "يناير", status: "completed", completionPercentage: 100, priority: 'low', startDate: '2026-01-15', endDate: '2026-01-15' },
  { refNo: "PS-02", title: "تدريب 25 مراقب", department: "إدارة المعايير المهنية", month: "فبراير", status: "completed", completionPercentage: 100, priority: 'high', startDate: '2026-02-15', endDate: '2026-02-15' },
  { refNo: "PS-03", title: "ورشة عمل المعايير المهنية", department: "إدارة المعايير المهنية", month: "مارس", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-03-15', endDate: '2026-03-15' },
  { refNo: "PS-04", title: "نشرة معرفية", department: "إدارة المعايير المهنية", month: "أبريل", status: "ongoing", completionPercentage: 50, priority: 'low', startDate: '2026-04-15', endDate: '2026-04-15' },
  { refNo: "PS-05", title: "ورشة عمل المعايير المهنية", department: "إدارة المعايير المهنية", month: "مايو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-05-15', endDate: '2026-05-15' },
  { refNo: "PS-06", title: "تدريب 25 مراقب", department: "إدارة المعايير المهنية", month: "يونيو", status: "not-started", completionPercentage: 0, priority: 'high', startDate: '2026-06-15', endDate: '2026-06-15' },
  { refNo: "PS-07", title: "نشرة معرفية", department: "إدارة المعايير المهنية", month: "يوليو", status: "not-started", completionPercentage: 0, priority: 'low', startDate: '2026-07-15', endDate: '2026-07-15' },
  { refNo: "PS-08", title: "ورشة عمل المعايير المهنية", department: "إدارة المعايير المهنية", month: "أغسطس", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-08-15', endDate: '2026-08-15' },
  { refNo: "PS-09", title: "نشرة معرفية", department: "إدارة المعايير المهنية", month: "سبتمبر", status: "not-started", completionPercentage: 0, priority: 'low', startDate: '2026-09-15', endDate: '2026-09-15' },
  { refNo: "PS-10", title: "ورشة عمل المعايير المهنية", department: "إدارة المعايير المهنية", month: "أكتوبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-10-15', endDate: '2026-10-15' },
  { refNo: "PS-11", title: "تدريب 25 مراقب", department: "إدارة المعايير المهنية", month: "نوفمبر", status: "not-started", completionPercentage: 0, priority: 'high', startDate: '2026-11-15', endDate: '2026-11-15' },
  { refNo: "PS-12", title: "نشرة معرفية", department: "إدارة المعايير المهنية", month: "ديسمبر", status: "not-started", completionPercentage: 0, priority: 'low', startDate: '2026-12-15', endDate: '2026-12-15' },

  // Graduate Programs (البرامج والدراسات العليا)
  { refNo: "GP-01", title: "الأمن الجيومكاني وحماية البيانات الحساسة(1)", department: "البرامج والدراسات العليا", month: "يناير", status: "completed", completionPercentage: 100, priority: 'high', startDate: '2026-01-15', endDate: '2026-01-15' },
  { refNo: "GP-02", title: "الذكاء الاصطناعي الجيومكاني GeoAI", department: "البرامج والدراسات العليا", month: "فبراير", status: "completed", completionPercentage: 100, priority: 'high', startDate: '2026-02-15', endDate: '2026-02-15' },
  { refNo: "GP-03", title: "نظم المعلومات الجغرافية مفتوحة المصدر (QGIS)", department: "البرامج والدراسات العليا", month: "مارس", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-03-15', endDate: '2026-03-15' },
  { refNo: "GP-04", title: "التعريف بالمرجع المكاني الوطني(1)", department: "البرامج والدراسات العليا", month: "أبريل", status: "ongoing", completionPercentage: 50, priority: 'medium', startDate: '2026-04-15', endDate: '2026-04-15' },
  { refNo: "GP-05", title: "التطبيقات الجيومكانية", department: "البرامج والدراسات العليا", month: "مايو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-05-15', endDate: '2026-05-15' },
  { refNo: "GP-06", title: "التوأمة الرقمية Digital Twins", department: "البرامج والدراسات العليا", month: "يونيو", status: "not-started", completionPercentage: 0, priority: 'high', startDate: '2026-06-15', endDate: '2026-06-15' },
  { refNo: "GP-07", title: "الملاحة المتقدمة والأنظمة الذكية", department: "البرامج والدراسات العليا", month: "يوليو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-07-15', endDate: '2026-07-15' },
  { refNo: "GP-08", title: "علم البيانات الجيومكانية", department: "البرامج والدراسات العليا", month: "أغسطس", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-08-15', endDate: '2026-08-15' },
  { refNo: "GP-09", title: "ورش التعريف بالمرجع المكاني الوطني(2)", department: "البرامج والدراسات العليا", month: "سبتمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-09-15', endDate: '2026-09-15' },
  { refNo: "GP-10", title: "المدن الذكية Smart Cities", department: "البرامج والدراسات العليا", month: "أكتوبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-10-15', endDate: '2026-10-15' },
  { refNo: "GP-11", title: "الاستشعار عن بعد المتقدم", department: "البرامج والدراسات العليا", month: "نوفمبر", status: "not-started", completionPercentage: 0, priority: 'high', startDate: '2026-11-15', endDate: '2026-11-15' },
  { refNo: "GP-12", title: "التقنيات الحديثة في القطاع الجيومكاني(2)", department: "البرامج والدراسات العليا", month: "ديسمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-12-15', endDate: '2026-12-15' },

  // Qualification and Accreditation (إدارة التأهيل والاعتماد)
  { refNo: "QA-01", title: "تدشين منظومة الاعتماد والتحقق المهني الجيومكاني", department: "إدارة التأهيل والاعتماد", month: "يناير", status: "completed", completionPercentage: 100, priority: 'high', startDate: '2026-01-15', endDate: '2026-01-15' },
  { refNo: "QA-02", title: "اعتماد منظومة الأدلة والمعايير للإعتماد المهني الجيومكاني", department: "إدارة التأهيل والاعتماد", month: "فبراير", status: "completed", completionPercentage: 100, priority: 'high', startDate: '2026-02-15', endDate: '2026-02-15' },
  { refNo: "QA-03", title: "سلسلة النشرات المعرفية للمسارات الجيومكانية", department: "إدارة التأهيل والاعتماد", month: "مارس", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-03-15', endDate: '2026-03-15' },
  { refNo: "QA-04", title: "ورشة عمل عن الأجهزة الجيومكانية", department: "إدارة التأهيل والاعتماد", month: "أبريل", status: "ongoing", completionPercentage: 50, priority: 'medium', startDate: '2026-04-15', endDate: '2026-04-15' },
  { refNo: "QA-05", title: "نشرات عن تخطيط القوى العاملة في القطاع", department: "إدارة التأهيل والاعتماد", month: "مايو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-05-15', endDate: '2026-05-15' },
  { refNo: "QA-06", title: "زيارات ميدانية لجهات للتعريف بالتأهيل والتصنيف", department: "إدارة التأهيل والاعتماد", month: "يونيو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-06-15', endDate: '2026-06-15' },
  { refNo: "QA-07", title: "ورشة عن الأخطاء الشائعة في طلبات التصنيف المهني", department: "إدارة التأهيل والاعتماد", month: "يوليو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-07-15', endDate: '2026-07-15' },
  { refNo: "QA-08", title: "حملة عن ورشة الأخلاقيات المهنية وحماية البيانات المكانية", department: "إدارة التأهيل والاعتماد", month: "أغسطس", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-08-15', endDate: '2026-08-15' },
  { refNo: "QA-09", title: "تقديم ورقة عن منظومة الاعتماد الجيومكاني في محفل وطني أو دولي", department: "إدارة التأهيل والاعتماد", month: "سبتمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-09-15', endDate: '2026-09-15' },
  { refNo: "QA-10", title: "ندوة عن تقنيات الجيومكانية الأساسية مع المعهد الملكي للمساحين القانونيين", department: "إدارة التأهيل والاعتماد", month: "أكتوبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-10-15', endDate: '2026-10-15' },
  { refNo: "QA-11", title: "إطلاق الحملة الإعلامية عن اعتماد الأجهزة والبرامج التدريبية", department: "إدارة التأهيل والاعتماد", month: "نوفمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-11-15', endDate: '2026-11-15' },
  { refNo: "QA-12", title: "تقرير شامل عن الممارسين في القطاع الجيومكاني", department: "إدارة التأهيل والاعتماد", month: "ديسمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-12-15', endDate: '2026-12-15' },

  // Innovation and Emerging Tech (الإدارة التنفيذية للابتكار والتقنيات الناشئة)
  { refNo: "IN-01", title: "إقامة فعالية الحاضنات والمسرعات", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "يناير", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-01-15', endDate: '2026-01-15' },
  { refNo: "IN-02", title: "إقامة فعالية الحاضنات والمسرعات", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "فبراير", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-02-15', endDate: '2026-02-15' },
  { refNo: "IN-03", title: "إقامة فعالية الحاضنات والمسرعات", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "مارس", status: "completed", completionPercentage: 100, priority: 'medium', startDate: '2026-03-15', endDate: '2026-03-15' },
  { refNo: "IN-04", title: "تفعيل اليوم العالمي للابتكار بإقامة تحديات ابتكارية", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "أبريل", status: "ongoing", completionPercentage: 50, priority: 'high', startDate: '2026-04-15', endDate: '2026-04-15' },
  { refNo: "IN-05", title: "الحصول على شهادة ايزو الابتكار 56001", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "مايو", status: "not-started", completionPercentage: 0, priority: 'high', startDate: '2026-05-15', endDate: '2026-05-15' },
  { refNo: "IN-06", title: "الحصول على شهادة ايزو الابتكار 56001", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "يونيو", status: "not-started", completionPercentage: 0, priority: 'high', startDate: '2026-06-15', endDate: '2026-06-15' },
  { refNo: "IN-07", title: "إقامة محاضرات أو ورش عمل للتقنيات الناشئة للاستثمار الابتكاري الجيومكاني", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "يوليو", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-07-15', endDate: '2026-07-15' },
  { refNo: "IN-08", title: "تفعيل الشراكات والخروج بمنتج استثماري ابتكاري جيومكاني", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "أغسطس", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-08-15', endDate: '2026-08-15' },
  { refNo: "IN-09", title: "الانتهاء من معمل الابتكار الجيومكاني وتفعيله", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "سبتمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-09-15', endDate: '2026-09-15' },
  { refNo: "IN-10", title: "الانتهاء من معمل الابتكار الجيومكاني وتفعيله", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "أكتوبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-10-15', endDate: '2026-10-15' },
  { refNo: "IN-11", title: "فعالية جائزة الابتكار الجيومكاني", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "نوفمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-11-15', endDate: '2026-11-15' },
  { refNo: "IN-12", title: "فعالية جائزة الابتكار الجيومكاني", department: "الإدارة التنفيذية للابتكار والتقنيات الناشئة", month: "ديسمبر", status: "not-started", completionPercentage: 0, priority: 'medium', startDate: '2026-12-15', endDate: '2026-12-15' },
  { refNo: "KM-13", title: "تطوير دليل سياسات إدارة المعرفة", department: "إدارة المعرفة والمؤتمرات", month: "ديسمبر", status: "not-started", completionPercentage: 0, priority: 'high', startDate: '2026-12-20', endDate: '2026-12-20' }
];

export const ROLE_OPTIONS = [
  { value: 'admin', label: { ar: 'مدير أو مسؤول النظام', en: 'System Manager / Admin' }, color: 'bg-purple-100 text-purple-700' },
  { value: 'member', label: { ar: 'عضو', en: 'Member' }, color: 'bg-blue-100 text-blue-700' },
  { value: 'monitor', label: { ar: 'متابعة', en: 'Follow-up / Monitor' }, color: 'bg-amber-100 text-amber-700' },
  { value: 'custom', label: { ar: 'دور مخصص', en: 'Custom Role' }, color: 'bg-gray-100 text-gray-700' }
];

export const PERMISSIONS = {
  admin: ['tasks:create', 'tasks:edit', 'tasks:delete', 'tasks:archive', 'tasks:view_history', 'users:manage', 'reports:view', 'kanban:manage'],
  member: ['tasks:edit', 'tasks:view_history', 'reports:view'],
  monitor: ['tasks:view_history', 'reports:view']
};

export const PERMISSION_LABELS: Record<string, { ar: string, en: string }> = {
  'tasks:create': { ar: 'إنشاء المهام', en: 'Create Tasks' },
  'tasks:edit': { ar: 'تعديل المهام', en: 'Edit Tasks' },
  'tasks:delete': { ar: 'حذف المهام', en: 'Delete Tasks' },
  'tasks:archive': { ar: 'أرشفة المهام', en: 'Archive Tasks' },
  'tasks:view_history': { ar: 'عرض السجل', en: 'View History' },
  'users:manage': { ar: 'إدارة المستخدمين', en: 'Manage Users' },
  'reports:view': { ar: 'عرض التقارير', en: 'View Reports' },
  'kanban:manage': { ar: 'إدارة لوحة كانبان', en: 'Manage Kanban' }
};

export const STATUS_OPTIONS = [
  { value: 'not-started', label: { ar: 'جديدة', en: 'New' }, color: 'bg-gray-100 text-gray-700' },
  { value: 'ongoing', label: { ar: 'قيد التنفيذ', en: 'In Progress' }, color: 'bg-blue-100 text-blue-700' },
  { value: 'awaiting-reply', label: { ar: 'بانتظار رد', en: 'Awaiting Reply' }, color: 'bg-purple-100 text-purple-700' },
  { value: 'completed', label: { ar: 'مكتملة', en: 'Completed' }, color: 'bg-green-100 text-green-700' },
  { value: 'overdue', label: { ar: 'متأخرة', en: 'Overdue' }, color: 'bg-red-100 text-red-700' },
  { value: 'postponed', label: { ar: 'متوقفة', en: 'Paused' }, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'cancelled', label: { ar: 'ملغية', en: 'Cancelled' }, color: 'bg-orange-100 text-orange-700' }
];

// ===== Request-Tracker option lists (merged from Excel "متتبع الطلبات") =====

export const REQUEST_TYPE_OPTIONS = [
  { value: 'chairman',    label: { ar: 'طلب رئيس',  en: 'Chairman Request' } },
  { value: 'deputy',      label: { ar: 'طلب نائب',  en: 'Deputy Request' } },
  { value: 'sector',      label: { ar: 'طلب قطاع',  en: 'Sector Request' } },
  { value: 'internal',    label: { ar: 'طلب داخلي', en: 'Internal Request' } },
  { value: 'external',    label: { ar: 'طلب خارجي', en: 'External Request' } },
  { value: 'task',        label: { ar: 'مهمة',      en: 'Task' } },
  { value: 'transaction', label: { ar: 'معاملة',    en: 'Transaction' } },
  { value: 'letter',      label: { ar: 'خطاب',      en: 'Letter' } },
  { value: 'report',      label: { ar: 'تقرير',     en: 'Report' } },
];

export const ENTITY_CLASSIFICATION_OPTIONS = [
  { value: 'internal', label: { ar: 'داخلي', en: 'Internal' } },
  { value: 'external', label: { ar: 'خارجي', en: 'External' } },
];

export const SECTOR_OPTIONS = [
  { value: 'قطاع المساحة',              label: { ar: 'قطاع المساحة',              en: 'Survey Sector' } },
  { value: 'المركز',                     label: { ar: 'المركز',                     en: 'The Center' } },
  { value: 'قطاع الاستثمار',             label: { ar: 'قطاع الاستثمار',             en: 'Investment Sector' } },
  { value: 'قطاع المعرفة والابتكار',     label: { ar: 'قطاع المعرفة والابتكار',     en: 'Knowledge & Innovation' } },
];

// Operational sub-departments (from Excel column H "الأدارة")
export const OPERATIONAL_DEPARTMENT_OPTIONS = [
  'التصوير والاستشعار عن بعد',
  'الخدمات والمنتجات',
  'الجيودسي',
  'المسح الأرضي',
  'المسح البحري',
];

export const PURPOSE_OPTIONS = [
  { value: 'completion', label: { ar: 'استكمال',      en: 'Completion' } },
  { value: 'follow_up',  label: { ar: 'متابعة',        en: 'Follow-up' } },
  { value: 'feedback',   label: { ar: 'تغذية راجعة',   en: 'Feedback' } },
  { value: 'approval',   label: { ar: 'اعتماد',        en: 'Approval' } },
];

export const DIRECTION_OPTIONS = [
  { value: 'incoming', label: { ar: 'وارد',  en: 'Incoming' } },
  { value: 'outgoing', label: { ar: 'صادر',  en: 'Outgoing' } },
  { value: 'internal', label: { ar: 'داخلي', en: 'Internal' } },
];

export const TRANSACTION_STATUS_OPTIONS = [
  { value: 'new',            label: { ar: 'جديدة',        en: 'New' } },
  { value: 'ongoing',        label: { ar: 'قيد التنفيذ',  en: 'In Progress' } },
  { value: 'awaiting-reply', label: { ar: 'بانتظار رد',   en: 'Awaiting Reply' } },
  { value: 'completed',      label: { ar: 'مكتملة',       en: 'Completed' } },
  { value: 'paused',         label: { ar: 'متوقفة',       en: 'Paused' } },
  { value: 'cancelled',      label: { ar: 'ملغية',        en: 'Cancelled' } },
];

export const DELAY_STATUS_OPTIONS = [
  { value: 'on-time',      label: { ar: 'ضمن الوقت',  en: 'On-Time' },     color: 'bg-emerald-100 text-emerald-700' },
  { value: 'overdue',      label: { ar: 'متأخر',       en: 'Overdue' },     color: 'bg-rose-100 text-rose-700' },
  { value: 'missing-date', label: { ar: 'تاريخ مفقود', en: 'Missing Date' }, color: 'bg-amber-100 text-amber-700' },
];

export const DEPARTMENTS = [
  "إدارة المعرفة والمؤتمرات",
  "إدارة المسؤولية المجتمعية",
  "إدارة المعايير المهنية",
  "البرامج والدراسات العليا",
  "إدارة التأهيل والاعتماد",
  "الإدارة التنفيذية للابتكار والتقنيات الناشئة"
];

export const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export const getStatusByMonth = (month: string): Task['status'] => {
  const monthIndex = MONTHS.indexOf(month);
  
  if (monthIndex < 3) return 'completed'; // Jan, Feb, Mar
  if (monthIndex === 3) return 'ongoing'; // Apr
  return 'not-started'; // May - Dec
};
