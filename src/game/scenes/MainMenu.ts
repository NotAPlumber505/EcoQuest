export default class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    create() {

        const centerX = this.sys.game.config.width as number / 2;
        const centerY = this.sys.game.config.height as number / 2;

        // Background
        const MainMenuBackground = this.add.image(0,0,'MainMenuBackground').setOrigin(0);
        MainMenuBackground.setDisplaySize(this.sys.game.config.width as number, this.sys.game.config.height as number);

        // Title Text
        this.add.text(centerX, centerY - 200, 'EcoQuest', {
            fontSize: '48px',
            color: '#fff'
        }).setOrigin(0.5);

        // Start Button
        const startButton = this.add.image(centerX, centerY - 75, 'startButton').setScale(8).setInteractive()

        startButton.on('pointerdown', () => {
            this.scene.start('GameScene'); // Switch to scene
        });

        //Store Button
        const storeButton = this.add.image(centerX, centerY + 65, 'storeButton').setScale(8).setInteractive()

        storeButton.on('pointerdown', () => {
            this.scene.start('StoreScene'); // Switch to scene
        });


        // Instructions
        this.add.text(centerX, centerY + 150, 'Click Start to Play', {
            fontSize: '32px',
            color: '#fff'
        }).setOrigin(0.5);

    }
}
