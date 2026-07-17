const CACHE_NAME = 'or-hatfila-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// התקנה ראשונית של ה-Service Worker ושמירת הקבצים הבסיסיים
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// הפעלה וניקוי אוטומטי של זיכרון מטמון (Cache) ישן כדי למנוע התנגשויות
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// אסטרטגיה חכמה (Network-First): קודם כל מנסים להביא את הקוד הכי עדכני מהשרת/גיטהאב.
// אם יש אינטרנט - הדף מתעדכן מיד ללא שיהוי. אם אין אינטרנט - שולפים מהמטמון לטובת עבודה באופליין.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // אם הקריאה לשרת הצליחה, נשמור עותק מעודכן בתוך ה-Cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // אם אין חיבור לאינטרנט בכלל, נשלוף את מה ששמור בזיכרון של המכשיר
        return caches.match(e.request);
      })
  );
});
