export default class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    create() {
        // Background
        const MainMenuBackground = this.add.image(0,0,'MainMenuBackground').setOrigin(0);
        MainMenuBackground.setDisplaySize(this.sys.game.config.width as number, this.sys.game.config.height as number);

        // Title Text
        this.add.text(400, 150, 'EcoQuest', {
            fontSize: '48px',
            color: '#fff'
        }).setOrigin(0.5);

        // Start Button
        const startButton = this.add.image(400, 300, 'startButton').setScale(10).setInteractive()

        startButton.on('pointerdown', () => {
            this.scene.start('GameScene'); // Switch to scene
        });

        // Instructions
        this.add.text(400, 400, 'Click Start to Play', {
            fontSize: '32px',
            color: '#fff'
        }).setOrigin(0.5);
    }
}
