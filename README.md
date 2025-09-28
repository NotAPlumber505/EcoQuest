# 🌊 EcoQuest: AI-Powered Quest Generation for Games

Our mission: **use autonomous AI agents to help game developers generate quests dynamically**, saving time, improving maintainability, and raising marine awareness through engaging educational gameplay.

---

### **🛠️ Tech Stack**

- **Frontend & Backend**: [Next.js](https://nextjs.org/) + [Tailwind CSS](https://tailwindcss.com/)
- **Game Engine**: [Phaser.js](https://phaser.io/)
- **AI**: [Google ADK](https://google.github.io/adk-docs/) + A2A Protocol + Gemini API
- **Hosting**: [Vercel](https://vercel.com/)
- **Domain**: TBA

<img width="1362" height="637" alt="Screenshot 2025-09-28 105119" src="https://github.com/user-attachments/assets/f893acd5-5141-4f68-b842-c7c2d342a78a" />

---

## 🧩 System Architecture

EcoQuest uses **Google’s Agent Development Kit (ADK)** and **Agent2Agent (A2A)** protocol to build an ecosystem of AI-powered agents.  
Each **marine animal NPC** represents a specialized AI agent with unique responsibilities:

[ Player ] → [ Phaser.js Game ] → [ Next.js API ] → [ Google ADK Agents ]

### Agent Roles
- 🪸 **Coral (Loop Agent)**  
  Continuously monitors the ecosystem state and provides periodic updates (loop architecture).

- 🐢 **Turtle (Parallel Agent 1: Resource Agent)**  
  Tracks biodiversity and resources such as the number of animals or objects in the environment.

- 🐬 **Dolphin (Parallel Agent 2: Fact Agent)**  
  Generates marine awareness facts to educate players.

- 🐙 **Octopus (Sequential Quest Agent)**  
  Combines outputs from other agents into structured **quest JSON** that the game can render.  
  Example:  
  ```json
  {
    "quest": "Clean 5 plastic bottles near the coral reef",
    "reward": "Increase biodiversity score by 10%"
  }

## Setup Guide
1. Clone the Repository
```gitbash
git clone https://github.com/NotAPlumber505/EcoQuest.git
cd ecoquest
```
2. Launch Visual Studio Code and open the project folder.

3. Install Node.js & Dependencies
```gitbash
npm install
```
4. Run Development server
```gitbash
npm run dev
```
Visit http://localhost:3000 in your browser to see the app running.

## 🎮 Game Engine Setup (Phaser.js) – TBA
Instructions for adding Phaser.js to the project will go here.
## 🤖 Google ADK Agent Setup – TBA
Steps for setting up Google ADK and connecting agents will go here.
## 📦 Python Agent Dependencies
For future agent logic (data processing, fine-tuning, etc.), we will include Python dependencies in a requirements.txt.

## License
MIT License © 2025 EcoQuest Team



