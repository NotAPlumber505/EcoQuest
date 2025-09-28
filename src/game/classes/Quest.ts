export class Quest {
    text : string;
    quest_type : string;
    targets : string[];

    constructor() {
        this.text = "";
        this.quest_type = "";
        this.targets = [];
    }
    setText(text : string) {
        this.text = text;
    }
    setType(type : string) {
        this.quest_type = type;
    }
    setTargets(targets : string[]) {
        this.targets = targets;
    }
}