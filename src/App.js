import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, BookOpen, FlaskConical, Leaf, Users, CheckCircle2, 
  Download, LogOut, User, Calendar, Home, Star, MessageSquare, 
  ChevronUp, ChevronDown, X, Share, MoreVertical, Phone, AlertTriangle, 
  RefreshCcw, LockKeyhole, GraduationCap, Lightbulb, Trophy, Flame, 
  Target, Zap, Search, Award, Loader2, Trash2, TrendingUp, Settings, Plus, Save, Activity,
  History, Edit3, Bell, Check, List, Clock, XCircle, HelpCircle, Info, Gift, Image as ImageIcon, Camera, Palette, FileText, Send, Lock, Crown, Gem
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

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
const LGS_DATE_2027 = new Date('2027-06-06T09:30:00'); // Tahmini

// --- YARDIMCI: TOPLAM HESAPLAMA ---
const countTotalSubject = (days, subjectKey) => {
    let total = 0;
    Object.values(days || {}).forEach(d => {
        if(d[subjectKey + 'True']) total += parseInt(d[subjectKey + 'True'] || 0);
        if(d[subjectKey + 'Duration']) total += parseInt(d[subjectKey + 'Duration'] || 0);
        if(d[subjectKey] === true) total += 1;
    });
    return total;
};

// --- ROZET SİSTEMİ (İMKANSIZ SEVİYE EKLENDİ) ---
const BADGE_DEFINITIONS = [
    // --- BRONZ SEVİYE (KOLAY) ---
    {
        id: 'first_step',
        title: 'İlk Adım',
        desc: 'İlk kez veri girişi yap.',
        tier: 'bronz',
        icon: Star,
        minGrade: 1,
        check: (days) => Object.keys(days).length >= 1
    },
    {
        id: 'math_starter',
        title: 'Matematik Çırağı',
        desc: 'Toplam 50 Matematik sorusu çöz.',
        tier: 'bronz',
        icon: Calculator,
        minGrade: 1,
        check: (days) => countTotalSubject(days, 'mat') >= 50
    },
    
    // --- GÜMÜŞ SEVİYE (ORTA) ---
    {
        id: 'week_streak',
        title: 'Haftalık Seri',
        desc: '7 gün boyunca hiç aksatmadan veri gir.',
        tier: 'gumus',
        icon: Flame,
        minGrade: 1,
        check: (days) => Object.keys(days).length >= 7
    },
    {
        id: 'science_lab',
        title: 'Laboratuvar Faresi',
        desc: 'Toplam 200 Fen sorusu çöz.',
        tier: 'gumus',
        icon: FlaskConical,
        minGrade: 4,
        check: (days) => countTotalSubject(days, 'fen') >= 200
    },

    // --- ALTIN SEVİYE (ZOR) ---
    {
        id: 'full_focus',
        title: 'Odaklanma Kralı',
        desc: 'Bir günde tek seferde 60 dk çalışma kaydet.',
        tier: 'altin',
        icon: Clock,
        minGrade: 5,
        check: (days) => Object.values(days).some(d => Object.keys(d).some(k => k.endsWith('Duration') && parseInt(d[k]) >= 60))
    },
    {
        id: 'perfect_day',
        title: 'Kusursuz Gün',
        desc: 'Bir günde en az 100 soru çöz ve HİÇ YANLIŞ yapma.',
        tier: 'altin',
        icon: Target,
        minGrade: 5,
        check: (days) => Object.values(days).some(d => {
            let totalT = 0, totalF = 0;
            Object.keys(d).forEach(k => {
                if(k.endsWith('True')) totalT += parseInt(d[k]);
                if(k.endsWith('False')) totalF += parseInt(d[k]);
            });
            return totalT >= 100 && totalF === 0;
        })
    },

    // --- İMKANSIZ SEVİYE (EFSANEVİ) ---
    {
        id: 'time_bender',
        title: 'Zaman Bükücü',
        desc: '12 gün boyunca HİÇ aksatmadan veri girişi yap.',
        tier: 'imkansiz',
        icon: Zap,
        minGrade: 1,
        check: (days) => Object.keys(days).length >= 12
    },
    {
        id: 'math_god',
        title: 'Matematik İlahı',
        desc: 'Toplam 1000 Matematik sorusu çöz.',
        tier: 'imkansiz',
        icon: Crown,
        minGrade: 5,
        check: (days) => countTotalSubject(days, 'mat') >= 1000
    },
    {
        id: 'ordinaryus',
        title: 'Ordinaryüs',
        desc: 'Tüm derslerden toplam 2000 soru barajını aş.',
        tier: 'imkansiz',
        icon: Gem,
        minGrade: 6,
        check: (days) => {
            let total = 0;
            Object.values(days).forEach(d => {
                Object.keys(d).forEach(k => { if(k.endsWith('True')) total += parseInt(d[k]||0); });
            });
            return total >= 2000;
        }
    },
    {
        id: 'perfect_storm',
        title: 'Kusursuz Fırtına',
        desc: 'Bir günde 150 soruyu SIFIR yanlışla bitir.',
        tier: 'imkansiz',
        icon: Trophy,
        minGrade: 7,
        check: (days) => Object.values(days).some(d => {
            let totalT = 0, totalF = 0;
            Object.keys(d).forEach(k => {
                if(k.endsWith('True')) totalT += parseInt(d[k]);
                if(k.endsWith('False')) totalF += parseInt(d[k]);
            });
            return totalT >= 150 && totalF === 0;
        })
    }
];

// --- MÜFREDAT YAPISI ---
const DEFAULT_CURRICULUM = {
  1: [{ id: 'mat', target: 5 }, { id: 'tr', target: 5 }, { id: 'hayat', target: 5 }, { id: 'kitap', target: 20 }],
  2: [{ id: 'mat', target: 10 }, { id: 'tr', target: 10 }, { id: 'hayat', target: 10 }, { id: 'kitap', target: 20 }],
  3: [{ id: 'mat', target: 15 }, { id: 'tr', target: 10 }, { id: 'hayat', target: 10 }, { id: 'kitap', target: 30 }],
  4: [{ id: 'mat', target: 20 }, { id: 'tr', target: 20 }, { id: 'fen', target: 15 }, { id: 'sos', target: 15 }, { id: 'kitap', target: 30 }],
  5: [{ id: 'mat', target: 30 }, { id: 'tr', target: 30 }, { id: 'fen', target: 20 }, { id: 'sos', target: 20 }, { id: 'serbestCalisma', target: 30 }],
  6: [{ id: 'mat', target: 40 }, { id: 'tr', target: 40 }, { id: 'fen', target: 30 }, { id: 'serbestCalisma', target: 30 }],
  7: [{ id: 'mat', target: 50 }, { id: 'tr', target: 50 }, { id: 'fen', target: 30 }, { id: 'serbestCalisma', target: 30 }],
  8: [{ id: 'mat', target: 60 }, { id: 'tr', target: 60 }, { id: 'fen', target: 40 }, { id: 'inkilap', target: 25 }, { id: 'serbestCalisma', target: 30 }]
};

// --- DERS TANIMLARI ---
const SUBJECT_METADATA = {
  mat: { label: "Matematik", icon: Calculator, color: "blue", type: "question" },
  tr: { label: "Türkçe", icon: BookOpen, color: "red", type: "question" },
  fen: { label: "Fen Bilimleri", icon: FlaskConical, color: "green", type: "question" },
  hayat: { label: "Hayat Bilgisi", icon: Leaf, color: "emerald", type: "question" },
  sos: { label: "Sosyal Bilgiler", icon: Users, color: "orange", type: "question" },
  inkilap: { label: "İnkılap Tarihi", icon: BookOpen, color: "amber", type: "question" },
  ing: { label: "İngilizce", icon: MessageSquare, color: "purple", type: "question" },
  din: { label: "Din Kültürü", icon: Star, color: "teal", type: "question" },
  kitap: { label: "Kitap Okuma", icon: BookOpen, color: "pink", type: "duration" },
  spor: { label: "Spor/Egzersiz", icon: Trophy, color: "cyan", type: "duration" },
  kodlama: { label: "Kodlama", icon: Zap, color: "violet", type: "duration" },
  serbestCalisma: { 
      label: "Serbest Çalışma", icon: List, color: "indigo", type: "selection", 
      options: ["Kitap Okuma 📚", "Matematik Konu 🧮", "Fen Konu 🧪", "Türkçe Konu 📖", "Sosyal/İnkılap Konu 🌍", "İngilizce Konu 🗣️", "Din Kültürü Konu 🕌"] 
  }
};

const getSubjectInfo = (item) => {
    const baseMeta = SUBJECT_METADATA[item.id] || { label: item.id, icon: Star, color: 'gray', type: 'question' };
    return { ...baseMeta, label: item.customLabel || baseMeta.label, target: item.target };
};

const ADVICE_POOL = {
  math: ["Matematik işlemlerini zihinden değil, kağıda yazarak yapmayı dene. ✍️", "Takıldığın sorularda önce çözümlü örneklere bak. 🧮"],
  turkish: ["Paragraf sorularında önce koyu renkli soru kökünü oku. 👁️", "Kitap okuma saatini 10 dakika artırmaya ne dersin? 📚"],
  science: ["Fen konularını günlük hayattaki olaylarla ilişkilendir. 🧪", "Kavramları karıştırmamak için not tutarak çalış. 📝"],
  general: ["Harika gidiyorsun! Mola vermeyi ve su içmeyi unutma. 💧", "Bugünkü çaban yarınki başarının anahtarıdır. 🗝️"]
};

// --- YARDIMCI FONKSİYONLAR ---
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

const generateReportCard = (student, curriculum) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 1200;

    // Arkaplan
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Çerçeve
    ctx.strokeStyle = '#D4AF37'; 
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.strokeStyle = '#1e293b'; 
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Başlık
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 50px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('BAŞARI BELGESİ', canvas.width / 2, 120);
    
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('KAMP TAKİP SİSTEMİ', canvas.width / 2, 160);

    // Öğrenci
    ctx.fillStyle = '#334155';
    ctx.font = '30px Arial';
    ctx.fillText(`Sayın ${student.name}`, canvas.width / 2, 230);
    ctx.font = 'italic 20px Arial';
    ctx.fillText(`${student.grade}. Sınıf Öğrencisi`, canvas.width / 2, 260);

    // İstatistik
    let totalQ = 0;
    let daysCount = Object.keys(student.days || {}).length;
    Object.values(student.days || {}).forEach(d => {
        Object.keys(d).forEach(k => { if(k.endsWith('True')) totalQ += parseInt(d[k]||0); });
    });

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(100, 300, 600, 100);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`${totalQ} Soru`, 250, 360);
    ctx.fillText(`${daysCount} Gün`, 550, 360);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Toplam Çözüm', 250, 385);
    ctx.fillText('Katılım', 550, 385);

    // ROZETLER (KARNEYE EKLEME)
    let yPos = 480;
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('Kazanılan Rozetler:', 100, yPos);
    yPos += 40;

    let earnedBadges = BADGE_DEFINITIONS.filter(b => b.check(student.days || {}));
    if (earnedBadges.length > 0) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#d97706'; 
        earnedBadges.forEach(badge => {
            ctx.fillText(`★ ${badge.title}`, 100, yPos);
            yPos += 30;
        });
    } else {
        ctx.font = 'italic 16px Arial';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText("- Henüz rozet kazanılmadı -", 100, yPos);
        yPos += 30;
    }
    yPos += 30;

    // Detaylar
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('Performans Özeti:', 100, yPos);
    yPos += 30;

    ctx.font = '16px Arial';
    const safeCurriculum = safeArray(curriculum);
    
    let stats = {};
    safeCurriculum.forEach(item => {
        if(item && item.id) {
            stats[item.id] = { label: item.customLabel || SUBJECT_METADATA[item.id]?.label || item.id, val: 0 };
        }
    });
    
    Object.values(student.days || {}).forEach(d => {
        Object.keys(d).forEach(k => {
            if(k.endsWith('True')) {
                let subj = k.replace('True','');
                if(stats[subj]) stats[subj].val += parseInt(d[k]||0);
            }
        });
    });

    Object.values(stats).forEach(stat => {
        if(stat.val > 0) {
            ctx.fillStyle = '#334155';
            ctx.fillText(`• ${stat.label}: ${stat.val} Soru`, 100, yPos);
            yPos += 30;
        }
    });

    // Öğretmen Görüşü
    if(student.teacherMessage) {
        yPos += 40;
        ctx.fillStyle = '#fef3c7'; 
        ctx.fillRect(90, yPos, 620, 100);
        
        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('Öğretmen Görüşü:', 110, yPos + 30);
        
        ctx.fillStyle = '#4b5563';
        ctx.font = 'italic 16px Arial';
        
        const words = student.teacherMessage.split(' ');
        let line = '';
        let lineY = yPos + 60;
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 580 && n > 0) {
                ctx.fillText(line, 110, lineY);
                line = words[n] + ' ';
                lineY += 25;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 110, lineY);
    }

    // İmza
    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('Sınıf Öğretmeni', 600, 1050);
    ctx.beginPath();
    ctx.moveTo(500, 1020);
    ctx.lineTo(700, 1020);
    ctx.stroke();

    const date = new Date().toLocaleDateString('tr-TR');
    ctx.font = '14px Arial';
    ctx.fillText(`Tarih: ${date}`, 100, 1050);

    const link = document.createElement('a');
    link.download = `${student.name.replace(/\s+/g, '_')}_Karnesi.png`;
    link.href = canvas.toDataURL();
    link.click();
};

const exportToCSV = (students) => {
    let csvContent = "\uFEFF"; 
    csvContent += "Ad Soyad,Sinif,Toplam Soru,Giris Yapilan Gun Sayisi\n";
    students.forEach(std => {
        let totalQ = 0;
        const daysEntered = Object.keys(std.days || {}).length;
        Object.values(std.days || {}).forEach(day => {
            Object.keys(day).forEach(key => { if(key.endsWith('True')) totalQ += parseInt(day[key] || 0); });
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
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `std_${cleanName}_${grade}`;
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
      if (!auth.currentUser) { try { await signInAnonymously(auth); } catch(e) { console.error(e); } }
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

    return () => { unsubCurriculum(); unsubAnnounce(); unsubQ(); };
  }, [user]);

  const handleLogout = () => { setRole(null); setStudentName(''); setStudentGrade(''); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        
        <header className="bg-indigo-600 text-white p-4 pt-8 sticky top-0 z-30 shadow-md flex justify-between items-center">
            <div className="flex items-center space-x-2"><div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><GraduationCap className="w-6 h-6 text-white" /></div><div><h1 className="text-lg font-bold leading-none">Kamp Takip</h1><span className="text-[10px] opacity-80 uppercase tracking-wider">V21 Final</span></div></div>
            <div className="flex items-center space-x-2">
                {!role && <button onClick={() => setShowInstallModal(true)} className="flex items-center text-xs bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-full"><Download className="w-3 h-3 mr-1" /> İndir</button>}
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

// --- EKRANLAR VE BİLEŞENLER ---

function LoginScreen({ setRole, studentName, setStudentName, studentGrade, setStudentGrade }) {
  const [activeTab, setActiveTab] = useState('student');
  const [pass, setPass] = useState('');
  
  const handleLogin = (r) => {
    if (r === 'student') { 
        if (!studentName.trim() || !studentGrade) return alert('Lütfen bilgileri doldur.');
        setRole('student'); 
    } 
    else { 
        if (pass !== TEACHER_PASS) return alert('Hatalı şifre.');
        setRole('teacher'); 
    }
  };

  return (
    <div className="p-6 flex flex-col h-full justify-center bg-white">
        <div className="text-center mb-8"><h2 className="text-2xl font-bold text-slate-800 mb-2">Hoşgeldiniz 👋</h2><p className="text-slate-500 text-sm">Başlamak için lütfen giriş yapın.</p></div>
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => {setActiveTab('student');}} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Öğrenci</button>
            <button onClick={() => {setActiveTab('teacher');}} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Öğretmen</button>
        </div>
        {activeTab === 'student' ? (
            <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Ad Soyad</label><div className="relative mt-1"><User className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" /><input type="text" value={studentName} onChange={(e)=>setStudentName(e.target.value)} className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Örn: Ali Yılmaz" /></div></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Sınıf</label><div className="grid grid-cols-4 gap-2 mt-1">{[1,2,3,4,5,6,7,8].map(g=><button key={g} onClick={()=>setStudentGrade(g.toString())} className={`py-2 rounded-lg font-bold border ${studentGrade===g.toString()?'bg-indigo-600 text-white border-indigo-600':'bg-white text-slate-600 hover:border-indigo-300'}`}>{g}.</button>)}</div></div>
                <button onClick={()=>handleLogin('student')} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 active:scale-95 transition">Başla</button>
            </div>
        ) : (
            <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Şifre</label><div className="relative mt-1"><LockKeyhole className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" /><input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••" /></div></div>
                <button onClick={()=>handleLogin('teacher')} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 active:scale-95 transition">Giriş Yap</button>
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
  const myCurriculum = safeArray(
    (data?.personalCurriculum) || 
    curriculum?.[studentGradeStr] || 
    curriculum?.[7] || 
    []
  );

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

// --- YENİ ROZETLER EKRANI ---
function BadgesView({ data, grade }) {
    const validBadges = BADGE_DEFINITIONS.filter(b => grade >= b.minGrade);
    const earnedCount = validBadges.filter(b => b.check(data.days || {})).length;
    const totalCount = validBadges.length;
    const progress = Math.round((earnedCount / totalCount) * 100);

    return (
        <div className="pb-16 animate-in slide-in-from-bottom-4 duration-500">
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

function HomeView({ data, grade, studentName, curriculum, announcementData, dailyQuestion, studentId, onOpenMsg }) {
    const completedCount = Object.keys(data.days || {}).length;
    const percentage = Math.round((completedCount / TOTAL_DAYS) * 100);
    const [advice, setAdvice] = useState("");
    const [greeting, setGreeting] = useState("");

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
    const safeCurriculum = safeArray(curriculum);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* SADECE 7 ve 8. SINIFLARA LGS SAYACI */}
            {(grade === 7 || grade === 8) && <LGSCountdown grade={grade} />}
            
            {showAnnouncement && <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-pulse"><Bell className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" /><div><h4 className="text-xs font-bold text-red-700 uppercase mb-1">Duyuru</h4><p className="text-sm text-red-800 font-medium leading-tight">{announcementData.text}</p></div></div>}
            
            <DailyQuestionCard questionData={dailyQuestion} grade={grade} studentId={studentId} />

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
                        <div className="h-14 w-14 rounded-full border-4 border-white/20 flex items-center justify-center font-bold text-lg bg-white/10 backdrop-blur-md">{completedCount}/15</div>
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

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center"><Award className="w-4 h-4 mr-2 text-yellow-500"/> Hedeflerin</h3>
                <div className="grid grid-cols-2 gap-2">
                    {safeCurriculum.map((item, idx) => {
                        const meta = getSubjectInfo(item);
                        return (<div key={idx} className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded">{meta.icon && <meta.icon className={`w-4 h-4 text-${meta.color}-500`} />}<span className="font-medium text-slate-600">{meta.label}: {item.target} {meta.type === 'question' ? 'soru' : 'dk'}</span></div>)
                    })}
                </div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm"><Lightbulb className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1"/><div><h4 className="text-xs font-bold text-emerald-800 uppercase mb-1">Öğretmenin Diyor Ki:</h4><p className="text-sm text-emerald-900 font-medium leading-tight">"{advice}"</p></div></div>
            {showTeacherNote && (<div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm flex gap-3"><MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" /><div><h4 className="text-xs font-bold text-blue-800 uppercase mb-1">Öğretmeninden Not</h4><p className="text-sm text-blue-900">{data.teacherMessage}</p></div></div>)}
        </div>
    );
}

function CalendarView({ data, onDayClick }) {
    return (
        <div className="pb-16 animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-indigo-600" />Takvimim</h3>
            <div className="grid grid-cols-3 gap-3">
                {DAYS_ARRAY.map(day => {
                    const isDone = !!data.days?.[day];
                    return (
                        <button key={day} onClick={() => onDayClick(day)} className={`p-3 rounded-xl border-2 text-left transition transform active:scale-95 ${isDone ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                            <span className={`text-sm font-bold block ${isDone ? 'text-indigo-700' : 'text-slate-400'}`}>{day}. Gün</span>
                            <div className="mt-2 flex justify-end">{isDone ? <CheckCircle2 className="w-4 h-4 text-indigo-600"/> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}</div>
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
        if(!user) return;
        const colRef = collection(db, 'artifacts', APP_ID, 'public_data');
        onSnapshot(colRef, (snap) => {
            const list = snap.docs.map(d => ({id: d.id, ...d.data()}));
            list.sort((a,b) => (parseInt(a.grade)||0) - (parseInt(b.grade)||0) || a.name.localeCompare(b.name));
            setStudents(list);
        });
    }, [user]);

    const handleSaveAnnouncement = async () => {
        await setDoc(doc(db, 'artifacts', APP_ID, 'settings', 'announcement'), { text: newAnnouncement, timestamp: serverTimestamp() });
        alert("Duyuru yayınlandı!");
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
        if(window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) {
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'public_data', studentId));
            alert("Öğrenci silindi.");
        }
    };

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalStudents = students.length;
    const activeToday = students.filter(s => s.lastUpdated && new Date(s.lastUpdated.seconds * 1000).toDateString() === new Date().toDateString()).length;

    if (isEditingProgram) return <ProgramEditorModal curriculum={curriculum} onClose={() => setIsEditingProgram(false)} />;

    return (
        <div className="p-4 pb-20 space-y-4">
            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div><h2 className="font-bold text-xl mb-1">Öğretmen Paneli</h2><div className="flex gap-4 mt-2 text-sm"><div><span className="block text-xl font-bold">{totalStudents}</span><span className="text-slate-400 text-xs">Toplam</span></div><div><span className="block text-xl font-bold text-green-400">{activeToday}</span><span className="text-slate-400 text-xs">Aktif</span></div></div></div>
                    <button onClick={() => setIsEditingProgram(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center transition"><Settings className="w-3 h-3 mr-1" /> Program</button>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <div><h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center"><Bell className="w-3 h-3 mr-2"/> Duyuru Panosu</h3><div className="flex gap-2"><input className="flex-1 text-sm p-2 border rounded-lg outline-none" placeholder="Duyuru metni..." value={newAnnouncement} onChange={e=>setNewAnnouncement(e.target.value)} /><button onClick={handleSaveAnnouncement} className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold">Yayınla</button></div></div>
                <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center"><HelpCircle className="w-3 h-3 mr-2"/> Günün Sorusu</h3>
                    <div className="flex flex-col gap-2 mb-2">
                        <div className="flex gap-2">
                            <select className="text-xs p-2 border rounded-lg bg-white" value={targetGrade} onChange={e=>setTargetGrade(e.target.value)}><option value="all">Tüm Sınıflar</option>{[1,2,3,4,5,6,7,8].map(g=><option key={g} value={g.toString()}>{g}. Sınıf</option>)}</select>
                            <input className="flex-1 text-sm p-2 border rounded-lg outline-none" placeholder="Soru metni..." value={questionText} onChange={e=>setQuestionText(e.target.value)} />
                        </div>
                        <div className="flex gap-2 items-center">
                            <select className="text-xs p-2 border rounded-lg bg-white" value={questionType} onChange={e=>setQuestionType(e.target.value)}><option value="text">Klasik</option><option value="test">Test (A,B,C,D)</option></select>
                            {questionType === 'test' && (<select className="text-xs p-2 border rounded-lg bg-white bg-green-50 text-green-700 font-bold" value={correctOption} onChange={e=>setCorrectOption(e.target.value)}><option value="A">Doğru: A</option><option value="B">Doğru: B</option><option value="C">Doğru: C</option><option value="D">Doğru: D</option></select>)}
                        </div>
                        <div className="flex items-center gap-2"><label className="flex items-center justify-center bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-100 transition w-full border border-indigo-200"><Camera className="w-4 h-4 mr-2" />{questionImage ? "Fotoğraf Seçildi" : "Fotoğraf Ekle"}<input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label></div>
                    </div>
                    <button onClick={handleSendQuestion} className="w-full bg-violet-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Soruyu Gönder</button>
                </div>
            </div>
            <div className="relative"><Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" /><input type="text" placeholder="Öğrenci ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 outline-none" /></div>
            {filteredStudents.map(std => <StudentDetailRow key={std.id} student={std} onDelete={deleteStudent} curriculum={curriculum?.[std.grade] || DEFAULT_CURRICULUM[7]} />)}
        </div>
    )
}

function ProgramEditorModal({ curriculum, onClose, specificStudentId }) {
    const [selectedGrade, setSelectedGrade] = useState("7");
    
    const isIndividual = !!specificStudentId;
    const [localCurriculum, setLocalCurriculum] = useState(
        isIndividual ? safeArray(curriculum) : (curriculum || DEFAULT_CURRICULUM)
    );
    
    const [newItem, setNewItem] = useState({ id: 'mat', target: 50, customLabel: '' });

    const handleAddItem = () => { 
        if (isIndividual) {
            setLocalCurriculum(prev => [...prev, newItem]);
        } else {
            setLocalCurriculum(prev => ({ 
                ...prev, 
                [selectedGrade]: [...(prev[selectedGrade] || []), newItem] 
            })); 
        }
        setNewItem({ id: 'mat', target: 50, customLabel: '' }); 
    };
    
    const handleRemoveItem = (index) => { 
        if (isIndividual) {
            setLocalCurriculum(prev => prev.filter((_, i) => i !== index));
        } else {
            setLocalCurriculum(prev => { 
                const newList = [...(prev[selectedGrade] || [])]; 
                newList.splice(index, 1); 
                return { ...prev, [selectedGrade]: newList }; 
            }); 
        }
    };
    
    const handleSave = async () => { 
        try {
            if (isIndividual) {
                const docRef = doc(db, 'artifacts', APP_ID, 'public_data', specificStudentId);
                await setDoc(docRef, { personalCurriculum: localCurriculum }, { merge: true });
                alert('Özel program atandı!');
            } else {
                const docRef = doc(db, 'artifacts', APP_ID, 'settings', 'curriculum'); 
                await setDoc(docRef, localCurriculum); 
                alert('Genel program güncellendi!'); 
            }
            onClose(); 
        } catch (e) {
            console.error(e);
            alert("Kayıt hatası.");
        }
    };
    
    const currentList = isIndividual ? localCurriculum : (localCurriculum[selectedGrade] || []);

    return (
        <div className="p-4 bg-slate-50 min-h-full">
            <button onClick={onClose} className="mb-4 text-slate-500 flex items-center text-sm font-bold"><ChevronDown className="rotate-90 mr-1 w-4 h-4"/> Geri Dön</button>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{isIndividual ? "Öğrenciye Özel Program" : "Genel Program Düzenleyici"}</h2>
            {!isIndividual && <div className="bg-white p-4 rounded-xl shadow-sm mb-4"><label className="text-xs font-bold text-slate-500 uppercase">Sınıf Seç</label><div className="flex gap-2 mt-2 overflow-x-auto pb-2">{[1,2,3,4,5,6,7,8].map(g => (<button key={g} onClick={() => setSelectedGrade(g.toString())} className={`px-4 py-2 rounded-lg font-bold border shrink-0 ${selectedGrade === g.toString() ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600'}`}>{g}. Sınıf</button>))}</div></div>}
            
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4"><h3 className="text-sm font-bold text-slate-700 mb-3">Ders Ekle</h3><div className="flex flex-col gap-3"><div className="flex gap-2"><select className="flex-1 p-2 border rounded-lg text-sm bg-white" value={newItem.id} onChange={e => setNewItem({...newItem, id: e.target.value})}>{Object.keys(SUBJECT_METADATA).map(key => (<option key={key} value={key}>{SUBJECT_METADATA[key].label}</option>))}</select><input type="number" className="w-20 p-2 border rounded-lg text-sm" placeholder="Hedef" value={newItem.target} onChange={e => setNewItem({...newItem, target: parseInt(e.target.value)})} /></div><div className="flex items-center gap-2"><Edit3 className="w-4 h-4 text-slate-400" /><input type="text" className="flex-1 p-2 border rounded-lg text-sm" placeholder="Özel Ders İsmi (İsteğe Bağlı)" value={newItem.customLabel} onChange={e => setNewItem({...newItem, customLabel: e.target.value})} /></div><button onClick={handleAddItem} className="w-full bg-green-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center"><Plus className="w-4 h-4 mr-2"/> Listeye Ekle</button></div></div>
            <div className="space-y-2 mb-20">{safeArray(currentList).map((item, idx) => { const meta = getSubjectInfo(item); return ( <div key={item.id + idx} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center"><div className="flex items-center gap-3">{meta.icon && <div className={`p-2 bg-${meta.color}-50 rounded-lg`}><meta.icon className={`w-5 h-5 text-${meta.color}-600`}/></div>}<div><div className="font-bold text-slate-700 text-sm">{meta.label}</div><div className="text-xs text-slate-500">Hedef: {item.target} {meta.type === 'question' ? 'soru' : 'dk'}</div></div></div><button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4"/></button></div> ) })}</div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t"><button onClick={handleSave} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center shadow-lg"><Save className="w-5 h-5 mr-2"/> Kaydet</button></div>
        </div>
    );
}

function StudentDetailRow({ student, onDelete, curriculum }) {
  const [expanded, setExpanded] = useState(false);
  const [msg, setMsg] = useState(student.teacherMessage || '');
  const [showPersonalProgram, setShowPersonalProgram] = useState(false);
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

  const handleDownloadReport = () => { 
      // Rapor için bireysel program varsa onu kullan
      const reportCurriculum = student.personalCurriculum || curriculum || [];
      generateReportCard(student, reportCurriculum); 
  };

  if (showPersonalProgram) {
      // Editör modala bireysel programı (array) veya genel programı (array) gönder
      const currentCurr = student.personalCurriculum || curriculum || [];
      return <ProgramEditorModal curriculum={currentCurr} onClose={() => setShowPersonalProgram(false)} specificStudentId={student.id} />;
  }

  const stats = {};
  // İstatistik hesabı için güvenli müfredat
  const activeCurriculum = safeArray(student.personalCurriculum || curriculum);
  
  activeCurriculum.forEach(item => { stats[item.id] = { id: item.id, label: item.customLabel || SUBJECT_METADATA[item.id]?.label || item.id, type: SUBJECT_METADATA[item.id]?.type || 'question', correct: 0, wrong: 0, doneCount: 0 }; });
  
  Object.values(student.days || {}).forEach(day => {
      Object.keys(day).forEach(key => {
          if(key.endsWith('True')) { const subj = key.replace('True', ''); if(stats[subj]) stats[subj].correct += parseInt(day[key]||0); }
          else if(key.endsWith('False')) { const subj = key.replace('False', ''); if(stats[subj]) stats[subj].wrong += parseInt(day[key]||0); }
          else if (day[key] === true && stats[key]) { stats[key].doneCount += 1; }
          else if (typeof day[key] === 'string' && stats[key]) { stats[key].doneCount += 1; }
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
            {expanded ? <ChevronUp className="text-slate-400 w-5 h-5 ml-3"/> : <ChevronDown className="text-slate-400 w-5 h-5 ml-3"/>}
        </div>
        {expanded && (
            <div className="bg-slate-50 p-4 border-t border-slate-100 space-y-4">
                {hasStudentMessage && (<div className="bg-white p-3 rounded-lg border border-blue-200 flex gap-2"><MessageSquare className="w-5 h-5 text-blue-500 mt-1" /><div><span className="text-xs font-bold text-blue-600 block uppercase">Öğrencinin Mesajı</span><p className="text-sm text-slate-700">{student.studentMessage}</p></div></div>)}
                <div className="flex gap-2"><button onClick={handleDownloadReport} className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center hover:bg-orange-600 transition shadow-sm"><ImageIcon className="w-4 h-4 mr-2" /> Karne İndir</button><button onClick={() => setShowPersonalProgram(true)} className="flex-1 bg-violet-500 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center hover:bg-violet-600 transition shadow-sm"><Settings className="w-4 h-4 mr-2" /> Özel Program</button></div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center"><Activity className="w-3 h-3 mr-1"/> Toplam İstatistikler</h5>
                    <div className="grid grid-cols-2 gap-2">{Object.values(stats).map(stat => (<div key={stat.id} className="bg-slate-50 p-2 rounded flex justify-between items-center border border-slate-100"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full bg-indigo-500`}></div><span className="font-bold text-xs text-slate-700">{stat.label}</span></div><div className="text-xs font-bold">{stat.type === 'duration' || stat.type === 'selection' ? <span className="text-indigo-600">{stat.doneCount} Gün</span> : <><span className="text-green-600 mr-2">{stat.correct} D</span><span className="text-red-500">{stat.wrong} Y</span></>}</div></div>))}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center"><History className="w-3 h-3 mr-1"/> Geçmiş Günler</h5>
                    <div className="space-y-2">
                        {DAYS_ARRAY.map(day => {
                            const dayData = student.days?.[day];
                            if (!dayData) return null;
                            return (
                                <div key={day} className="text-xs border-b border-slate-100 last:border-0 pb-2 mb-2">
                                    <div className="font-bold text-indigo-600 mb-1">{day}. Gün Özeti:</div>
                                    <div className="flex flex-col gap-1">
                                        {activeCurriculum.map((item, idx) => {
                                            const meta = getSubjectInfo(item);
                                            const key = item.id;
                                            
                                            if (meta.type === 'question') {
                                                const correct = dayData[key + 'True']; const wrong = dayData[key + 'False'];
                                                if (correct || wrong) return <span key={key + idx} className="flex items-center text-slate-700"><CheckCircle2 className="w-3 h-3 text-green-500 mr-1"/> {meta.label}: {correct || 0}D {wrong || 0}Y</span>
                                            }
                                            else if (meta.type === 'selection') {
                                                const selection = dayData[key]; const duration = dayData[key + 'Duration'];
                                                if (selection) return <span key={key + idx} className="flex items-center text-slate-700"><CheckCircle2 className="w-3 h-3 text-green-500 mr-1"/> {meta.label}: {selection} ({duration || 30} dk)</span>
                                            }
                                            else if (meta.type === 'duration') {
                                                if (dayData[key] === true) return <span key={key + idx} className="flex items-center text-slate-700"><CheckCircle2 className="w-3 h-3 text-green-500 mr-1"/> {meta.label}: Tamamlandı</span>
                                            }
                                            return <span key={key + idx} className="flex items-center text-red-400 opacity-70"><XCircle className="w-3 h-3 mr-1"/> {meta.label}: Yapılmadı</span>
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div><div className="flex gap-2 mb-2"><input className="flex-1 text-sm p-2 border rounded-lg outline-none focus:border-slate-400" placeholder="Öğrenciye not..." value={msg} onChange={e=>setMsg(e.target.value)} /></div><button onClick={sendFeedback} className="w-full bg-slate-800 text-white text-sm py-2 rounded-lg font-bold hover:bg-slate-700 transition">Not Gönder</button></div>
                <button onClick={() => onDelete(student.id)} className="w-full text-red-500 text-xs font-bold py-2 border border-red-200 rounded-lg hover:bg-red-50 transition">Öğrenciyi Sil</button>
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
            // 8. Sınıf -> 2026, 7. Sınıf -> 2027
            const targetDate = grade === 8 ? LGS_DATE_2026 : LGS_DATE_2027;
            const difference = targetDate - now; 
            if (difference > 0) { 
                setTimeLeft({ gün: Math.floor(difference / (1000 * 60 * 60 * 24)), saat: Math.floor((difference / (1000 * 60 * 60)) % 24), dk: Math.floor((difference / 1000 / 60) % 60), sn: Math.floor((difference / 1000) % 60) }); 
            } 
        }, 1000); 
        return () => clearInterval(timer); 
    }, [grade]); 
    
    return (
        <div className="bg-slate-800 text-white rounded-xl p-3 mb-4 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-400" /><span className="text-xs font-bold uppercase tracking-wider text-slate-300">{grade === 8 ? "LGS 2026'ya" : "LGS 2027'ye"}</span></div>
            <div className="flex gap-2 text-center">{['gün', 'saat', 'dk', 'sn'].map(unit => (<div key={unit} className="bg-slate-700 px-2 py-1 rounded"><div className="font-mono font-bold text-sm text-indigo-300">{timeLeft[unit] || 0}</div><div className="text-[8px] uppercase text-slate-400">{unit}</div></div>))}</div>
        </div>
    ); 
}

function LuckyTaskCard({ grade }) { const [task, setTask] = useState(null); const getTask = () => { const pool = grade <= 4 ? LUCKY_TASKS.easy : LUCKY_TASKS.hard; setTask(pool[Math.floor(Math.random() * pool.length)]); }; return (<div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden"><div className="relative z-10 flex justify-between items-center"><div><h3 className="font-bold flex items-center"><Gift className="w-5 h-5 mr-2 animate-bounce"/> Şanslı Görev</h3><p className="text-sm text-pink-100 mt-1 min-h-[20px]">{task ? task : "Bugün şansına ne çıkacak?"}</p></div><button onClick={getTask} className="bg-white text-pink-600 px-3 py-2 rounded-lg text-xs font-bold shadow-md active:scale-95 transition">{task ? "Yeni Seç" : "Görevi Aç"}</button></div></div>); }
function DailyQuestionCard({ questionData, grade, studentId }) { const [answer, setAnswer] = useState(""); const [submitted, setSubmitted] = useState(false); const [result, setResult] = useState(null); if (!questionData || !isContentValid(questionData.timestamp)) return null; if (questionData.targetGrade !== 'all' && parseInt(questionData.targetGrade) !== grade) return null; const handleSubmit = () => { if (questionData.type === 'test') { if (answer === questionData.correctOption) { setResult('correct'); alert("Tebrikler! Doğru Cevap 🎉"); } else { setResult('wrong'); alert("Maalesef Yanlış. Doğru cevap: " + questionData.correctOption); } } else { setResult('pending'); alert("Cevabın öğretmene iletildi!"); } setSubmitted(true); }; return (<div className="bg-violet-50 border border-violet-200 p-4 rounded-2xl shadow-sm mb-4"><div className="flex items-center gap-2 mb-2"><HelpCircle className="w-5 h-5 text-violet-600" /><h4 className="font-bold text-violet-700 text-sm">Günün Sorusu</h4></div>{questionData.image && <img src={questionData.image} alt="Soru" className="w-full rounded-lg mb-3 border border-violet-100 shadow-sm" />}<p className="text-sm text-slate-700 font-medium bg-white p-3 rounded-lg border border-violet-100 mb-3">{questionData.text}</p>{!submitted ? (<div className="space-y-2">{questionData.type === 'test' ? (<div className="grid grid-cols-2 gap-2">{['A', 'B', 'C', 'D'].map(opt => (<button key={opt} onClick={() => setAnswer(opt)} className={`p-2 rounded border text-sm font-bold ${answer === opt ? 'bg-violet-600 text-white' : 'bg-white text-slate-600'}`}>{opt}</button>))}</div>) : (<input className="w-full p-2 border rounded text-sm" placeholder="Cevabını yaz..." value={answer} onChange={e => setAnswer(e.target.value)} />)}<button onClick={handleSubmit} className="w-full bg-green-500 text-white py-2 rounded-lg font-bold text-sm mt-2">Cevabı Gönder</button></div>) : (<div className={`text-center font-bold text-sm p-2 rounded ${result === 'correct' ? 'bg-green-100 text-green-700' : result === 'wrong' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{result === 'correct' ? 'Harikasın! Doğru Bildin.' : result === 'wrong' ? 'Olsun, tekrar dene!' : 'Cevabın Kaydedildi.'}</div>)}</div>); }
function AppGuideModal({ onClose }) { return (<div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"><div className="bg-white w-full max-w-md h-[80vh] rounded-2xl flex flex-col overflow-hidden"><div className="bg-indigo-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold flex items-center"><Info className="w-5 h-5 mr-2"/> Kullanım Rehberi</h3><button onClick={onClose}><X className="w-6 h-6"/></button></div><div className="overflow-y-auto p-6 space-y-8 bg-slate-50 flex-1"><GuideSection icon={User} title="Giriş" text="Adını ve sınıfını seçerek başla." /><GuideSection icon={Calendar} title="Program" text="Günün programını 'Program' sekmesinden doldur ve kaydet." /><GuideSection icon={List} title="Serbest Çalışma" text="Ortaokullar için! Listeden ne çalıştığını seç ve süresini gir." /><GuideSection icon={Gift} title="Şanslı Görev" text="Her gün yeni bir akademik görev seni bekliyor." /><GuideSection icon={HelpCircle} title="Günün Sorusu" text="Öğretmeninin gönderdiği özel soruları çöz, anında cevabı gör." /><GuideSection icon={Flame} title="Zinciri Kırma" text="Her gün en az 1 veri girerek ateşini söndürme!" /></div><div className="p-4 bg-white border-t"><button onClick={onClose} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Anlaşıldı! 🚀</button></div></div></div>); }
const GuideSection = ({icon: Icon, title, text}) => (<div className="space-y-2"><div className="flex items-center gap-2 text-indigo-600 font-bold border-b pb-1 border-indigo-200"><Icon className="w-5 h-5"/> {title}</div><p className="text-sm text-slate-600">{text}</p></div>);
function DayEditModal({ day, curriculum, initialData, onClose, onSave }) {
  const [form, setForm] = useState(initialData || {});
  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));
  
  // GÜVENLİ MÜFREDAT KONTROLÜ
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
                            <div className="flex items-center gap-2 mb-2"><div className={`w-5 h-5 rounded border flex items-center justify-center ${form[key] ? 'bg-purple-500 border-purple-500' : 'bg-white'}`}>{form[key] && <CheckCircle2 className="w-3 h-3 text-white"/>}</div><span className="text-sm font-bold text-slate-700">{meta.label}</span></div>
                            <div className="flex flex-col gap-2"><select className="w-full p-2 border rounded-lg text-sm bg-white outline-none" value={form[key] || ""} onChange={(e) => handleChange(key, e.target.value)}><option value="">Bugün ne çalıştın?</option>{meta.options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select>{form[key] && (<div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1"><Clock className="w-4 h-4 text-slate-400" /><input type="number" className="flex-1 p-2 border rounded-lg text-sm outline-none" placeholder="Kaç dakika?" value={form[key + 'Duration'] || ''} onChange={(e) => handleChange(key + 'Duration', e.target.value)} /></div>)}</div>
                        </div>
                    );
                }
                if (meta.type === 'duration') {
                    return (
                        <div key={idx} onClick={() => setForm(p => ({...p, [key]: !p[key]}))} className={`flex items-center gap-3 p-3 rounded-xl border ${form[key] ? 'bg-green-50 border-green-200' : 'border-slate-100'}`}><div className={`w-5 h-5 rounded border flex items-center justify-center ${form[key] ? 'bg-green-500 border-green-500' : 'bg-white'}`}>{form[key] && <CheckCircle2 className="w-3 h-3 text-white"/>}</div><div><span className="text-sm font-bold text-slate-700 block">{meta.label}</span><span className="text-xs text-slate-400">Hedef: {item.target} dk</span></div></div>
                    );
                }
                return (
                    <div key={idx} className={`p-3 rounded-xl border bg-${meta.color}-50 border-${meta.color}-100`}>
                        <div className="flex justify-between items-center mb-2"><div className={`flex items-center font-bold text-${meta.color}-800 text-xs`}><meta.icon className="w-3 h-3 mr-1" /> {meta.label}</div><span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 font-bold">Hedef: {item.target}</span></div>
                        <div className="flex gap-2"><input type="tel" placeholder="D" className="flex-1 p-2 rounded border text-center text-sm font-bold outline-none focus:ring-2" value={form[key+'True']||''} onChange={e=>handleChange(key+'True',e.target.value)} /><input type="tel" placeholder="Y" className="flex-1 p-2 rounded border text-center text-sm font-bold outline-none focus:ring-2" value={form[key+'False']||''} onChange={e=>handleChange(key+'False',e.target.value)} /></div>
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
                <div className="text-center mb-6"><div className="bg-indigo-100 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"><Phone className="w-8 h-8 text-indigo-600" /></div><h3 className="text-xl font-bold text-slate-800">Uygulamayı İndir</h3><p className="text-slate-500 text-sm mt-2">Bu programı bir uygulama gibi kullanmak için:</p></div>
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><div className="text-2xl">🍎</div><div><h4 className="font-bold text-slate-700 text-xs">iPhone:</h4><p className="text-xs text-slate-600">Paylaş <Share className="w-3 h-3 inline"/> {'>'} Ana Ekrana Ekle</p></div></div>
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><div className="text-2xl">🤖</div><div><h4 className="font-bold text-slate-700 text-xs">Android:</h4><p className="text-xs text-slate-600">3 nokta <MoreVertical className="w-3 h-3 inline"/> {'>'} Uygulamayı Yükle</p></div></div>
                </div>
                <button onClick={onClose} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-6">Tamam</button>
            </div>
        </div>
    );
}
