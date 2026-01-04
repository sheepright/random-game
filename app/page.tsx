import { GameProvider } from "../contexts/GameContext";
import { GameDashboard } from "../components/GameDashboard";

export default function Home() {
  return (
    <GameProvider>
      <GameDashboard />
    </GameProvider>
  );
}
