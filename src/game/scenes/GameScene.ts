import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class GameScene extends Scene{

    
    private bg!: Phaser.GameObjects.TileSprite; 

    //Class variables 


    //Made the player a physics sprite which allows us to use a movement and world bounds
    private player!: Phaser.Physics.Arcade.Sprite;


    //Made an object that holds refrences for the movement like umm up,down,left,right arrow keys
    //This will be used to check for the player input 
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private readonly moveSpeed = 300; 
    private readonly parallax = 0.02;


    constructor (){
        //This scene will have a unique key that will be connected with the main menu when we click the start button
        super('GameScene');
    }


    //Runs once when the scene is first created (just for initialization)
    create(){


        
        const {width, height} = this.scale;

        //const bg = this.add.tileSprite(0,0,width, height, 'CoralBackground')
        this.bg = this.add.tileSprite(0,0,width, height, 'CoralBackground')
        .setOrigin(0)
        .setScrollFactor(0); //makes it pinned to camera

        //(this as any).bg = bg;

        this.cameras.main.setBackgroundColor(0x000080);


        // testing things out but this should make it easier to position elements with the screen size (might change later if it's not workin out)
        // const gameWidth = this.sys.game.config.width as number;
        // const gameHeight = this.sys.game.config.height as number;

        //Background 
        //setOrgin() will make the image an anchor to the top left (0,0)
        // const background = this.add.image(0,0,'CoralBackground').setOrigin(0);

        // const overScaleFacor = 1.1;

        //background.setDisplaySize(this.sys.game.config.width as number, this.sys.game.config.height as number);
        

        // Need to scale the image to match the window 
        //background.setDisplaySize(gameWidth,gameHeight);
        // background.setDisplaySize(gameWidth * overScaleFacor, gameHeight * overScaleFacor);
        // background.setOrigin(0.5);
        // background.setPosition(gameWidth/2,gameHeight/2);


        const kb = this.input.keyboard;
        if (!kb) {
        console.error('Keyboard plugin is not available');
        return; // or throw, or fallback
        }
        this.cursors = kb.createCursorKeys();

        this.cursors = this.input.keyboard!.createCursorKeys();

        //The diver!  <3
        //this.physics.add.sprite will give the character more arcade like making movement go by velocity 
        this.player = this.physics.add.sprite(150,height/2,'Diver',); //(starting position for X, For Y, key for the diver)

        this.player.setScale(2);
        this.player.setFlipX(false); //make the character to look right at the start


        // Keep player in bounds with collision
        this.player.setCollideWorldBounds(true);

        //bouncy O_O?
        this.player.setBounce(0.2);

        //camera
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        
        EventBus.emit('current-scene-ready', this);
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
        
        const bg = (this as any).bg as Phaser.GameObjects.TileSprite;

       // const body = this.player.body as Phaser.Physics.Arcade.Body | null;
        if (body){
        this.bg.tilePositionX += body.velocity.x * 0.02;
        this.bg.tilePositionY += body.velocity.y * 0.02;
        }    
    }

}