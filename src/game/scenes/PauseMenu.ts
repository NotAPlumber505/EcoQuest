import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        const centerX = this.sys.game.config.width as number / 2;
        const centerY = this.sys.game.config.height as number / 2;
        

        const overlay = this.add.rectangle(
            centerX, centerY, 
            this.sys.game.config.width as number, 
            this.sys.game.config.height as number, 
            0x000000, 0.5
        ).setDepth(99); // Set a high depth so it covers the game


        this.add.text(centerX, centerY - 100, 'GAME PAUSED', {
            fontSize: '64px',
            color: '#fff',
            backgroundColor: '#000000',
        }).setOrigin(0.5).setDepth(100);

        const resumeButton = this.add.text(centerX, centerY + 50, 'RESUME', {
            fontSize: '40px',
            color: '#ffffffff',
        }).setOrigin(0.5).setInteractive().setDepth(100);

         resumeButton.on('pointerdown', () => {
            // Stop the PauseScene
            this.scene.stop();
            this.scene.resume('GameScene'); 
        });

        const exitButton = this.add.text(centerX, centerY + 150, 'MAIN MENU', {
            fontSize: '40px',
            color: '#ff0000',
        }).setOrigin(0.5).setInteractive().setDepth(100);

        exitButton.on('pointerdown', () => {
            // Stop the PauseScene
            this.scene.stop();
            // Stop the Game scene completely
            this.scene.stop('GameScene'); 
            // Start the Main Menu scene
            this.scene.start('MainMenu'); 
        });
    }
}