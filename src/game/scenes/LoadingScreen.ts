import { GameScene } from "./GameScene";

export default class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
    
        // Background
        const loadingBackground = this.add.image(0,0,'MainMenuBackground').setOrigin(0);
        loadingBackground.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        loadingBackground.setDisplaySize(this.sys.game.config.width as number, this.sys.game.config.height as number);
        const centerX = this.sys.game.config.width as number / 2;
        const centerY = this.sys.game.config.height as number / 2;
        
        // Loading Text
        this.add.text(centerX, centerY, 'Loading...', {
            fontSize: '48px',
            color: '#fff'
        }).setOrigin(0.5);
        
    }
    create() {
        
    }
    update(): void {
            //Check if the API call is complete and data is ready
            //apiData = await fetchQuestData();
            //If data is ready,
            //gamescene.cache.json.add('APIData', apiData);
            //this.scene.start('GameScene'); // Switch to scene
     }
}