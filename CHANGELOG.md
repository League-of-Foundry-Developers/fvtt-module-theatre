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