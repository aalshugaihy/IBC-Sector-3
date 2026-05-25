# النشر على Render — قطاع الاستثمار وخدمات الأعمال

دليل النشر الاحترافي للتطبيق على منصة [Render](https://render.com). يستخدم
ملف `render.yaml` (Blueprint) لإنشاء **قاعدة بيانات PostgreSQL مدارة + خدمة
ويب موحدة** تشغّل الـ Express API وتقدّم واجهة React المبنية معاً.

---

## الخيار ١: النشر بنقرة واحدة (Blueprint)

ادفع المستودع إلى GitHub أولاً، ثم اتبع:

1. ادخل إلى [dashboard.render.com](https://dashboard.render.com)
2. **New → Blueprint**
3. اربط المستودع `aalshugaihy/ibc-sector-3`
4. Render يقرأ `render.yaml` تلقائياً ويعرض الموارد التي ستُنشأ:
   - قاعدة بيانات `ibc-sector-3-db` (PostgreSQL 16)
   - خدمة ويب `ibc-sector-3` (Node)
5. اضغط **Apply**

عند أول نشر، Render سيبني التطبيق ثم ينشره. تحصل على رابط:
`https://ibc-sector-3.onrender.com`

### المتغيرات الإضافية (اختياري)

كل مفاتيح التكامل قابلة للإدارة **من داخل التطبيق** عبر صفحة
**الإعدادات → مفاتيح التكامل** (للأدمن فقط)، وتُخزَّن مشفّرة بـ AES-256-GCM
في جدول `system_settings`. لا حاجة لإعادة نشر عند تغييرها.

بدلاً من ذلك يمكنك تعريفها كمتغيرات بيئة (الأولوية لقيم قاعدة البيانات):

| المتغير | القيمة المقترحة | متى يكون مطلوباً |
|---------|----------------|------------------|
| `GEMINI_API_KEY` | مفتاحك من [aistudio.google.com](https://aistudio.google.com/apikey) | لتفعيل الذكاء الاصطناعي (أو أضفه من واجهة الإعدادات) |
| `CORS_ORIGIN` | `https://<your-app>.onrender.com` | إذا فصلت الواجهة عن الخادم |
| `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD` | حساب الأدمن الأول | لتهيئة المستخدم تلقائياً عند أول إقلاع |
| `SETTINGS_KEY` | عبارة عشوائية طويلة | لتشفير مفاتيح خزنة الإعدادات (الافتراضي JWT_SECRET) |

---

## الخيار ٢: النشر اليدوي (خطوة بخطوة)

### ١. إنشاء قاعدة البيانات

- **New → PostgreSQL**
- Name: `ibc-sector-3-db`
- Database: `ibc_tasks`
- User: `ibc`
- Region: `Frankfurt` (أقرب للسعودية)
- Plan: `Free` (256 MB) أو `Starter` للإنتاج
- بعد الإنشاء، انسخ **Internal Database URL**

### ٢. إنشاء خدمة الويب

- **New → Web Service**
- اربط مستودع GitHub
- Region: `Frankfurt`
- Branch: `main`
- Runtime: `Node`

**Build Command:**
```bash
npm install --include=dev && cd server && npm install --include=dev && cd .. && npm run build && cd server && npm run build && cp src/schema.sql dist/schema.sql
```

**Start Command:**
```bash
cd server && node dist/index.js
```

**Health Check Path:** `/health`

### ٣. متغيرات البيئة

| المفتاح | القيمة |
|---------|--------|
| `NODE_ENV` | `production` |
| `SERVE_STATIC` | `true` |
| `PGSSL` | `true` |
| `DATABASE_URL` | (الصق Internal Database URL من الخطوة ١) |
| `JWT_SECRET` | استخدم زر **Generate** لتوليد قيمة آمنة |
| `GEMINI_API_KEY` | (اختياري — للذكاء الاصطناعي) |

### ٤. النشر

اضغط **Create Web Service**. خلال ٣–٥ دقائق ستحصل على الرابط العام.

---

## ما بعد النشر

### تسجيل أول مستخدم (admin)

افتح الرابط، اذهب إلى **Register**، وسجّل أول حساب. **أول مستخدم يصبح
admin تلقائياً** ويستطيع دعوة بقية المستخدمين من واجهة إدارة الصلاحيات.

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
