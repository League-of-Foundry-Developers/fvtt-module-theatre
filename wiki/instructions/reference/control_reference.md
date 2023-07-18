
# Control Reference

## Theater Text-box

### Double Left Mouse Click

Reset the portrait to its default position and mirror state.

### Left Mouse Drag/Release

Move the portrait around within the 'nudge space'. The 'nudge space' is considered the amount of movement room a portrait can wiggle around in. This is determined by both the 'top alignment' type, as well as the size of the portrait.

> Note that you can 'drag release' left click anywhere, the only constraint for triggering this behavior is starting the drag in the text-box. The entire text-box in this sense behaves as a 'touch pad' of sorts.

> A hard rule is that a portrait _cannot_ be 'nudged' more than half its width either right or left, and no more than half its height downward. A portrait cannot be nudged upwards higher than its natural height, this is intentional to prevent 'floating' bust or half portraits. I'm sure there's a use case where full body inserts are used and this is preferable. However this is not a covered use case. Inserts that have a 'top alignment' cannot be 'nudged' down, only left/right for similar alignment issues; thus preparing insert graphics to be 3/4th bodies to use 'bottom alignment' is preferable.

### Left Mouse Click + SHIFT

Push insert to the front (left), and shift all other inserts.

### Left Mouse Click + CTRL

Decay text immediately.

### Left Mouse Click + ALT

Activate insert as the current speaking insert if the user has control of this actor

### Right Mouse Click

Mirror Portrait.

### Right Mouse Drag / Release [ To another text-box ]

Initiate a move operation to place the the insert of the drag source at the destination position, squeezing it in. Both inserts must be _player controlled_ **and** that the swapping player _is in control_ of insert being moved.

### Right Mouse Drag / Release [ To another text-box ] (while holding SHIFT on release)

Initiate a swap operation to switch the position of the two inserts as long as both inserts are player controlled and that the swapping player is in control of one of the actors.

### Right Mouse Click + SHIFT

Push insert to the back (right), and shift all other inserts.

### Right Mouse Click + CTRL

Remove Insert from the 'theatre dock' (but it remains staged)

### Right Mouse Click + ALT

Stage this insert to the 'staging area' if it is not already there, and the user controls this actor. Useful if re-syncing, or refreshing the page to quickly re-stage inserts you control.

## Theatre Staging Area

### Left Mouse Drag/Release -> Stage Item

Re-position a stage item to be in front of another stage item when released. Useful for re-arranging the stage area if a number of inserts are active.

### Left Mouse Click -> Stage Item

Activate insert, injecting it into the theatre dock as well as setting it as the active speaking insert. The entry direction will always be from the _left_ as the GM or _right_ as a player.

> The exception to this rule is when there are no, or a single insert as position "1" always injects from the left, and position "2" always injects from the right.

Left Mouse Click also toggles already active inserts as the active speaking insert for the user.

### Left Mouse Click + SHIFT -> Stage Item

_Same_ as Left clicking a stage item, except shift will allow a GM to change the injection direction from _left_ to _right_ instead except in the special case outlined above. For players this is indistinguishable from the former as they will always inject from the right.

### Right Mouse Click -> Stage Item

Show insert, injecting it into the theatre dock. The entry direction will always be from the _left_ as the GM or _right_ as a player.

> The exception to this rule is when there are no, or a single insert as position "1" always injects from the left, and position "2" always injects from the right.

Right mouse click also removes inserts from the theater dock (but they remain staged), in this sense it behaves as a toggle.

### Right Mouse Click + SHIFT -> Stage Item

_Same_ as right clicking a stage item, except shift will allow a GM to change the injection direction from _left_ to _right_ instead except in the special case outlined above. For players this is indistinguishable from the former as they will always inject from the right.

## Right Mouse Click + CTRL -> Stage Item

Remove a stage item from the staging area, useful for cleaning up the staging area of actors that won't be active anymore.

# Message Box

The basic message box (where you type all your text) has a 'hidden' binding by pressing the CTRL key at the same time when submitting your message. Doing so will show an "OOC" banner within the message box, and upon submission, the text will be be 'out of character' rather than 'in character', and as a consequence of that, will not be submitted to the insert's text-box, even if that insert is currently configured as 'speaking'.

This control allows a user to switch to OOC chat easily rather than constantly toggling their stage-item, or typing /ooc in chat to prefix their text.
