import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'mainBackground');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) =>{

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        // Animal NPCs
        this.load.image('Clownfish', 'ChloeClownfish.png');
        this.load.image('Dolphin', 'DonnaDolphin.png');
        this.load.image('Eel', 'EnriqueEel.png');
        this.load.image('Octopus', 'OctaviaOctopus.png');
        this.load.image('Shark', 'ShawnShark.png');
        this.load.image('BlueFish', 'TropicalFishBlue.png');
        this.load.image('RedFish', 'TropicalFishRed.png');
        this.load.image('YellowFish', 'TropicalFishYellow.png');
        this.load.image('Whale', 'WillyWhale.png');
        this.load.image('Turtle', 'TeeTurtle.png');

        // Backgrounds
        this.load.image('CoralBackground','FirstSite.jpg'); // In-game background
        this.load.image('MainMenuBackground', 'MainMenuBackgroundReef.jpg'); // Main menu background
        this.load.image('startButton', 'StartButton.png'); // Start button for main menu
        this.load.image('storeButton', 'StoreButton.png'); // Store button for main menu
        this.load.image('QuestButton', 'QuestButton.png'); //Quest button for in-game
        this.load.image('creditsButton', 'CreditsButton.png'); //Credits button for main menu

        // Trash
        this.load.image('AppleTrash', 'AppleTrash.png');
        this.load.image('BottleTrash', 'BottleTrash.png');
        this.load.image('DuckTrash', 'DuckTrash.png');
        this.load.image('SodaTrash', 'SodaTrash.png');
        this.load.image('TrashBag', 'TrashBag.png');
        
        // Polluted Animal NPCs (JIC)
        this.load.image('PollutedTurtle', 'PollutedTurtle.png');

        // Upgrades
        this.load.image('ShellCurrency', 'ShellCurrency.png');
        this.load.image('EnergyUpgrade', 'EnergyUpgrade.png');
        this.load.image('ScissorsUpgrade', 'ScissorsUpgrade.png');
        this.load.image('TrashUpgrade', 'TrashUpgrade.png');
        // Note to self: The Fish purchase will use the BlueFish sprite.

        //Diver
        this.load.image("Diver","Diver.png");

    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
