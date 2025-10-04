function spawnAllFromJSON(json : string, bounds = { minX: 0, maxX: 800, minY: 0, maxY: 600 }) {
        const data = this.cache.json.get(jsonKey);
        const spawnedObjects: any[] = [];
    
        // Loop through each key (like "enemies", "powerups")
        Object.keys(data).forEach(category => {
            if(category === "predators" || category === "prey" || category === "plants" || category === "trash") {
                
            
            data[category].forEach((spriteKey: string) => {
                let x = Phaser.Math.Between(bounds.minX, bounds.maxX);
                let y = Phaser.Math.Between(bounds.minY, bounds.maxY);

    
                const gameObject = this.add.sprite(x, y, spriteKey);
                switch (category) {
                    case "plants":
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
                                    this.collectedTrash.push(gameObject as Phaser.GameObjects.Image);
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
        this.cache.json.remove(jsonKey);
        return spawnedObjects;
    }