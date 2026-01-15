import React, { useState, useEffect } from 'react';
import {
  Calculator, BookOpen, FlaskConical, Leaf, Users, CheckCircle2,
  Download, LogOut, User, Calendar, Home, Star, MessageSquare,
  ChevronUp, ChevronDown, X, HelpCircle, Phone, Bell, Award, Trophy,
  Flame, Target, Zap, Clock, Loader2, LockKeyhole, List, Crown, Gem, Check, Image as ImageIcon, Send, Palette, Timer, Brain, PenTool, Trash2
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- 1. FIREBASE AYARLARI ---
const firebaseConfig = {
  apiKey: "AIzaSyAeyolB3EGrsOiNwdS971zF8DqCZ4ZPlAQ",
  authDomain: "kamp-takip-sistemi.firebaseapp.com",
  projectId: "kamp-takip-sistemi",
  storageBucket: "kamp-takip-sistemi.firebasestorage.app",
  messagingSenderId: "339295588440",
  appId: "1:339295588440:web:3400318781869a00afba2d"
};

// --- AYARLAR ---
const APP_ID = "kamp-takip-yonetici-v3"; 
const TEACHER_PASS = "1876";
const TOTAL_DAYS = 15;
const DAYS_ARRAY = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

// LGS TARİHLERİ
const LGS_DATE_2026 = new Date('2026-06-07T09:30:00');
const LGS_DATE_2027 = new Date('2027-06-06T09:30:00');

// --- YARDIMCI FONKSİYONLAR ---
const countTotalSubject = (days, subjectKey) => {
  let total = 0;
  Object.values(days || {}).forEach(d => {
    if (d[subjectKey + 'True']) total += parseInt(d[subjectKey + 'True'] || 0);
    if (d[subjectKey + 'Duration']) total += parseInt(d[subjectKey + 'Duration'] || 0);
    if (d[subjectKey] === true) total += 1;
  });
  return total;
};

// Ardışık gün sayısını hesaplayan fonksiyon
const calculateMaxStreak = (daysObj) => {
  const days = Object.keys(daysObj).map(Number).sort((a, b) => a - b);
  if (days.length === 0) return 0;
  
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] + 1) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    if (currentStreak > maxStreak) maxStreak = currentStreak;
  }
  return maxStreak;
};

// --- ROZET SİSTEMİ ---
const BADGE_DEFINITIONS = [
  // --- BRONZ (Başlangıç) ---
  {
    id: 'first_step',
    title: 'İlk Adım',
    desc: 'İlk veri girişini yaptın. Maceran başladı!',
    tier: 'bronz',
    icon: Star,
    emoji: "⭐",
    minGrade: 1,
    check: (days) => Object.keys(days).length >= 1
  },
  {
    id: 'bookworm_jr',
    title: 'Kitap Kurdu',
    desc: 'En az 3 farklı günde, günde en az 15dk kitap okudun.',
    tier: 'bronz',
    icon: BookOpen,
    emoji: "📚",
    minGrade: 1,
    check: (days) => Object.values(days).filter(d => parseInt(d['kitapDuration'] || 0) >= 15).length >= 3
  },
  {
    id: 'math_starter',
    title: 'Matematik Çırağı',
    desc: 'Toplam 50 Matematik sorusu çözdün.',
    tier: 'bronz',
    icon: Calculator,
    emoji: "🧮",
    minGrade: 2,
    check: (days) => countTotalSubject(days, 'mat') >= 50
  },
  {
    id: 'science_starter',
    title: 'Fen Çırağı',
    desc: 'Toplam 50 Fen sorusu çözdün.',
    tier: 'bronz',
    icon: FlaskConical,
    emoji: "🧪",
    minGrade: 3,
    check: (days) => countTotalSubject(days, 'fen') >= 50
  },
  
  // --- GÜMÜŞ (Orta Seviye) ---
  {
    id: 'week_streak',
    title: 'Haftalık Seri',
    desc: '7 gün ARALIKSIZ (peş peşe) veri girdin.',
    tier: 'gumus',
    icon: Flame,
    emoji: "🔥",
    minGrade: 1,
    check: (days) => calculateMaxStreak(days) >= 7
  },
  {
    id: 'science_lab',
    title: 'Laboratuvar Faresi',
    desc: 'Toplam 150 Fen sorusu çözdün.',
    tier: 'gumus',
    icon: FlaskConical,
    emoji: "🧬",
    minGrade: 4,
    check: (days) => countTotalSubject(days, 'fen') >= 150
  },
  {
    id: 'social_butterfly',
    title: 'Kültür Elçisi',
    desc: 'Toplam 100 Sosyal/İnkılap sorusu.',
    tier: 'gumus',
    icon: Users,
    emoji: "🌍",
    minGrade: 4,
    check: (days) => countTotalSubject(days, 'sos') + countTotalSubject(days, 'inkilap') >= 100
  },
  {
    id: 'turkish_master',
    title: 'Dilbilgisi Uzmanı',
    desc: 'Toplam 150 Türkçe sorusu çözdün.',
    tier: 'gumus',
    icon: BookOpen,
    emoji: "📖",
    minGrade: 2,
    check: (days) => countTotalSubject(days, 'tr') >= 150
  },

  // --- ALTIN (İleri Seviye) ---
  {
    id: 'full_focus',
    title: 'Odaklanma Kralı',
    desc: 'Bir günde tek seferde 60 dk çalışma.',
    tier: 'altin',
    icon: Clock,
    emoji: "🧘",
    minGrade: 5,
    check: (days) => Object.values(days).some(d => Object.keys(d).some(k => k.endsWith('Duration') && parseInt(d[k]) >= 60))
  },
  {
    id: 'perfect_day',
    title: 'Kusursuz Gün',
    desc: 'Bir günde en az 100 soru çöz ve 0 yanlış yap.',
    tier: 'altin',
    icon: Target,
    emoji: "🎯",
    minGrade: 5,
    check: (days) => Object.values(days).some(d => {
      let totalT = 0, totalF = 0;
      Object.keys(d).forEach(k => {
        if (k.endsWith('True')) totalT += parseInt(d[k] || 0);
        if (k.endsWith('False')) totalF += parseInt(d[k] || 0);
      });
      return totalT >= 100 && totalF === 0;
    })
  },
  {
    id: 'lgs_warrior',
    title: 'LGS Savaşçısı',
    desc: 'Toplam 500 soru barajını aştın!',
    tier: 'altin',
    icon: Crown,
    emoji: "⚔️",
    minGrade: 7,
    check: (days) => {
      let total = 0;
      Object.values(days).forEach(d => Object.keys(d).forEach(k => { if (k.endsWith('True')) total += parseInt(d[k] || 0) }));
      return total >= 500;
    }
  },
  {
    id: 'consistency_king',
    title: 'İstikrar Abidesi',
    desc: 'Toplam 10 gün veri girişi yapıldı.',
    tier: 'altin',
    icon: Calendar,
    emoji: "🗓️",
    minGrade: 1,
    check: (days) => Object.keys(days).length >= 10
  },

  // --- İMKANSIZ (Efsanevi) ---
  {
    id: 'terminator',
    title: 'Terminatör',
    desc: '15 Günün tamamında eksiksiz veri girişi.',
    tier: 'imkansiz',
    icon: Zap,
    emoji: "🤖",
    minGrade: 1,
    check: (days) => Object.keys(days).length >= 15
  },
  {
    id: 'math_genius',
    title: 'Matematik Dehası',
    desc: 'Toplam 1000 Matematik sorusu çöz!',
    tier: 'imkansiz',
    icon: Gem,
    emoji: "💎",
    minGrade: 6,
    check: (days) => countTotalSubject(days, 'mat') >= 1000
  },
  {
    id: 'legendary_reader',
    title: 'Bilge Okuyucu',
    desc: 'Toplam 1000 dakika çalışma süresine ulaş.',
    tier: 'imkansiz',
    icon: BookOpen,
    emoji: "📜",
    minGrade: 2,
    check: (days) => {
        let totalMin = 0;
        Object.values(days).forEach(d => Object.keys(d).forEach(k => { if (k.endsWith('Duration')) totalMin += parseInt(d[k] || 0) }));
        return totalMin >= 1000;
    }
  },
  {
    id: 'question_monster',
    title: 'Soru Canavarı',
    desc: 'Toplam 2000 soru barajını devir!',
    tier: 'imkansiz',
    icon: Trophy,
    emoji: "🦖",
    minGrade: 7,
    check: (days) => {
      let total = 0;
      Object.values(days).forEach(d => Object.keys(d).forEach(k => { if (k.endsWith('True')) total += parseInt(d[k] || 0) }));
      return total >= 2000;
    }
  }
];

// --- DERS/KONU TANIMLARI ---
const SUBJECT_METADATA = {
  mat: { label: "Matematik", icon: Calculator, color: "blue", type: "question" },
  tr: { label: "Türkçe", icon: BookOpen, color: "red", type: "question" },
  fen: { label: "Fen Bilimleri", icon: FlaskConical, color: "green", type: "question" },
  hayat: { label: "Hayat Bilgisi", icon: Leaf, color: "emerald", type: "question" },
  sos: { label: "Sosyal Bilgiler", icon: Users, color: "orange", type: "question" },
  inkilap: { label: "İnkılap Tarihi", icon: BookOpen, color: "amber", type: "question" },
  din: { label: "Din Kültürü", icon: Star, color: "purple", type: "question" },
  ing: { label: "İngilizce", icon: MessageSquare, color: "pink", type: "question" },
  
  // Özel Tipler
  kitap: { label: "Kitap Okuma", icon: BookOpen, color: "rose", type: "duration" },
  konu: { label: "Konu Çalışma", icon: Brain, color: "indigo", type: "duration" },
  paragraf: { label: "Paragraf Çözümü", icon: List, color: "cyan", type: "question" }
};

// Varsayılan Müfredat (Örnek)
const DEFAULT_CURRICULUM = {
  7: [
    { id: 'mat', target: 20, type: 'question', customLabel: '' },
    { id: 'tr', target: 20, type: 'question', customLabel: '' },
    { id: 'kitap', target: 30, type: 'duration', customLabel: '' },
    { id: 'konu', target: 40, type: 'duration', customLabel: 'Matematik Konu' }
  ]
};

const getSubjectInfo = (item) => {
  const baseMeta = SUBJECT_METADATA[item.id] || { label: item.id, icon: Star, color: 'gray', type: 'question' };
  const type = item.type || baseMeta.type;
  const label = item.customLabel ? item.customLabel : baseMeta.label;
  return { ...baseMeta, label, type, target: item.target };
};

const ADVICE_POOL = {
  math: ["Matematik işlemlerini kağıda yazarak yapmayı dene. ✍️", "Takıldığın sorularda önce çözümlü örneklere bak. 🧮"],
  turkish: ["Paragraf sorularında önce soru kökünü oku. 👁️", "Kitap okuma saatini 10 dakika artırmayı dene. 📚"],
  science: ["Fen konularını günlük hayattaki olaylarla ilişkilendir. 🧪", "Kavramları karıştırmamak için not tut. 📝"],
  general: ["Harika gidiyorsun! Mola vermeyi unutma. 💧", "Bugünkü çaban yarınki başarının anahtarıdır. 🗝️"]
};

const safeArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return Object.values(data);
  return [];
};

const isContentValid = (timestamp) => {
  if (!timestamp) return false;
  try {
    const now = new Date();
    const contentDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    const diff = now - contentDate;
    return diff < (24 * 60 * 60 * 1000);
  } catch (e) { return false; }
};

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

// --- DİNAMİK KARNE OLUŞTURUCU (FIX: Yanlış Sayıları Eklendi) ---
const generateReportCard = (student, curriculum, teacherNote) => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const W = 900;
    
    // Yüksekliği dinamik olarak hesapla
    let dynamicHeight = 450; 
    
    const earnedBadges = BADGE_DEFINITIONS.filter(b => b.check(student.days || {}));
    const badgeRows = Math.ceil(Math.max(earnedBadges.length, 1) / 3);
    const badgeAreaHeight = (badgeRows * 80) + 100;
    dynamicHeight += badgeAreaHeight;

    const daysSorted = Object.keys(student.days || {}).map(Number).sort((a,b) => a-b);
    const summaryRows = daysSorted.length;
    const summaryAreaHeight = (summaryRows * 40) + 100; 
    dynamicHeight += summaryAreaHeight;

    dynamicHeight += 200;

    const H = Math.max(dynamicHeight, 1400); 
    canvas.width = W;
    canvas.height = H;

    // Arkaplan
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#ffffff");
    grd.addColorStop(1, "#f0f9ff");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Dış Çerçeve
    ctx.strokeStyle = "#1e3a8a"; 
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = "#fbbf24"; 
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    // --- BAŞLIK ---
    let currentY = 110;
    ctx.fillStyle = "#1e3a8a";
    ctx.font = "bold 44px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✨ KAMP GELİŞİM KARNESİ ✨", W / 2, currentY);

    // --- ÖĞRENCİ BİLGİSİ ---
    currentY += 80;
    ctx.shadowColor = "rgba(0,0,0,0.1)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(W/2 - 250, currentY - 50, 500, 100, 20);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#1e40af";
    ctx.font = "bold 36px 'Segoe UI', Arial";
    ctx.fillText(student.name.toUpperCase(), W / 2, currentY);
    
    currentY += 35;
    ctx.fillStyle = "#6b7280";
    ctx.font = "24px 'Segoe UI', Arial";
    ctx.fillText(`${student.grade}. Sınıf Öğrencisi`, W / 2, currentY);

    // --- İSTATİSTİKLER ---
    let totalQ = 0;
    let totalMin = 0;
    Object.values(student.days || {}).forEach(d => {
      Object.keys(d).forEach(k => { 
        if (k.endsWith('True')) totalQ += parseInt(d[k] || 0);
        if (k.endsWith('False')) totalQ += parseInt(d[k] || 0); // YANLIŞLARI DA EKLE (TOPLAM SORU)
        if (k.endsWith('Duration')) totalMin += parseInt(d[k] || 0);
      });
    });

    currentY += 100;
    const drawStat = (label, val, x, color) => {
        ctx.fillStyle = color;
        ctx.font = "bold 40px 'Segoe UI', Arial";
        ctx.fillText(val, x, currentY);
        ctx.fillStyle = "#4b5563";
        ctx.font = "18px 'Segoe UI', Arial";
        ctx.fillText(label, x, currentY + 30);
    }

    drawStat("TOPLAM SORU", totalQ, W/4, "#2563eb");
    drawStat("ÇALIŞMA (DK)", totalMin, W/2, "#d97706");
    drawStat("AKTİF GÜN", Object.keys(student.days || {}).length, 3*W/4, "#059669");

    // --- ROZETLER ---
    currentY += 100;
    ctx.textAlign = "left";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 26px 'Segoe UI', Arial";
    ctx.fillText("🏆 KAZANILAN ROZETLER", 60, currentY);
    currentY += 40;

    if (earnedBadges.length === 0) {
        ctx.fillStyle = "#9ca3af";
        ctx.font = "italic 20px 'Segoe UI', Arial";
        ctx.fillText("Henüz rozet kazanılmadı.", 60, currentY);
        currentY += 40;
    } else {
        let bx = 60;
        
        earnedBadges.forEach((badge) => {
            const boxW = 240;
            const boxH = 60;
            
            if (bx + boxW > W - 60) { 
              bx = 60; 
              currentY += 80; 
            }

            ctx.fillStyle = badge.tier === 'altin' ? '#fffbeb' : badge.tier === 'gumus' ? '#f3f4f6' : badge.tier === 'imkansiz' ? '#fdf4ff' : '#fff7ed';
            ctx.strokeStyle = badge.tier === 'altin' ? '#fbbf24' : badge.tier === 'gumus' ? '#9ca3af' : badge.tier === 'imkansiz' ? '#d946ef' : '#fdba74';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.roundRect(bx, currentY, boxW, boxH, 10);
            ctx.fill();
            ctx.stroke();

            ctx.font = "32px 'Segoe UI', Arial";
            ctx.fillStyle = "#000"; 
            ctx.fillText(badge.emoji || "🏅", bx + 15, currentY + 42);

            ctx.fillStyle = "#1f2937";
            ctx.font = "bold 16px 'Segoe UI', Arial";
            ctx.fillText(badge.title, bx + 60, currentY + 35);
            
            bx += boxW + 20;
        });
        currentY += 100; 
    }

    // --- GÜNLÜK DETAYLAR (YANLIŞLAR EKLENDİ) ---
    ctx.fillStyle = "#111827";
    ctx.font = "bold 26px 'Segoe UI', Arial";
    ctx.fillText("📅 GÜNLÜK ÇALIŞMA ÖZETİ", 60, currentY);
    currentY += 40;

    ctx.font = "18px 'Segoe UI', Arial"; 
    
    if (daysSorted.length === 0) {
        ctx.fillStyle = "#9ca3af";
        ctx.fillText("Veri girişi bulunmamaktadır.", 60, currentY);
        currentY += 40;
    } else {
        daysSorted.forEach((dayNum) => {
            const dayData = student.days[dayNum];
            
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(60, currentY - 25, W - 120, 40);
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 1;
            ctx.strokeRect(60, currentY - 25, W - 120, 40);

            ctx.fillStyle = "#1e40af";
            ctx.font = "bold 18px 'Segoe UI', Arial";
            ctx.fillText(`${dayNum}. Gün:`, 75, currentY);

            let parts = [];
            Object.keys(SUBJECT_METADATA).forEach(subj => {
                const meta = SUBJECT_METADATA[subj];
                if (meta.type === 'question') {
                    const t = dayData[subj+'True'];
                    const f = dayData[subj+'False'];
                    if (t || f) {
                        // BURASI GÜNCELLENDİ: DOĞRU / YANLIŞ GÖSTERİMİ
                        parts.push(`${meta.label}: ${t||0}D / ${f||0}Y`);
                    }
                }
                if (dayData[subj+'Duration']) parts.push(`${meta.label}: ${dayData[subj+'Duration']} dk`);
            });

            ctx.fillStyle = "#374151";
            ctx.font = "16px 'Segoe UI', Arial";
            
            let summaryText = parts.length > 0 ? parts.join("  |  ") : "Veri yok";
            
            if (ctx.measureText(summaryText).width > W - 250) {
                 // Basit sığdırma
            }
            
            ctx.fillText(summaryText, 160, currentY);
            currentY += 50; 
        });
    }

    // --- ÖĞRETMEN NOTU ---
    currentY += 40; 
    
    const noteHeight = 140;
    if (currentY + noteHeight > H - 40) {
        // Taşma kontrolü
    }

    ctx.fillStyle = "#fff1f2";
    ctx.fillRect(60, currentY, W - 120, noteHeight);
    ctx.strokeStyle = "#fda4af";
    ctx.lineWidth = 2;
    ctx.strokeRect(60, currentY, W - 120, noteHeight);

    ctx.fillStyle = "#be123c";
    ctx.font = "bold 22px 'Segoe UI', Arial";
    ctx.fillText("📝 ÖĞRETMEN GÖRÜŞÜ", 80, currentY + 35);

    ctx.fillStyle = "#1f2937";
    ctx.font = "italic 18px 'Segoe UI', Arial";
    wrapText(ctx, teacherNote || "Harika gidiyorsun, bu azimle devam et!", 80, currentY + 70, W - 160, 25);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "14px 'Arial'";
    ctx.textAlign = "center";
    ctx.fillText("Kamp Takip Sistemi • Otomatik Oluşturulan Rapor", W / 2, H - 20);

    const link = document.createElement('a');
    link.download = `${student.name.replace(/\s+/g, '_')}_Karnesi.png`;
    link.href = canvas.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (e) {
    console.error("Karne hatası:", e);
    alert("Karne oluşturulurken bir hata oluştu.");
  }
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  var words = text.split(' ');
  var line = '';
  for(var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    var metrics = ctx.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

const exportToCSV = (students) => {
  let csvContent = "\uFEFF";
  csvContent += "Ad Soyad,Sinif,Toplam Soru,Giris Yapilan Gun Sayisi\n";
  students.forEach(std => {
    let totalQ = 0;
    const daysEntered = Object.keys(std.days || {}).length;
    Object.values(std.days || {}).forEach(day => {
      Object.keys(day).forEach(key => { if (key.endsWith('True')) totalQ += parseInt(day[key] || 0); });
    });
    csvContent += `${std.name},${std.grade},${totalQ},${daysEntered}\n`;
  });
  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "kamp_takip_raporu.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Firebase Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const generateStudentId = (name, grade) => {
  const cleanName = (name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `std_${cleanName}_${grade}`;
};

const LUCKY_TASKS = {
  primary: [
    { text: "En sevdiğin hikaye kitabını 15 dk oku. 📚", color: "bg-pink-100 border-pink-300 text-pink-700" },
    { text: "10 tane matematik işlemi çöz (kağıttan). ✏️", color: "bg-blue-100 border-blue-300 text-blue-700" },
    { text: "Odanı topla ve masanı düzenle. 🧹", color: "bg-green-100 border-green-300 text-green-700" }
  ],
  middle: [
    { text: "Bugün çözemediğin 3 soruyu tekrar et. 🔄", color: "bg-purple-100 border-purple-300 text-purple-700" },
    { text: "20 sayfa kitap oku ve özetini düşün. 🧠", color: "bg-orange-100 border-orange-300 text-orange-700" },
    { text: "Matematikten bir formülü ezberle. 📐", color: "bg-indigo-100 border-indigo-300 text-indigo-700" }
  ]
};

// --- ANA UYGULAMA ---
export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [curriculum, setCurriculum] = useState(DEFAULT_CURRICULUM);
  const [announcementData, setAnnouncementData] = useState(null);
  const [dailyQuestion, setDailyQuestion] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      if (!auth.currentUser) { try { await signInAnonymously(auth); } catch (e) { console.error(e); } }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'artifacts', APP_ID, 'settings', 'curriculum');
    const unsubCurriculum = onSnapshot(docRef, (snap) => {
      if (snap.exists()) setCurriculum(snap.data());
    }, (error) => console.log("Curriculum Error", error));

    const annRef = doc(db, 'artifacts', APP_ID, 'settings', 'announcement');
    const unsubAnnounce = onSnapshot(annRef, (snap) => {
      if (snap.exists()) setAnnouncementData(snap.data());
    }, (error) => console.log("Announce Error", error));

    const qRef = doc(db, 'artifacts', APP_ID, 'settings', 'dailyQuestion');
    const unsubQ = onSnapshot(qRef, (snap) => {
      if (snap.exists()) setDailyQuestion(snap.data());
    }, (error) => console.log("Question Error", error));

    return () => { unsubCurriculum(); unsubAnnounce(); unsubQ(); };
  }, [user]);

  const handleLogout = () => { setRole(null); setStudentName(''); setStudentGrade(''); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        <header className="bg-indigo-600 text-white p-4 pt-8 sticky top-0 z-30 shadow-md flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><Trophy className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-lg font-bold">Kamp Takip</h1>
              <p className="text-xs opacity-80">Eğitim Koçu</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!role && <button onClick={() => setShowInstallModal(true)} className="flex items-center text-xs bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-full"><Download className="w-3 h-3 mr-2" />Yükle</button>}
            <button onClick={() => setShowGuide(true)} className="p-1.5 bg-indigo-500 rounded-full hover:bg-indigo-400"><HelpCircle className="w-4 h-4 text-white" /></button>
            {role && <button onClick={handleLogout} className="p-1.5 bg-indigo-700 rounded hover:bg-red-500"><LogOut className="w-4 h-4" /></button>}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 bg-slate-50">
          {!user || !role ? (
            <LoginScreen setRole={setRole} studentName={studentName} setStudentName={setStudentName} studentGrade={studentGrade} setStudentGrade={setStudentGrade} />
          ) : role === 'student' ? (
            <StudentApp user={user} studentName={studentName} grade={parseInt(studentGrade)} curriculum={curriculum} announcementData={announcementData} dailyQuestion={dailyQuestion} />
          ) : (
            <TeacherApp user={user} curriculum={curriculum} currentAnnouncementData={announcementData} />
          )}
        </main>

        {showInstallModal && <InstallGuideModal onClose={() => setShowInstallModal(false)} />}
        {showGuide && <AppGuideModal onClose={() => setShowGuide(false)} />}
      </div>
    </div>
  );
}

// --- EKRANLAR ---

function LoginScreen({ setRole, studentName, setStudentName, studentGrade, setStudentGrade }) {
  const [activeTab, setActiveTab] = useState('student');
  const [pass, setPass] = useState('');

  const handleLogin = (r) => {
    if (r === 'student') {
      if (!studentName.trim() || !studentGrade) return alert('Lütfen bilgileri doldur.');
      setRole('student');
    }
    else {
      if (pass !== TEACHER_PASS) {
        setPass(''); 
        return alert('Şifre Yanlış! Lütfen tekrar deneyin.');
      }
      setRole('teacher');
    }
  };

  return (
    <div className="p-6 flex flex-col h-full justify-center bg-white">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Hoşgeldiniz 👋</h2>
        <p className="text-slate-500 text-sm">Başlamak için lütfen giriş yapın.</p>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
        <button onClick={() => { setActiveTab('student'); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Öğrenci</button>
        <button onClick={() => { setActiveTab('teacher'); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Öğretmen</button>
      </div>

      {activeTab === 'student' ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ad Soyad</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
              <input value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full p-3 pl-10 rounded-lg border text-sm" placeholder="Ad Soyad" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Sınıf</label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(g => <button key={g} onClick={() => setStudentGrade(String(g))} className={`py-2 rounded-lg text-sm font-bold ${String(g) === studentGrade ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>{g}</button>)}
            </div>
          </div>
          <button onClick={() => handleLogin('student')} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2">Başla</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Şifre</label>
            <div className="relative mt-1">
              <LockKeyhole className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
              <input value={pass} onChange={e => setPass(e.target.value)} type="password" className="w-full p-3 pl-10 rounded-lg border text-sm" placeholder="Öğretmen şifresi" />
            </div>
          </div>
          <button onClick={() => handleLogin('teacher')} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2">Giriş Yap</button>
        </div>
      )}
    </div>
  );
}

function StudentApp({ user, studentName, grade, curriculum, announcementData, dailyQuestion }) {
  const [activeTab, setActiveTab] = useState('home');
  const [data, setData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const docId = generateStudentId(studentName, grade);

  const studentGradeStr = grade.toString();
  const myCurriculum = safeArray(curriculum?.[studentGradeStr] || []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) { setData(docSnap.data()); }
      else {
        const newData = { name: studentName, grade: grade, createdAt: serverTimestamp(), days: {} };
        setDoc(docRef, newData, { merge: true }).catch(e => console.error(e));
        setData(newData);
      }
    });
    return () => unsubscribe();
  }, [user, docId, studentName, grade]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', docId);
    await setDoc(docRef, { studentMessage: messageText, studentMessageTime: serverTimestamp() }, { merge: true });
    alert("Mesajınız iletildi.");
    setMessageText("");
    setShowMsgModal(false);
  };

  const saveDayData = async (day, dayData) => {
    setData(prev => ({ ...prev, days: { ...prev.days, [day]: dayData } }));
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', docId);
    await setDoc(docRef, { days: { [day]: dayData }, lastUpdated: serverTimestamp() }, { merge: true });
    setSelectedDay(null);
    alert('Kayıt başarılı!');
  };

  if (!data) return <div className="p-8 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />Veriler Hazırlanıyor...</div>;

  return (
    <>
      <div className="p-4 space-y-6 pb-24">
        {activeTab === 'home' && <HomeView data={data} grade={grade} studentName={studentName} curriculum={myCurriculum} announcementData={announcementData} dailyQuestion={dailyQuestion} studentId={docId} onOpenMsg={() => setShowMsgModal(true)} />}
        {activeTab === 'calendar' && <CalendarView data={data} onDayClick={setSelectedDay} />}
        {activeTab === 'badges' && <BadgesView data={data} grade={grade} />}
      </div>

      {selectedDay && <DayEditModal day={selectedDay} curriculum={myCurriculum} initialData={data.days?.[selectedDay]} onClose={() => setSelectedDay(null)} onSave={saveDayData} />}

      {showMsgModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4">
            <h3 className="font-bold text-lg mb-2">Öğretmene Mesaj</h3>
            <textarea className="w-full p-2 border rounded-lg mb-4 text-sm" rows="4" placeholder="Mesajınızı yazın..." value={messageText} onChange={e => setMessageText(e.target.value)}></textarea>
            <div className="flex gap-2">
              <button onClick={() => setShowMsgModal(false)} className="flex-1 bg-slate-200 py-2 rounded-lg font-bold text-slate-600">İptal</button>
              <button onClick={handleSendMessage} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold">Gönder</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around items-center z-40 w-full max-w-md mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <NavButton icon={Home} label="Ana Sayfa" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavButton icon={Calendar} label="Program" isActive={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
        <NavButton icon={Award} label="Rozetler" isActive={activeTab === 'badges'} onClick={() => setActiveTab('badges')} />
      </div>
    </>
  );
}

const NavButton = ({ icon: Icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center p-2 rounded-lg transition ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
    <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

function BadgesView({ data, grade }) {
  const validBadges = BADGE_DEFINITIONS.filter(b => grade >= b.minGrade);
  const earnedCount = validBadges.filter(b => b.check(data.days || {})).length;
  const totalCount = validBadges.length;
  const progress = totalCount === 0 ? 0 : Math.round((earnedCount / totalCount) * 100);

  return (
    <div className="pb-16 animate-in slide-in-from-bottom-4 duration-500 p-4">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-3xl text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center"><Trophy className="w-6 h-6 mr-2" /> Rozet Koleksiyonum</h2>
          <div className="mt-4">
            <div className="flex justify-between text-sm font-bold mb-1"><span>İlerleme</span><span>{earnedCount}/{totalCount}</span></div>
            <div className="w-full bg-black/20 rounded-full h-3"><div className="bg-white h-3 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {['bronz', 'gumus', 'altin', 'imkansiz'].map(tier => {
          const tierBadges = validBadges.filter(b => b.tier === tier);
          if (tierBadges.length === 0) return null;

          let tierTitle = tier === 'bronz' ? 'Bronz (Başlangıç)' :
            tier === 'gumus' ? 'Gümüş (Orta Seviye)' :
              tier === 'altin' ? 'Altın (Zor)' : 'EFSANEVİ (İmkansız)';
          
          let tierColor = tier === 'imkansiz' ? 'border-purple-300 bg-purple-50' : 'border-slate-100';

          return (
            <div key={tier} className={`rounded-2xl border p-4 ${tierColor}`}>
              <h3 className="font-bold text-slate-700 uppercase text-xs mb-3 tracking-wider">{tierTitle}</h3>
              <div className="grid grid-cols-2 gap-3">
                {tierBadges.map(badge => {
                  const isEarned = badge.check(data.days || {});
                  return (
                    <div key={badge.id} className={`bg-white p-3 rounded-xl border flex flex-col items-center text-center shadow-sm transition-all ${isEarned ? 'border-green-400 bg-green-50' : 'border-slate-100 opacity-80'}`}>
                      <div className={`p-3 rounded-full mb-2 ${isEarned ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        {badge.emoji ? <span className="text-2xl">{badge.emoji}</span> : <badge.icon className="w-6 h-6" />}
                      </div>
                      <div className="font-bold text-xs text-slate-800">{badge.title}</div>
                      <div className="text-[9px] text-slate-500 mt-1 leading-tight">{badge.desc}</div>
                      {isEarned ? <div className="mt-2 bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center"><Check className="w-3 h-3 mr-1" /> Kazandı</div> : 
                      <div className="mt-2 text-slate-300 text-[10px]"><LockKeyhole className="w-3 h-3 mx-auto" /></div>
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

function HomeView({ data, grade, studentName, curriculum, announcementData, dailyQuestion, studentId, onOpenMsg }) {
  const completedCount = Object.keys(data.days || {}).length;
  const percentage = Math.round((completedCount / TOTAL_DAYS) * 100);
  const [advice, setAdvice] = useState("");
  const [greeting, setGreeting] = useState("");

  let totalQuestions = 0;
  Object.values(data.days || {}).forEach(day => {
    Object.keys(day).forEach(key => { if (key.endsWith('True')) totalQuestions += parseInt(day[key] || 0); });
  });

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Günaydın" : hour < 18 ? "Tünaydın" : "İyi Akşamlar");
    const days = Object.keys(data.days || {}).map(Number).sort((a, b) => b - a);
    const lastDay = days.length > 0 ? data.days[days[0]] : null;
    if (lastDay) {
      setAdvice(ADVICE_POOL.general[Math.floor(Math.random() * ADVICE_POOL.general.length)]);
    } else {
      setAdvice("Program sekmesine gidip 1. Günü seç, maceraya başla! 👋");
    }
  }, [data]);

  const showAnnouncement = announcementData && isContentValid(announcementData.timestamp);
  const showTeacherNote = data.teacherMessage && isContentValid(data.teacherMessageTime);
  const safeCurriculum = safeArray(curriculum);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-2">
      {(grade === 7 || grade === 8) && <LGSCountdown grade={grade} />}

      {showAnnouncement && <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-pulse"><Bell className="w-5 h-5 text-red-600 flex-shrink-0" /><div><div className="font-bold text-sm text-red-700">Duyuru</div><div className="text-xs text-red-600 mt-1">{announcementData.text}</div></div></div>}

      <LuckyTaskCard grade={grade} />
      
      <DailyQuestionCard questionData={dailyQuestion} grade={grade} studentId={studentId} />

      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">{greeting},</p>
              <h2 className="text-3xl font-bold mb-4">{(studentName || '').split(' ')[0] || 'Öğrenci'} 🚀</h2>
            </div>
            <button onClick={onOpenMsg} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg backdrop-blur-sm transition"><Send className="w-5 h-5 text-white" /></button>
          </div>

          <div className="flex justify-between items-end">
            <div><div className="text-4xl font-bold">{percentage}%</div><div className="text-xs text-indigo-100 opacity-80 mt-1">Kamp Tamamlandı</div></div>
            <div className="h-14 w-14 rounded-full border-4 border-white/20 flex items-center justify-center font-bold text-lg bg-white/10 backdrop-blur-md">{completedCount}/{TOTAL_DAYS}</div>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2 mt-4"><div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div></div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center"><Target className="w-5 h-5 mr-2 text-indigo-600" /> Günlük Hedeflerim</h3>
        <div className="grid grid-cols-2 gap-3">
          {safeCurriculum.length > 0 ? safeCurriculum.map((item, idx) => {
            const meta = getSubjectInfo(item);
            const isDuration = meta.type === 'duration';
            return (
              <div key={idx} className={`relative p-3 rounded-2xl border flex flex-col justify-between h-24 shadow-sm overflow-hidden ${isDuration ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                <meta.icon className={`absolute -right-2 -bottom-2 w-16 h-16 opacity-10 ${isDuration ? 'text-orange-500' : 'text-slate-500'}`} />
                <div className="flex justify-between items-start z-10">
                  <div className={`p-1.5 rounded-lg ${isDuration ? 'bg-orange-100 text-orange-600' : 'bg-white text-slate-600 shadow-sm'}`}>
                    <meta.icon className="w-4 h-4" />
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDuration ? 'bg-orange-200 text-orange-800' : 'bg-slate-200 text-slate-600'}`}>
                    {isDuration ? 'Süre' : 'Soru'}
                  </div>
                </div>
                <div className="z-10">
                  <div className="font-bold text-xs text-slate-800 line-clamp-1">{meta.label}</div>
                  <div className="text-lg font-black text-slate-900 flex items-baseline">
                    {item.target} 
                    <span className="text-[10px] font-normal text-slate-500 ml-1">{isDuration ? 'dk' : 'adet'}</span>
                  </div>
                </div>
              </div>
            )
          }) : <div className="col-span-2 text-center text-xs text-slate-400 py-4">Henüz bir program atanmamış.</div>}
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm"><ImageIcon className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1"/><div><h4 className="font-bold text-slate-800 text-sm">Öğretmen Diyor Ki:</h4><p className="text-sm text-slate-600 mt-1">{advice}</p></div></div>

      {showTeacherNote && (<div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm flex gap-3"><MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" /><div><h4 className="font-bold text-slate-800">Öğretmen Notu</h4><p className="text-sm text-slate-600">{data.teacherMessage}</p></div></div>)}
    </div>
  );
}

function CalendarView({ data, onDayClick }) {
  return (
    <div className="pb-16 animate-in slide-in-from-bottom-4 duration-500 p-4">
      <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-indigo-600" />Takvimim</h3>
      <div className="grid grid-cols-3 gap-3">
        {DAYS_ARRAY.map(day => {
          const isDone = !!data.days?.[day];
          return (
            <button key={day} onClick={() => onDayClick(day)} className={`p-3 rounded-xl border-2 text-left transition transform active:scale-95 ${isDone ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-100'}`}>
              <span className={`text-sm font-bold block ${isDone ? 'text-indigo-700' : 'text-slate-400'}`}>{day}. Gün</span>
              <div className="mt-2 flex justify-end">{isDone ? <CheckCircle2 className="w-4 h-4 text-indigo-600" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}</div>
            </button>
          )
        })}
      </div>
    </div>
  );
}

// --- TEACHER APP ---
function TeacherApp({ user, curriculum, currentAnnouncementData }) {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingProgram, setIsEditingProgram] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState(currentAnnouncementData?.text || "");
  const [questionText, setQuestionText] = useState("");
  const [targetGrade, setTargetGrade] = useState("all");
  const [questionImage, setQuestionImage] = useState(null);
  const [questionType, setQuestionType] = useState("text");
  const [correctOption, setCorrectOption] = useState("A");

  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', APP_ID, 'public_data');
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (parseInt(a.grade) || 0) - (parseInt(b.grade) || 0) || (a.name || '').localeCompare(b.name || ''));
      setStudents(list);
    });
    return () => unsub();
  }, [user]);

  const handleSaveAnnouncement = async () => {
    await setDoc(doc(db, 'artifacts', APP_ID, 'settings', 'announcement'), { text: newAnnouncement, timestamp: serverTimestamp() });
    alert("Duyuru yayınlandı (24 saat geçerli).");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await compressImage(file);
      setQuestionImage(base64);
    }
  };

  const handleSendQuestion = async () => {
    await setDoc(doc(db, 'artifacts', APP_ID, 'settings', 'dailyQuestion'), {
      text: questionText,
      image: questionImage,
      targetGrade: targetGrade,
      type: questionType,
      correctOption: questionType === 'test' ? correctOption : null,
      timestamp: serverTimestamp()
    });
    alert("Soru gönderildi!");
    setQuestionText("");
    setQuestionImage(null);
  };

  const deleteStudent = async (studentId) => {
    if (window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public_data', studentId));
      alert("Öğrenci silindi.");
    }
  };

  const filteredStudents = students.filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const totalStudents = students.length;
  const activeToday = students.filter(s => s.lastUpdated && isContentValid(s.lastUpdated)).length;

  if (isEditingProgram) return <ProgramEditorModal curriculum={curriculum} onClose={() => setIsEditingProgram(false)} />;

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-xl mb-1">Öğretmen Paneli</h2>
            <div className="flex gap-4 mt-2 text-sm">
              <div><span className="block text-xl font-bold">{totalStudents}</span><span className="text-xs opacity-80">Toplam</span></div>
              <div><span className="block text-xl font-bold">{activeToday}</span><span className="text-xs opacity-80">Bugün Aktif</span></div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setIsEditingProgram(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center transition"><Star className="w-4 h-4 mr-2" /> Programı Düzenle</button>
            <button onClick={() => exportToCSV(students)} className="bg-white text-slate-800 px-3 py-2 rounded-lg text-xs font-bold">CSV Dışa Aktar</button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center"><Bell className="w-3 h-3 mr-2" /> Duyuru Panosu</h3>
          <div className="flex gap-2">
            <input className="flex-1 text-sm p-2 border rounded-lg outline-none" value={newAnnouncement} onChange={(e) => setNewAnnouncement(e.target.value)} placeholder="Duyuru metni..." />
            <button onClick={handleSaveAnnouncement} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Yayınla</button>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 italic">*Duyurular 24 saat sonra otomatik silinir.</div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center"><HelpCircle className="w-3 h-3 mr-2" /> Günün Sorusu</h3>
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex gap-2">
              <select className="text-xs p-2 border rounded-lg bg-white" value={targetGrade} onChange={e => setTargetGrade(e.target.value)}>
                <option value="all">Tüm Sınıflar</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(g => <option key={g} value={String(g)}> {g}. Sınıf</option>)}
              </select>
              <input className="flex-1 text-sm p-2 border rounded-lg outline-none" placeholder="Soru metni..." value={questionText} onChange={e => setQuestionText(e.target.value)} />
            </div>
            <div className="flex gap-2 items-center">
              <select className="text-xs p-2 border rounded-lg bg-white" value={questionType} onChange={e => setQuestionType(e.target.value)}>
                <option value="text">Klasik</option>
                <option value="test">Test</option>
              </select>
              {questionType === 'test' && (<select className="text-xs p-2 border rounded-lg bg-white" value={correctOption} onChange={e => setCorrectOption(e.target.value)}><option>A</option><option>B</option><option>C</option><option>D</option></select>)}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center justify-center bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer">Resim Yükle
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {questionImage && <div className="text-xs text-slate-500">Resim seçildi</div>}
            </div>
          </div>
          <button onClick={handleSendQuestion} className="w-full bg-violet-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Soruyu Gönder</button>
        </div>
      </div>

      <div className="relative">
        <div className="relative">
          <input className="w-full p-3 pl-10 rounded-lg border text-sm" placeholder="Öğrenci ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <SearchIconPlaceholder />
        </div>
      </div>

      <div className="space-y-3">
        {filteredStudents.map(std => <StudentDetailRow key={std.id} student={std} onDelete={deleteStudent} curriculum={curriculum?.[std.grade] || DEFAULT_CURRICULUM[7]} />)}
      </div>
    </div>
  )
}

function SearchIconPlaceholder() {
  return <div style={{ position: 'absolute', left: 12, top: 12 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>;
}

function ProgramEditorModal({ curriculum, onClose }) {
  const [selectedGrade, setSelectedGrade] = useState("7");
  const [localCurriculum, setLocalCurriculum] = useState(curriculum || DEFAULT_CURRICULUM);
  const [newItem, setNewItem] = useState({ id: 'mat', target: 50, customLabel: '', type: 'question' });

  const handleSubjectChange = (val) => {
    const meta = SUBJECT_METADATA[val];
    setNewItem(prev => ({
      ...prev,
      id: val,
      type: (val === 'kitap' || val === 'konu') ? 'duration' : 'question',
      customLabel: '' 
    }));
  };

  const handleAddItem = () => {
    setLocalCurriculum(prev => ({
      ...prev,
      [selectedGrade]: [...(prev[selectedGrade] || []), newItem]
    }));
    setNewItem({ id: 'mat', target: 50, customLabel: '', type: 'question' });
  };

  const handleRemoveItem = (index) => {
    setLocalCurriculum(prev => {
      const newList = [...(prev[selectedGrade] || [])];
      newList.splice(index, 1);
      return { ...prev, [selectedGrade]: newList };
    });
  };

  const handleSave = async () => {
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'settings', 'curriculum');
      await setDoc(docRef, localCurriculum);
      alert('Genel program güncellendi!');
      onClose();
    } catch (e) {
      console.error(e);
      alert("Kayıt hatası.");
    }
  };

  const currentList = localCurriculum[selectedGrade] || [];

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      <button onClick={onClose} className="mb-4 text-slate-500 flex items-center text-sm font-bold"><ChevronDown className="rotate-90 mr-1 w-4 h-4" /> Geri Dön</button>
      <h2 className="text-xl font-bold text-slate-800 mb-4">Program ve Hedefler</h2>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
        <label className="text-xs font-bold text-slate-500 uppercase">Sınıf Seç</label>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(g => <button key={g} onClick={() => setSelectedGrade(String(g))} className={`py-2 px-3 rounded ${String(g) === selectedGrade ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>{g}</button>)}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-700 mb-2">Çalışma Ekle</h3>
        
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400">Kategori</label>
          <select className="w-full p-2 border rounded-lg text-sm" value={newItem.id} onChange={e => handleSubjectChange(e.target.value)}>
            {Object.keys(SUBJECT_METADATA).map(k => <option key={k} value={k}>{SUBJECT_METADATA[k].label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400">Etiket / Açıklama (İsteğe Bağlı)</label>
          <input 
            className="w-full p-2 border rounded-lg text-sm" 
            placeholder='Örn: "Matematik Konu" veya "Geometri"' 
            value={newItem.customLabel} 
            onChange={e => setNewItem(prev => ({ ...prev, customLabel: e.target.value }))} 
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Hedef</label>
            <input className="w-full p-2 border rounded-lg" type="number" value={newItem.target} onChange={e => setNewItem(prev => ({ ...prev, target: Number(e.target.value) }))} />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Birim</label>
            <select className="w-full p-2 border rounded-lg text-sm bg-slate-50" value={newItem.type} onChange={e => setNewItem(prev => ({ ...prev, type: e.target.value }))}>
              <option value="question">Soru Sayısı</option>
              <option value="duration">Süre (Dk)</option>
            </select>
          </div>
        </div>

        <button onClick={handleAddItem} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-2">Listeye Ekle</button>
      </div>

      <div className="space-y-2 mb-20">
        <label className="text-xs font-bold text-slate-500 uppercase px-2">Eklenen Hedefler</label>
        {currentList.length === 0 && <div className="p-4 text-center text-slate-400 text-sm italic">Bu sınıf için henüz hedef eklenmemiş.</div>}
        {currentList.map((item, idx) => {
          const meta = getSubjectInfo(item);
          return (
            <div key={idx} className="bg-white p-3 rounded-lg border flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-${meta.color || 'slate'}-100`}>
                  <meta.icon className={`w-5 h-5 text-${meta.color || 'slate'}-600`} />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">{meta.label}</div>
                  <div className="text-xs text-slate-500 font-medium">Hedef: {item.target} {item.type === 'duration' ? 'dk' : 'soru'}</div>
                </div>
              </div>
              <button onClick={() => handleRemoveItem(idx)} className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100"><X className="w-4 h-4"/></button>
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg">Programı Kaydet</button>
      </div>
    </div>
  );
}

function StudentDetailRow({ student, onDelete, curriculum }) {
  const [expanded, setExpanded] = useState(false);
  const [msg, setMsg] = useState(student.teacherMessage || '');
  
  // -- YENİ: MODAL STATE'LERİ --
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportNote, setReportNote] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const completed = Object.keys(student.days || {}).length;
  const pct = Math.round((completed / TOTAL_DAYS) * 100);

  let rowColor = "bg-white border-slate-200";
  if (pct < 20) rowColor = "bg-red-50 border-red-200";
  else if (pct > 80) rowColor = "bg-green-50 border-green-200";

  const sendFeedback = async () => {
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', student.id);
    await setDoc(docRef, { teacherMessage: msg, teacherMessageTime: serverTimestamp() }, { merge: true });
    alert('Mesaj gönderildi.');
  };

  const handleOpenReportModal = () => {
    setReportNote(student.teacherMessage || "Başarılarının devamını dilerim!");
    setShowReportModal(true);
  };

  const handleGenerateReport = () => {
    const reportCurriculum = curriculum || DEFAULT_CURRICULUM[7];
    generateReportCard(student, reportCurriculum, reportNote);
    setShowReportModal(false);
  };

  const stats = {};
  const activeCurriculum = safeArray(curriculum);

  activeCurriculum.forEach(item => { 
    const meta = getSubjectInfo(item);
    stats[meta.label] = { 
        label: meta.label, 
        val: 0, 
        unit: meta.type === 'duration' ? 'dk' : 'soru' 
    }; 
  });

  Object.values(student.days || {}).forEach(day => {
    activeCurriculum.forEach(item => {
        const key = item.id;
        const meta = getSubjectInfo(item);
        const statKey = meta.label; 

        if (meta.type === 'question') {
            const t = parseInt(day[key + 'True'] || 0);
            const f = parseInt(day[key + 'False'] || 0);
            stats[statKey].val += (t + f); // TOPLAM (D+Y) OLARAK DÜZELTİLDİ
        } else {
            if (day[key + 'Duration']) stats[statKey].val += parseInt(day[key + 'Duration'] || 0);
        }
    });
  });

  const hasStudentMessage = student.studentMessage && isContentValid(student.studentMessageTime);

  return (
    <div className={`border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition ${rowColor}`}>
      <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 w-full">
          <div className="bg-white border w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-600 flex-shrink-0 shadow-sm">{student.grade}</div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-slate-800 flex items-center">
                {student.name}
                {hasStudentMessage && <div className="ml-2 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse">1 Mesaj</div>}
              </h4>
              <span className="text-xs font-bold text-slate-500">%{pct}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1"><div className={`h-1.5 rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }}></div></div>
          </div>
        </div>
        {expanded ? <ChevronUp className="text-slate-400 w-5 h-5 ml-3" /> : <ChevronDown className="text-slate-400 w-5 h-5 ml-3" />}
      </div>
      {expanded && (
        <div className="bg-slate-50 p-4 border-t border-slate-100 space-y-4">
          {hasStudentMessage && (<div className="bg-white p-3 rounded-lg border border-blue-200 flex gap-2"><MessageSquare className="w-5 h-5 text-blue-500 mt-1" /><div><span className="text-xs font-bold">Öğrenciden Mesaj</span><div className="text-sm text-slate-700 mt-1">{student.studentMessage}</div></div></div>)}
          <div className="flex gap-2">
            <button onClick={handleOpenReportModal} className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center hover:bg-orange-600 transition"><Palette className="w-4 h-4 mr-2"/> Karne Oluştur</button>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Toplam İstatistikler</h5>
            <div className="grid grid-cols-2 gap-2">
                {Object.values(stats).map((stat, i) => (
                    <div key={i} className="bg-slate-50 p-2 rounded flex justify-between items-center border border-slate-100">
                        <div className="text-xs truncate mr-2" title={stat.label}>{stat.label}</div>
                        <div className="text-sm font-bold whitespace-nowrap">{stat.val} {stat.unit}</div>
                    </div>
                ))}
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Geçmiş Günler</h5>
            <div className="space-y-2">
              {DAYS_ARRAY.map(day => {
                const dayData = student.days?.[day];
                if (!dayData) return null;
                const filledKeys = Object.keys(dayData).filter(k => (k.endsWith('True') && parseInt(dayData[k]) > 0) || (k.endsWith('Duration') && parseInt(dayData[k]) > 0));
                if (filledKeys.length === 0) return null;

                return (
                  <div key={day} className="text-xs border-b border-slate-100 last:border-0 pb-2 mb-2">
                    <div className="font-bold text-indigo-600 mb-1">{day}. Gün Özeti:</div>
                    <div className="flex flex-col gap-1">
                      {Object.keys(SUBJECT_METADATA).map((subjKey) => {
                         const meta = SUBJECT_METADATA[subjKey];
                         if (meta.type === 'question') {
                           const correct = dayData[subjKey + 'True'];
                           const wrong = dayData[subjKey + 'False'];
                           if (correct || wrong) {
                             return <span key={subjKey} className="flex items-center text-slate-700"><CheckCircle2 className="w-3 h-3 text-green-500 mr-1" /> {meta.label}: {correct || 0} ✅ / {wrong || 0} ❌</span>
                           }
                         } else {
                           const duration = dayData[subjKey + 'Duration'];
                           if (duration) {
                             return <span key={subjKey} className="flex items-center text-slate-700"><CheckCircle2 className="w-3 h-3 text-green-500 mr-1" /> {meta.label}: {duration} dk</span>
                           }
                         }
                         return null;
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex gap-2 mb-2"><input className="flex-1 text-sm p-2 border rounded-lg outline-none focus:border-slate-400" placeholder="Öğrenciye not..." value={msg} onChange={e => setMsg(e.target.value)} /></div>
            <div className="flex gap-2">
              <button onClick={sendFeedback} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-xs">Not Gönder</button>
              <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 text-red-500 text-xs font-bold py-2 border border-red-200 rounded-lg hover:bg-red-50 transition">Öğrenciyi Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* KARNE OLUŞTURMA MODALI */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center"><Palette className="w-5 h-5 mr-2 text-indigo-600"/> Karne Oluştur</h3>
            <p className="text-sm text-slate-500 mb-4">Öğrencinin karnesine eklenecek görüşünüzü yazın.</p>
            <textarea 
              className="w-full p-3 border rounded-xl text-sm min-h-[100px] mb-4 focus:ring-2 focus:ring-indigo-200 outline-none" 
              placeholder="Örn: Harika bir kamp dönemi geçirdin..." 
              value={reportNote} 
              onChange={e => setReportNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowReportModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">İptal</button>
              <button onClick={handleGenerateReport} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition">Karnedeyi İndir</button>
            </div>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-600"/></div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Emin misiniz?</h3>
            <p className="text-sm text-slate-500 mb-6">Bu öğrenciyi ve tüm verilerini silmek üzeresiniz. Bu işlem geri alınamaz.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">Vazgeç</button>
              <button onClick={() => onDelete(student.id)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-red-700 transition">Evet, Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LGSCountdown({ grade }) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const targetDate = grade === 8 ? LGS_DATE_2026 : LGS_DATE_2027;
      const difference = targetDate - now;
      if (difference > 0) {
        setTimeLeft({
          gün: Math.floor(difference / (1000 * 60 * 60 * 24)),
          saat: Math.floor((difference / (1000 * 60 * 60)) % 24),
          dk: Math.floor((difference / 1000 / 60) % 60),
          sn: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ gün: 0, saat: 0, dk: 0, sn: 0 });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [grade]);

  return (
    <div className="bg-slate-800 text-white rounded-xl p-3 mb-4 shadow-lg flex items-center justify-between">
      <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-400" /><span className="text-xs font-bold uppercase tracking-wider text-slate-300">{grade === 8 ? "LGS 2026'ya Kalan Süre" : "LGS 2027'ye Kalan Süre"}</span></div>
      <div className="flex gap-2 text-center text-xs">
        {['gün', 'saat', 'dk', 'sn'].map((unit, i) => {
          const keys = ['gün', 'saat', 'dk', 'sn'];
          return (<div key={unit} className="bg-slate-700 px-2 py-1 rounded"><div className="font-mono font-bold text-sm">{timeLeft[keys[i]] ?? 0}</div><div className="text-[10px] opacity-80">{unit}</div></div>)
        })}
      </div>
    </div>
  );
}

function LuckyTaskCard({ grade }) {
  const [task, setTask] = useState(null);
  const getTask = () => {
    const pool = grade <= 4 ? LUCKY_TASKS.primary : LUCKY_TASKS.middle;
    const randomTask = pool[Math.floor(Math.random() * pool.length)];
    setTask(randomTask);
  };
  useEffect(() => { getTask(); }, [grade]);
  
  if (!task) return null;

  return (
    <div className={`p-5 rounded-2xl shadow-sm border relative overflow-hidden ${task.color}`}>
      <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
        <Star className="w-24 h-24" />
      </div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center"><Zap className="w-3 h-3 mr-1"/> Günün Özel Görevi</div>
          <div className="text-sm font-bold leading-relaxed pr-4">{task.text}</div>
        </div>
        <button onClick={getTask} className="bg-white/50 hover:bg-white/80 p-2 rounded-lg transition backdrop-blur-sm"><List className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function DailyQuestionCard({ questionData, grade, studentId }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { setSubmitted(false); setResult(null); setAnswer(''); }, [questionData]);

  const handleSubmit = async () => {
    if (!questionData) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', studentId);
    const payload = {};
    payload.dailyAnswer = answer;
    payload.dailyAnswerTime = serverTimestamp();
    await setDoc(docRef, payload, { merge: true });
    setSubmitted(true);
    if (questionData.correctOption) {
      setResult(answer.trim().toUpperCase() === (questionData.correctOption || '').trim().toUpperCase());
    }
    alert("Cevap kaydedildi.");
  };

  if (!questionData) return null;
  if (questionData.targetGrade && questionData.targetGrade !== 'all' && Number(questionData.targetGrade) !== grade) return null;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-sm">Günün Sorusu</div>
          <div className="text-xs text-slate-600 mt-1">{questionData.text}</div>
        </div>
        {questionData.image && <img src={questionData.image} alt="soru" className="w-16 h-16 object-cover rounded" />}
      </div>
      {questionData.type === 'test' ? (
        <div className="flex gap-2 mb-2">
          {['A', 'B', 'C', 'D'].map(opt => <button key={opt} onClick={() => setAnswer(opt)} className={`flex-1 p-2 rounded ${answer === opt ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>{opt}</button>)}
        </div>
      ) : (
        <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={3} className="w-full p-2 border rounded mb-2"></textarea>
      )}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={submitted} className="flex-1 bg-indigo-600 text-white py-2 rounded">{submitted ? 'Gönderildi' : 'Cevapla'}</button>
        {result !== null && <div className={`px-3 py-2 rounded ${result ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{result ? 'Doğru' : 'Yanlış'}</div>}
      </div>
    </div>
  )
}

function AppGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 h-[80vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-600" /></button>
        <div className="text-center mb-6">
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"><Phone className="w-8 h-8 text-indigo-600" /></div>
          <h3 className="font-bold text-lg">Uygulama Rehberi</h3>
          <p className="text-sm text-slate-500 mt-2">Sistemi en verimli nasıl kullanırsın?</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <h4 className="font-bold text-indigo-600 mb-2 flex items-center"><Calendar className="w-4 h-4 mr-2"/> Veri Girişi</h4>
            <p className="text-sm text-slate-600">Her gün "Program" sekmesine git ve o günün kutusuna tıkla. Öğretmeninin belirlediği hedeflere göre soru sayısı veya süre girip kaydet. Yeşil tik çıktığında işlem tamamdır! ✅</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <h4 className="font-bold text-indigo-600 mb-2 flex items-center"><Trophy className="w-4 h-4 mr-2"/> Rozetler ve Seviyeler</h4>
            <p className="text-sm text-slate-600">Veri girdikçe Bronz, Gümüş ve Altın rozetler kazanırsın. En zoru "Efsanevi" rozetlerdir. Sadece en disiplinli öğrenciler kazanabilir!</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <h4 className="font-bold text-indigo-600 mb-2 flex items-center"><MessageSquare className="w-4 h-4 mr-2"/> İletişim</h4>
            <p className="text-sm text-slate-600">Ana sayfadaki mesaj ikonuna tıklayarak öğretmenine not bırakabilirsin. Öğretmeninin sana yazdığı notlar da ana sayfada görünür (24 saat boyunca).</p>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-6">Anladım, Başlayalım!</button>
      </div>
    </div>
  );
}

function DayEditModal({ day, curriculum, initialData, onClose, onSave }) {
  const [form, setForm] = useState(initialData || {});
  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const safeCurriculum = safeArray(curriculum);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold">{day}. Gün Girişi</h3><button onClick={onClose}><X className="w-6 h-6" /></button></div>
        <div className="overflow-y-auto p-4 space-y-4">
          {safeCurriculum.map((item, idx) => {
            const meta = getSubjectInfo(item);
            const key = item.id;

            if (meta.type === 'selection') {
              return (
                <div key={idx} className={`p-3 rounded-xl border ${form[key] ? 'bg-purple-50 border-purple-200' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2 mb-2"><div className={`w-5 h-5 rounded border flex items-center justify-center ${form[key] ? 'bg-purple-500 border-purple-500' : 'bg-white'}`}></div><div className="font-bold text-sm">{meta.label}</div></div>
                  <div className="flex flex-col gap-2">
                    <select className="w-full p-2 border rounded-lg text-sm bg-white outline-none" value={form[key] || ""} onChange={(e) => handleChange(key, e.target.value)}>
                      <option value="">Seçiniz</option>
                      {meta.options?.map((op, i) => <option key={i} value={op}>{op}</option>)}
                    </select>
                    <input className="w-full p-2 border rounded-lg text-sm" placeholder="Süre (dk) isteğe bağlı" value={form[key + 'Duration'] || ''} onChange={(e) => handleChange(key + 'Duration', e.target.value)} />
                  </div>
                </div>
              );
            }
            if (meta.type === 'duration') {
              return (
                <div key={idx} onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))} className={`flex items-center gap-3 p-3 rounded-xl border ${form[key] ? 'bg-green-50 border-green-200' : 'border-slate-100'}`}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${form[key] ? 'bg-green-500 border-green-500' : 'bg-white'}`}></div>
                  <div className="flex-1">
                    <div className="font-bold">{meta.label}</div>
                    {form[key] && <div className="text-xs text-slate-500">Süre: <input onClick={(e)=>e.stopPropagation()} value={form[key + 'Duration'] || ''} onChange={e => handleChange(key + 'Duration', e.target.value)} className="border-b ml-2 text-xs w-10" /></div>}
                  </div>
                </div>
              );
            }
            return (
              <div key={idx} className={`p-3 rounded-xl border bg-slate-50`}>
                <div className="flex justify-between items-center mb-2"><div className="flex items-center font-bold text-xs"><meta.icon className="w-3 h-3 mr-1" /> {meta.label}</div></div>
                <div className="flex gap-2"><input type="tel" placeholder="Doğru" className="flex-1 p-2 rounded border text-center text-sm font-bold outline-none" value={form[key + 'True'] || ''} onChange={(e) => handleChange(key + 'True', e.target.value)} /><input type="tel" placeholder="Yanlış" className="flex-1 p-2 rounded border text-center text-sm font-bold outline-none" value={form[key + 'False'] || ''} onChange={(e) => handleChange(key + 'False', e.target.value)} /></div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t bg-slate-50"><button onClick={() => onSave(day, form)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition">Kaydet</button></div>
      </div>
    </div>
  );
}

function InstallGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-600" /></button>
        <div className="text-center mb-6">
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"><Phone className="w-8 h-8 text-indigo-600" /></div>
          <h3 className="font-bold text-lg">Uygulamayı Yükleyin</h3>
          <p className="text-sm text-slate-500 mt-2">Kısayol oluşturmak için adımları takip edin.</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><div className="text-2xl">🍎</div><div><h4 className="font-bold text-slate-700 text-xs">iOS</h4><p className="text-xs text-slate-500">Paylaş &gt; Ana Ekrama Ekle</p></div></div>
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><div className="text-2xl">🤖</div><div><h4 className="font-bold text-slate-700 text-xs">Android</h4><p className="text-xs text-slate-500">Menü &gt; Ana ekrana ekle</p></div></div>
        </div>
        <button onClick={onClose} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-6">Tamam</button>
      </div>
    </div>
  );
}
