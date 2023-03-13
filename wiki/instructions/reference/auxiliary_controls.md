
# Auxiliary Controls

## Suppress Theatre

![Suppress Theatre](/wiki/images/auxiliary_controls_1.png)

Drops opacity to 25% when combat is not active for the entire theatre dock, and makes the text-boxes click-through. During combat, this drops to 5% opacity making them practically transparent such that manipulating tokens for tactical positioning is unhindered.

The reason full opacity or transparency wasn't used is to keep the player aware that "something" is happening if the dock is active, and that possibly NPCs or other PCs are still engaging in RP or such.

## Automatic Alias Quotes

![Automatic Alias Quotes](/wiki/images/auxiliary_controls_2.png)

Automatically wraps any message sent while under a character alias in quotation marks dependent on the language used.

> Note that rolls and chat cards containing custom HTML are automatically escaped from this.

## Delay Emote Until Message

![Delay Emote](/wiki/images/auxiliary_controls_3.png)

Delays emote selection choice **and removal/clearing** until after a message is sent for simultaneous emission.

## Narrator Mode

![Narrator Mode](/wiki/images/auxiliary_controls_4.png)

**GM Only** This mode is used as the 'narrator voice', in a 'voice from god' approach via an overlay above all other inserts.

When active, it behaves as a stage item in that it'll take over as the currently 'speaking insert' immediately. In addition, the emote selector will only show text styles as narrator mode does not have any emotes due to it being a purely textual mode.

![Narrator Text modes](/wiki/images/auxiliary_controls_5.png)

Also, text decay settings don't apply to narrator text. Narrator text will remain until either a new narrator text is sent, or narrator mode is toggled off.

> Note that you cannot as GM have both the narrator bar active, and type as an NPC at the same time. These were designed to be discrete operations. You cannot, for example speak as an NPC, put something in the narrator bar, then keep the bar up and talk as another NPC. The moment you select another NPC to speak as, the narrator bar will automatically un-toggle. This is by design and there are no plans to change this.

> Note that Narrator Mode does not save the configured text settings on close like traditional theatre inserts do (which save to their actor data model). It will however keep these settings remembered for the entire session (as in they won't reset when narrator mode is toggled off, but will reset to default next session).

> Note that Narrator Mode was designed for a single GM, when there are multiple GMs, if one GM toggles it, all GMs will enter Narrator Mode. Therefore, Theatre as a whole is designed for a _single GM_, not multiple, nor are there plans to support multiple GMs.

# Resync Theatre

![Resync Theatre](/wiki/images/auxiliary_controls_6.png)

This will **as a player** resync theatre's current state to that of the GM in the event that the player may be out of sync due to severe lag or packet loss.

For a **GM**, this will trigger all connected players to resync their theatre to the state of the GM.
