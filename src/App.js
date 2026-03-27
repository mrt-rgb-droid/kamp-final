import React, { useState, useEffect } from 'react';
import { 
  Calculator, BookOpen, FlaskConical, Leaf, Users, CheckCircle2, 
  Download, LogOut, User, Calendar, Home, Star, MessageSquare, 
  ChevronUp, ChevronDown, X, Share, MoreVertical, Phone, AlertTriangle, 
  RefreshCcw, LockKeyhole, GraduationCap, Lightbulb, Trophy, Flame, 
  Target, Zap, Search, Award, Loader2, Trash2, TrendingUp, Settings, Plus, Save, Activity,
  History, Edit3, Bell, Check, List, Clock, XCircle, HelpCircle, Info, Gift, Image as ImageIcon, Camera, Palette, FileText, Send, Lock, Crown, Gem, RotateCcw, CalendarDays, MapPin, Globe, Scroll, Heart, Sliders
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot, serverTimestamp, updateDoc, deleteField } from 'firebase/firestore';

// --- UIVERSE CUSTOM STYLES & FONTS ---
const UiverseStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
    
    .spencerian {
        font-family: 'Dancing Script', cursive;
        font-weight: 700;
        letter-spacing: 1.5px;
    }

    .uiverse-checkbox input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
    .uiverse-checkbox { display: block; position: relative; cursor: pointer; font-size: 16px; user-select: none; }
    .uiverse-checkmark { position: relative; top: 0; left: 0; height: 1.4em; width: 1.4em; border: 2px solid var(--chk-color, #2196F3); border-radius: 1rem 0rem 1rem; transform: rotate(45deg); transition: all .5s ease-in-out; }
    .uiverse-checkbox input:checked ~ .uiverse-checkmark { box-shadow: 0px 0px 15px 2px var(--chk-color, #2196F3); border-radius: 1rem 0rem 1rem; background-color: var(--chk-bg, rgba(33, 150, 243, 0.12)); }
    .uiverse-checkmark:after { content: ""; position: absolute; display: none; }
    .uiverse-checkbox input:checked ~ .uiverse-checkmark:after { display: block; }
    .uiverse-checkbox .uiverse-checkmark:after { left: 0.35em; top: 0.20em; width: 0.25em; height: 0.5em; border: solid var(--chk-color, #2196F3); border-width: 0 0.15em 0.15em 0; transform: rotate(-5deg); animation: upAnimate 0.5s cubic-bezier(0.165, 0.84, 0.44, 1); }
    @keyframes upAnimate { from { transform: translate(-20px, -20px) rotate(-5deg); opacity: 0; } to { transform: translate(0, 0) rotate(-5deg); opacity: 1; } }

    /* Öğrenci Kartı 3D Flip Animasyonu */
    .tc-card { perspective: 1000px; height: 440px; width: 100%; position: relative; }
    .tc-content { width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 600ms cubic-bezier(0.4, 0.2, 0.2, 1); border-radius: 1.5rem; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.15); }
    .tc-card.flipped .tc-content { transform: rotateY(180deg); }
    .tc-front, .tc-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 1.5rem; overflow: hidden; }
    
    /* Ön Yüz */
    .tc-front { background-color: #0f172a; color: white; display: flex; flex-direction: column; z-index: 2; }
    .tc-front-bg { position: absolute; width: 100%; height: 100%; top:0; left:0; z-index:0; overflow:hidden; pointer-events: none; }
    .tc-circle { width: 140px; height: 140px; border-radius: 50%; background-color: rgba(99, 102, 241, 0.4); position: absolute; filter: blur(35px); animation: tc-floating 4s infinite ease-in-out alternate; }
    #tc-bottom { background-color: rgba(168, 85, 247, 0.4); left: -10%; bottom: -10%; width: 180px; height: 180px; animation-delay: -800ms; }
    #tc-right { background-color: rgba(236, 72, 153, 0.3); right: -10%; top: -10%; width: 140px; height: 140px; animation-delay: -1800ms; }
    @keyframes tc-floating { 0% { transform: translateY(0px) scale(1); } 50% { transform: translateY(20px) scale(1.1); } 100% { transform: translateY(0px) scale(1); } }
    
    /* Arka Yüz */
    .tc-back { background-color: #f8fafc; transform: rotateY(180deg); display: flex; flex-direction: column; border: 1px solid #e2e8f0; z-index: 1; pointer-events: auto; overflow: hidden; }

    /* Hamburger Menü (Öğrenci Kartı Yan Menü Tetikleyicisi) */
    .ham-input { display: none; }
    .ham-toggle { position: relative; width: 24px; height: 24px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4.5px; transition-duration: .4s; margin-right: 10px; }
    .ham-bars { width: 100%; height: 2.5px; background-color: #4f46e5; border-radius: 4px; }
    .ham-bar2 { transition-duration: .6s; }
    .ham-bar1, .ham-bar3 { width: 75%; }
    .ham-input:checked + .ham-toggle .ham-bars { position: absolute; transition-duration: .4s; }
    .ham-input:checked + .ham-toggle .ham-bar2 { transform: scaleX(0); transition-duration: .4s; }
    .ham-input:checked + .ham-toggle .ham-bar1 { width: 100%; transform: rotate(45deg); transition-duration: .4s; }
    .ham-input:checked + .ham-toggle .ham-bar3 { width: 100%; transform: rotate(-45deg); transition-duration: .4s; }
    .ham-input:checked + .ham-toggle { transition-duration: .4s; transform: rotate(180deg); }

    /* Yan Açılır Menü Panel */
    .side-panel { position: absolute; top: 0; left: 0; width: 240px; max-width: 85%; height: 100%; background-color: #ffffff; border-right: 1px solid #e2e8f0; z-index: 30; transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 4px 0 15px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
    .side-panel.open { transform: translateX(0); }

    /* Öğrenci Kartı İçi Modern Aksiyon Menüsü */
    .action-menu { width: 100%; display: flex; flex-direction: column; gap: 4px; padding: 4px 0; }
    .action-menu .separator { border-top: 1px solid #f1f5f9; margin: 6px 10px; }
    .action-menu .list { list-style-type: none; display: flex; flex-direction: column; gap: 4px; padding: 0px 8px; margin: 0; }
    .action-menu .list .element { display: flex; align-items: center; color: #64748b; gap: 12px; transition: all 0.2s ease-out; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; }
    .action-menu .list .element svg { width: 16px; height: 16px; transition: all 0.2s ease-out; }
    .action-menu .list .element .label { font-weight: 600; }
    
    .action-menu .list .element:hover { transform: translateX(4px); }
    .action-menu .list .element:active { transform: scale(0.98); }
    
    .action-menu .list .element.primary:hover { background-color: #eef2ff; color: #4f46e5; }
    .action-menu .list .element.primary:hover svg { stroke: #4f46e5; }
    
    .action-menu .list .element.warning:hover { background-color: #fff7ed; color: #ea580c; }
    .action-menu .list .element.warning:hover svg { stroke: #ea580c; }
    
    .action-menu .list .element.info:hover { background-color: #f0fdf4; color: #16a34a; }
    .action-menu .list .element.info:hover svg { stroke: #16a34a; }

    .action-menu .list .element.danger:hover { background-color: #fef2f2; color: #dc2626; }
    .action-menu .list .element.danger:hover svg { stroke: #dc2626; }

    .action-menu .list .element.default:hover { background-color: #f1f5f9; color: #1e293b; }
    .action-menu .list .element.default:hover svg { stroke: #1e293b; }

    /* Dalga Animasyonlu Input Tasarımı */
    .wave-group { position: relative; width: 100%; margin-top: 16px; margin-bottom: 8px; }
    .wave-group input { background-color: transparent; border: 0; border-bottom: 2px solid #cbd5e1; display: block; width: 100%; padding: 10px 0; font-size: 15px; color: #1e293b; font-weight: 600; outline: none; transition: border-color 0.3s; }
    .wave-group input:focus, .wave-group input:valid { border-bottom-color: #4f46e5; }
    .wave-group label { position: absolute; top: 10px; left: 0; pointer-events: none; display: flex; }
    .wave-group label span { display: inline-block; font-size: 15px; color: #94a3b8; font-weight: 600; transition: 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
    .wave-group input:focus+label span, .wave-group input:valid+label span { color: #4f46e5; transform: translateY(-24px) scale(0.85); transform-origin: left bottom; }
    .wave-group .wave-icon { position: absolute; left: 0; top: 8px; color: #94a3b8; transition: color 0.3s; pointer-events: none; }
    .wave-group input:focus ~ .wave-icon, .wave-group input:valid ~ .wave-icon { color: #4f46e5; }
    
    .wave-group.has-icon input { padding-left: 32px; }
    .wave-group.has-icon label { left: 32px; }
  `}</style>
);

// --- 1. FIREBASE INIT ---
const firebaseConfig = {
  apiKey: "AIzaSyA4S6agu71sO3bXlA1CsUGD0V0d8ImD3lg",
  authDomain: "kamp-takip-sistemi.firebaseapp.com",
  projectId: "kamp-takip-sistemi",
  storageBucket: "kamp-takip-sistemi.firebasestorage.app",
  messagingSenderId: "339295588440",
  appId: "1:339295588440:web:3400318781869a00afba2d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. AYARLAR VE SABİTLER ---
const APP_ID = "kamp-takip-yonetici-v3"; 
const TEACHER_PASS = "1876"; 

const LGS_DATE_2026 = new Date('2026-06-07T09:30:00');

// --- LGS MÜFREDAT TAKVİMİ (REFERANS HAVUZU) ---
const LGS_CURRICULUM_CALENDAR = [
    { id: 0, title: '1. Dönem Başlangıç', mat: 'Çarpanlar ve Katlar', fen: 'Mevsimler ve İklim', tr: 'Fiilimsiler', ink: 'Bir Kahraman Doğuyor', din: 'Kader İnancı', ing: 'Friendship' },
    { id: 1, title: '1. Dönem - Ekim Ortası', mat: 'Üslü İfadeler', fen: 'DNA ve Genetik Kod', tr: 'Cümlenin Ögeleri', ink: 'Milli Uyanış', din: 'Zekat ve Sadaka', ing: 'Teen Life' },
    { id: 2, title: '1. Dönem - Kasım Ortası', mat: 'Kareköklü İfadeler', fen: 'Basınç', tr: 'Sözcükte Anlam', ink: 'Ya İstiklal Ya Ölüm', din: 'Din ve Hayat', ing: 'In The Kitchen' },
    { id: 3, title: '1. Dönem Sonu / Ocak', mat: 'Veri Analizi', fen: 'Madde ve Endüstri', tr: 'Yazım Kuralları', ink: 'Atatürkçülük ve Çağdaşlaşma', din: 'Hz. Muhammedin Örnekliği', ing: 'On The Phone' },
    { id: 4, title: '2. Dönem Başlangıç', mat: 'Basit Olayların Olma Olasılığı', fen: 'Basit Makineler', tr: 'Noktalama İşaretleri', ink: 'Demokratikleşme Çabaları', din: 'Kuran-ı Kerim', ing: 'The Internet' },
    { id: 5, title: '2. Dönem - Mart Başı', mat: 'Cebirsel İfadeler', fen: 'Enerji Dönüşümleri', tr: 'Metin Türleri', ink: 'Dış Politika', din: 'Genel Tekrar', ing: 'Adventures' },
    { id: 6, title: '2. Dönem - Nisan', mat: 'Doğrusal Denklemler', fen: 'Elektrik Yükleri', tr: 'Paragraf', ink: 'Atatürkün Ölümü', din: 'Genel Tekrar', ing: 'Tourism' },
    { id: 7, title: '2. Dönem Sonu / Mayıs', mat: 'Eşitsizlikler / Üçgenler', fen: 'Genel Tekrar', tr: 'Sözel Mantık', ink: 'Genel Tekrar', din: 'Genel Tekrar', ing: 'Chores / Science' },
    { id: 8, title: 'Yaz Dönemi / Tekrar', mat: 'Genel Tekrar', fen: 'Genel Tekrar', tr: 'Kitap Okuma', ink: 'Tarih Okumaları', din: 'Manevi Gelişim', ing: 'Series/Movies' }
];

const getUniqueTopics = (key) => [...new Set(LGS_CURRICULUM_CALENDAR.map(item => item[key]))];

const LUCKY_TASKS = {
    easy: ["Bugün 15 sayfa kitap oku! 📚", "Matematik defterini tekrar et. ➕", "Hayat Bilgisi 5 soru. 🌍", "20 dk sessiz okuma yap. 🤫"],
    hard: ["20 Paragraf çöz! 🚀", "Fen konu tekrarı. 🧬", "Yapamadığın 3 soruyu sor. 🧮", "İngilizce kelime çalış. 🇬🇧"]
};

const MOTIVATION_QUOTES = [
    "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.", "Gelecek, bugünden hazırlananlara aittir.", "İnanmak başarmanın yarısıdır.",
    "Zorluklar, başarının değerini artıran süslerdir.", "Hiçbir zafere çiçekli yollardan gidilmez.", "Vazgeçmediğin sürece yenilmiş sayılmazsın.", "Büyük hayaller, küçük adımlarla başlar."
];

const DEFAULT_CURRICULUM = {
  "1": [{ id: 'mat', target: 5 }, { id: 'tr', target: 5 }, { id: 'hayat', target: 5 }, { id: 'kitap', target: 20 }],
  "2": [{ id: 'mat', target: 10 }, { id: 'tr', target: 10 }, { id: 'hayat', target: 10 }, { id: 'kitap', target: 20 }],
  "3": [{ id: 'mat', target: 15 }, { id: 'tr', target: 10 }, { id: 'hayat', target: 10 }, { id: 'kitap', target: 30 }],
  "4": [{ id: 'mat', target: 20 }, { id: 'tr', target: 20 }, { id: 'fen', target: 15 }, { id: 'sos', target: 15 }, { id: 'kitap', target: 30 }],
  "5": [{ id: 'mat', target: 30 }, { id: 'tr', target: 30 }, { id: 'fen', target: 20 }, { id: 'sos', target: 20 }, { id: 'serbestCalisma', target: 30 }],
  "6": [{ id: 'mat', target: 40 }, { id: 'tr', target: 40 }, { id: 'fen', target: 30 }, { id: 'serbestCalisma', target: 30 }],
  "7": [{ id: 'mat', target: 50 }, { id: 'tr', target: 50 }, { id: 'fen', target: 30 }, { id: 'serbestCalisma', target: 30 }],
  "8": [{ id: 'mat', target: 60 }, { id: 'tr', target: 60 }, { id: 'fen', target: 40 }, { id: 'inkilap', target: 25 }, { id: 'ing', target: 20 }, { id: 'din', target: 15 }, { id: 'serbestCalisma', target: 30 }]
};

const SUBJECT_METADATA = {
  mat: { label: "Matematik", icon: Calculator, color: "blue", type: "question" },
  tr: { label: "Türkçe", icon: BookOpen, color: "red", type: "question" },
  fen: { label: "Fen Bilimleri", icon: FlaskConical, color: "green", type: "question" },
  hayat: { label: "Hayat Bilgisi", icon: Leaf, color: "emerald", type: "question" },
  sos: { label: "Sosyal Bilgiler", icon: Users, color: "orange", type: "question" },
  inkilap: { label: "İnkılap Tarihi", icon: Scroll, color: "amber", type: "question" },
  ing: { label: "İngilizce", icon: Globe, color: "purple", type: "question" },
  din: { label: "Din Kültürü", icon: Heart, color: "teal", type: "question" },
  kitap: { label: "Kitap Okuma", icon: BookOpen, color: "pink", type: "duration" },
  spor: { label: "Spor/Egzersiz", icon: Trophy, color: "cyan", type: "duration" },
  kodlama: { label: "Kodlama", icon: Zap, color: "violet", type: "duration" },
  deneme: { label: "Deneme Sınavı", icon: Target, color: "indigo", type: "question" },
  serbestCalisma: { label: "Serbest Çalışma", icon: List, color: "indigo", type: "selection", options: ["Kitap Okuma 📚", "Matematik Konu 🧮", "Fen Konu 🧪", "Türkçe Konu 📖", "Sosyal/İnkılap Konu 🌍", "İngilizce Konu 🗣️", "Din Kültürü Konu 🕌"] }
};

const ADVICE_POOL = {
  math: ["İşlemleri yazarak yap. ✍️"], turkish: ["Soru kökünü iyi oku. 👁️"], science: ["Mantığını kavra. 🧪"], general: ["Harikasın! 💧"]
};

// --- YARDIMCI FONKSİYONLAR ---
const normalizeString = (str) => {
    const map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U' };
    return str.replace(/[çğıöşüÇĞİÖŞÜ]/g, match => map[match] || match).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

const generateStudentId = (name, grade) => `std_${normalizeString(name)}_${grade}`;
const safeArray = (data) => { if (!data) return []; if (Array.isArray(data)) return data.flat(); if (typeof data === 'object') return Object.values(data); return []; };

const countTotalSubject = (days, subjectKey) => {
    let total = 0;
    Object.values(days || {}).forEach(d => {
        if(d[subjectKey + 'True']) total += parseInt(d[subjectKey + 'True'] || 0);
        if(d[subjectKey + 'Duration']) total += parseInt(d[subjectKey + 'Duration'] || 0);
        if(d[subjectKey] === true) total += 1;
    });
    return total;
};

const getSubjectInfo = (item) => {
    if (!item || !item.id) return { label: 'Bilinmeyen Ders', icon: Star, color: 'gray', type: 'question' };
    const baseMeta = SUBJECT_METADATA[item.id] || { label: item.id, icon: Star, color: 'gray', type: 'question' };
    return { ...baseMeta, label: item.customLabel || baseMeta.label, target: item.target };
};

const isContentValid = (timestamp) => {
    if (!timestamp) return false;
    try {
        const now = new Date();
        const contentDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
        return (now - contentDate) / 1000 / 60 / 60 < 24; 
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

const BADGE_DEFINITIONS = [
    { id: 'first', title: 'İlk Adım', desc: 'Veri gir.', tier: 'bronz', icon: Star, minGrade: 1, check: d => Object.keys(d).length >= 1 },
    { id: 'math50', title: 'Matematik Çırağı', desc: '50 Mat çöz.', tier: 'bronz', icon: Calculator, minGrade: 1, check: d => countTotalSubject(d, 'mat') >= 50 },
    { id: 'streak7', title: 'Haftalık Seri', desc: '7 gün gir.', tier: 'gumus', icon: Flame, minGrade: 1, check: d => Object.keys(d).length >= 7 },
    { id: 'math250', title: 'Matematik Ustası', desc: '250 Mat çöz.', tier: 'gumus', icon: Calculator, minGrade: 4, check: d => countTotalSubject(d, 'mat') >= 250 },
    { id: 'history', title: 'Tarihçi', desc: '50 İnkılap çöz.', tier: 'gumus', icon: Scroll, minGrade: 8, check: d => countTotalSubject(d, 'inkilap') >= 50 },
    { id: 'lang', title: 'Dil Kurdu', desc: '50 İngilizce çöz.', tier: 'gumus', icon: Globe, minGrade: 4, check: d => countTotalSubject(d, 'ing') >= 50 },
    { id: 'focus60', title: 'Odaklanma Kralı', desc: '60dk çalış.', tier: 'altin', icon: Clock, minGrade: 5, check: d => Object.values(d).some(v => Object.keys(v).some(k => k.endsWith('Duration') && v[k]>=60)) },
    { id: 'perfect', title: 'Kusursuz Gün', desc: '100 soru 0 yanlış.', tier: 'altin', icon: Target, minGrade: 5, check: d => Object.values(d).some(v => { let t=0,f=0; Object.keys(v).forEach(k=>{if(k.endsWith('True'))t+=parseInt(v[k]);if(k.endsWith('False'))f+=parseInt(v[k])}); return t>=100 && f===0; }) },
    { id: 'time', title: 'Zaman Bükücü', desc: '12 gün aralıksız gir.', tier: 'imkansiz', icon: Zap, minGrade: 1, check: d => Object.keys(d).length >= 12 },
    { id: 'god', title: 'Ordinaryüs', desc: '2000 soru çöz.', tier: 'imkansiz', icon: Gem, minGrade: 6, check: d => { let t=0; Object.values(d).forEach(v=>Object.keys(v).forEach(k=>{if(k.endsWith('True'))t+=parseInt(v[k]||0)})); return t>=2000; } }
];

function roundRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.closePath();
      return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

const generateReportCard = (student, curriculum, customMessage = null) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const W = 1000;
    const H = 1414; 
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = '#fffbeb'; 
    ctx.fillRect(0, 0, W, H);
    
    ctx.strokeStyle = '#d97706'; 
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = '#f59e0b'; 
    ctx.lineWidth = 4;
    ctx.strokeRect(35, 35, W - 70, H - 70);

    ctx.fillStyle = '#1e293b'; 
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('KAMP BAŞARI BELGESİ', W / 2, 120);
    
    ctx.fillStyle = '#475569'; 
    ctx.font = '30px Arial';
    ctx.fillText(`Öğrenci: ${student.name} | Sınıf: ${student.grade}`, W / 2, 170);
    ctx.font = 'italic 20px Arial';
    ctx.fillText(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, W / 2, 200);

    let totalCorrect = 0, totalWrong = 0, totalDuration = 0, totalBook = 0;
    const dailyStats = [];

    const sortedDays = Object.keys(student.days || {}).sort((a, b) => parseInt(a) - parseInt(b));

    sortedDays.forEach(day => {
        const d = student.days[day];
        let dayCorrect = 0, dayWrong = 0, dayDuration = 0, dayBook = 0;

        Object.keys(d).forEach(k => {
            if (k.endsWith('True')) dayCorrect += parseInt(d[k] || 0);
            if (k.endsWith('False')) dayWrong += parseInt(d[k] || 0);
            if (k.endsWith('Duration')) dayDuration += parseInt(d[k] || 0);
            if (k === 'kitap' && typeof d[k] === 'number') dayBook += d[k]; 
            if (k === 'kitap' && d[k] === true) dayBook += 1; 
        });

        totalCorrect += dayCorrect;
        totalWrong += dayWrong;
        totalDuration += dayDuration;
        totalBook += dayBook;

        dailyStats.push({ day, dayCorrect, dayWrong, dayDuration, dayBook });
    });

    const drawSummaryBox = (x, y, label, val, color) => {
        ctx.fillStyle = color;
        roundRect(ctx, x, y, 200, 100, 10);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.fillText(String(val), x + 100, y + 60);
        ctx.font = '16px Arial';
        ctx.fillText(label, x + 100, y + 85);
    };

    drawSummaryBox(80, 250, 'Toplam Doğru', totalCorrect, '#22c55e');
    drawSummaryBox(300, 250, 'Toplam Yanlış', totalWrong, '#ef4444');
    drawSummaryBox(520, 250, 'Konu Çalışma (Dk)', totalDuration, '#3b82f6');
    drawSummaryBox(740, 250, 'Kitap Okuma', totalBook, '#eab308');

    const displayMessage = customMessage !== null ? customMessage : (student.teacherMessage || "");

    if (displayMessage) {
        ctx.fillStyle = '#fff7ed'; 
        ctx.strokeStyle = '#fdba74'; 
        ctx.lineWidth = 2;
        roundRect(ctx, 80, 380, 860, 100, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#9a3412'; 
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Öğretmen Mesajı:', 100, 415);
        
        ctx.fillStyle = '#431407'; 
        ctx.font = 'italic 24px Arial';
        const words = displayMessage.split(' ');
        let line = '';
        let ly = 445;
        words.forEach(word => {
            if (ctx.measureText(line + word).width > 800) {
                ctx.fillText(line, 100, ly);
                line = word + ' ';
                ly += 30;
            } else {
                line += word + ' ';
            }
        });
        ctx.fillText(line, 100, ly);
    }

    let ty = 530;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Günlük Çalışma Detayları', 80, ty);
    ty += 30;

    ctx.fillStyle = '#e2e8f0'; 
    ctx.fillRect(80, ty, 860, 40);
    ctx.fillStyle = '#0f172a'; 
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Gün', 100, ty + 27);
    ctx.fillText('Doğru', 250, ty + 27);
    ctx.fillText('Yanlış', 400, ty + 27);
    ctx.fillText('Çalışma (Dk)', 550, ty + 27);
    ctx.fillText('Kitap', 750, ty + 27);
    ty += 40;

    ctx.font = '18px Arial';
    dailyStats.forEach((stat, idx) => {
        if (ty > 1000) return; 
        ctx.fillStyle = idx % 2 === 0 ? '#f8fafc' : 'white';
        ctx.fillRect(80, ty, 860, 35);
        
        ctx.fillStyle = '#334155';
        ctx.fillText(`${stat.day}. Gün`, 100, ty + 24);
        ctx.fillStyle = '#16a34a'; ctx.fillText(String(stat.dayCorrect), 250, ty + 24);
        ctx.fillStyle = '#dc2626'; ctx.fillText(String(stat.dayWrong), 400, ty + 24);
        ctx.fillStyle = '#2563eb'; ctx.fillText(String(stat.dayDuration), 550, ty + 24);
        ctx.fillStyle = '#ca8a04'; ctx.fillText(String(stat.dayBook), 750, ty + 24);
        
        ty += 35;
    });

    const earnedBadges = BADGE_DEFINITIONS.filter(b => b.check(student.days || {}));
    if (earnedBadges.length > 0) {
        ty = Math.max(ty + 40, 1100); 
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Kazanılan Rozetler', 80, ty);
        ty += 40;

        let bx = 80;
        earnedBadges.forEach((badge, i) => {
            ctx.fillStyle = '#f1f5f9';
            roundRect(ctx, bx, ty, 100, 120, 10);
            ctx.fill();
            ctx.strokeStyle = badge.tier === 'altin' ? '#fbbf24' : badge.tier === 'gumus' ? '#94a3b8' : '#d97706';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.font = '40px Arial';
            const emoji = badge.id.includes('math') ? '🧮' : 
                          badge.id.includes('streak') ? '🔥' : 
                          badge.id.includes('focus') ? '⏱️' :
                          badge.id.includes('perfect') ? '🎯' :
                          badge.id.includes('time') ? '⚡' :
                          badge.id.includes('god') ? '👑' :
                          badge.id.includes('history') ? '📜' :
                          badge.id.includes('lang') ? '🌍' : '⭐';
                          
            ctx.fillText(emoji, bx + 50, ty + 50);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px Arial';
            ctx.fillText(badge.title, bx + 50, ty + 80);

            ctx.fillStyle = '#64748b';
            ctx.font = '9px Arial';
            const descWords = badge.desc.split(' ');
            let dLine = '';
            let dY = ty + 95;
            descWords.forEach(w => {
                if (ctx.measureText(dLine + w).width > 90) {
                    ctx.fillText(dLine, bx + 50, dY);
                    dLine = w + ' ';
                    dY += 10;
                } else {
                    dLine += w + ' ';
                }
            });
            ctx.fillText(dLine, bx + 50, dY);

            bx += 110;
            if (bx > 880) { bx = 80; ty += 140; }
        });
    }

    const randomQuote = MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 16px Arial';
    ctx.fillText(`"${randomQuote}"`, W / 2, H - 30);

    const link = document.createElement('a');
    link.download = `${student.name}_Detayli_Karne.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
};

// --- BİLEŞENLER ---

// Ortak Dalga Animasyonlu Input Bileşeni
const WaveInput = ({ value, onChange, label, icon: Icon, type = "text", rightElement }) => {
    return (
        <div className={`wave-group ${Icon ? 'has-icon' : ''}`}>
            <input 
                type={type} 
                required 
                value={value} 
                onChange={onChange} 
            />
            <label>
                {label.split('').map((char, index) => (
                    <span key={index} style={{ transitionDelay: `${index * 30}ms` }}>
                        {char === ' ' ? '\u00A0' : char}
                    </span>
                ))}
            </label>
            {Icon && <Icon className="wave-icon w-5 h-5" />}
            {rightElement && <div className="absolute right-0 top-2 z-10">{rightElement}</div>}
        </div>
    );
};


const GuideSection = ({icon: Icon, title, text}) => (
    <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-indigo-600 font-bold border-b pb-1 border-indigo-200"><Icon className="w-5 h-5"/> {title}</div>
        <p className="text-sm text-slate-600">{text}</p>
    </div>
);

const NavButton = ({ icon: Icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center p-2 rounded-lg transition ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
        <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

function LGSCountdown({ grade }) { 
    const [timeLeft, setTimeLeft] = useState({}); 
    useEffect(() => { 
        const timer = setInterval(() => { 
            const now = new Date();
            const targetDate = LGS_DATE_2026; 
            const diff = targetDate - now; 
            if (diff > 0) { 
                setTimeLeft({ gün: Math.floor(diff/(1000*60*60*24)), saat: Math.floor((diff/(1000*60*60))%24), dk: Math.floor((diff/1000/60)%60), sn: Math.floor((diff/1000)%60) });
            } 
        }, 1000); 
        return () => clearInterval(timer); 
    }, [grade]); 
    
    return (
        <div className="bg-slate-900 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition"></div>
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/30">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-lg leading-none">LGS 2026</h4>
                        <span className="text-indigo-300 text-xs font-medium">Büyük Sınava Kalan</span>
                    </div>
                </div>
                <div className="flex gap-2 text-center">
                    <div className="bg-slate-800 p-2 rounded-lg min-w-[50px] border border-slate-700">
                        <div className="text-xl font-bold text-white leading-none">{timeLeft.gün || 0}</div>
                        <div className="text-[10px] text-slate-400 mt-1 uppercase">Gün</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg min-w-[50px] border border-slate-700 hidden sm:block">
                        <div className="text-xl font-bold text-white leading-none">{timeLeft.saat || 0}</div>
                        <div className="text-[10px] text-slate-400 mt-1 uppercase">Saat</div>
                    </div>
                </div>
            </div>
        </div>
    ); 
}

function LuckyTaskCard({ grade }) { 
    const [task, setTask] = useState(null); 
    const getTask = () => { const pool = grade <= 4 ? LUCKY_TASKS.easy : LUCKY_TASKS.hard; setTask(pool[Math.floor(Math.random() * pool.length)]); }; 
    return (
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-2xl shadow-lg relative mb-4">
            <div className="flex justify-between items-center">
                <div><h3 className="font-bold flex items-center"><Gift className="w-5 h-5 mr-2"/> Şanslı Görev</h3><p className="text-sm text-pink-100 mt-1">{task || "Bugün şansına ne çıkacak?"}</p></div>
                <button onClick={getTask} className="bg-white text-pink-600 px-3 py-2 rounded-lg text-xs font-bold shadow-md">{task ? "Yeni" : "Aç"}</button>
            </div>
        </div>
    ); 
}

function DailyQuestionCard({ questionData, grade, showDialog }) { 
    const [answer, setAnswer] = useState(""); 
    const [submitted, setSubmitted] = useState(false); 
    const [result, setResult] = useState(null);
    
    if (!questionData || !isContentValid(questionData.timestamp)) return null; 
    if (questionData.targetGrade !== 'all' && parseInt(questionData.targetGrade) !== grade) return null; 
    
    const handleSubmit = () => {
        if (questionData.type === 'test') {
             if(answer === questionData.correctOption) { setResult('correct'); showDialog({type:'alert', message:'Doğru!'}); } else { setResult('wrong'); showDialog({type:'alert', message:'Yanlış!'}); }
        } else {
             showDialog({type:'alert', message:'Cevabın iletildi!'});
        }
        setSubmitted(true);
    };

    return (
        <div className="bg-violet-50 border border-violet-200 p-4 rounded-2xl shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-2"><HelpCircle className="w-5 h-5 text-violet-600" /><h4 className="font-bold text-violet-700 text-sm">Günün Sorusu</h4></div>
            {questionData.image && <img src={questionData.image} alt="Soru" className="w-full rounded-lg mb-3" />}
            <p className="text-sm text-slate-700 font-medium bg-white p-3 rounded-lg border border-violet-100 mb-3">{questionData.text}</p>
            {!submitted ? (
                <div className="space-y-2">
                    {questionData.type === 'test' ? (
                        <div className="grid grid-cols-2 gap-2">{['A','B','C','D'].map(opt=><button key={opt} onClick={()=>setAnswer(opt)} className={`p-2 rounded border text-sm font-bold ${answer===opt?'bg-violet-600 text-white':'bg-white'}`}>{opt}</button>)}</div>
                    ) : <WaveInput value={answer} onChange={e=>setAnswer(e.target.value)} label="Cevabını yaz..." /> }
                    <button onClick={handleSubmit} className="w-full bg-green-500 text-white py-2 rounded-lg font-bold text-sm mt-2">Gönder</button>
                </div>
            ) : <div className="text-center font-bold text-sm p-2 bg-green-100 text-green-700 rounded">{result==='correct'?'Tebrikler Doğru!':'Yanıtın Kaydedildi'}</div>}
        </div>
    ); 
}

function AppGuideModal({ onClose }) { 
    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md h-[80vh] rounded-2xl flex flex-col overflow-hidden">
                <div className="bg-indigo-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold">Rehber</h3><button onClick={onClose}><X className="w-6 h-6"/></button></div>
                <div className="overflow-y-auto p-6 space-y-8 bg-slate-50 flex-1">
                    <GuideSection icon={User} title="Giriş" text="Adını ve sınıfını seçerek başla." />
                    <GuideSection icon={Calendar} title="Program" text="Günün programını doldur ve kaydet." />
                    <GuideSection icon={List} title="Serbest Çalışma" text="Listeden ne çalıştığını seç ve süresini gir." />
                    <GuideSection icon={Gift} title="Şanslı Görev" text="Her gün yeni bir akademik görev!" />
                    <GuideSection icon={Flame} title="Rozetler" text="Zorlu görevleri tamamla, efsanevi rozetleri kap!" />
                </div>
            </div>
        </div>
    ); 
}

function InstallGuideModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center">
            <div className="bg-white w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5" /></button>
                <div className="text-center mb-6"><h3 className="text-xl font-bold">Uygulamayı İndir</h3></div>
                <div className="space-y-4 text-sm">
                    <div>🍎 iPhone: Paylaş {'>'} Ana Ekrana Ekle</div>
                    <div>🤖 Android: 3 nokta {'>'} Uygulamayı Yükle</div>
                </div>
            </div>
        </div>
    );
}

function StudentProgramEditorModal({ student, globalCurriculum, totalDays, onClose, showDialog }) {
    const [selectedDay, setSelectedDay] = useState("1");
    const gradeString = String(student.grade);
    const baseCurriculum = globalCurriculum[gradeString] || DEFAULT_CURRICULUM["7"] || [];
    
    const [dayProgram, setDayProgram] = useState([]);
    const [newItem, setNewItem] = useState({ id: 'mat', target: 50, customLabel: '' });

    useEffect(() => {
        const studentCustom = student.customProgram?.[selectedDay];
        if (studentCustom && studentCustom.length > 0) {
            setDayProgram([...studentCustom]);
        } else {
            setDayProgram([...baseCurriculum]);
        }
    }, [selectedDay, student.customProgram, baseCurriculum]);

    const handleAddItem = () => {
        setDayProgram(prev => [...prev, newItem]);
        setNewItem({ id: 'mat', target: 50, customLabel: '' });
    };

    const handleRemoveItem = (index) => {
        setDayProgram(prev => {
            const newList = [...prev];
            newList.splice(index, 1);
            return newList;
        });
    };

    const handleSaveDay = async () => {
        try {
            const docRef = doc(db, 'artifacts', APP_ID, 'public_data', student.id);
            await updateDoc(docRef, {
                [`customProgram.${selectedDay}`]: dayProgram
            });
            showDialog({type:'alert', message:`${selectedDay}. Gün programı başarıyla kaydedildi!`});
        } catch (e) {
            console.error(e);
            showDialog({type:'alert', message:'Kaydetme hatası.'});
        }
    };

    const handleClearDay = async () => {
        try {
            const docRef = doc(db, 'artifacts', APP_ID, 'public_data', student.id);
            await updateDoc(docRef, {
                [`customProgram.${selectedDay}`]: deleteField()
            });
            setDayProgram([...baseCurriculum]);
            showDialog({type:'alert', message:`${selectedDay}. Gün özel programı iptal edildi. Varsayılan sınıfa dönüldü.`});
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4">
            <div className="bg-slate-50 w-full max-w-md h-[90vh] rounded-2xl flex flex-col overflow-hidden">
                <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                    <div>
                        <h3 className="font-bold flex items-center text-sm"><Target className="w-4 h-4 mr-2"/> Bireysel Program Editörü</h3>
                        <div className="text-xs text-indigo-200 mt-1">{student.name} ({student.grade}. Sınıf)</div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-indigo-500 rounded"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="overflow-y-auto p-4 flex-1">
                    <div className="bg-white p-3 rounded-xl shadow-sm mb-4 border border-slate-200">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center"><CalendarDays className="w-3 h-3 mr-1"/> Gün Seç</label>
                        <select 
                            value={selectedDay} 
                            onChange={e => setSelectedDay(e.target.value)}
                            className="w-full mt-2 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold outline-none"
                        >
                            {Array.from({length: totalDays}, (_, i) => i + 1).map(d => (
                                <option key={d} value={d}>{d}. Gün {student.customProgram?.[d] ? '🌟 (Özel)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Bu Güne Görev Ekle</h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                                <select className="flex-1 p-2 border rounded-lg text-sm bg-slate-50 outline-none" value={newItem.id} onChange={e => setNewItem({...newItem, id: e.target.value})}>
                                    {Object.keys(SUBJECT_METADATA).map(key => (<option key={key} value={key}>{SUBJECT_METADATA[key].label}</option>))}
                                </select>
                                <input type="number" className="w-20 p-2 border rounded-lg text-sm outline-none" placeholder="Hedef" value={newItem.target} onChange={e => setNewItem({...newItem, target: parseInt(e.target.value)})} />
                            </div>
                            <WaveInput 
                                value={newItem.customLabel} 
                                onChange={e => setNewItem({...newItem, customLabel: e.target.value})} 
                                label="Özel Görev Adı (İsteğe Bağlı)" 
                                icon={Edit3} 
                            />
                            <button onClick={handleAddItem} className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center transition"><Plus className="w-4 h-4 mr-1"/> Listeye Ekle</button>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase">{selectedDay}. Gün Görev Listesi</h3>
                        {dayProgram.length === 0 && <div className="text-center text-xs text-slate-400 p-4 border rounded-xl border-dashed">Liste boş.</div>}
                        {dayProgram.map((item, idx) => { 
                            const meta = getSubjectInfo(item); 
                            return ( 
                                <div key={item.id + idx} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {meta.icon && <div className={`p-2 bg-${meta.color}-50 rounded-lg`}><meta.icon className={`w-4 h-4 text-${meta.color}-600`}/></div>}
                                        <div>
                                            <div className="font-bold text-slate-700 text-sm">{meta.label}</div>
                                            <div className="text-[10px] text-slate-500">Hedef: {item.target} {meta.type === 'question' ? 'soru' : 'dk'}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                                </div> 
                            ) 
                        })}
                    </div>
                </div>
                
                <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                    <button onClick={handleSaveDay} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center shadow-lg transition"><Save className="w-5 h-5 mr-2"/> Bu Günü Öğrenciye Kaydet</button>
                    {student.customProgram?.[selectedDay] && (
                        <button onClick={handleClearDay} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold transition">Özel Programı Temizle (Sınıf Şablonuna Dön)</button>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProgramEditorModal({ curriculum, onClose, showDialog }) {
    const [selectedGrade, setSelectedGrade] = useState("7");
    const [localCurriculum, setLocalCurriculum] = useState(curriculum || DEFAULT_CURRICULUM);
    const [newItem, setNewItem] = useState({ id: 'mat', target: 50, customLabel: '' });

    const handleAddItem = () => { 
        setLocalCurriculum(prev => ({ 
            ...prev, 
            [selectedGrade]: [...(prev[selectedGrade] || []), newItem] 
        })); 
        setNewItem({ id: 'mat', target: 50, customLabel: '' }); 
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
            showDialog({type:'alert', message:'Sınıf şablonu güncellendi!'});
            onClose(); 
        } catch (e) {
            console.error(e);
            showDialog({type:'alert', message:'Kayıt hatası.'});
        }
    };

    const list = localCurriculum[selectedGrade] || [];

    return (
        <div className="p-4 bg-slate-50 min-h-full">
            <button onClick={onClose} className="mb-4 text-slate-500 flex items-center text-sm font-bold"><ChevronDown className="rotate-90 w-4 h-4 mr-1"/> Geri Dön</button>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Sınıf Şablon Editörü</h2>
            <p className="text-xs text-slate-500 mb-4">Bu şablon, o sınıftaki tüm öğrencilerin "varsayılan" günlük hedefi olur.</p>
            
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4"><label className="text-xs font-bold text-slate-500 uppercase">Sınıf Seç</label><div className="flex gap-2 mt-2 overflow-x-auto pb-2">{[1,2,3,4,5,6,7,8].map(g => (<button key={g} onClick={() => setSelectedGrade(g.toString())} className={`px-4 py-2 border rounded-lg font-bold ${selectedGrade === g.toString() ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600'}`}>{g}. Sınıf</button>))}</div></div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                <h3 className="text-sm font-bold text-slate-700 mb-1">Ders Ekle</h3>
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <select className="flex-1 p-2 border rounded-lg text-sm bg-white" value={newItem.id} onChange={e => setNewItem({...newItem, id: e.target.value})}>{Object.keys(SUBJECT_METADATA).map(key => (<option key={key} value={key}>{SUBJECT_METADATA[key].label}</option>))}</select>
                        <input type="number" className="w-20 p-2 border rounded-lg text-sm" placeholder="Hedef" value={newItem.target} onChange={e => setNewItem({...newItem, target: parseInt(e.target.value)})} />
                    </div>
                    <WaveInput 
                        value={newItem.customLabel} 
                        onChange={e => setNewItem({...newItem, customLabel: e.target.value})} 
                        label="Özel Ders İsmi (İsteğe Bağlı)" 
                        icon={Edit3} 
                    />
                    <button onClick={handleAddItem} className="w-full bg-green-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center"><Plus className="w-4 h-4 mr-2"/> Listeye Ekle</button>
                </div>
            </div>
            <div className="space-y-2 mb-20">{safeArray(list).map((item, idx) => { const meta = getSubjectInfo(item); return ( <div key={item.id + idx} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center"><div className="flex items-center gap-3">{meta.icon && <div className={`p-2 bg-${meta.color}-50 rounded-lg`}><meta.icon className={`w-5 h-5 text-${meta.color}-600`}/></div>}<div><div className="font-bold text-slate-700 text-sm">{meta.label}</div><div className="text-xs text-slate-500">Hedef: {item.target} {meta.type === 'question' ? 'soru' : 'dk'}</div></div></div><button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4"/></button></div> ) })}</div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-2">
                <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center shadow-lg"><Save className="w-5 h-5 mr-2"/> Şablonu Kaydet</button>
            </div>
        </div>
    );
}

function LGSCustomEditorModal({ initialSettings, onClose, showDialog }) {
    const [weeks, setWeeks] = useState(initialSettings?.programWeeks || 2);
    const [isLeaderboardActive, setIsLeaderboardActive] = useState(initialSettings?.isLeaderboardActive !== false);
    const [topics, setTopics] = useState(initialSettings?.customLGS || {
        mat: LGS_CURRICULUM_CALENDAR[0].mat,
        fen: LGS_CURRICULUM_CALENDAR[0].fen,
        tr: LGS_CURRICULUM_CALENDAR[0].tr,
        ink: LGS_CURRICULUM_CALENDAR[0].ink,
        ing: LGS_CURRICULUM_CALENDAR[0].ing,
        din: LGS_CURRICULUM_CALENDAR[0].din
    });

    const handleSave = async () => {
        try {
            await setDoc(doc(db, 'artifacts', APP_ID, 'settings', 'general'), {
                programWeeks: parseInt(weeks),
                isLeaderboardActive: isLeaderboardActive,
                customLGS: topics
            }, { merge: true });
            showDialog({type:'alert', message:'Yeni program kaydedildi!'});
            onClose();
        } catch (e) {
            console.error(e);
            showDialog({type:'alert', message:'Kaydetme hatası.'});
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold flex items-center"><Edit3 className="w-5 h-5 mr-2"/> Kamp & LGS Ayarları</h3>
                    <button onClick={onClose}><X className="w-6 h-6"/></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-200">
                            <div>
                                <label className="block text-xs font-bold text-blue-800 uppercase flex items-center"><Crown className="w-4 h-4 mr-1"/> Sıralama Tablosu</label>
                                <p className="text-[10px] text-blue-600 mt-1">Öğrencilerin liderlik ligini görmesini aç/kapat.</p>
                            </div>
                            <button onClick={() => setIsLeaderboardActive(!isLeaderboardActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isLeaderboardActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isLeaderboardActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <label className="block text-xs font-bold text-blue-800 uppercase">Kamp Süresi (Tüm Sınıflar)</label>
                        </div>
                        <p className="text-[10px] text-blue-600 mb-2">Bu ayar 5, 6, 7 ve 8. sınıfların ilerleme çubuğunu ve takvimini etkiler.</p>
                        <select 
                            value={weeks} 
                            onChange={e => setWeeks(e.target.value)} 
                            className="w-full p-3 rounded-lg border border-blue-200 outline-none font-bold text-blue-900 bg-white"
                        >
                            <option value="1">1 Hafta (7 Gün)</option>
                            <option value="2">2 Hafta (14 Gün)</option>
                            <option value="3">3 Hafta (21 Gün)</option>
                            <option value="4">4 Hafta (28 Gün)</option>
                        </select>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-indigo-600" />
                            <h4 className="font-bold text-slate-800">LGS Konu Hedefleri (Sadece 8. Sınıf)</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded">Aşağıdaki konu seçimleri sadece 8. sınıf öğrencilerinin panelinde "Bu Haftanın Konuları" olarak görünecektir.</p>
                        
                        <div className="space-y-3">
                            {[
                                { key: 'mat', label: 'Matematik', color: 'blue' },
                                { key: 'fen', label: 'Fen Bilimleri', color: 'green' },
                                { key: 'tr', label: 'Türkçe', color: 'red' },
                                { key: 'ink', label: 'İnkılap Tarihi', color: 'amber' },
                                { key: 'ing', label: 'İngilizce', color: 'purple' },
                                { key: 'din', label: 'Din Kültürü', color: 'teal' }
                            ].map(subject => (
                                <div key={subject.key} className={`p-3 rounded-xl border bg-${subject.color}-50 border-${subject.color}-100`}>
                                    <label className={`block text-xs font-bold text-${subject.color}-800 uppercase mb-1`}>{subject.label}</label>
                                    <select 
                                        value={topics[subject.key]} 
                                        onChange={e => setTopics({...topics, [subject.key]: e.target.value})}
                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                                    >
                                        {getUniqueTopics(subject.key).map((topic, idx) => (
                                            <option key={idx} value={topic}>{topic}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-slate-50">
                    <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition">Programı Yayınla</button>
                </div>
            </div>
        </div>
    );
}

// --- STUDENT APP BİLEŞENİ ---
function StudentApp({ user, studentName, grade, curriculum, announcementData, dailyQuestion, generalSettings, showDialog }) {
  const [activeTab, setActiveTab] = useState('home');
  const [data, setData] = useState(null); 
  const [selectedDay, setSelectedDay] = useState(null);
  const [showMsgModal, setShowMsgModal] = useState(false); 
  const [messageText, setMessageText] = useState("");
  const [allStudents, setAllStudents] = useState([]); 
  const docId = generateStudentId(studentName, grade);
  
  const totalProgramDays = (parseInt(generalSettings?.programWeeks) || 2) * 7;
  const daysArray = Array.from({ length: totalProgramDays }, (_, i) => i + 1);
  const isLeaderboardActive = generalSettings?.isLeaderboardActive !== false;

  const studentGradeStr = grade.toString();
  const myCurriculum = safeArray(
    curriculum?.[studentGradeStr] || 
    curriculum?.[7] || 
    DEFAULT_CURRICULUM[7] ||
    []
  );

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) { setData(docSnap.data()); } 
      else {
        const newData = { id: docId, name: studentName, grade: grade, createdAt: serverTimestamp(), days: {} };
        setDoc(docRef, newData, { merge: true }).catch(e => console.error(e));
        setData(newData);
      }
    }, (err) => console.log("Student Data Error", err));
    return () => unsubscribe();
  }, [user, docId, studentName, grade]);

  useEffect(() => {
      if (activeTab === 'leaderboard') {
          const colRef = collection(db, 'artifacts', APP_ID, 'public_data');
          const unsub = onSnapshot(colRef, (snap) => {
              setAllStudents(snap.docs.map(d => ({id: d.id, ...d.data()})));
          });
          return () => unsub();
      }
  }, [activeTab]);

  useEffect(() => {
      if (!isLeaderboardActive && activeTab === 'leaderboard') {
          setActiveTab('home');
      }
  }, [isLeaderboardActive, activeTab]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', docId);
    await setDoc(docRef, { studentMessage: messageText, studentMessageTime: serverTimestamp() }, { merge: true });
    showDialog({type:'alert', message:'Mesajınız iletildi.'});
    setMessageText("");
    setShowMsgModal(false);
  };

  const saveDayData = async (day, dayData) => {
    setData(prev => ({ ...prev, days: { ...prev.days, [day]: dayData } }));
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', docId);
    await setDoc(docRef, { days: { [day]: dayData }, lastUpdated: serverTimestamp() }, { merge: true });
    setSelectedDay(null);
    showDialog({type:'alert', message:'Kayıt başarılı!'});
  };

  if (!data) return <div className="p-8 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />Veriler Hazırlanıyor...</div>;

  return (
    <>
      <div className="p-4 space-y-6 pb-24">
        {activeTab === 'home' && <HomeView data={data} grade={grade} studentName={studentName} defaultCurriculum={myCurriculum} announcementData={announcementData} dailyQuestion={dailyQuestion} studentId={docId} onOpenMsg={() => setShowMsgModal(true)} generalSettings={generalSettings} totalDays={totalProgramDays} showDialog={showDialog} />}
        {activeTab === 'calendar' && <CalendarView data={data} onDayClick={setSelectedDay} daysArray={daysArray} />}
        {isLeaderboardActive && activeTab === 'leaderboard' && <LeaderboardView students={allStudents} currentStudentId={docId} currentGrade={grade} />}
        {activeTab === 'badges' && <BadgesView data={data} grade={grade} totalDays={totalProgramDays} />}
      </div>
      
      {selectedDay && <DayEditModal day={selectedDay} curriculum={data.customProgram?.[selectedDay] || myCurriculum} initialData={data.days?.[selectedDay]} onClose={() => setSelectedDay(null)} onSave={saveDayData} />}
      
      {showMsgModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-4">
                  <h3 className="font-bold text-lg mb-2">Öğretmene Mesaj</h3>
                  <textarea className="w-full p-2 border rounded-lg mb-4 text-sm" rows="4" placeholder="Mesajınızı yazın..." value={messageText} onChange={e=>setMessageText(e.target.value)}></textarea>
                  <div className="flex gap-2">
                      <button onClick={()=>setShowMsgModal(false)} className="flex-1 bg-slate-200 py-2 rounded-lg font-bold text-slate-600">İptal</button>
                      <button onClick={handleSendMessage} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold">Gönder</button>
                  </div>
              </div>
          </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around items-center z-40 w-full max-w-md mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <NavButton icon={Home} label="Ana Sayfa" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavButton icon={Calendar} label="Takvim" isActive={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
        {isLeaderboardActive && <NavButton icon={Crown} label="Sıralama" isActive={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />}
        <NavButton icon={Award} label="Rozetler" isActive={activeTab === 'badges'} onClick={() => setActiveTab('badges')} />
      </div>
    </>
  );
}

// --- TEACHER APP BİLEŞENİ ---
function TeacherApp({ user, curriculum, currentAnnouncementData, generalSettings, showDialog }) {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [isEditingProgram, setIsEditingProgram] = useState(false);
    const [isLGSEditorOpen, setIsLGSEditorOpen] = useState(false);
    const [editingStudentProgram, setEditingStudentProgram] = useState(null); 

    const [newAnnouncement, setNewAnnouncement] = useState("");
    const [questionText, setQuestionText] = useState("");
    const [targetGrade, setTargetGrade] = useState("all");
    const [questionImage, setQuestionImage] = useState(null);
    const [questionType, setQuestionType] = useState("text"); 
    const [correctOption, setCorrectOption] = useState("A");

    useEffect(() => {
        if(!user) return;
        const colRef = collection(db, 'artifacts', APP_ID, 'public_data');
        const unsub = onSnapshot(colRef, (snap) => {
            const list = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setStudents(list.sort((a,b) => (parseInt(a.grade)||0) - (parseInt(b.grade)||0) || a.name.localeCompare(b.name)));
        }, (err) => console.log("List Error", err));
        return () => unsub();
    }, [user]);

    const handleSaveAnnouncement = async () => {
        if (!newAnnouncement.trim()) return;
        await setDoc(doc(db, 'artifacts', APP_ID, 'settings', 'announcement'), { text: newAnnouncement, timestamp: serverTimestamp() });
        setNewAnnouncement("");
        showDialog({type:'alert', message:'Duyuru yayınlandı!'});
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const base64 = await compressImage(file);
            setQuestionImage(base64);
        }
    };

    const handleSendQuestion = async () => {
        if (!questionText.trim()) return;
        await setDoc(doc(db, 'artifacts', APP_ID, 'settings', 'dailyQuestion'), { 
            text: questionText, 
            image: questionImage, 
            targetGrade: targetGrade,
            type: questionType,
            correctOption: questionType === 'test' ? correctOption : null,
            timestamp: serverTimestamp() 
        });
        showDialog({type:'alert', message:'Soru gönderildi!'});
        setQuestionText("");
        setQuestionImage(null);
    };

    const deleteStudent = async (studentId) => {
        await deleteDoc(doc(db, 'artifacts', APP_ID, 'public_data', studentId));
        showDialog({type:'alert', message:'Öğrenci silindi.'});
    };
    
    const resetStudentProgress = async (studentId) => {
        const docRef = doc(db, 'artifacts', APP_ID, 'public_data', studentId);
        await updateDoc(docRef, { days: deleteField(), customProgram: deleteField() });
        showDialog({type:'alert', message:'Öğrenci programı sıfırlandı.'});
    };

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    const totalStudents = students.length;
    const activeToday = students.filter(s => s.lastUpdated && new Date(s.lastUpdated.seconds * 1000).toDateString() === new Date().toDateString()).length;
    const totalDays = (parseInt(generalSettings?.programWeeks) || 2) * 7;
    const isAnnouncementActive = currentAnnouncementData && isContentValid(currentAnnouncementData.timestamp);

    if (isEditingProgram) return <ProgramEditorModal curriculum={curriculum} onClose={() => setIsEditingProgram(false)} showDialog={showDialog} />;
    if (isLGSEditorOpen) return <LGSCustomEditorModal initialSettings={generalSettings} onClose={() => setIsLGSEditorOpen(false)} showDialog={showDialog} />;
    if (editingStudentProgram) return <StudentProgramEditorModal student={editingStudentProgram} globalCurriculum={curriculum} totalDays={totalDays} onClose={() => setEditingStudentProgram(null)} showDialog={showDialog} />;

    return (
        <div className="p-4 pb-20 space-y-4">
            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div><h2 className="font-bold text-xl mb-1">Öğretmen Paneli</h2><div className="flex gap-4 mt-2 text-sm"><div><span className="block text-xl font-bold">{totalStudents}</span><span className="text-slate-400 text-xs">Toplam</span></div><div><span className="block text-xl font-bold text-green-400">{activeToday}</span><span className="text-slate-400 text-xs">Aktif</span></div></div></div>
                    <button onClick={() => setIsEditingProgram(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center transition"><Settings className="w-3 h-3 mr-1" /> Şablonlar</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                 <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center"><Sliders className="w-3 h-3 mr-2"/> Kamp & Müfredat Ayarları</h3>
                 <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => setIsLGSEditorOpen(true)}
                        className="w-full bg-blue-50 text-blue-600 border border-blue-200 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-blue-100 transition"
                    >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Kamp & LGS Programını Özelleştir
                    </button>
                 </div>
                 <div className="text-[10px] text-slate-400 text-center">
                     Mevcut Süre: <span className="font-bold text-slate-600">{generalSettings?.programWeeks || 2} Hafta</span> | LGS Konuları: <span className="font-bold text-slate-600">{generalSettings?.customLGS ? 'Özel Seçim' : 'Varsayılan'}</span>
                 </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center"><Bell className="w-3 h-3 mr-2"/> Duyuru Panosu</h3>
                    {isAnnouncementActive && (
                        <div className="mt-2 mb-1 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div><strong>Aktif Duyuru:</strong> {currentAnnouncementData.text} <br/><span className="text-[10px] opacity-75">Bu duyuru 24 saat sonra otomatik gizlenecek.</span></div>
                        </div>
                    )}
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <WaveInput value={newAnnouncement} onChange={e=>setNewAnnouncement(e.target.value)} label="Yeni duyuru metni..." />
                        </div>
                        <button onClick={handleSaveAnnouncement} className="bg-red-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold mb-1 shadow-sm active:scale-95 transition">Yayınla</button>
                    </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center"><HelpCircle className="w-3 h-3 mr-2"/> Günün Sorusu</h3>
                    <div className="flex flex-col mb-2">
                        <div className="flex gap-3 items-end">
                            <select className="text-xs p-2.5 border border-slate-200 rounded-lg bg-white mb-2" value={targetGrade} onChange={e=>setTargetGrade(e.target.value)}><option value="all">Tüm Sınıflar</option>{[1,2,3,4,5,6,7,8].map(g=><option key={g} value={g.toString()}>{g}. Sınıf</option>)}</select>
                            <div className="flex-1">
                                <WaveInput value={questionText} onChange={e=>setQuestionText(e.target.value)} label="Soru metni..." />
                            </div>
                        </div>
                        <div className="flex gap-2 items-center mt-2">
                            <select className="text-xs p-2 border border-slate-200 rounded-lg bg-white" value={questionType} onChange={e=>setQuestionType(e.target.value)}><option value="text">Klasik</option><option value="test">Test (A,B,C,D)</option></select>
                            {questionType === 'test' && (<select className="text-xs p-2 border rounded-lg bg-white bg-green-50 text-green-700 font-bold" value={correctOption} onChange={e=>setCorrectOption(e.target.value)}><option value="A">Doğru: A</option><option value="B">Doğru: B</option><option value="C">Doğru: C</option><option value="D">Doğru: D</option></select>)}
                        </div>
                        <div className="flex items-center gap-2 mt-4"><label className="flex items-center justify-center bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-100 transition w-full border border-indigo-200"><Camera className="w-4 h-4 mr-2" />{questionImage ? "Fotoğraf Seçildi" : "Fotoğraf Ekle"}<input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label></div>
                    </div>
                    <button onClick={handleSendQuestion} className="w-full bg-violet-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition mt-2">Soruyu Gönder</button>
                </div>
            </div>
            
            <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200 shrink-0">
                <WaveInput 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    label="Öğrenci ara..." 
                    icon={Search} 
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                {filteredStudents.map(std => <StudentDetailRow key={std.id} student={std} onDelete={deleteStudent} onReset={resetStudentProgress} curriculum={curriculum?.[String(std.grade)] || DEFAULT_CURRICULUM[7]} totalDays={totalDays} showDialog={showDialog} openCustomProgram={setEditingStudentProgram} />)}
            </div>
        </div>
    )
}

function StudentDetailRow({ student, onDelete, onReset, curriculum, totalDays, showDialog, openCustomProgram }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const completed = Object.keys(student.days || {}).length;
  const pct = Math.round((completed / (totalDays || 14)) * 100);
  const daysArray = Array.from({ length: (totalDays || 14) }, (_, i) => i + 1);

  const openMessagePrompt = () => {
    showDialog({
        type: 'prompt',
        title: 'Öğrenciye Not Gönder',
        message: 'Bu not öğrencinin ekranında görünecektir. (Notu silmek için kutuyu boş bırakıp onaylayın)',
        defaultValue: student.teacherMessage || "",
        onConfirm: async (customMsg) => {
             try {
                 const docRef = doc(db, 'artifacts', APP_ID, 'public_data', student.id);
                 await setDoc(docRef, { teacherMessage: customMsg, teacherMessageTime: serverTimestamp() }, { merge: true });
                 showDialog({type:'alert', message:'Not başarıyla kaydedildi!'});
             } catch(e) {
                 showDialog({type:'alert', message: "Bir hata oluştu: " + e.message});
             }
        }
    });
  };

  const handleDownloadReport = () => { 
    showDialog({
        type: 'prompt',
        title: 'Karne Oluştur',
        message: 'Karneye özel bir not eklemek ister misiniz?',
        defaultValue: student.teacherMessage || "",
        onConfirm: (customMsg) => {
             try {
                 generateReportCard(student, curriculum || [], customMsg);
             } catch(e) {
                 showDialog({type:'alert', message: "Karne oluşturulurken bir hata oluştu: " + e.message});
             }
        }
    });
  };

  const handleResetSecure = () => {
      showDialog({
          type: 'confirm',
          title: 'İlerlemeyi Sıfırla',
          message: '⚠️ DİKKAT: Öğrencinin ilerlemesini sıfırlamak üzeresiniz.\n\nÖğrencinin şu ana kadar çözdüğü tüm sorular ve veriler SİLİNECEK.\n\nLütfen sıfırlama yapmadan önce öğrencinin KARNESİNİ İNDİRDİĞİNİZDEN emin olun.\n\nDevam etmek istiyor musunuz?',
          onConfirm: () => onReset(student.id)
      });
  };

  const hasStudentMessage = student.studentMessage && isContentValid(student.studentMessageTime);
  const hasActiveTeacherMessage = student.teacherMessage && isContentValid(student.teacherMessageTime);

  return (
    <div className={`tc-card ${isFlipped ? 'flipped' : ''}`}>
      <div className="tc-content">
        {/* ÖN YÜZ */}
        <div className="tc-front p-6">
            <div className="tc-front-bg">
                <div className="tc-circle"></div>
                <div className="tc-circle" id="tc-right"></div>
                <div className="tc-circle" id="tc-bottom"></div>
            </div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20 shadow-sm">
                            {student.grade}. Sınıf
                        </span>
                        {hasStudentMessage && (
                            <span className="bg-blue-500 text-white text-[10px] px-2 py-1 rounded-full font-bold animate-pulse shadow-lg flex items-center border border-blue-400">
                                <MessageSquare className="w-3 h-3 mr-1"/> 1 Mesaj
                            </span>
                        )}
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-1 leading-tight drop-shadow-md">{student.name}</h3>
                    <p className="text-indigo-200 text-sm font-medium">Kamp İlerlemesi</p>
                </div>

                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-5xl font-black drop-shadow-md">{pct}%</div>
                        <div className="text-sm font-bold opacity-90">{completed}/{totalDays} Gün</div>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-3 mb-6 shadow-inner border border-white/10">
                        <div className={`h-3 rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-green-400' : 'bg-gradient-to-r from-indigo-400 to-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.5)]'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                    </div>
                    
                    <button onClick={() => setIsFlipped(true)} className="w-full bg-white text-indigo-900 py-3.5 rounded-xl font-bold flex items-center justify-center hover:bg-indigo-50 transition shadow-[0_4px_15px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95">
                        Detayları Gör <RotateCcw className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>
        </div>

        {/* ARKA YÜZ */}
        <div className="tc-back">
            {/* Header */}
            <div className="bg-white p-4 flex justify-between items-center border-b border-slate-200 shrink-0 shadow-sm relative z-40">
                <div className="font-bold text-slate-800 text-sm flex items-center">
                    {/* Hamburger Menü (User İkonu Yerine) */}
                    <input type="checkbox" id={`ham-${student.id}`} className="ham-input" checked={isMenuOpen} onChange={(e) => setIsMenuOpen(e.target.checked)} />
                    <label htmlFor={`ham-${student.id}`} className="ham-toggle">
                        <div className="ham-bars ham-bar1"></div>
                        <div className="ham-bars ham-bar2"></div>
                        <div className="ham-bars ham-bar3"></div>
                    </label>
                    <span className="ml-1 truncate">{student.name}</span>
                </div>
                <button onClick={() => { setIsFlipped(false); setIsMenuOpen(false); }} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition active:scale-95">
                    <X className="w-5 h-5"/>
                </button>
            </div>

            <div className="relative flex-1 min-h-0 flex flex-col bg-slate-50 overflow-hidden">
                
                {/* Arka Plan Karartması (Menü Açıkken) */}
                {isMenuOpen && (
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] z-20 transition-opacity" onClick={() => setIsMenuOpen(false)} />
                )}

                {/* Yandan Açılan Kaydırmalı Menü (UIVERSE) */}
                <div className={`side-panel ${isMenuOpen ? 'open' : ''}`}>
                    <div className="p-2 flex-1 overflow-y-auto">
                        <div className="action-menu">
                            <ul className="list">
                                <li className="element primary" onClick={() => { openCustomProgram(student); setIsMenuOpen(false); }}>
                                    <Target />
                                    <span className="label">Bireysel Prog.</span>
                                </li>
                                <li className="element warning" onClick={() => { handleDownloadReport(); setIsMenuOpen(false); }}>
                                    <ImageIcon />
                                    <span className="label">Karne İndir</span>
                                </li>
                                <li className="element info" onClick={() => { openMessagePrompt(); setIsMenuOpen(false); }}>
                                    <Send />
                                    <span className="label">Öğrenciye Not Gönder</span>
                                </li>
                            </ul>
                            <div className="separator"></div>
                            <ul className="list">
                                <li className="element default" onClick={() => { handleResetSecure(); setIsMenuOpen(false); }}>
                                    <RotateCcw />
                                    <span className="label">İlerlemeyi Sıfırla</span>
                                </li>
                                <li className="element danger" onClick={() => { 
                                    setIsMenuOpen(false); 
                                    showDialog({type: 'confirm', message: 'Bu öğrenciyi silmek istediğinize emin misiniz?', onConfirm: () => onDelete(student.id)}); 
                                }}>
                                    <Trash2 />
                                    <span className="label">Öğrenciyi Sil</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Geçmiş Veriler (Artık tüm alanı kaplıyor) */}
                <div className="overflow-y-auto p-4 flex-1 space-y-4 text-sm relative">
                    {hasStudentMessage && (
                        <div className="bg-white p-3 rounded-xl border border-blue-200 flex gap-2 shadow-sm shrink-0">
                            <MessageSquare className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 block uppercase">Öğrencinin Mesajı</span>
                                <p className="text-xs text-slate-700 font-medium">{student.studentMessage}</p>
                            </div>
                        </div>
                    )}

                    {hasActiveTeacherMessage && (
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-start gap-2 shadow-sm shrink-0">
                            <Info className="w-4 h-4 mt-0.5 shrink-0 text-indigo-600" />
                            <div>
                                <span className="text-[10px] font-bold text-indigo-600 block uppercase">Gönderilen Not</span>
                                <p className="text-xs text-slate-700 font-medium mt-0.5">{student.teacherMessage}</p>
                                <span className="text-[9px] opacity-75 mt-1 block">Bu not 24 saat sonra gizlenecektir.</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0 min-h-full">
                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center border-b pb-2"><History className="w-4 h-4 mr-1.5 text-slate-400"/> Geçmiş Günler</h5>
                        <div className="space-y-3">
                            {daysArray.map(day => {
                                const dayData = student.days?.[day];
                                if (!dayData) return null;
                                const dayCurriculumActive = student.customProgram?.[day] || curriculum;

                                return (
                                    <div key={day} className="text-xs border-b border-slate-50 last:border-0 pb-3 mb-3">
                                        <div className="font-bold text-indigo-600 mb-1.5 bg-indigo-50 px-2 py-0.5 rounded inline-block">{day}. Gün</div>
                                        <div className="flex flex-col gap-1.5 pl-1">
                                            {safeArray(dayCurriculumActive).map((item, idx) => {
                                                const meta = getSubjectInfo(item);
                                                const key = item.id;
                                                
                                                if (meta.type === 'question') {
                                                    const correct = dayData[key + 'True']; const wrong = dayData[key + 'False'];
                                                    if (correct || wrong) return <div key={key + idx} className="flex items-start text-slate-700 leading-tight"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-1.5 shrink-0 mt-px"/> <span><span className="font-semibold">{meta.label}:</span> {correct || 0}D {wrong || 0}Y</span></div>
                                                }
                                                else if (meta.type === 'selection') {
                                                    const selection = dayData[key]; const duration = dayData[key + 'Duration'];
                                                    if (selection) return <div key={key + idx} className="flex items-start text-slate-700 leading-tight"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-1.5 shrink-0 mt-px"/> <span><span className="font-semibold">{meta.label}:</span> {selection} ({duration || 30}dk)</span></div>
                                                }
                                                else if (meta.type === 'duration') {
                                                    if (dayData[key] === true) return <div key={key + idx} className="flex items-start text-slate-700 leading-tight"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-1.5 shrink-0 mt-px"/> <span><span className="font-semibold">{meta.label}:</span> Tamamlandı</span></div>
                                                }
                                                return <div key={key + idx} className="flex items-start text-red-400 opacity-70 leading-tight"><XCircle className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-px"/> <span><span className="font-semibold">{meta.label}:</span> Yapılmadı</span></div>
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

function BadgesView({ data, grade, totalDays }) {
    const validBadges = BADGE_DEFINITIONS.filter(b => grade >= b.minGrade);
    const earnedCount = validBadges.filter(b => b.check(data.days || {})).length;
    const totalCount = validBadges.length;
    const progress = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

    return (
        <div className="pb-16 animate-in duration-500">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-3xl text-white shadow-lg mb-6 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold flex items-center"><Trophy className="w-6 h-6 mr-2"/> Rozet Koleksiyonum</h2>
                    <div className="mt-4">
                        <div className="flex justify-between text-sm font-bold mb-1"><span>İlerleme</span><span>{earnedCount}/{totalCount}</span></div>
                        <div className="w-full bg-black/20 rounded-full h-3"><div className="bg-white h-3 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
                    </div>
                </div>
                <Star className="absolute top-[-20px] right-[-20px] w-32 h-32 text-white opacity-20 rotate-12" />
            </div>

            <div className="space-y-6">
                {['bronz', 'gumus', 'altin', 'imkansiz'].map(tier => {
                    const tierBadges = validBadges.filter(b => b.tier === tier);
                    if (tierBadges.length === 0) return null;
                    
                    let tierColor = tier === 'bronz' ? 'border-orange-200 bg-orange-50' : 
                                    tier === 'gumus' ? 'border-slate-200 bg-slate-50' : 
                                    tier === 'altin' ? 'border-yellow-200 bg-yellow-50' :
                                    'border-purple-200 bg-purple-50';
                    let tierTitle = tier === 'bronz' ? 'Bronz (Başlangıç)' : 
                                    tier === 'gumus' ? 'Gümüş (Orta Seviye)' : 
                                    tier === 'altin' ? 'Altın (Zor)' : 'Efsanevi (İmkansız)';

                    return (
                        <div key={tier} className={`rounded-2xl border-2 p-4 ${tierColor}`}>
                            <h3 className="font-bold text-slate-700 uppercase text-xs mb-3 tracking-wider">{tierTitle}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {tierBadges.map(badge => {
                                    const isEarned = badge.check(data.days || {});
                                    return (
                                        <div key={badge.id} className={`bg-white p-3 rounded-xl border flex flex-col items-center text-center shadow-sm transition-all ${isEarned ? 'border-green-400 scale-105 shadow-md' : 'border-slate-100 grayscale opacity-60'}`}>
                                            <div className={`p-3 rounded-full mb-2 ${isEarned ? `bg-${badge.color}-100 text-${badge.color}-600` : 'bg-slate-100 text-slate-400'}`}>
                                                <badge.icon className="w-6 h-6" />
                                            </div>
                                            <div className="font-bold text-xs text-slate-800">{badge.title}</div>
                                            <div className="text-[9px] text-slate-500 mt-1 leading-tight">{badge.desc}</div>
                                            {isEarned && <div className="mt-2 bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center"><Check className="w-3 h-3 mr-1"/> Kazanıldı</div>}
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

function CalendarView({ data, onDayClick, daysArray }) {
    return (
        <div className="pb-16 animate-in duration-500">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-indigo-600" />Takvimim</h3>
            <div className="grid grid-cols-3 gap-3">
                {daysArray.map(day => {
                    const isDone = !!data.days?.[day];
                    const isCustom = !!data.customProgram?.[day];
                    return (
                        <button key={day} onClick={() => onDayClick(day)} className={`p-3 rounded-xl border-2 text-left transition transform active:scale-95 ${isDone ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-200'} relative`}>
                            {isCustom && <div className="absolute -top-2 -right-2 bg-violet-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow">ÖZEL</div>}
                            <span className={`text-sm font-bold block ${isDone ? 'text-indigo-700' : 'text-slate-400'}`}>{day}. Gün</span>
                            <div className="mt-2 flex justify-end">{isDone ? <CheckCircle2 className="w-4 h-4 text-indigo-600"/> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}</div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}

function LeaderboardView({ students, currentStudentId, currentGrade }) {
    const ranked = students
        .filter(s => parseInt(s.grade) === parseInt(currentGrade))
        .map(s => {
            let score = 0;
            Object.values(s.days || {}).forEach(day => {
                Object.keys(day).forEach(k => {
                    if (k.endsWith('True')) score += parseInt(day[k] || 0);
                });
            });
            return { ...s, score };
        })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

    const maskName = (name) => {
        if(!name) return "Gizli Kahraman";
        const parts = name.split(' ');
        return parts.map(p => p.charAt(0) + p.slice(1).replace(/./g, '*')).join(' ');
    };

    const top3 = ranked.slice(0, 3);
    const myRankIndex = ranked.findIndex(s => s.id === currentStudentId);
    const me = myRankIndex !== -1 ? ranked[myRankIndex] : null;
    const isMeInTop3 = myRankIndex !== -1 && myRankIndex < 3;

    const renderStudentCard = (student, rank) => {
        const isMe = student.id === currentStudentId;
        const isTop3 = rank <= 3;
        return (
            <div key={student.id} className={`relative flex items-center p-4 rounded-2xl border-2 transition-all ${isMe ? 'border-indigo-500 shadow-md bg-indigo-50/30 scale-[1.02]' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold mr-4 shrink-0 shadow-sm ${isTop3 ? 'bg-gradient-to-br text-white ' + (rank===1?'from-yellow-400 to-yellow-600':rank===2?'from-slate-300 to-slate-500':'from-orange-400 to-orange-600') : 'bg-slate-100 text-slate-500'}`}>
                    {rank}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-sm truncate ${isMe ? 'text-indigo-700' : 'text-slate-800'}`}>
                        {isMe ? student.name + " (Sen)" : maskName(student.name)}
                    </h4>
                    <div className="text-xs text-slate-500 font-medium">{student.grade}. Sınıf Liginde</div>
                </div>
                <div className="text-right ml-2 shrink-0">
                    <div className="font-black text-lg text-slate-800">{student.score}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Doğru</div>
                </div>
                {isMe && <div className="absolute -top-3 -right-2 bg-indigo-500 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-sm animate-bounce border-2 border-white">SENSİN</div>}
            </div>
        )
    };

    return (
        <div className="pb-16 animate-in duration-500 space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                <Crown className="absolute -right-4 -top-4 w-32 h-32 text-white/10 rotate-12" />
                <h2 className="text-2xl font-bold relative z-10 flex items-center"><Crown className="w-6 h-6 mr-2 text-yellow-300"/> {currentGrade}. Sınıf Sıralaması</h2>
                <p className="text-indigo-100 text-sm mt-1 relative z-10">Sadece kendi sınıf düzeyindeki rakiplerinle yarışıyorsun!</p>
            </div>

            <div className="space-y-3">
                {top3.length === 0 && <div className="text-center p-8 text-slate-400 font-medium bg-white rounded-2xl border border-slate-200 shadow-sm">Henüz {currentGrade}. sınıflardan kimse soru çözmedi. İlk çözen sen ol! 🚀</div>}
                
                {top3.map((student, idx) => renderStudentCard(student, idx + 1))}

                {!isMeInTop3 && me && (
                    <>
                        <div className="flex items-center justify-center py-2">
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mx-1"></div>
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mx-1"></div>
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mx-1"></div>
                        </div>
                        {renderStudentCard(me, myRankIndex + 1)}
                    </>
                )}

                {!me && top3.length > 0 && (
                     <div className="text-center p-4 mt-4 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm animate-pulse">
                         <p className="text-sm font-bold text-indigo-700">Sıralamaya girmek için soru çözmeye başla! Hedef ilk 3! 🎯</p>
                     </div>
                )}
            </div>
        </div>
    )
}

function HomeView({ data, grade, studentName, defaultCurriculum, announcementData, dailyQuestion, studentId, onOpenMsg, generalSettings, totalDays, showDialog }) {
    const completedCount = Object.keys(data.days || {}).length;
    const percentage = Math.round((completedCount / (totalDays || 14)) * 100);
    const [advice, setAdvice] = useState("");
    const [greeting, setGreeting] = useState("");
    
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
    const currentDay = daysArray.find(d => !data.days?.[d]) || daysArray[daysArray.length - 1] || 1;

    const todaysCurriculum = data.customProgram?.[currentDay] || defaultCurriculum;
    const safeCurriculum = safeArray(todaysCurriculum);

    const customConfig = generalSettings?.customLGS;
    const fallbackConfig = LGS_CURRICULUM_CALENDAR[0];
    const displayLGS = customConfig || { title: fallbackConfig.title, mat: fallbackConfig.mat, fen: fallbackConfig.fen, tr: fallbackConfig.tr, ink: fallbackConfig.ink, din: fallbackConfig.din, ing: fallbackConfig.ing };

    let totalQuestions = 0;
    Object.values(data.days || {}).forEach(day => {
        Object.keys(day).forEach(key => { if(key.endsWith('True')) totalQuestions += parseInt(day[key] || 0); });
    });

    useEffect(() => {
        const hour = new Date().getHours();
        setGreeting(hour < 12 ? "Günaydın" : hour < 18 ? "Tünaydın" : "İyi Akşamlar");
        const days = Object.keys(data.days || {}).map(Number).sort((a,b)=>b-a);
        const lastDay = days.length > 0 ? data.days[days[0]] : null;
        if (lastDay) {
            const matWrong = parseInt(lastDay.matFalse) || 0;
            const trWrong = parseInt(lastDay.trFalse) || 0;
            if (matWrong > 8) setAdvice(ADVICE_POOL.math[Math.floor(Math.random()*ADVICE_POOL.math.length)]);
            else if (trWrong > 8) setAdvice(ADVICE_POOL.turkish[Math.floor(Math.random()*ADVICE_POOL.turkish.length)]);
            else setAdvice(ADVICE_POOL.general[Math.floor(Math.random()*ADVICE_POOL.general.length)]);
        } else {
            setAdvice("Program sekmesine gidip 1. Günü seç, maceraya başla! 👋");
        }
    }, [data]);

    const showAnnouncement = announcementData && isContentValid(announcementData.timestamp);
    const showTeacherNote = data.teacherMessage && data.teacherMessageTime && isContentValid(data.teacherMessageTime);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {grade === 8 && <LGSCountdown grade={grade} />}

            {grade === 8 && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-indigo-200" />
                            Bu Haftanın LGS Programı
                        </h3>
                        <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                            {generalSettings?.programWeeks} Haftalık Kamp
                        </span>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 gap-3">
                        {[
                            { key: 'mat', label: 'Matematik', val: String(displayLGS.mat || "Konu Yok"), icon: Calculator, color: 'blue' },
                            { key: 'fen', label: 'Fen Bilimleri', val: String(displayLGS.fen || "Konu Yok"), icon: FlaskConical, color: 'green' },
                            { key: 'tr', label: 'Türkçe', val: String(displayLGS.tr || "Konu Yok"), icon: BookOpen, color: 'red' },
                            { key: 'ink', label: 'İnkılap Tarihi', val: String(displayLGS.ink || "Konu Yok"), icon: Scroll, color: 'amber' },
                            { key: 'ing', label: 'İngilizce', val: String(displayLGS.ing || "Konu Yok"), icon: Globe, color: 'purple' },
                            { key: 'din', label: 'Din Kültürü', val: String(displayLGS.din || "Konu Yok"), icon: Heart, color: 'teal' }
                        ].map((item) => (
                            <div key={item.key} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition group">
                                <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 text-${item.color}-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                                    <div className="text-sm font-bold text-slate-800 truncate" title={item.val}>{item.val}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showAnnouncement && <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-pulse"><Bell className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" /><div><h4 className="text-xs font-bold text-red-700 uppercase mb-1">Duyuru</h4><p className="text-sm text-red-800 font-medium leading-tight">{announcementData.text}</p></div></div>}
            
            <DailyQuestionCard questionData={dailyQuestion} grade={grade} studentId={studentId} showDialog={showDialog} />

            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-32 h-32"/></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium mb-1">{greeting},</p>
                            <h2 className="text-3xl font-bold mb-4">{studentName.split(' ')[0]} 🚀</h2>
                        </div>
                        <button onClick={onOpenMsg} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg backdrop-blur-sm transition"><Send className="w-5 h-5 text-white" /></button>
                    </div>
                    
                    <div className="flex justify-between items-end">
                        <div><div className="text-4xl font-bold">{percentage}%</div><div className="text-xs text-indigo-100 opacity-80 mt-1">Kamp Tamamlandı</div></div>
                        <div className="h-14 w-14 rounded-full border-4 border-white/20 flex items-center justify-center font-bold text-lg bg-white/10 backdrop-blur-md">{completedCount}/{totalDays}</div>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2 mt-4"><div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div></div>
                </div>
            </div>

            <LuckyTaskCard grade={grade} />

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="flex items-center gap-2 mb-1"><Flame className={`w-6 h-6 ${completedCount > 0 ? 'text-orange-600 fill-orange-600 animate-pulse' : 'text-slate-300'}`}/><span className="text-2xl font-bold text-slate-800">{completedCount}</span></div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Günlük Zincir</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-2xl font-bold text-slate-800">{totalQuestions}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Soru Çözüldü</span>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
                 <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center relative z-10">
                    <Target className="w-5 h-5 mr-2 text-indigo-600"/> 
                    Hedeflerin ({currentDay}. Gün) {data.customProgram?.[currentDay] && <span className="ml-2 text-[10px] bg-violet-100 text-violet-600 px-2 py-1 rounded-full">SANA ÖZEL</span>}
                 </h3>
                 <div className="grid grid-cols-1 gap-3 relative z-10">
                    {safeCurriculum.map((item, idx) => {
                        const meta = getSubjectInfo(item);
                        return (
                            <div key={item.id + idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-${meta.color}-100 text-${meta.color}-600 group-hover:scale-110 transition`}>
                                        {meta.icon && <meta.icon className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-700 text-sm block">{meta.label}</span>
                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{meta.type === 'question' ? 'Soru Çözümü' : 'Etkinlik'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <span className="font-black text-lg text-slate-800">{item.target}</span>
                                     <span className="text-xs text-slate-400 ml-1">{meta.type === 'question' ? 'soru' : 'dk'}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm"><Lightbulb className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1"/><div><h4 className="text-xs font-bold text-emerald-800 uppercase mb-1">Öğretmenin Diyor Ki:</h4><p className="text-sm text-emerald-900 font-medium leading-tight">"{advice}"</p></div></div>
            {showTeacherNote && (<div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm flex gap-3"><MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" /><div><h4 className="text-xs font-bold text-blue-800 uppercase mb-1">Öğretmeninden Not</h4><p className="text-sm text-blue-900">{data.teacherMessage}</p></div></div>)}
        </div>
    );
}

function DayEditModal({ day, curriculum, initialData, onClose, onSave }) {
  const [form, setForm] = useState(initialData || {});
  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const safeCurriculum = safeArray(curriculum);

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 animate-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold">{day}. Gün Girişi</h3><button onClick={onClose}><X className="w-6 h-6" /></button></div>
        <div className="overflow-y-auto p-4 space-y-4">
            {safeCurriculum.map((item, idx) => {
                const meta = getSubjectInfo(item);
                const key = item.id;
                
                if (meta.type === 'selection') {
                    return (
                        <div key={key + idx} className={`p-3 rounded-xl border ${form[key] ? 'bg-purple-50 border-purple-200' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-2 mb-2"><div className={`w-5 h-5 rounded border flex items-center justify-center ${form[key] ? 'bg-purple-500 border-purple-500' : 'bg-white'}`}>{form[key] && <CheckCircle2 className="w-3 h-3 text-white"/>}</div><span className="text-sm font-bold text-slate-700">{meta.label}</span></div>
                            <div className="flex flex-col gap-2"><select className="w-full p-2 border rounded-lg text-sm bg-white outline-none" value={form[key] || ""} onChange={(e) => handleChange(key, e.target.value)}><option value="">Bugün ne çalıştın?</option>{meta.options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select>{form[key] && (<div className="flex items-center gap-2 animate-in"><Clock className="w-4 h-4 text-slate-400" /><input type="number" className="flex-1 p-2 border rounded-lg text-sm outline-none" placeholder="Kaç dakika?" value={form[key + 'Duration'] || ''} onChange={(e) => handleChange(key + 'Duration', e.target.value)} /></div>)}</div>
                        </div>
                    );
                }
                if (meta.type === 'duration') {
                    return (
                        <div key={key + idx} onClick={() => setForm(p => ({...p, [key]: !p[key]}))} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form[key] ? 'bg-green-50 border-green-200' : 'border-slate-100 hover:border-green-200'}`}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${form[key] ? 'bg-green-500 border-green-500' : 'bg-white'}`}>{form[key] && <CheckCircle2 className="w-3 h-3 text-white"/>}</div>
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">{meta.label}</span>
                                <span className="text-xs text-slate-400">Hedef: {item.target} dk</span>
                            </div>
                        </div>
                    );
                }
                return (
                    <div key={key + idx} className={`p-3 rounded-xl border bg-${meta.color}-50 border-${meta.color}-100`}>
                        <div className="flex justify-between items-center mb-2"><div className={`flex items-center font-bold text-${meta.color}-800 text-xs`}><meta.icon className="w-3 h-3 mr-1" /> {meta.label}</div><span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 font-bold">Hedef: {item.target}</span></div>
                        <div className="flex gap-2"><input type="number" placeholder="D" className="flex-1 p-2 rounded border text-center text-sm font-bold outline-none focus:ring-2" value={form[key+'True']||''} onChange={e=>handleChange(key+'True',e.target.value)} /><input type="number" placeholder="Y" className="flex-1 p-2 rounded border text-center text-sm font-bold outline-none focus:ring-2" value={form[key+'False']||''} onChange={e=>handleChange(key+'False',e.target.value)} /></div>
                    </div>
                );
            })}
        </div>
        <div className="p-4 border-t"><button onClick={() => onSave(day, form)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition">Kaydet</button></div>
      </div>
    </div>
  );
}

// LOGO BİLEŞENİ
function AppLogo({ className, fallbackClassName }) {
    const [imgFailed, setImgFailed] = useState(false);
    
    if (imgFailed) {
        return (
            <div className={`flex items-center justify-center bg-white ${fallbackClassName}`}>
                <svg viewBox="0 0 100 100" className={className || "w-full h-full"} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="50,5 53,15 63,15 55,22 58,32 50,26 42,32 45,22 37,15 47,15" fill="#ca8a04"/>
                    <path d="M55,60 L85,30 M85,30 L70,30 M85,30 L85,45" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M50,80 Q30,60 50,40 Q60,30 50,20" stroke="#0f766e" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M50,40 Q40,30 50,20 Q60,30 50,40" fill="#0f766e"/>
                    <path d="M20,90 Q35,85 50,90 Q65,85 80,90 L80,80 Q65,75 50,80 Q35,75 20,80 Z" stroke="#0f766e" strokeWidth="3" fill="none" strokeLinejoin="round"/>
                </svg>
            </div>
        )
    }

    return (
        <img 
            src="./logo.jpeg" 
            alt="Kamp Takip Logosu" 
            className={`${className} object-cover bg-white`}
            onError={() => setImgFailed(true)} 
        />
    )
}

function LoginScreen({ setRole, studentName, setStudentName, studentGrade, setStudentGrade, showDialog }) {
  const [activeTab, setActiveTab] = useState('student');
  const [pass, setPass] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  
  useEffect(() => {
    const savedRole = localStorage.getItem('kamp_role');
    const savedName = localStorage.getItem('kamp_student_name');
    const savedGrade = localStorage.getItem('kamp_student_grade');
    if (savedRole === 'student' && savedName && savedGrade) {
        setStudentName(savedName);
        setStudentGrade(savedGrade);
        setRole('student');
    }
  }, [setRole, setStudentName, setStudentGrade]);

  const handleLogin = (r) => {
    if (r === 'student') { 
        if (!studentName.trim() || !studentGrade) return showDialog({type:'alert', message:'Lütfen bilgileri doldur.'});
        localStorage.setItem('kamp_role', 'student');
        localStorage.setItem('kamp_student_name', studentName);
        localStorage.setItem('kamp_student_grade', studentGrade);
        setRole('student'); 
    } 
    else { 
        if (pass !== TEACHER_PASS) return showDialog({type:'alert', message:'Hatalı şifre.'});
        localStorage.setItem('kamp_role', 'teacher');
        setRole('teacher'); 
    }
  };

  return (
    <div className="p-6 flex flex-col h-full justify-center bg-white">
        <div className="text-center mb-8">
            <AppLogo className="w-24 h-24 mx-auto mb-4 rounded-2xl shadow-md p-1" fallbackClassName="w-24 h-24 mx-auto mb-4 rounded-2xl shadow-md border border-slate-100 p-2" />
            <h2 className="text-4xl font-bold text-indigo-600 mb-1 spencerian">Mrt Akademi</h2>
            <p className="text-slate-500 text-sm mt-2">Başlamak için lütfen giriş yapın.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => setActiveTab('student')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Öğrenci</button>
            <button onClick={() => setActiveTab('teacher')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Öğretmen</button>
        </div>
        {activeTab === 'student' ? (
            <div className="space-y-2">
                <div className="mb-4">
                    <WaveInput value={studentName} onChange={(e)=>setStudentName(e.target.value)} label="Ad Soyad" icon={User} />
                </div>
                <div><label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Sınıf Seçimi</label><div className="grid grid-cols-4 gap-2">{[1,2,3,4,5,6,7,8].map(g=><button key={g} onClick={()=>setStudentGrade(g.toString())} className={`py-2 rounded-lg font-bold border ${studentGrade===g.toString()?'bg-indigo-600 text-white border-indigo-600':'bg-white text-slate-600 hover:border-indigo-300'}`}>{g}. Sınıf</button>)}</div></div>
                <button onClick={()=>handleLogin('student')} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 active:scale-95 transition">Başla</button>
            </div>
        ) : (
            <div className="space-y-2">
                <div className="mb-4">
                    <WaveInput 
                        type={showPassword ? "text" : "password"} 
                        value={pass} 
                        onChange={(e)=>setPass(e.target.value)} 
                        label="Öğretmen Şifresi" 
                        icon={LockKeyhole} 
                        rightElement={
                            <label className="uiverse-checkbox" style={{ '--chk-color': '#4f46e5', '--chk-bg': '#4f46e51f', fontSize: '14px' }}>
                                <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
                                <div className="uiverse-checkmark"></div>
                            </label>
                        }
                    />
                </div>
                <button onClick={()=>handleLogin('teacher')} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 active:scale-95 transition">Giriş Yap</button>
            </div>
        )}
    </div>
  );
}

const App = () => {
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
  const [generalSettings, setGeneralSettings] = useState({ programWeeks: 2, customLGS: null });
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    let unsubscribe;
    const initAuth = async () => {
        try {
            await setPersistence(auth, browserLocalPersistence);
        } catch (e) {}
        
        unsubscribe = onAuthStateChanged(auth, async (u) => { 
            if (u) {
                setUser(u); 
                setLoading(false); 
            } else {
                try {
                    await signInAnonymously(auth); 
                } catch(e) { 
                    console.error("Auth init", e); 
                    setLoading(false);
                }
            }
        });
    };
    initAuth();
    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const docRef = doc(db, 'artifacts', APP_ID, 'settings', 'curriculum');
    const unsubCurriculum = onSnapshot(docRef, (snap) => { 
        if (snap.exists()) setCurriculum(snap.data()); 
        else setDoc(docRef, DEFAULT_CURRICULUM).catch(e => console.log(e)); 
    }, (error) => console.log("Curriculum Error", error));
    
    const annRef = doc(db, 'artifacts', APP_ID, 'settings', 'announcement');
    const unsubAnnounce = onSnapshot(annRef, (snap) => { 
        if (snap.exists()) setAnnouncementData(snap.data()); 
    }, (error) => console.log("Announce Error", error));

    const qRef = doc(db, 'artifacts', APP_ID, 'settings', 'dailyQuestion');
    const unsubQ = onSnapshot(qRef, (snap) => { 
        if (snap.exists()) setDailyQuestion(snap.data()); 
    }, (error) => console.log("Question Error", error));

    const settingsRef = doc(db, 'artifacts', APP_ID, 'settings', 'general');
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
        if(snap.exists()) setGeneralSettings(snap.data());
        else setDoc(settingsRef, { programWeeks: 2, customLGS: null }).catch(e => console.log(e));
    }, (error) => console.log("General Settings Error", error));

    return () => { unsubCurriculum(); unsubAnnounce(); unsubQ(); unsubSettings(); };
  }, [user]);

  const handleLogout = () => { 
      localStorage.removeItem('kamp_role');
      localStorage.removeItem('kamp_student_name');
      localStorage.removeItem('kamp_student_grade');
      setRole(null); 
      setStudentName(''); 
      setStudentGrade(''); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex justify-center selection:bg-indigo-100">
      <UiverseStyles />
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        
        <header className="bg-indigo-600 text-white p-4 pt-8 sticky top-0 z-30 shadow-md flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><GraduationCap className="w-6 h-6 text-white" /></div>
                <div>
                    <h1 className="text-3xl font-bold leading-none spencerian tracking-wide">Mrt Akademi</h1>
                    <span className="text-[10px] opacity-80 uppercase tracking-wider block mt-1">V44 Final</span>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                {!role && <button onClick={() => setShowInstallModal(true)} className="flex items-center text-xs bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-full"><Download className="w-3 h-3 mr-1" /> İndir</button>}
                <button onClick={() => setShowGuide(true)} className="p-1.5 bg-indigo-500 rounded-full hover:bg-indigo-400"><HelpCircle className="w-4 h-4 text-white" /></button>
                {role && <button onClick={handleLogout} className="p-1.5 bg-indigo-700 rounded hover:bg-red-500"><LogOut className="w-4 h-4" /></button>}
            </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 bg-slate-50">
            {!user || !role ? (
                <LoginScreen setRole={setRole} studentName={studentName} setStudentName={setStudentName} studentGrade={studentGrade} setStudentGrade={setStudentGrade} showDialog={setDialog} />
            ) : role === 'student' ? (
                <StudentApp user={user} studentName={studentName} grade={parseInt(studentGrade)} curriculum={curriculum} announcementData={announcementData} dailyQuestion={dailyQuestion} generalSettings={generalSettings} showDialog={setDialog} />
            ) : (
                <TeacherApp user={user} curriculum={curriculum} currentAnnouncementData={announcementData} generalSettings={generalSettings} showDialog={setDialog} />
            )}
        </main>

        {showInstallModal && <InstallGuideModal onClose={() => setShowInstallModal(false)} />}
        {showGuide && <AppGuideModal onClose={() => setShowGuide(false)} />}

        {dialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="font-bold text-lg mb-2 text-slate-800">{dialog.title || 'Bilgi'}</h3>
              <p className="text-sm text-slate-600 mb-4 whitespace-pre-line leading-relaxed">{dialog.message}</p>
              
              {dialog.type === 'prompt' && (
                  <input
                    autoFocus
                    className="w-full p-3 border border-slate-200 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    defaultValue={dialog.defaultValue}
                    id="prompt-input"
                    placeholder="Mesajınızı girin..."
                  />
              )}
              
              <div className="flex justify-end gap-2 mt-2">
                  {dialog.type !== 'alert' && (
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition" onClick={() => setDialog(null)}>İptal</button>
                  )}
                  <button
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-sm"
                    onClick={() => {
                      const val = dialog.type === 'prompt' ? document.getElementById('prompt-input').value : true;
                      if(dialog.onConfirm) dialog.onConfirm(val);
                      setDialog(null);
                    }}
                  >
                    {dialog.type === 'alert' ? 'Tamam' : 'Onayla'}
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
