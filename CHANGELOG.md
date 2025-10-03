### 3.3.0
- Migrate to ApplicationV2 and remove all the deprecation warnings

### 3.2.0
- Add setting to move stage to the top when there are more than 5 actors

### 3.1.0
- Show emote on tooltip
- Support gif files

### 3.0.1
- Add compatibility for Foundry VTT 13.347

### 3.0.0
- Migrate to Foundry VTT 13.X
- Fix issue with Narrator Mode not changing font size


### 2.9.0

- Add integration with socketlib (as optional)
- Add better logger utility
- Add explicit api on the standard path game.modules.get("theatre").api
- Add explicit socket on the standard path game.modules.get("theatre").socket
- Add constanst file for constants (better practices)
- Separate static methods on the theatre class on a separate file for better readibility => TheatreHelpers
- Separate settings game methods on the theatre class on a separate file for better readibility => Settings
- Separate keybings game methods on the theatre class on a separate file for better readibility => Settings
- Update workflow github action with the new bundle option
- Clean up the code
