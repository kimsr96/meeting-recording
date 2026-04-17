import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { loginWithGoogle, db } from './lib/firebase';
import { MeetingRecorder } from './components/MeetingRecorder';
import { analyzeMeeting } from './lib/gemini';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Meeting, TranscriptPart } from './types';
import { 
  LayoutDashboard, 
  Mic, 
  Settings, 
  User as UserIcon, 
  BarChart3, 
  Plus, 
  History, 
  ClipboardList,
  Sparkles,
  Search,
  ChevronRight,
  TrendingDown,
  Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

function Sidebar({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
    { id: 'record', icon: Mic, label: '새 회의/녹음' },
    { id: 'history', icon: History, label: '인사이트 분석' },
    { id: 'actions', icon: ClipboardList, label: '액션 아이템' },
  ];

  return (
    <div className="w-60 border-r border-[var(--border)] bg-[var(--sidebar)] h-screen sticky top-0 flex flex-col p-6">
      <div className="logo text-[var(--primary)] font-extrabold text-xl mb-10 tracking-tighter flex items-center">
        F&B<span className="text-[var(--text-main)] ml-1">Insight</span>
      </div>
      
      <nav className="space-y-1 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold text-sm ${
              activeTab === tab.id 
                ? 'bg-[var(--primary-light)] text-[var(--primary)]' 
                : 'text-[var(--text-sub)] hover:bg-slate-50 hover:text-[var(--text-main)]'
            }`}
          >
            <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="pt-4 border-t border-[var(--border)]">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-sub)] hover:bg-slate-50 hover:text-[var(--text-main)] transition-all font-semibold text-sm">
          <Settings size={18} />
          설정
        </button>
      </div>
    </div>
  );
}

function InsightDashboard({ meetings, onStartMeeting }: { meetings: Meeting[], onStartMeeting: () => void }) {
  const latestMeeting = meetings[0];
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 overflow-y-auto h-[calc(100vh-80px)] px-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">주간 마케팅 및 운영 회의</h2>
          <p className="text-[var(--text-sub)] mt-1 font-medium">강남역 플래그십 스토어 · {format(new Date(), 'yyyy년 MM월 dd일')}</p>
        </div>
        <button onClick={onStartMeeting} className="sleek-btn-primary">
          새 회의 시작
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[var(--border)] p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-[var(--primary)] rounded-lg">
              <ClipboardList size={18} />
            </div>
            <h3 className="font-bold text-[var(--text-sub)] text-xs uppercase tracking-wider">미결 액션 아이템</h3>
          </div>
          <p className="text-2xl font-extrabold text-[var(--primary)]">12개</p>
        </div>
        <div className="bg-white border border-[var(--border)] p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Mic size={18} />
            </div>
            <h3 className="font-bold text-[var(--text-sub)] text-xs uppercase tracking-wider">총 녹음 시간</h3>
          </div>
          <p className="text-2xl font-extrabold text-[var(--primary)]">42:15</p>
        </div>
        <div className="bg-white border border-[var(--border)] p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <BarChart3 size={18} />
            </div>
            <h3 className="font-bold text-[var(--text-sub)] text-xs uppercase tracking-wider">AI 분석 정확도</h3>
          </div>
          <p className="text-2xl font-extrabold text-[var(--primary)]">94%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 sleek-card shadow-sm h-[400px]">
          <div className="sleek-card-header">
            <h3 className="card-title font-bold">실시간 텍스트 기록 (STT)</h3>
            <span className="sleek-badge bg-[var(--primary-light)] text-[var(--primary)]">AI 화자 분리 활성화</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {latestMeeting?.transcript.map((part, i) => (
              <div key={i} className="text-sm">
                <span className="font-bold text-[var(--primary)] text-[10px] uppercase mr-2">{part.speaker}</span>
                <span className="text-[var(--text-main)] font-medium leading-relaxed">{part.text}</span>
              </div>
            )) || (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                <Mic size={48} className="opacity-20" />
                <p className="text-sm font-medium italic">회의가 시작되면 여기에 텍스트가 표시됩니다.</p>
              </div>
            )}
            <div className="history-tag w-full">
              ⚠️ 반복 이슈 알림: "로제 파스타 간 조절" 관련 내용은 2주 전 회의에서도 언급되었습니다.
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 sleek-card shadow-sm h-[400px]">
          <div className="sleek-card-header">
            <h3 className="card-title font-bold">AI 인사이트 리포트</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {latestMeeting ? (
              <>
                <div>
                  <label className="text-[10px] font-extrabold text-[var(--text-sub)] uppercase tracking-wider mb-3 block">고객 피드백 분석</label>
                  <div className="space-y-2">
                    <div className="feedback-bubble">
                      <b>부정적:</b> 로제 파스타 염도 문제 (빈도: 상)
                    </div>
                    <div className="feedback-bubble" style={{ borderLeftColor: 'var(--accent-green)' }}>
                      <b>긍정적:</b> 신규 샐러드 드레싱 만족도 (빈도: 중)
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-[var(--text-sub)] uppercase tracking-wider mb-3 block">액션 아이템 (To-Do)</label>
                  <div className="space-y-3">
                    {latestMeeting.insights.actionItems?.map((item: any, i: number) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-5 h-5 border-2 border-[var(--border)] rounded flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-[var(--text-main)]">{typeof item === 'string' ? item : item.task}</p>
                          <p className="text-[11px] text-[var(--text-sub)] font-medium">기한: {format(new Date(), 'MM/dd')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                <Sparkles size={48} className="opacity-20" />
                <p className="text-sm font-medium italic">분석 결과가 여기에 생성됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function MainContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'meetings'), orderBy('date', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting));
      setMeetings(data);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="animate-spin text-[var(--primary)]" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg)] p-4 text-center">
        <div className="max-w-md w-full bg-white border border-[var(--border)] rounded-3xl p-10 shadow-xl">
          <div className="bg-[var(--primary)] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
             <BarChart3 className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tight text-[var(--text-main)]">F&B Insight</h1>
          <p className="text-[var(--text-sub)] mb-8">외식 매장 및 마케팅 회의 인사이트 자동화</p>
          <button 
            onClick={loginWithGoogle}
            className="w-full bg-[var(--text-main)] text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3"
          >
            <UserIcon size={20} />
            GOOGLE 계정으로 시작
          </button>
        </div>
      </div>
    );
  }

  const handleFinishMeeting = async (transcript: TranscriptPart[]) => {
    if (transcript.length === 0) return;
    setAnalyzing(true);
    try {
      const title = meetingTitle || `Meeting ${format(new Date(), 'yyyyMMdd_HHmm')}`;
      const transcriptText = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
      
      const historyText = meetings.map(m => `Title: ${m.title}, Summary: ${m.summary}`).join('\n');
      
      const analysis = await analyzeMeeting(transcriptText, historyText);
      
      const meetingData: Partial<Meeting> = {
        title: title,
        date: serverTimestamp() as any,
        duration: transcript[transcript.length-1].timestamp,
        transcript: transcript,
        summary: analysis.summary,
        insights: analysis.insights,
        createdBy: user.uid,
        status: 'completed'
      };

      const meetingRef = await addDoc(collection(db, 'meetings'), meetingData);
      
      // Save action items separately
      if (analysis.insights.actionItems) {
        for (const item of analysis.insights.actionItems) {
          await addDoc(collection(db, 'actionItems'), {
            meetingId: meetingRef.id,
            task: item.task,
            assignee: item.assignee,
            dueDate: item.deadline || '',
            status: 'pending',
            createdBy: user.uid
          });
        }
      }

      setActiveTab('dashboard');
    } catch (error) {
      console.error('Analysis failed', error);
    } finally {
      setAnalyzing(false);
      setMeetingTitle('');
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg)]">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => {
        if (analyzing) return;
        setActiveTab(tab);
      }} />
      
      <main className="flex-1 overflow-hidden relative">
        <header className="h-20 border-b border-[var(--border)] bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10 w-full">
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-full border border-[var(--border)]">
            <Search size={16} className="text-[var(--text-sub)]" />
            <input 
              type="text" 
              placeholder="회의나 할 일을 검색하세요..." 
              className="bg-transparent border-none outline-none text-sm w-64 font-medium"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-extrabold leading-none text-[var(--text-main)]">{user.displayName}</p>
              <p className="text-[10px] text-[var(--text-sub)] mt-1 uppercase tracking-widest font-bold">{user.email}</p>
            </div>
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-10 h-10 rounded-full border border-[var(--border)] shadow-sm" 
              alt="Avatar" 
              referrerPolicy="no-referrer"
            />
          </div>
        </header>

        <div className="p-8 h-full">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <InsightDashboard 
                  meetings={meetings} 
                  onStartMeeting={() => setActiveTab('record')}
                />
              </motion.div>
            )}

            {activeTab === 'record' && (
              <motion.div
                key="record"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-2xl mx-auto"
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-[var(--text-main)]">새 회의 기록</h2>
                  <p className="text-[var(--text-sub)] font-medium">실시간 STT와 AI 분석이 자동으로 진행됩니다.</p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-[10px] font-extrabold text-[var(--text-sub)] uppercase tracking-widest mb-3">회의 제목</label>
                  <input
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="예: 주간 마케팅 리뷰 / 신메뉴 피드백 세션"
                    className="w-full bg-white border border-[var(--border)] rounded-xl px-5 py-3 font-semibold outline-none focus:border-[var(--primary)] transition-all shadow-sm"
                  />
                </div>

                <MeetingRecorder 
                  onTranscriptUpdate={() => {}} 
                  onFinish={handleFinishMeeting} 
                />

                {analyzing && (
                  <div className="mt-8 p-6 bg-[var(--text-main)] text-white rounded-2xl flex items-center gap-4 shadow-2xl border border-white/10">
                    <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
                    <div>
                      <p className="font-extrabold text-sm tracking-tight">AI 엔진이 분석 중입니다</p>
                      <p className="text-[10px] text-white/50 mono uppercase tracking-widest mt-0.5">인사이트와 액션 아이템을 도출하고 있습니다...</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full overflow-y-auto pb-12"
              >
                 <h2 className="text-3xl font-extrabold tracking-tight mb-8 text-[var(--text-main)]">회의 히스토리</h2>
                 <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                   <div className="grid grid-cols-4 p-5 border-b border-[var(--border)] bg-slate-50 text-[10px] font-extrabold text-[var(--text-sub)] uppercase tracking-widest">
                     <div>회의 제목</div>
                     <div>날짜</div>
                     <div>소요 시간</div>
                     <div className="text-right">리포트</div>
                   </div>
                   {meetings.map((m, i) => (
                     <div key={i} className="grid grid-cols-4 p-5 border-b border-[var(--border)] last:border-0 items-center hover:bg-slate-50 transition-all">
                       <div className="font-bold text-sm text-[var(--text-main)]">{m.title}</div>
                       <div className="text-sm text-[var(--text-sub)] font-medium">{format(m.date.toDate(), 'yyyy. MM. dd')}</div>
                       <div className="text-sm mono text-[var(--text-sub)]">{Math.floor(m.duration)}s</div>
                       <div className="text-right">
                         <button 
                           onClick={() => setSelectedMeeting(m)}
                           className="text-[var(--primary)] text-sm font-bold bg-[var(--primary-light)] px-4 py-1.5 rounded-lg hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
                         >
                            상세 보기
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
              </motion.div>
            )}

            {activeTab === 'actions' && (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full"
              >
                <h2 className="text-3xl font-extrabold tracking-tight mb-8 text-[var(--text-main)]">액션 아이템 관리</h2>
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[var(--border)] rounded-3xl text-[var(--text-sub)] bg-white/50 shadow-inner">
                  <ClipboardList size={48} className="opacity-10 mb-4" />
                  <p className="italic font-medium">액션 아이템 관리 시스템 준비 중...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Meeting Report Modal */}
        <AnimatePresence>
          {selectedMeeting && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedMeeting(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-slate-50">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)]">{selectedMeeting.title}</h2>
                    <p className="text-sm text-[var(--text-sub)] font-medium mt-1">
                      {format(selectedMeeting.date.toDate(), 'yyyy년 MM월 dd일 HH:mm')} · 녹음 시간 {Math.floor(selectedMeeting.duration)}초
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedMeeting(null)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <Plus className="rotate-45" size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Transcript */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-[var(--text-sub)] uppercase tracking-widest border-b border-[var(--border)] pb-2 flex items-center gap-2">
                       <Mic size={14} /> 전체 대화 기록
                    </h3>
                    <div className="space-y-4">
                      {selectedMeeting.transcript.map((part, i) => (
                        <div key={i} className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold text-[var(--primary)] text-[10px] uppercase">{part.speaker}</span>
                            <span className="text-[var(--text-sub)] text-[10px] mono">[{Math.floor(part.timestamp)}s]</span>
                          </div>
                          <p className="text-[var(--text-main)] font-medium leading-relaxed">{part.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Insights */}
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xs font-black text-[var(--text-sub)] uppercase tracking-widest border-b border-[var(--border)] pb-2 flex items-center gap-2 mb-4">
                         <Sparkles size={14} className="text-[var(--primary)]" /> AI 핵심 요약
                      </h3>
                      <div className="bg-[var(--primary-light)] p-5 rounded-2xl border border-[var(--primary)]/10 text-sm font-medium text-[var(--text-main)] leading-relaxed italic">
                        "{selectedMeeting.summary}"
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-black text-[var(--text-sub)] uppercase tracking-widest border-b border-[var(--border)] pb-2 flex items-center gap-2 mb-4">
                         <ClipboardList size={14} /> 주요 결정 및 액션 아이템
                      </h3>
                      <div className="space-y-4">
                         {selectedMeeting.insights.actionItems && selectedMeeting.insights.actionItems.length > 0 ? (
                           selectedMeeting.insights.actionItems.map((item, i) => (
                             <div key={i} className="flex gap-3 p-3 bg-white border border-[var(--border)] rounded-xl shadow-sm">
                               <div className="w-5 h-5 border-2 border-[var(--primary)] rounded flex-shrink-0 mt-0.5" />
                               <div>
                                 <p className="text-sm font-bold text-[var(--text-main)]">
                                   {typeof item === 'string' ? item : (item as any).task}
                                 </p>
                                 <p className="text-[10px] text-[var(--text-sub)] font-extrabold mt-1">
                                   담당: {(item as any).assignee || '미지정'} | 기한: {(item as any).deadline || '미정'}
                                 </p>
                               </div>
                             </div>
                           ))
                         ) : (
                           <p className="text-sm italic text-slate-400">도출된 액션 아이템이 없습니다.</p>
                         )}
                      </div>
                    </section>
                  </div>
                </div>

                <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3 bg-slate-50">
                  <button className="px-6 py-2.5 bg-white border border-[var(--border)] rounded-full text-sm font-bold text-[var(--text-main)] hover:bg-slate-100 transition-all">
                    PDF 내보내기
                  </button>
                  <button 
                    onClick={() => setSelectedMeeting(null)}
                    className="sleek-btn-primary px-8"
                  >
                    닫기
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

