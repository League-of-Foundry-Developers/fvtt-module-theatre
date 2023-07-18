# Theatre Configuration

Theatre configuration can be accessed from the actor sheet directly in the header bar.

> Note that **only** the base actor sheets will have the header button for theatre configuration. Token instance sheets **will not** have this option (however they'll still have the stage header button).

The theatre configuration dialog consists of 2 tabs. The Main tab dealing primarily with insert-wide settings, and the emote tab which deals with configuring and managing the various emotes.

## Main Tab

![config-main](/wiki/images/theatre_configuration_1.png)

### Theatre Insert Name/Label

The label to display for the insert when it's active in the theatre dock. By default it is the actor's name, but the user or GM can set a nickname instead here, or a shortened version.

### Top Alignment

This is the alignment mode for the insert. It can either be "top" or "bottom" meaning that that the insert graphic's bottom can either be aligned to the "top" of the dialog-box, or the "bottom" of the dialog box.

> Note that top alignment is recommended for bust or shoulder up head shot images. Bottom is recommended for 3/4th portraits which are knee and and above. Typically the "waist" of the portrait should be even with or a little above the dialog bar when using "bottom" alignment. This way the thigh+legs fade into the text-box below it for a true visual novel feel. Theatre was designed for bottom alignment graphics to produce a true to form visual novel feel, and it is recommended to use such graphics when available.

> Note that "top" aligned inserts can only 'nudge' left and right, they cannot nudge downward like bottom aligned inserts can. This is on purpose to prevent a 'floating' appearance of the portrait, thus it'll keep the portrait flush with the top of the dialog box.

### Base Theatre Insert

This is the base theatre insert graphic to be displayed when the insert is injected into the theatre dock. If none is specified, it'll try to use the actor's image instead.
Emotes Tab

![config-emotes](/wiki/images/theatre_configuration_2.png)

#### **Disable Default Animations**

Option to disable the default animations that are normally applied to all stock emotes.

#### **Various Emotes**

Each emote can have its own backing image, and can even share backing images if desired. Emotes that don't have a backing image will by default use the Base Theatre Insert graphic as configured on the main tab.

#### **Add Custom Emote**

Adds a new custom emote whose name (emote label) + icon (custom smiley graphic) + backing image can all be specified. Custom emotes can also be deleted as well.

> Note that changes are only submitted when the "save changes" button is pressed, so if a custom emote was deleted, or various other changes are desired to be un-done and you don't remember what they were originally, you can just close the theatre configuration window, and re-open it.

