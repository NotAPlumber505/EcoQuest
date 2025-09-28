// Small utility helpers to manage quest-related client-side state in localStorage.
// These are intentionally simple and deterministic so the game and QuestMenu can
// read/write state and dispatch an update event listeners can react to.

export function readArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (e) {
    console.warn('readArray parse error', key, e);
    return [];
  }
}

export function writeArray(key: string, arr: string[]) {
  localStorage.setItem(key, JSON.stringify(arr));
}

export function pushUnique(key: string, item: string) {
  const arr = readArray(key);
  if (!arr.includes(item)) {
    arr.push(item);
    writeArray(key, arr);
  }
}

export function removeItem(key: string, item: string) {
  const arr = readArray(key).filter(i => i !== item);
  writeArray(key, arr);
}

// Accessors for common lists used by the quests system
export const getPlants = () => readArray('plants');
export const getPrey = () => readArray('prey');
export const getPredators = () => readArray('predators');
export const getGarbage = () => readArray('garbage');
export const getCollected = () => readArray('collectedItems');
export const getPlanted = () => readArray('plantedItems');
export const getReleased = () => readArray('releasedItems');
export const getIntroduced = () => readArray('introducedItems');

// markCollected: player picks up an item (garbage or target)
export function markCollected(itemId: string) {
  pushUnique('collectedItems', itemId);
  // remove from garbage list if present
  removeItem('garbage', itemId);
  // Also remove the target from currentQuest if present
  try { removeTargetFromCurrentQuest(itemId); } catch (e) { /* ignore */ }
  // Broadcast both a state update and a player action (so UI/game can decrement energy)
  window.dispatchEvent(new CustomEvent('gameStateUpdated', { detail: { itemId } }));
  window.dispatchEvent(new CustomEvent('playerAction', { detail: { action: 'collect', itemId, cost: 1 } }));
}

// markPlanted: player plants an item; also add to plants list
export function markPlanted(itemId: string) {
  pushUnique('plantedItems', itemId);
  pushUnique('plants', itemId);
  try { removeTargetFromCurrentQuest(itemId); } catch (e) {}
  window.dispatchEvent(new CustomEvent('gameStateUpdated', { detail: { itemId } }));
  window.dispatchEvent(new CustomEvent('playerAction', { detail: { action: 'plant', itemId, cost: 1 } }));
}

// markReleased: player releases an animal back into the ecosystem
// category hints where to add it (prey|predators|plants)
export function markReleased(itemId: string, category: 'prey' | 'predators' | 'plants' = 'prey') {
  if (category === 'prey') pushUnique('prey', itemId);
  else if (category === 'predators') pushUnique('predators', itemId);
  else pushUnique('plants', itemId);
  pushUnique('releasedItems', itemId);
  try { removeTargetFromCurrentQuest(itemId); } catch (e) {}
  window.dispatchEvent(new CustomEvent('gameStateUpdated', { detail: { itemId } }));
  window.dispatchEvent(new CustomEvent('playerAction', { detail: { action: 'release', itemId, cost: 1 } }));
}

// markIntroduced: player introduces a new species or object deliberately
export function markIntroduced(itemId: string, category: 'prey' | 'predators' | 'plants' | 'garbage' = 'prey') {
  if (category === 'prey') pushUnique('prey', itemId);
  else if (category === 'predators') pushUnique('predators', itemId);
  else if (category === 'plants') pushUnique('plants', itemId);
  else pushUnique('garbage', itemId);
  pushUnique('introducedItems', itemId);
  try { removeTargetFromCurrentQuest(itemId); } catch (e) {}
  window.dispatchEvent(new CustomEvent('gameStateUpdated', { detail: { itemId } }));
  window.dispatchEvent(new CustomEvent('playerAction', { detail: { action: 'introduce', itemId, cost: 1 } }));
}

// Remove a completed target from the active quest stored in localStorage (if present)
export function removeTargetFromCurrentQuest(itemId: string) {
  try {
    const raw = localStorage.getItem('currentQuest');
    if (!raw) return false;
    const q = JSON.parse(raw);
    if (!q || !Array.isArray(q.targets)) return false;
    const newTargets = q.targets.filter((t: string) => t !== itemId);
    if (newTargets.length === q.targets.length) return false; // nothing removed
    q.targets = newTargets;
    localStorage.setItem('currentQuest', JSON.stringify(q));
    // signal that a quest target was removed
    window.dispatchEvent(new CustomEvent('questTargetsUpdated', { detail: { itemId } }));
    return true;
  } catch (e) {
    return false;
  }
}
