export class Quest {
    text : string;
    quest_type : string;
    targets : string[];
    group : string;

    constructor() {
        this.text = "";
        this.quest_type = "";
        this.targets = [];
        this.group = "";
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
    setGroup(group : string) {
        this.group = group;
    }
}