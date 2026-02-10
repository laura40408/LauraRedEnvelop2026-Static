
import React, { useState, useEffect, useCallback } from 'react';
import { PRIZES as INITIAL_PRIZES } from './constants.ts';
import { Winner, PrizeConfig } from './types.ts';
import Header from './components/Header.tsx';
import DrawSection from './components/DrawSection.tsx';
import HistoryList from './components/HistoryList.tsx';
import PoolStatus from './components/PoolStatus.tsx';
import WinnerModal from './components/WinnerModal.tsx';
import PrizeSettings from './components/PrizeSettings.tsx';
import DrawingOverlay from './components/DrawingOverlay.tsx';
import { soundManager } from './utils/soundManager.ts';

const App: React.FC = () => {
  const [prizeConfigs, setPrizeConfigs] = useState<PrizeConfig[]>(INITIAL_PRIZES);
  const [pool, setPool] = useState<number[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [currentWinner, setCurrentWinner] = useState<{name: string, amount: number} | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const initializePool = useCallback((configs: PrizeConfig[] = prizeConfigs) => {
    const newPool: number[] = [];
    configs.forEach(prize => {
      for (let i = 0; i < prize.initialCount; i++) {
        newPool.push(prize.amount);
      }
    });
    
    for (let i = newPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newPool[i], newPool[j]] = [newPool[j], newPool[i]];
    }
    
    setPool(newPool);
    setWinners([]);
    setCurrentWinner(null);
    setIsDrawing(false);
  }, [prizeConfigs]);

  useEffect(() => {
    initializePool();
  }, []);

  const handleDraw = (name: string) => {
    if (pool.length === 0) {
      alert("紅包已經被抽完囉！明年請早！");
      return;
    }

    setIsDrawing(true);
    soundManager.playDraw();

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const amount = pool[randomIndex];
      
      const newPool = [...pool];
      newPool.splice(randomIndex, 1);
      setPool(newPool);

      const newWinner: Winner = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        amount,
        timestamp: new Date()
      };
      setWinners(prev => [newWinner, ...prev]);
      
      setCurrentWinner({ name, amount });
      setIsDrawing(false);
      setShowModal(true);
      soundManager.playWin();
    }, 2000);
  };

  const handleReset = () => {
    if (window.confirm("確定要重置所有獎項和抽獎紀錄嗎？(將套用目前設定的數量)")) {
      initializePool();
      soundManager.playReset();
    }
  };

  const updatePrizeConfigs = (newConfigs: PrizeConfig[]) => {
    setPrizeConfigs(newConfigs);
    initializePool(newConfigs);
    soundManager.playReset();
  };

  return (
    <div className="min-h-screen horse-bg bg-red-900 text-white flex flex-col pb-10">
      <Header />
      
      <main className="container mx-auto px-4 mt-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <PoolStatus pool={pool} prizeConfigs={prizeConfigs} />
            <PrizeSettings 
              prizeConfigs={prizeConfigs} 
              onUpdate={updatePrizeConfigs} 
            />
            <div className="bg-red-800/50 p-6 rounded-2xl border border-red-700 shadow-xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <i className="fas fa-sync-alt text-yellow-400"></i> 快速操作
              </h3>
              <button 
                onClick={handleReset}
                className="w-full bg-orange-600 hover:bg-orange-500 transition-colors py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <i className="fas fa-redo"></i> 清除紀錄並重置
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <DrawSection onDraw={handleDraw} canDraw={pool.length > 0 && !isDrawing} isDrawing={isDrawing} />
            <HistoryList winners={winners} />
          </div>
        </div>
      </main>

      {isDrawing && <DrawingOverlay />}

      {currentWinner && !isDrawing && (
        <WinnerModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          winnerName={currentWinner.name} 
          amount={currentWinner.amount} 
        />
      )}

      <footer className="mt-12 text-center text-red-300 text-sm opacity-50">
        <p>© 2026 馬到成功 - 祥龍辭歲，駿馬迎春</p>
      </footer>
    </div>
  );
};

export default App;
