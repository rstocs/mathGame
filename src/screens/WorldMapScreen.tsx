import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { worlds } from '../data/worlds';
import { isWorldUnlocked, hasAllStarsInWorld } from '../lib/unlocks';
import { TopBar } from '../components/hud/TopBar';
import { WorldNode } from '../components/map/WorldNode';
import { LevelPath } from '../components/map/LevelPath';
import { Avatar } from '../components/map/Avatar';
import { getNodePosition, useMapLayout } from '../components/map/mapLayout';
import './WorldMapScreen.css';

export function WorldMapScreen() {
  const state = useGameStore();
  const { nodes, viewBox } = useMapLayout();
  const avatarPos = getNodePosition(state.currentWorldId, nodes);

  return (
    <motion.div
      className="screen world-map-screen"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <TopBar totalXP={state.totalXP} />
      <div className="world-map-screen__header">
        <h1>{state.playerName}'s Adventure</h1>
        <p>Tap a world to begin!</p>
      </div>
      <svg
        className="world-map-screen__svg"
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <LevelPath nodes={nodes} />
        {worlds.map((world, index) => {
          const node = nodes[index];
          const unlocked = isWorldUnlocked(worlds, state, index);
          const passedLevels = world.levels.filter(
            (level) => (state.levelProgress[level.id]?.bestAccuracy ?? 0) >= level.passThreshold,
          ).length;
          return (
            <WorldNode
              key={world.id}
              world={world}
              x={node.x}
              y={node.y}
              isUnlocked={unlocked}
              progressFraction={passedLevels / world.levels.length}
              isFullyMastered={hasAllStarsInWorld(world, state)}
              onClick={() => state.selectWorld(world.id)}
            />
          );
        })}
        <Avatar x={avatarPos.x} y={avatarPos.y} />
      </svg>
      <button type="button" className="world-map-screen__reset" onClick={state.resetProgress}>
        Reset Progress
      </button>
    </motion.div>
  );
}
