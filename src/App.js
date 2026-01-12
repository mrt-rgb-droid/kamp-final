import React, { useState, useEffect } from 'react';
import { 
  Calculator, BookOpen, FlaskConical, Leaf, Users, CheckCircle2, 
  Download, LogOut, User, Calendar, Home, Star, MessageSquare, 
  ChevronUp, ChevronDown, X, Share, MoreVertical, Phone, AlertTriangle, 
  RefreshCcw, LockKeyhole, GraduationCap, Lightbulb 
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
  apiKey: "AIzaSyAeyolB3EGrsOiNwdS971zF8DqCZ4ZPlAQ",
  authDomain: "kamp-takip-sistemi.firebaseapp.com",
  projectId: "kamp-takip-sistemi",
  storageBucket: "kamp-takip-sistemi.firebasestorage.app",
  messagingSenderId: "339295588440",
  appId: "1:339295588440:web:6ca22ddc445fbd3dafba2d"
};

const APP_ID = "kamp-final-v1";
const TEACHER_PASS = "1876";
const TOTAL_DAYS = 15;
const DAYS_ARRAY = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

const ADVICE_POOL = {
  math: ["İşlemleri kağıda yazarak yap. ✍️", "Önce örnek sorulara bak. 🧮"],
  general: ["Harikasın! Devam et. 🚀", "Başarı yakında! ✨"]
};

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
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
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
    const initAuth = async () => { if (!auth.currentUser) await signInAnonymously(auth); };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => { setRole(null); setStudentName(''); setStudentGrade(''); };

  if (loading) return <div className="h-screen flex items-center justify-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        <header className="bg-indigo-600 text-white p-4 pt-8 sticky top-0 z-30 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><GraduationCap className="w-6 h-6 text-white" /></div>
              <div><h1 className="text-lg font-bold leading-none">Kamp Takip</h1><span className="text-[10px] opacity-80 uppercase tracking-wider">15 Günlük Program</span></div>
            </div>
            {!role && <button onClick={() => setShowInstallModal(true)} className="flex items-center text-xs bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-full transition"><Download className="w-3 h-3 mr-1" /> İndir</button>}
            {role && <button onClick={handleLogout} className="p-1.5 bg-indigo-700 rounded hover:bg-red-500 transition"><LogOut className="w-4 h-4" /></button>}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-20">
            {!user || !role ? <LoginScreen setRole={setRole} studentName={studentName} setStudentName={setStudentName} studentGrade={studentGrade} setStudentGrade={setStudentGrade} /> : role === 'student' ? <StudentApp user={user} studentName={studentName} grade={parseInt(studentGrade)} /> : <TeacherApp user={user} />}
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
        if (!studentName.trim() || !studentGrade) return setError('Bilgileri girin.');
        setRole('student');
    } else {
        if (pass !== TEACHER_PASS) return setError('Hatalı şifre.');
        setRole('teacher');
    }
  };

  return (
    <div className="p-6 flex flex-col h-full justify-center">
        <div className="text-center mb-8"><h2 className="text-2xl font-bold text-slate-800">Hoşgeldiniz 👋</h2></div>
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => setActiveTab('student')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'student' ? 'bg-white shadow' : 'text-slate-400'}`}>Öğrenci</button>
            <button onClick={() => setActiveTab('teacher')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'teacher' ? 'bg-white shadow' : 'text-slate-400'}`}>Öğretmen</button>
        </div>
        {activeTab === 'student' ? (
            <div className="space-y-4">
                <input type="text" value={studentName} onChange={(e)=>setStudentName(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Ad Soyad" />
                <div className="grid grid-cols-4 gap-2">{[1,2,3,4,5,6,7,8].map(g=><button key={g} onClick={()=>setStudentGrade(g.toString())} className={`py-2 rounded-lg border font-bold ${studentGrade===g.toString()?'bg-indigo-600 text-white':'bg-white'}`}>{g}</button>)}</div>
                <button onClick={()=>handleLogin('student')} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg">Başla</button>
            </div>
        ) : (
            <div className="space-y-4">
                <input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Şifre" />
                <button onClick={()=>handleLogin('teacher')} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg">Giriş</button>
            </div>
        )}
        {error && <div className="mt-4 text-red-500 text-center text-sm">{error}</div>}
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
      if (docSnap.exists()) setData(docSnap.data());
      else {
        setDoc(docRef, { name: studentName, grade: grade, createdAt: serverTimestamp(), days: {} }, { merge: true });
        setData({ name: studentName, grade: grade, days: {} }); 
      }
    });
    return () => unsubscribe();
  }, [user, docId, studentName, grade]);

  const saveDayData = async (day, dayData) => {
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', docId);
    await setDoc(docRef, { days: { [day]: dayData }, lastUpdated: serverTimestamp() }, { merge: true });
    setSelectedDay(null);
  };

  if (!data) return <div className="p-8 text-center text-slate-400">Yükleniyor...</div>;

  return (
    <>
      <div className="p-4 space-y-6">
        {activeTab === 'home' && <HomeView data={data} grade={grade} studentName={studentName} />}
        {activeTab === 'calendar' && <CalendarView data={data} onDayClick={setSelectedDay} />}
      </div>
      {selectedDay && <DayEditModal day={selectedDay} curriculum={myCurriculum} initialData={data.days?.[selectedDay]} onClose={() => setSelectedDay(null)} onSave={saveDayData} />}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around shadow-lg">
        <NavButton icon={Home} label="Ana Sayfa" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavButton icon={Calendar} label="Program" isActive={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
      </div>
    </>
  );
}

const NavButton = ({ icon: Icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center p-2 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
        <Icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

function HomeView({ data, grade, studentName }) {
    const completed = Object.keys(data.days || {}).length;
    const pct = Math.round((completed / TOTAL_DAYS) * 100);
    const [advice, setAdvice] = useState("Hoşgeldin! 👋");

    useEffect(() => {
        const days = Object.keys(data.days || {}).map(Number).sort((a,b)=>b-a);
        if (days.length > 0) {
            const last = data.days[days[0]];
            if ((parseInt(last.matFalse)||0) > 8) setAdvice(ADVICE_POOL.math[0]);
            else setAdvice(ADVICE_POOL.general[0]);
        }
    }, [data]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex justify-between mb-4">
                    <div><h2 className="text-xl font-bold">{studentName.split(' ')[0]}</h2><p className="text-indigo-200 text-sm">{grade}. Sınıf</p></div>
                    <div className="bg-white/20 p-2 rounded-lg"><span className="text-2xl font-bold">%{pct}</span></div>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2 mb-2"><div className="bg-white h-2 rounded-full" style={{ width: `${pct}%` }}></div></div>
                <p className="text-xs text-indigo-100">{completed} / 15 Gün</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center mb-2 font-bold text-amber-700"><Lightbulb className="w-4 h-4 mr-2"/> Koçun Diyor Ki:</div>
                <p className="text-sm text-amber-900 italic">"{advice}"</p>
            </div>
            {data.teacherMessage && <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm"><h4 className="text-xs font-bold text-blue-800 mb-1">Öğretmeninden:</h4><p className="text-sm text-blue-900">{data.teacherMessage}</p></div>}
        </div>
    );
}

function CalendarView({ data, onDayClick }) {
    return (
        <div className="pb-16">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-indigo-600" />Takvimim</h3>
            <div className="grid grid-cols-3 gap-3">
                {DAYS_ARRAY.map(day => {
                    const isDone = !!data.days?.[day];
                    return (
                        <button key={day} onClick={() => onDayClick(day)} className={`p-3 rounded-xl border-2 text-left active:scale-95 transition ${isDone ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-100'}`}>
                            <span className={`text-sm font-bold block ${isDone ? 'text-indigo-700' : 'text-slate-400'}`}>{day}. Gün</span>
                            <div className="mt-2 flex justify-end">{isDone ? <CheckCircle2 className="w-4 h-4 text-indigo-600"/> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}</div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}

function TeacherApp({ user }) {
    const [students, setStudents] = useState([]);
    useEffect(() => {
        if(!user) return;
        const colRef = collection(db, 'artifacts', APP_ID, 'public_data');
        onSnapshot(colRef, (snap) => {
            const list = snap.docs.map(d => ({id: d.id, ...d.data()}));
            list.sort((a,b) => (parseInt(a.grade)||0) - (parseInt(b.grade)||0) || a.name.localeCompare(b.name));
            setStudents(list);
        });
    }, [user]);

    return (
        <div className="p-4 pb-20 space-y-4">
            <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg"><h2 className="font-bold text-lg">Öğretmen Paneli</h2><p className="text-slate-400 text-sm">{students.length} öğrenci</p></div>
            {students.map(std => <StudentDetailRow key={std.id} student={std} />)}
        </div>
    )
}

function StudentDetailRow({ student }) {
  const [expanded, setExpanded] = useState(false);
  const [msg, setMsg] = useState(student.teacherMessage || '');
  const completed = Object.keys(student.days || {}).length;

  const sendFeedback = async () => {
    const docRef = doc(db, 'artifacts', APP_ID, 'public_data', student.id);
    await setDoc(docRef, { teacherMessage: msg }, { merge: true });
    alert('Gönderildi');
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 flex justify-between items-center" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center gap-3">
                <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-600">{student.grade}</div>
                <div><h4 className="font-bold text-sm text-slate-800">{student.name}</h4><span className="text-xs text-slate-500">{completed}/15 Gün</span></div>
            </div>
            {expanded ? <ChevronUp className="text-slate-400 w-5 h-5"/> : <ChevronDown className="text-slate-400 w-5 h-5"/>}
        </div>
        {expanded && (
            <div className="bg-slate-50 p-4 border-t">
                <div className="flex gap-2 mb-2"><input className="flex-1 text-xs p-2 border rounded" placeholder="Mesaj..." value={msg} onChange={e=>setMsg(e.target.value)} /></div>
                <button onClick={sendFeedback} className="w-full bg-slate-800 text-white text-xs py-2 rounded font-bold">Gönder</button>
            </div>
        )}
    </div>
  )
}

function DayEditModal({ day, grade, curriculum, initialData, onClose, onSave }) {
  const [form, setForm] = useState(initialData || {});
  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold">{day}. Gün</h3><button onClick={onClose}><X className="w-6 h-6" /></button></div>
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
        <div className="p-4 border-t bg-slate-50"><button onClick={() => onSave(day, form)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg">Kaydet</button></div>
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
