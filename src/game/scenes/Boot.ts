import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

<<<<<<< HEAD
        
=======
        this.load.image('mainBackground', 'assets/MainMenuBackgroundReef.jpg');
>>>>>>> 70c9c45d278d83aadfe8a8f3c7c1e604513e05d4
    }

    create ()
    {
        this.scene.start('Preloader');
        this.scene.start('CreditsScene');
    }
}
