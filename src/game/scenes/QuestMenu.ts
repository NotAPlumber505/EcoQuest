import { Quest } from '../classes/Quest';

export default class QuestMenu extends Phaser.Scene {


    public static quest: Quest;
    public static questUpdated: boolean;
constructor() {
        super({ key: 'QuestMenu' });
    }

    preload() {
        
    }

    create() {
        QuestMenu.questUpdated = false;
        const centerX = this.sys.game.config.width as number / 2;
        const centerY = this.sys.game.config.height as number / 2;
        // Background
        const QuestBackground = this.add.image(0,0,'MainMenuBackground').setOrigin(0);
        QuestBackground.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        QuestBackground.setDisplaySize(this.sys.game.config.width as number, this.sys.game.config.height as number);

     
        this.add.text(centerX, centerY - 200, 'Quests', {
            fontSize: '48px',
            color: '#fff'
        }).setOrigin(0.5);
        const biodiversityButton = this.add.image(centerX, centerY - 75, 'QuestsButton').setScale(4).setInteractive()
        //Replace 'QuestsButton' with BiodiversityButton when available

        biodiversityButton.on('pointerdown', () => {
            //trigger API call to get biodiversity quests
            this.scene.start("LoadingScene");

        });
        const pollutionButton = this.add.image(centerX, centerY + 65, 'QuestsButton').setScale(4).setInteractive()
        //Replace 'QuestsButton' with PollutionButton when available

        pollutionButton.on('pointerdown', () => {
            //trigger API call to get biodiversity quests
            this.scene.start("LoadingScene");

        });

        
        const BackButton = this.add.image(centerX + 400, centerY + 330, 'BackButton').setScale(2).setInteractive()
        BackButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        
       // update() {
        //if (QuestMenu.questUpdated) {
            //Hide buttons
            //Display quest info
            //pass quest to GameScene
            //GameScene.quest = QuestMenu.quest;
        //}
    }

    async sendInputToAgent(inputText) {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: inputText })
  });

  const data = await response.json();
  return data.agentResponse;

}
    
