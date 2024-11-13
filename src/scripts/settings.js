import { Theatre } from "./Theatre.js";
import CONSTANTS from "./constants/constants.js";
import Logger from "./lib/Logger.js";

export const registerSettings = function () {
    let settingsCustom = {};
    // game.settings.registerMenu(CONSTANTS.MODULE_ID, "resetAllSettings", {
    // 	name: `${CONSTANTS.MODULE_ID}.setting.reset.name`,
    // 	hint: `${CONSTANTS.MODULE_ID}.setting.reset.hint`,
    // 	icon: "fas fa-coins",
    // 	type: ResetSettingsDialog,
    // 	restricted: true,
    // });
    // =====================================================================

    game.settings.register(CONSTANTS.MODULE_ID, "gmOnly", {
        name: "Theatre.UI.Settings.gmOnly",
        hint: "Theatre.UI.Settings.gmOnlyHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
        onChange: () => {
            if (!game.user.isGM) {
                location.reload();
            }
        },
    });

    game.settings.register(CONSTANTS.MODULE_ID, "theatreStyle", {
        name: "Theatre.UI.Settings.displayMode",
        hint: "Theatre.UI.Settings.displayModeHint",
        scope: "world",
        config: true,
        default: "textbox",
        type: String,
        choices: {
            textbox: "Theatre.UI.Settings.displayModeTextBox",
            lightbox: "Theatre.UI.Settings.displayModeLightBox",
            clearbox: "Theatre.UI.Settings.displayModeClearBox",
        },
        onChange: (theatreStyle) => {
            Theatre.instance.configTheatreStyle(theatreStyle);
        },
    });

    game.settings.register(CONSTANTS.MODULE_ID, "theatreImageSize", {
        name: "Maximum image height",
        scope: "client",
        config: true,
        default: 400,
        type: Number,
    });

    
    game.settings.register(CONSTANTS.MODULE_ID, "theatreImageUsePercent", {
        name: "Use screen height as maximum image height",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "theatreImageSizePercent", {
        name: "Maximum image height (percent)",
        hint: "Set max image height as a percentage of the device screen height. Used only if the 'Use screen height as maximum image height' is enabled",
        scope: "client",
        config: true,
        default: 0.7,
        type: Number
      });

    game.settings.register(CONSTANTS.MODULE_ID, "theatreImageSizeUniform", {
        name: "Uniform image height",
        hint: "Set all images size to the maximum height",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "theatreNarratorHeight", {
        name: "Theatre.UI.Settings.narrHeight",
        hint: "Theatre.UI.Settings.narrHeightHint",
        scope: "world",
        config: true,
        default: "50%",
        type: String,
        choices: {
            "15%": "15%",
            "25%": "25%",
            "30%": "30%",
            "50%": "50%",
            "70%": "75%",
        },
        onChange: (narrHeight) => {
            settingsCustom.narrHeight = narrHeight;
            if (Theatre.instance.theatreNarrator) {
                Theatre.instance.theatreNarrator.style.top = `calc(${narrHeight} - 50px)`;
            }
        },
    });

    game.settings.register(CONSTANTS.MODULE_ID, "nameFont", {
        name: "Theatre.UI.Settings.nameFont",
        hint: "Theatre.UI.Settings.nameFontHint",
        scope: "world",
        config: true,
        default: Theatre.instance.titleFont,
        type: String,
        choices: Theatre.FONTS.reduce((a, font) => {
            a[font] = font;
            return a;
        }, {}),
    });

    game.settings.register(CONSTANTS.MODULE_ID, "nameFontSize", {
        name: "Theatre.UI.Settings.nameFontSize",
        hint: "Theatre.UI.Settings.nameFontSizeHint",
        scope: "world",
        config: true,
        default: 44,
        type: Number,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "textDecayMin", {
        name: "Theatre.UI.Settings.textDecayMin",
        hint: "Theatre.UI.Settings.textDecayMinHint",
        scope: "world",
        config: true,
        default: 30,
        type: Number,
        onChange: (textDecayMin) => {
            Logger.debug("Text decay minimum set to %s", textDecayMin);
            textDecayMin = Number(textDecayMin);
            if (isNaN(textDecayMin) || textDecayMin <= 0) {
                Logger.info(game.i18n.localize("Theatre.UI.Notification.InvalidDecayMin"), true);
                game.settings.set(CONSTANTS.MODULE_ID, "textDecayMin", 30);
                return;
            }
            if (textDecayMin > 600) {
                Logger.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayMin"), true);
                game.settings.set(CONSTANTS.MODULE_ID, "textDecayMin", 600);
                return;
            }

            settingsCustom.decayMin = textDecayMin * 1000;
        },
    });

    game.settings.register(CONSTANTS.MODULE_ID, "textDecayRate", {
        name: "Theatre.UI.Settings.textDecayRate",
        hint: "Theatre.UI.Settings.textDecayRateHint",
        scope: "world",
        config: true,
        default: 1,
        type: Number,
        onChange: (textDecayRate) => {
            Logger.debug("Text decay rate set to %s", textDecayRate);
            textDecayRate = Number(textDecayRate);
            if (isNaN(textDecayRate) || textDecayRate <= 0) {
                textDecayRate = 1;
                Logger.info(game.i18n.localize("Theatre.UI.Notification.InvalidDecayRate"), true);
                game.settings.set(CONSTANTS.MODULE_ID, "textDecayRate", 1);
                return;
            }
            if (textDecayRate > 10) {
                textDecayRate = 10;
                Logger.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayRate"), true);
                game.settings.set(CONSTANTS.MODULE_ID, "textDecayRate", 10);
                return;
            }
            settingsCustom.decayRate = textDecayRate * 1000;
        },
    });

    /*
  game.settings.register(CONSTANTS.MODULE_ID, "motdNewInfo", {
    name: "MOTD New Info",
    scope: "client",
    default: 0,
    type: Number,
    onChange: (newInfo) => {
      // NOOP
    },
  });
  */

    game.settings.register(CONSTANTS.MODULE_ID, "autoHideBottom", {
        name: "Theatre.UI.Settings.autoHideBottom",
        hint: "Theatre.UI.Settings.autoHideBottomHint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "suppressMacroHotbar", {
        name: "Theatre.UI.Settings.suppressMacroHotbar",
        hint: "Theatre.UI.Settings.suppressMacroHotbarHint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "suppressCustomCss", {
        name: "Hide By CSS Selectors",
        hint: "Hides elements specified by CSS selectors. Multiple selectors should be delimited by a semi-colon (;)",
        scope: "world",
        config: true,
        default: "",
        type: String
    });

    game.settings.register(CONSTANTS.MODULE_ID, "showUIAboveStage", {
        name: "Theatre.UI.Settings.showUIAboveStage",
        hint: "Theatre.UI.Settings.showUIAboveStageHint",
        scope: "world",
        config: true,
        default: "none",
        requiresReload: true,
        type: String,
        choices: {
            none: "Theatre.UI.Settings.showUIAboveStageNone",
            left: "Theatre.UI.Settings.showUIAboveStageLeft",
            middle: "Theatre.UI.Settings.showUIAboveStageMiddle",
            both: "Theatre.UI.Settings.showUIAboveStageBoth",
        },
    });

    game.settings.register(CONSTANTS.MODULE_ID, "removeLabelSheetHeader", {
        name: "Theatre.UI.Settings.removeLabelSheetHeader",
        hint: "Theatre.UI.Settings.removeLabelSheetHeaderHint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "ignoreMessagesToChat", {
        name: "Theatre.UI.Settings.ignoreMessagesToChat",
        hint: "Theatre.UI.Settings.ignoreMessagesToChatHint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: (value) => {
            settingsCustom.ignoreMessagesToChat = value;
        },
    });

    game.settings.register(CONSTANTS.MODULE_ID, "quoteType", {
        name: "Theatre.UI.Settings.quoteType",
        hint: game.i18n.format("Theatre.UI.Settings.quoteTypeHint", {
            setting: game.i18n.localize("Theatre.UI.Title.QuoteToggle"),
        }),
        scope: "world",
        config: true,
        type: Number,
        default: 1,
        choices: {
            0: game.i18n.localize("Theatre.UI.Settings.quoteTypeChoices.0"),
            1: game.i18n.localize("Theatre.UI.Settings.quoteTypeChoices.1"),
            2: game.i18n.localize("Theatre.UI.Settings.quoteTypeChoices.2"),
            3: game.i18n.localize("Theatre.UI.Settings.quoteTypeChoices.3"),
            4: game.i18n.localize("Theatre.UI.Settings.quoteTypeChoices.4"),
        },
        onChange: (value) => {
            settingsCustom.quoteType = value;
        },
    });

    game.settings.register(CONSTANTS.MODULE_ID, "debug", {
        name: `Theatre.UI.Settings.debug`,
        hint: `Theatre.UI.Settings.debugHint`,
        scope: "client",
        config: true,
        default: false,
        type: Boolean,
    });

    // Load in default settings (theatreStyle is loaded on HTML Injection)
    settingsCustom.decayMin = (game.settings.get(CONSTANTS.MODULE_ID, "textDecayMin") || 30) * 1000;
    settingsCustom.decayRate = (game.settings.get(CONSTANTS.MODULE_ID, "textDecayRate") || 1) * 1000;
    //settingsCustom.motdNewInfo = game.settings.get(CONSTANTS.MODULE_ID, "motdNewInfo") || 1;
    settingsCustom.ignoreMessagesToChat = game.settings.get(CONSTANTS.MODULE_ID, "ignoreMessagesToChat");
    settingsCustom.quoteType = game.settings.get(CONSTANTS.MODULE_ID, "quoteType");

    return settingsCustom;
};

class ResetSettingsDialog extends FormApplication {
    constructor(...args) {
        //@ts-ignore
        super(...args);
        //@ts-ignore
        return new Dialog({
            title: game.i18n.localize(`${CONSTANTS.MODULE_ID}.dialogs.resetsettings.title`),
            content:
                '<p style="margin-bottom:1rem;">' +
                game.i18n.localize(`${CONSTANTS.MODULE_ID}.dialogs.resetsettings.content`) +
                "</p>",
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize(`${CONSTANTS.MODULE_ID}.dialogs.resetsettings.confirm`),
                    callback: async () => {
                        const worldSettings = game.settings.storage
                            ?.get("world")
                            ?.filter((setting) => setting.key.startsWith(`${CONSTANTS.MODULE_ID}.`));
                        for (let setting of worldSettings) {
                            console.log(`Reset setting '${setting.key}'`);
                            await setting.delete();
                        }
                        //window.location.reload();
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize(`${CONSTANTS.MODULE_ID}.dialogs.resetsettings.cancel`),
                },
            },
            default: "cancel",
        });
    }

    async _updateObject(event, formData) {
        // do nothing
    }
}

export const registerKeybindings = function () {
    game.keybindings.register(CONSTANTS.MODULE_ID, "unfocusTextArea", {
        name: "Theatre.UI.Keybinds.unfocusTextArea",
        hint: "",
        editable: [
            {
                key: "Escape",
            },
        ],
        onDown: () => {
            if (document.activeElement === document.getElementById("chat-message")) {
                event.preventDefault();
                event.stopPropagation();
                document.getElementById("chat-message").blur();
            }
        },
        restricted: false,
    });

    game.keybindings.register(CONSTANTS.MODULE_ID, "addOwnedToStage", {
        name: "Theatre.UI.Keybinds.addOwnedToStage",
        hint: "",
        editable: [
            {
                key: "Enter",
                modifiers: ["Alt"],
            },
        ],
        onDown: () => {
            const ownedActors = game.actors.filter((a) => a.permission === 3);
            const ownedTokens = ownedActors.map((a) => a.getActiveTokens());
            for (const tokenArray of ownedTokens) tokenArray.forEach((t) => Theatre.addToNavBar(t.actor));
        },
        restricted: false,
    });

    game.keybindings.register(CONSTANTS.MODULE_ID, "addSelectedToStage", {
        name: "Theatre.UI.Keybinds.addSelectedToStage",
        hint: "",
        editable: [
            {
                key: "Enter",
                modifiers: ["Shift"],
            },
        ],
        onDown: () => {
            for (const tkn of canvas.tokens.controlled) Theatre.addToNavBar(tkn.actor);
        },
        restricted: true,
    });

    game.keybindings.register(CONSTANTS.MODULE_ID, `removeSelectedFromStage`, {
        name: "Theatre.UI.Keybinds.removeSelectedFromStage",
        hint: "",
        editable: [],
        onDown: (context) => {
            for (const tkn of canvas.tokens.controlled) Theatre.removeFromNavBar(tkn.actor);
        },
        restricted: true,
    });

    game.keybindings.register(CONSTANTS.MODULE_ID, "narratorMode", {
        name: "Theatre.UI.Keybinds.narratorMode",
        hint: "",
        editable: [
            {
                key: "KeyN",
                modifiers: ["Alt"],
            },
        ],
        onDown: () => {
            const narratorButton = $(document).find(`div.theatre-icon-narrator`).closest(`div.theatre-control-btn`);
            if (KHelpers.hasClass(narratorButton[0], "theatre-control-nav-bar-item-speakingas"))
                Theatre.instance.toggleNarratorBar(false);
            else Theatre.instance.toggleNarratorBar(true);

            document.getElementById("chat-message").blur();
        },
        restricted: true,
    });

    game.keybindings.register(CONSTANTS.MODULE_ID, "flipPortrait", {
        name: "Theatre.UI.Keybinds.flipPortrait",
        hint: "",
        editable: [
            {
                key: "KeyR",
                modifiers: ["Alt"],
            },
        ],
        onDown: () => {
            if (Theatre.instance.speakingAs) Theatre.instance.mirrorInsertById(Theatre.instance.speakingAs);
        },
        restricted: false,
    });

    game.keybindings.register(CONSTANTS.MODULE_ID, "nudgePortraitLeft", {
        name: "Theatre.UI.Keybinds.nudgePortraitLeft",
        hint: "",
        editable: [
            {
                key: "KeyZ",
                modifiers: ["Alt"],
            },
        ],
        onDown: () => {
            const imgId = Theatre.instance.speakingAs;
            if (!imgId) return;

            const insert = Theatre.instance.portraitDocks.find((p) => p.imgId === imgId);
            const oleft = insert.portraitContainer.x,
                otop = insert.portraitContainer.y;
            const tweenId = "portraitMove";
            const tween = TweenMax.to(insert.portraitContainer, 0.5, {
                pixi: { x: oleft - 50, y: otop },
                ease: Power3.easeOut,
                onComplete: function (ctx, imgId, tweenId) {
                    // decrement the rendering accumulator
                    ctx._removeDockTween(imgId, this, tweenId);
                    // remove our own reference from the dockContainer tweens
                },
                onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
            });
            Theatre.instance._addDockTween(insert.imgId, tween, tweenId);

            // send sceneEvent
            Theatre.instance._sendSceneEvent("positionupdate", {
                insertid: insert.imgId,
                position: { x: oleft - 50, y: otop, mirror: insert.mirrored },
            });
        },
        restricted: false,
    });

    game.keybindings.register(CONSTANTS.MODULE_ID, "nudgePortraitRight", {
        name: "Theatre.UI.Keybinds.nudgePortraitRight",
        hint: "",
        editable: [
            {
                key: "KeyC",
                modifiers: ["Alt"],
            },
        ],
        onDown: () => {
            const imgId = Theatre.instance.speakingAs;
            if (!imgId) return;

            const insert = Theatre.instance.portraitDocks.find((p) => p.imgId === imgId);
            const oleft = insert.portraitContainer.x,
                otop = insert.portraitContainer.y;
            const tweenId = "portraitMove";
            const tween = TweenMax.to(insert.portraitContainer, 0.5, {
                pixi: { x: oleft + 50, y: otop },
                ease: Power3.easeOut,
                onComplete: function (ctx, imgId, tweenId) {
                    // decrement the rendering accumulator
                    ctx._removeDockTween(imgId, this, tweenId);
                    // remove our own reference from the dockContainer tweens
                },
                onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
            });
            Theatre.instance._addDockTween(insert.imgId, tween, tweenId);

            // send sceneEvent
            Theatre.instance._sendSceneEvent("positionupdate", {
                insertid: insert.imgId,
                position: { x: oleft + 50, y: otop, mirror: insert.mirrored },
            });
        },
        restricted: false,
    });

    game.keybindings.register(CONSTANTS.MODULE_ID, "nudgePortraitUp", {
        name: "Theatre.UI.Keybinds.nudgePortraitUp",
        hint: "",
        editable: [
            {
                key: "KeyS",
                modifiers: ["Alt"],
            },
        ],
        onDown: () => {
            const imgId = Theatre.instance.speakingAs;
            if (!imgId) return;

            const insert = Theatre.instance.portraitDocks.find((p) => p.imgId === imgId);
            const oleft = insert.portraitContainer.x,
                otop = insert.portraitContainer.y;
            const tweenId = "portraitMove";
            const tween = TweenMax.to(insert.portraitContainer, 0.5, {
                pixi: { x: oleft, y: otop - 50 },
                ease: Power3.easeOut,
                onComplete: function (ctx, imgId, tweenId) {
                    // decrement the rendering accumulator
                    ctx._removeDockTween(imgId, this, tweenId);
                    // remove our own reference from the dockContainer tweens
                },
                onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
            });
            Theatre.instance._addDockTween(insert.imgId, tween, tweenId);

            // send sceneEvent
            Theatre.instance._sendSceneEvent("positionupdate", {
                insertid: insert.imgId,
                position: { x: oleft, y: otop - 50, mirror: insert.mirrored },
            });
        },
        restricted: false,
    });

    game.keybindings.register(CONSTANTS.MODULE_ID, "nudgePortraitDown", {
        name: "Theatre.UI.Keybinds.nudgePortraitDown",
        hint: "",
        editable: [
            {
                key: "KeyX",
                modifiers: ["Alt"],
            },
        ],
        onDown: () => {
            const imgId = Theatre.instance.speakingAs;
            if (!imgId) return;

            const insert = Theatre.instance.portraitDocks.find((p) => p.imgId === imgId);
            const oleft = insert.portraitContainer.x,
                otop = insert.portraitContainer.y;
            const tweenId = "portraitMove";
            const tween = TweenMax.to(insert.portraitContainer, 0.5, {
                pixi: { x: oleft, y: otop + 50 },
                ease: Power3.easeOut,
                onComplete: function (ctx, imgId, tweenId) {
                    // decrement the rendering accumulator
                    ctx._removeDockTween(imgId, this, tweenId);
                    // remove our own reference from the dockContainer tweens
                },
                onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
            });
            Theatre.instance._addDockTween(insert.imgId, tween, tweenId);

            // send sceneEvent
            Theatre.instance._sendSceneEvent("positionupdate", {
                insertid: insert.imgId,
                position: { x: oleft, y: otop + 50, mirror: insert.mirrored },
            });
        },
        restricted: false,
    });

    for (let i = 1; i < 11; i++) {
        game.keybindings.register(CONSTANTS.MODULE_ID, `activateStaged${i}`, {
            name: game.i18n.format(`Theatre.UI.Keybinds.activateStaged`, { number: i }),
            hint: "",
            editable: [
                {
                    key: `Digit${i === 10 ? 0 : i}`,
                    modifiers: ["Control"],
                },
            ],
            onDown: () => {
                const ids = Object.keys(Theatre.instance.stage);
                const id = ids[i - 1];
                if (id) Theatre.instance.activateInsertById(id);

                document.getElementById("chat-message").blur();
            },
            restricted: false,
            reservedModifiers: ["Shift"],
        });

        game.keybindings.register(CONSTANTS.MODULE_ID, `removeStaged${i}`, {
            name: game.i18n.format(`Theatre.UI.Keybinds.removeStaged`, { number: i }),
            hint: "",
            editable: [
                {
                    key: `Digit${i === 10 ? 0 : i}`,
                    modifiers: ["Control", "Alt"],
                },
            ],
            onDown: () => {
                const ids = Object.keys(Theatre.instance.stage);
                const id = ids[i - 1];
                if (id) Theatre.instance.removeInsertById(id);
            },
            restricted: true,
        });
    }
};
