# Introduction to Theatre

## PLEASE NOTE: Theatre is migrating to a future VTT that is not FVTT which will integrate it as a first class tool with more support and features.

### This was done due to actions taken by the developer of FVTT.

## Introduction

Theatre is at its core is a simple portrait display mechanism to facilitate immersive role-play by utilizing character artwork. It was designed for ease of use to stay 'out of the way' when not needed, and displaying prominently when desired.

_It's Showtime_

#### **Technical Information**

> Theatre works as a soft PIXI overlay atop the existing FVTT map canvas. Unlike the map canvas which can span to large dimensions pending the size of the loaded scene map, Theatre's PIXI canvas only spans the browser viewport, and responds to resizes accordingly. It also, unlike FVTT's map canvas, doesn't tick at 60fps, and it tries to only request animation frames only when it's needed. It however does not perform partial buffer re-renders, thus if even only a single animation is active, it'll require a complete canvas re-render. Fortunately, all the re-rendering is done as efficiently as possible thanks to the PIXI back-end. The major benefit of this is that if there's no active animation, Theatre consumes no animation frame requests to be processor efficient.

> Theatre is also **not exclusive to FVTT**, it will be migrated to a future as of yet unannounced VTT which will feature better integration and features. So what is this trash tier other VTT that's casually mentioned? https://streamable.com/f91nv

## Workflow

Theatre typically works in the following matter:

1. Open actor sheet you want to [stage](/wiki/instructions/reference/terminologies#stage).
2. Click the [stage](/wiki/instructions/reference/terminologies#stage) button in the actor's title bar to add the actor to the [staging-area](/wiki/instructions/reference/terminologies#staging-area).
3. Return to chat tab, and left click the [stage-item](/wiki/instructions/reference/terminologies#stage-item) for the actor on the [staging-area](/wiki/instructions/reference/terminologies#staging-area).
4. Type in the message box and submit a message as that character.

The [control reference](/wiki/instructions/reference/control_reference.md) will have the remaining details on control. It's also useful to see the [terminologies](/wiki/instructions/reference/terminologies.md) that will be used, as they're referenced throughout this documentation. In the event of bug reports, I will also use this terminology, and expect it when reading such bugs.

## Key Points of Functionality to Know

### [The Staging Area](/wiki/instructions/reference/the_staging_area.md)

### [The Emote + Font Selector](/wiki/instructions/reference/emote_and_font_selector.md)

### [The Actor Theatre Configuration](/wiki/instructions/reference/theatre_configuration.md)

### [Sprite Reference](/wiki/instructions/reference/sprite_reference.md)

### [Auxiliary Controls](/wiki/instructions/reference/auxiliary_controls.md)

### [Theatre Settings](/wiki/instructions/reference/theatre_settings.md)

## Suggestions

You have a suggestion for more features? First take a look [here](/wiki/instructions/home/suggestions_and_improvements.md).

## Attribution Notice

All example artwork is provided thanks to 忠藤いづる, you can see more of his artwork, and support him at http://roughsketch.en-grey.com/ . I am eternally thankful for his artwork as it has been instrumental during theatre's entire development process.

![sketch](/wiki/images/sketch.png)
