import { GameProvider } from "../contexts/GameContext";
import { GameDashboard } from "../components/GameDashboard";
import DevConsole from "../components/DevConsole";

export default function Home() {
  return (
    <GameProvider>
      <DevConsole />
      <GameDashboard />
    </GameProvider>
  );
}
