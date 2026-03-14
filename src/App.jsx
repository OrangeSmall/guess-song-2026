import React, { useState, useRef, useEffect } from 'react';
import { Play, CheckCircle, SkipForward, SkipBack, Music, Volume2, Video, Timer, AlertCircle } from 'lucide-react';

// 共用 AudioContext，確保瀏覽器允許播放音效
let audioCtx = null;
const playBeep = (freq, duration, type = 'sine') => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.1; 
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("無法播放音效", e);
  }
};

/* =========================================
  📜 題庫資料設定區 (給 Vercel 部署專用說明)
  =========================================
  1. 請將您準備好的 30 首 mp3 檔案，統一命名為 q1.mp3, q2.mp3... 
  2. 將這些 mp3 放入 VS Code 專案目錄中的 `public/music/` 資料夾內。
     (部署到 Vercel 後，系統會自動對應到 /music/q1.mp3 的網址路徑)
  3. 解答影片保持使用 YouTube ID，可避免專案檔案過大導致 GitHub 無法上傳。
*/
const INITIAL_QUESTIONS = [
  { id: 1, songName: "SUN", artist: "KIRE", musicSrc: "/music/q1.mp3", videoYoutubeId: "5XK2C9w6oVk", videoStartTime: 93 },
  { id: 2, songName: "好膽你就來", artist: "張惠妹", musicSrc: "/music/q2.mp3", videoYoutubeId: "Wa5OubFqC00", videoStartTime: 60 },
  
  // 💡 您可以先用上面這兩題測試！
  // 測試沒問題後，未來要擴充到 30 題時，只要把下面這行「複製並解除註解(刪除最前面的 //)」，
  // 依序更改 id 數字與裡面的資料即可：
  // { id: 3, songName: "請填寫歌名", artist: "請填寫歌手", musicSrc: "/music/q3.mp3", videoYoutubeId: "YouTube影片ID", videoStartTime: 0 }
];

export default function App() {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [gameState, setGameState] = useState('idle'); 
  const [countdown, setCountdown] = useState(15);
  
  const musicTimeoutRef = useRef(null);
  const audioRef = useRef(null); 
  const currentQuestion = INITIAL_QUESTIONS[currentQIndex];

  const clearAllTimers = () => {
    if (musicTimeoutRef.current) clearTimeout(musicTimeoutRef.current);
  };

  const handlePlayMusic = () => {
    clearAllTimers();
    playBeep(0, 0.01); 
    
    setGameState('playing_music');

    if (audioRef.current) {
      audioRef.current.currentTime = 0; 
      audioRef.current.play().catch(e => console.error("音檔播放失敗，請確認路徑:", e));
    }
    
    // 8秒後自動暫停並進入倒數
    musicTimeoutRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause(); 
      }
      setGameState('countdown');
      setCountdown(15);
    }, 8000);
  };

  useEffect(() => {
    let interval;
    if (gameState === 'countdown') {
      playBeep(600, 0.1); 
      
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            playBeep(800, 0.6); 
            setGameState('waiting');
            return 0;
          }
          playBeep(600, 0.1); 
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const handleShowAnswer = () => {
    clearAllTimers();
    if (audioRef.current) {
      audioRef.current.pause(); 
    }
    setGameState('showing_answer');
  };

  const changeQuestion = (direction) => {
    clearAllTimers();
    if (audioRef.current) {
      audioRef.current.pause(); 
      audioRef.current.currentTime = 0;
    }

    let newIndex = currentQIndex + direction;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= INITIAL_QUESTIONS.length) newIndex = INITIAL_QUESTIONS.length - 1;
    
    setCurrentQIndex(newIndex);
    setGameState('idle');
  };

  return (
    // 使用深酒紅色作為基底 (#1a040a)，文字為米白色 (#f4e8d1)
    <div className="min-h-screen bg-[#1a040a] text-[#f4e8d1] font-serif selection:bg-[#d4af37] selection:text-[#1a040a] relative flex flex-col">
      
      {/* 隱藏的本地音樂播放器 */}
      <audio ref={audioRef} src={currentQuestion.musicSrc} preload="auto" className="hidden" />

      {/* 頂部導覽列：置中排版、暗金邊框 */}
      <header className="bg-[#2a0610] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.6)] border-b-2 border-[#d4af37] flex flex-col justify-center items-center relative z-10">
        <div className="flex items-center space-x-4 mb-3">
          <Music size={28} className="text-[#d4af37]" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.15em] text-[#d4af37] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            戰國猜歌繪卷
          </h1>
          <Music size={28} className="text-[#d4af37]" />
        </div>
        <div className="text-[#e8c37d] font-medium bg-[#4a0e17] px-6 py-1.5 rounded-full border border-[#d4af37]/50 shadow-inner">
          題目進度：{currentQIndex + 1} / {INITIAL_QUESTIONS.length}
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 flex flex-col justify-center">
        {/* 題目顯示區：雙層邊框營造高級感 */}
        <div className="bg-[#2a0610]/90 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden border-2 border-[#d4af37] relative">
          
          {/* 內層裝飾線 */}
          <div className="absolute inset-2 border border-[#d4af37]/30 rounded-xl pointer-events-none"></div>

          <div className="p-10 flex flex-col items-center justify-center min-h-[450px] relative z-10">
            
            {/* 狀態 1：待機中 */}
            {gameState === 'idle' && (
              <div className="text-center animate-fade-in">
                <h2 className="text-7xl font-black text-[#d4af37] mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-wider">
                  第 {currentQIndex + 1} 題
                </h2>
                <p className="text-xl text-[#e8c37d]/80 mb-10 tracking-widest">準備好後，點擊下方播放音樂</p>
                <div className="w-32 h-32 rounded-full border-4 border-[#d4af37]/40 flex items-center justify-center mx-auto bg-[#4a0e17]/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                   <Music size={56} className="text-[#d4af37]/60" />
                </div>
              </div>
            )}

            {/* 狀態 2：播放音樂中 */}
            {gameState === 'playing_music' && (
              <div className="text-center animate-pulse flex flex-col items-center w-full">
                <h2 className="text-4xl font-bold text-[#d4af37] mb-6 flex items-center justify-center drop-shadow-md">
                  <Volume2 className="mr-4" size={40} /> 音樂播放中...
                </h2>
                <div className="my-10 flex space-x-3 items-end h-28">
                  {[...Array(11)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-5 bg-gradient-to-t from-[#8a1c31] to-[#d4af37] rounded-sm shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                      style={{ 
                        height: `${Math.random() * 80 + 20}%`,
                        animation: `bounce ${Math.random() * 0.4 + 0.4}s infinite alternate` 
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            )}

            {/* 狀態 3：倒數計時 */}
            {gameState === 'countdown' && (
              <div className="text-center animate-fade-in flex flex-col items-center">
                <h2 className="text-3xl font-bold text-[#e8c37d] mb-8 flex items-center tracking-wider">
                  <Timer className="mr-3" size={32} /> 倒數計時，請作答！
                </h2>
                <div className="text-[10rem] leading-none font-black text-[#d4af37] tabular-nums tracking-tighter drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]">
                  {countdown}
                </div>
              </div>
            )}

            {/* 狀態 4：時間到 */}
            {gameState === 'waiting' && (
              <div className="text-center animate-fade-in flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-[#4a0e17] border-2 border-[#d4af37] flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(74,14,23,0.8)]">
                  <AlertCircle size={56} className="text-[#d4af37]" />
                </div>
                <h2 className="text-6xl font-black text-[#d4af37] mb-6 tracking-widest drop-shadow-lg">時間到</h2>
                <p className="text-xl text-[#e8c37d]/80 tracking-widest">請主持人點擊下方按鈕揭曉解答</p>
              </div>
            )}

            {/* 狀態 5：顯示解答影片 */}
            {gameState === 'showing_answer' && (
              <div className="w-full flex flex-col items-center animate-fade-in">
                <h2 className="text-2xl font-bold text-[#e8c37d] mb-4 flex items-center tracking-widest">
                  <CheckCircle className="mr-2 text-[#d4af37]" /> 解答揭曉
                </h2>
                <div className="text-center mb-8 border-b border-[#d4af37]/30 pb-6 w-full max-w-2xl">
                  <div className="text-5xl font-black text-[#d4af37] mb-4 tracking-wider drop-shadow-md">{currentQuestion.songName}</div>
                  <div className="text-2xl text-[#e8c37d]">主唱：{currentQuestion.artist}</div>
                </div>
                
                <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] border-4 border-[#d4af37] bg-black">
                  <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${currentQuestion.videoYoutubeId}?autoplay=1&start=${currentQuestion.videoStartTime}`} 
                    title="Video Player" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* 控制面板：高質感按鈕 */}
          <div className="bg-[#1a040a] p-6 flex flex-wrap justify-center gap-5 border-t-2 border-[#d4af37] relative z-10">
            <button 
              onClick={() => changeQuestion(-1)}
              disabled={currentQIndex === 0}
              className="px-6 py-4 rounded-lg bg-[#2a0610] hover:bg-[#4a0e17] disabled:opacity-40 disabled:hover:bg-[#2a0610] disabled:cursor-not-allowed transition-all flex items-center text-[#d4af37] font-bold border border-[#d4af37]/50"
            >
              <SkipBack className="mr-2" size={20} /> 上一題
            </button>

            <button 
              onClick={handlePlayMusic}
              disabled={gameState === 'playing_music' || gameState === 'countdown'}
              className={`px-8 py-4 rounded-lg font-bold text-lg flex items-center shadow-lg transition-all border ${
                (gameState === 'playing_music' || gameState === 'countdown')
                  ? 'bg-[#2a0610] text-[#d4af37]/40 border-[#d4af37]/30 cursor-not-allowed' 
                  : 'bg-[#6b1522] hover:bg-[#8a1c31] text-[#f4e8d1] border-[#d4af37] shadow-[0_0_15px_rgba(107,21,34,0.6)]'
              }`}
            >
              <Volume2 className="mr-2" size={24} /> 
              {gameState === 'playing_music' ? '音樂播放中...' : gameState === 'countdown' ? '倒數計時中...' : '播放題目音樂'}
            </button>

            <button 
              onClick={handleShowAnswer}
              className={`px-8 py-4 rounded-lg font-bold text-lg flex items-center shadow-lg transition-all border ${
                gameState === 'showing_answer'
                  ? 'bg-[#d4af37] text-[#1a040a] border-[#f4e8d1] shadow-[0_0_20px_rgba(212,175,55,0.6)]'
                  : 'bg-[#d4af37]/90 hover:bg-[#d4af37] text-[#1a040a] border-[#d4af37] animate-pulse-slight'
              }`}
            >
              <Video className="mr-2" size={24} /> 
              顯示解答影片
            </button>

            <button 
              onClick={() => changeQuestion(1)}
              disabled={currentQIndex === INITIAL_QUESTIONS.length - 1}
              className="px-6 py-4 rounded-lg bg-[#2a0610] hover:bg-[#4a0e17] disabled:opacity-40 disabled:hover:bg-[#2a0610] disabled:cursor-not-allowed transition-all flex items-center text-[#d4af37] font-bold border border-[#d4af37]/50"
            >
              下一題 <SkipForward className="ml-2" size={20} />
            </button>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-15px); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-pulse-slight {
          animation: pulse-slight 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-slight {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
      `}} />
    </div>
  );
}