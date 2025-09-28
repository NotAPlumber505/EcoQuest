import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Quest } from "../classes/Quest";

export class GameScene extends Scene{

    private  predatorsGroup: Phaser.GameObjects.Group;
    private  preyGroup: Phaser.GameObjects.Group;
    private  plantsGroup: Phaser.GameObjects.Group;
    private  trashGroup: Phaser.GameObjects.Group;

    private ensureGroups(){
        if (!this.predatorsGroup) this.predatorsGroup = this.add.group();
        if (!this.preyGroup) this.preyGroup = this.add.group();
        if (!this.plantsGroup) this.plantsGroup = this.add.group();
        if (!this.trashGroup) this.trashGroup = this.add.group();

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
    newDayText: Phaser.GameObjects.Text;
    dayCount: number = 1;
    
    create(){
        this.predatorsGroup = this.add.group();
        this.preyGroup = this.add.group();
        this.trashGroup = this.add.group();
        this.plantsGroup = this.add.group();

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
            TrashObject.destroy();
            console.log("Trash Collected. Amount of Trash Collected is now:", this.collectedTrash.length + " piece of trash")
            this.energyLevel--;
            this.energyText.setText('Energy Level:' + this.energyLevel);
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
            this.energyLevel = 10;
            console.log("New Day Started!");
            this.dayCount++;
            console.log('The day number is: ' + this.dayCount);
            this.energyText.setText('Energy Level: ' + this.energyLevel);
            console.log("Energy restored!");

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
        
    }

    update(){

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

    //JSON Methods
    public spawnAllFromJSON(jsonKey : string, bounds = { minX: 0, maxX: 800, minY: 0, maxY: 600 }) {
        const data = this.cache.json.get(jsonKey);
        const spawnedObjects: any[] = [];
    
        // Loop through each key (like "enemies", "powerups")
        Object.keys(data).forEach(category => {
            if(category === "predators" || category === "prey" || category === "plants" || category === "trash") {
                
            
            data[category].forEach((spriteKey: string) => {
                let x = Phaser.Math.Between(bounds.minX, bounds.maxX);
                let y = Phaser.Math.Between(bounds.minY, bounds.maxY);

    
                const gameObject = this.add.sprite(x, y, spriteKey);
                switch (category) {
                    case "plants":
                        const seabed = bounds.maxY - Phaser.Math.Between(80, 140);
                        gameObject.setY(seabed).setDepth (-5);
                        this.plantsGroup!.add(gameObject);
                        break;
                    case "predators":
                        this.predatorsGroup!.add(gameObject);
                        break;
                    case "prey":
                        this.preyGroup!.add(gameObject);
                        break;
                    case "trash" :
                        this.trashGroup!.add(gameObject);                        
                        break;
                    default :
                        console.log("An object that wasn't supposed to be created was created...");
                        break;
                 }
                spawnedObjects.push(gameObject);
        

            });
        }
        });
        this.preyGroup.getChildren().forEach((children) => {
            console.log(children.name);
        });
        return spawnedObjects;
    }


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

    getQuestFromJSON(jsonKey : string) {
        const data = this.cache.json.get(jsonKey);
        const quest = new Quest();
        Object.keys(data).forEach((category => {
            switch (category) {
                case "text":
                    quest.setText(data[category]);
                    break;
                case "quest_type":
                    quest.setType(data[category]);
                    break;
                case "targets":
                    quest.setTargets(data[category]);
                    break;

                default:
                    console.log("A category that wasn't supposed be here was here... it was: " + category);
                    break;
            }
        }));
        return quest;

    }


}

