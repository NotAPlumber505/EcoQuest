import { Game, Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Quest } from "../classes/Quest";
import { markCollected, markPlanted, markReleased, markIntroduced, getGarbage, getPlants, getPredators, getPrey } from '@/game/utils/questState';
import { fetchFacts } from '@/game/utils/aiClient';

export class GameScene extends Scene{

    public static predatorsGroup: Phaser.GameObjects.Group;
    public static preyGroup: Phaser.GameObjects.Group;
    public static plantsGroup: Phaser.GameObjects.Group;
    public static trashGroup: Phaser.GameObjects.Group;
    public static quest: Quest;
    public static questUpdated: boolean;
    public static NewDayJson: JSON;
    public static NewDayJsonReady: boolean
    public static questShop : boolean;

    private ensureGroups(){
        if (!GameScene.predatorsGroup) GameScene.predatorsGroup = this.add.group();
        if (!GameScene.preyGroup) GameScene.preyGroup = this.add.group();
        if (!GameScene.plantsGroup) GameScene.plantsGroup = this.add.group();
        if (!GameScene.trashGroup) GameScene.trashGroup = this.add.group();

    }


    private background!: Phaser.GameObjects.Image; 

    //Class variables 


    //Made the player a physics sprite which allows us to use a movement and world bounds
    private player!: Phaser.Physics.Arcade.Sprite;


    //Made an object that holds refrences for the movement like umm up,down,left,right arrow keys
    //This will be used to check for the player input 
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private readonly moveSpeed = 300; 

    constructor (){
        //This scene will have a unique key that will be connected with the main menu when we click the start button
        super('GameScene');
    }


    //Runs once when the scene is first created (just for initialization)
    togglePause() {
        this.scene.pause();
        this.scene.launch('PauseScene'); 
    }

    collectedTrash: Phaser.GameObjects.Image[] = [];
    energyText: Phaser.GameObjects.Text;
    energyLevel: number = 10;
    maxEnergy: number = 10;
    newDayText: Phaser.GameObjects.Text;
    dayCount: number = 1;
    private tutorialOverlay?: Phaser.GameObjects.Container;
    
    create(){
        GameScene.predatorsGroup = this.add.group();
        GameScene.preyGroup = this.add.group();
        GameScene.trashGroup = this.add.group();
        GameScene.plantsGroup = this.add.group();
        GameScene.NewDayJsonReady = false;
        GameScene.questUpdated = false;
        GameScene.questShop = false;
        const {width, height} = this.scale;
        
        this.background = this.add.image(0,0,'CoralBackground').setOrigin(0); //makes it pinned to camera

        //(this as any).bg = bg;

        this.cameras.main.setBackgroundColor(0x000080);
        this.background = this.add.image(0,0,'CoralBackground').setOrigin(0); //makes it pinned to camera

        //Background 
        
        const worldWidth = this.background.width;
        const worldHeight = this.background.height;

        this.physics.world.setBounds(0,0,worldWidth, worldHeight);
        this.cameras.main.setBounds(0,0,worldWidth,worldHeight);

        this.cursors = this.input.keyboard!.createCursorKeys();

        //The diver!  <3
        //this.physics.add.sprite will give the character more arcade like making movement go by velocity 
        this.player = this.physics.add.sprite(150,worldHeight/2,'Diver',); //(starting position for X, For Y, key for the diver)
        this.player.setScale(2);
        this.player.setFlipX(false); //make the character to look right at the start
        // Keep player in bounds with collision
        this.player.setCollideWorldBounds(true);

        //bouncy O_O?
        this.player.setBounce(0.2);

        //camera
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        
        EventBus.emit('current-scene-ready', this);

        this.collectedTrash = [];


        const TrashObject = this.add.image(width, height - 75, 'AppleTrash').setScale(2).setInteractive();

        this.energyText = this.add.text(100, 20, 'Energy Level: ' + this.energyLevel, {
            fontSize: '20px',
            color: '#fff'
        }).setOrigin(0.5).setScrollFactor(0);

        TrashObject.on('pointerdown', () => {
            this.collectedTrash.push(TrashObject);
            // markCollected expects an id; use the texture key as the item id
            try { markCollected(TrashObject.texture.key || 'AppleTrash'); } catch (e) { /* ignore */ }
            TrashObject.destroy();
            console.log("Trash Collected. Amount of Trash Collected is now:", this.collectedTrash.length + " piece of trash")
            // energy cost handled centrally via playerAction event emitted by markCollected
            console.log("Energy now is at:", this.energyLevel)
            this.spawnAllFromJSON("Objects", {minX : 0, maxX: worldWidth, minY : 0, maxY : worldHeight})
        });

        this.newDayText = this.add.text(width - 40, height - 60, 'New Day', {
            fontSize: '20px',
            color: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(1,1).setScrollFactor(0).setInteractive();

        this.newDayText.on('pointerdown', () => {
            this.energyLevel = this.maxEnergy;
            console.log("New Day Started!");
            this.dayCount++;
            console.log('The day number is: ' + this.dayCount);
            this.energyText.setText('Energy Level: ' + this.energyLevel);
            console.log("Energy restored!");
            // Clear current quest so player can choose a new one
            try { localStorage.removeItem('currentQuest'); } catch (e) {}
            window.dispatchEvent(new CustomEvent('newDay', {}));

        });

        const questButton = this.add.text(width - 40, height + -700, 'Quests', {
            fontSize: '20px',
            color: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(1,1).setScrollFactor(0).setInteractive();

        questButton.on('pointerdown', () => {
            this.scene.start('QuestMenu');

        });
        // Add physics overlap so moving through trash collects it automatically
        this.physics.add.overlap(this.player, GameScene.trashGroup, (playerObj: any, trashObj: any) => {
            try {
                const key = trashObj.texture?.key || trashObj.name || 'Trash';
                markCollected(key);
            } catch (e) {}
            try { trashObj.destroy(); } catch (e) {}
        });

        // Attach click handlers to existing predator/prey children to fetch facts
        const attachFactHandlers = (group: Phaser.GameObjects.Group) => {
            group.getChildren().forEach((child: any) => {
                try {
                    child.setInteractive();
                    child.on('pointerdown', async () => {
                        const fact = await fetchFacts({ subject: child.texture?.key || child.name || 'animal' });
                        // transient display
                        this.showTransientFact(fact, child.x || this.cameras.main.centerX, child.y || this.cameras.main.centerY);
                    });
                } catch (e) { /* ignore */ }
            });
        };

        attachFactHandlers(GameScene.predatorsGroup);
        attachFactHandlers(GameScene.preyGroup);

        // Listen for playerAction events (emitted by questState helpers) to decrement energy
        window.addEventListener('playerAction', (e: any) => {
            try {
                const cost = Number(e?.detail?.cost) || 1;
                this.energyLevel = Math.max(0, this.energyLevel - cost);
                this.energyText.setText('Energy Level: ' + this.energyLevel);
                if (this.energyLevel <= 0) {
                    // go to GameOver scene
                    this.scene.start('GameOver');
                }
            } catch (err) {}
        });

        // When a new quest is set, ensure targets exist in the world and fetch facts for them
        window.addEventListener('newQuestSet', (ev: any) => {
            try {
                const quest = ev?.detail?.quest;
                if (!quest || !Array.isArray(quest.targets)) return;
                this.spawnTargetsForQuest(quest.targets);
            } catch (err) { /* ignore */ }
        });

        // When a quest target is removed (completed), fetch a fact about it and show
        window.addEventListener('questTargetsUpdated', async (ev: any) => {
            try {
                const itemId = ev?.detail?.itemId;
                if (!itemId) return;
                const fact = await fetchFacts({ subject: itemId });
                this.showTransientFact(fact, this.player.x, this.player.y - 40);
            } catch (err) { /* ignore */ }
        });

        // Hotkey to use purchased energy item (E)
        const useKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        useKey.on('down', () => {
            try {
                const inv = Number(localStorage.getItem('inventory_energy') || '0');
                if (inv > 0) {
                    const heal = 5;
                    this.energyLevel = Math.min(this.maxEnergy, this.energyLevel + heal);
                    localStorage.setItem('inventory_energy', String(inv - 1));
                    this.showTransientFact(`Used Energy Pack: +${heal} energy`, this.player.x, this.player.y - 60, 2000);
                    this.energyText.setText('Energy Level: ' + this.energyLevel);
                } else {
                    this.showTransientFact('No energy packs in inventory', this.player.x, this.player.y - 60, 1500);
                }
            } catch (err) { /* ignore */ }
        });

        window.addEventListener('newDay', async () => {
        const newDayPayload = {
            plants: getPlants(),
            prey: getPrey(),
            predators: getPredators(),
            garbage: getGarbage(),
            actions: 1
        };

    // Call ContextAgent API pipeline for new day context
    const response = await fetch('/api/ai/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDayPayload)
    });

    const result = await response.json();

    // Store it in scene for rendering
    if (result?.text) {
        this.showTransientFact(result.text, this.player.x, this.player.y - 80);
    }
    if (result?.biodiversity_report?.summary) {
        this.showTransientFact(result.biodiversity_report.summary, this.player.x, this.player.y - 60);
    }

    if (result?.facts) {
        result.facts.forEach((fact: string, i: number) => {
            setTimeout(() => this.showTransientFact(fact, this.player.x, this.player.y - (40 - i * 10)), 500 * i);
        });
    }

    this.cache.json.add('NewDayJson', GameScene.NewDayJson);
    GameScene.NewDayJsonReady = true;
    });


// Inside your Phaser Scene's create() method

// 1. Get the screen height and explicitly cast it as a number
const screenHeight = this.game.config.height as number; 

const tutorialBtn = this.add.text(
    20, // X-coordinate: 20 pixels from the left
    screenHeight - 20, // Y-coordinate: Screen Height minus 20 pixels from the bottom
    'Tutorial',
    {
        fontSize: '16px',
        color: '#fff',
        backgroundColor: '#00000080',
        padding: { x: 8, y: 6 }
    }
)
.setOrigin(0, 1) // Anchor the text box at its bottom-left corner
.setScrollFactor(0)
.setInteractive();

tutorialBtn.on('pointerdown', () => this.showTutorial());
    }

    update(){
        if(GameScene.NewDayJsonReady){

            this.cache.json.add('NewDayJson', GameScene.NewDayJson);
            this.spawnAllFromJSON("NewDayJson", {minX : 0, maxX: this.background.width, minY : 0, maxY : this.background.height});
        }
        if (GameScene.questUpdated) { 
            this.AllowTarget(GameScene.quest.targets, GameScene.quest.quest_type);
        }
        // this.player.setVelocity(0);
        // this.player.setAcceleration(0);
        const body = this.player.body as Phaser.Physics.Arcade.Body | null;

        if (!body) return;

        body.setVelocity(0);

         
        if (this.cursors.left.isDown){
            this.player.setVelocityX (-this.moveSpeed);
            this.player.setFlipX(true);

        } 
        if (this.cursors.right.isDown){
            this.player.setVelocityX(this.moveSpeed);
            this.player.setFlipX(false);
            
        }
        if (this.cursors.up.isDown){
            this.player.setVelocityY(-this.moveSpeed);
            
        } 
        if (this.cursors.down.isDown) {
            this.player.setVelocityY(this.moveSpeed);
        }
        if (this.cursors.space.isDown) {
            this.togglePause();
        }
    }    

    // Display a short, transient fact text at (x,y) in world coordinates
    showTransientFact(text: string, x: number, y: number, duration = 3000) {
        try {
            const cam = this.cameras.main;
            const worldX = x;
            const worldY = y - 30;
            const t = this.add.text(worldX, worldY, text, { fontSize: '14px', color: '#fffa', backgroundColor: '#000000cc', padding: { x: 6, y: 4 }, wordWrap: { width: 200 } }).setOrigin(0.5);
            t.setDepth(1000);
            setTimeout(() => {
                try { t.destroy(); } catch (e) {}
            }, duration);
        } catch (e) {
            // ignore display errors
        }
    }

    // Ensure quest targets exist in the world (spawn if missing)
    spawnTargetsForQuest(targets: string[]) {
        try {
            // For each target, if there's no sprite with that texture key in any group, spawn it near player
            targets.forEach((t: string) => {
                const exists = GameScene.predatorsGroup.getChildren().some((c:any) => c.texture?.key === t)
                  || GameScene.preyGroup.getChildren().some((c:any) => c.texture?.key === t)
                  || GameScene.plantsGroup.getChildren().some((c:any) => c.texture?.key === t)
                  || GameScene.trashGroup.getChildren().some((c:any) => c.texture?.key === t);
                if (!exists) {
                    const x = Phaser.Math.Between(Math.max(0, this.player.x - 200), Math.min(this.background.width, this.player.x + 200));
                    const y = Phaser.Math.Between(Math.max(0, this.player.y - 200), Math.min(this.background.height, this.player.y + 200));
                    const spr = this.add.sprite(x, y, t);
                    // If it's a trash-type texture, make it interactive and add to trashGroup
                    if (t.toLowerCase().includes('trash') || t.toLowerCase().includes('garbage')) {
                        try { spr.setInteractive(); spr.name = t; spr.on('pointerdown', () => { try { markCollected(t); } catch (e) {} spr.destroy(); }); } catch (e) {}
                        GameScene.trashGroup.add(spr);
                    } else if (t.toLowerCase().includes('plant')) {
                        GameScene.plantsGroup.add(spr);
                    } else {
                        // default to prey
                        try { spr.setInteractive(); spr.on('pointerdown', async () => { const fact = await fetchFacts({ subject: t }); this.showTransientFact(fact, spr.x, spr.y - 30); }); } catch (e) {}
                        GameScene.preyGroup.add(spr);
                    }
                }
            });
        } catch (e) { /* ignore */ }
    }

    showTutorial() {
        try {
            if (this.tutorialOverlay) {
                this.tutorialOverlay.setVisible(true);
                return;
            }
            const { width, height } = this.scale;
            const bg = this.add.rectangle(width/2, height/2, 600, 300, 0x000000, 0.8).setScrollFactor(0).setDepth(2000);
            const txt = this.add.text(width/2, height/2 - 40, 'Use arrow keys to move:\nUp/Down/Left/Right\nPress E to use energy pack\nClick trash to collect', { fontSize: '18px', color: '#fff', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
            const closeBtn = this.add.text(width/2, height/2 + 100, 'Close', { fontSize: '20px', color: '#fff', backgroundColor: '#333', padding: { x: 8, y: 6 } }).setOrigin(0.5).setScrollFactor(0).setDepth(2001).setInteractive();
            closeBtn.on('pointerdown', () => { bg.destroy(); txt.destroy(); closeBtn.destroy(); this.tutorialOverlay = undefined; });
            this.tutorialOverlay = this.add.container(0,0, [bg, txt, closeBtn]);
        } catch (e) { /* ignore */ }
    }

    //JSON Methods
    


    getSpriteGroup(jsonKey : string, spriteName : string) {
    const data = this.cache.json.get(jsonKey);

    // Loop through each group in the JSON
    for (let groupName in data) {
        if (data[groupName].includes(spriteName)) {
            return groupName; // found it
        }
    }

    return null; // not found
}

    public AllowTarget(targets : string [], action : string) {
        const group = targets[0];

    let selectedGroup: Phaser.GameObjects.Group | undefined;

    switch (group) {
        case "predators":
        selectedGroup = GameScene.predatorsGroup;
        break;
        case "prey":
        selectedGroup = GameScene.preyGroup;
        break;
        case "plants":
        selectedGroup = GameScene.plantsGroup;
        break;
        case "trash":
        selectedGroup = GameScene.trashGroup;
        break;
        default:
        selectedGroup = undefined;
    }

    if ((action === "garbage" || action === "remove") && selectedGroup) {
        selectedGroup.getChildren().forEach((target: any) => {
        target.setInteractive();
        target.on('pointerdown', () => {
            if (this.energyLevel > 0) {
            this.energyLevel--;
            this.energyText.setText('Energy Level: ' + this.energyLevel);
            // Remove target from quest targets array
            const idx = GameScene.quest.targets.indexOf(target.name);
            if (idx !== -1) {
                GameScene.quest.targets.splice(idx, 1);
            }
            target.destroy();
            }
        });
        });
    }

    if (action === "add" || action === "plant") {
        (this as any).customShop = true;
    }


    }
}