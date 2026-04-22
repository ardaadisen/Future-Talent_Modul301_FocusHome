# 🏗️ FocusHome Technical & Product Specification

**Sürüm:** 2.1 (AI + API Entegrasyonlu)  
**Kod Adı:** Project Hearth  
**Hedef:** Haziran başlamadan önce mağazaya gönderilebilir MVP  
**Mimari Strateji:** Scalable-Local + Secure AI API Layer  
**Ürün Tipi:** AI destekli odak planlama, zaman yönetimi ve oyunlaştırılmış ilerleme uygulaması

---

## 1. Ürün Stratejisi ve Psikolojik Model

### 1.1. Core Loop

FocusHome’un temel döngüsü:

```text
Belirle (Trigger) -> Odaklan (Action) -> Kazan (Variable Reward) -> İnşa Et (Investment)
```

Kullanıcı bir görev belirler, göreve odaklanır, seans sonunda ödül kazanır ve bu ödülü sanal evini inşa etmek için kullanır.

### 1.2. AI ile Genişletilmiş Core Loop

AI entegrasyonu ile core loop şu hale gelir:

```text
Doğal Dilde Plan Yaz -> AI Göreve Dönüştürür -> Kullanıcı Onaylar -> Calendar’a Ekler -> Odaklanır -> Ödül Kazanır -> Ev İnşa Eder
```

Bu yapı, FocusHome’u sadece görev listesi veya timer uygulaması olmaktan çıkarıp, akıllı bir focus planning assistant haline getirir.

### 1.3. Psikolojik Çapa

- **Loss Aversion:** Kullanıcı odaklanma seansını bozarsa o seans için kazanacağı materyalleri kaybeder.
- **Visual Progress:** Kullanıcı tamamladığı görevlerin sonucunu ev inşasında görür.
- **Commitment Device:** Google Calendar’a eklenen görev, kullanıcının göreve zihinsel olarak daha fazla bağlanmasını sağlar.

---

## 2. Ürün Kapsamı

### 2.1. MVP’de Olacaklar

- Manuel görev oluşturma
- AI ile doğal dilden görev oluşturma
- AI çıktısını onaylama/düzenleme ekranı
- Google Calendar Template URL üretme
- Timer/focus session
- Görev tamamlama ve ödül kazanma
- XP, seviye ve envanter sistemi
- 5x5 basit grid üzerinde ev inşa etme
- Yerel veri saklama
- Secure backend/serverless API layer

### 2.2. MVP’de Olmayacaklar

- Login/sign-up
- Google OAuth
- Takvim okuma veya otomatik takvime yazma
- Cloud sync
- Sosyal özellikler
- In-app purchase
- Gelişmiş animasyonlar
- Gelişmiş anti-cheat
- Phone call detection
- Tablet özel arayüzü

---

## 3. Bilgi Mimarisi ve Veri Modelleri

### 3.1. TaskObject

```json
{
  "id": "uuid_v4",
  "title": "String (max 50 char)",
  "preset_duration": "Int (15, 30, 45, 60)",
  "actual_duration_seconds": "Int",
  "difficulty_level": "Enum (EASY, MEDIUM, HARD)",
  "status": "Enum (PENDING, ACTIVE, COMPLETED, FAILED, ABANDONED)",
  "created_at": "Timestamp",
  "completed_at": "Timestamp?",
  "source": "Enum (MANUAL, AI)",
  "calendar_url": "String?",
  "scheduled_start_at": "Timestamp?",
  "scheduled_end_at": "Timestamp?",
  "description": "String?"
}
```

### 3.2. InventoryObject

```json
{
  "total_xp": "Int",
  "level": "Int (Formula: floor(sqrt(xp/100)))",
  "resources": {
    "bricks": "Int",
    "glass": "Int",
    "roof_tiles": "Int"
  },
  "unlocked_assets": "List<AssetID>"
}
```

### 3.3. GridMapObject

```json
{
  "grid_id": "main_home",
  "size": 5,
  "cells": [
    {
      "x": 0,
      "y": 0,
      "asset_id": "wall_v1",
      "rotation": 0,
      "placed_at": "Timestamp"
    }
  ]
}
```

### 3.4. AIParsedTaskObject

Bu model, AI’dan dönen ham görev önerisini temsil eder. Kullanıcı onaylamadan kalıcı TaskObject’e çevrilmemelidir.

```json
{
  "title": "String",
  "startDateTime": "ISO-8601 DateTime",
  "endDateTime": "ISO-8601 DateTime",
  "durationMinutes": "Int",
  "difficulty": "Enum (EASY, MEDIUM, HARD)",
  "description": "String",
  "confidence": "Number?"
}
```

---

## 4. Fonksiyonel Detaylar

### 4.1. Manual Task Engine

Kullanıcı manuel olarak görev oluşturabilir.

Gerekli alanlar:

- Başlık
- Süre
- Zorluk

Opsiyonel alanlar:

- Açıklama
- Planlanan tarih/saat

Manuel görev oluşturma, AI servisinden bağımsız çalışmalıdır.

---

### 4.2. AI Task Creation Engine

Kullanıcı doğal dilde bir plan yazar:

```text
Yarın saat 10’da 1 saat finans çalışacağım.
```

Uygulama bu metni backend/serverless endpoint’e gönderir. Backend AI API çağrısı yapar ve yapılandırılmış JSON döner.

Beklenen response:

```json
{
  "title": "Finans Çalışma",
  "startDateTime": "2026-04-23T10:00:00+03:00",
  "endDateTime": "2026-04-23T11:00:00+03:00",
  "durationMinutes": 60,
  "difficulty": "MEDIUM",
  "description": "Finans çalışma odak seansı"
}
```

#### AI Engine Kuralları

- AI çıktısı direkt task olarak kaydedilmez.
- Kullanıcıya onay/düzenleme ekranı gösterilir.
- Eksik alan varsa kullanıcıdan manuel düzenleme istenir.
- Kullanıcı onaylarsa AIParsedTaskObject, TaskObject’e çevrilir.
- AI servis hatasında kullanıcı manuel görev formuna yönlendirilir.

---

### 4.3. Calendar Link Engine

Google Calendar entegrasyonu OAuth kullanmadan, Template URL mantığıyla çalışır.

Format:

```text
https://calendar.google.com/calendar/render?action=TEMPLATE&text=[EVENT_TITLE]&dates=[START_UTC]/[END_UTC]&details=[DESCRIPTION]
```

Tarih formatı:

```text
YYYYMMDDTHHMMSSZ
```

#### Kurallar

- Uygulama ISO datetime değerlerini UTC formatına çevirmelidir.
- Türkiye saati UTC+3 olarak ele alınmalıdır.
- Calendar URL, AI ile oluşturulan veya planlanan manuel görevlerden üretilebilir.
- Google Calendar linki opsiyoneldir; kullanıcı takvime eklemeden de FocusHome görevini oluşturabilir.
- MVP’de Google Calendar’dan veri okunmaz.
- MVP’de Google OAuth kullanılmaz.

---

### 4.4. Focus Engine

MVP’de Focus Engine sade tutulmalıdır.

Gerekli özellikler:

- Geri sayım timer
- Başlat / durdur / tamamlandı akışı
- Görev tamamlandığında ödül verme
- Görev iptal edilirse ödül vermeme
- Timer ekranında kalan süreyi gösterme

MVP’de ertelenecek gelişmiş özellikler:

- Foreground service detayları
- Wakelock entegrasyonu
- Anti-cheat uptime kontrolü
- PhoneState ile arama algılama
- Düşük pilde otomatik pause

Bu özellikler teknik olarak değerli olsa da Haziran öncesi MVP için risklidir.

---

### 4.5. Reward Engine

Ödül algoritması:

```text
EASY   -> 2 bricks + 20 XP
MEDIUM -> 5 bricks + 50 XP
HARD   -> 10 bricks + 100 XP
```

XP seviye formülü:

```text
level = floor(sqrt(total_xp / 100))
```

Kurallar:

- Ödül sadece COMPLETED task için verilir.
- FAILED veya ABANDONED task ödül vermez.
- Reward işlemi bir kez çalışmalıdır; aynı görev iki kez ödül vermemelidir.

---

### 4.6. Grid Engine

MVP için basit 2D grid yeterlidir.

Gerekli özellikler:

- 5x5 grid
- Boş hücreye asset yerleştirme
- Dolu hücreye yerleştirmeyi engelleme
- Yerleştirilen parçaları local database’de saklama

Ertelenen özellikler:

- Gelişmiş drag & drop
- Isometric z-index yönetimi
- Animasyonlu asset yerleşimi
- Gelişmiş haptic feedback

---

## 5. Teknik Mimari

### 5.1. Genel Mimari

```text
Flutter App
   ↓
Backend / Serverless API
   ↓
AI API
   ↓
Structured JSON Response
   ↓
Flutter App
   ↓
Task Creation + Google Calendar Template URL
```

### 5.2. Client-Side

- Flutter uygulaması kullanıcı arayüzünü, local state’i ve local persistence’ı yönetir.
- Flutter uygulaması OpenAI/API key içermez.
- Flutter sadece backend/serverless endpoint’e kullanıcı metnini gönderir.

### 5.3. Backend / Serverless Layer

Backend’in sorumlulukları:

- AI API key’i güvenli şekilde saklamak
- Kullanıcıdan gelen doğal dil inputunu almak
- AI API’ye istek atmak
- AI cevabını validate etmek
- Sadece gerekli JSON’u Flutter uygulamasına dönmek

Önerilen seçenekler:

- Firebase Cloud Functions
- Supabase Edge Functions
- Vercel Serverless Functions
- Cloudflare Workers
- Node.js + Express

MVP için en önemli güvenlik gereksinimi:

```text
API key client-side kodda görünmemelidir.
```

---

## 6. AI Prompt Taslağı

Backend tarafında kullanılabilecek system prompt:

```text
Sen bir odak planlama asistanısın. Kullanıcının doğal dilde yazdığı planı analiz edip FocusHome uygulaması için yapılandırılmış görev JSON'u üretmelisin.

Sadece geçerli JSON dön. Markdown, açıklama veya ekstra metin ekleme.

JSON formatı şu olmalı:
{
  "title": "Görev başlığı",
  "startDateTime": "ISO-8601 datetime with timezone",
  "endDateTime": "ISO-8601 datetime with timezone",
  "durationMinutes": 60,
  "difficulty": "EASY | MEDIUM | HARD",
  "description": "Kısa açıklama"
}

Kurallar:
- Kullanıcı süre belirtmezse varsayılan süre 60 dakika olsun.
- Kullanıcı zorluk belirtmezse görevin yoğunluğuna göre EASY, MEDIUM veya HARD öner.
- Tarih ve saat Türkiye saatine göre yorumlanmalı.
- Eksik veya belirsiz bilgi varsa en makul varsayımı yap, ancak title ve durationMinutes alanlarını boş bırakma.
```

---

## 7. State Management

Riverpod önerilen yapı:

- **TaskProvider:** Görev listesini ve aktif görevi yönetir.
- **TimerProvider:** Aktif odak seansının kalan süresini yönetir.
- **InventoryProvider:** XP, seviye ve materyalleri yönetir.
- **GridProvider:** 5x5 ev grid durumunu yönetir.
- **AiTaskProvider:** AI task parse isteği, loading state, error state ve parsed result yönetir.

---

## 8. Persistence Layer

Hive ile saklanacak veriler:

- TaskObject listesi
- InventoryObject
- GridMapObject
- Kullanıcı temel ayarları

Her önemli state değişiminde veri asenkron olarak Hive’a yazılmalıdır.

Örnek state değişimleri:

- Görev oluşturuldu
- Görev tamamlandı
- XP kazandı
- Materyal kazandı
- Asset grid’e yerleştirildi
- AI task onaylandı

---

## 9. UI/UX Durum Matrisi

| Ekran | Boş Durum | Loading | Hata |
|---|---|---|---|
| Görev Listesi | “Henüz görev yok, hadi bir tuğla koyalım.” | Skeleton loader | “Görevler yüklenemedi.” |
| AI Görev Oluşturma | “Planını doğal dille yaz.” | “Planın analiz ediliyor...” | “AI şu anda çalışmıyor, manuel ekleyebilirsin.” |
| AI Onay Ekranı | Parsed task bilgileri gösterilir | Yok | Eksik alanlar manuel düzenleme ile tamamlanır. |
| Timer | Aktif görev yok | Timer başlatılıyor | “Seans başlatılamadı.” |
| İnşaat Alanı | Boş 5x5 toprak zemin | Assetler yükleniyor | “Asset yüklenemedi, placeholder gösteriliyor.” |

---

## 10. Test Senaryoları

### 10.1. AI Task Parse Testleri

#### Test 1

Input:

```text
Yarın saat 10’da 1 saat finans çalışacağım.
```

Beklenen:

- Title: Finans Çalışma
- Duration: 60 dakika
- Difficulty: MEDIUM
- Start/end datetime dolu

#### Test 2

Input:

```text
Cuma günü öğleden sonra 3'te algoritma ödevi yapacağım.
```

Beklenen:

- Title: Algoritma Ödevi
- Start time: 15:00
- Duration: Varsayılan 60 dakika

#### Test 3

Input:

```text
Bugün 45 dakika kolay bir İngilizce tekrar yapacağım.
```

Beklenen:

- Title: İngilizce Tekrar
- Duration: 45 dakika
- Difficulty: EASY

### 10.2. Reward Testleri

- EASY görev tamamlanınca 2 tuğla ve 20 XP eklenmeli.
- MEDIUM görev tamamlanınca 5 tuğla ve 50 XP eklenmeli.
- HARD görev tamamlanınca 10 tuğla ve 100 XP eklenmeli.
- ABANDONED görev ödül vermemeli.

### 10.3. Calendar URL Testleri

- Calendar URL doğru formatta üretilmeli.
- Türkçe karakterler URL encode edilmelidir.
- UTC dönüşümü doğru yapılmalıdır.
- Kullanıcı Calendar’a eklemeden görev oluşturabilmelidir.

---

## 11. 6 Haftalık Mikro-Plan

### Hafta 1: Core App + Manual Tasks

- Flutter proje kurulumu
- Ana ekran
- Manuel görev ekleme
- Görev listesi
- Basit timer ekranı

**Milestone:** Kullanıcı manuel görev oluşturup timer başlatabilir.

### Hafta 2: Local DB + Reward System

- Hive setup
- Task persistence
- Inventory persistence
- Reward logic
- XP/seviye sistemi

**Milestone:** Görev tamamlanınca XP ve tuğla kazanılır, uygulama kapanınca veriler kalır.

### Hafta 3: Grid/Home Building MVP

- 5x5 grid UI
- Asset seçimi
- Boş hücreye yerleştirme
- Grid persistence

**Milestone:** Kullanıcı kazandığı tuğlaları grid üzerine yerleştirebilir.

### Hafta 4: AI API Backend Layer

- Backend/serverless endpoint kurulumu
- AI API entegrasyonu
- Prompt ve JSON response formatı
- Flutter’dan endpoint’e istek
- Loading/error state

**Milestone:** Kullanıcı doğal dil yazınca AI’dan task önerisi döner.

### Hafta 5: AI Confirmation + Calendar Link

- AI onay/düzenleme ekranı
- AIParsedTaskObject -> TaskObject dönüşümü
- Google Calendar Template URL helper
- “Google Calendar’a Ekle” butonu
- UI polish

**Milestone:** AI ile oluşturulan görev hem FocusHome’a eklenir hem Calendar link üretir.

### Hafta 6: Store Readiness

- Bug fixing
- Basit onboarding
- Empty state düzenlemeleri
- App icon
- Store screenshots
- Privacy text
- Android release build

**Milestone:** Uygulama Google Play’e gönderilebilecek MVP seviyesine gelir.

---

## 12. Riskler ve Mitigasyon

### Risk 1: AI API key güvenliği

**Risk:** API key mobil uygulama içinde görünürse kötüye kullanılabilir.  
**Çözüm:** API çağrısı backend/serverless üzerinden yapılmalıdır.

### Risk 2: AI’ın tarih/saat yanlış yorumlaması

**Risk:** Kullanıcı “yarın”, “cuma”, “akşam” gibi belirsiz ifadeler kullanabilir.  
**Çözüm:** AI çıktısı her zaman kullanıcıya onay/düzenleme ekranında gösterilmelidir.

### Risk 3: Scope creep

**Risk:** Calendar, AI, grid, timer, store hazırlığı aynı anda büyüyebilir.  
**Çözüm:** Sadece MVP özellikleri yapılmalı; OAuth, cloud sync, social features ertelenmelidir.

### Risk 4: Store’a yetişmeme

**Risk:** İki mağazaya aynı anda çıkmak zaman alabilir.  
**Çözüm:** Öncelik Android / Google Play build olmalıdır. iOS ikinci öncelik olabilir.

---

## 13. CPO Notu

Bu sürümde FocusHome’un özü değişmiyor. Uygulama hâlâ görev tamamlama, odaklanma ve ev inşa etme üzerine kurulu. AI Calendar entegrasyonu ayrı bir ürün değil; FocusHome’un görev oluşturma deneyimini güçlendiren bir akıllı planlama katmanıdır.

Haziran öncesi hedef:

```text
AI task creation + manual task creation + timer + reward + simple grid + Calendar link + secure API layer
```

Bundan fazlası ürün doğrulandıktan sonra ikinci fazda ele alınmalıdır.
