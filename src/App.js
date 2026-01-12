import React, { useState, useEffect } from 'react';
import { 
  Calculator, BookOpen, FlaskConical, Leaf, Users, CheckCircle2, 
  Download, LogOut, User, Calendar, Home, Star, MessageSquare, 
  ChevronUp, ChevronDown, X, Share, MoreVertical, Phone, AlertTriangle, 
  RefreshCcw, LockKeyhole, GraduationCap, Lightbulb, Trophy, Flame, 
  Target, Zap, Search, Award, Loader2, Trash2, TrendingUp, Settings, Plus, Save, Activity,
  History, Edit3
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
// ÖNEMLİ: Veri kaybı olmaması için burayı sabit tutuyoruz.
const APP_ID = "kamp-takip-yonetici-v2"; 
const TEACHER_PASS = "1876"; 
const TOTAL_DAYS = 15;
const DAYS_ARRAY = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

// Varsayılan Müfredat
const DEFAULT_CURRICULUM = {
  1: [{ id: 'mat', target: 5 }, { id: 'tr', target: 5 }, { id: 'hayat', target: 5 }, { id: 'kitap', target: 20 }],
  2: [{ id: 'mat', target: 10 }, { id: 'tr', target: 10 }, { id: 'hayat', target: 10 }, { id: 'kitap', target: 20 }],
  3: [{ id: 'mat', target: 15 }, { id: 'tr', target: 10 }, { id: 'hayat', target: 10 }, { id: 'kitap', target: 30 }],
  4: [{ id: 'mat', target: 20 }, { id: 'tr', target: 20 }, { id: 'fen', target: 15 }, { id: 'sos', target: 15 }, { id: 'kitap', target: 30 }],
  5: [{ id: 'mat', target: 30 }, { id: 'tr', target: 30 }, { id: 'fen', target: 20 }, { id: 'sos', target: 20 }, { id: 'kitap', target: 30 }],
  6: [{ id: 'mat', target: 40 }, { id: 'tr', target: 40 }, { id: 'fen', target: 30 }, { id: 'fenTekrar', target: 30 }],
  7: [{ id: 'mat', target: 50 }, { id: 'tr', target: 50 }, { id: 'fen', target: 30 }, { id: 'fenTekrar', target: 30 }],
  8: [{ id: 'mat', target: 60 }, { id: 'tr', target: 60 }, { id: 'fen', target: 40 }, { id: 'inkilap', target: 25 }, { id: 'fenTekrar', target: 30 }]
};

// Ders Tanımları ve Tipleri
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
  fenTekrar: { label: "Fen Tekrarı", icon: FlaskConical, color: "lime", type: "duration" },
  konu: { label: "Konu Çalışma", icon: Lightbulb, color: "indigo", type: "duration" },
  spor: { label: "Spor/Egzersiz", icon: Trophy, color: "cyan", type: "duration" },
  kodlama: { label: "Kodlama", icon: Zap, color: "violet", type: "duration" }
};

// Yardımcı Fonksiyon: Dersin Adını ve İkonunu Getirir (Özel İsim Desteği)
const getSubjectInfo = (item) => {
    const baseMeta = SUBJECT_METADATA[item.id] || { label: item.id, icon: Star, color: 'gray', type: 'question' };
    // Eğer öğretmen özel isim girdiyse (item.customLabel), onu kullan. Yoksa varsayılanı kullan.
    return {
        ...baseMeta,
        label: item.customLabel || baseMeta.label,
        target: item.target
    };
};

// Akıllı Tavsiye Havuzu
const ADVICE_POOL = {
  math: ["Matematik işlemlerini zihinden değil, kağıda yazarak yapmayı dene. ✍️", "Takıldığın sorularda önce çözümlü örneklere bak. 🧮"],
  turkish: ["Paragraf sorularında önce koyu renkli soru kökünü oku. 👁️", "Kitap okuma saatini 10 dakika artırmaya ne dersin? 📚"],
  science: ["Fen konularını günlük hayattaki olaylarla ilişkilendir. 🧪", "Kavramları karıştırmamak için not tutarak çalış. 📝"],
  general: ["Harika gidiyorsun! Mola vermeyi ve su içmeyi unutma. 💧", "Bugünkü çaban yarınki başarının anahtarıdır. 🗝️"]
};

// Firebase Başlatma
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const generateStudentId = (name, grade) => {
  const cleanName = name.trim().toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
  return `std_${cleanName}_${grade}`;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [curriculum, setCurriculum] = useState(DEFAULT_CURRICULUM);

  useEffect(() => {
    const initAuth = async () => {
      if (!auth.currentUser) {
         try { await signInAnonymously(auth); } catch(e) { console.error(e); }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
        setUser(u); 
        setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'settings', 'curriculum');
    const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            setCurriculum(snap.data());
        } else {
            setDoc(docRef, DEFAULT_CURRICULUM).catch(e => console.error(e));
        }
    });
    return () => unsub();
  }, [user]);

  const handleLogout = () => {
    setRole(null);
    setStudentName('');
    setStudentGrade('');
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 font-medium">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
      Sistem Yükleniyor...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        {/* Header */}
        <header className="bg-indigo-600 text-white p-4 pt-8 sticky top-0 z-30 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><GraduationCap className="w-6 h-6 text-white" /></div>
              <div><h1 className="text-lg font-bold leading-none">Kamp Takip</h1><span className="text-[10px] opacity-80 uppercase tracking-wider">Öğretmen Yönetimli</span></div>
            </div>
            {!role && <button onClick={() => setShowInstallModal(true)} className="flex items-center text-xs bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-full transition"><Download className="w-3 h-3 mr-1" /> İndir</button>}
            {role && (
                <div className="flex items-center space-x-2">
                    <span className="text-xs bg-indigo-700 px-2 py-1 rounded border border-indigo-500">{role === 'student' ? studentName.split(' ')[0] : 'Öğretmen'}</span>
                    <button onClick={handleLogout} className="p-1.5 bg-indigo-700 rounded hover:bg-red-500 transition"><LogOut className="w-4 h-4" /></button>
                </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 bg-slate-50">
            {!user || !role ? (
                <LoginScreen setRole={setRole} studentName={studentName} setStudentName={setStudentName} studentGrade={studentGrade} setStudentGrade={setStudentGrade} />
            ) : role === 'student' ? (
                <StudentApp user={user} studentName={studentName} grade={parseInt(studentGrade)} curriculum={curriculum} />
            ) : (
                <TeacherApp user={user} curriculum={curriculum} />
            )}
        </main>

        {showInstallModal && <InstallGuideModal onClose={() => setShowInstallModal(false)} />}
      </div>
    </div>
  );
}

function LoginScreen({ setRole, studentName, setStudentName, studentGrade, setStudentGrade }) {
  const [activeTab, setActiveTab] = useState('student');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (r) => {
    if (r === 'student') {
        if (!studentName.trim() || !studentGrade) return setError('Lütfen bilgileri doldur.');
        setRole('student');
    } else {
        if (pass !== TEACHER_PASS) return setError('Hatalı şifre.');
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
            <button onClick={() => {setActiveTab('student'); setError('');}} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Öğrenci</button>
            <button onClick={() => {setActiveTab('teacher'); setError('');}} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Öğretmen</button>
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
        {error && <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center justify-center"><AlertTriangle className="w-4 h-4 mr-2" /> {error}</div>}
    </div>
  );
}

function StudentApp({ user, studentName, grade, curriculum }) {
  const [activeTab, setActiveTab] = useState('home');
  const [data, setData] = useState(null); 
  const [selectedDay, setSelectedDay] = useState(null);
   
  const docId = generateStudentId(studentName, grade);
  const myCurriculum = curriculum[grade] || curriculum[7];

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        const newData = { name: studentName, grade: grade, createdAt: serverTimestamp(), days: {} };
        setDoc(docRef, newData, { merge: true }).catch(e => console.error(e));
        setData(newData);
      }
    });
    return () => unsubscribe();
  }, [user, docId, studentName, grade]);

  const saveDayData = async (day, dayData) => {
    setData(prev => ({ ...prev, days: { ...prev.days, [day]: dayData } }));
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', docId);
    await setDoc(docRef, { days: { [day]: dayData }, lastUpdated: serverTimestamp() }, { merge: true });
    setSelectedDay(null);
  };

  if (!data) return <div className="p-8 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />Veriler Hazırlanıyor...</div>;

  return (
    <>
      <div className="p-4 space-y-6 pb-24">
        {activeTab === 'home' && <HomeView data={data} grade={grade} studentName={studentName} curriculum={myCurriculum} />}
        {activeTab === 'calendar' && <CalendarView data={data} onDayClick={setSelectedDay} />}
      </div>
      {selectedDay && <DayEditModal day={selectedDay} curriculum={myCurriculum} initialData={data.days?.[selectedDay]} onClose={() => setSelectedDay(null)} onSave={saveDayData} />}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around items-center z-40 w-full max-w-md mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <NavButton icon={Home} label="Ana Sayfa" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavButton icon={Calendar} label="Program" isActive={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
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

function HomeView({ data, grade, studentName, curriculum }) {
    const completedCount = Object.keys(data.days || {}).length;
    const percentage = Math.round((completedCount / TOTAL_DAYS) * 100);
    const [advice, setAdvice] = useState("");
    const [greeting, setGreeting] = useState("");

    let totalQuestions = 0;
    Object.values(data.days || {}).forEach(day => {
        Object.keys(day).forEach(key => {
            if(key.endsWith('True')) totalQuestions += parseInt(day[key] || 0);
        });
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-32 h-32"/></div>
                <div className="relative z-10">
                    <p className="text-indigo-100 text-sm font-medium mb-1">{greeting},</p>
                    <h2 className="text-3xl font-bold mb-4">{studentName.split(' ')[0]} 🚀</h2>
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-4xl font-bold">{percentage}%</div>
                            <div className="text-xs text-indigo-100 opacity-80 mt-1">Kamp Tamamlandı</div>
                        </div>
                        <div className="h-14 w-14 rounded-full border-4 border-white/20 flex items-center justify-center font-bold text-lg bg-white/10 backdrop-blur-md">
                            {completedCount}/15
                        </div>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2 mt-4"><div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-2xl font-bold text-slate-800">{completedCount} Gün</span>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">İstikrar</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-2xl font-bold text-slate-800">{totalQuestions}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Soru Çözüldü</span>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center"><Award className="w-4 h-4 mr-2 text-yellow-500"/> Hedeflerin</h3>
                <div className="grid grid-cols-2 gap-2">
                    {curriculum.map(item => {
                        const meta = getSubjectInfo(item);
                        return (
                             <div key={item.id} className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded">
                                 {meta.icon && <meta.icon className={`w-4 h-4 text-${meta.color}-500`} />}
                                 <span className="font-medium text-slate-600">{meta.label}: {item.target} {meta.type === 'duration' ? 'dk' : 'soru'}</span>
                             </div>
                        )
                    })}
                </div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
                <Lightbulb className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1"/>
                <div>
                    <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1">Öğretmenin Diyor Ki:</h4>
                    <p className="text-sm text-emerald-900 font-medium leading-tight">"{advice}"</p>
                </div>
            </div>

            {data.teacherMessage && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm flex gap-3">
                    <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div><h4 className="text-xs font-bold text-blue-800 uppercase mb-1">Öğretmeninden Not</h4><p className="text-sm text-blue-900">{data.teacherMessage}</p></div>
                </div>
            )}
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
function TeacherApp({ user, curriculum }) {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditingProgram, setIsEditingProgram] = useState(false);

    useEffect(() => {
        if(!user) return;
        const colRef = collection(db, 'artifacts', APP_ID, 'public_data');
        onSnapshot(colRef, (snap) => {
            const list = snap.docs.map(d => ({id: d.id, ...d.data()}));
            list.sort((a,b) => (parseInt(a.grade)||0) - (parseInt(b.grade)||0) || a.name.localeCompare(b.name));
            setStudents(list);
        });
    }, [user]);

    const deleteStudent = async (studentId) => {
        if(window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) {
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'public_data', studentId));
        }
    };

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalStudents = students.length;
    const activeToday = students.filter(s => s.lastUpdated && new Date(s.lastUpdated.seconds * 1000).toDateString() === new Date().toDateString()).length;

    if (isEditingProgram) {
        return <ProgramEditorModal curriculum={curriculum} onClose={() => setIsEditingProgram(false)} />;
    }

    return (
        <div className="p-4 pb-20 space-y-4">
            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="font-bold text-xl mb-1">Öğretmen Paneli</h2>
                        <div className="flex gap-4 mt-2 text-sm">
                            <div><span className="block text-xl font-bold">{totalStudents}</span><span className="text-slate-400 text-xs">Toplam</span></div>
                            <div><span className="block text-xl font-bold text-green-400">{activeToday}</span><span className="text-slate-400 text-xs">Aktif</span></div>
                        </div>
                    </div>
                    <button onClick={() => setIsEditingProgram(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center transition">
                        <Settings className="w-4 h-4 mr-2" /> Programı Düzenle
                    </button>
                </div>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="Öğrenci ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 outline-none" />
            </div>
            {filteredStudents.map(std => <StudentDetailRow key={std.id} student={std} onDelete={deleteStudent} curriculum={curriculum[std.grade] || DEFAULT_CURRICULUM[7]} />)}
        </div>
    )
}

function ProgramEditorModal({ curriculum, onClose }) {
    const [selectedGrade, setSelectedGrade] = useState("7");
    const [localCurriculum, setLocalCurriculum] = useState(curriculum);
    const [newItem, setNewItem] = useState({ id: 'mat', target: 50, customLabel: '' });

    const handleAddItem = () => {
        setLocalCurriculum(prev => ({
            ...prev,
            [selectedGrade]: [...(prev[selectedGrade] || []), newItem]
        }));
        setNewItem({ id: 'mat', target: 50, customLabel: '' }); // Sıfırla
    };

    const handleRemoveItem = (index) => {
        setLocalCurriculum(prev => {
            const newList = [...prev[selectedGrade]];
            newList.splice(index, 1);
            return { ...prev, [selectedGrade]: newList };
        });
    };

    const handleSave = async () => {
        const docRef = doc(db, 'artifacts', APP_ID, 'settings', 'curriculum');
        await setDoc(docRef, localCurriculum);
        alert('Program güncellendi!');
        onClose();
    };

    const currentList = localCurriculum[selectedGrade] || [];

    return (
        <div className="p-4 bg-slate-50 min-h-full">
            <button onClick={onClose} className="mb-4 text-slate-500 flex items-center text-sm font-bold"><ChevronDown className="rotate-90 mr-1 w-4 h-4"/> Geri Dön</button>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Program Düzenleyici</h2>
            
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase">Sınıf Seç</label>
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                    {[1,2,3,4,5,6,7,8].map(g => (
                        <button key={g} onClick={() => setSelectedGrade(g.toString())} className={`px-4 py-2 rounded-lg font-bold border shrink-0 ${selectedGrade === g.toString() ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600'}`}>
                            {g}. Sınıf
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Ders Ekle</h3>
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <select className="flex-1 p-2 border rounded-lg text-sm bg-white" value={newItem.id} onChange={e => setNewItem({...newItem, id: e.target.value})}>
                            {Object.keys(SUBJECT_METADATA).map(key => (
                                <option key={key} value={key}>{SUBJECT_METADATA[key].label}</option>
                            ))}
                        </select>
                        <input type="number" className="w-20 p-2 border rounded-lg text-sm" placeholder="Hedef" value={newItem.target} onChange={e => setNewItem({...newItem, target: parseInt(e.target.value)})} />
                    </div>
                    {/* ÖZEL İSİM GİRME ALANI */}
                    <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            className="flex-1 p-2 border rounded-lg text-sm" 
                            placeholder="Özel Ders İsmi (İsteğe Bağlı)" 
                            value={newItem.customLabel} 
                            onChange={e => setNewItem({...newItem, customLabel: e.target.value})} 
                        />
                    </div>
                    <button onClick={handleAddItem} className="w-full bg-green-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center"><Plus className="w-4 h-4 mr-2"/> Listeye Ekle</button>
                </div>
            </div>

            <div className="space-y-2 mb-20">
                {currentList.map((item, idx) => {
                    const meta = getSubjectInfo(item);
                    return (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {meta.icon && <div className={`p-2 bg-${meta.color}-50 rounded-lg`}><meta.icon className={`w-5 h-5 text-${meta.color}-600`}/></div>}
                                <div>
                                    <div className="font-bold text-slate-700 text-sm">{meta.label}</div>
                                    <div className="text-xs text-slate-500">Hedef: {item.target} {meta.type === 'duration' ? 'dk' : 'soru'}</div>
                                </div>
                            </div>
                            <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    )
                })}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
                <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center shadow-lg"><Save className="w-5 h-5 mr-2"/> Kaydet ve Yayınla</button>
            </div>
        </div>
    );
}

function StudentDetailRow({ student, onDelete, curriculum }) {
  const [expanded, setExpanded] = useState(false);
  const [msg, setMsg] = useState(student.teacherMessage || '');
  const completed = Object.keys(student.days || {}).length;
  const pct = Math.round((completed / TOTAL_DAYS) * 100);

  const sendFeedback = async () => {
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', student.id);
    await setDoc(docRef, { teacherMessage: msg }, { merge: true });
    alert('Mesaj gönderildi.');
  };

  // Dinamik İstatistik Hesaplama (Toplamlar)
  const stats = {};
  const safeCurriculum = curriculum || [];
  safeCurriculum.forEach(item => {
      stats[item.id] = { 
          id: item.id, 
          label: item.customLabel || SUBJECT_METADATA[item.id]?.label || item.id,
          type: SUBJECT_METADATA[item.id]?.type || 'question', 
          correct: 0, 
          wrong: 0, 
          doneCount: 0 
      };
  });

  Object.values(student.days || {}).forEach(day => {
      Object.keys(day).forEach(key => {
          if(key.endsWith('True')) {
              const subj = key.replace('True', '');
              if(stats[subj]) stats[subj].correct += parseInt(day[key]||0);
          }
          else if(key.endsWith('False')) {
              const subj = key.replace('False', '');
              if(stats[subj]) stats[subj].wrong += parseInt(day[key]||0);
          }
          else if (day[key] === true && stats[key]) {
              stats[key].doneCount += 1;
          }
      });
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
        <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center gap-3 w-full">
                <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-600 flex-shrink-0">{student.grade}</div>
                <div className="flex-1">
                    <div className="flex justify-between">
                        <h4 className="font-bold text-sm text-slate-800">{student.name}</h4>
                        <span className="text-xs font-bold text-slate-500">%{pct}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1"><div className={`h-1.5 rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }}></div></div>
                </div>
            </div>
            {expanded ? <ChevronUp className="text-slate-400 w-5 h-5 ml-3"/> : <ChevronDown className="text-slate-400 w-5 h-5 ml-3"/>}
        </div>
        {expanded && (
            <div className="bg-slate-50 p-4 border-t border-slate-100 space-y-4">
                
                {/* 1. KART: TOPLAM İSTATİSTİKLER */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center"><Activity className="w-3 h-3 mr-1"/> Toplam İstatistikler</h5>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.values(stats).map(stat => {
                            const meta = SUBJECT_METADATA[stat.id] || { label: stat.id, color: 'gray' };
                            return (
                                <div key={stat.id} className="bg-slate-50 p-2 rounded flex justify-between items-center border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full bg-${meta.color}-500`}></div>
                                        <span className="font-bold text-xs text-slate-700">{stat.label}</span>
                                    </div>
                                    <div className="text-xs font-bold">
                                        {stat.type === 'duration' ? (
                                            <span className="text-indigo-600">{stat.doneCount} Gün</span>
                                        ) : (
                                            <>
                                                <span className="text-green-600 mr-2">{stat.correct} D</span>
                                                <span className="text-red-500">{stat.wrong} Y</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 2. KART: GÜNLÜK DETAYLI DÖKÜM */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center"><History className="w-3 h-3 mr-1"/> Geçmiş Günler</h5>
                    <div className="space-y-2">
                        {DAYS_ARRAY.map(day => {
                            const dayData = student.days?.[day];
                            if (!dayData) return null; // Veri girilmemişse gösterme
                            return (
                                <div key={day} className="text-xs border-b border-slate-100 last:border-0 pb-2 mb-2">
                                    <div className="font-bold text-indigo-600 mb-1">{day}. Gün Özeti:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(dayData).map(key => {
                                            if (key.endsWith('True')) {
                                                const subj = key.replace('True', '');
                                                const label = safeCurriculum.find(i => i.id === subj)?.customLabel || SUBJECT_METADATA[subj]?.label || subj;
                                                return <span key={key} className="bg-slate-50 px-1 rounded">{label}: {dayData[key]}D {dayData[key.replace('True', 'False')]}Y</span>
                                            }
                                            if (dayData[key] === true && !key.endsWith('False')) {
                                                 const label = safeCurriculum.find(i => i.id === key)?.customLabel || SUBJECT_METADATA[key]?.label || key;
                                                 return <span key={key} className="bg-green-50 text-green-700 px-1 rounded flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/>{label}</span>
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                        {Object.keys(student.days || {}).length === 0 && <div className="text-xs text-slate-400 italic text-center py-2">Henüz veri girişi yapılmamış.</div>}
                    </div>
                </div>

                <div>
                    <div className="flex gap-2 mb-2"><input className="flex-1 text-sm p-2 border rounded-lg outline-none focus:border-slate-400" placeholder="Öğrenciye not..." value={msg} onChange={e=>setMsg(e.target.value)} /></div>
                    <button onClick={sendFeedback} className="w-full bg-slate-800 text-white text-sm py-2 rounded-lg font-bold hover:bg-slate-700 transition">Not Gönder</button>
                </div>
                <button onClick={() => onDelete(student.id)} className="w-full text-red-500 text-xs font-bold py-2 border border-red-200 rounded-lg hover:bg-red-50 transition">Öğrenciyi Sil</button>
            </div>
        )}
    </div>
  )
}

function DayEditModal({ day, curriculum, initialData, onClose, onSave }) {
  const [form, setForm] = useState(initialData || {});
  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const safeCurriculum = curriculum || [];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold">{day}. Gün Girişi</h3><button onClick={onClose}><X className="w-6 h-6" /></button></div>
        <div className="overflow-y-auto p-4 space-y-4">
            {safeCurriculum.map((item, idx) => {
                const meta = getSubjectInfo(item);
                const key = item.id;

                if (meta.type === 'duration') {
                    return (
                        <div key={idx} onClick={() => setForm(p => ({...p, [key]: !p[key]}))} className={`flex items-center gap-3 p-3 rounded-xl border ${form[key] ? 'bg-green-50 border-green-200' : 'border-slate-100'}`}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${form[key] ? 'bg-green-500 border-green-500' : 'bg-white'}`}>{form[key] && <CheckCircle2 className="w-3 h-3 text-white"/>}</div>
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">{meta.label}</span>
                                <span className="text-xs text-slate-400">Hedef: {item.target} dk</span>
                            </div>
                        </div>
                    );
                }
                return (
                    <div key={idx} className={`p-3 rounded-xl border bg-${meta.color}-50 border-${meta.color}-100`}>
                        <div className="flex justify-between items-center mb-2">
                             <div className={`flex items-center font-bold text-${meta.color}-800 text-xs`}><meta.icon className="w-3 h-3 mr-1" /> {meta.label}</div>
                             <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 font-bold">Hedef: {item.target}</span>
                        </div>
                        <div className="flex gap-2">
                            <input type="tel" placeholder="D" className="flex-1 p-2 rounded border text-center text-sm font-bold outline-none focus:ring-2" value={form[key+'True']||''} onChange={e=>handleChange(key+'True',e.target.value)} />
                            <input type="tel" placeholder="Y" className="flex-1 p-2 rounded border text-center text-sm font-bold outline-none focus:ring-2" value={form[key+'False']||''} onChange={e=>handleChange(key+'False',e.target.value)} />
                        </div>
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
                    <h3 className="text-xl font-bold text-slate-800">Uygulamayı İndir</h3>
                    <p className="text-slate-500 text-sm mt-2">Bu programı bir uygulama gibi kullanmak için:</p>
                </div>
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><div className="text-2xl">🍎</div><div><h4 className="font-bold text-slate-700 text-xs">iPhone:</h4><p className="text-xs text-slate-600">Paylaş <Share className="w-3 h-3 inline"/> {'>'} Ana Ekrana Ekle</p></div></div>
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><div className="text-2xl">🤖</div><div><h4 className="font-bold text-slate-700 text-xs">Android:</h4><p className="text-xs text-slate-600">3 nokta <MoreVertical className="w-3 h-3 inline"/> {'>'} Uygulamayı Yükle</p></div></div>
                </div>
                <button onClick={onClose} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-6">Tamam</button>
            </div>
        </div>
    );
}

