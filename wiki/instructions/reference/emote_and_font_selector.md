# The Emote + Font Selector

The Emote and Font selector is triggered by activating the 'smiley' icon button, which will spawn a compact menu of options over the sidebar that have 4 distinct sections

![img1](/wiki/images/emote_and_font_selector_1.png)

- [Emote selector](/wiki/instructions/reference/emote_and_font_selector#emote-selector)
- [Font controls](/wiki/instructions/reference/emote_and_font_selector#font-controls)
- [Fly-in Text Animation](/wiki/instructions/reference/emote_and_font_selector#fly-in-text-animation)
- [Standing Text Animation](/wiki/instructions/reference/emote_and_font_selector#standing-text-animation)

Also, all inserts when *removed* from the theatre dock, will save their current emote/text/font settings to the actor from which they are derived. This will allow GMs and Players to set 'themes' for NPCs that they can save for later, without the need to constantly re-apply it for each actor upon re-staging at later sessions.

> A special note to take is that all these 'options' apply to the currently **speaking** insert. If no actor is currently set as **speaking**, then any settings set here are considered the 'default' setting which will automatically _apply_ when a new insert is activated and injected to the dock **If** that actor does not have a saved configuration for that particular setting (ie: if the font color was never changed from white, it may take on the color of the last speaking actor, or narrator). In short, when no insert is toggled as **speaking**, the settings are considered as 'default'. Thus if you want to inject a new insert that does not have any prior saved settings, they'll take on the default. To prevent this, you can first enter 'default' mode by not selecting any actor as a speaker, and toggling off all settings prior to injection via left/right click of the stage item.


## Emote Selector

![img2](/wiki/images/emote_and_font_selector_2.png)

This section of the sub-menu allows one to select the emote to show for a given active insert. It also shows a soft orange hue over an emote if that emote has a configured backing image.

> Note that a backing image is not required for use of an emote, it just means it'll use base image for the actor, that either being the base insert graphic, **or** the actor's portrait. All of the stock emotes have at least a speech bubble for the given emotion, and 3/4ths of them have additional animation graphics which can be disabled if desired in [Theatre Configuration](/wiki/instructions/reference/theatre_configuration.md)

![img3](/wiki/images/emote_and_font_selector_3.png)


In addition, when mousing over an emote, you will see a preview of the emote backing image, or the base insert image if not configured. It crops the image to only show the top 50% centered as that is the assumed location of the face.

## Font Controls

![img4](/wiki/images/emote_and_font_selector_4.png)

This section of the sub-menu allows for various font configurations. These are

- Font family to use
- Font scale size
- Font color

> Note that font 'scale size' only comes in 3 varieties of 'large', 'normal', and 'small'. This is intentional as the font will dynamically scale based on the amount of space there is in the text-box. Thus this is a 'scalar multiplier' where small is 50% smaller than the _current_ size, normal is 100%, and large is 150% of the current size.

> Note that the defaults for font controls are always the 'first' available font (varies based on language), normal size, and white as the color.

> **! Be Aware !** that if you switch languages, if an actor's insert was saved to have a font family that was only available in a different language, the font selection box will appear 'empty'. **This is expected** and it will still work. It shows up as 'empty' because the saved font it's using is unavailable in the current selected language configuration. It'll continue to use that language specific font and appear 'blank' in the selector until the font family is changed

## Fly-in Text Animation

![img5](/wiki/images/emote_and_font_selector_5.png)

This section lets users choose one of the many fly-in animation types. These animations can be previewed by merely hovering over them.

> Note that if no fly-in is selected, it will default to "typewriter"

## Standing Text Animation

![img6](/wiki/images/emote_and_font_selector_6.png)

This section lets users choose one of the many standing text animation types. These animations can be previewed by merely hovering over them. All standing previews will use "typewriter" as their fly-in animations.

> Note that if no standing is selected, it will default to "None"
