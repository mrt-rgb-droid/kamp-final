# Özellik Önizlemesi: 8. Sınıf Dinamik Müfredat ve İlerleme Sıfırlama

Bu belge, **8. Sınıf öğrencileri için tarihe göre değişen konu başlıkları** ve **Öğretmen paneli için ilerleme sıfırlama** özelliklerinin nasıl uygulanacağını gösterir.

## 1. Müfredat Takvimi (Mock Data)

Uygulamanın içine, 8. sınıf öğrencileri için geçerli tarihi kontrol edip o günün konusunu belirleyen bir takvim yapısı eklenecektir.

```javascript
// App.js içine eklenecek sabit veri
const LGS_CURRICULUM_CALENDAR = [
  { start: '2024-09-09', end: '2024-10-20', mat: 'Çarpanlar ve Katlar', fen: 'Mevsimler ve İklim' },
  { start: '2024-10-21', end: '2024-11-15', mat: 'Üslü İfadeler', fen: 'DNA ve Genetik Kod' },
  { start: '2024-11-16', end: '2024-12-10', mat: 'Kareköklü İfadeler', fen: 'Basınç' },
  { start: '2024-12-11', end: '2025-01-15', mat: 'Veri Analizi', fen: 'Madde ve Endüstri' },
  { start: '2025-01-16', end: '2025-02-20', mat: 'Cebirsel İfadeler', fen: 'Basit Makineler' },
  { start: '2025-02-21', end: '2025-03-30', mat: 'Doğrusal Denklemler', fen: 'Enerji Dönüşümleri' },
  { start: '2025-04-01', end: '2025-05-15', mat: 'Üçgenler / Eşlik', fen: 'Elektrik Yükleri' },
  // ...Diğer konular
];

const getCurrentTopics = () => {
  const now = new Date();
  const current = LGS_CURRICULUM_CALENDAR.find(p => now >= new Date(p.start) && now <= new Date(p.end));
  return current || { mat: 'Genel Tekrar', fen: 'Deneme Çözümü' };
};
```

## 2. Öğrenci Ekranı (StudentApp) Değişikliği

Öğrenci ana sayfasına (`HomeView`), eğer öğrenci 8. sınıf ise o günün konularını gösteren dinamik bir kart eklenecektir. Ayrıca görev listesindeki "Konu Çalışma" başlıkları otomatik olarak güncellenecektir.

```javascript
// HomeView bileşeni içinde kullanım örneği:

function HomeView({ ... props ... }) {
  // ...
  const currentTopics = props.grade === 8 ? getCurrentTopics() : null;

  return (
    <div className="...">
       {/* Mevcut kodlar... */}

       {/* YENİ: Sadece 8. Sınıflar için Müfredat Bilgisi */}
       {props.grade === 8 && (
         <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-lg mb-4 border border-indigo-700">
           <div className="flex items-center gap-2 mb-3 border-b border-indigo-700 pb-2">
             <Calendar className="w-5 h-5 text-yellow-400" />
             <h3 className="font-bold text-sm text-yellow-100">Bu Haftanın Odak Konuları</h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <div className="text-[10px] text-indigo-300 uppercase font-bold">Matematik</div>
               <div className="font-bold text-sm">{currentTopics.mat}</div>
             </div>
             <div>
               <div className="text-[10px] text-indigo-300 uppercase font-bold">Fen Bilimleri</div>
               <div className="font-bold text-sm">{currentTopics.fen}</div>
             </div>
           </div>
         </div>
       )}

       {/* ... */}
    </div>
  );
}
```

Ayrıca, "Günlük Hedeflerim" listesinde `customLabel` (özel etiket) boş ise ve ders Matematik/Fen ise, otomatik olarak bu konuyu yazdırabiliriz.

## 3. Öğretmen Paneli (TeacherApp) - İlerleme Sıfırlama

Öğretmen panelindeki öğrenci detay satırına (`StudentDetailRow`), öğrencinin ilerlemesini (günlerini) sıfırlayan bir buton eklenecektir.

```javascript
// TeacherApp -> StudentDetailRow bileşeni içi:

const resetStudentProgress = async () => {
  if (window.confirm(`${student.name} isimli öğrencinin TÜM ilerlemesi silinecek ve 1. Güne dönecek. Emin misiniz?`)) {
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'public_data', student.id);
      // days alanını boş obje ile güncelleyerek sıfırlarız
      await setDoc(docRef, { days: {} }, { merge: true });
      alert("Öğrenci ilerlemesi başarıyla sıfırlandı.");
    } catch (error) {
      console.error(error);
      alert("Bir hata oluştu.");
    }
  }
};

// Butonun eklenmesi (Detaylar açıldığında görünen butonların yanına):
// ...
<div className="flex gap-2 mt-2">
  <button onClick={sendFeedback} className="...">Not Gönder</button>

  {/* YENİ BUTON */}
  <button
    onClick={resetStudentProgress}
    className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-bold text-xs hover:bg-yellow-600 transition"
  >
    <RotateCcw className="w-4 h-4 inline mr-1"/> Sıfırla (Başa Dön)
  </button>

  <button onClick={() => setShowDeleteConfirm(true)} className="...">Sil</button>
</div>
```

## Özet
Bu değişikliklerle:
1. **8. Sınıflar**, uygulamayı açtıklarında o tarihteki LGS konularını görecekler.
2. Öğretmen, bir öğrenciyi **"Sıfırla"** butonuna basarak programın en başına (1. Gün) döndürebilecek, ancak öğrencinin kaydı silinmeyecek.
