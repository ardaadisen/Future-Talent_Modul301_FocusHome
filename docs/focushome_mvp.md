# 📄 FocusHome MVP Ürün Kapsam Dökümanı

**Sürüm:** 1.1 (AI + API Entegrasyonlu MVP)  
**Hedef Tarih:** Haziran başlamadan önce mağazaya gönderime hazır MVP  
**Durum:** Planlama / Geliştirme Öncesi  
**Ürün Tipi:** AI destekli odak planlama + oyunlaştırılmış görev tamamlama uygulaması

---

## 1. Ürün Vizyonu ve Temel Hedef

FocusHome, kullanıcının erteleme alışkanlığını kırmak için görevleri somut bir görsel ilerleme sistemine bağlayan bir odak uygulamasıdır. Kullanıcılar çalışma veya günlük görevlerini odak seanslarına dönüştürür, seansları tamamladıkça tuğla/XP kazanır ve sanal evlerini inşa eder.

Bu MVP sürümünde ürüne eklenen temel yenilik, **AI destekli doğal dil ile görev oluşturma** özelliğidir. Kullanıcı “Yarın saat 3’te 45 dakika algoritma çalışacağım” gibi doğal bir cümle yazabilir. Sistem bu cümleyi AI API ile analiz ederek yapılandırılmış bir FocusHome görevine dönüştürür ve isterse Google Calendar’a eklenebilecek bir etkinlik linki oluşturur.

Amaç, FocusHome’u yalnızca bir timer veya yapılacaklar listesi olmaktan çıkarıp, gerçek bir **AI-assisted focus planning product** haline getirmektir.

---

## 2. Ürün Konumlandırması

**FocusHome is an AI-assisted focus planning app that turns natural language study/work plans into structured focus sessions and optional Google Calendar events. Users complete focus sessions to earn building materials and gradually construct a virtual home.**

Türkçe açıklama:

FocusHome, kullanıcıların doğal dilde yazdığı çalışma veya görev planlarını AI yardımıyla yapılandırılmış odak seanslarına ve isteğe bağlı Google Calendar etkinliklerine dönüştüren bir üretkenlik uygulamasıdır. Kullanıcılar odak seanslarını tamamladıkça yapı materyalleri kazanır ve sanal evlerini inşa eder.

---

## 3. Kullanıcı Deneyimi (Happy Path)

### 3.1. Manuel Görev Oluşturma Akışı

1. Kullanıcı uygulamayı açar.
2. Login gerekmeden yerel kayıt sistemiyle uygulamaya başlar.
3. Kullanıcı manuel olarak görev oluşturur:
   - Başlık: “Algoritma çalış”
   - Süre: 45 dakika
   - Zorluk: Zor
4. Geri sayım başlar.
5. Süre başarıyla biterse görev tamamlanır.
6. Kullanıcı XP ve materyal kazanır.
7. Kullanıcı kazandığı materyallerle 5x5 inşaat alanına parça yerleştirir.
8. Ev büyüdükçe kullanıcı yeni odak seanslarına motive olur.

### 3.2. AI ile Görev Oluşturma Akışı

1. Kullanıcı AI görev kutusuna doğal dilde bir plan yazar.
   - Örnek: “Yarın saat 10’da 1 saat finans çalışacağım.”
2. Uygulama bu metni backend/serverless API’ye gönderir.
3. Backend, AI API kullanarak metni analiz eder.
4. AI aşağıdaki bilgileri çıkarır:
   - Görev başlığı
   - Başlangıç tarihi ve saati
   - Bitiş tarihi ve saati
   - Süre
   - Önerilen zorluk
   - Açıklama
5. Uygulama kullanıcıya bir onay/düzenleme ekranı gösterir.
6. Kullanıcı onaylarsa görev FocusHome görev listesine eklenir.
7. Kullanıcı isterse “Google Calendar’a Ekle” butonuyla etkinliği takvimine ekler.
8. Kullanıcı görev zamanı geldiğinde FocusHome’da odak seansını başlatır.

---

## 4. MVP Fonksiyonel Gereksinimler (Must-Have)

### 4.1. Görev ve Zaman Yönetimi

- **Manuel Görev Formu:** Kullanıcı başlık, süre ve zorluk seçerek görev oluşturabilmelidir.
- **Süre Seçenekleri:** 15, 30, 45, 60 dakika seçenekleri desteklenmelidir.
- **Zorluk Seçenekleri:** Kolay, Orta, Zor.
- **Aktif Zamanlayıcı:** Kullanıcı görev için geri sayım başlatabilmelidir.
- **Görev Tamamlama Mantığı:** Sadece süre başarıyla biterse görev “COMPLETED” sayılmalıdır.
- **Başarısız / Yarım Bırakılan Görev:** Kullanıcı seansı iptal ederse görev “ABANDONED” veya “FAILED” durumuna geçmelidir.

### 4.2. AI Destekli Görev Oluşturma

- Kullanıcı doğal dilde görev yazabilmelidir.
- AI, metni yapılandırılmış görev bilgilerine dönüştürmelidir.
- AI çıktısı doğrudan kaydedilmemeli; önce kullanıcıya onay ekranı gösterilmelidir.
- Kullanıcı AI’ın çıkardığı başlık, süre, tarih/saat ve zorluk bilgilerini düzenleyebilmelidir.
- AI çalışmazsa manuel görev oluşturma akışı kullanılabilir kalmalıdır.

### 4.3. Google Calendar Entegrasyonu

- Uygulama, AI ile oluşturulan görevlerden Google Calendar Template URL üretmelidir.
- Kullanıcı “Google Calendar’a Ekle” butonuna tıklayınca Google Calendar yeni sekme/tarayıcı ekranında açılmalıdır.
- Kullanıcının takvimine otomatik yazmak için Google OAuth kullanılmayacaktır.
- MVP’de Google Calendar mevcut takvimi okunmayacaktır.
- Google Calendar entegrasyonu hatırlatma işini kolaylaştırmak için kullanılacaktır; FocusHome’un kendi timer/reward sistemi yine uygulama içinde çalışacaktır.

### 4.4. Oyunlaştırma ve İnşa Motoru

- **Ödül Algoritması:**
  - Kolay: 2 Tuğla
  - Orta: 5 Tuğla
  - Zor: 10 Tuğla
- **XP Kazanımı:** Görev tamamlandığında kullanıcı XP kazanmalıdır.
- **Envanter:** Kullanıcının kazandığı tuğla, cam ve çatı materyalleri saklanmalıdır.
- **2D Grid Sistemi:** MVP için 5x5 sabit bir inşaat alanı yeterlidir.
- **Parça Yerleştirme:** Kullanıcı kazandığı materyalleri grid üzerinde basit tıklama/tap mantığıyla yerleştirebilmelidir.
- **Collision Check:** Dolu hücreye yeni parça yerleştirilmemelidir.

### 4.5. Yerel Veri Saklama

- Görevler, envanter, XP, seviye ve grid durumu telefonda saklanmalıdır.
- Uygulama kapanıp açıldığında veriler silinmemelidir.
- MVP için bulut senkronizasyonu yoktur.

---

## 5. Teknik Gereksinimler

### 5.1. Mobil Uygulama

- **Framework:** Flutter
- **State Management:** Riverpod veya Provider
- **Local Database:** Hive
- **UI Yaklaşımı:** Basit, temiz, pastel renkli, mobil-first arayüz

### 5.2. AI/API Entegrasyonu

- AI API çağrıları doğrudan Flutter uygulamasından yapılmamalıdır.
- API key kesinlikle mobil uygulama içine gömülmemelidir.
- Flutter uygulaması küçük bir backend/serverless endpoint’e istek atmalıdır.
- Backend/serverless endpoint AI API ile konuşmalı ve uygulamaya yapılandırılmış JSON dönmelidir.

Önerilen backend seçenekleri:

- Firebase Cloud Functions
- Supabase Edge Functions
- Vercel Serverless Functions
- Cloudflare Workers
- Basit Node.js + Express backend

MVP için en önemli şart: **API key client-side görünmemelidir.**

---

## 6. AI Çıktı Formatı

AI’dan beklenen çıktı aşağıdaki gibi yapılandırılmış JSON olmalıdır:

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

### Kurallar

- Eğer kullanıcı süre belirtmezse varsayılan süre 60 dakika olmalıdır.
- Eğer kullanıcı tarih belirtmezse uygulama kullanıcıdan onay/düzenleme istemelidir.
- Eğer kullanıcı zorluk belirtmezse AI öneri yapabilir, ancak kullanıcı düzenleyebilmelidir.
- Türkiye saat dilimi varsayılan kabul edilebilir.
- AI çıktısı hatalı veya eksikse kullanıcı manuel form ekranına yönlendirilmelidir.

---

## 7. Google Calendar URL Formatı

Google Calendar linki aşağıdaki formatla oluşturulmalıdır:

```text
https://calendar.google.com/calendar/render?action=TEMPLATE&text=[EVENT_TITLE]&dates=[START_UTC]/[END_UTC]&details=[DESCRIPTION]
```

Tarih formatı:

```text
YYYYMMDDTHHMMSSZ
```

Örnek:

```text
https://calendar.google.com/calendar/render?action=TEMPLATE&text=Finans%20Çalışma&dates=20260423T070000Z/20260423T080000Z&details=FocusHome%20odak%20seansı
```

Türkiye saati UTC+3 olduğu için, örneğin 10:00 Türkiye saati Calendar URL içinde 07:00Z olarak yazılmalıdır.

---

## 8. Tasarım ve Sanat Yönü

- **Stil:** Minimalist 2D Pixel-Art veya Flat Design.
- **Renk Paleti:** Pastel yeşil, toprak tonları, açık krem arka plan.
- **MVP Assetleri:**
  - 1 zemin tipi
  - 1 duvar/tuğla tipi
  - 1 pencere
  - 1 kapı
  - 1 çatı tipi
- Assetler ilk sürümde ücretsiz asset paketlerinden alınabilir.
- Görsel mükemmellik yerine çalışan ve anlaşılır ürün önceliklidir.

---

## 9. Kapsam Dışı (Haziran Sonrasına Ertelenenler)

Aşağıdaki özellikler MVP’ye dahil değildir:

- Kullanıcı kaydı / login
- Google OAuth ile doğrudan takvime yazma
- Kullanıcının mevcut Google Calendar etkinliklerini okuma
- Takvimde boşluk bulma
- Sosyal medya entegrasyonu
- Arkadaş listesi / chat
- Bulut yedekleme / cloud sync
- In-app purchase
- Detaylı karakter animasyonları
- Gelişmiş isometric grid
- Gelişmiş drag & drop sistemi
- Phone call detection
- Düşük pilde otomatik pause
- Anti-cheat sistemi
- Firebase Analytics
- iPad/tablet özel arayüzü

Bu özellikler ürün doğrulandıktan sonra ikinci fazda değerlendirilebilir.

---

## 10. Başarı Kriterleri

MVP başarılı sayılırsa:

- Kullanıcı manuel görev oluşturabilir.
- Kullanıcı doğal dilde görev yazıp AI ile yapılandırılmış task alabilir.
- Kullanıcı AI çıktısını onaylayabilir veya düzenleyebilir.
- Kullanıcı oluşturulan görevi Google Calendar’a ekleyebilir.
- Kullanıcı timer başlatabilir ve tamamlayabilir.
- Görev tamamlandığında XP ve materyal kazanılır.
- Kullanıcı materyali 5x5 grid üzerine yerleştirebilir.
- Uygulama kapanıp açıldığında veriler korunur.
- API key uygulama içinde görünmez.
- Uygulama mağazaya gönderilebilecek kadar stabil ve anlaşılır çalışır.

---

## 11. 6 Haftalık Kritik Zaman Çizelgesi

| Hafta | Odak Noktası | Çıktı |
|---|---|---|
| 1. Hafta | Flutter temel yapı + görev mantığı | Manuel görev ekleme/silme ve timer ekranı çalışır. |
| 2. Hafta | Local storage + reward logic | Görevler, XP, envanter ve puanlar uygulama kapanınca silinmez. |
| 3. Hafta | Grid/inşa sistemi | 5x5 grid üzerinde basit parça yerleştirme çalışır. |
| 4. Hafta | AI backend/serverless entegrasyonu | Doğal dil task parse edilir ve onay ekranına düşer. |
| 5. Hafta | Google Calendar link + UI polish | Onaylanan görev için Calendar link üretilir, arayüz sadeleştirilir. |
| 6. Hafta | Test, hata temizliği, store hazırlığı | Android build, ikonlar, açıklama metni, privacy text ve mağaza görselleri hazırlanır. |

---

## 12. Ürün Yöneticisinden Notlar

1. **FocusHome ana ürün olarak kalmalıdır.** AI Calendar özelliği ayrı bir uygulama gibi değil, FocusHome’un “akıllı görev oluşturma” özelliği gibi düşünülmelidir.
2. **Manuel görev oluşturma kesinlikle kalmalıdır.** AI çalışmazsa uygulama kullanılabilir olmalıdır.
3. **API key client-side olmamalıdır.** Bu canlı product için kritik güvenlik şartıdır.
4. **Haziran öncesi hedef mükemmel ürün değil, çalışan ve mağazaya çıkabilir MVP’dir.**
5. **Scope küçük tutulmalıdır.** AI task creation + timer + reward + simple grid + Calendar link yeterlidir.
