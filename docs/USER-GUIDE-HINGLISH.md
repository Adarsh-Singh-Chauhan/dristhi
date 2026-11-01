# DRISHTI — User Guide (Hinglish)

## 1. Do alag login

- **User login:** Main workspace par Sign in → Create an account. Is account se message analysis, personal report history, alerts, trusted contacts aur SOS request use hote hain.
- **Superadmin login:** Alag page /admin.html. Normal user account yahan login kar sakta hai, lekin Superadmin role ke bina control room nahi khulega. First Superadmin ko registered account se one-time bootstrap script promote karta hai.

## 2. User workspace kaise use karein

1. Main site open karein.
2. Public post ya aisa message paste karein jise review karne ka aapko adhikar hai.
3. Source platform select karein aur Analyse karein.
4. Matched signals aur recommended verification steps read karein.
5. Result ko sach/jhooth ka final verdict na samjhein. Current detector explainable rule-based baseline hai.
6. Account login ke baad report history save ho sakti hai; apni reports ko review/delete kar sakte hain.

## 3. Alerts aur SOS

1. /alerts.html open karke User account se sign in karein.
2. Zarurat ho to trusted contacts add karein.
3. SOS form mein incident title, details aur optional source URL dalein.
4. GPS share karna optional hai. Checkbox tick karne par submit ke waqt browser location permission poochega.
5. GPS snapshot sirf us specific SOS ke saath save hota hai aur Superadmin review queue mein visible hota hai.
6. Location share nahi karni ho to checkbox untick karke normal SOS submit karein.

**Important:** DRISHTI SOS internal review request hai. Ye SMS, WhatsApp, police, ambulance ya emergency service ko automatically contact nahi karta.

## 4. Superadmin setup aur login

1. Intended admin email se pehle regular user registration karein.
2. Supabase Free PostgreSQL project create/configure karne ke liye docs/SUPABASE-FREE-SETUP.md follow karein.
3. SQL migration supabase/migrations/202611010001_drishti_core_admin_alerts_sos.sql run karein.
4. Private DATABASE_URL ko apne local PowerShell environment mein set karke scripts/promote_first_admin.py run karein.
5. /admin.html par wahi email/password use karke sign in karein.

Superadmin credential, JWT secret aur database password GitHub, README, screenshots ya public chat mein kabhi save na karein. Bootstrap script ek hi Superadmin allow karta hai.

## 5. Superadmin control room

- **SOS queue:** request dekhna, status set karna aur review notes record karna.
- **Global signal map:** user-consented SOS GPS snapshots aur analyst-entered IOC coordinates ka equirectangular overview.
- **Network intelligence:** authorised defensive investigation ke public IP/domain indicators add karna, severity assign karna aur review status update karna.
- **Users:** registered account ID/email/role/created date ka overview. Password hashes UI/API se expose nahi hote.
- **Audit trail:** recent Superadmin actions aur timestamps.
- **In-app notices:** users ko app ke andar notification publish karna. External delivery enabled nahi hai.

## 6. IP location vs GPS — zaroor samjhein

- Public IP geolocation sirf approximate country/region/city de sakta hai. VPN, proxy, mobile carrier aur ISP routing ke karan result galat ya broad ho sakta hai.
- IOC map par location Superadmin manually evidence/GeoIP source ke basis par enter karta hai. System IP se kisi vyakti ki identity ya exact ghar ka address nikalne ka feature nahi deta.
- Website visitors ka IP automatically capture nahi hota.
- User ki precise GPS location sirf user ke explicit checkbox + device permission ke baad ek SOS snapshot ke roop mein store hoti hai. Background/live tracking nahi hai.

## 7. Mobile app install

DRISHTI installable PWA hai:
- Android Chrome: **Install app** ya menu → **Install app / Add to Home screen**.
- iPhone Safari: Share → **Add to Home Screen**.
- App shell offline open ho sakta hai. API, login aur fresh analysis ke liye internet/backend chahiye.

Ye PWA hai; native Play Store APK/IPA nahi.

## 8. Live environment limitation

Agar /health mein storage: unconfigured aa raha hai, anonymous analysis work kar sakta hai lekin registration, saved history, Alerts/SOS, Superadmin aur IOC persistence disabled rahenge. PostgreSQL DATABASE_URL add karke Vercel redeploy karna hoga. Secrets ko sirf Vercel Environment Variables aur private local prompt mein rakhein.

## 9. Human review

DRISHTI ka review-priority score truth probability nahi hai. Public content ko evidence, original source, date, context aur independent references se verify karein. Political criticism, journalism, satire aur legitimate debate ko viewpoint ke basis par misinformation label nahi karna chahiye.
