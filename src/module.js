import API from "./scripts/API/api.js";
import KHelpers from "./scripts/KHelpers.js";
import { Theatre } from "./scripts/Theatre.js";
import CONSTANTS from "./scripts/constants/constants.js";
import { registerKeybindings } from "./scripts/settings.js";
import Logger from "./scripts/lib/Logger.js";

/**
 * Concat helper
 */
Handlebars.registerHelper("cat", function (arg1, arg2, hash) {
    let res = String(arg1) + String(arg2);
    return res;
});

/**
 * Given a string representing a property, resolve it as an actual property,
 * this is meant to be used in subexpressions rather than a final target
 */
Handlebars.registerHelper("resprop", function (propPath, hash) {
    let prop = foundry.utils.getProperty(hash.data.root, propPath);
    return prop;
});

/**
 * Hook in on Actorsheet's Header buttons + context menus
 */
Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
    if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
        return;
    }
    const removeLabelSheetHeader = game.settings.get(CONSTANTS.MODULE_ID, "removeLabelSheetHeader");

    let theatreButtons = [];
    if (app.object.isOwner) {
        // only prototype actors
        if (!app.object.token) {
            theatreButtons.push({
                label: removeLabelSheetHeader ? "" : "Theatre.UI.Config.Theatre",
                class: "configure-theatre",
                icon: "fas fa-user-edit",
                onclick: (ev) => Theatre.onConfigureInsert(ev, app.object.sheet),
            });
        }
        theatreButtons.push({
            label: removeLabelSheetHeader
                ? ""
                : Theatre.isActorStaged(app.object)
                  ? "Theatre.UI.Config.RemoveFromStage"
                  : "Theatre.UI.Config.AddToStage",
            class: "add-to-theatre-navbar",
            icon: Theatre.isActorStaged(app.object) ? "fas fa-mask" : "fas fa-theater-masks",
            onclick: (ev) => {
                Theatre.onAddToNavBar(ev, app.object.sheet, removeLabelSheetHeader);
            },
        });
    }
    buttons.unshift(...theatreButtons);
});

/**
 * Sidebar collapse hook
 */
Hooks.on("sidebarCollapse", function (a, collapsed) {
    // If theatre isn't even ready, then just no
    if (!Theatre.instance) {
        return;
    }
    Logger.debug("collapse? : ", a, collapsed);
    let sideBar = document.getElementById("sidebar");
    let primeBar = document.getElementById("theatre-prime-bar");
    let secondBar = document.getElementById("theatre-second-bar");

    if (collapsed) {
        // set width to 100%
        Theatre.instance.theatreBar.style.width = "100%";
        Theatre.instance.theatreNarrator.style.width = "100%";
    } else {
        // set width to sidebar offset size
        Theatre.instance.theatreBar.style.width = `calc(100% - ${sideBar.offsetWidth + 2}px)`;
        Theatre.instance.theatreNarrator.style.width = `calc(100% - ${sideBar.offsetWidth + 2}px)`;
        if (Theatre.instance._getTextBoxes().length == 2) {
            let dualWidth = Math.min(Math.floor(Theatre.instance.theatreBar.offsetWidth / 2), 650);
            primeBar.style.width = dualWidth + "px";
            secondBar.style.width = dualWidth + "px";
            secondBar.style.left = `calc(100% - ${dualWidth}px)`;
        }
    }
    Theatre.instance.theatreEmoteMenu.style.top = `${Theatre.instance.theatreControls.offsetTop - 410}px`;

    if (Theatre.instance.reorderTOId) {
        window.clearTimeout(Theatre.instance.reorderTOId);
    }
    Theatre.instance.reorderTOId = window.setTimeout(() => {
        Theatre.reorderInserts();
        Theatre.instance.reorderTOId = null;
    }, 250);
});

/**
 * Handle combat start
 */
Hooks.on("createCombat", function () {
    // If theatre isn't even ready, then just no
    if (!Theatre.instance) {
        return;
    }
    if (!!game.combats.active && game.combats.active.round == 0 && Theatre.instance.isSuppressed) {
        Logger.debug("COMBAT CREATED");
        // if suppressed, change opacity to 0.05
        //Theatre.instance.theatreGroup.style.opacity = "0.05";
        Theatre.instance.theatreDock.style.opacity = "1";
        Theatre.instance.theatreBar.style.opacity = "1";
        Theatre.instance.theatreNarrator.style.opacity = "1";
    }
});

/**
 * Handle combat end
 */
Hooks.on("deleteCombat", function () {
    // If theatre isn't even ready, then just no
    if (!Theatre.instance) {
        return;
    }
    if (!game.combats.active && Theatre.instance.isSuppressed) {
        Logger.debug("COMBAT DELETED");
        // if suppressed, change opacity to 0.25
        //Theatre.instance.theatreGroup.style.opacity = "0.25";
        Theatre.instance.theatreDock.style.opacity = "0.20";
        Theatre.instance.theatreBar.style.opacity = "0.20";
        Theatre.instance.theatreNarrator.style.opacity = "0.20";
    }
});

/**
 * Pre-process chat message to set 'speaking as' to correspond
 * to our 'speaking as'
 */
Hooks.on("preCreateChatMessage", function (chatMessage, data) {
    let chatData = {
        speaker: {
            //actor: null,
            //The above line is causing issues with chat buttons in v11 in certain systems. Will revert if it causes unforseen issues in other systems.
            scene: data.speaker?.scene,
            flags: {},
        },
    };
    Logger.debug("preCreateChatMessage", chatMessage);
    // If theatre isn't even ready, then just no
    if (!Theatre.instance) {
        return;
    }
    if (chatMessage.rolls.length) {
        return;
    }

    // make the message OOC if needed
    if ($(theatre.theatreChatCover).hasClass("theatre-control-chat-cover-ooc")) {
        const user = game.users.get(chatMessage.user.id);
        chatData.speaker.alias = user.name;
        if (foundry.utils.isNewerVersion(game.version, 12)) {
            chatData.style = CONST.CHAT_MESSAGE_STYLES.OOC;
        } else {
            chatData.type = CONST.CHAT_MESSAGE_TYPES.OOC;
        }

        chatMessage.updateSource(chatData);
        return;
    }

    if (Theatre.instance.speakingAs && Theatre.instance.usersTyping[chatMessage.user.id]) {
        let theatreId = Theatre.instance.usersTyping[chatMessage.user.id].theatreId;
        let insert = Theatre.instance.getInsertById(theatreId);
        let actorId = theatreId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let actor = game.actors.get(actorId) || null;
        Logger.debug("speakingAs %s", theatreId);

        if (insert && chatMessage.speaker) {
            let label = Theatre.instance._getLabelFromInsert(insert);
            let name = label.text;
            let theatreColor = Theatre.instance.getPlayerFlashColor(chatMessage.user.id, insert.textColor);
            Logger.debug("name is %s", name);
            chatData.speaker.alias = name;
            //chatData.flags.theatreColor = theatreColor;
            if (foundry.utils.isNewerVersion(game.version, 12)) {
                chatData.style = CONST.CHAT_MESSAGE_STYLES.IC;
            } else {
                chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
            }
            // if delay emote is active
            if (Theatre.instance.isDelayEmote && Theatre.instance.delayedSentState == 1) {
                Logger.debug("setting emote now! as %s", insert.emote);
                Theatre.instance.delayedSentState = 2;
                Theatre.instance.setUserEmote(game.user._id, theatreId, "emote", insert.emote, false);
                Theatre.instance.delayedSentState = 0;
            }
        } else if (insert) {
            let label = Theatre.instance._getLabelFromInsert(insert);
            let name = label.text;
            let theatreColor = Theatre.instance.getPlayerFlashColor(chatData.user, insert.textColor);
            chatData.speaker.alias = name;
            //chatData.flags.theatreColor = theatreColor;
            if (foundry.utils.isNewerVersion(game.version, 12)) {
                chatData.style = CONST.CHAT_MESSAGE_STYLES.IC;
            } else {
                chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
            }
            // if delay emote is active
            if (Theatre.instance.isDelayEmote && Theatre.instance.delayedSentState == 1) {
                Logger.debug("setting emote now! as %s", insert.emote);
                Theatre.instance.delayedSentState = 2;
                Theatre.instance.setUserEmote(game.user._id, theatreId, "emote", insert.emote, false);
                Theatre.instance.delayedSentState = 0;
            }
        } else if (Theatre.instance.speakingAs == CONSTANTS.NARRATOR) {
            chatData.speaker.alias = game.i18n.localize("Theatre.UI.Chat.Narrator");
            if (foundry.utils.isNewerVersion(game.version, 12)) {
                chatData.style = CONST.CHAT_MESSAGE_STYLES.IC;
            } else {
                chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
            }
        }

        if (!chatData.flags) {
            chatData.flags = {};
        }
        chatData.flags[CONSTANTS.MODULE_ID] = { theatreMessage: true };
    }
    // alter message data
    // append chat emote braces
    Logger.debug("speaker? ", chatMessage.speaker);
    if (
        Theatre.instance.isQuoteAuto &&
        chatMessage.speaker &&
        (chatData.speaker.actor || chatData.speaker.token || chatData.speaker.alias) &&
        !chatMessage.content.match(/\<div.*\>[\s\S]*\<\/div\>/)
    ) {
        const { quoteType } = Theatre.instance.settings;
        const openBracket = game.i18n.localize(`Theatre.Text.OpenBracket.${quoteType}`);
        const closeBracket = game.i18n.localize(`Theatre.Text.CloseBracket.${quoteType}`);

        chatData.content = `${openBracket}${chatMessage.content}${closeBracket}`;
    }
    chatMessage.updateSource(chatData);
});

/**
 * Chat message Binding
 */
Hooks.on("createChatMessage", function (chatEntity, _, userId) {
    Logger.debug("createChatMessage");
    let theatreId = null;

    // If theatre isn't even ready, then just no
    if (!Theatre.instance) {
        return;
    }
    if (Theatre.instance.usersTyping[userId]) {
        theatreId = Theatre.instance.usersTyping[userId].theatreId;
        Theatre.instance.removeUserTyping(userId);
    }

    // slash commands are pass through
    let chatData = chatEntity;
    const isOCC = foundry.utils.isNewerVersion(game.version, 12)
        ? chatData.style === CONST.CHAT_MESSAGE_STYLES.OOC
        : chatData.type === CONST.CHAT_MESSAGE_TYPES.OOC;
    if (
        chatData.content.startsWith("<") || //Bandaid fix so that texts that start with html formatting don't utterly break it
        chatData.content.startsWith("/") ||
        chatData.rolls.length ||
        chatData.emote ||
        isOCC ||
        //|| Object.keys(chatData.speaker).length == 0
        chatData.content.match(/@[a-zA-Z0-9]+\[[a-zA-Z0-9]+\]/) ||
        chatData.content.match(/\<div.*\>[\s\S]*\<\/div\>/)
    ) {
        return;
    }
    let textBox = Theatre.instance.getTextBoxById(theatreId);
    let insert = Theatre.instance.getInsertById(theatreId);
    let charSpans = [];
    let textContent = chatData.content;

    // replace newlines
    textContent = textContent.replace(/<br(| \/)>/g, "\n");
    // convert all html specials to plaintext
    let txtTemp = document.createElement("hiddentext");
    txtTemp.innerHTML = textContent;
    textContent = txtTemp.textContent;
    if (textBox) {
        // kill all tweens
        for (let c of textBox.children) {
            for (let sc of c.children) TweenMax.killTweensOf(sc);
            TweenMax.killTweensOf(c);
        }
        for (let c of textBox.children) c.parentNode.removeChild(c);
        TweenMax.killTweensOf(textBox);
        textBox.style["overflow-y"] = "scroll";
        textBox.style["overflow-x"] = "hidden";

        // Logger.debug("all tweens", TweenMax.getAllTweens());
        textBox.textContent = "";

        if (insert) {
            // Highlight the most recent speaker's textBox
            let lastSpeaking = Theatre.instance.theatreBar.getElementsByClassName("theatre-text-box-lastspeaking");
            if (lastSpeaking[0]) {
                lastSpeaking[0].style.background = "";
                lastSpeaking[0].style["box-shadow"] = "";
                KHelpers.removeClass(lastSpeaking[0], "theatre-text-box-lastspeaking");
            }
            KHelpers.addClass(textBox, "theatre-text-box-lastspeaking");
            Theatre.instance.applyPlayerColorToTextBox(textBox, userId, insert.textColor);
            // Pump up the speaker's render order
            for (let dockInsert of Theatre.instance.portraitDocks) dockInsert.renderOrder = dockInsert.order;
            insert.renderOrder = 999999;
            Theatre.instance.portraitDocks.sort((a, b) => {
                return a.renderOrder - b.renderOrder;
            });
            // Pop our insert a little
            let tweenId = "portraitPop";
            let tween = TweenMax.to(insert.portraitContainer, 0.25, {
                pixi: { scaleX: insert.mirrored ? -1.05 : 1.05, scaleY: 1.05 },
                ease: Power3.easeOut,
                repeat: 1,
                yoyo: true,
                onComplete: function (ctx, imgId, tweenId) {
                    // decrement the rendering accumulator
                    let insert = Theatre.instance.getInsertById(imgId);
                    if (insert) {
                        this.targets()[0].scale.x = insert.mirrored ? -1 : 1;
                        this.targets()[0].scale.y = 1;
                    }
                    ctx._removeDockTween(imgId, this, tweenId);
                    // remove our own reference from the dockContainer tweens
                },
                onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
            });
            Theatre.instance._addDockTween(insert.imgId, tween, tweenId);
            // Color flash
            tweenId = "portraitFlash";
            tween = TweenMax.to(insert.portrait, 0.25, {
                //pixi:{tint: 0xAAEDFF},
                pixi: {
                    tint: Theatre.instance.getPlayerFlashColor(userId, insert.textColor),
                },
                ease: Power3.easeOut,
                repeat: 1,
                yoyo: true,
                onComplete: function (ctx, imgId, tweenId) {
                    // decrement the rendering accumulator
                    this.targets()[0].tint = 0xffffff;
                    ctx._removeDockTween(imgId, this, tweenId);
                    // remove our own reference from the dockContainer tweens
                },
                onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
            });
            Theatre.instance._addDockTween(insert.imgId, tween, tweenId);
        }

        let insertFlyinMode = "typewriter";
        let insertStandingMode = null;
        let insertFontType = null;
        let insertFontSize = null;
        let insertFontColor = null;
        if (insert) {
            insertFlyinMode = insert.textFlyin;
            insertStandingMode = insert.textStanding;
            insertFontType = insert.textFont;
            insertFontSize = Number(insert.textSize);
            insertFontColor = insert.textColor;
        } else if (theatreId == CONSTANTS.NARRATOR) {
            insertFlyinMode = Theatre.instance.theatreNarrator.getAttribute("textflyin");
            insertStandingMode = Theatre.instance.theatreNarrator.getAttribute("textstanding");
            insertFontType = Theatre.instance.theatreNarrator.getAttribute("textfont");
            insertFontSize = Number(Theatre.instance.theatreNarrator.getAttribute("textsize"));
            insertFontColor = Theatre.instance.theatreNarrator.getAttribute("textcolor");
        }
        let fontSize = Number(textBox.getAttribute("osize") || 28);
        // Logger.debug("font PRE(%s): ",insertFontSize,fontSize)
        switch (insertFontSize) {
            case 3:
                fontSize *= 1.5;
                break;
            case 1:
                fontSize *= 0.5;
                break;
            default:
                break;
        }
        Logger.debug("font size is (%s): ", insertFontSize, fontSize);
        // If polyglot is active, and message contains its flag (e.g. not an emote), begin processing
        if (typeof polyglot !== "undefined" && typeof chatData.flags.polyglot !== "undefined") {
            // Get current language being processed
            const lang = chatData.flags.polyglot.language;
            // Fetch the languages known by current user
            const langs = game.polyglot.knownLanguages;
            const understood = langs.has(lang) || game.user.isGM || game.view === "stream";
            if (!understood) {
                // If not understood, scramble the text
                const fontStyle = game.polyglot._getFontStyle(lang);
                fontSize *= Math.floor(Number(fontStyle.slice(0, 3)) / 100);
                insertFontType = fontStyle.slice(5);
                textContent = game.polyglot.scrambleString(textContent, chatData._id, lang);
            }
        }
        Theatre.instance._applyFontFamily(textBox, insertFontType || Theatre.instance.textFont);
        //textBox.style["font-family"] = insertFontType || Theatre.instance.textFont;
        textBox.style.color = insertFontColor || "white";
        textBox.style["font-size"] = `${fontSize}px`;
        textBox.scrollTop = 0;

        charSpans = Theatre.splitTextBoxToChars(textContent, textBox);

        Logger.debug("animating text: " + textContent);

        Theatre.textFlyinAnimation(insertFlyinMode || "typewriter").call(
            this,
            charSpans,
            0.5,
            0.05,
            Theatre.textStandingAnimation(insertStandingMode),
        );

        // auto decay?
        if (insert && insert.decayTOId) {
            window.clearTimeout(insert.decayTOId);
        }
        if (insert && Theatre.instance.settings.autoDecay) {
            insert.decayTOId = window.setTimeout(
                (imgId) => {
                    let insert = Theatre.instance.getInsertById(imgId);
                    if (insert) Theatre.instance.decayTextBoxById(imgId, true);
                },
                Math.max(Theatre.instance.settings.decayRate * charSpans.length, Theatre.instance.settings.decayMin),
                insert.imgId,
            );
        }
    }
});

Hooks.on("renderChatMessage", function (ChatMessage, html, data) {
    if (Theatre.instance.settings.ignoreMessagesToChat && ChatMessage.flags?.[CONSTANTS.MODULE_ID]?.theatreMessage) {
        html[0].style.display = "none";
    }
    return true;
});

Hooks.on("renderChatLog", function (app, html, data) {
    if (data.cssId === "chat-popout") {
        return;
    }
    theatre.initialize();
    if (!window.Theatre) {
        window.Theatre = Theatre;
        window.theatre = theatre;
    }

    // window may not be ready?
    // Logger.log("%cTheatre Inserts", "font-weight: bold; font-size: 30px; font-style: italic; color: black;");
    // NOTE: Closed alpha/beta is currently all rights reserved!
    // Logger.log("%c-- Theatre is Powered by Free Open Source GPLv3 Software --", "font-weight: bold; font-size: 12");
});

/**
 * Add to stage button on ActorDirectory Sidebar
 */
Hooks.on("getActorDirectoryEntryContext", async (html, options) => {
    if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
        return;
    }
    const getActorData = (target) => {
        return game.actors.get(target.data("documentId"));
    };

    options.splice(
        3,
        0,
        {
            name: "Add to Stage",
            condition: (target) => !Theatre.isActorStaged(getActorData(target)),
            icon: '<i class="fas fa-theater-masks"></i>',
            callback: (target) => Theatre.addToNavBar(getActorData(target)),
        },
        {
            name: "Remove from Stage",
            condition: (target) => Theatre.isActorStaged(getActorData(target)),
            icon: '<i class="fas fa-theater-masks"></i>',
            callback: (target) => Theatre.removeFromNavBar(getActorData(target)),
        },
    );
});

// Fixed global singleton/global object
let theatre = null;
Hooks.once("setup", () => {
    theatre = new Theatre();

    game.modules.get(CONSTANTS.MODULE_ID).api = API;

    // module keybinds
    registerKeybindings();
});

/**
 * Hide player list (and macro hotbar) when stage is active (and not suppressed)
 */
Hooks.on("theatreDockActive", (insertCount) => {
    if (!insertCount) {
        return;
    }
    // The "MyTab" module inserts another element with id "pause". Use querySelectorAll to make sure we catch both
    document.querySelectorAll("#pause").forEach((ele) => KHelpers.addClass(ele, "theatre-centered"));



    if (!game.settings.get(CONSTANTS.MODULE_ID, "autoHideBottom")) {
        return;
    }
    if (!theatre.isSuppressed) {
        $("#players").addClass("theatre-invisible");
        $("#hotbar").addClass("theatre-invisible");

        const customSelectors = game.settings.get(CONSTANTS.MODULE_ID, "suppressCustomCss");
        if (customSelectors) {
            const selectors = customSelectors.split(";").map(selector => selector.trim());
            selectors.forEach(selector => {
                $(selector).addClass("theatre-invisible");
            });
        }
    }
});

/**
 * If Argon is active, wrap CombatHudCanvasElement#toggleMacroPlayers to prevent playesr list and macro hotbar from being shown
 */
Hooks.once("ready", () => {
    // Do anything once the module is ready
    if (!game.modules.get("lib-wrapper")?.active && game.user?.isGM) {
        let word = "install and activate";
        if (game.modules.get("lib-wrapper")) word = "activate";
        throw Logger.error(`Requires the 'libWrapper' module. Please ${word} it.`);
    }
    if (!game.modules.get("socketlib")?.active && game.user?.isGM) {
        let word = "install and activate";
        if (game.modules.get("socketlib")) word = "activate";
        throw Logger.error(`Requires the 'socketlib' module. Please ${word} it.`);
    }
    if (!game.settings.get(CONSTANTS.MODULE_ID, "autoHideBottom")) {
        return;
    }
    if (!game.modules.get("enhancedcombathud")?.active) {
        return;
    }
    libWrapper.register(
        CONSTANTS.MODULE_ID,
        "CombatHudCanvasElement.prototype.toggleMacroPlayers",
        (wrapped, togg) => {
            if (togg && theatre?.dockActive) {
                return;
            }
            return wrapped(togg);
        },
        "MIXED",
    );
});

Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(CONSTANTS.MODULE_ID);
});

/**
 * Hide/show macro hotbar when stage is suppressed
 */
Hooks.on("theatreSuppression", (suppressed) => {
    if (!game.settings.get(CONSTANTS.MODULE_ID, "autoHideBottom")) {
        return;
    }
    if (!game.settings.get(CONSTANTS.MODULE_ID, "suppressMacroHotbar")) {
        return;
    }
    if (!theatre.dockActive) {
        return;
    }
    if (suppressed) {
        $("#players").removeClass("theatre-invisible");
        $("#hotbar").removeClass("theatre-invisible");

        const customSelectors = game.settings.get(CONSTANTS.MODULE_ID, "suppressCustomCss");
        if (customSelectors) {
            const selectors = customSelectors.split(";").map(selector => selector.trim());
            selectors.forEach(selector => {
                $(selector).removeClass("theatre-invisible");
            });
        }
    } else {
        $("#players").addClass("theatre-invisible");
        $("#hotbar").addClass("theatre-invisible");

        const customSelectors = game.settings.get(CONSTANTS.MODULE_ID, "suppressCustomCss");
        if (customSelectors) {
            const selectors = customSelectors.split(";").map(selector => selector.trim());
            selectors.forEach(selector => {
                $(selector).addClass("theatre-invisible");
            });
        }
    }
});

Hooks.on("renderPause", () => {
    if (!theatre?.dockActive) {
        return;
    }
    // The "MyTab" module inserts another element with id "pause". Use querySelectorAll to make sure we catch both
    document.querySelectorAll("#pause").forEach((ele) => KHelpers.addClass(ele, "theatre-centered"));
});

/**
 * If an actor changes, update the stage accordingly
 */
Hooks.on("updateActor", (actor, data) => {
    const insert = Theatre.instance.getInsertById(`theatre-${actor.id}`);
    if (!insert) {
        return;
    }
    insert.label.text = Theatre.getActorDisplayName(actor.id);
    Theatre.instance._renderTheatre(performance.now());
});

Hooks.on("getSceneControlButtons", (controls) => {
    // Use CONSTANTS.MODULE_ID, since CONSTANTS.MODULE_ID may not be available yet
    if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
        const suppressTheatreTool = {
            name: "suppressTheatre",
            title: "Theatre.UI.Title.SuppressTheatre",
            icon: "fas fa-theater-masks",
            toggle: true,
            active: false,
            onClick: (toggle) => {
                Theatre.instance.updateSuppression(toggle); // TODO Suppress theatre
            },
            visible: true,
        };
        const tokenControls = controls.find((group) => group.name === "token").tools;
        tokenControls.push(suppressTheatreTool);
    }
});
