# Theatre

Theatre is a mod for Foundry VTT that allows for a visual novel style RP experience for text, and text-voice hybrid games. The primary function of Theatre is to allow for graphical 'theatre-inserts' or 'standin-graphics' to appear on screen with an accompanying area for text beneath them. This follows the style of visual novels, and even provides a means to animate or decorate the text as it appears in the below box. It also provides an emote system to allow users to configure different graphics for the various emotive expressions. Most of the emotes additionally have a built in 'emote animation' that occurs when the emote is selected, which can be toggled off globally if undesired.

### Installation For FVTT

Copy https://github.com/League-of-Foundry-Developers/fvtt-module-theatre/releases/download/latest/module.json into the module installer inside foundry when it asks for the manifest.

OR

Download the [zip](https://github.com/League-of-Foundry-Developers/fvtt-module-theatre/releases/download/latest/theatre.zip), create a folder in public/modules called 'theatre' and extract the contents of "theatre.zip" there.

OR

Find Theatre Inserts in the module browser integrated in Foundry VTT

### Key Binds
Theatre inserts now supports keybinds through the keybind API. The default keybinds are as follows (on windows):

- **Add OWNED Actors to Stage**: ALT+ Enter
- **Add SELECTED Tokens to Stage**: Shift + Enter
- **Toggle Narrator Mode**: Control + N
- **Flip Portrait**: ALT+R
- **Nudge Portrait**: Alt + Z/C/S/X
- **Activate Staged Actor Number 1/2/3...**: Control + 1/2/3...
- **Remove Staged Actor Number 1/2/3...**: Control + Alt + 1/2/3...


### Usage

Right-click an Actor in the list, and select "Add to stage." The Character will now appear in the small bar at the bottom of the Chat window.

https://i.imgur.com/0aUQcD9.png

https://i.imgur.com/8KKAY0G.png

Right-Clicking that actor tile will cause the actor's image and name to appear in the bottom-left of the screen. You can apply Emotes to them via the Emote Selector button, just above the chat box. 

While the actor is selected in the small box, anything that is typed into Chat will be written as the Actor, and will also appear below the Actor insert on the left side.

Another button next to chat, the Megaphone, causes a black box to appear in the middle of the screen. Anything that the GM types to chat will appear in this box. This is good for describing a scene.

## For a detailed list of instructions, visit the original Repo by Ken L: https://gitlab.com/Ayanzo/theatre/-/wikis/home/Introduction%20to%20Theatre

### Contributors
The original and immense work is from `Ken L`, Theatre Inserts was then be picked up by `NoahZorbaugh`, and then by `U~Man` who maintained the day to day updates. `Brother Sharp` commissioned on behalf of the Japanese TRPG community the port of the module to Foundry VTT 0.7.7, done by `KaKaRoTo`. Update (0.8.6) by `elizeuangelo`. Latest Update (v9) by  `enso#0361`, Thanks!

The Japanese community will be placing bounties for maintaining theatre inserts through major updates. If you wish to contribute to the cause of keeping this module alive, please consider joining our Patreon. You won't be getting any perks, but your money will be used on this module. (https://www.patreon.com/onsekobo)

Contributions are most welcome, please do one Pull Request per feature.
