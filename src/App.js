import React, { useState, useEffect, useMemo } from 'react';
// Daha fazla ikon ekledik
import { 
  Calculator, BookOpen, FlaskConical, Leaf, Users, CheckCircle2, 
  Download, LogOut, User, Calendar, Home, Star, MessageSquare, 
  ChevronUp, ChevronDown, X, Share, MoreVertical, Phone, AlertTriangle, 
  RefreshCcw, LockKeyhole, GraduationCap, Lightbulb, Trophy, Flame, 
  Target, Zap, Search, Award
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- 1. FIREBASE AYARLARI (KENDİ BİLGİLERİNİZLE DOLDURUN) ---
const firebaseConfig = {
  apiKey: "AIzaSyAeyolB3EGrsOiNwdS971zF8DqCZ4ZPlAQ",
  authDomain: "kamp-takip-sistemi.firebaseapp.com",
  projectId: "kamp-takip-sistemi",
  storageBucket: "kamp-takip-sistemi.firebasestorage.app",
  messagingSenderId: "339295588440",
  appId: "1:339295588440:web:6ca22ddc445fbd3dafba2d"
};

// --- AYARLAR ---
const APP_ID = "kamp-takip-final-v5"; 
const TEACHER_PASS = "1876"; 
const TOTAL_DAYS = 15;
const DAYS_ARRAY = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

// Akıllı Tavsiye Havuzu (AI Yok, Mantık Var)
const ADVICE_POOL = {
  math: ["Matematik işlemlerini zihinden değil, kağıda yazarak yapmayı dene. ✍️", "Takıldığın sorularda önce çözümlü örneklere bak. 🧮"],
  turkish: ["Paragraf sorularında önce koyu renkli soru kökünü oku. 👁️", "Kitap okuma saatini 10 dakika artırmaya ne dersin? 📚"],
  science: ["Fen konularını günlük hayattaki olaylarla ilişkilendir. 🧪", "Kavramları karıştırmamak için not tutarak çalış. 📝"],
  general: ["Harika gidiyorsun! Mola vermeyi ve su içmeyi unutma. 💧", "Bugünkü çaban yarınki başarının anahtarıdır. 🗝️"]
};

// Müfredat
const CURRICULUM = {
  1: { mat: 10, tr: 10, hayat: 10, kitap: true },
  2: { mat: 15, tr: 15, hayat: 10, kitap: true },
  3: { mat: 15, tr: 10, hayat: 10, kitap: true },
  4: { mat: 20, tr: 20, fen: 10, sos: 10, kitap: true },
  5: { mat: 30, tr: 30, fen: 20, sos: 20, fenTekrar: true },
  6: { mat: 40, tr: 40, fen: 30, fenTekrar: true },
  7: { mat: 50, tr: 50, fen: 30, fenTekrar: true },
  8: { mat: 60, tr: 60, fen: 40, inkilap: 20, fenTekrar: true }
};

const FIELD_METADATA = {
  mat: { label: "Matematik", icon: Calculator, color: "blue" },
  tr: { label: "Türkçe", icon: BookOpen, color: "red" },
  fen: { label: "Fen Bilimleri", icon: FlaskConical, color: "green" },
  hayat: { label: "Hayat Bilgisi", icon: Leaf, color: "emerald" },
  sos: { label: "Sosyal Bilgiler", icon: Users, color: "orange" }, 
  inkilap: { label: "İnkılap Tarihi", icon: BookOpen, color: "orange" },
  kitap: { label: "30 dk Kitap Okuma", type: "checkbox", color: "purple" },
  fenTekrar: { label: "30 dk Fen Tekrarı", type: "checkbox", color: "teal" }
};

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

  useEffect(() => {
    const initAuth = async () => {
      if (!auth.currentUser) await signInAnonymously(auth);
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    setRole(null);
    setStudentName('');
    setStudentGrade('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Sistem Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        {/* Header */}
        <header className="bg-indigo-600 text-white p-4 pt-8 sticky top-0 z-30 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><GraduationCap className="w-6 h-6 text-white" /></div>
              <div><h1 className="text-lg font-bold leading-none">Kamp Takip</h1><span className="text-[10px] opacity-80 uppercase tracking-wider">15 Günlük Program</span></div>
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
                <StudentApp user={user} studentName={studentName} grade={parseInt(studentGrade)} />
            ) : (
                <TeacherApp user={user} />
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

function StudentApp({ user, studentName, grade }) {
  const [activeTab, setActiveTab] = useState('home');
  const [data, setData] = useState(null); 
  const [selectedDay, setSelectedDay] = useState(null);
  const docId = generateStudentId(studentName, grade);
  const myCurriculum = CURRICULUM[grade] || CURRICULUM[7];

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', docId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        const initialData = { name: studentName, grade: grade, createdAt: serverTimestamp(), days: {} };
        setDoc(docRef, initialData, { merge: true });
        setData(initialData); 
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

  if (!data) return <div className="p-8 text-center text-slate-400">Veriler hazırlanıyor...</div>;

  return (
    <>
      <div className="p-4 space-y-6 pb-24">
        {activeTab === 'home' && <HomeView data={data} grade={grade} studentName={studentName} />}
        {activeTab === 'calendar' && <CalendarView data={data} onDayClick={setSelectedDay} />}
      </div>
      {selectedDay && <DayEditModal day={selectedDay} grade={grade} curriculum={myCurriculum} initialData={data.days?.[selectedDay]} onClose={() => setSelectedDay(null)} onSave={saveDayData} />}
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

// --- HOME VIEW (YENİLENMİŞ TASARIM) ---
function HomeView({ data, grade, studentName }) {
    const completedCount = Object.keys(data.days || {}).length;
    const percentage = Math.round((completedCount / TOTAL_DAYS) * 100);
    const [advice, setAdvice] = useState("");
    const [greeting, setGreeting] = useState("");

    // İstatistik Hesapla
    let totalQuestions = 0;
    Object.values(data.days || {}).forEach(day => {
        Object.keys(day).forEach(key => {
            if(key.endsWith('True')) totalQuestions += parseInt(day[key] || 0);
        });
    });

    useEffect(() => {
        // Canlı Selamlama
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Günaydın");
        else if (hour < 18) setGreeting("Tünaydın");
        else setGreeting("İyi Akşamlar");

        // Akıllı Tavsiye Motoru
        const days = Object.keys(data.days || {}).map(Number).sort((a,b)=>b-a);
        const lastDay = days.length > 0 ? data.days[days[0]] : null;

        if (lastDay) {
            const matWrong = parseInt(lastDay.matFalse) || 0;
            const trWrong = parseInt(lastDay.trFalse) || 0;
            if (matWrong > 8) setAdvice(ADVICE_POOL.math[Math.floor(Math.random()*ADVICE_POOL.math.length)]);
            else if (trWrong > 8) setAdvice(ADVICE_POOL.turkish[Math.floor(Math.random()*ADVICE_POOL.turkish.length)]);
            else setAdvice(ADVICE_POOL.general[Math.floor(Math.random()*ADVICE_POOL.general.length)]);
        } else {
            setAdvice("Maceraya başlamak için 'Program' sekmesine gidip 1. Günü seç! 👋");
        }
    }, [data]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Üst Bilgi Kartı */}
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

            {/* Hızlı İstatistikler */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="bg-orange-100 p-2 rounded-full mb-2"><Flame className="w-6 h-6 text-orange-600"/></div>
                    <span className="text-2xl font-bold text-slate-800">{completedCount} Gün</span>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">İstikrar</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="bg-blue-100 p-2 rounded-full mb-2"><Target className="w-6 h-6 text-blue-600"/></div>
                    <span className="text-2xl font-bold text-slate-800">{totalQuestions}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Soru Çözüldü</span>
                </div>
            </div>

            {/* Rozet Müzesi */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center"><Award className="w-4 h-4 mr-2 text-yellow-500"/> Rozetlerin</h3>
                <div className="flex justify-between px-2">
                    <Badge icon={Star} label="Başlangıç" active={totalQuestions > 0} color="yellow" />
                    <Badge icon={Zap} label="Hızcı" active={completedCount > 5} color="blue" />
                    <Badge icon={Trophy} label="Efsane" active={totalQuestions > 500} color="purple" />
                </div>
            </div>
            
            {/* Akıllı Koç */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
                <Lightbulb className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1"/>
                <div>
                    <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1">Koçun Diyor Ki:</h4>
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

const Badge = ({ icon: Icon, label, active, color }) => (
    <div className={`flex flex-col items-center transition-all duration-500 ${active ? 'opacity-100 scale-110' : 'opacity-30 grayscale scale-100'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-${color}-100 text-${color}-600 border border-${color}-200 shadow-sm`}>
            <Icon className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-slate-600">{label}</span>
    </div>
);

// --- ALT BİLEŞENLER (CALENDAR) ---
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

// --- ÖĞRETMEN UYGULAMASI (YENİLENMİŞ) ---
function TeacherApp({ user }) {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if(!user) return;
        const colRef = collection(db, 'artifacts', APP_ID, 'public_data');
        onSnapshot(colRef, (snap) => {
            const list = snap.docs.map(d => ({id: d.id, ...d.data()}));
            list.sort((a,b) => (parseInt(a.grade)||0) - (parseInt(b.grade)||0) || a.name.localeCompare(b.name));
            setStudents(list);
        });
    }, [user]);

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // İstatistikler
    const totalStudents = students.length;
    const activeToday = students.filter(s => s.lastUpdated && new Date(s.lastUpdated.seconds * 1000).toDateString() === new Date().toDateString()).length;

    return (
        <div className="p-4 pb-20 space-y-4">
            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
                <h2 className="font-bold text-xl mb-1">Öğretmen Paneli</h2>
                <div className="flex gap-4 mt-4 text-sm">
                    <div>
                        <span className="block text-2xl font-bold">{totalStudents}</span>
                        <span className="text-slate-400 text-xs">Toplam Öğrenci</span>
                    </div>
                    <div>
                        <span className="block text-2xl font-bold text-green-400">{activeToday}</span>
                        <span className="text-slate-400 text-xs">Bugün Aktif</span>
                    </div>
                </div>
            </div>

            {/* Arama */}
            <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Öğrenci ara..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 outline-none"
                />
            </div>

            {filteredStudents.map(std => <StudentDetailRow key={std.id} student={std} />)}
        </div>
    )
}

function StudentDetailRow({ student }) {
  const [expanded, setExpanded] = useState(false);
  const [msg, setMsg] = useState(student.teacherMessage || '');
  const completed = Object.keys(student.days || {}).length;
  const pct = Math.round((completed / TOTAL_DAYS) * 100);

  const sendFeedback = async () => {
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', student.id);
    await setDoc(docRef, { teacherMessage: msg }, { merge: true });
    alert('Mesaj öğrenciye iletildi.');
  };

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
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                        <div className={`h-1.5 rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                </div>
            </div>
            {expanded ? <ChevronUp className="text-slate-400 w-5 h-5 ml-3"/> : <ChevronDown className="text-slate-400 w-5 h-5 ml-3"/>}
        </div>
        {expanded && (
            <div className="bg-slate-50 p-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2 font-bold uppercase">Öğrenciye Not Gönder:</p>
                <div className="flex gap-2 mb-2">
                    <input className="flex-1 text-sm p-2 border rounded-lg outline-none focus:border-slate-400" placeholder="Örn: Harika gidiyorsun!" value={msg} onChange={e=>setMsg(e.target.value)} />
                </div>
                <button onClick={sendFeedback} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm py-2 rounded-lg font-bold transition">Gönder</button>
            </div>
        )}
    </div>
  )
}

function DayEditModal({ day, grade, curriculum, initialData, onClose, onSave }) {
  const [form, setForm] = useState(initialData || {});
  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold">{day}. Gün Girişi</h3><button onClick={onClose}><X className="w-6 h-6" /></button></div>
        <div className="overflow-y-auto p-4 space-y-4">
            {Object.keys(curriculum).map(key => {
                const meta = FIELD_METADATA[key];
                if (meta.type === 'checkbox') {
                    return (
                        <div key={key} onClick={() => setForm(p => ({...p, [key]: !p[key]}))} className={`flex items-center gap-3 p-3 rounded-xl border ${form[key] ? 'bg-green-50 border-green-200' : 'border-slate-100'}`}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${form[key] ? 'bg-green-500 border-green-500' : 'bg-white'}`}>{form[key] && <CheckCircle2 className="w-3 h-3 text-white"/>}</div>
                            <span className="text-sm font-medium text-slate-700">{meta.label}</span>
                        </div>
                    );
                }
                return (
                    <div key={key} className={`p-3 rounded-xl border bg-${meta.color}-50 border-${meta.color}-100`}>
                        <div className={`flex items-center mb-2 font-bold text-${meta.color}-800 text-xs`}><meta.icon className="w-3 h-3 mr-1" /> {meta.label}</div>
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
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><div className="text-2xl">🍎</div><div><h4 className="font-bold text-slate-700 text-xs">iPhone:</h4><p className="text-xs text-slate-600">Paylaş <Share className="w-3 h-3 inline"/> -> Ana Ekrana Ekle</p></div></div>
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><div className="text-2xl">🤖</div><div><h4 className="font-bold text-slate-700 text-xs">Android:</h4><p className="text-xs text-slate-600">3 nokta <MoreVertical className="w-3 h-3 inline"/> -> Uygulamayı Yükle</p></div></div>
                </div>
                <button onClick={onClose} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-6">Tamam</button>
            </div>
        </div>
    );
}
