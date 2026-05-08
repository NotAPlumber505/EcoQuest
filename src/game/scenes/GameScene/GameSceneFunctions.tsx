import { Game, Scene } from "phaser";
import { GameScene } from "./GameScene"

//Unknown Systems
import { markCollected, markPlanted, markReleased, markIntroduced, getGarbage, getPlants, getPredators, getPrey } from '@/game/utils/questState';


interface Categories {
    "predators": string[],
    "prey": string[],
    "plants": string[],
    "trash": string[]
}


export function spawnAllFromJSON(this : GameScene, json : Categories, bounds = { minX: 0, maxX: 800, minY: 0, maxY: 600 }) {
    const scene = this as GameScene;
    const spawnedObjects: any[] = [];
    Object.keys(json).forEach(category => {
        if(category === "predators" || category === "prey" || category === "plants" || category === "trash") {            
            json[category].forEach((spriteKey: string) => {
                let x = Phaser.Math.Between(bounds.minX, bounds.maxX);
                let y = Phaser.Math.Between(bounds.minY, bounds.maxY);
                const gameObject = scene.add.sprite(x, y, spriteKey);
                switch (category) {
                    case "plants":
                        //A lot of this implementation was not mine. Reviewing it later.
                        const seabed = bounds.maxY - Phaser.Math.Between(80, 140);
                        gameObject.setY(seabed).setDepth (-5);
                        GameScene.plantsGroup!.add(gameObject);
                        break;
                    case "predators":
                        GameScene.predatorsGroup!.add(gameObject);
                        break;
                    case "prey":
                        GameScene.preyGroup!.add(gameObject);
                        break;
                    case "trash" :
                            GameScene.trashGroup!.add(gameObject);
                            // Make trash interactive so players can collect spawned trash too
                            try {
                                gameObject.setInteractive();
                                // store the texture key as name for identification
                                gameObject.name = spriteKey;
                                gameObject.on('pointerdown', () => {
                                    // mark collected in quest state
                                    try { markCollected(spriteKey); } catch (e) { /* ignore */ }
                                    gameObject.destroy();
                                    scene.collectedTrash.push(gameObject as Phaser.GameObjects.Image);
                                });
                            } catch (e) {
                                // ignore if sprite doesn't support interaction
                            }
                        break;
                    default :
                        console.log("An object that wasn't supposed to be created was created...");
                        break;
            }
        spawnedObjects.push(gameObject);
        });
        }
    });
    GameScene.preyGroup.getChildren().forEach((children) => {
        console.log(children.name);
    });
    return spawnedObjects;
}
function trying() {
    hello
}