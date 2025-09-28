import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class GameScene extends Scene{

    
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
    
    create(){

        let energyLevel = 10;
        
        const {width, height} = this.scale;

        //const bg = this.add.tileSprite(0,0,width, height, 'CoralBackground')
        this.bg = this.add.tileSprite(0,0,width, height, 'CoralBackground')
        .setOrigin(0)
        .setScrollFactor(0); //makes it pinned to camera

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

        TrashObject.on('pointerdown', () => {
            this.collectedTrash.push(TrashObject);
            TrashObject.destroy();
            console.log("Trash Collected. Amount of Trash Collected is now:", this.collectedTrash.length + " piece of trash")
            energyLevel--;
            console.log("Energy is now at:", energyLevel);
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

        } else if (this.cursors.right.isDown){
            this.player.setVelocityX(this.moveSpeed);
            this.player.setFlipX(false);
            
        }

        //vertical movement
        if (this.cursors.up.isDown){
            this.player.setVelocityY(-this.moveSpeed);
            
        } else if (this.cursors.down.isDown){
            this.player.setVelocityY(this.moveSpeed);
        
        }
    }    
}

