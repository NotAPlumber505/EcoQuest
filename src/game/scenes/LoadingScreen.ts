import { GameScene } from "./GameScene";
import { Quest }  from "../classes/Quest";
import { on } from "events";
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
            //FetchedJson = JSON.parse(apiData);
            //if first field of JSON is text, then
            //let quest = this.getQuestFromJSON(FetchedJson);
            //QuestScene.Quests.push(quest);
            //QuestScene.QuestsUpdated = true;
            //this.scene.start('QuestScene');
            //else 
            //GameScene.NewDayJson = FetchedJson;
            //GameScene.NewDayJsonReady = true;
            //this.scene.start('GameScene'); // Switch to scene
     }


     //JSON Methods

     getQuestFromJSON(jsonKey : string) {
             const data = this.cache.json.get(jsonKey);
             const quest = new Quest();
             Object.keys(data).forEach((category => {
                 switch (category) {
                     case "text":
                         quest.setText(data[category]);
                         break;
                     case "quest_type":
                         quest.setType(data[category]);
                         break;
                     case "targets":
                         quest.setTargets(data[category]);
                         break;
     
                     default:
                         console.log("A category that wasn't supposed be here was here... it was: " + category);
                         break;``
                 }
             }));
        
            quest.setGroup(this.getSpriteGroup(quest.targets[0]));
             return quest;
            }
     
         
    getSpriteGroup(spriteName : string) {
    const data = this.cache.json.get("Objects");

    // Loop through each group in the JSON
        for (let groupName in data) {
        if (data[groupName].includes(spriteName)) {
            return groupName; // found it
        }

    }
    return ""; // not found
    }
}