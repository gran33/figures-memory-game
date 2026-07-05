import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { LanguageLayout } from './components/LanguageLayout';
import { MainMenu } from './components/MainMenu';
import { LevelMap } from './features/map/LevelMap';
import { GameBoard } from './features/game/GameBoard';
import { AlbumView } from './features/album/AlbumView';

/** Main route coordinator: menu → map → game / album, all inside the RTL-aware layout. */
export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <LanguageLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen.name === 'game' ? `game-${screen.levelId}` : screen.name}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {screen.name === 'menu' && <MainMenu />}
          {screen.name === 'map' && <LevelMap />}
          {screen.name === 'album' && <AlbumView />}
          {screen.name === 'game' && <GameBoard levelId={screen.levelId} />}
        </motion.div>
      </AnimatePresence>
    </LanguageLayout>
  );
}
