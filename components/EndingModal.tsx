"use client";

import { useGame } from "../contexts/GameContext";

interface EndingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EndingModal({ isOpen, onClose }: EndingModalProps) {
  const { gameState } = useGame();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="hero-card rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 엔딩 이미지 */}
        <div className="relative">
          <img
            src="/Ending.png"
            alt="게임 엔딩"
            className="w-full h-64 object-cover rounded-t-xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent rounded-t-xl" />
          <div className="absolute bottom-4 left-6 right-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              🎉 축하합니다! 🎉
            </h1>
            <p className="text-lg text-gray-200">
              모든 스테이지를 정복한 진정한 전사!
            </p>
          </div>
        </div>

        {/* 엔딩 메시지 */}
        <div className="p-6">
          <div className="space-y-6">
            <div className="hero-card-accent p-4 rounded-lg">
              <h2 className="text-xl font-bold hero-text-primary mb-3">
                ⚔️ 전설의 완성 ⚔️
              </h2>
              <div className="space-y-3 hero-text-secondary">
                <p>
                  수많은 시련과 역경을 뚫고, 마침내 당신은 100개의 모든
                  스테이지를 정복했습니다.
                </p>
                <p>
                  약한 모험가에서 시작하여 전설적인 장비를 수집하고, 강력한
                  보스들을 물리치며 성장한 당신의 여정이 드디어 완성되었습니다.
                </p>
                <p>진정한 모험가의 여정이 완성되었습니다!</p>
              </div>
            </div>

            <div className="hero-card-blue p-4 rounded-lg">
              <h3 className="text-lg font-semibold hero-text-blue mb-2">
                🏆 최종 성과
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="hero-text-secondary">클리어 스테이지</div>
                  <div className="font-bold hero-text-primary">100 / 100</div>
                </div>
                <div>
                  <div className="hero-text-secondary">보유 크레딧</div>
                  <div className="font-bold hero-text-primary">
                    {gameState.credits.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="hero-text-secondary">인벤토리 아이템</div>
                  <div className="font-bold hero-text-primary">
                    {gameState.inventory.length}개
                  </div>
                </div>
                <div>
                  <div className="hero-text-secondary">신화 아이템</div>
                  <div className="font-bold hero-text-primary">
                    {
                      gameState.inventory.filter(
                        (item) => item.grade === "mythic"
                      ).length
                    }
                    개
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-card-purple p-4 rounded-lg">
              <h3 className="text-lg font-semibold hero-text-purple mb-2">
                ✨ 축하합니다! ✨
              </h3>
              <p className="hero-text-secondary text-sm">
                모든 것을 정복한 당신에게 경의를 표합니다. 이제 자유롭게 게임을
                즐기세요!
              </p>
            </div>

            {/* 확인 버튼만 남김 */}
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="hero-btn hero-btn-primary px-8 py-3"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
