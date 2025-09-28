import { getPlants, getPrey, getPredators, getGarbage, getCollected, getPlanted } from '@/game/utils/questState';
import { fetchFacts, fetchBiodiversity, fetchNewDay, fetchQuestDirect } from '@/game/utils/aiClient';

export default class QuestMenu extends Phaser.Scene {


    public static quest: Quest;
    public static questUpdated: boolean;
constructor() {
        super({ key: 'QuestMenu' });
    }

    preload() {
        
    }

    create() {
        QuestMenu.questUpdated = false;
        const centerX = this.sys.game.config.width as number / 2;
        const centerY = this.sys.game.config.height as number / 2;
        // Background
        const QuestBackground = this.add.image(0,0,'MainMenuBackground').setOrigin(0);
        QuestBackground.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        QuestBackground.setDisplaySize(this.sys.game.config.width as number, this.sys.game.config.height as number);

     
        // Title above the buttons, with vertical spacing
        this.add.text(centerX, centerY - 260, 'Quests', {
            fontSize: '48px',
            color: '#fff'
        }).setOrigin(0.5, 1);

        const buttonData = [
            { label: 'Garbage', type: 'pollution', color: 0xe74c3c },
            { label: 'Animal Introduction', type: 'introduce', color: 0x3498db },
            { label: 'Animal Release', type: 'release', color: 0x2ecc71 },
            { label: 'Plant', type: 'plant', color: 0xf1c40f }
        ];

        const btnWidth = 420;
        const btnHeight = 64;
        const gap = 24;
        const startY = centerY - 120;

        buttonData.forEach((b, i) => {
            const y = startY + i * (btnHeight + gap);
            const rect = this.add.rectangle(centerX, y, btnWidth, btnHeight, b.color).setOrigin(0.5).setInteractive();
            const label = this.add.text(centerX, y, b.label, { fontSize: '24px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);
            rect.on('pointerdown', async () => {
                // request a quest for this type
                // reset any previous quest and request a new one
                try { localStorage.removeItem('currentQuest'); } catch (e) {}
                const q = await fetchQuestDirect(b.type);
                localStorage.setItem('currentQuest', JSON.stringify(q));
                try { window.dispatchEvent(new CustomEvent('newQuestSet', { detail: { quest: q } })); } catch (e) {}
                this.renderCurrentQuest();
            });
        });

        // New Day button to let user refresh or get status
        const newDayButton = this.add.text(centerX, startY + buttonData.length * (btnHeight + gap) + 20, 'New Day', { fontSize: '20px', color: '#fff', backgroundColor: '#00000080', padding: { x: 10, y: 6 } }).setOrigin(0.5).setInteractive();
        newDayButton.on('pointerdown', async () => {
            const txt = await fetchNewDay();
            localStorage.setItem('currentQuest', JSON.stringify({ text: txt, quest_type: 'NewDay', targets: [] }));
            try { window.dispatchEvent(new CustomEvent('newQuestSet', { detail: { quest: { text: txt, quest_type: 'NewDay', targets: [] } } })); } catch (e) {}
            this.renderCurrentQuest();
        });

        
        const BackButton = this.add.image(centerX + 400, centerY + 330, 'BackButton').setScale(2).setInteractive()
        BackButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // UI area to show current quest
        this.renderCurrentQuest();

        // Listen for external updates (game may dispatch 'gameStateUpdated' when player collects items)
        window.addEventListener('gameStateUpdated', () => this.updateQuestCompletionState());
    }

    // Request a quest from the Next API and persist it
    async requestQuest(questType: 'biodiversity' | 'pollution') {
        // Gather game state via helpers
        const plants = getPlants();
        const prey = getPrey();
        const predators = getPredators();
        const garbage = getGarbage();

        const body = { questType, plants, prey, predators, garbage, actions: 1 };

        try {
            const resp = await fetch('/api/ai/quests_direct?app=context_agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!resp.ok) {
                console.warn('Quest request failed', resp.statusText);
                return;
            }

            const json = await resp.json();

            // Expect { text, quest_type, targets }
            if (json && json.text) {
                localStorage.setItem('currentQuest', JSON.stringify(json));
                // Notify the game that a new quest was set so targets can be spawned
                try { window.dispatchEvent(new CustomEvent('newQuestSet', { detail: { quest: json } })); } catch (e) {}
                this.renderCurrentQuest();
            } else {
                console.warn('Unexpected quest response', json);
            }
        } catch (e) {
            console.error('Error requesting quest', e);
        }
    }

    // Show the current quest if present
    renderCurrentQuest() {
        const centerX = this.sys.game.config.width as number / 2;
        const centerY = this.sys.game.config.height as number / 2;

        // remove existing quest display if present
        const prev = this.children.getByName('questText') as Phaser.GameObjects.Text;
        if (prev) prev.destroy();
        const prevBtn = this.children.getByName('completeBtn') as Phaser.GameObjects.Text;
        if (prevBtn) prevBtn.destroy();

        const current = localStorage.getItem('currentQuest');
        if (!current) return;

        const quest = JSON.parse(current);
        const text = quest.text || 'New Quest';

        const questText = this.add.text(centerX, centerY + 170, text, { fontSize: '20px', color: '#fff', wordWrap: { width: 600 } }).setOrigin(0.5).setName('questText');

        // Complete button (disabled until completion criteria met)
        const completeBtn = this.add.text(centerX, centerY + 230, 'Complete Quest', { fontSize: '22px', color: '#aaa', backgroundColor: '#333' }).setOrigin(0.5).setInteractive().setName('completeBtn');
        completeBtn.on('pointerdown', () => {
            if (this.isQuestCompletable()) {
                this.completeQuest();
            }
        });

        this.updateQuestCompletionState();
    }

    // Determine if the current quest is completable based on simple heuristics
    isQuestCompletable(): boolean {
        const current = localStorage.getItem('currentQuest');
        if (!current) return false;
        const quest = JSON.parse(current);

        // Use localStorage 'collectedItems' or similar as a simple game state integration point
        const collected: string[] = JSON.parse(localStorage.getItem('collectedItems') || '[]');

        if (quest.quest_type === 'Garbage') {
            const targets: string[] = quest.targets || [];
            return targets.every(t => collected.includes(t));
        }

        if (quest.quest_type === 'Plant') {
            const targets: string[] = quest.targets || [];
            const planted: string[] = JSON.parse(localStorage.getItem('plantedItems') || '[]');
            return targets.every(t => planted.includes(t));
        }

        if (quest.quest_type === 'Removing' || quest.quest_type === 'Adding' || quest.quest_type === 'Protect') {
            // Best-effort: check collected for presence/absence
            const targets: string[] = quest.targets || [];
            return targets.every(t => collected.includes(t));
        }

        // If we don't have enough info, allow manual completion via UI (return false)
        return false;
    }

    updateQuestCompletionState() {
        const completeBtn = this.children.getByName('completeBtn') as Phaser.GameObjects.Text;
        if (!completeBtn) return;
        if (this.isQuestCompletable()) {
            completeBtn.setStyle({ color: '#0f0' });
        } else {
            completeBtn.setStyle({ color: '#aaa' });
        }
    }

    completeQuest() {
        const current = localStorage.getItem('currentQuest');
        if (!current) return;
        const quest = JSON.parse(current);

        // Clear stored quest
        localStorage.removeItem('currentQuest');

        // Mark that the player owes Sam a night out (simple local flag / counter)
        try {
            const owes = Number(localStorage.getItem('owesSamCount') || '0');
            localStorage.setItem('owesSamCount', String(owes + 1));
        } catch (e) { /* ignore */ }

        // Notify other scenes that the quest was completed
        this.game.events.emit('questCompleted', quest);
        // Also emit a reward event so UI can show something
        this.game.events.emit('playerReward', { message: "You owe Sam a night out!" });

        // Refresh UI
        this.renderCurrentQuest();
    }
}