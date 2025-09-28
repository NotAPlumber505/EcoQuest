import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
// import { Game as MainGame } from './scenes/Game';
import MainMenu from './scenes/MainMenu';
import { GameScene } from './scenes/GameScene';
import StoreScene from './scenes/StoreScene';
import PauseMenu from './scenes/PauseMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import QuestMenu from './scenes/QuestMenu';
import LoadingScene from './scenes/LoadingScreen';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    // backgroundColor: '#028af8',
    pixelArt: true,

    scale:{
        mode: Phaser.Scale.FIT, // Will let phaser know to scale the game to the windows
        autoCenter: Phaser.Scale.CENTER_BOTH, // Centers the game background
    },

    input: {
        keyboard: true,
        mouse: true,
        touch: true,
        gamepad: false
    },

    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                x:0, y:0
            }
        }
    }

    , scene: [
        Boot,
        Preloader,
        MainMenu,
        GameScene,
        PauseMenu,
        GameOver,
        StoreScene,
        QuestMenu,
        LoadingScene
    ]
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
