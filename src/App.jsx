import React, { useState, useRef, useEffect } from 'react';
import { Play, CheckCircle, SkipForward, SkipBack, Music, Volume2, Video, Timer, AlertCircle, Swords } from 'lucide-react';

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
  📜 題庫資料設定區
  =========================================
  包含了 1~30 題，並在 20 與 21 題之間插入了「加賽PK過場」
*/
const INITIAL_QUESTIONS = [
  { id: 1, songName: "愛在西元前", artist: "周杰倫《范特西》2001年", musicSrc: "/music/q1.mp3", videoYoutubeId: "5XK2C9w6oVk", videoStartTime: 93 },
  { id: 2, songName: "初戀", artist: "川島茉樹代《Makiyo》2000年", musicSrc: "/music/q2.MP3", videoYoutubeId: "6F_rBQwLzmY", videoStartTime: 13 },
  { id: 3, songName: "含淚跳恰恰", artist: "謝金燕《含淚跳恰恰》1995年", musicSrc: "/music/q3.MP3", videoYoutubeId: "APr9yCQa66Q", videoStartTime: 84 },
  { id: 4, songName: "Lydia", artist: "F.I.R. 飛兒樂團《F.I.R. 飛兒樂團》2004年", musicSrc: "/music/q4.MP3", videoYoutubeId: "ZOHsd6Zk7DM", videoStartTime: 120 },
  { id: 5, songName: "演員", artist: "薛之謙《紳士》2015年", musicSrc: "/music/q5.MP3", videoYoutubeId: "XaN3kUz4KSw", videoStartTime: 217 },
  { id: 6, songName: "妥協", artist: "蔡依林《花蝴蝶》2009年", musicSrc: "/music/q6.MP3", videoYoutubeId: "M00rcJ9gMEc", videoStartTime: 154 },
  { id: 7, songName: "如果可以", artist: "韋禮安《月老主題曲》2021年", musicSrc: "/music/q7.MP3", videoYoutubeId: "8MG--WuNW1Y", videoStartTime: 147 },
  { id: 8, songName: "Super Star", artist: "S.H.E《Super Star》2003年", musicSrc: "/music/q8.MP3", videoYoutubeId: "gr5fNKK2FaA", videoStartTime: 35 },
  { id: 9, songName: "精舞門", artist: "羅志祥《Speshow》2006年", musicSrc: "/music/q9.MP3", videoYoutubeId: "3WAgjt-cDQg", videoStartTime: 200 },
  { id: 10, songName: "幾分之幾", artist: "盧廣仲《幾分之幾》2018年", musicSrc: "/music/q10.MP3", videoYoutubeId: "HQ_mU73VhEQ", videoStartTime: 69 },
  { id: 11, songName: "愛錯", artist: "王力宏《心中的日月》2004年", musicSrc: "/music/q11.MP3", videoYoutubeId: "JdpNT5yRbwg", videoStartTime: 163 },
  { id: 12, songName: "對的人", artist: "戴愛玲《為愛做的傻事》2003年", musicSrc: "/music/q12.MP3", videoYoutubeId: "fcLPFchVP9g", videoStartTime: 169 },
  { id: 13, songName: "光年之外", artist: "鄧紫棋《太空潛航者主題曲》2016年", musicSrc: "/music/q13.MP3", videoYoutubeId: "T4SimnaiktU", videoStartTime: 141 },
  { id: 14, songName: "小幸運", artist: "田馥甄《我的少女時代主題曲》2015年", musicSrc: "/music/q14.MP3", videoYoutubeId: "Kg-mW8SyNVg", videoStartTime: 206 },
  { id: 15, songName: "想見你想見你想見你", artist: "八三夭《想見你電視原聲帶》2019年", musicSrc: "/music/q15.MP3", videoYoutubeId: "4iRupuNet3Q", videoStartTime: 65 },
  { id: 16, songName: "勇氣", artist: "梁靜茹《勇氣》2000年", musicSrc: "/music/q16.MP3", videoYoutubeId: "nDchQNPuA0k", videoStartTime: 164 },
  { id: 17, songName: "手掌心", artist: "丁噹《蘭陵王原聲帶》2013年", musicSrc: "/music/q17.MP3", videoYoutubeId: "7wvNwOPprBE", videoStartTime: 150 },
  { id: 18, songName: "以後別做朋友", artist: "周興哲《學著愛》2014年", musicSrc: "/music/q18.mp3", videoYoutubeId: "Ew4VvF0DPMc", videoStartTime: 73 },
  { id: 19, songName: "必巡", artist: "曾瑋中《總會有一工》2022年", musicSrc: "/music/q19.mp3", videoYoutubeId: "X06y7ZuT7_Y", videoStartTime: 81 },
  { id: 20, songName: "愛你", artist: "王心凌《愛你》2004年", musicSrc: "/music/q20.mp3", videoYoutubeId: "NAODcPQcy9U", videoStartTime: 133 },
  
  // 💥 加賽 PK 環節過場
  { id: 'pk-transition', isTransition: true, title: "加賽環節，難度提升", subtitle: "最終對決，鹿死誰手？" },

  { id: 21, songName: "FANTASTIC BABY", artist: "BIGBANG《ALIVE》2012年", musicSrc: "/music/q21.mp3", videoYoutubeId: "AAbokV76tkU", videoStartTime: 104 },
  { id: 22, songName: "跳樓機", artist: "利比LBI (時柏塵)2024年", musicSrc: "/music/q22.mp3", videoYoutubeId: "HegSBovl24I", videoStartTime: 81 },
  { id: 23, songName: "紅蓮華", artist: "LiSA《紅蓮華》2019年", musicSrc: "/music/q23.mp3", videoYoutubeId: "JoUayamxUtI", videoStartTime: 188 },
  { id: 24, songName: "愛人錯過", artist: "告五人《我肯定在幾百年前就說過愛你》2019年", musicSrc: "/music/q24.mp3", videoYoutubeId: "6D79CYTxvOM", videoStartTime: 261 },
  { id: 25, songName: "青蘋果樂園", artist: "青蘋果樂園《新年快樂》1989年", musicSrc: "/music/q25.mp3", videoYoutubeId: "1w1llUnCjH4", videoStartTime: 56 },
  { id: 26, songName: "Love Story", artist: "Taylor Swift《Fearless》2008年", musicSrc: "/music/q26.mp3", videoYoutubeId: "8xg3vE8Ie_E", videoStartTime: 196 },
  { id: 27, songName: "手放開", artist: "李聖傑《絕對痴心·手放開》2004年", musicSrc: "/music/q27.mp3", videoYoutubeId: "g7xmoYFFduk", videoStartTime: 101 },
  { id: 28, songName: "突然好想你", artist: "五月天《後青春期的詩》2008年", musicSrc: "/music/q28.mp3", videoYoutubeId: "GtDRcXtDg-4", videoStartTime: 189 },
  { id: 29, songName: "流星雨", artist: "《流星花園》2001年", musicSrc: "/music/q29.mp3", videoYoutubeId: "ocTdA8NytIc", videoStartTime: 194 },
  { id: 30, songName: "放手", artist: "請填寫歌手", musicSrc: "/music/q30.mp3", videoYoutubeId: "v-9IGzCMNks", videoStartTime: 95 }
];

export default function App() {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [gameState, setGameState] = useState('idle'); 
  const [countdown, setCountdown] = useState(15);
  
  const musicTimeoutRef = useRef(null);
  const audioRef = useRef(null); 
  const currentQuestion = INITIAL_QUESTIONS[currentQIndex];

  // 動態替換網頁標籤圖示 (Favicon) 與標題
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    // 使用 GitHub 原始檔案的連結格式 (raw.githubusercontent.com)
    link.href = 'https://raw.githubusercontent.com/OrangeSmall/seafood-menu-app/main/logo.png';
    document.title = "戰國猜歌繪卷";
  }, []);

  const clearAllTimers = () => {
    if (musicTimeoutRef.current) clearTimeout(musicTimeoutRef.current);
  };

  const handlePlayMusic = () => {
    if (currentQuestion.isTransition) return; // 過場畫面不可播放音樂

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
    if (currentQuestion.isTransition) return; // 過場畫面不可顯示解答影片

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

  // 判斷右上角的進度文字
  const renderProgressText = () => {
    if (currentQuestion.isTransition) return "★ 隱藏階段 ★";
    return `題目進度：${currentQuestion.id} / 30`;
  };

  return (
    <div className="min-h-screen bg-[#1a040a] text-[#f4e8d1] font-serif selection:bg-[#d4af37] selection:text-[#1a040a] relative flex flex-col">
      
      {/* 隱藏的本地音樂播放器，過場畫面沒有音樂時不給 src */}
      <audio ref={audioRef} src={currentQuestion.musicSrc || ""} preload="auto" className="hidden" />

      {/* 頂部導覽列 */}
      <header className="bg-[#2a0610] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.6)] border-b-2 border-[#d4af37] flex flex-col justify-center items-center relative z-10">
        <div className="flex items-center space-x-4 mb-3">
          <Music size={28} className="text-[#d4af37]" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.15em] text-[#d4af37] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            戰國猜歌繪卷
          </h1>
          <Music size={28} className="text-[#d4af37]" />
        </div>
        <div className="text-[#e8c37d] font-medium bg-[#4a0e17] px-6 py-1.5 rounded-full border border-[#d4af37]/50 shadow-inner">
          {renderProgressText()}
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 flex flex-col justify-center">
        {/* 題目顯示區 */}
        <div className="bg-[#2a0610]/90 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden border-2 border-[#d4af37] relative">
          
          {/* 內層裝飾線 */}
          <div className="absolute inset-2 border border-[#d4af37]/30 rounded-xl pointer-events-none"></div>

          <div className="p-10 flex flex-col items-center justify-center min-h-[450px] relative z-10">
            
            {/* 特殊過場畫面：加賽 PK 環節 */}
            {currentQuestion.isTransition ? (
              <div className="text-center animate-fade-in flex flex-col items-center">
                <Swords size={96} className="text-[#d4af37] mb-8 drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] animate-pulse-slight" />
                <h2 className="text-7xl font-black text-[#d4af37] mb-6 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-[0.2em]">
                  {currentQuestion.title}
                </h2>
                <p className="text-3xl text-[#e8c37d] tracking-widest mt-4">
                  —— {currentQuestion.subtitle} ——
                </p>
              </div>
            ) : (
              /* 一般題目的狀態 1~5 */
              <>
                {/* 狀態 1：待機中 */}
                {gameState === 'idle' && (
                  <div className="text-center animate-fade-in">
                    <h2 className="text-7xl font-black text-[#d4af37] mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-wider">
                      第 {currentQuestion.id} 題
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
              </>
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
              disabled={currentQuestion.isTransition || gameState === 'playing_music' || gameState === 'countdown'}
              className={`px-8 py-4 rounded-lg font-bold text-lg flex items-center shadow-lg transition-all border ${
                (currentQuestion.isTransition || gameState === 'playing_music' || gameState === 'countdown')
                  ? 'bg-[#2a0610] text-[#d4af37]/40 border-[#d4af37]/30 cursor-not-allowed' 
                  : 'bg-[#6b1522] hover:bg-[#8a1c31] text-[#f4e8d1] border-[#d4af37] shadow-[0_0_15px_rgba(107,21,34,0.6)]'
              }`}
            >
              <Volume2 className="mr-2" size={24} /> 
              {gameState === 'playing_music' ? '音樂播放中...' : gameState === 'countdown' ? '倒數計時中...' : '播放題目音樂'}
            </button>

            <button 
              onClick={handleShowAnswer}
              disabled={currentQuestion.isTransition}
              className={`px-8 py-4 rounded-lg font-bold text-lg flex items-center shadow-lg transition-all border ${
                currentQuestion.isTransition
                  ? 'bg-[#2a0610] text-[#d4af37]/40 border-[#d4af37]/30 cursor-not-allowed'
                  : gameState === 'showing_answer'
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