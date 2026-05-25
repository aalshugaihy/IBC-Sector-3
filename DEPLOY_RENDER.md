# النشر على Render — قطاع الاستثمار وخدمات الأعمال

دليل النشر الاحترافي للتطبيق على منصة [Render](https://render.com). يستخدم
ملف `render.yaml` لإنشاء **خدمة ويب موحّدة** تشغّل الـ Express API وتقدّم
واجهة React المبنية معاً. **قاعدة البيانات منفصلة** — اختر أي مزوّد
PostgreSQL يدعم TLS (Render أو Neon أو Supabase).

> ⚠️ **ملاحظة عن خطة Render المجانية:** تسمح بقاعدة بيانات مجانية
> **واحدة فقط** لكل حساب. لذلك أبقينا قاعدة البيانات خارج الـ blueprint
> لتعمل سواء كان لديك قاعدة بيانات سابقة أو لا.

---

## الخطوة ١: تجهيز قاعدة البيانات

اختر **أحد** الخيارات التالية:

### الخيار أ: Render PostgreSQL (إن لم تكن لديك قاعدة مجانية أخرى)

١. **New → PostgreSQL**
٢. الاسم: `ibc-sector-3-db` — Database: `ibc_tasks` — User: `ibc`
٣. المنطقة: `Frankfurt` (أقرب للسعودية)
٤. الخطة: `Free`
٥. بعد الإنشاء، انسخ **Internal Database URL**

### الخيار ب: Neon (موصى به إن كانت قاعدتك المجانية مشغولة)

١. أنشئ مشروعاً مجانياً على [neon.tech](https://neon.tech)
٢. Region: أقرب منطقة (Frankfurt مثلاً)
٣. انسخ **Connection string** (يجب أن يحتوي `sslmode=require`)

### الخيار ج: Supabase

١. أنشئ مشروعاً مجانياً على [supabase.com](https://supabase.com)
٢. Project Settings → Database → **Connection string (URI)**
٣. استبدل `[YOUR-PASSWORD]` بكلمة المرور التي وضعتها

### الخيار د: استخدام قاعدة بيانات Render مجانية موجودة

ادخل قاعدتك الحالية → انسخ **Internal Database URL**. نفس القاعدة تستطيع
استضافة جداول التطبيقات المختلفة بدون تعارض (التطبيق ينشئ جداوله تلقائياً
بمسمياتها الخاصة).

---

## الخطوة ٢: نشر التطبيق (Blueprint)

١. ادخل إلى [dashboard.render.com](https://dashboard.render.com)
٢. **New → Blueprint**
٣. اربط المستودع `aalshugaihy/ibc-sector-3`
٤. Render يقرأ `render.yaml` ويعرض **خدمة الويب** فقط (`ibc-sector-3`)
٥. اضغط **Apply**

عند طلب القيم اليدوية (`sync: false`)، الصق:

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | (الصق connection string من الخطوة ١) |
| `CORS_ORIGIN` | اتركه فارغاً (الواجهة والخادم على نفس الـ origin) |
| `GEMINI_API_KEY` | اتركه فارغاً (أضفه لاحقاً من واجهة الإعدادات) |
| `BOOTSTRAP_ADMIN_EMAIL` | (اختياري) بريدك للحساب الأول |
| `BOOTSTRAP_ADMIN_PASSWORD` | (اختياري) كلمة مرور قوية مؤقتة |

اضغط **Apply** — Render سيبني التطبيق وينشره خلال ٣-٥ دقائق.

### الرابط النهائي

`https://ibc-sector-3.onrender.com` — قد يختلف الاسم؛ الرابط الفعلي يظهر
في لوحة الخدمة.

### المتغيرات الإضافية

| المتغير | القيمة المقترحة | متى يكون مطلوباً |
|---------|----------------|------------------|
| `GEMINI_API_KEY` | مفتاحك من [aistudio.google.com](https://aistudio.google.com/apikey) | لتفعيل الذكاء الاصطناعي (أو أضفه من واجهة الإعدادات) |
| `CORS_ORIGIN` | `https://<your-app>.onrender.com` | إذا فصلت الواجهة عن الخادم |
| `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD` | حساب الأدمن الأول | لتهيئة المستخدم تلقائياً عند أول إقلاع |
| `SETTINGS_KEY` | عبارة عشوائية طويلة | لتشفير مفاتيح خزنة الإعدادات (الافتراضي JWT_SECRET) |

---

## الخطوة ٣: ما بعد النشر

### تسجيل أول مستخدم (admin)

افتح الرابط → **Register** → أوّل مستخدم يصبح admin تلقائياً.

(أو إذا ضبطت `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD`، فقط
سجّل دخول بهذه البيانات.)

### إضافة مفتاح Gemini (للذكاء الاصطناعي)

١. سجّل دخول كأدمن
٢. **الإعدادات → مفاتيح التكامل → Gemini API key**
٣. الصق المفتاح → **حفظ** → اضغط **اختبار** للتحقق

المفتاح يُخزَّن **مشفّراً** (AES-256-GCM) في قاعدة البيانات، يبقى عبر
إعادات النشر، ولا يظهر في أي ملف.

---

## النشر اليدوي (بديل عن Blueprint)

إذا فضّلت إنشاء الخدمة يدوياً:

١. **New → Web Service** → اربط المستودع
٢. Region: `Frankfurt` — Branch: `main` — Runtime: `Node`
٣. **Build Command:**
   ```bash
   npm install --include=dev && cd server && npm install --include=dev && cd .. && npm run build && cd server && npm run build && cp src/schema.sql dist/schema.sql
   ```
٤. **Start Command:** `cd server && node dist/index.js`
٥. **Health Check Path:** `/health`
٦. أضف نفس المتغيرات من جدول الخطوة ٢

---

## ما بعد النشر — مراقبة وتشغيل

### مراقبة الأداء

- **Logs:** Live logs من لوحة Render لكل خدمة
- **Metrics:** CPU / Memory / Bandwidth في تبويب Metrics
- **Health Check:** Render يستدعي `/health` كل ٣٠ث تلقائياً

### الترقيات والتحديثات

كل `git push` على فرع `main` يطلق نشراً تلقائياً (`autoDeploy: true`).
لتعطيل ذلك، عدّل `autoDeploy: false` في `render.yaml`.

---

## ملاحظات هامة

### الخطة المجانية (Free Tier)

- **الخدمة:** تنام بعد ١٥ دقيقة عدم استخدام؛ أول طلب بعد النوم يستغرق
  ~٣٠ث لإيقاظها. للإنتاج رفّع إلى Starter (`$7/شهر`).
- **قاعدة البيانات:** تنتهي صلاحيتها بعد ٩٠ يوماً في الخطة المجانية.
  للاستمرار رفّع إلى Starter (`$7/شهر`).

### النسخ الاحتياطي

من لوحة قاعدة البيانات → **Backups**. الخطط المدفوعة توفّر نسخاً يومية
تلقائية لمدة ٧ أيام. للنسخ اليدوي:

```bash
PGSSLMODE=require pg_dump "$DATABASE_URL" > backup-$(date +%F).sql
```

### استعادة النسخة الاحتياطية

```bash
PGSSLMODE=require psql "$DATABASE_URL" < backup-2026-01-15.sql
```

### المخطط (Schema)

الخادم يشغّل `schema.sql` تلقائياً عند كل بدء تشغيل. كل التغييرات في
المخطط يجب أن تكون **idempotent** (`CREATE … IF NOT EXISTS`،
`ALTER TABLE … ADD COLUMN IF NOT EXISTS`). لا توجد ملفات هجرة منفصلة.

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| `connection terminated unexpectedly` | تأكد أن `PGSSL=true` في متغيرات البيئة |
| `ECONNREFUSED` | استخدم **Internal Database URL** وليس External (الخدمة وقاعدة البيانات في نفس المنطقة) |
| الواجهة لا تظهر | تأكد من `SERVE_STATIC=true` ومن نجاح خطوة `npm run build` في build logs |
| `Too many requests` | الحدود مضبوطة على ٦٠٠ طلب/١٥ دقيقة عالمياً و٢٠ طلب/١٥ دقيقة لـ auth |
| المحادثة بالذكاء الاصطناعي معطّلة | أضف `GEMINI_API_KEY` من Google AI Studio |

---

## النشر عبر Docker (خيار بديل)

Render يدعم Docker أيضاً. لاستخدام `Dockerfile` بدلاً من Node runtime:

١. غيّر `runtime: node` إلى `runtime: docker` في `render.yaml`  
٢. أضف `dockerfilePath: ./Dockerfile`  
٣. احذف `buildCommand` و `startCommand`

ولكن الإعداد الحالي (Node native) أسرع وأخف على Render.
