rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    /* 🔒 إغلاق كامل مجلد MMG */
    match /MMG/{document=**} {
      allow read, write, update, delete: if false;
    }
    
    
    // الأقسام / الألعاب: قراءة للجميع، كتابة للأدمن فقط
    match /games/{gameId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // الإعلانات
    match /accounts/{accId} {
      allow read: if true;

      // إنشاء إعلان جديد: يجب أن يكون المالك هو المستخدم نفسه، والحالة pending فقط
      allow create: if request.auth != null
        && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.status == 'pending'
        && !('reviewedAt' in request.resource.data)
        && !('reviewedBy' in request.resource.data);

      // تعديل: أدمن يمكنه كل شيء، المالك يمكنه التعديل بدون تغيير الحالة
      allow update: if request.auth != null && (
        request.auth.token.admin == true ||
        (
          request.resource.data.ownerId == request.auth.uid &&
          request.resource.data.ownerId == resource.data.ownerId &&
          request.resource.data.status == resource.data.status
        )
      );

      // حذف: الأدمن أو مالك الإعلان
      allow delete: if request.auth != null && (
        request.auth.token.admin == true ||
        request.auth.uid == resource.data.ownerId
      );
    }

    // بيانات حساسة لكل إعلان (مخفية عن العملاء)
    match /accountPrivate/{accId} {
      // إنشاء مسموح للمالك فقط، القراءة والتعديل والحذف للأدمن فقط
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow read, update: if request.auth != null && request.auth.token.admin == true;
      allow delete: if request.auth != null && (
        request.auth.token.admin == true ||
        request.auth.uid == resource.data.ownerId
      );
    }

    // طلبات شراء الحسابات
    match /accountPurchases/{purchaseId} {
      allow read: if request.auth != null && (
        request.auth.token.admin == true ||
        request.auth.uid == resource.data.buyerId
      );

      allow create: if request.auth != null && request.resource.data.buyerId == request.auth.uid;
      allow update, delete: if request.auth != null && request.auth.token.admin == true;
    }

    // محافظ المستخدمين
    match /wallets/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // الملفات الشخصية
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // طرق الدفع (محافظ/بنوك) لطلبات الشحن
    match /paymentMethods/{methodId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // طلبات الشحن
    match /topups/{topupId} {
      allow read: if request.auth != null && (
        request.auth.token.admin == true ||
        request.auth.uid == resource.data.ownerId ||
        request.auth.uid == request.resource.data.ownerId
      );

      allow create: if request.auth != null &&
        request.resource.data.ownerId == request.auth.uid &&
        request.resource.data.status == 'pending';

      // التعديل: الأدمن فقط يغير الحالة، المالك يعدل طلبه دون تغيير الحالة
      allow update: if request.auth != null && (
        request.auth.token.admin == true ||
        (
          request.auth.uid == resource.data.ownerId &&
          request.resource.data.status == resource.data.status
        )
      );

      allow delete: if request.auth != null && (
        request.auth.token.admin == true ||
        request.auth.uid == resource.data.ownerId
      );
          }
  


    /* 👤 المستخدمون */
    match /users/{userId} {

      // القراءة الفردية لصاحب الوثيقة فقط، ومنع list/الاستعلامات
      allow get: if request.auth != null && request.auth.uid == userId;
      allow list: if false;

      // إنشاء مستند المستخدم أول مرة فقط بهذه الشروط + منع webuid من الإرسال
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.data.useruid == userId
                    && request.resource.data.level is string
                    && request.resource.data.level == "زبون"
                    && !request.resource.data.keys().hasAny(['webuid','referredBy','referredByWebuid','referralCount','referralCredits','referralInviteeUsed','referredAt','referralUpdatedAt']);

      // تحديث لصاحب الوثيقة + منع تعديل الحقول الثابتة (ومنها webuid)
      allow update: if request.auth != null
                    && request.auth.uid == userId
                    && !request.resource.data.diff(resource.data)
                         .changedKeys()
                         .hasAny(['authkey','balance','level','totalspent','username','useruid','webuid','referredBy','referredByWebuid','referralCount','referralCredits','referralInviteeUsed','referredAt','referralUpdatedAt'])
                    // phone مسموح فقط كإضافة أولى
                    && (
                         !request.resource.data.diff(resource.data).changedKeys().hasAny(['phone'])
                         || !resource.data.keys().hasAny(['phone'])
                       );

      allow delete: if false;

      /* 🔑 مفاتيح المستخدم الفرعية: users/{userId}/keys/{docId} */
      match /keys/{docId} {

        // 🧷 أسرار دائمة: إنشاء فقط باسم secrets
        allow create: if request.auth != null
                      && request.auth.uid == userId
                      && docId == "secrets";

        // 🕒 جلسة المستخدم: إنشاء/تحديث فقط باسم session (لا قراءة/حذف)
        allow update, create: if request.auth != null
                              && request.auth.uid == userId
                              && docId == "session";

        // لا قراءة ولا حذف لأي مستند داخل keys
        allow read: if false;
        allow delete: if false;
      }

      /* 💳 معاملات المستخدم */
      match /transactions/{docId} {
        allow create, get: if request.auth != null && request.auth.uid == userId;
        allow list, update, delete: if false;
      }
    }
    
    match /userTransactions/{userId} {
      allow get: if request.auth != null && request.auth.uid == userId;
      allow list, create, update, delete: if false;
    }

    match /depositRequests/{requestId} {
      allow get, list: if request.auth != null
                        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
                     && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }

    // ✅ تخزين الإيداع الجديد: مستند لكل مستخدم يحتوي Map للطلبات داخل byCode
    match /userDepositRequests/{userId} {
      // المالك يقرأ فقط مستنده، والأدمن يمكنه list عند الحاجة
      allow get: if request.auth != null && request.auth.uid == userId;
      allow list: if request.auth != null && request.auth.token.admin == true;
      // منع أي كتابة من طرف العميل (الكتابة تتم عبر الباكند/التيليجرام)
      allow create, update, delete: if false;
    }

    /* 🛒 الطلبات */
    match /orders/{orderId} {
      // السماح بقراءة وثيقة الطلب نفسها (get/list/queries) للمالك فقط
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;

      // لا إنشاء/تحديث/حذف من طرف العميل
      allow create, update, delete: if false;

      /* ✅ السماح فقط بمجلد public داخل الطلب للمالك */
      match /public/{docId} {
        allow read: if request.auth != null
                    && get(/databases/$(database)/documents/orders/$(orderId))
                         .data.userId == request.auth.uid;
        allow list, write, update, delete: if false;
      }

      /* 🔐 private داخل الطلب — مغلق صراحةً */
      match /private/{docId} {
        allow read, write, update, delete: if false;
      }

      /* 🚫 أي شيء آخر تحت الطلب — مغلق */
      match /{document=**} {
        allow read, write, update, delete: if false;
      }
    }

    /* 🔓 public علوي مربوط بملكية الطلب */
    match /public/{docId} {
      allow read: if request.auth != null
                  && get(/databases/$(database)/documents/orders/$(docId))
                       .data.userId == request.auth.uid;
      allow list, write, update, delete: if false;
    }

    /* 🔐 private علوي — مغلق بالكامل */
    match /private/{docId} {
      allow read, write, update, delete: if false;
    }

    /* 💬 التعليقات */
    match /comments/{commentId} {
      allow get, list: if true;
      allow write: if false;
      allow update, delete: if false;
    }

    /* 🗺️ الدول + الطرق (للإيداع) */
    match /depositCountries/{countryId} {
      allow get, list: if true;
      allow create, update, delete: if false;

      match /methods/{methodId} {
        allow get, list: if true;
        allow create, update, delete: if false;
      }
    }
    
    /* 💵 اسعار الصرف */
    match /config/currency {
      allow get, list: if true;
      allow write, update, delete: if false;
    }

    /* طرق الدفع الموحدة (config/paymentMethods) */
    match /config/paymentMethods {
      allow read: if true;
      allow create, update, delete: if request.auth != null && request.auth.token.admin == true;
    }

    /* 🧾 states — قراءة فقط */
    match /states/{docId} {
      allow get, list: if true;
      allow write, update, delete: if false;
    }

    /* 💵 price — قراءة فقط */
    match /price/{docId} {
      allow get, list: if true;
      allow write, update, delete: if false;
    }

    /* مستندات حالة ألعاب */
    match /pubg/state {
      allow read: if true;
    }
    match /freefire/state {
      allow read: if true;
    }
    match /freefireN/state {
      allow read: if true;
    }
    match /bloodstrike/state {
      allow read: if true;
    }

    /* topup — قراءة فقط */
    match /topup/{docId} {
      allow get: if true;
      allow create, update, delete: if false;
    }

    /* 🗂️ جلسات الإدمن في العميل — مغلقة */
    match /admin_edaa_sessions/{docId} {
      allow read, write, update, delete: if false;
    }

    /* 🏦 Countries للسحب — قراءة بشرط الفعالية */
    match /withdrawCountries/{countryId} {
      allow get, list: if resource.data.active == true;
      allow create, update, delete: if false;

      match /methods/{methodId} {
        allow get, list: if
          get(/databases/$(database)/documents/withdrawCountries/$(countryId)).data.active == true &&
          resource.data.active == true;
        allow create, update, delete: if false;
      }
    }
    
    match /config/states {
      allow get: if true; // read فقط
      // الكتابة محصورة على الأدمن (custom claims)
      allow create, update, delete: if request.auth != null && request.auth.token.admin == true;
    }

  }
}
    
