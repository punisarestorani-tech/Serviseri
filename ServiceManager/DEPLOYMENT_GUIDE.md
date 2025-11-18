# 🚀 Tehniko System - Replit Autoscale Deployment Guide

## 📋 Pregled

Ovaj vodič pokazuje kako da deploy-uješ Tehniko System na Replit Autoscale i povežeš Android aplikaciju sa backend-om.

---

## 💰 Cena (Procena)

Za 5-20 tehničara sa normalnim korišćenjem:
- **Sa Replit Core pretplatom** ($20/mesec sa $25 kredita): **~$0-1/mesec** (praktično besplatno!)
- **Bez Core pretplate**: **~$1-2/mesec**

---

## 🎯 Korak 1: Deploy na Replit Autoscale

### 1.1 Otvori Replit Projekat

1. Otvori ovaj projekat na Replit.com
2. Proveri da li su sve environment varijable postavljene (vidi Korak 2)

### 1.2 Postavi Environment Varijable

Klikni na **Secrets** (ključić ikona u levom sidebar-u) i proveri:

```bash
✅ DATABASE_URL           # Supabase database URL (već postavljen)
✅ SESSION_SECRET         # Tajni ključ za sesije (već postavljen)
✅ VITE_SUPABASE_URL      # Supabase URL (već postavljen)
✅ VITE_SUPABASE_ANON_KEY # Supabase anon key (već postavljen)
```

**NAPOMENA:** Ne dodavaj `VITE_API_URL` ovde - to ide samo u Android app!

### 1.3 Deploy Aplikaciju

1. **Klikni na "Deploy" dugme** u gornjem desnom uglu
2. **Izaberi "Autoscale"** kao deployment tip
3. **Potvrdi deployment settings**:
   - Build command: `npm run build`
   - Run command: `npm run start`
   - Port: `5000`
4. **Klikni "Deploy"**
5. **Sačekaj 3-5 minuta** da build završi

### 1.4 Snimi Deployment URL

Kada deployment završi, videćeš URL:

```
https://tvoj-replit-username.repl.co
```

**Ovu URL SAČUVAJ** - trebaće ti u Koraku 2!

---

## 📱 Korak 2: Konfiguriši Android Aplikaciju

### 2.1 Ažuriraj .env Fajl

Otvori `.env` fajl u Replit projektu i dodaj svoju deployment URL:

```bash
# Ostale varijable ostaju iste...
VITE_SUPABASE_URL=https://gzlqiaphncnolhyefdxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Dodaj ovu liniju sa TVOJOM deployment URL:
VITE_API_URL=https://tvoj-replit-username.repl.co
```

**VAŽNO:** Zameni `tvoj-replit-username.repl.co` sa stvarnim URL-om iz Koraka 1.4!

### 2.2 Rebuild Aplikaciju

U Replit terminalu:

```bash
npm run build
npx cap sync android
```

### 2.3 Preuzmi Ažurirani Projekat

1. Klikni **⋮ (3 tačke)** gore desno
2. Klikni **"Download as ZIP"**
3. Sačuvaj kao `tehniko-deployed.zip` (~36 MB)

---

## 💻 Korak 3: Build Android App

### 3.1 Otvori U Android Studio

1. Raspakuj `tehniko-deployed.zip`
2. **Zatvori** sve trenutne projekte u Android Studio-u
3. **File → Open**
4. Otvori **SAMO `android/` folder** iz raspakovanog projekta
5. Sačekaj Gradle sync (~2-3 minuta)

### 3.2 Test Na Emulatoru

1. Klikni **▶ Play dugme**
2. Izaberi **Pixel 5 API 30** emulator
3. Aplikacija će se pokrenuti i **povezati sa backend-om na Replit-u**! 🎉

### 3.3 Proveri Da Radi

- Pokušaj da se uloguješ (username: `lolo`, password: `lolo`)
- Proveri da li se učitavaju klijenti
- Dodaj test klijenta
- Proveri da li slike rade (Supabase Storage)

Ako sve radi - **ČESTITAMO!** Backend je na Replit-u, aplikacija radi! 🎊

---

## 📦 Korak 4: Build Signed APK Za Play Store

### 4.1 Kreiraj Keystore

U Android Studio terminalu:

```bash
cd android/app
keytool -genkey -v -keystore tehniko-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias tehniko
```

**VAŽNO:** Sačuvaj lozinku koju uneseš - biće ti potrebna!

### 4.2 Konfiguriši Signing

1. Otvori `android/app/build.gradle`
2. Dodaj pre `android {`:

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

3. Dodaj u `android { }` blok:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

4. Kreiraj `android/key.properties`:

```properties
storePassword=tvoja_lozinka
keyPassword=tvoja_lozinka
keyAlias=tehniko
storeFile=app/tehniko-release-key.jks
```

### 4.3 Build AAB Bundle

U Android Studio-u:

1. **Build → Generate Signed Bundle / APK**
2. Izaberi **Android App Bundle**
3. Izaberi keystore fajl
4. Unesi lozinke
5. Izaberi **release** build variant
6. **Build**

AAB fajl će biti u: `android/app/release/app-release.aab`

---

## 🎨 Korak 5: Promeni Ikonu (Opciono)

Ako želiš custom ikonu za Tehniko:

1. Koristi https://icon.kitchen/
2. Upload sliku ili kreiraj novu (preporučujem plavu/teal sa wrench simbolom)
3. Download Android icon pack
4. Raspakuj u `android/app/src/main/res/`
5. Rebuild aplikaciju

---

## 📤 Korak 6: Upload Na Google Play Store

### 6.1 Kreiraj Google Play Developer Nalog

1. Idi na https://play.google.com/console
2. Registruj se ($25 jednokratna naknada)
3. Popuni informacije

### 6.2 Kreiraj Novu Aplikaciju

1. **Create app**
2. Ime: **Tehniko System**
3. Jezik: **Srpski**
4. App ili Game: **App**
5. Besplatna ili Plaćena: **Besplatna**

### 6.3 Popuni Store Listing

**Kratki opis** (80 karaktera):
```
Sistem za upravljanje servisima - klijenti, uređaji, zadaci, izveštaji
```

**Puni opis** (4000 karaktera):
```
Tehniko System je profesionalna mobilna aplikacija za tehničare koji održavaju opremu za hotele, restorane i kompanije.

🔧 FUNKCIONALNOSTI:
• Upravljanje klijentima sa kontakt informacijama
• Evidencija uređaja (klima, frižideri, peći, itd)
• Zadaci sa statusom i prioritetom
• Izveštaji sa slikama i delovima
• Inventar rezervnih delova
• Podrška za ponavljajuće zadatke
• Istorija servisa po uređaju

📱 DVOJ JEZIK:
• Engleski (English)
• Srpski (Српски)

💼 ZA TEHNIČARE:
Tehniko System je dizajniran za field tehničare sa fokusom na brzinu i produktivnost.

🔒 SIGURNO:
• Autentifikacija korisnika
• Podaci čuvani u cloud-u (Supabase)
• Backup i sync automatski
```

**Screenshots:**
- Napravi 4-8 screenshot-a aplikacije (login, clients, appliances, tasks)
- Dimenzije: 1080x1920 (portrait)

**Ikona:**
- 512x512 PNG
- Bez transparencije

**Feature Graphic:**
- 1024x500 PNG
- Tehniko System logo sa tekstom

### 6.4 Upload AAB

1. Idi na **Production**
2. **Create new release**
3. Upload `app-release.aab`
4. Unesi release notes
5. **Review release**
6. **Start rollout to Production**

### 6.5 Sačekaj Review

Google će pregledati aplikaciju za 1-3 dana. Dobićeš email kada bude odobrena!

---

## 🔄 Ažuriranje Aplikacije (Buduće Verzije)

Kada trebaš da ažuriraš aplikaciju:

### 1. Izmene na Replit-u

```bash
# Napravi izmene u kodu
npm run build
npx cap sync android
```

### 2. Re-deploy Backend

Ako si menjao backend:
1. Idi na Replit Deploy page
2. Klikni **"Redeploy"**

### 3. Nova Verzija Android Aplikacije

1. Otvori `android/app/build.gradle`
2. Ažuriraj:
```gradle
versionCode 2  // Uvećaj za 1
versionName "1.1"  // Nova verzija
```
3. Build novi AAB
4. Upload na Play Store

---

## 🐛 Troubleshooting

### Problem: Android app ne može da se poveže sa backend-om

**Rešenje:**
1. Proveri `VITE_API_URL` u `.env` fajlu
2. Proveri da deployment URL radi (otvori u browser-u)
3. Rebuild: `npm run build && npx cap sync android`
4. Download novi projekat i otvori u Android Studio

### Problem: "No matching variant" greška

**Rešenje:**
Ovaj problem je već rešen! Projekat ima:
- ✅ Debug varijanta u capacitor-android
- ✅ Java 17 compatibility u app/build.gradle

### Problem: Deployment failed na Replit-u

**Rešenje:**
1. Proveri da li su sve environment varijable postavljene
2. Proveri build log za greške
3. Testiraj lokalno: `npm run build && npm run start`

### Problem: Visoki troškovi na Replit-u

**Rešenje:**
1. Proveri Usage Dashboard na Replit-u
2. Set spending limit ako treba
3. Za aplikaciju tvoje veličine, trošak treba biti $1-2/mesec

---

## 📊 Monitoring

### Replit Dashboard

1. Idi na https://replit.com/deployments
2. Klikni na tvoju aplikaciju
3. Vidi:
   - **Logs** - Backend logovi
   - **Usage** - CPU/RAM/Request metriku
   - **Billing** - Troškovi

### Supabase Dashboard

1. Idi na https://supabase.com/dashboard
2. Izaberi tvoj projekat
3. Vidi:
   - **Database** - SQL queries i tabele
   - **Storage** - Slike (appliance photos, reports)
   - **API** - Request statistika

---

## ✅ Checklist Pre Produkcije

- [ ] Backend deploy-ovan na Replit Autoscale
- [ ] Deployment URL radi u browser-u
- [ ] `VITE_API_URL` postavljen u `.env` fajlu
- [ ] Android aplikacija build-ovana i sync-ovana
- [ ] Testiran na emulatoru - sve funkcionise
- [ ] Login radi
- [ ] Klijenti se učitavaju
- [ ] Slike se upload-uju i prikazuju
- [ ] Signed APK/AAB kreiran
- [ ] Google Play Developer nalog registrovan
- [ ] Store listing popunjen
- [ ] Screenshot-i pripremljeni
- [ ] Aplikacija upload-ovana na Play Store
- [ ] Production user nalog kreiran (ne koristi "lolo"!)

---

## 🎉 Gotovo!

Ako si pratio sve korake, tvoja Tehniko System aplikacija je:

✅ **Live na Replit-u** - Backend dostupan 24/7  
✅ **Android aplikacija povezana** - Komunicira sa backend-om  
✅ **Spremna za Play Store** - Signed AAB build  
✅ **Production ready** - Sve funkcionise!

**Čestitamo!** 🎊

---

## 📞 Support

Ako imaš problema, proveri:
1. Ovu dokumentaciju
2. Replit logs (https://replit.com/deployments)
3. Android Studio logcat
4. Supabase dashboard

---

**Poslednje ažurirano:** 31. Oktobar 2025  
**Verzija dokumentacije:** 1.0  
**Tehniko System Verzija:** 1.0
