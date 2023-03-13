# Theatre Settings

Theatre has several configurable settings, and is accessible via the settings menu in FVTT.

![Theatre settings](/wiki/images/theatre_settings_1.png)

## Theater Bar Display Mode

The display style of the theatre text bar where text appears.

- Text Box mode is the classic FVTT themed black 'bars' that appear. It shows both the left/right dock modes for 1-2 inserts as well as the standard 3+.
- Light Box mode is the Visual Novel setting that shows a singular bar irregardless of the number of inserts active 1+. Given its extra transparency, it's perfect for voice only or voice hybrid games as it focuses mainly on the theatre insert rather than the text.
- Clear Box mode is a style designed for pure voice communication where it's **expected** to have little to no text conversations. It pushes all alignments to the bottom, and makes the entire text-box transparent, only faintly showing it for nudge/position control on hover. Text output to the insert will be difficult to read unless a bold font-family is chosen.

## Narrator Bar Position

The position of the narrator bar as a percent of screen height. The current supported positions are:

- 15%
- 25%
- 30%
- 50%
- 75%

## Minimum Text Decay Time

The minimum time before a text is set to 'decay' away from the text-boxes of inserts

## Text Decay Rate

The _rate_ at which text will decay contingent on the length of the message  _per character_ . This allows "long" messages or paragraph dumps to last longer due to their length. If the message is short however, the minimum decay time will be greater, and text decay will use that instead.
