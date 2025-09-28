export default class StoreScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StoreScene' });
    }

    preload() {
        
    }

    create() {
        const centerX = this.sys.game.config.width as number / 2;
        const centerY = this.sys.game.config.height as number / 2;
        // Background
        const StoreBackground = this.add.image(0,0,'MainMenuBackground').setOrigin(0);
        StoreBackground.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        StoreBackground.setDisplaySize(this.sys.game.config.width as number, this.sys.game.config.height as number);

        // Upgrade Buttons
        const EnergyUpgrade = this.add.image(centerX - 200, centerY - 100, 'EnergyUpgrade').setScale(2).setInteractive()
        this.add.text(centerX - 230, centerY - 50, 'Energy Upgrade (+5)', {
            fontSize: '16px',
            color: '#fff'
        }).setOrigin(0.5);

        const ScissorsUpgrade = this.add.image(centerX + 260, centerY - 100, 'ScissorsUpgrade').setScale(2).setInteractive()
        this.add.text(centerX + 230, centerY - 50, 'Scissors Upgrade (Free Animals)', {
            fontSize: '16px',
            color: '#fff'
        }).setOrigin(0.5);
        
        const TrashUpgrade = this.add.image(centerX - 225, centerY + 110, 'TrashUpgrade').setScale(1.5).setInteractive()
        this.add.text(centerX - 230, centerY + 180, 'Trash Upgrade (Store More Trash)', {
            fontSize: '16px',
            color: '#fff'
        }).setOrigin(0.5);

        const FishPurchase = this.add.image(centerX + 275, centerY + 150, 'BlueFish').setScale(6).setInteractive()
        this.add.text(centerX + 245, centerY + 180, 'Purchase Fish', {
            fontSize: '16px',
            color: '#fff'
        }).setOrigin(0.5);

        const BackButton = this.add.image(centerX, centerY, 'BackButton').setScale(4).setInteractive()
        BackButton.on('pointerdown', () => {
            this.scene.start('MainMenu'); // Switch to scene
        });

        // Title Text
        this.add.text(centerX, centerY - 200, 'Store', {
            fontSize: '48px',
            color: '#fff'
        }).setOrigin(0.5);

        this.add.text(centerX - 300, centerY + 300, 'Current Shells', {
            fontSize: '35px',
            color: '#fff'
        }).setOrigin(0.5);
        
        

    }
    
}