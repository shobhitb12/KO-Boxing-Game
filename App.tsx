
import React, { useState } from 'react';
import { PlayerConfig, GameState } from './types';
import BoxingGame from './components/BoxingGame';
import PracticeArena from './components/PracticeArena';
import { getMatchCommentary } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [isMuted, setIsMuted] = useState(false);
  const [p1Config, setP1Config] = useState<PlayerConfig>({
    name: 'Player 1',
    faceUrl: null,
    color: '#ef4444'
  });
  const [p2Config, setP2Config] = useState<PlayerConfig>({
    name: 'Player 2',
    faceUrl: null,
    color: '#3b82f6'
  });
  
  // Punching Bag specific state
  const [isBagModalOpen, setIsBagModalOpen] = useState(false);
  const [bagConfig, setBagConfig] = useState<PlayerConfig>({
    name: 'Trainee',
    faceUrl: null,
    color: '#ea580c'
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const [winner, setWinner] = useState<string | null>(null);
  const [commentary, setCommentary] = useState<string>('');
  const [loadingCommentary, setLoadingCommentary] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'P1' | 'P2' | 'BAG') => {
    const file = e.target.files?.[0];
    if (file) {
      if (target === 'BAG') {
        setIsProcessing(true);
        setUploadProgress(0);
        const interval = setInterval(() => {
          setUploadProgress(p => {
            if (p >= 100) {
              clearInterval(interval);
              setIsProcessing(false);
              return 100;
            }
            return p + 10;
          });
        }, 100);
      }

      const url = URL.createObjectURL(file);
      if (target === 'P1') setP1Config(prev => ({ ...prev, faceUrl: url }));
      else if (target === 'P2') setP2Config(prev => ({ ...prev, faceUrl: url }));
      else setBagConfig(prev => ({ ...prev, faceUrl: url }));
    }
  };

  const startPractice = () => {
    if (!bagConfig.faceUrl || !bagConfig.name) {
      alert("Please upload a photo and enter a name for your punching bag!");
      return;
    }
    setIsBagModalOpen(false);
    setGameState('PRACTICE');
  };

  const onGameOver = async (winnerName: string) => {
    setWinner(winnerName);
    setGameState('GAMEOVER');
    setLoadingCommentary(true);
    const loserName = winnerName === p1Config.name ? p2Config.name : p1Config.name;
    const aiText = await getMatchCommentary(winnerName, loserName);
    setCommentary(aiText);
    setLoadingCommentary(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white p-4 overflow-hidden relative">
      
      {/* Global Mute Toggle - Persistent across all screens */}
      <div className="fixed top-6 right-6 z-[100]">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`px-4 py-2 rounded-full font-bungee text-sm border-2 transition-all flex items-center space-x-2 shadow-lg hover:scale-105 active:scale-95 ${
            isMuted 
              ? 'bg-zinc-800 border-zinc-600 text-zinc-400' 
              : 'bg-yellow-400 border-yellow-500 text-black'
          }`}
        >
          <span>{isMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON'}</span>
        </button>
      </div>

      {gameState === 'MENU' && (
        <div className="max-w-6xl w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <h1 className="text-7xl font-bungee mb-8 text-yellow-500 drop-shadow-lg text-center leading-none">
            FACE-OFF <br/> <span className="text-white text-5xl">BOXING ARENA</span>
          </h1>
          
          <div className="grid md:grid-cols-3 gap-8 w-full mb-12 items-start">
            {/* Player 1 Selection */}
            <div className="bg-zinc-800 p-6 rounded-2xl border-4 border-red-500 shadow-xl flex flex-col items-center space-y-4">
              <h2 className="text-2xl font-bold text-red-500 font-bungee">FIGHTER 1</h2>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-700 bg-zinc-900 flex items-center justify-center">
                {p1Config.faceUrl ? (
                  <img src={p1Config.faceUrl} alt="P1 Face" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-zinc-500 text-center text-xs">NO FACE</div>
                )}
              </div>
              <input 
                type="text" 
                value={p1Config.name} 
                onChange={(e) => setP1Config(p => ({...p, name: e.target.value}))}
                className="bg-zinc-700 border-none rounded px-3 py-2 text-center focus:ring-2 ring-red-500 w-full font-bold"
                placeholder="Name"
              />
              <label className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition-all w-full text-center text-sm">
                UPLOAD FACE
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'P1')} />
              </label>
            </div>

            {/* Central Start Button and Mode Selection */}
            <div className="flex flex-col items-center space-y-6 pt-12">
              <button 
                onClick={() => setGameState('PLAYING')}
                className="group relative inline-flex items-center justify-center px-16 py-8 font-bungee text-4xl tracking-tighter text-black bg-yellow-400 rounded-full hover:bg-yellow-300 transform transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_-12px_rgba(234,179,8,0.5)]"
              >
                VERSUS
              </button>
              
              <button 
                onClick={() => setIsBagModalOpen(true)}
                className="bg-zinc-800 border-2 border-orange-500 text-orange-500 px-8 py-4 rounded-full font-bungee text-xl hover:bg-orange-500 hover:text-white transition-all shadow-lg"
              >
                PUNCHING BAG
              </button>
            </div>

            {/* Player 2 Selection */}
            <div className="bg-zinc-800 p-6 rounded-2xl border-4 border-blue-500 shadow-xl flex flex-col items-center space-y-4">
              <h2 className="text-2xl font-bold text-blue-500 font-bungee">FIGHTER 2</h2>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-700 bg-zinc-900 flex items-center justify-center">
                {p2Config.faceUrl ? (
                  <img src={p2Config.faceUrl} alt="P2 Face" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-zinc-500 text-center text-xs">NO FACE</div>
                )}
              </div>
              <input 
                type="text" 
                value={p2Config.name} 
                onChange={(e) => setP2Config(p => ({...p, name: e.target.value}))}
                className="bg-zinc-700 border-none rounded px-3 py-2 text-center focus:ring-2 ring-blue-500 w-full font-bold"
                placeholder="Name"
              />
              <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition-all w-full text-center text-sm">
                UPLOAD FACE
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'P2')} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Punching Bag Setup Modal */}
      {isBagModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-zinc-800 w-full max-w-md p-8 rounded-3xl border-4 border-orange-500 shadow-2xl space-y-6">
            <h2 className="text-3xl font-bungee text-orange-500 text-center">TRAINING SETUP</h2>
            
            <div className="flex flex-col items-center space-y-4">
               <div className="w-40 h-56 bg-zinc-900 rounded-3xl border-2 border-zinc-700 relative overflow-hidden flex items-center justify-center">
                  {bagConfig.faceUrl ? (
                    <img src={bagConfig.faceUrl} alt="Bag Face" className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="text-zinc-600 font-bungee text-center px-4">TARGET AREA</div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
                      <div className="text-orange-500 font-bold mb-2">PROCESSING...</div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full">
                        <div className="h-full bg-orange-500 transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                      </div>
                    </div>
                  )}
               </div>
               
               <div className="w-full space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1 ml-1">BAG NAME (MAX 20)</label>
                    <input 
                      type="text" 
                      maxLength={20}
                      value={bagConfig.name}
                      onChange={(e) => setBagConfig(p => ({...p, name: e.target.value}))}
                      className="w-full bg-zinc-700 p-3 rounded-xl border-none focus:ring-2 ring-orange-500"
                      placeholder="e.g., Stress Source"
                    />
                  </div>
                  
                  <label className="block w-full bg-zinc-700 hover:bg-zinc-600 text-center p-3 rounded-xl cursor-pointer font-bold transition-colors">
                    CHOOSE PHOTO
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'BAG')} />
                  </label>
               </div>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={() => setIsBagModalOpen(false)}
                className="flex-1 p-3 rounded-xl font-bold bg-zinc-700 hover:bg-zinc-600 transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={startPractice}
                disabled={isProcessing || !bagConfig.faceUrl}
                className="flex-1 p-3 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                START TRAINING
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <BoxingGame 
          p1Config={p1Config} 
          p2Config={p2Config} 
          isMuted={isMuted}
          onGameOver={onGameOver}
        />
      )}

      {gameState === 'PRACTICE' && (
        <PracticeArena 
          playerConfig={p1Config}
          bagConfig={bagConfig}
          isMuted={isMuted}
          onExit={() => setGameState('MENU')}
        />
      )}

      {gameState === 'GAMEOVER' && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-6 animate-in fade-in duration-700">
          <h2 className="text-8xl font-bungee text-white mb-2 tracking-widest drop-shadow-2xl">K.O.</h2>
          <p className="text-4xl font-bold text-yellow-400 mb-8 font-bungee">{winner} WINS!</p>
          
          <div className="bg-zinc-800 p-8 rounded-3xl max-w-2xl border-2 border-yellow-500/30 text-center mb-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-bold font-bungee">GEMINI COMMENTARY</div>
            {loadingCommentary ? (
              <div className="flex items-center space-x-2 justify-center py-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-200"></div>
              </div>
            ) : (
              <p className="italic text-xl leading-relaxed text-zinc-200">"{commentary}"</p>
            )}
          </div>

          <button 
            onClick={() => setGameState('MENU')}
            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors"
          >
            BACK TO MENU
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
