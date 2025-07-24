import API from "./scripts/API/api.js";
import KHelpers from "./scripts/KHelpers.js";
import { Theatre } from "./scripts/Theatre.js";
import CONSTANTS from "./scripts/constants/constants.js";
import { registerKeybindings } from "./scripts/settings.js";
import Logger from "./scripts/lib/Logger.js";
import { setupSpotlightSearch } from "./scripts/spotlight-integration.js";

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
    if (app.document.isOwner) {
        // Only prototype actors
        if (!app.document.token) {
            theatreButtons.push({
                label: removeLabelSheetHeader ? "" : "Theatre.UI.Config.Theatre",
                class: "configure-theatre",
                icon: "fas fa-user-edit",
                onclick: (ev) => Theatre.onConfigureInsert(ev, app.document.sheet),
            });
        }
        theatreButtons.push({
            label: removeLabelSheetHeader
                ? ""
                : Theatre.isActorStaged(app.document)
                  ? "Theatre.UI.Config.RemoveFromStage"
                  : "Theatre.UI.Config.AddToStage",
            class: "add-to-theatre-navbar",
            icon: Theatre.isActorStaged(app.document) ? "fas fa-mask" : "fas fa-theater-masks",
            onclick: async (ev) => {
                Theatre.onAddToNavBar(ev, app.document.sheet, removeLabelSheetHeader);
                await app.close();
                app.render(true);
            },
        });
    }
    buttons.unshift(...theatreButtons);
});

/**
 * Hook in on ActorsheetV2's Header buttons + context menus
 */
Hooks.on("getHeaderControlsActorSheetV2", (app, buttons) => {
    if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
        return;
    }
    const removeLabelSheetHeader = game.settings.get(CONSTANTS.MODULE_ID, "removeLabelSheetHeader");

    let theatreButtons = [];
    if (app.document.isOwner) {
        // Only prototype actors
        if (!app.document.token) {
            theatreButtons.push({
                action: "configure-theatre",
                label: removeLabelSheetHeader ? "" : "Theatre.UI.Config.Theatre",
                class: "configure-theatre",
                icon: "fas fa-user-edit",
                onClick: (ev) => Theatre.onConfigureInsert(ev, app.document.sheet),
            });
        }
        theatreButtons.push({
            action: "add-to-theatre-navbar",
            label: removeLabelSheetHeader
                ? ""
                : Theatre.isActorStaged(app.document)
                  ? "Theatre.UI.Config.RemoveFromStage"
                  : "Theatre.UI.Config.AddToStage",
            class: "add-to-theatre-navbar",
            icon: Theatre.isActorStaged(app.document) ? "fas fa-mask" : "fas fa-theater-masks",
            onClick: async (ev) => {
                Theatre.onAddToNavBar(ev, app.document.sheet, removeLabelSheetHeader);
                await app.close();
                app.render(true);
            },
        });
    }
    buttons.unshift(...theatreButtons);
});

/**
 * Sidebar collapse hook
 */
Hooks.on("collapseSidebar", function (a, collapsed) {
    Theatre.resizeBars(collapsed);
});

/**
 * A hook event that fires when the chat input element is adopted by a different DOM element
 */
Hooks.on("renderChatInput", () => {
    const chatMessage = document.getElementById("chat-message");
    const isChatOutsideChatLog = chatMessage.parentElement.id === "chat-notifications";
    // The chat can change position depending on the sidebar state
    if (!isChatOutsideChatLog) {
        const parentChatMessage = $("#chat-message").parent();
        $(".theatre-control-group").insertBefore(parentChatMessage.children(".chat-controls"));
        $(".theatre-control-button-bar").insertBefore("#chat-message");
        $(".theatre-control-chat-cover").addClass("theatre-control-chat-cover-inside");
        $(".theatre-control-chat-cover").addClass("theatre-control-chat-cover-focus");
        if (parentChatMessage.parent().attr("id") === "chat") {
            $(".theatre-emote-menu").css("position", "absolute");
        } else {
            // Needed to show the emote menu in the chat popout when there are no messages
            $(".theatre-emote-menu").css("position", "initial");
        }
    } else {
        $(".theatre-control-group").insertBefore("#chat-message");
        $(".theatre-control-button-bar").insertBefore("#chat-message");
        $(".theatre-control-chat-cover").removeClass("theatre-control-chat-cover-inside");
        $(".theatre-control-chat-cover").removeClass("theatre-control-chat-cover-focus");
        // Needed to move the emote menu when the textarea expands
        $(".theatre-emote-menu").css("position", "initial");
    }
    $(".theatre-control-chat-cover-wrapper").insertBefore("#chat-message");
    $(".theatre-emote-menu").insertBefore(".theatre-control-group");

    Theatre.resizeBars(ui.sidebar._collapsed);
});

/**
 * Handle combat start
 */
Hooks.on("createCombat", function () {
    // If theatre isn't even ready, then just no
    if (!Theatre.instance) {
        return;
    }
    if (Theatre.instance.isSuppressed) {
        Logger.debug("COMBAT CREATED");
        // If suppressed, change opacity to 0.05
        Theatre.instance.theatreDock.style.opacity = "0.05";
        Theatre.instance.theatreBar.style.opacity = "0.05";
        Theatre.instance.theatreNarrator.style.opacity = "0.05";
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
    if (!game.combats.size && Theatre.instance.isSuppressed) {
        Logger.debug("COMBAT DELETED");
        // If suppressed, change opacity to 0.20
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
            // Actor: null,
            // The above line is causing issues with chat buttons in v11 in certain systems. Will revert if it causes unforseen issues in other systems.
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

    // Make the message OOC if needed
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
            // ChatData.flags.theatreColor = theatreColor;
            if (foundry.utils.isNewerVersion(game.version, 12)) {
                chatData.style = CONST.CHAT_MESSAGE_STYLES.IC;
            } else {
                chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
            }
            // If delay emote is active
            if (Theatre.instance.isDelayEmote && Theatre.instance.delayedSentState === 1) {
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
            // ChatData.flags.theatreColor = theatreColor;
            if (foundry.utils.isNewerVersion(game.version, 12)) {
                chatData.style = CONST.CHAT_MESSAGE_STYLES.IC;
            } else {
                chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
            }
            // If delay emote is active
            if (Theatre.instance.isDelayEmote && Theatre.instance.delayedSentState === 1) {
                Logger.debug("setting emote now! as %s", insert.emote);
                Theatre.instance.delayedSentState = 2;
                Theatre.instance.setUserEmote(game.user._id, theatreId, "emote", insert.emote, false);
                Theatre.instance.delayedSentState = 0;
            }
        } else if (Theatre.instance.speakingAs === CONSTANTS.NARRATOR) {
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
    // Alter message data
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

    // Slash commands are pass through
    let chatData = chatEntity;
    const isOCC = foundry.utils.isNewerVersion(game.version, 12)
        ? chatData.style === CONST.CHAT_MESSAGE_STYLES.OOC
        : chatData.type === CONST.CHAT_MESSAGE_TYPES.OOC;
    if (
        chatData.content.startsWith("<") || // Bandaid fix so that texts that start with html formatting don't utterly break it
        chatData.content.startsWith("/") ||
        chatData.rolls.length ||
        chatData.emote ||
        isOCC ||
        // || Object.keys(chatData.speaker).length == 0
        chatData.content.match(/@[a-zA-Z0-9]+\[[a-zA-Z0-9]+\]/) ||
        chatData.content.match(/\<div.*\>[\s\S]*\<\/div\>/)
    ) {
        return;
    }
    let textBox = Theatre.instance.getTextBoxById(theatreId);
    let insert = Theatre.instance.getInsertById(theatreId);
    let charSpans = [];
    let textContent = chatData.content;

    // Replace newlines
    textContent = textContent.replace(/<br(| \/)>/g, "\n");
    // Convert all html specials to plaintext
    let txtTemp = document.createElement("hiddentext");
    txtTemp.innerHTML = textContent;
    textContent = txtTemp.textContent;
    if (textBox) {
        // Kill all tweens
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
                    // Decrement the rendering accumulator
                    let insert = Theatre.instance.getInsertById(imgId);
                    if (insert) {
                        this.targets()[0].scale.x = insert.mirrored ? -1 : 1;
                        this.targets()[0].scale.y = 1;
                    }
                    ctx._removeDockTween(imgId, this, tweenId);
                    // Remove our own reference from the dockContainer tweens
                },
                onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
            });
            Theatre.instance._addDockTween(insert.imgId, tween, tweenId);
            // Color flash
            tweenId = "portraitFlash";
            tween = TweenMax.to(insert.portrait, 0.25, {
                // Pixi:{tint: 0xAAEDFF},
                pixi: {
                    tint: Theatre.instance.getPlayerFlashColor(userId, insert.textColor),
                },
                ease: Power3.easeOut,
                repeat: 1,
                yoyo: true,
                onComplete: function (ctx, imgId, tweenId) {
                    // Decrement the rendering accumulator
                    this.targets()[0].tint = 0xffffff;
                    ctx._removeDockTween(imgId, this, tweenId);
                    // Remove our own reference from the dockContainer tweens
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
        } else if (theatreId === CONSTANTS.NARRATOR) {
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
        // TextBox.style["font-family"] = insertFontType || Theatre.instance.textFont;
        textBox.style.color = insertFontColor || "white";
        textBox.style["font-size"] = `${fontSize}px`;
        textBox.scrollTop = 0;

        charSpans = Theatre.splitTextBoxToChars(textContent, textBox);

        Logger.debug(`animating text: ${textContent}`);

        Theatre.textFlyinAnimation(insertFlyinMode || "typewriter").call(
            this,
            charSpans,
            0.5,
            0.05,
            Theatre.textStandingAnimation(insertStandingMode),
        );

        // Auto decay?
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
    if (
        game.settings.get(CONSTANTS.MODULE_ID, "ignoreMessagesToChat") &&
        ChatMessage.flags?.[CONSTANTS.MODULE_ID]?.theatreMessage
    ) {
        html[0].style.display = "none";
    }
    return true;
});

Hooks.on("renderChatLog", function (app, html, data) {
    // If the user pops out the chat input, we don't want to reinitialize the theatre
    if (app.id === "chat-popout") {
        return;
    }
    theatre.initialize();
    if (!window.Theatre) {
        window.Theatre = Theatre;
        window.theatre = theatre;
    }
});

/**
 * Add to stage button on ActorDirectory Sidebar
 */
Hooks.on("getActorContextOptions", async (app, menuItems) => {
    if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
        return;
    }
    const getActorData = (target) => {
        return game.actors.get($(target).data("entry-id"));
    };

    menuItems.splice(
        3,
        0,
        {
            name: "Theatre.UI.Config.AddToStage",
            condition: (target) => !Theatre.isActorStaged(getActorData(target)),
            icon: '<i class="fas fa-theater-masks"></i>',
            callback: (target) => Theatre.addToNavBar(getActorData(target)),
        },
        {
            name: "Theatre.UI.Config.RemoveFromStage",
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

    // Module keybinds
    registerKeybindings();
});

/**
 * Hide player list (and macro hotbar) when stage is active (and not suppressed)
 */
Hooks.on("theatreDockActive", (insertCount) => {
    if (!insertCount) {
        return;
    }

    if (!game.settings.get(CONSTANTS.MODULE_ID, "autoHideBottom")) {
        return;
    }
    if (!theatre.isSuppressed) {
        $("#players").addClass("theatre-invisible");
        $("#hotbar").addClass("theatre-invisible");

        const customSelectors = game.settings.get(CONSTANTS.MODULE_ID, "suppressCustomCss");
        if (customSelectors) {
            const selectors = customSelectors.split(";").map((selector) => selector.trim());
            selectors.forEach((selector) => {
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
        "ui.ARGON.toggle",
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
            const selectors = customSelectors.split(";").map((selector) => selector.trim());
            selectors.forEach((selector) => {
                $(selector).removeClass("theatre-invisible");
            });
        }
    } else {
        $("#players").addClass("theatre-invisible");
        $("#hotbar").addClass("theatre-invisible");

        const customSelectors = game.settings.get(CONSTANTS.MODULE_ID, "suppressCustomCss");
        if (customSelectors) {
            const selectors = customSelectors.split(";").map((selector) => selector.trim());
            selectors.forEach((selector) => {
                $(selector).addClass("theatre-invisible");
            });
        }
    }
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
            onChange: (event, toggle) => {
                Theatre.instance.updateSuppression(toggle);
            },
            visible: true,
        };
        const tokenControls = controls.tokens.tools;
        tokenControls.suppressTheatre = suppressTheatreTool;
    }
});

Hooks.on("spotlightOmnisearch.indexBuilt", (INDEX) => {
    Logger.debug("Adding Theatre to the spotlight search index");
    setupSpotlightSearch(INDEX);
});
