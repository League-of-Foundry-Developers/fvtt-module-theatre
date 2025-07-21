import API from "./API/api.js";
import KHelpers from "./KHelpers.js";
import { TheatreActor } from "./TheatreActor.js";
import { TheatreActorConfig } from "./TheatreActorConfig.js";
import CONSTANTS from "./constants/constants.js";
import Logger from "./lib/Logger.js";
import { registerSettings } from "./settings.js";
import { registerSocket, theatreSocket } from "./socket.js";
import { TheatreHelpers } from "./theatre-helpers.js";

/**
 * ============================================================
 * Singleton Theatre
 *
 *
 *
 *
 *
 * ============================================================
 */
export class Theatre {
    // TODO to move in a constants file on next pr...
    // static SOCKET = "module.theatre";
    // static SETTINGS = "theatre";
    // static NARRATOR = "Narrator";
    // static ICONLIB = "modules/theatre/assets/graphics/emotes";

    // static DEBUG = false;

    /**
     * Make singleton and initalize the inner instance object.
     * Return singleton if already created.
     */
    constructor() {
        if (!Theatre.instance) {
            // build theater-wide statics
            Theatre.instance = this;
            Theatre.textStandingAnimation(null);
            Theatre.textFlyinAnimation(null);
            // build theater variables
            // font related
            this.titleFont = "Riffic";
            this.textFont = "SignikaBold";
            this.fontWeight = "bold";
            // position/order related
            this.reorderTOId = null;
            this.swapTarget = null;
            this.dragPoint = null;
            this.dragNavItem = null;
            // toggle related
            this.isNarratorActive = false;
            this.isSuppressed = false;
            this.isQuoteAuto = false;
            this.isDelayEmote = false;
            this.delayedSentState = 0;
            // render related
            this.rendering = false;
            this.renderAnims = 0;
            // global insert state related
            this.speakingAs = null;
            // Map of theatreId to TheatreActor
            this.stage = {};
            this.portraitDocks = [];
            this.userEmotes = {};
            this.usersTyping = {};
            this.userSettings = {};
            this.pixiCTX = null;
            this.pixiToolTipCTX = null;
            this.lastTyping = 0;
            this.resync = {
                type: "any",
                timeoutId: null,
            };
            // configurable settings
            this.settings = {
                autoDecay: true,
                decayRate: 1000,
                decayMin: 30000,
                barStyle: "textbox",
                narrHeight: "50%",
            };
            // Font library
            Theatre.getFonts();
            // FaceAPI
            //this._initFaceAPI();
            // module settings
            this._initModuleSettings();
        }
        return Theatre.instance;
    }

    functions = {
        addToNavBar: (actor) => Theatre.addToNavBar(actor),
        removeFromNavBar: (actor) => Theatre.removeFromNavBar(actor),
        activateStagedByID: (i) => {
            const ids = Object.keys(Theatre.instance.stage);
            Theatre.instance.activateInsertById(ids[i]);
            document.getElementById("chat-message").blur();
        },
        removeFromStagedByID: (i) => {
            const ids = Object.keys(Theatre.instance.stage);
            Theatre.instance.removeInsertById(ids[i]);
        },
    };

    initialize() {
        // inject HTML
        this._injectHTML();
        // socket
        this._initSocket();
        // global listeners
        window.addEventListener("resize", this.handleWindowResize);
        // request a resync if needed
        this._sendResyncRequest("any");
    }

    /**
     * Inject HTML
     *
     * @private
     */
    _injectHTML() {
        /**
         * Theatre Dock + Theatre Bar
         */
        let body = document.getElementsByTagName("body")[0];
        let chatSidebar = document.getElementById("chat");

        this.theatreGroup = document.createElement("div");
        this.theatreDock = this._initTheatreDockCanvas();
        this.theatreToolTip = this._initTheatreToolTip();
        if (!this.theatreDock || !this.theatreToolTip) {
            Logger.error("Theatre encountered a FATAL error during initialization", true);
            Logger.error(game.i18n.localize("Theatre.UI.Notification.Fatal"), true);
            return;
        }

        this.theatreGroup.id = "theatre-group";
        this.theatreDock.id = "theatre-dock";
        this.theatreToolTip.id = "theatre-tooltip";
        this.theatreBar = document.createElement("div");
        this.theatreBar.id = "theatre-bar";
        this.theatreNarrator = document.createElement("div");
        this.theatreNarrator.id = "theatre-narrator";
        //this.theatreError = document.createElement("div");
        //this.theatreError.id = "theatre-error";

        let barContainerPrime = document.createElement("div");
        let barContainerSecond = document.createElement("div");
        barContainerPrime.id = "theatre-prime-bar";
        barContainerSecond.id = "theatre-second-bar";

        let narratorBackdrop = document.createElement("div");
        let narratorContent = document.createElement("div");

        KHelpers.addClass(barContainerPrime, "theatre-bar-left");
        KHelpers.addClass(barContainerSecond, "theatre-bar-right");
        KHelpers.addClass(narratorBackdrop, "theatre-narrator-backdrop");
        KHelpers.addClass(narratorContent, "theatre-narrator-content");
        KHelpers.addClass(narratorContent, "no-scrollbar");
        KHelpers.addClass(this.theatreGroup, "theatre-group");
        KHelpers.addClass(this.theatreDock, "theatre-dock");
        KHelpers.addClass(this.theatreDock, "no-scrollbar");
        KHelpers.addClass(this.theatreBar, "theatre-bar");
        KHelpers.addClass(this.theatreNarrator, "theatre-narrator");

        this.theatreNarrator.appendChild(narratorBackdrop);
        this.theatreNarrator.appendChild(narratorContent);

        this.theatreBar.appendChild(barContainerPrime);
        this.theatreBar.appendChild(barContainerSecond);

        this.theatreGroup.appendChild(this.theatreDock);
        this.theatreGroup.appendChild(this.theatreBar);
        this.theatreGroup.appendChild(this.theatreNarrator);
        this.theatreGroup.appendChild(this.theatreToolTip);

        body.appendChild(this.theatreGroup);
        // set theatreStyle
        this.settings.theatreStyle = game.settings.get(CONSTANTS.MODULE_ID, "theatreStyle");
        this.configTheatreStyle(this.settings.theatreStyle);
        // set narrator height
        this.settings.narrHeight = game.settings.get(CONSTANTS.MODULE_ID, "theatreNarratorHeight");
        this.theatreNarrator.style.top = `calc(${this.settings.narrHeight} - 50px)`;
        // set z-index class for other UI elements
        const uiAbove = game.settings.get(CONSTANTS.MODULE_ID, "showUIAboveStage");
        const leftAbove = uiAbove == "left" || uiAbove == "both";
        if (leftAbove) document.getElementById("ui-left").classList.add("z-higher");
        const middleAbove = uiAbove == "middle" || uiAbove == "both";
        if (middleAbove) document.getElementById("ui-middle").classList.add("z-higher");

        // set dock canvas hard dimensions after CSS has calculated it

        /**
         * Theatre Chat Controls
         */
        let chatControls = document.getElementsByClassName("chat-controls")[0];
        let controlButtons = chatControls.getElementsByClassName("control-buttons")[0];
        let chatForm = document.getElementById("chat-form");
        let chatMessage = document.getElementById("chat-message");

        this.theatreControls = document.createElement("div");
        this.theatreNavBar = document.createElement("div");
        this.theatreChatCover = document.createElement("div");

        if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
            this.theatreControls.style.display = "none";
        }

        const buttons = document.createElement("div");
        let imgCover = document.createElement("img");
        let btnSuppress = document.createElement("div");
        let iconSuppress = document.createElement("div");
        let btnEmote = document.createElement("div");
        let iconEmote = document.createElement("div");
        let btnNarrator;
        let iconNarrator;

        let btnResync = document.createElement("a");
        let iconResync = document.createElement("i");
        let btnQuote = document.createElement("a");
        let iconQuote = document.createElement("i");
        let btnDelayEmote = document.createElement("a");
        let iconDelayEmote = document.createElement("i");

        KHelpers.addClass(this.theatreControls, "theatre-control-group");
        KHelpers.addClass(this.theatreNavBar, "theatre-control-nav-bar");
        KHelpers.addClass(this.theatreNavBar, "no-scrollbar");
        KHelpers.addClass(this.theatreChatCover, "theatre-control-chat-cover");
        KHelpers.addClass(btnSuppress, "theatre-control-btn");
        KHelpers.addClass(iconSuppress, "theatre-icon-suppress");
        KHelpers.addClass(btnEmote, "theatre-control-btn");
        KHelpers.addClass(iconEmote, "theatre-icon-emote");
        KHelpers.addClasses(btnResync, "button ui-control icon");
        KHelpers.addClass(btnResync, "resync-theatre");
        KHelpers.addClass(iconResync, "fas");
        KHelpers.addClass(iconResync, "fa-sync");
        KHelpers.addClasses(btnQuote, "button ui-control icon");
        KHelpers.addClass(iconQuote, "fas");
        KHelpers.addClass(iconQuote, "fa-quote-right");
        KHelpers.addClasses(btnDelayEmote, "button ui-control icon");
        KHelpers.addClass(iconDelayEmote, "fas");
        KHelpers.addClass(iconDelayEmote, "fa-comment-alt");
        KHelpers.addClass(buttons, "theatre-control-button-bar");

        btnEmote.setAttribute("title", game.i18n.localize("Theatre.UI.Title.EmoteSelector"));
        btnSuppress.setAttribute("title", game.i18n.localize("Theatre.UI.Title.SuppressTheatre"));
        btnResync.setAttribute(
            "title",
            game.user.isGM
                ? game.i18n.localize("Theatre.UI.Title.ResyncGM")
                : game.i18n.localize("Theatre.UI.Title.ResyncPlayer"),
        );
        btnQuote.setAttribute("title", game.i18n.localize("Theatre.UI.Title.QuoteToggle"));
        btnDelayEmote.setAttribute("title", game.i18n.localize("Theatre.UI.Title.DelayEmoteToggle"));
        btnEmote.addEventListener("click", this.handleBtnEmoteClick);
        btnSuppress.addEventListener("click", this.handleBtnSuppressClick);
        btnResync.addEventListener("click", this.handleBtnResyncClick);
        btnQuote.addEventListener("click", this.handleBtnQuoteClick);
        btnDelayEmote.addEventListener("click", this.handleBtnDelayEmoteClick);
        this.theatreNavBar.addEventListener("wheel", this.handleNavBarWheel);

        btnEmote.appendChild(iconEmote);
        btnSuppress.appendChild(iconSuppress);
        btnResync.appendChild(iconResync);
        btnQuote.appendChild(iconQuote);
        btnDelayEmote.appendChild(iconDelayEmote);
        this.theatreChatCover.appendChild(imgCover);

        this.theatreControls.appendChild(this.theatreNavBar);

        if (game.user.isGM) {
            btnNarrator = document.createElement("div");
            iconNarrator = document.createElement("div");
            KHelpers.addClass(btnNarrator, "theatre-control-btn");
            KHelpers.addClass(iconNarrator, "theatre-icon-narrator");
            btnNarrator.setAttribute("title", game.i18n.localize("Theatre.UI.Title.Narrator"));
            btnNarrator.appendChild(iconNarrator);
            btnNarrator.addEventListener("click", this.handleBtnNarratorClick);
            this.theatreControls.appendChild(btnNarrator);
        }

        this.theatreControls.appendChild(btnEmote);
        this.theatreControls.appendChild(btnSuppress);

        KHelpers.insertBefore(this.theatreControls, chatMessage);

        const imgWrapper = document.createElement("div");
        KHelpers.addClass(imgWrapper, "theatre-control-chat-cover-wrapper");
        imgWrapper.appendChild(this.theatreChatCover);

        if (game.user.isGM || !game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
            buttons.appendChild(btnDelayEmote);
            buttons.appendChild(btnQuote);
            buttons.appendChild(btnResync);
            KHelpers.insertBefore(buttons, chatMessage);
        }

        KHelpers.insertBefore(imgWrapper, chatMessage);

        // bind listener to chat message
        chatMessage.addEventListener("keydown", this.handleChatMessageKeyDown);
        chatMessage.addEventListener("keyup", this.handleChatMessageKeyUp);
        chatMessage.addEventListener("focusout", this.handleChatMessageFocusOut);

        /*
         * Emote Menu
         */
        this.theatreEmoteMenu = document.createElement("div");
        KHelpers.addClass(this.theatreEmoteMenu, "theatre-emote-menu");
        KHelpers.addClass(this.theatreEmoteMenu, "app");
        KHelpers.insertBefore(this.theatreEmoteMenu, this.theatreControls);

        /**
         * Tooltip
         */
        this.theatreEmoteMenu.addEventListener("mousemove", this.handleEmoteMenuMouseMove);
    }

    /**
     * Init Module Settings
     *
     * @private
     */
    _initModuleSettings() {
        // module settings
        this.settings = foundry.utils.mergeObject(this.settings, registerSettings());
    }

    /**
     * Configure the theatre display mode
     *
     * @param theatreStyle (String) : The theatre Style to apply
     */
    configTheatreStyle(theatreStyle) {
        Logger.debug("SWITCHING THEATRE BAR MODE : %s from %s", theatreStyle, this.settings.theatreStyle);
        let oldStyle = this.settings.theatreStyle;
        let primeBar = document.getElementById("theatre-prime-bar");
        let secondBar = document.getElementById("theatre-second-bar");
        let textBoxes = this._getTextBoxes();
        //
        //let app = Theatre.instance.pixiCTX;
        let dockWidth = this.theatreDock.offsetWidth;
        let dockHeight = this.theatreDock.offsetHeight;

        // clear old style
        switch (oldStyle || "textbox") {
            case "lightbox":
                KHelpers.removeClass(primeBar, "theatre-bar-left");
                KHelpers.removeClass(secondBar, "theatre-bar-right");
                KHelpers.removeClass(primeBar, "theatre-bar-lightleft");
                KHelpers.removeClass(secondBar, "theatre-bar-lightright");
                for (let tb of textBoxes) {
                    KHelpers.removeClass(tb, "theatre-text-box-light");
                    KHelpers.removeClass(tb, "theatre-text-box");
                }
                break;
            case "clearbox":
                KHelpers.removeClass(primeBar, "theatre-bar-left");
                KHelpers.removeClass(secondBar, "theatre-bar-right");
                KHelpers.removeClass(primeBar, "theatre-bar-clearleft");
                KHelpers.removeClass(secondBar, "theatre-bar-clearright");
                for (let tb of textBoxes) {
                    KHelpers.removeClass(tb, "theatre-text-box-clear");
                    KHelpers.removeClass(tb, "theatre-text-box");
                }
                break;
            case "mangabubble":
                KHelpers.removeClass(primeBar, "theatre-bar-left");
                KHelpers.removeClass(secondBar, "theatre-bar-right");
                for (let tb of textBoxes) {
                    KHelpers.removeClass(tb, "theatre-text-box");
                }
                // PLACEHOLDER FOR FUTURE
                break;
            case "textbox":
            default:
                KHelpers.removeClass(primeBar, "theatre-bar-left");
                KHelpers.removeClass(secondBar, "theatre-bar-right");
                for (let tb of textBoxes) KHelpers.removeClass(tb, "theatre-text-box");
                break;
        }

        // apply new style
        switch (theatreStyle) {
            case "lightbox":
                KHelpers.addClass(primeBar, "theatre-bar-lightleft");
                KHelpers.addClass(secondBar, "theatre-bar-lightright");
                this.theatreDock.style.height = "100%";
                this.theatreBar.style.top = "calc(100% - 170px)";
                this.theatreBar.style.height = "170px";
                this.theatreBar.style["border-radius"] = "5px 0px 0px 5px";
                this.theatreBar.style["box-shadow"] = "0 0 40px #000";
                this.theatreBar.style.background =
                    "linear-gradient(transparent, rgba(20,20,20,0.98) 5%,rgba(20,20,20,0.85) 40%, rgba(20,20,20,0.6) 70%, rgba(20,20,20,0.5) 95%)";
                for (let tb of textBoxes) KHelpers.addClass(tb, "theatre-text-box-light");
                break;
            case "clearbox":
                KHelpers.addClass(primeBar, "theatre-bar-clearleft");
                KHelpers.addClass(secondBar, "theatre-bar-clearright");
                this.theatreDock.style.height = "100%";
                this.theatreBar.style.top = "calc(100% - 170px)";
                this.theatreBar.style.height = "170px";
                this.theatreBar.style["border-radius"] = "unset";
                this.theatreBar.style["box-shadow"] = "unset";
                this.theatreBar.style.background = "unset";
                for (let tb of textBoxes) KHelpers.addClass(tb, "theatre-text-box-clear");
                break;
            case "mangabubble":
                // PLACEHOLDER FOR FUTURE
                break;
            case "textbox":
            default:
                KHelpers.addClass(primeBar, "theatre-bar-left");
                KHelpers.addClass(secondBar, "theatre-bar-right");
                this.theatreDock.style.height = "99.5vh";
                this.theatreBar.style.top = "calc(100% - 160px - 0.5vh)";
                this.theatreBar.style.height = "160px";
                this.theatreBar.style["border-radius"] = "unset";
                this.theatreBar.style["box-shadow"] = "unset";
                this.theatreBar.style.background = "unset";
                for (let tb of textBoxes) KHelpers.addClass(tb, "theatre-text-box");
                break;
        }

        this.settings.theatreStyle = theatreStyle;

        // re-render all inserts
        for (let insert of this.portraitDocks) this.renderInsertById(insert.imgId);

        // apply resize adjustments (ev is unused)
        this.handleWindowResize(null);
    }

    /**
     * Socket backup to the module method
     *
     * bind socket receiver for theatre events
     *
     * @private
     */
    _initSocket() {
        // module socket
        Hooks.once("socketlib.ready", registerSocket);
        registerSocket();
        theatreSocket.register("processEvent", (payload) => {
            Logger.debug("Received packet", payload);
            switch (payload.type) {
                case "sceneevent": {
                    this._processSceneEvent(payload.senderId, payload.subtype, payload.data);
                    break;
                }
                case "typingevent": {
                    this._processTypingEvent(payload.senderId, payload.data);
                    break;
                }
                case "resyncevent": {
                    this._processResyncEvent(payload.subtype, payload.senderId, payload.data);
                    break;
                }
                case "reqresync": {
                    this._processResyncRequest(payload.subtype, payload.senderId, payload.data);
                    break;
                }
                default: {
                    Logger.log("UNKNOWN THEATRE EVENT TYPE %s", payload.type, payload);
                    break;
                }
            }
        });
    }

    /**
	 * Send a packet to all clients indicating the event type, and
	 * the data relevant to the event. The caller must specify this
	 * data.
	 *
	 * Scene Event Sub Types
	 *
	 * enterscene : an insert was injected remotely
	 * exitscene : an insert was removed remotely
	 * positionupdate : an insert was moved removely
	 * push : an insert was pushed removely
	 * swap : an insert was swapped remotely
	 * emote : an emote was triggered removely
	 * addtexture : a texture asset was added remotely
	 * addalltextures : a group of textures were added remotely
	 * state : an insert's assets were staged remotely
	 * narrator : the narrator bar was activated remotely
	 * decaytext : an insert's text was decayed remotely
	 * renderinsert : an insert is requesting to be rendered immeidately remotely

	 *
	 * @param eventType (String) : The scene event subtype
	 * @param evenData (Object) : An Object whose properties are needed for
	 *                            the scene event subtype
	 *
	 * @private
	 */
    _sendSceneEvent(eventType, eventData) {
        Logger.debug("Sending Scene state %s with payload: ", eventType, eventData);

        // Do we even need verification? There's no User Input outside of
        // cookie cutter responses
        theatreSocket.executeForEveryone("processEvent", {
            senderId: game.user.id,
            type: "sceneevent",
            subtype: eventType,
            data: eventData,
        });
    }

    /**
     * Send a packet to all clients indicating
     *
     * 1. Which insert we're speaking as, or no longer speaking as
     * 2. Wither or not we're typing currently
     * 3. What typing animations we've chosen
     *
     * @private
     */
    _sendTypingEvent() {
        Logger.debug("Sending Typing Event");

        let insert = this.getInsertById(this.speakingAs);
        let insertEmote = this._getEmoteFromInsert(insert);
        let insertTextFlyin = insert
            ? this._getTextFlyinFromInsert(insert)
            : this.speakingAs == CONSTANTS.NARRATOR
              ? this.theatreNarrator.getAttribute("textflyin")
              : "typewriter";
        let insertTextStanding = insert
            ? this._getTextStandingFromInsert(insert)
            : this.speakingAs == CONSTANTS.NARRATOR
              ? this.theatreNarrator.getAttribute("textstanding")
              : "none";
        let insertTextFont = insert
            ? this._getTextFontFromInsert(insert)
            : this.speakingAs == CONSTANTS.NARRATOR
              ? this.theatreNarrator.getAttribute("textfont")
              : null;
        let insertTextSize = insert
            ? this._getTextSizeFromInsert(insert)
            : this.speakingAs == CONSTANTS.NARRATOR
              ? this.theatreNarrator.getAttribute("textsize")
              : null;
        let insertTextColor = insert
            ? this._getTextColorFromInsert(insert)
            : this.speakingAs == CONSTANTS.NARRATOR
              ? this.theatreNarrator.getAttribute("textcolor")
              : null;

        let emotedata = {
            emote: insertEmote,
            textflyin: insertTextFlyin,
            textstanding: insertTextStanding,
            textfont: insertTextFont,
            textsize: insertTextSize,
            textcolor: insertTextColor,
        };

        theatreSocket.executeForEveryone("processEvent", {
            senderId: game.user.id,
            type: "typingevent",
            data: {
                insertid: this.speakingAs,
                emotions: emotedata,
            },
        });
    }

    /**
     * Someone is asking for a re-sync event, so we broadcast the entire scene
     * state to this target individual
     *
     * @param targetId (String) : The userId whom is requesting a resync event
     *
     * @private
     */
    _sendResyncEvent(targetId) {
        let insertData = this._buildResyncData();
        Logger.debug("Sending RESYNC Event (isGM)%s (to)%s: ", game.user.isGM, targetId, insertData);

        theatreSocket.executeForEveryone("processEvent", {
            senderId: game.user.id,
            type: "resyncevent",
            subtype: game.user.isGM ? "gm" : "player",
            data: {
                targetid: targetId,
                insertdata: insertData,
                narrator: this.isNarratorActive,
            },
        });
    }

    /**
     * Compiles Resync insertdata
     *
     * @return (Array[Object]) : The array of objects that represent an insert's data
     *
     * @private
     */
    _buildResyncData() {
        let insertData = [];
        for (let idx = 0; idx < this.portraitDocks.length; ++idx) {
            let insert = this.portraitDocks[idx];
            let insertEmote = this._getEmoteFromInsert(insert);
            let insertTextFlyin = this._getTextFlyinFromInsert(insert);
            let insertTextStanding = this._getTextStandingFromInsert(insert);
            let insertTextFont = this._getTextFontFromInsert(insert);
            let insertTextSize = this._getTextSizeFromInsert(insert);
            let insertTextColor = this._getTextColorFromInsert(insert);

            let dat = {
                insertid: insert.imgId,
                position: {
                    x: insert.portraitContainer.x /* - insert.portrait.width/2*/,
                    y: insert.portraitContainer.y /* - insert.portrait.height/2*/,
                    mirror: insert.mirrored,
                },
                emotions: {
                    emote: insertEmote,
                    textflyin: insertTextFlyin,
                    textstanding: insertTextStanding,
                    textfont: insertTextFont,
                    textsize: insertTextSize,
                    textcolor: insertTextColor,
                },
                sortidx: insert.order || 0,
            };
            insertData.push(dat);
        }
        insertData.sort((a, b) => {
            return a.sortidx - b.sortidx;
        });
        return insertData;
    }

    /**
     * Send a request for for a Resync Event.
     *
     * Resync Request Types
     *
     * any : sender is asking for a resync packet from anyone
     * gm : sender is asking for a resync packet from a GM
     * players : sender is a GM and is telling all players to resync with them
     *
     * @param type (String) : The type of resync event, can either be "players" or "gm"
     *                        indicating wither it's to resync "all players" or to resync with a gm (any GM)
     * @private
     */
    _sendResyncRequest(type) {
        Logger.debug("Sending RESYNC Request ", type);

        // If there's a GM, request to resync from them
        let data = {};
        if (type == "players" && game.user.isGM) {
            data.insertdata = this._buildResyncData();
            data.narrator = this.isNarratorActive;
        }

        theatreSocket.executeForEveryone("processEvent", {
            senderId: game.user.id,
            type: "reqresync",
            subtype: type || "any",
            data: data,
        });

        if (type != "players") {
            this.resync.type = type;
            this.resync.timeoutId = window.setTimeout(() => {
                Logger.log("RESYNC REQUEST TIMEOUT");
                this.resync.timeoutId = null;
            }, 5000);
        }
    }

    /**
     * Resync rquests can be either :
     *
     * any : sender is asking for a resync packet from anyone
     * gm : sender is asking for a resync packet from a GM
     * players : sender is a GM and is telling all players to resync with them
     *
     * @param type (String) : The type of resync request, can either be "players" or "gm"
     * @param senderId (String) : The userId of the player requesting the resync event
     * @param data (Object) : The data payload of the resync request. If the type is
     *                        "players" then chain process this as a resync event rather
     *                        than a request.
     *
     * @private
     */
    _processResyncRequest(type, senderId, data) {
        Logger.debug("Processing resync request");
        // If the dock is not active, no need to send anything
        if (type == "any" && this.dockActive <= 0 && !this.isNarratorActive) {
            Logger.warn("OUR DOCK IS NOT ACTIVE, Not responding to reqresync");
            return;
        } else if (type == "gm" && !game.user.isGM) {
            return;
        } else if (type == "players") {
            // clear our theatre
            for (let insert of this.portraitDocks) this.removeInsertById(insert.imgId, true);
            // process this as if it were a resyncevent
            this.resync.timeoutId = 1;
            this._processResyncEvent("gm", senderId, {
                targetid: game.user.id,
                insertdata: data.insertdata,
                narrator: data.narrator,
            });
        } else {
            this._sendResyncEvent(senderId);
        }
    }

    /**
     * Process a resync event, and if valid, unload all inserts, prepare assets for inserts to inject,
     * and inject them.
     *
     * @param type (String) : The type of the resync event, can either be "player" or "gm" indicating
     *                        the permission level of the sender (only player or gm atm).
     * @param senderId (String) : The userId of the player whom sent the resync event.
     * @param data (Object) : The data of the resync Event which will contain the
     *                        information of the inserts we need to load in.
     * @private
     */
    _processResyncEvent(type, senderId, data) {
        Logger.debug("Processing resync event %s :", type, data, game.users.get(senderId));
        // if we're resyncing and it's us that's the target
        if (this.resync.timeoutId && (data.targetid == game.user.id || ("gm" == this.resync.type) == type)) {
            // drop all other resync responses, first come, first process
            window.clearTimeout(this.resync.timeoutId);
            this.resync.timeoutId = null;

            // clear our theatre
            for (let insert of this.portraitDocks) this.removeInsertById(insert.imgId, true);

            if (type == "gm") {
                Logger.info(game.i18n.localize("Theatre.UI.Notification.ResyncGM"), true);
            } else {
                Logger.info(
                    game.i18n.localize("Theatre.UI.Notification.ResyncPlayer") + game.users.get(senderId).name,
                    true,
                );
            }
            let theatreId, insert, port, actorId, actor, params;
            let toInject = [];
            for (let dat of data.insertdata) {
                theatreId = dat.insertid;
                actorId = theatreId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
                params = this._getInsertParamsFromActorId(actorId);
                if (!params) continue;

                Logger.debug("params + emotions: ", params, dat.emotions);
                toInject.push({ params: params, emotions: dat.emotions });
            }
            // let the clearing animation complete
            window.setTimeout(async () => {
                // stage all inserts;
                let ids = data.insertdata.map((e) => e.insertid);
                //once all inserts are staged, start our injections
                await this.stageAllInserts(ids);
                // due to the 'dual dock' mode and how it combines, we can't just push the reverse
                // if we want to preserve order
                if (toInject.length >= 2) {
                    await this.injectLeftPortrait(
                        toInject[toInject.length - 2].params.src,
                        toInject[toInject.length - 2].params.name,
                        toInject[toInject.length - 2].params.imgId,
                        toInject[toInject.length - 2].params.optalign,
                        {
                            emote: toInject[toInject.length - 2].emotions.emote,
                            textFlyin: toInject[toInject.length - 2].emotions.textflyin,
                            textStanding: toInject[toInject.length - 2].emotions.textstanding,
                            textFont: toInject[toInject.length - 2].emotions.textfont,
                            textSize: toInject[toInject.length - 2].emotions.textsize,
                            textColor: toInject[toInject.length - 2].emotions.textcolor,
                        },
                        true,
                    );
                    await this.injectLeftPortrait(
                        toInject[toInject.length - 1].params.src,
                        toInject[toInject.length - 1].params.name,
                        toInject[toInject.length - 1].params.imgId,
                        toInject[toInject.length - 1].params.optalign,
                        {
                            emote: toInject[toInject.length - 1].emotions.emote,
                            textFlyin: toInject[toInject.length - 1].emotions.textflyin,
                            textStanding: toInject[toInject.length - 1].emotions.textstanding,
                            textFont: toInject[toInject.length - 1].emotions.textfont,
                            textSize: toInject[toInject.length - 1].emotions.textsize,
                            textColor: toInject[toInject.length - 1].emotions.textcolor,
                        },
                        true,
                    );
                    for (let idx = toInject.length - 3; idx >= 0; --idx)
                        await this.injectLeftPortrait(
                            toInject[idx].params.src,
                            toInject[idx].params.name,
                            toInject[idx].params.imgId,
                            toInject[idx].params.optalign,
                            {
                                emote: toInject[idx].emotions.emote,
                                textFlyin: toInject[idx].emotions.textflyin,
                                textStanding: toInject[idx].emotions.textstanding,
                                textFont: toInject[idx].emotions.textfont,
                                textSize: toInject[idx].emotions.textsize,
                                textColor: toInject[idx].emotions.textcolor,
                            },
                            true,
                        );
                } else if (toInject.length == 1) {
                    await this.injectLeftPortrait(
                        toInject[0].params.src,
                        toInject[0].params.name,
                        toInject[0].params.imgId,
                        toInject[0].params.optalign,
                        {
                            emote: toInject[0].emotions.emote,
                            textFlyin: toInject[0].emotions.textflyin,
                            textStanding: toInject[0].emotions.textstanding,
                            textFont: toInject[0].emotions.textfont,
                            textSize: toInject[0].emotions.textsize,
                            textColor: toInject[0].emotions.textcolor,
                        },
                        true,
                    );
                }
                // finally apply positioning for 3n total run speed
                window.setTimeout(() => {
                    for (let dat of data.insertdata) {
                        insert = this.getInsertById(dat.insertid);
                        //Logger.debug("attempting to apply position to ",insert,dat.insertid,dat);
                        if (insert) {
                            Logger.debug("insert active post resync add, appying position");
                            // apply mirror state
                            /*
							if (Boolean(dat.position.mirror) != insert.mirrored)
								this._mirrorInsert(port,true);
							*/
                            Logger.debug("Mirror ? %s : %s", dat.position.mirror, insert.mirrored);
                            if (Boolean(dat.position.mirror) != insert.mirrored) {
                                Logger.debug("no match!");
                                insert.mirrored = Boolean(dat.position.mirror);
                            }
                            // apply positioning data
                            insert.portraitContainer.scale.x = insert.mirrored ? -1 : 1;
                            insert.portraitContainer.x = dat.position.x;
                            insert.portraitContainer.y = dat.position.y;
                            // apply texyflyin/textstanding data
                            insert.textFlyin = dat.emotions.textflyin;
                            insert.textStanding = dat.emotions.textstanding;
                            insert.textFont = dat.emotions.textfont;
                            insert.textSize = dat.emotions.textsize;
                            insert.textColor = dat.emotions.textcolor;
                        }
                    }
                    // apply Narrator bar last
                    this.toggleNarratorBar(data.narrator);
                }, 1000);
            }, 1600);
        }
    }

    /**
     * Process a scene update payload
     *
     * if we receive an event of the same type that is older
     * than one we've already resceived, notify, and drop it.
     *
     * Scene Events
     *
     * enterscene : an insert was injected remotely
     * exitscene : an insert was removed remotely
     * positionupdate : an insert was moved removely
     * push : an insert was pushed removely
     * swap : an insert was swapped remotely
     * emote : an emote was triggered removely
     * addtexture : a texture asset was added remotely
     * addalltextures : a group of textures were added remotely
     * state : an insert's assets were staged remotely
     * narrator : the narrator bar was activated remotely
     * decaytext : an insert's text was decayed remotely
     * renderinsert : an insert is requesting to be rendered immeidately remotely
     *
     * @params senderId (String) : The userId of the playerId whom sent the scene event
     * @params type (String) : The scene event subtype to process, and is represented in the data object
     * @params data (Object) : An object whose properties contain the relevenat data needed for each scene subtype
     *
     * @private
     */
    async _processSceneEvent(senderId, type, data) {
        Logger.debug("Processing scene event %s", type, data);
        let insert, actorId, params, emote, port, emotions, resName, app, insertEmote, render;

        switch (type) {
            case "enterscene": {
                Logger.debug("enterscene: aid:%s", actorId);
                actorId = data.insertid.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
                params = this._getInsertParamsFromActorId(actorId);
                emotions = data.emotions
                    ? data.emotions
                    : {
                          emote: null,
                          textFlying: null,
                          textStanding: null,
                          textFont: null,
                          textSize: null,
                          textColor: null,
                      };
                if (!params) {
                    return;
                }
                Logger.debug("params: ", params);
                if (data.isleft) {
                    await this.injectLeftPortrait(
                        params.src,
                        params.name,
                        params.imgId,
                        params.optalign,
                        emotions,
                        true,
                    );
                } else {
                    await this.injectRightPortrait(
                        params.src,
                        params.name,
                        params.imgId,
                        params.optalign,
                        emotions,
                        true,
                    );
                }

                break;
            }
            case "exitscene": {
                Logger.debug("exitscene: tid:%s", data.insertid);
                this.removeInsertById(data.insertid, true);
                break;
            }
            case "positionupdate": {
                Logger.debug("positionupdate: tid:%s", data.insertid);
                insert = this.getInsertById(data.insertid);
                if (insert) {
                    // apply mirror state
                    Logger.debug("mirroring desired: %s , current mirror %s", data.position.mirror, insert.mirrored);
                    if (Boolean(data.position.mirror) != insert.mirrored) {
                        insert.mirrored = data.position.mirror;
                    }
                    // apply positioning data
                    //insert.portraitContainer.x = data.position.x;
                    //insert.portraitContainer.y = data.position.y;
                    let tweenId = "portraitMove";
                    let tween = TweenMax.to(insert.portraitContainer, 0.5, {
                        pixi: { scaleX: data.position.mirror ? -1 : 1, x: data.position.x, y: data.position.y },
                        ease: Power3.easeOut,
                        onComplete: function (ctx, imgId, tweenId) {
                            // decrement the rendering accumulator
                            ctx._removeDockTween(imgId, this, tweenId);
                            // remove our own reference from the dockContainer tweens
                        },
                        onCompleteParams: [this, insert.imgId, tweenId],
                    });
                    this._addDockTween(insert.imgId, tween, tweenId);
                }
                break;
            }
            case "push": {
                Logger.debug("insertpush: tid:%s", data.insertid);
                this.pushInsertById(data.insertid, data.tofront, true);
                break;
            }
            case "swap": {
                Logger.debug("insertswap: tid1:%s tid2:%s", data.insertid1, data.insertid2);
                this.swapInsertsById(data.insertid1, data.insertid2, true);
                break;
            }
            case "move": {
                Logger.debug("insertmove: tid1:%s tid2:%s", data.insertid1, data.insertid2);
                this.moveInsertById(data.insertid1, data.insertid2, true);
                break;
            }
            case "emote": {
                Logger.debug("emote:", data);
                emote = data.emotions.emote;
                let textFlyin = data.emotions.textflyin;
                let textStanding = data.emotions.textstanding;
                let textFont = data.emotions.textfont;
                let textSize = data.emotions.textsize;
                let textColor = data.emotions.textcolor;
                this.setUserEmote(senderId, data.insertid, "emote", emote, true);
                this.setUserEmote(senderId, data.insertid, "textflyin", textFlyin, true);
                this.setUserEmote(senderId, data.insertid, "textstanding", textStanding, true);
                this.setUserEmote(senderId, data.insertid, "textfont", textFont, true);
                this.setUserEmote(senderId, data.insertid, "textsize", textSize, true);
                this.setUserEmote(senderId, data.insertid, "textcolor", textColor, true);
                if (data.insertid == this.speakingAs) {
                    this.renderEmoteMenu();
                }
                break;
            }
            case "addtexture": {
                Logger.debug("texturereplace:", data);
                insert = this.getInsertById(data.insertid);
                actorId = data.insertid.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
                params = this._getInsertParamsFromActorId(actorId);
                if (!params) return;

                app = this.pixiCTX;
                insertEmote = this._getEmoteFromInsert(insert);
                render = false;

                if (insertEmote == data.emote) render = true;
                else if (!data.emote) render = true;

                const resources = await this._AddTextureResource(
                    data.imgsrc,
                    data.resname,
                    data.insertid,
                    data.emote,
                    true,
                );
                // if oure emote is active and we're replacing the emote texture, or base is active, and we're replacing the base texture
                Logger.debug("add replacement complete! ", resources[data.resname], insertEmote, data.emote, render);
                if (render && app && insert && insert.dockContainer) {
                    Logger.debug("RE-RENDERING with NEW texture resource %s : %s", data.resname, data.imgsrc);

                    // bubble up dataum from the update
                    insert.optAlign = params.optalign;
                    insert.name = params.name;
                    insert.label.text = params.name;

                    this._clearPortraitContainer(data.insertid);
                    await this._setupPortraitContainer(data.insertid, insert.optAlign, data.resname, resources);
                    // re-attach label + typingBubble
                    insert.dockContainer.addChild(insert.label);
                    insert.dockContainer.addChild(insert.typingBubble);

                    this._repositionInsertElements(insert);

                    if (data.insertid == this.speakingAs);
                    this.renderEmoteMenu();
                    if (!this.rendering) this._renderTheatre(performance.now());
                }
                break;
            }
            case "addalltextures": {
                Logger.debug("textureallreplace:", data);
                insert = this.getInsertById(data.insertid);
                actorId = data.insertid.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
                params = this._getInsertParamsFromActorId(actorId);
                if (!params) return;

                app = this.pixiCTX;
                insertEmote = this._getEmoteFromInsert(insert);
                render = false;

                if (insertEmote == data.emote) render = true;
                else if (!data.emote) render = true;

                const resources = await this._AddAllTextureResources(
                    data.imgsrcs,
                    data.insertid,
                    data.emote,
                    data.eresname,
                    true,
                );
                // if oure emote is active and we're replacing the emote texture, or base is active, and we're replacing the base texture

                Logger.debug("add all textures complete! ", data.emote, data.eresname, params.emotes[data.emote]);
                if (render && app && insert && insert.dockContainer && data.eresname) {
                    Logger.debug("RE-RENDERING with NEW texture resource %s", data.eresname);

                    // bubble up dataum from the update
                    insert.optAlign = params.optalign;
                    insert.name = params.name;
                    insert.label.text = params.name;

                    this._clearPortraitContainer(data.insertid);
                    await this._setupPortraitContainer(data.insertid, insert.optAlign, data.eresname, resources);
                    // re-attach label + typingBubble
                    insert.dockContainer.addChild(insert.label);
                    insert.dockContainer.addChild(insert.typingBubble);

                    this._repositionInsertElements(insert);

                    if (data.insertid == this.speakingAs);
                    this.renderEmoteMenu();
                    if (!this.rendering) this._renderTheatre(performance.now());
                }

                break;
            }
            case "stage": {
                Logger.debug("staging insert", data.insertid);
                this.stageInsertById(data.insertid, true);
                break;
            }
            case "narrator": {
                Logger.debug("toggle narrator bar", data.active);
                this.toggleNarratorBar(data.active, true);
                break;
            }
            case "decaytext": {
                Logger.debug("decay textbox", data.insertid);
                this.decayTextBoxById(data.insertid, true);
                break;
            }
            case "renderinsert": {
                insert = this.getInsertById(data.insertid);
                if (insert) await this.renderInsertById(data.insertid);
                break;
            }
            default: {
                Logger.warn("UNKNOWN SCENE EVENT: %s with data: ", false, type, data);
            }
        }
    }

    /**
     * Merely getting the typing event is the payload, we just refresh the typing timout
     * for the given userId
     */

    /**
     * Process a typing event payload
     *
     * @param userId (String) : The userId of the user that is typing
     * @param data (Object) : The Object payload that contains the typing event data
     *
     * @private
     */
    _processTypingEvent(userId, data) {
        // Possibly other things ?
        this.setUserTyping(userId, data.insertid);
        // emote information is a rider on this event, process it
        let emote = data.emotions.emote;
        let textFlyin = data.emotions.textflyin;
        let textStanding = data.emotions.textstanding;
        let textFont = data.emotions.textfont;
        let textSize = data.emotions.textsize;
        let textColor = data.emotions.textcolor;

        this.setUserEmote(userId, data.insertid, "emote", emote, true);
        this.setUserEmote(userId, data.insertid, "textflyin", textFlyin, true);
        this.setUserEmote(userId, data.insertid, "textstanding", textStanding, true);
        this.setUserEmote(userId, data.insertid, "textfont", textFont, true);
        this.setUserEmote(userId, data.insertid, "textsize", textSize, true);
        this.setUserEmote(userId, data.insertid, "textcolor", textColor, true);
        // if the insertid is our speaking id, update our emote menu
        if (data.insertid == this.speakingAs) this.renderEmoteMenu();
    }

    /**
     * Test wither a user is typing given user id
     *
     * @param userId (String) : The userId of user to check
     */
    isUserTyping(userId) {
        if (!this.usersTyping[userId]) return false;

        return this.usersTyping[userId].timeoutId;
    }

    /**
     * Get the text color given the insert
     *
     * @param insert (Object) : An object represeting an insert
     *
     * @return (String) The text color active for the insert.
     *
     * @private
     */
    _getTextColorFromInsert(insert) {
        if (!insert) return null;
        return insert.textColor;
    }
    /**
     * Get the text size given the insert
     *
     * @param insert (Object) : An object represeting an insert
     *
     * @return (String) The text size active for the insert.
     *
     * @private
     */
    _getTextSizeFromInsert(insert) {
        if (!insert) return null;
        return insert.textSize;
    }
    /**
     * Get the text font given the insert
     *
     * @param insert (Object) : An object represeting an insert
     *
     * @return (String) The text font active for the insert.
     *
     * @private
     */
    _getTextFontFromInsert(insert) {
        if (!insert) return null;
        return insert.textFont;
    }
    /**
     * Get the text fly-in animation given the insert
     *
     * @param insert (Object) : An object represeting an insert
     *
     * @return (String) The text flyin active for the insert.
     *
     * @private
     */
    _getTextFlyinFromInsert(insert) {
        if (!insert) return null;
        return insert.textFlyin;
    }
    /**
     * Get the text standing animation given the insert
     *
     * @param insert (Object) : An object represeting an insert
     *
     * @return (String) The text standing active for the insert.
     *
     * @private
     */
    _getTextStandingFromInsert(insert) {
        if (!insert) return null;
        return insert.textStanding;
    }

    /**
     * Get the insert emote given the insert
     *
     * @param insert (Object) : An object represeting an insert
     *
     * @return (String) The emote active for the insert.
     *
     * @private
     */
    _getEmoteFromInsert(insert) {
        if (!insert) return null;
        if (this.isDelayEmote) return insert.delayedOldEmote;
        return insert.emote;
    }

    /**
     * Get the inserts which are typing based on if their users are typing
     */
    getInsertsTyping() {
        let typing = [];
        for (let userId in this.usersTyping) if (this.usersTyping[userId].theatreId) typing.push(userId);

        return typing;
    }

    /**
     * Set the user emote state, and change the insert if one is active for that
     * user.
     *
     * @param userId (String) : The userId of the user whom triggered the emote state change
     * @param theatreId (String) : The theatreId of the insert that is changing
     * @param subType (String) : The subtype of the emote state that is being changed
     * @param value (String) : The value of the emote state that is being set
     * @param remote (Boolean) : Boolean indicating if this is a remote or local action
     */
    setUserEmote(userId, theatreId, subType, value, remote) {
        if (!this.userEmotes[userId]) this.userEmotes[userId] = {};

        let userEmoting = this.userEmotes[userId];
        let insert = this.getInsertById(theatreId);

        switch (subType) {
            case "textfont":
                if (insert) {
                    if (value) insert.textFont = value;
                    else insert.textFont = null;
                } else if (theatreId == CONSTANTS.NARRATOR) {
                    if (value) this.theatreNarrator.setAttribute("textfont", value);
                    else this.theatreNarrator.removeAttribute("textfont", value);
                } else {
                    userEmoting.textFont = value;
                }
                break;
            case "textsize":
                if (insert) {
                    if (value) insert.textSize = value;
                    else insert.textSize = null;
                } else if (theatreId == CONSTANTS.NARRATOR) {
                    if (value) this.theatreNarrator.setAttribute("textsize", value);
                    else this.theatreNarrator.removeAttribute("textsize", value);
                    userEmoting.textSize = value;
                } else {
                    userEmoting.textSize = value;
                }
                break;
            case "textcolor":
                if (insert) {
                    if (value) insert.textColor = value;
                    else insert.textColor = null;
                } else if (theatreId == CONSTANTS.NARRATOR) {
                    if (value) this.theatreNarrator.setAttribute("textcolor", value);
                    else this.theatreNarrator.removeAttribute("textcolor", value);
                } else {
                    userEmoting.textColor = value;
                }
                break;
            case "textflyin":
                if (insert) {
                    if (value) insert.textFlyin = value;
                    else insert.textFlyin = null;
                } else if (theatreId == CONSTANTS.NARRATOR) {
                    if (value) this.theatreNarrator.setAttribute("textflyin", value);
                    else this.theatreNarrator.removeAttribute("textflyin", value);
                } else {
                    userEmoting.textFlyin = value;
                }
                break;
            case "textstanding":
                if (insert) {
                    if (value) insert.textStanding = value;
                    else insert.textStanding = null;
                } else if (theatreId == CONSTANTS.NARRATOR) {
                    if (value) this.theatreNarrator.setAttribute("textstanding", value);
                    else this.theatreNarrator.removeAttribute("textstanding", value);
                } else {
                    userEmoting.textStanding = value;
                }
                break;
            case "emote":
                // if provided a theatreId, set that insert's emote image + effects
                if (insert) {
                    // if we're delaying our emote, and ths user is us, hold off on setting it
                    if (
                        this.isDelayEmote &&
                        userId == game.user.id &&
                        (this.delayedSentState == 0 || this.delayedSentState == 1)
                    ) {
                        if (this.delayedSentState == 0) {
                            insert.delayedOldEmote = insert.emote;
                            this.delayedSentState = 1;
                        }
                        Logger.debug("DELAYING EMOTE %s, 'showing' %s", value, insert.delayedOldEmote);
                    } else {
                        insert.delayedOldEmote = insert.emote;
                        this.setEmoteForInsertById(value, theatreId, remote);
                    }
                    if (value) insert.emote = value;
                    else insert.emote = null;
                } else {
                    userEmoting.emote = value;
                }
                break;
        }
        // Send to socket
        Logger.debug("SEND EMOTE PACKET %s,%s ??", this.isDelayEmote, this.delayedSentState);
        if (
            !remote &&
            (!this.isDelayEmote || this.delayedSentState == 2) &&
            (insert || theatreId == CONSTANTS.NARRATOR)
        ) {
            Logger.debug("SENDING EMOTE PACKET %s,%s", this.isDelayEmote, this.delayedSentState);
            this._sendSceneEvent("emote", {
                insertid: insert ? insert.imgId : CONSTANTS.NARRATOR,
                emotions: {
                    emote: insert ? this._getEmoteFromInsert(insert) : null,
                    textflyin: insert
                        ? this._getTextFlyinFromInsert(insert)
                        : this.theatreNarrator.getAttribute("textflyin"),
                    textstanding: insert
                        ? this._getTextStandingFromInsert(insert)
                        : this.theatreNarrator.getAttribute("textstanding"),
                    textfont: insert
                        ? this._getTextFontFromInsert(insert)
                        : this.theatreNarrator.getAttribute("textfont"),
                    textsize: insert
                        ? this._getTextSizeFromInsert(insert)
                        : this.theatreNarrator.getAttribute("textsize"),
                    textcolor: insert
                        ? this._getTextColorFromInsert(insert)
                        : this.theatreNarrator.getAttribute("textcolor"),
                },
            });
        }
    }

    /**
     * set the user as typing, and or update the last typed
     *
     * @param userId (String) : The userId of the user that is to be set as 'typing'.
     * @param theatreId (String) : The theatreId the user is 'typing' as.
     */
    setUserTyping(userId, theatreId) {
        if (!this.usersTyping[userId]) this.usersTyping[userId] = {};

        let userTyping = this.usersTyping[userId];
        if (userTyping.timeoutId) window.clearTimeout(userTyping.timeoutId);

        // clear old speakingId if it still exists
        if (theatreId != userTyping.theatreId) {
            let insert = this.getInsertById(userTyping.theatreId);
            // if not destroyed already
            if (insert && insert.portrait) {
                // kill tweens
                // hide
                this._removeDockTween(insert.imgId, null, "typingAppear");
                this._removeDockTween(insert.imgId, null, "typingWiggle");
                this._removeDockTween(insert.imgId, null, "typingBounce");
                // fade away
                let oy = insert.portrait.height - (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);

                // style specific settings
                switch (this.settings.theatreStyle) {
                    case "lightbox":
                        break;
                    case "clearbox":
                        oy += insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight;
                        break;
                    case "mangabubble":
                        break;
                    case "textbox":
                        break;
                    default:
                        break;
                }

                let tweenId = "typingVanish";
                let tween = TweenMax.to(insert.typingBubble, 0.2, {
                    pixi: { scaleX: 0.01, scaleY: 0.01, alpha: 0, y: oy },
                    ease: Power0.easeNone,
                    onComplete: function (ctx, imgId, tweenId) {
                        // decrement the rendering accumulator
                        ctx._removeDockTween(imgId, this, tweenId);
                        this.targets()[0].scale.x = 1;
                        this.targets()[0].scale.y = 1;
                        // remove our own reference from the dockContainer tweens
                    },
                    onCompleteParams: [this, insert.imgId, tweenId],
                });
                this._addDockTween(insert.imgId, tween, tweenId);

                //insert.typingBubble.alpha = 0;
                userTyping.theatreId = null;
            }
        }

        if (theatreId) {
            let insert = this.getInsertById(theatreId);
            // if not destroyed already
            if (insert && insert.portrait && !insert.tweens["typingWiggle"]) {
                // start tweens
                // show
                this._removeDockTween(insert.imgId, null, "typingVanish");

                let tweenId = "typingAppear";
                insert.typingBubble.scale.x = 0.01;
                insert.typingBubble.scale.y = 0.01;
                let tween = TweenMax.to(insert.typingBubble, 0.2, {
                    pixi: { scaleX: 1, scaleY: 1, alpha: 1 },
                    ease: Power0.easeNone,
                    onComplete: function (ctx, imgId, tweenId) {
                        // decrement the rendering accumulator
                        ctx._removeDockTween(imgId, this, tweenId);
                        this.targets()[0].scale.x = 1;
                        this.targets()[0].scale.y = 1;
                        // remove our own reference from the dockContainer tweens
                    },
                    onCompleteParams: [this, insert.imgId, tweenId],
                });
                this._addDockTween(insert.imgId, tween, tweenId);

                tweenId = "typingWiggle";
                insert.typingBubble.rotation = 0.174533;
                tween = TweenMax.to(insert.typingBubble, 0.5, {
                    pixi: { rotation: -10 },
                    ease: Power0.easeNone,
                    repeat: -1,
                    yoyo: true,
                    onComplete: function (ctx, imgId, tweenId) {
                        // decrement the rendering accumulator
                        ctx._removeDockTween(imgId, this, tweenId);
                        // remove our own reference from the dockContainer tweens
                    },
                    onCompleteParams: [this, insert.imgId, tweenId],
                });
                this._addDockTween(insert.imgId, tween, tweenId);

                let oy =
                    insert.portrait.height -
                    (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight) -
                    insert.label.style.lineHeight * 0.75;
                // style specific settings
                switch (this.settings.theatreStyle) {
                    case "clearbox":
                        insert.typingBubble.y = insert.portrait.height;
                        oy += insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight;
                        break;
                    case "mangabubble":
                    case "lightbox":
                    case "textbox":
                    default:
                        insert.typingBubble.y =
                            insert.portrait.height - (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);
                        break;
                }

                tweenId = "typingBounce";
                tween = TweenMax.to(insert.typingBubble, 0.25, {
                    pixi: { y: oy },
                    ease: Power3.easeOut,
                    repeat: -1,
                    yoyo: true,
                    yoyoEase: Power0.easeNone,
                    onComplete: function (ctx, imgId, tweenId) {
                        // decrement the rendering accumulator
                        ctx._removeDockTween(imgId, this, tweenId);
                        this.targets()[0].y = oy;
                        // remove our own reference from the dockContainer tweens
                    },
                    onCompleteParams: [this, insert.imgId, tweenId],
                });
                this._addDockTween(insert.imgId, tween, tweenId);

                //insert.typingBubble.alpha = 1;
                userTyping.theatreId = theatreId;
            } else if (theatreId == CONSTANTS.NARRATOR) {
                userTyping.theatreId = theatreId;
            }
        }

        userTyping.timeoutId = window.setTimeout(() => {
            Logger.debug("%s typing timeout", userId);
            this.removeUserTyping(userId);
        }, 6000);
    }

    /**
     * set the user as no longer typing
     *
     * @param userId (String) : The userId to remove as 'typing'.
     */
    removeUserTyping(userId) {
        Logger.debug("removeUserTyping: ", this.usersTyping[userId]);
        if (!this.usersTyping[userId]) {
            this.usersTyping[userId] = {};
            return;
        }
        if (!this.usersTyping[userId].timeoutId) return;

        if (this.usersTyping[userId].theatreId) {
            let insert = this.getInsertById(this.usersTyping[userId].theatreId);
            // if not destroyed already
            if (insert) {
                // kill tweens
                // hide
                this._removeDockTween(insert.imgId, null, "typingAppear");
                this._removeDockTween(insert.imgId, null, "typingWiggle");
                this._removeDockTween(insert.imgId, null, "typingBounce");
                // fade away
                let oy = insert.portrait.height - (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);
                // style specific settings
                switch (this.settings.theatreStyle) {
                    case "lightbox":
                        break;
                    case "clearbox":
                        oy += insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight;
                        break;
                    case "mangabubble":
                        break;
                    case "textbox":
                        break;
                    default:
                        break;
                }

                let tweenId = "typingVanish";
                let tween = TweenMax.to(insert.typingBubble, 0.2, {
                    pixi: { scaleX: 0.01, scaleY: 0.01, alpha: 0, y: oy },
                    ease: Power0.easeNone,
                    onComplete: function (ctx, imgId, tweenId) {
                        // decrement the rendering accumulator
                        ctx._removeDockTween(imgId, this, tweenId);
                        this.targets()[0].scale.x = 1;
                        this.targets()[0].scale.y = 1;
                        // remove our own reference from the dockContainer tweens
                    },
                    onCompleteParams: [this, insert.imgId, tweenId],
                });
                this._addDockTween(insert.imgId, tween, tweenId);

                //insert.typingBubble.alpha = 0;
            }
        }

        Logger.debug("%s is no longer typing (removed)", userId);
        window.clearTimeout(this.usersTyping[userId].timeoutId);
        this.usersTyping[userId].timeoutId = null;
    }

    /**
     * Pull insert theatre parameters from an actor if possible
     *
     * @param actorId (String) : The actor Id from which to pull theatre insert data from
     *
     * @return (Object) : An object containing the parameters of the insert given the actor Id
     *                     or null.
     * @private
     */
    _getInsertParamsFromActorId(actorId) {
        let actor = game.actors.get(actorId);
        if (!!!actor) {
            Logger.error("ERROR, ACTOR %s DOES NOT EXIST!", true, actorId);
            return null;
        }
        //Logger.debug("getting params from actor: ",actor);

        let theatreId = `theatre-${actor._id}`;
        let portrait = actor.img ? actor.img : CONSTANTS.DEFAULT_PORTRAIT;
        let optAlign = "top";
        let name = Theatre.getActorDisplayName(actor._id);
        let emotes = {};
        let settings = {};

        // Use defaults incase the essential flag attributes are missing
        if (actor.flags.theatre) {
            if (actor.flags.theatre.name && actor.flags.theatre.name != "") name = actor.flags.theatre.name;
            if (actor.flags.theatre.baseinsert && actor.flags.theatre.baseinsert != "")
                portrait = actor.flags.theatre.baseinsert;
            if (actor.flags.theatre.optalign && actor.flags.theatre.optalign != "")
                optAlign = actor.flags.theatre.optalign;
            if (actor.flags.theatre.emotes) emotes = actor.flags.theatre.emotes;
            if (actor.flags.theatre.settings) settings = actor.flags.theatre.settings;
        }

        return {
            src: portrait,
            name: name,
            optalign: optAlign,
            imgId: theatreId,
            emotes: emotes,
            settings: settings,
        };
    }

    /**
     * Determine if the default animations are disabled given a theatreId
     *
     * @param theatreId (String) : The theatreId who's theatre properties to
     *                             test for if the default animations are disabled.
     *
     * @return (Boolean) : True if disabled, false if not, null if the actor
     *                      does not exist
     */
    isDefaultDisabled(theatreId) {
        let actorId = theatreId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let actor = game.actors.get(actorId);

        if (!!!actor) {
            Logger.error("ERROR, ACTOR %s DOES NOT EXIST!", true, actorId);
            return null;
        }

        Logger.debug("isDefaultDisabled ", actor);

        if (actor.flags.theatre && actor.flags.theatre.disabledefault) {
            return true;
        }
        return false;
    }

    /**
     * Given the userId and theatreId, determine of the user is an 'owner'
     *
     * @params userId (String) : The userId of the user to check.
     * @params theatreId (String) : The theatreId of insert to check.
     *
     * @return (Boolean) : True if the userId owns the actor, False otherwise
     *                      including if the actor for the theatreId does not exist.
     */
    isActorOwner(userId, theatreId) {
        let user = game.users.get(userId);
        if (user.isGM) return true;
        let actorId = theatreId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let actor = game.actors.get(actorId);

        if (!!!actor) {
            Logger.error("ERROR, ACTOR %s DOES NOT EXIST!", true, actorId);
            return false;
        }
        if (
            (actor.ownership[userId] && actor.ownership[userId] >= 3) ||
            (actor.ownership["default"] && actor.ownership["default"] >= 3)
        ) {
            return true;
        }
        return false;
    }

    /**
     * Is the theatreId of a player controlled actor?
     *
     * @params theatreId (String) : The theatreId of the insert to checkA
     *
     * @return (Boolean) : True if the insert is player controlled, False otherwise
     */
    isPlayerOwned(theatreId) {
        if (game.user.isGM) return true;
        let actorId = theatreId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let actor = game.actors.get(actorId);
        let user;

        if (!!!actor) {
            Logger.error("ERROR, ACTOR %s DOES NOT EXIST!", true, actorId);
            return;
        }
        for (let perm in actor.ownership) {
            if (perm != "default") {
                user = game.users.get(perm);
                if (!user.isGM) return true;
            } else {
                if (actor.ownership[perm] >= 1) return true;
            }
        }
        return false;
    }

    /**
     * Immediately render this insert if it is active with whatever
     * parameters it has
     *
     * @params id (String) : The theatreId of the insert to render.
     */
    async renderInsertById(id) {
        let insert = this.getInsertById(id);
        let actorId = id.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let resName = CONSTANTS.DEFAULT_PORTRAIT;
        let params = this._getInsertParamsFromActorId(actorId);
        if (!insert || !params) return;

        if (insert.emote && params.emotes[insert.emote].insert && params.emotes[insert.emote].insert != "")
            resName = params.emotes[insert.emote].insert;
        else resName = params.src;

        // bubble up dataum from the update
        insert.optAlign = params.optalign;
        insert.name = params.name;
        insert.label.text = params.name;

        this._clearPortraitContainer(id);
        await this._setupPortraitContainer(id, params.optalign, resName);
        // re attach label + typing bubble
        insert.dockContainer.addChild(insert.label);
        insert.dockContainer.addChild(insert.typingBubble);

        this._repositionInsertElements(insert);

        if (!this.rendering) this._renderTheatre(performance.now());
    }

    /**
     * Initialize the tooltip canvas which renders previews for the emote menu
     *
     * @return (HTMLElement) : The canvas HTMLElement of the PIXI canvas created, or
     *                          null if unsuccessful.
     * @private
     */
    _initTheatreToolTip() {
        let app = new PIXI.Application({ width: 140, height: 140, transparent: true, antialias: true });
        let canvas = app.view;

        if (!canvas) {
            Logger.error("FAILED TO INITILIZE TOOLTIP CANVAS!", true);
            return null;
        }

        let holder = document.createElement("div");
        KHelpers.addClass(holder, "theatre-tooltip");
        KHelpers.addClass(holder, "app");
        holder.appendChild(canvas);

        // turn off ticker
        app.ticker.autoStart = false;
        app.ticker.stop();

        this.pixiToolTipCTX = app;

        // hide
        //holder.style.display = "none";
        holder.style.opacity = 0;

        return holder;
    }

    /**
     * configure the theatre tool tip based on the provided
     * insert, if none is provided, the do nothing
     *
     * @params theatreId (String) : The theatreId of the insert to display in
     *                              the theatre tool tip.
     * @params emote (String) : The emote of the theatreId to get for dispay
     *                          in the theatre tool tip.
     */
    async configureTheatreToolTip(theatreId, emote) {
        if (!theatreId || theatreId == CONSTANTS.NARRATOR) return;

        let actorId = theatreId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let params = this._getInsertParamsFromActorId(actorId);

        if (!params) {
            Logger.error("ERROR actor no longer exists for %s", true, theatreId);
            return;
        }

        let resName =
            emote && params.emotes[emote] && params.emotes[emote].insert ? params.emotes[emote].insert : params.src;

        const texture = await PIXI.Assets.load(resName);

        if (!texture) {
            Logger.error("ERROR could not load texture (for tooltip) %s", true, resName);
            return;
        }

        let app = this.pixiToolTipCTX;

        // clear canvas
        for (let idx = app.stage.children.length - 1; idx >= 0; --idx) {
            let child = app.stage.children[idx];
            child.destroy();
            //app.stage.removeChildAt(idx);
        }

        let sprite = new PIXI.Sprite(texture);
        let portWidth = texture.width;
        let portHeight = texture.height;
        let maxSide = Math.max(portWidth, portHeight);
        let scaledWidth, scaledHeight, ratio;
        if (maxSide == portWidth) {
            // scale portWidth to 200px, assign height as a fraction
            scaledWidth = 140;
            scaledHeight = (portHeight * 140) / portWidth;
            ratio = scaledHeight / portHeight;
            app.stage.width = scaledWidth;
            app.stage.height = scaledHeight;

            app.stage.addChild(sprite);
            app.stage.scale.x = ratio;
            app.stage.scale.y = ratio;
            app.stage.x = 0;
            app.stage.y = 70 - scaledHeight / 2;
        } else {
            // scale portHeight to 200px, assign width as a fraction
            scaledHeight = 140;
            scaledWidth = (portWidth * 140) / portHeight;
            ratio = scaledWidth / portWidth;
            app.stage.width = scaledWidth;
            app.stage.height = scaledHeight;

            app.stage.addChild(sprite);
            app.stage.scale.x = ratio;
            app.stage.scale.y = ratio;
            app.stage.x = 70 - scaledWidth / 2;
            app.stage.y = 0;
        }

        // adjust dockContainer + portraitContainer dimensions to fit the image
        //app.stage.y = portHeight*ratio/2;

        // set sprite initial coordinates + state
        sprite.x = 0;
        sprite.y = 0;

        //Logger.debug("Tooltip Portrait loaded with w:%s h:%s scale:%s",portWidth,portHeight,ratio,sprite);

        // render and show the tooltip
        app.render();
        this.theatreToolTip.style.opacity = 1;
        // face detect
        /*
		faceapi.detectSingleFace(app.view,new faceapi.TinyFaceDetectorOptions()).then((detection)=>{
			Logger."face detected: ", detection);
			if (detection) {
				let box = detection.box;
				Logger.debug("successful preview face detection: ", box);
				let graphics = new PIXI.Graphics();
				graphics.lineStyle (2,0xFFFFFF,1);

				if (maxSide == portWidth) {
					graphics.moveTo(box.x/(ratio*2)+70,box.y/(ratio*2));
					graphics.lineTo(box.x/(ratio*2) + box.width/(ratio*2)+70,box.y/(ratio*2));
					graphics.lineTo(box.x/(ratio*2) + box.width/(ratio*2)+70,box.y/(ratio*2)+box.height/(ratio*2));
					graphics.lineTo(box.x/(ratio*2)+70,box.y/(ratio*2)+box.height/(ratio*2));
					graphics.lineTo(box.x/(ratio*2)+70,box.y/(ratio*2));
				} else {
					graphics.moveTo(box.x/(ratio*2),box.y/(ratio*2)+70);
					graphics.lineTo(box.x/(ratio*2) + box.width/(ratio*2),box.y/(ratio*2)+70);
					graphics.lineTo(box.x/(ratio*2) + box.width/(ratio*2),box.y/(ratio*2)+box.height/(ratio*2)+70);
					graphics.lineTo(box.x/(ratio*2),box.y/(ratio*2)+box.height/(ratio*2)+70);
					graphics.lineTo(box.x/(ratio*2),box.y/(ratio*2)+70);
				}
				app.stage.addChild(graphics);
				app.render();
			} else {
				Logger.error("FAILED TO FIND PREVIEW FACE", false);
			}
			this.theatreToolTip.style.opacity = 1;
		});
		*/
    }

    /**
     * Inititalize Face API
     *
     *
     * @private
     */
    _initFaceAPI() {
        // const MODEL_URL = `modules/${CONSTANTS.MODULE_ID}/weights`;
        const MODEL_URL = `modules/${CONSTANTS.MODULE_ID}/assets/models`;
        faceapi.loadSsdMobilenetv1Model(MODEL_URL);
        faceapi.loadTinyFaceDetectorModel(MODEL_URL);
        faceapi.loadFaceLandmarkModel(MODEL_URL);
        faceapi.loadFaceRecognitionModel(MODEL_URL);
    }

    /**
     * Create the initial dock canvas, future 'portraits'
     * will be PIXI containers whom are sized to the portraits
     * that they contain.
     *
     * @return (HTMLElement) : The canvas HTMLElement of the created PIXI Canvas,
     *                          or null if unsuccessful.
     * @private
     */
    _initTheatreDockCanvas() {
        // get theatreDock, and an initialize the canvas
        // no need to load in any resources as that will be done on a per-diem bases
        // by each container portrait

        let app = new PIXI.Application({
            backgroundAlpha: 0,
            antialias: true,
            width: document.body.offsetWidth,
            resolution: game.settings.get("core", "pixelRatioResolutionScaling") ? window.devicePixelRatio : 1,
        });

        let canvas = app.view;

        if (!canvas) {
            Logger.error("FAILED TO INITILIZE DOCK CANVAS!", true);
            return null;
        }

        this.theatreDock = canvas;
        this.pixiCTX = app;

        // turn off ticker
        app.ticker.autoStart = false;
        app.ticker.stop();

        return canvas;
    }

    /**
     * Our efficient render loop? We want to render only when there's a tween running, if
     * there's no animation handler running, we don't need to request an animation frame
     *
     * We do this by checking for a non-zero accumulator that increments when a handler
     * is added, and decrements when a handler is removed, thus if the accumulator is > 0
     * then there's something to animate, else there's nothing to animate, and thus nothing
     * to render!
     *
     * @params time (Number) : The high resolution time, typically from performace.now() to
     *                         update all current animation sequences within the PIXI context.
     * @private
     */
    _renderTheatre(time) {
        // let the ticker update all its objects
        this.pixiCTX.ticker.update(time);
        // this.pixiCTX.renderer.clear(); // PIXI.v6 does not respect transparency for clear
        for (let insert of this.portraitDocks) {
            if (insert.dockContainer) {
                if (TheatreHelpers._isDebugActive()) {
                    this._updateTheatreDebugInfo(insert);
                }
                // PIXI.v6 The renderer should not clear the canvas on rendering
                this.pixiCTX.renderer.render(insert.dockContainer, { clear: false });
            } else {
                Logger.error("INSERT HAS NO CONTAINER! _renderTheatre : HOT-EJECTING it! ", true, insert);
                this._destroyPortraitDock(insert.imgId);
            }
        }
        if (this.renderAnims > 0) {
            requestAnimationFrame(this._renderTheatre.bind(this));
        } else {
            Logger.debug("RENDERING LOOP STOPPED");
            this.rendering = false;
        }
    }

    /**
     * Add a dock tween animation, and increment our accumulator, start requesting animation frames
     * if we aren't already requesting them
     *
     * @params imgId (String) : The theatreId of the tween that will be receiving it.
     * @params tween (Object TweenMax) : The TweenMax object of the tween to be added.
     * @params tweenId (String) : The tweenId for this tween to be added.
     *
     * @private
     */
    _addDockTween(imgId, tween, tweenId) {
        let insert = this.getInsertById(imgId);
        if (!insert || !insert.dockContainer) {
            // if dockContainer is destroyed, destroy the tween we were trying to add
            Logger.error("Invalid Tween for %s", false, imgId);
            if (tween) tween.kill();
            return;
        }

        // if the tweenId exists, kill that one, and replace with the new
        if (insert.tweens[tweenId]) {
            insert.tweens[tweenId].kill();
            this.renderAnims--;
        }

        if (this.renderAnims > 0) {
            this.renderAnims++;
            insert.tweens[tweenId] = tween;
        } else {
            // if we're somehow negative, bump to 1
            this.renderAnims = 1;
            insert.tweens[tweenId] = tween;

            // Kick renderer if we need to
            if (!this.rendering) {
                Logger.debug("RENDERING LOOP STARTED");
                this.rendering = true;
                this._renderTheatre(performance.now());
            }
        }
    }

    /**
     * Remove a dock tween animation, and decrement our accumulator, if the accumulator <= 0, the render
     * loop will kill itself after the next render. Thus no model updates need be performed
     *
     * @params imgId (String) : The theatreId of the tween that will have it removed.
     * @params tween (Object TweenMax) : The TweenMax object of the tween to be removed.
     * @params tweenId (String) : The tweenId of the tween to be removed.
     *
     * @private
     */
    _removeDockTween(imgId, tween, tweenId) {
        if (tween) tween.kill();

        let insert = this.getInsertById(imgId);
        if (insert) {
            // if the tweenId doesn't exist, do nothing more
            if (!insert.tweens[tweenId]) return;
            if (!tween) insert.tweens[tweenId].kill();
            insert.tweens[tweenId] = null;
            let nTweens = {};
            for (let prop in insert.tweens) {
                if (insert.tweens[prop] != null) nTweens[prop] = insert.tweens[prop];
            }
            // replace after we removed the prop
            insert.tweens = nTweens;
        }

        this.renderAnims--;

        //sanit check
        if (this.renderAnims < 0) {
            Logger.error("ERROR RENDER ANIM < 0 from %s of %s", true, tweenId, insert ? insert.name : imgId);
            Logger.error("ERROR RENDER ANIM < 0 ", true);
        }
    }

    /**
     * Destroy a PIXI container in our dock by removing all animations it may have
     * as well as destroying its children before destroying itself
     *
     * @params imgId (String) : The theatreId of the insert whose dockContainer will be destroyed.
     *
     * @private
     */
    _destroyPortraitDock(imgId) {
        let app = this.pixiCTX;
        let insert = this.getInsertById(imgId);
        if (insert && insert.dockContainer) {
            // kill and release all tweens
            for (let tweenId in insert.tweens) this._removeDockTween(imgId, null, tweenId);
            insert.tweens = null;
            // destroy children
            for (let child of insert.portraitContainer.children) child.destroy();
            for (let child of insert.dockContainer.children) child.destroy();
            insert.portrait = null;
            insert.portraitContainer = null;
            insert.label = null;
            // destroy self
            insert.dockContainer.destroy();
            insert.dockContainer = null;
            let idx = this.portraitDocks.findIndex((e) => e.imgId == imgId);
            this.portraitDocks.splice(idx, 1);
            // The "MyTab" module inserts another element with id "pause". Use querySelectorAll to make sure we catch both
            document.querySelectorAll("#pause").forEach((ele) => KHelpers.removeClass(ele, "theatre-centered"));
            $("#players").removeClass("theatre-invisible");
            $("#hotbar").removeClass("theatre-invisible");
            const customSelectors = game.settings.get(CONSTANTS.MODULE_ID, "suppressCustomCss");
            if (customSelectors) {
                const selectors = customSelectors.split(";").map((selector) => selector.trim());
                selectors.forEach((selector) => {
                    $(selector).removeClass("theatre-invisible");
                });
            }
        }
        // force a render update
        //app.render();
        if (!this.rendering) this._renderTheatre(performance.now());
    }

    /**
     * Create, and track the PIXIContainer for the provided image source within
     * our dock canvas
     *
     * @params imgPath (String) : The path of the image to initialize with when
     *                            creating the PIXIContainer.
     * @params portName (String) : The name label for the insert in the container.
     * @params imgId (String) : The theatreId for this container.
     * @params optAlign (String) : The optAlign parameter denoting the insert's alignment.
     * @params emotes (Object) : An Object containing properties pretaining to the emote state
     *                           to initialize the container with.
     * @params isLeft (Boolean) : Boolean to determine if this portrait should be injected
     *                            left, or right in the dock after creation.
     *
     * @private
     */
    async _createPortraitPIXIContainer(imgPath, portName, imgId, optAlign, emotions, isLeft) {
        // given an image, we will generate a PIXI container to add to the theatreDock and size
        // it to the image loaded
        let dockContainer = new PIXI.Container();
        let portraitContainer = new PIXI.Container();
        dockContainer.addChild(portraitContainer);
        // initial positioning
        portraitContainer.x = 0;
        portraitContainer.y = 0;

        let app = this.pixiCTX;
        app.stage.addChild(dockContainer);

        // track the dockContainer
        if (!!this.getInsertById(imgId)) {
            // this dockContainer should be destroyed
            Logger.debug("PRE-EXISTING PIXI CONTAINER FOR %s ", imgId);
            this._destroyPortraitDock(imgId);
        }

        //Logger.debug("Creating PortraintPIXIContainer with emotions: ",emotions);

        let ename, textFlyin, textStanding, textFont, textSize, textColor;
        if (emotions) {
            ename = emotions.emote;
            textFlyin = emotions.textFlyin;
            textStanding = emotions.textStanding;
            textFont = emotions.textFont;
            textSize = emotions.textSize;
            textColor = emotions.textColor;
        }

        this.portraitDocks.push({
            imgId: imgId,
            dockContainer: dockContainer,
            name: portName,
            emote: ename,
            textFlyin: textFlyin,
            textStanding: textStanding,
            textFont: textFont,
            textSize: textSize,
            textColor: textColor,
            portraitContainer: portraitContainer,
            portrait: null,
            label: null,
            typingBubble: null,
            exitOrientation: isLeft ? "left" : "right",
            nameOrientation: "left",
            mirrored: false,
            optAlign: optAlign,
            tweens: {},
            order: 0,
            renderOrder: 0,
            meta: {},
        });

        let imgSrcs = [];

        imgSrcs.push({
            imgpath: "modules/theatre/assets/graphics/typing.png",
            resname: "modules/theatre/assets/graphics/typing.png",
        });
        imgSrcs.push({ imgpath: imgPath, resname: imgPath });
        Logger.debug("Adding %s with src %s", portName, imgPath);
        // get actor, load all emote images
        let actorId = imgId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let params = this._getInsertParamsFromActorId(actorId);

        if (!params) {
            Logger.error("ERROR: Actor does not exist for %s", false, actorId);
            this._destroyPortraitDock(imgId);
            return null;
        }
        // load all rigging assets
        let rigResources = Theatre.getActorRiggingResources(actorId);

        Logger.debug("RigResources for %s :", portName, rigResources);

        for (let rigResource of rigResources) imgSrcs.push({ imgpath: rigResource.path, resname: rigResource.path });

        // load all emote base images + rigging for the emotes
        for (let emName in params.emotes)
            if (params.emotes[emName])
                if (params.emotes[emName].insert && params.emotes[emName].insert != "")
                    imgSrcs.push({ imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert });

        const resources = await this._addSpritesToPixi(imgSrcs);
        // PIXI Container is ready!
        // Setup the dockContainer to display the base insert
        Logger.debug("Sprites added to PIXI _createPortraitPIXIContainer", resources);
        let portWidth =
            ename && params.emotes[ename] && params.emotes[ename].insert
                ? resources[params.emotes[ename].insert].width
                : resources[imgPath].width;
        let initX = isLeft ? -1 * portWidth : this.theatreDock.offsetWidth + portWidth;

        if (!ename) {
            // load in default portrait
            dockContainer.x = initX;
            await this._setupPortraitContainer(imgId, optAlign, imgPath, resources, true);
        } else {
            // load in the ename emote portrait instead if possible, else load the default
            if (params.emotes[ename] && params.emotes[ename].insert) {
                dockContainer.x = isLeft ? -1 * portWidth : this.theatreDock.offsetWidth + portWidth;
                await this._setupPortraitContainer(imgId, optAlign, params.emotes[ename].insert, resources, true);
            } else {
                dockContainer.x = initX;
                await this._setupPortraitContainer(imgId, optAlign, imgPath, resources, true);
            }
        }
    }

    /**
     * Sets up a portrait's PIXI dockContainer to size to
     * the given resource
     *
     * @params imgId (String) : The theatreId of the insert whose portrait we're setting up.
     * @params resName (String) : The resource name of the sprite to configure.
     * @params reorder (Boolean) : Boolean to indicate if a reorder should be performed after
     *                             an update.
     *
     * @private
     */
    async _setupPortraitContainer(imgId, optAlign, resName, resources, reorder) {
        let insert = this.getInsertById(imgId);

        if (!insert || !insert.dockContainer) {
            Logger.error("ERROR PIXI Container was destroyed before setup could execute for %s", true, imgId);
            Logger.error(
                `${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1")} ${imgId} ${game.i18n.localize(
                    "Theatre.UI.Notification.ImageLoadFail_P2",
                )} ${resName}`,
                true,
            );
            this.removeInsertById(imgId);
            return;
        }

        if (!resources[resName]) {
            Logger.error("ERROR could not load texture %s", true, resName, resources);
            Logger.error(
                `${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1")} ${imgId} ${game.i18n.localize(
                    "Theatre.UI.Notification.ImageLoadFail_P2",
                )} ${resName}`,
                true,
            );
            this.removeInsertById(imgId);
            return;
        }

        let app = this.pixiCTX;
        let dockContainer = insert.dockContainer;
        let portraitContainer = insert.portraitContainer;

        let sprite = new PIXI.Sprite(resources[resName]);
        let portWidth = resources[resName].width;
        let portHeight = resources[resName].height;

        let usePercent = game.settings.get(CONSTANTS.MODULE_ID, "theatreImageUsePercent");
        let maxHeightPixel = game.settings.get(CONSTANTS.MODULE_ID, "theatreImageSize");
        let maxHeightPercent = window.innerHeight * game.settings.get(CONSTANTS.MODULE_ID, "theatreImageSizePercent");
        let useUniform = game.settings.get(CONSTANTS.MODULE_ID, "theatreImageSizeUniform");

        let maxHeight = usePercent ? maxHeightPercent : maxHeightPixel;

        if (portHeight > maxHeight || useUniform) {
            portWidth *= maxHeight / portHeight;
            portHeight = maxHeight;
        }

        // adjust dockContainer + portraitContainer dimensions to fit the image
        dockContainer.width = portWidth;
        dockContainer.height = portHeight;
        portraitContainer.width = portWidth;
        portraitContainer.height = portHeight;

        // set the initial dockContainer position + state
        //dockContainer.x = 0;
        dockContainer.y =
            this.theatreDock.offsetHeight - (optAlign == "top" ? this.theatreBar.offsetHeight : 0) - portHeight;

        // save and stage our sprite
        insert.portrait = sprite;
        insert.portrait.width = portWidth;
        insert.portrait.height = portHeight;

        portraitContainer.addChild(sprite);
        portraitContainer.pivot.x = portWidth / 2;
        portraitContainer.pivot.y = portHeight / 2;
        portraitContainer.x = portraitContainer.x + portWidth / 2;
        portraitContainer.y = portraitContainer.y + portHeight / 2;
        // set sprite initial coordinates + state
        sprite.x = 0;
        sprite.y = 0;
        // set mirror state if mirrored
        if (insert.mirrored) {
            portraitContainer.scale.x = -1;
            /*
			if (reorder)
				portraitContainer.x = portWidth;
			*/
        }
        // setup label if not setup
        if (!insert.label) {
            let textStyle = new PIXI.TextStyle({
                align: "center",
                fontFamily: game.settings.get(CONSTANTS.MODULE_ID, "nameFont"),
                fontSize: 44,
                lineHeight: 64,
                //fontStyle: 'italic',
                fontWeight: this.fontWeight,
                fill: ["#ffffff"],
                stroke: "#000000",
                strokeThickness: 2,
                dropShadow: true,
                dropShadowColor: "#000000",
                dropShadowBlur: 1,
                dropShadowAngle: Math.PI / 6,
                breakWords: true,
                wordWrap: true,
                wordWrapWidth: portWidth,
            });
            let label = new PIXI.Text(insert.name, textStyle);
            // save and stage our label
            label.theatreComponentName = "label";
            insert.label = label;
            dockContainer.addChild(label);
            // initital positioning
            insert.label.x = 20;
        }
        // position the label
        insert.label.y =
            portHeight - (optAlign == "top" ? 0 : this.theatreBar.offsetHeight) - insert.label.lineHeight - 20;

        // setup typing bubble
        if (!insert.typingBubble) {
            let typingBubble = new PIXI.Sprite();
            typingBubble.texture = resources["modules/theatre/assets/graphics/typing.png"];
            typingBubble.width = 55;
            typingBubble.height = 55;
            typingBubble.theatreComponentName = "typingBubble";
            typingBubble.alpha = 0;
            typingBubble.y =
                portHeight -
                (optAlign == "top" ? 0 : this.theatreBar.offsetHeight) -
                insert.label.style.lineHeight +
                typingBubble.height / 2;

            insert.typingBubble = typingBubble;
            dockContainer.addChild(typingBubble);
        }

        // TheatreStyle specific adjustments
        switch (this.settings.theatreStyle) {
            case "lightbox":
                // to allow top-aligned portraits to work without a seam
                dockContainer.y += optAlign == "top" ? 8 : 0;
                insert.label.y -= insert.optAlign == "top" ? 8 : 0;
                break;
            case "clearbox":
                dockContainer.y = this.theatreDock.offsetHeight - portHeight;
                insert.label.y += optAlign == "top" ? 0 : this.theatreBar.offsetHeight;
                insert.typingBubble.y += optAlign == "top" ? 0 : this.theatreBar.offsetHeight;
                break;
            case "mangabubble":
                break;
            case "textbox":
                break;
            default:
                break;
        }

        Logger.debug("Portrait loaded with w:%s h:%s", portWidth, portHeight, sprite);

        // run rigging animations if we have have any
        if (insert.emote) {
            let actorId = insert.imgId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
            let defaultDisabled = this.isDefaultDisabled(insert.imgId);
            Logger.debug("is default disabled? : %s", defaultDisabled);
            let emotes = Theatre.getActorEmotes(actorId, defaultDisabled);
            let rigResMap = Theatre.getActorRiggingResources(actorId);
            if (emotes[insert.emote] && emotes[insert.emote].rigging) {
                for (let anim of emotes[insert.emote].rigging.animations) {
                    await this.addTweensFromAnimationSyntax(anim.name, anim.syntax, rigResMap, insert);
                }
            }
        }

        if (TheatreHelpers._isDebugActive()) {
            // DEBUG BOX dockContainer
            let graphics = new PIXI.Graphics();
            graphics.lineStyle(1, 0xfeeb77, 1);
            graphics.moveTo(0, 0);
            graphics.lineTo(portWidth, 0);
            graphics.lineTo(portWidth, portHeight);
            graphics.lineTo(0, portHeight);
            graphics.lineTo(0, 0);
            dockContainer.addChild(graphics);
            let dimStyle = new PIXI.TextStyle({
                fontSize: 10,
                lineHeight: 30,
                fontWeight: "bold",
                fill: ["#FF383A"],
                stroke: "#000000",
                strokeThickness: 2,
                wordWrap: true,
                wordWrapWidth: portWidth,
            });
            let pathStyle = new PIXI.TextStyle({
                fontSize: 22,
                lineHeight: 22,
                fontWeight: "bold",
                fill: ["#38FFEB"],
                stroke: "#000000",
                strokeThickness: 2,
                wordWrap: true,
                breakWords: true,
                wordWrapWidth: portWidth,
            });
            let infoStyle = new PIXI.TextStyle({
                fontSize: 14,
                lineHeight: 14,
                fontWeight: "bold",
                fill: ["#ffffff"],
                stroke: "#000000",
                strokeThickness: 2,
                wordWrap: true,
                breakWords: true,
                wordWrapWidth: portWidth,
            });
            let dims = new PIXI.Text(`${portWidth} px x ${portHeight} px`, dimStyle);
            let path = new PIXI.Text(resources[resName].url, pathStyle);
            let info = new PIXI.Text("X", infoStyle);
            info.theatreComponentName = "debugInfo";
            dims.x = 20;
            path.x = 20;
            path.y = 30;
            info.x = 20;
            info.y = 90;
            dockContainer.addChild(dims);
            dockContainer.addChild(path);
            dockContainer.addChild(info);
            this._updateTheatreDebugInfo(insert);

            // DEBUG BOX portraitContainer
            graphics = new PIXI.Graphics();
            graphics.lineStyle(1, 0xffffff, 1);
            graphics.moveTo(0, 0);
            graphics.lineTo(portWidth, 0);
            graphics.lineTo(portWidth, portHeight);
            graphics.lineTo(0, portHeight);
            graphics.lineTo(0, 0);
            portraitContainer.addChild(graphics);
        }

        if (reorder) {
            // fade in
            dockContainer.alpha = 0;

            window.setTimeout(() => {
                let tb = this._getTextBoxById(imgId);
                if (tb) tb.style.opacity = 1;

                window.clearTimeout(this.reorderTOId);
                this.reorderTOId = window.setTimeout(() => {
                    Theatre.reorderInserts();
                    this.reorderTOId = null;
                }, 500);
            }, 100);
        } else {
            dockContainer.alpha = 1;
        }

        //app.render();
        if (!this.rendering) this._renderTheatre(performance.now());
    }

    /**
     *
     * Updates the PIXIText containing our debug information.
     *
     * @params insert (Objet) : An Object represeting the insert
     *
     * @private
     */
    _updateTheatreDebugInfo(insert) {
        if (!insert || !insert.dockContainer) return;
        let info = insert.dockContainer.children.find((e) => e.theatreComponentName == "debugInfo");
        if (info) {
            info.text =
                `imgId: ${insert.imgId}\n` +
                `dockContainer (exists): ${!!insert.dockContainer}\n` +
                `name: ${insert.name}\n` +
                `emote: ${insert.emote}\n` +
                `textFlyin: ${insert.textFlyin}\n` +
                `textStanding: ${insert.textStanding}\n` +
                `textFont: ${insert.textFont}\n` +
                `textSize: ${insert.textSize}\n` +
                `textColor: ${insert.textColor}\n` +
                `portraitContainer (exists): ${!!insert.portraitContainer}\n` +
                `portraitContainer (XPos): ${insert.portraitContainer.x}\n` +
                `portraitContainer (YPos): ${insert.portraitContainer.y}\n` +
                `portrait (exists): ${!!insert.portrait}\n` +
                `label: ${insert.label.text}\n` +
                `typingBubble (exists): ${!!insert.typingBubble}\n` +
                `exitOrientation: ${insert.exitOrientation}\n` +
                `nameOrientation: ${insert.nameOrientation}\n` +
                `mirrored: ${insert.mirrored}\n` +
                `optAlign: ${insert.optAlign}\n` +
                `tweens (# active): ${Object.keys(insert.tweens).length}\n` +
                `decayTOId: ${insert.decayTOId}\n` +
                `order: ${insert.order}\n` +
                `renderOrder: ${insert.renderOrder}\n`;
            /*
				`meta (#): ${insert.meta.length}\n`
				*/
        }
    }

    /**
     * Reposition insert elements based
     * on nameOrientation label length,
     * and textBox position
     *
     * @params insert (Object) : An Object representing the insert
     *
     * @private
     */
    _repositionInsertElements(insert) {
        if (!insert || !insert.portrait) {
            Logger.error("ERROR: No insert, or portrait available ", false, insert);
            return;
        }
        // re-align the dockContainer to the textBox and its nameOrientation
        let textBox = this.getTextBoxById(insert.imgId);
        let offset = KHelpers.offset(textBox);
        let leftPos = Math.round(
            Number(offset.left || 0) -
                Number(KHelpers.style(textBox)["left"].match(/\-*\d+\.*\d*/) || 0) -
                Number(KHelpers.style(this.theatreBar)["margin-left"].match(/\-*\d+\.*\d*/) || 0),
        );
        // pre-split measurement
        insert.label.style.wordWrap = false;
        insert.label.style.wordWrapWidth = insert.portrait.width;
        let labelExceeds = insert.label.width + 20 + insert.label.style.fontSize > textBox.offsetWidth;
        let preLabelWidth = insert.label.width;
        // split measurement
        insert.label.style.wordWrap = true;
        insert.label.style.wordWrapWidth = textBox.offsetWidth;
        // Scale the name bar length and orient the portait
        if (insert.nameOrientation == "left") {
            insert.label.x = 20;
            insert.typingBubble.anchor.set(0.5);
            insert.typingBubble.x = Math.min(
                preLabelWidth + 20 + insert.typingBubble.width / 2,
                textBox.offsetWidth - insert.typingBubble.width / 2,
            );
        } else {
            if (labelExceeds) {
                insert.label.x = insert.portrait.width - insert.label.width - 20;
                if (insert.label.width - 20 > insert.portrait.width)
                    insert.typingBubble.x = Math.min(
                        insert.portrait.width - insert.label.width - insert.typingBubble.texture.width / 2 - 20,
                        insert.typingBubble.width / 2,
                    );
                else
                    insert.typingBubble.x = Math.max(
                        insert.portrait.width - insert.label.width - insert.typingBubble.texture.width / 2 - 20,
                        insert.typingBubble.width / 2,
                    );
            } else {
                insert.label.x = insert.portrait.width - preLabelWidth - 20;
                if (preLabelWidth - 20 > insert.portrait.width)
                    insert.typingBubble.x = Math.min(
                        insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width / 2 - 20,
                        insert.typingBubble.width / 2,
                    );
                else
                    insert.typingBubble.x = Math.max(
                        insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width / 2 - 20,
                        insert.typingBubble.width / 2,
                    );
            }

            insert.typingBubble.anchor.set(0.5);

            leftPos += textBox.offsetWidth - insert.portrait.width;
        }
        insert.typingBubble.y =
            insert.portrait.height -
            (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) -
            insert.label.style.lineHeight +
            insert.typingBubble.height / 2;
        // if the label height > font-size, it word wrapped wrap, so we need to bump up the height
        if (labelExceeds) {
            let divisor = Math.round(insert.label.height / insert.label.style.lineHeight);
            insert.label.y =
                insert.portrait.height -
                (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) -
                insert.label.style.lineHeight * divisor;
        } else {
            // normal
            insert.label.y =
                insert.portrait.height -
                (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) -
                insert.label.style.lineHeight;
        }
        insert.typingBubble.rotation = 0.1745;
        insert.dockContainer.x = leftPos;
        insert.dockContainer.y =
            this.theatreDock.offsetHeight -
            (insert.optAlign == "top" ? this.theatreBar.offsetHeight : 0) -
            insert.portrait.height;

        // theatreStyle specific adjustments
        switch (this.settings.theatreStyle) {
            case "lightbox":
                // to allow top-aligned portraits to work without a seam
                insert.dockContainer.y += insert.optAlign == "top" ? 8 : 0;
                insert.label.y -= insert.optAlign == "top" ? 8 : 0;
                break;
            case "clearbox":
                insert.dockContainer.y = this.theatreDock.offsetHeight - insert.portrait.height;
                insert.label.y += insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight;
                insert.typingBubble.y += insert.optAlign == "top" ? 0 : Theatre.instance.offsetHeight;
                break;
            case "mangabubble":
                break;
            case "textbox":
                break;
            default:
                break;
        }
    }

    /**
     * Add Resource
     *
     * We want to add an asset to the the PIXI Loader
     *
     * @params imgSrc (String) : The url of the image that will replace the resource
     * @params resName (String) : The resource name to replace
     * @params imgId (String) : The theatreId of the insert whose resource is being replaced
     * @params cb (Function) : The callback to invoke once we're done replacing the resource
     * @params remote (Boolean) : Boolean indicating if thist call is being done remotely or locally.
     *
     * @private
     */
    async _AddTextureResource(imgSrc, resName, imgId, emote, remote) {
        // First we pull the insert,canvas,and pixi app from the imgId.
        // Second, we want to verify that the source image exists, if so,
        // then we'll proceed.
        // X Third, we will kill all inserts that are currently having one of their resources (we can keep the canvas up)
        // replaced as a safety measure.
        // Fourth, we will delete the resource via .delete() from the loader
        // Fifth, we will load in the resource, and then broadcast to all other clients to
        // also replace their resources.
        // ** NOTE this may have desync issues **

        let insert = this.getInsertById(imgId);
        let container = insert ? insert.dockContainer : null;
        // If no insert/container, this is fine
        let app = this.pixiCTX;
        let actorId = imgId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let actorParams = this._getInsertParamsFromActorId(actorId);
        // no actor is also fine if this is some kind of rigging resource

        // src check, not fine at all!
        if (!(await srcExists(imgSrc))) {
            Logger.error("ERROR (_AddTextureResource) : Replacement texture does not exist %s ", false, imgSrc);
            return;
        }

        // if we have no resName then just return empty map
        if (!resName || resName == "") {
            return {};
        }

        let imgSrcs = [{ resname: resName, imgpath: imgSrc }];
        Logger.debug("replace textures", imgSrcs);

        // Send to socket
        if (!remote) {
            // broadcast change to clients
            this._sendSceneEvent("addtexture", {
                insertid: imgId,
                imgsrc: imgSrc,
                resname: resName,
                emote: emote,
            });
        }
        return await this._addSpritesToPixi(imgSrcs);
    }

    /**
     * Add All Texture Resources
     *
     * Add an array of assets to the PIXI Loader
     *
     * @param imgSrcs (Array) : An array of Objects consiting of {imgsrc: <value>, resname: <value>}
     *                          of the resources to replace.
     * @param imgId (String) : The TheatreId of the insert whose textures will be replaced.
     * @param emote (String) : The currently active emote, if any.
     * @param cb (Function) : The function callback to invoke when the resources are loaded.
     * @param remote (Boolean) : Wither or not this function is being invoked remotely, if not, then
     *                           we want to broadcast to all other clients to perform the action as well.
     *
     * @private
     */
    async _AddAllTextureResources(imgSrcs, imgId, emote, eresName, remote) {
        // First we pull the insert,canvas,and pixi app from the imgId.
        // Second, we want to verify that the source image exists, if so,
        // then we'll proceed.
        // X Third, we will kill all inserts that are currently having one of their resources (we can keep the canvas up)
        // replaced as a safety measure.
        // Fourth, we will delete the resource via .delete() from the loader
        // Fifth, we will load in the resource, and then broadcast to all other clients to
        // also replace their resources.
        // ** NOTE this may have desync issues **

        let insert = this.getInsertById(imgId);
        let container = insert ? insert.dockContainer : null;
        // If no insert/container, this is fine
        let app = this.pixiCTX;
        let actorId = imgId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let actorParams = this._getInsertParamsFromActorId(actorId);
        // no actor is also fine if this is some kind of rigging resource

        // src check, not fine at all!
        for (let src of imgSrcs)
            if (!(await srcExists(src.imgpath))) {
                Logger.error("ERROR (_AddAllTextureResources) : Replacement texture does not exist %s ", false, src);
                return;
            }

        // if we have an emtpy imgSrc array, just return empty map
        if (imgSrcs.length <= 0) {
            return {};
        }

        Logger.debug("replace textures", imgSrcs);

        // Send to socket
        if (!remote) {
            // broadcast change to clients
            this._sendSceneEvent("addalltextures", {
                insertid: imgId,
                imgsrcs: imgSrcs,
                emote: emote,
                eresname: eresName,
            });
        }
        return await this._addSpritesToPixi(imgSrcs);
    }

    /**
     * Clear the container by ending all animations, and removing all sprites
     *
     * @param imgId : The theatreId of the insert whose dockContainer we should
     *                clear.
     *
     * @private
     */
    _clearPortraitContainer(imgId) {
        let insert = this.getInsertById(imgId);
        if (!insert || !insert.dockContainer || !insert.portrait) return;

        // preserve position without portrait offset
        let ox = insert.portraitContainer.x - insert.portrait.width / 2;
        let oy = insert.portraitContainer.y - insert.portrait.height / 2;
        let ocx = insert.dockContainer.x;
        let ocy = insert.dockContainer.y;
        let oLabelAnim = insert.tweens["nameSpeakingPulse"];
        let oTypingBounceAnim = insert.tweens["typingBounce"];
        let oTypingWiggleAnim = insert.tweens["typingWiggle"];
        let oTypingAppearAnim = insert.tweens["typingAppear"];
        let oTypingVanishAnim = insert.tweens["typingVanish"];
        // kill and release all tweens, except for label or typingBubble
        // animation
        for (let tweenId in insert.tweens) {
            if (
                tweenId == "nameSpeakingPulse" ||
                tweenId == "typingBounce" ||
                tweenId == "typingAppear" ||
                tweenId == "typingVanish" ||
                tweenId == "typingWiggle"
            )
                continue;
            this._removeDockTween(imgId, null, tweenId);
        }
        insert.tweens = {};
        if (oLabelAnim) insert.tweens["nameSpeakingPulse"] = oLabelAnim;
        if (oTypingBounceAnim) insert.tweens["typingBounce"] = oTypingBounceAnim;
        if (oTypingWiggleAnim) insert.tweens["typingWiggle"] = oTypingWiggleAnim;
        if (oTypingAppearAnim) insert.tweens["typingAppear"] = oTypingAppearAnim;
        if (oTypingVanishAnim) insert.tweens["typingVanish"] = oTypingVanishAnim;

        // destroy children
        for (let child of insert.portraitContainer.children) child.destroy();
        // attempt to preserve label + typingBubble
        for (let idx = insert.dockContainer.children.length - 1; idx >= 0; --idx) {
            let child = insert.dockContainer.children[idx];
            if (child.theatreComponentName && child.theatreComponentName == "label")
                insert.dockContainer.removeChildAt(idx);
            else if (child.theatreComponentName && child.theatreComponentName == "typingBubble")
                insert.dockContainer.removeChildAt(idx);
            else child.destroy();
        }
        insert.portrait = null;
        insert.portraitContainer = null;
        // destroy self
        insert.dockContainer.destroy();
        insert.dockContainer = null;
        // re-generate the container
        let dockContainer = new PIXI.Container();
        let portraitContainer = new PIXI.Container();
        dockContainer.addChild(portraitContainer);
        // initial positioning
        portraitContainer.x = ox;
        portraitContainer.y = oy;
        dockContainer.x = ocx;
        dockContainer.y = ocy;
        // assignment
        insert.dockContainer = dockContainer;
        insert.portraitContainer = portraitContainer;
        Logger.debug("saving ox: %s, oy: %s", ox, oy);
        // label is NOT re-attached, must be done by the clearer
        // typingBubble is NOT re-attached, must be done by the clearer
        // mirror-state is NOT restored, must be done by the clearer
    }

    /**
     * Add sprites to the PIXI Loader
     *
     * @params imcSrcs (Array[Object]) : An array of {imgsrc: (String), resname (String)} pairs
     *                                   representing the assets to be loaded into PIXI's loader.
     * @params cb (Function) : The function to invoke once the assets are loaded.
     *
     * @private
     */
    async _addSpritesToPixi(imgSrcs) {
        Logger.debug("adding sprite to dockContainer");

        const resources = {};
        await Promise.all(
            imgSrcs.map(async ({ resname, imgpath }) => {
                resources[resname] = resources[imgpath] = await PIXI.Assets.load(imgpath);
            }),
        );
        Logger.debug("resources", resources);
        return resources;
    }

    /**
     * Given an array of theatreIds, stage them all
     *
     * @params ids (Array[(String)] : An array of theatreIds of inserts to load.
     * @params cb (Function) : The function to invoke once the assets are loaded.
     */
    async stageAllInserts(ids) {
        let actorId, params;
        let imgSrcs = [];
        for (let id of ids) {
            actorId = id.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
            params = this._getInsertParamsFromActorId(actorId);
            if (!params) continue;

            // base insert
            imgSrcs.push({ imgpath: params.src, resname: params.src });

            // load all rigging assets
            let rigResources = Theatre.getActorRiggingResources(actorId);

            Logger.debug("RigResources for %s :", params.name, rigResources);

            for (let rigResource of rigResources)
                imgSrcs.push({ imgpath: rigResource.path, resname: rigResource.path });

            // load all emote base images + rigging for the emotes
            for (let emName in params.emotes)
                if (params.emotes[emName])
                    if (params.emotes[emName].insert && params.emotes[emName].insert != "")
                        imgSrcs.push({ imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert });
        }

        // load in the sprites
        await this._addSpritesToPixi(imgSrcs);
    }

    /**
     * "Stages" an insert by pre-loading the base + all emote images
     *
     * @params theatreId (String) : The theatreId of the insert to load.
     * @params remote (Boolean) : Whether this is being invoked remotely or locally.
     */
    async stageInsertById(theatreId, remote) {
        let actorId = theatreId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let params = this._getInsertParamsFromActorId(actorId);
        if (!params) {
            return;
        }
        //Logger.debug("params: ",params);
        // kick asset loader to cache the portrait + emotes
        let imgSrcs = [];

        //imgSrcs.push({imgpath: params.src, resname: `portrait-${theatreId}`});
        // get actor, load all emote images
        if (!params) {
            Logger.error("ERROR: Actor does not exist for %s", false, actorId);
            return null;
        }

        imgSrcs.push({ imgpath: params.src, resname: params.src });

        // load all rigging assets
        let rigResources = Theatre.getActorRiggingResources(actorId);

        Logger.debug("RigResources for %s :", params.name, rigResources);

        for (let rigResource of rigResources) imgSrcs.push({ imgpath: rigResource.path, resname: rigResource.path });

        // load all emote base images + rigging for the emotes
        for (let emName in params.emotes)
            if (params.emotes[emName])
                if (params.emotes[emName].insert && params.emotes[emName].insert != "")
                    imgSrcs.push({ imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert });

        // load in the sprites
        await this._addSpritesToPixi(imgSrcs);
        Logger.debug("staging complete for %s", theatreId);

        // Send socket event
        if (!remote) Theatre.instance._sendSceneEvent("stage", { insertid: theatreId });
    }

    /**
     * Set the emote given the id
     *
     * @params ename (String) : The emote name.
     * @params id (String) : The theatreId of the insert.
     * @params remote (Boolean) : Wither this is being invoked remotely or locally.
     */
    setEmoteForInsertById(ename, id, remote) {
        let insert = this.getInsertById(id);

        this._setEmoteForInsert(ename, insert, remote);
    }
    /**
     * Set the emote given the name
     *
     * @params ename (String) : The emote name.
     * @params name (String) : The label name of the insert.
     * @params remote (Boolean) : Wither this is being invoked remotely or locally.
     */
    setEmoteForInsertByName(ename, name, remote) {
        let insert = this.getInsertByName(name);

        this._setEmoteForInsert(ename, insert, remote);
    }
    /**
     * Set the emote given the insert
     * the moment the insert is in the RP bar
     *
     * @params ename (String) : The emote name.
     * @params insert (Object) : An Object representing the insert.
     * @params remote (Boolean) : Wither this is being invoked remotely or locally.
     *
     * @private
     */
    async _setEmoteForInsert(ename, insert, remote) {
        // given the emote name, get the image if possible,
        // and add it to the insert canvas.
        //
        // If the insert already is that emote, do nothing,
        // If the insert emote does not exist, set the base insert
        // if the insert emote does not exist and the insert is
        // already either the base insert, or an emote without an
        // insert, do nothing
        if (!insert) {
            return;
        }
        let aEmote = insert.emote;
        let actorId = insert.imgId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let actor = game.actors.get(actorId);
        if (!actor) {
            return;
        }
        let baseInsert = actor.img ? actor.img : CONSTANTS.DEFAULT_PORTRAIT;
        if (actor.flags.theatre) {
            baseInsert = actor.flags.theatre.baseinsert ? actor.flags.theatre.baseinsert : baseInsert;
        }
        let emotes = Theatre.getActorEmotes(actorId);

        // emote already active
        //if ((this.speakingAs != insert.imgId && !this.isDelayEmote) || this.delayedSentState > 2)
        if (remote || !this.isDelayEmote)
            if (aEmote == ename || (ename == null && aEmote == null)) {
                return;
            }
        // if emote insert exists
        let app = this.pixiCTX;
        if (!!ename && emotes[ename] && emotes[ename].insert && emotes[ename].insert != "") {
            // clear the pixi container
            this._clearPortraitContainer(insert.imgId);
            // set this sprite to span the PIXI Container via _setupPortraitCanvas
            let imgSrcs = [];
            // emote base image
            let emoteResName = emotes[ename].insert;
            imgSrcs.push({ imgpath: emotes[ename].insert, resname: emoteResName });
            // add sprites
            const resources = await this._addSpritesToPixi(imgSrcs);
            Logger.debug("emote insert loaded", resources);
            // Error loading the sprite
            if (!resources[emoteResName] || resources[emoteResName].error) {
                Logger.error(
                    "ERROR loading resource %s : %s : %s",
                    true,
                    insert.imgId,
                    emoteResName,
                    emotes[ename].insert,
                );
                Logger.error(
                    game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1") +
                        +emoteResName +
                        game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2") +
                        emotes[ename].insert +
                        "'",
                    true,
                );
                this.removeInsertById(insert.imgId);
            }

            // flag our insert with our emote state
            insert.emote = ename;
            // now fix up the PIXI Container and make it pretty
            await this._setupPortraitContainer(insert.imgId, insert.optAlign, emoteResName, resources);
            // re-attach label + typingBubble
            insert.dockContainer.addChild(insert.label);
            insert.dockContainer.addChild(insert.typingBubble);

            this._repositionInsertElements(insert);

            if (!this.rendering) this._renderTheatre(performance.now());
        } else {
            this._clearPortraitContainer(insert.imgId);

            // flag our insert with our emote state, unless we're "actually" no emote rather
            // than just emoting with no insert available
            if (ename) insert.emote = ename;
            else insert.emote = null;

            let imgSrcs = [];
            // clear the PIXI Container
            imgSrcs.push({ imgpath: baseInsert, resname: baseInsert });
            const resources = await this._addSpritesToPixi(imgSrcs);

            Logger.debug("base insert loaded", resources);
            // Error loading the sprite
            if (!resources[baseInsert] || resources[baseInsert].error) {
                Logger.error("ERROR loading resource %s : %s : %s", true, insert.imgId, baseInsert, baseInsert);
                Logger.error(
                    game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1") +
                        +baseInsert +
                        game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2") +
                        baseInsert +
                        "'",
                    true,
                );
                this.removeInsertById(insert.imgId);
            }

            // now fix up the PIXI Container and make it pretty
            await this._setupPortraitContainer(insert.imgId, insert.optAlign, baseInsert, resources);

            // re-attach label + typingBubble
            insert.dockContainer.addChild(insert.label);
            insert.dockContainer.addChild(insert.typingBubble);

            this._repositionInsertElements(insert);

            if (!this.rendering) this._renderTheatre(performance.now());
        }
    }

    /**
     * Scour the theatreBar for all text boxes
     *
     * @return (Array[HTMLElement]) : An array of HTMLElements which are the textboxes
     *
     * @private
     */
    _getTextBoxes() {
        let textBoxes = [];
        for (let container of this.theatreBar.children) for (let textBox of container.children) textBoxes.push(textBox);
        return textBoxes;
    }

    /**
     * Get the text box given the theatreId
     *
     * @params id (String) : The theatreId of the insert/textbox
     *
     * @return (HTMLELement) : The HTMLElement which is the textbox, or undefined if it
     *                          does not exist.
     *
     * @private
     */
    _getTextBoxById(id) {
        return this._getTextBoxes().find((e) => {
            return e.getAttribute("imgId") == id;
        });
    }

    /**
     * Get the text box given the label name
     *
     * @params id (String) : The label name of the insert/textbox
     *
     * @return (HTMLELement) : The HTMLElement which is the textbox, or undefined if it
     *                          does not exist.
     *
     * @private
     */
    _getTextBoxByName(name) {
        return this._getTextBoxes().find((e) => {
            return e.getAttribute("name") == name;
        });
    }

    /**
     * Add a textBox to the theatreBar
     *
     * @params textBox (HTMLElement) : The textBox to add to the theatreBar,
     *                                 MUST correspond to an insert.
     * @params isLeft (Boolean) : Wither this textBox should be injected Left or Right.
     *
     * @private
     */
    _addTextBoxToTheatreBar(textBox, isLeft) {
        let textBoxes = this._getTextBoxes();
        let primeBar = document.getElementById("theatre-prime-bar");
        let secondBar = document.getElementById("theatre-second-bar");

        if (textBoxes.length == 0) {
            // no dock
            // 1. slide in prime container, add textBox to it
            primeBar.appendChild(textBox);
            primeBar.style.left = "0%";
            primeBar.style.opacity = "1";
            primeBar.style["pointer-events"] = "all";
            this.theatreBar.style.opacity = "1";
            Hooks.call("theatreDockActive", this.dockActive);
        } else if (textBoxes.length == 1) {
            // single dock
            // 1. slide in second container, and add new textBox to it
            let insert = this.getInsertById(textBox.getAttribute("imgId"));
            if (insert) {
                //insert.meta.fromPrime = true;
                insert.nameOrientation = "right";
            }

            let dualWidth = Math.min(Math.floor(this.theatreBar.offsetWidth / 2), 650);
            secondBar.style.left = `calc(100% - ${dualWidth}px)`;
            secondBar.style.opacity = "1";
            secondBar.style["pointer-events"] = "all";
            secondBar.style.width = `${dualWidth}px`;
            primeBar.style.width = `${dualWidth}px`;

            secondBar.appendChild(textBox);
            Hooks.call("theatreDockActive", this.dockActive);
        } else if (textBoxes.length == 2) {
            // dual docks
            // 1. confirm if we're in dual dock mode
            // 2. if in dual dock mode, slide away the right dock
            // container, and remove any inserts that are not in
            // the 'prime' dock, and add them to the prime dock (should be one)
            // 3. expand the prime dock to fit the max bar width
            for (let sbb of secondBar.children) {
                let insert = this.getInsertById(sbb.getAttribute("imgId"));
                if (insert) {
                    //insert.meta.fromSecond = true;
                    insert.nameOrientation = "left";
                }
                primeBar.appendChild(sbb);
            }
            secondBar.style.left = "200%";
            secondBar.style.opacity = "0";
            secondBar.style["pointer-events"] = "none";
            primeBar.style.width = "100%";

            if (isLeft) KHelpers.insertBefore(textBox, primeBar.children[0]);
            else primeBar.appendChild(textBox);
            Hooks.call("theatreDockActive", this.dockActive);
        } else if (textBoxes.length > 2) {
            // bar dock
            // 1. Just find the prime container, and add the new textBox to it
            if (isLeft) KHelpers.insertBefore(textBox, primeBar.children[0]);
            else primeBar.appendChild(textBox);
            Hooks.call("theatreDockActive", this.dockActive);
        }
    }

    /**
     * Remove a textBox from the theatreBar
     *
     * @param textBox (HTMLElement : div) : the textBox to add to the theatreBar,
     *                                      MUST correspond to an insert.
     *
     * @private
     */
    _removeTextBoxFromTheatreBar(textBox) {
        let textBoxes = this._getTextBoxes();
        let primeBar = document.getElementById("theatre-prime-bar");
        let secondBar = document.getElementById("theatre-second-bar");

        if (textBoxes.length == 0) {
            // no dock
            // Should be impossible
            Logger.debug("REMOVE TEXTBOX ERROR, NO TEXTBOXES", textBox, this.theatreBar);
        } else if (textBoxes.length == 1) {
            // single dock
            // 1. Remove the text Box, and close the primary bar
            primeBar.style.left = "-100%";
            primeBar.style.opacity = "0";
            primeBar.style["pointer-events"] = "none";
            textBox.parentNode.removeChild(textBox);
            this.theatreBar.style.opacity = "0";
            Hooks.call("theatreDockActive", this.dockActive);
        } else if (textBoxes.length == 2) {
            // dual docks
            // 1. confirm if we're in dual dock mode
            // 2. if in dual dock mode, slide away the right dock
            // container, and remove any inserts that are not in
            // the 'prime' dock. If the element removed is the one we're removing,
            // then don't add it to the prime dock. If it isn't the one we're removing
            // then add the textBoxes in the 'secondary' dock to the primary.
            for (let sbb of secondBar.children) {
                if (sbb.getAttribute("imgId") != textBox.getAttribute("imgId")) {
                    let insert = this.getInsertById(sbb.getAttribute("imgId"));
                    if (insert) {
                        //insert.meta.fromSecond = true;
                        insert.nameOrientation = "left";
                    }
                    primeBar.appendChild(sbb);
                }
            }
            secondBar.style.left = "200%";
            secondBar.style.opacity = "0";
            secondBar.style["pointer-events"] = "none";
            primeBar.style.width = "750px";
            textBox.parentNode.removeChild(textBox);
            Hooks.call("theatreDockActive", this.dockActive);
        } else if (textBoxes.length == 3) {
            // bar dock
            // 1. create the dual docks
            for (let idx = primeBar.children.length - 1; idx >= 0; --idx) {
                if (primeBar.children[idx].getAttribute("imgId") != textBox.getAttribute("imgId")) {
                    let insert = this.getInsertById(primeBar.children[idx].getAttribute("imgId"));
                    if (insert) {
                        //insert.meta.fromPrime = true;
                        insert.nameOrientation = "right";
                    }
                    secondBar.appendChild(primeBar.children[idx]);
                    break;
                }
            }
            let dualWidth = Math.min(Math.floor(this.theatreBar.offsetWidth / 2), 650);
            secondBar.style.left = `calc(100% - ${dualWidth}px)`;
            secondBar.style.opacity = "1";
            secondBar.style["pointer-events"] = "all";
            secondBar.style.width = `${dualWidth}px`;
            primeBar.style.width = `${dualWidth}px`;

            textBox.parentNode.removeChild(textBox);
            Hooks.call("theatreDockActive", this.dockActive);
        } else {
            // normal bar removal
            textBox.parentNode.removeChild(textBox);
            Hooks.call("theatreDockActive", this.dockActive);
        }
    }

    /**
     * Given an image, path, attempt to inject it on the left
     *
     * @params imgPath (String) : The path to the image that will be used for the initial portrait.
     * @params portName (String) : The name that will be applied to the portrait's label.
     * @params ImgId (String) : The theatreId that will be assigned to this insert (must be "theatre-<ID>")
     * @params optAlign (String) : The alignment mode to use. Currently only "top" and "bottom" are accepted.
     * @params emotions (Object) : An Object containing the emote states to launch with.
     * @params remote (Boolean) : Boolean indicating if this is being invoked remotely, or locally.
     */
    async injectLeftPortrait(imgPath, portName, imgId, optAlign, emotions, remote) {
        if (!!this.getInsertById(imgId)) {
            Logger.warn('ID "%s" already exists! Refusing to inject %s', false, imgId, portName);
            return;
        }
        if (this.portraitDocks.length == 1) {
            // inject Right instread
            await this.injectRightPortrait(imgPath, portName, imgId, optAlign, emotions, remote);
            return;
        }

        // activate in navbar if not already
        let navItem = this.getNavItemById(imgId);
        if (navItem) KHelpers.addClass(navItem, "theatre-control-nav-bar-item-active");

        let dock = this._createPortraitPIXIContainer(imgPath, portName, imgId, optAlign, emotions, true);
        let textBox = document.createElement("div");
        // textBox class + style depends on our display mode
        switch (this.settings.theatreStyle) {
            case "lightbox":
                KHelpers.addClass(textBox, "theatre-text-box-light");
                break;
            case "clearbox":
                KHelpers.addClass(textBox, "theatre-text-box-clear");
                break;
            case "mangabubble":
                break;
            case "textbox":
            default:
                KHelpers.addClass(textBox, "theatre-text-box");
                break;
        }
        KHelpers.addClass(textBox, "no-scrollbar");

        portName = portName.toLowerCase();
        textBox.setAttribute("name", portName);
        textBox.setAttribute("imgid", imgId);
        textBox.style.opacity = "0";
        this._applyFontFamily(textBox, this.textFont);

        textBox.addEventListener("mousedown", this.handleTextBoxMouseDown);
        textBox.addEventListener("mouseup", this.handleTextBoxMouseUp);
        textBox.addEventListener("dblclick", this.handleTextBoxMouseDoubleClick);

        // NOTE: we leave insert container positioning up to reorderInserts
        // which will fire when the loader processes it for injection
        this._addTextBoxToTheatreBar(textBox, true);

        // Push to socket our event
        if (!remote) this._sendSceneEvent("enterscene", { insertid: imgId, emotions: emotions, isleft: true });
    }

    /**
     * Given an image, path, attempt to inject it on the right
     *
     * @params imgPath (String) : The path to the image that will be used for the initial portrait.
     * @params portName (String) : The name that will be applied to the portrait's label.
     * @params ImgId (String) : The theatreId that will be assigned to this insert (must be "theatre-<ID>")
     * @params optAlign (String) : The alignment mode to use. Currently only "top" and "bottom" are accepted.
     * @params emotions (Object) : An Object containing the emote states to launch with.
     * @params remote (Boolean) : Boolean indicating if this is being invoked remotely, or locally.
     */
    async injectRightPortrait(imgPath, portName, imgId, optAlign, emotions, remote) {
        if (!!this.getInsertById(imgId)) {
            Logger.warn('ID "%s" already exists! Refusing to inject %s', false, imgId, portName);
            return;
        }
        if (this.portraitDocks.length == 0) {
            // inject Left instread
            await this.injectLeftPortrait(imgPath, portName, imgId, optAlign, emotions, remote);
            return;
        }

        // activate in navbar if not already
        let navItem = this.getNavItemById(imgId);
        if (navItem) KHelpers.addClass(navItem, "theatre-control-nav-bar-item-active");

        let dock = this._createPortraitPIXIContainer(imgPath, portName, imgId, optAlign, emotions, false);
        let textBox = document.createElement("div");
        // textBox class + style depends on our display mode
        switch (this.settings.theatreStyle) {
            case "lightbox":
                KHelpers.addClass(textBox, "theatre-text-box-light");
                break;
            case "clearbox":
                KHelpers.addClass(textBox, "theatre-text-box-clear");
                break;
            case "mangabubble":
                break;
            case "textbox":
            default:
                KHelpers.addClass(textBox, "theatre-text-box");
                break;
        }
        KHelpers.addClass(textBox, "no-scrollbar");

        portName = portName.toLowerCase();
        textBox.setAttribute("name", portName);
        textBox.setAttribute("imgid", imgId);
        textBox.style.opacity = "0";
        this._applyFontFamily(textBox, this.textFont);

        textBox.addEventListener("mousedown", this.handleTextBoxMouseDown);
        textBox.addEventListener("mouseup", this.handleTextBoxMouseUp);
        textBox.addEventListener("dblclick", this.handleTextBoxMouseDoubleClick);

        this._addTextBoxToTheatreBar(textBox);

        // Push to socket our event
        if (!remote) this._sendSceneEvent("enterscene", { insertid: imgId, emotions: emotions, isleft: false });
    }

    /**
     * Removes insert by ID
     *
     * @params id (String) : The theatreId of the insert to remove.
     * @params remote (Boolean) : Boolean indicating if this is being invoked remotely, or locally.
     *
     * @return (Object) : An object containing the items that were removed {insert : (Object), textBox: (HTMLElement)}
     *                     or null if there was nothing to remove.
     */
    removeInsertById(id, remote) {
        name = name.toLowerCase();
        let toRemoveInsert, toRemoveTextBox;
        for (let insert of this.portraitDocks) {
            if (insert.imgId == id && !insert.deleting) {
                insert.deleting = true;
                toRemoveInsert = insert;
                break;
            }
        }
        for (let textBox of this._getTextBoxes()) {
            if (textBox.getAttribute("imgId") == id && !!!textBox.getAttribute("deleting")) {
                textBox.setAttribute("deleting", true);
                toRemoveTextBox = textBox;
                break;
            }
        }
        if (!!!toRemoveInsert || !!!toRemoveTextBox) return null;

        return this._removeInsert(toRemoveInsert, toRemoveTextBox, remote);
    }

    /**
     * Removes insert by name, in the event that there
     * are inserts with the same name, the first one is found
     * and removed.
     *
     * @params name (String) : The label name of the insert to remove.
     * @params remote (Boolean) : Boolean indicating if this is being invoked remotely, or locally.
     *
     * @return (Object) : An object containing the items that were removed {insert : (Object), textBox: (HTMLElement)}
     *                     or null if there was nothing to remove.
     */
    removeInsertByName(name, remote) {
        name = name.toLowerCase();
        let id = null,
            toRemoveInsert,
            toRemoveTextBox;
        for (let insert of this.portraitDocks) {
            if (insert.name == name && !insert.deleting) {
                id = insert.imgId;
                //insert.parentNode.removeChild(insert);
                insert.deleting = true;
                toRemoveInsert = insert;
                break;
            }
        }
        if (!id) return;
        for (let textBox of this._getTextBoxes()) {
            if (textBox.getAttribute("imgId") == id && !!!textBox.getAttribute("deleting")) {
                //textBox.parentNode.removeChild(textBox);
                textBox.setAttribute("deleting", true);
                toRemoveTextBox = textBox;
                break;
            }
        }
        if (!!!toRemoveInsert || !!!toRemoveTextBox) return null;

        return this._removeInsert(toRemoveInsert, toRemoveTextBox, remote);
    }

    /**
     * Remove Inserts given the insert dock + corresponding TextBox
     *
     * @params toRemoveInsert (Object) : An Object representing the insert to be removed.
     * @params toRemoveTextBox (HTMLElement) : The textbox of the insert to be removed.
     * @params remote (Boolean) : Boolean indicating if this is being invoked remotely, or locally.
     *
     * @return (Object) : An object containing the items that were removed {insert : (Object), textBox: (HTMLElement)}
     *                     or null if there was nothing to remove.
     *
     * @private
     */
    _removeInsert(toRemoveInsert, toRemoveTextBox, remote) {
        let isOwner = this.isActorOwner(game.user.id, toRemoveInsert.imgId);
        // permission check
        if (!remote && !isOwner) {
            Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
            return null;
        }

        if (toRemoveInsert.decayTOId) {
            window.clearTimeout(toRemoveInsert.decayTOId);
            toRemoveInsert.decayTOId = null;
        }

        // Save configuration if this is not a remote operation, and we're the owners of this
        // insert
        if (!remote && isOwner) {
            let actorId = toRemoveInsert.imgId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
            let actor = game.actors.get(actorId);
            if (actor) {
                let skel = {};
                skel["flags.theatre.settings.emote"] = toRemoveInsert.emote;
                skel["flags.theatre.settings.textflyin"] = toRemoveInsert.textFlyin;
                skel["flags.theatre.settings.textstanding"] = toRemoveInsert.textStanding;
                skel["flags.theatre.settings.textfont"] = toRemoveInsert.textFont;
                skel["flags.theatre.settings.textsize"] = toRemoveInsert.textSize;
                skel["flags.theatre.settings.textcolor"] = toRemoveInsert.textColor;
                actor.update(skel).then((response) => {
                    Logger.debug("updated with resp: ", response);
                });
            }
        }

        // animate and delayed removal
        //let isLeft = toRemoveInsert.getElementsByClassName("theatre-portrait-left").length > 0;
        let exitX = 0;
        if (toRemoveInsert.portrait) {
            if (toRemoveInsert.exitOrientation == "left") {
                exitX = toRemoveInsert.dockContainer.x - toRemoveInsert.portrait.width;
            } else {
                exitX = toRemoveInsert.dockContainer.x + toRemoveInsert.portrait.width;
            }
        }

        // Push to socket our event
        if (!remote) this._sendSceneEvent("exitscene", { insertid: toRemoveInsert.imgId });

        // unactivate from navbar
        for (let navItem of this.theatreNavBar.children)
            if (navItem.getAttribute("imgId") == toRemoveInsert.imgId) {
                KHelpers.removeClass(navItem, "theatre-control-nav-bar-item-active");
                if (toRemoveInsert.imgId == this.speakingAs)
                    KHelpers.removeClass(navItem, "theatre-control-nav-bar-item-speakingas");
            }
        // clear chat cover + effects if active for this ID
        if (this.speakingAs == toRemoveInsert.imgId) {
            let cimg = this.getTheatreCoverPortrait();
            cimg.removeAttribute("src");
            cimg.style.opacity = "0";
            let label = this._getLabelFromInsert(toRemoveInsert);
            TweenMax.killTweensOf(label);
            // clear typing
            for (let userId in this.usersTyping)
                if (this.usersTyping[userId] && this.usersTyping[userId].theatreId == toRemoveInsert.imgId) {
                    this.removeUserTyping(userId);
                    this.usersTyping[userId] = null;
                    break;
                }
            // clear label
            // clear speakingAs
            this.speakingAs = null;
            this.renderEmoteMenu();
        }
        // kill any animations of textBox
        for (let c of toRemoveTextBox.children) {
            for (let sc of c.children) TweenMax.killTweensOf(sc);
            TweenMax.killTweensOf(c);
        }
        TweenMax.killTweensOf(toRemoveTextBox);
        /*
		for (let c of toRemoveTextBox.children)
			c.parentNode.removeChild(c);
		*/
        // fade away text box
        toRemoveTextBox.style.opacity = 0;

        // animate away the dockContainer
        let tweenId = "containerSlide";
        let tween = TweenMax.to(toRemoveInsert.dockContainer, 1, {
            //delay: 0.5,
            pixi: { x: exitX, alpha: 0 },
            ease: Power4.easeOut,
            onComplete: function (ctx, imgId, tweenId) {
                // decrement the rendering accumulator
                ctx._removeDockTween(imgId, this, tweenId);
                // remove our own reference from the dockContainer tweens
            },
            onCompleteParams: [this, toRemoveInsert.imgId, tweenId],
        });
        this._addDockTween(toRemoveInsert.imgId, tween, tweenId);

        window.setTimeout(() => {
            this._destroyPortraitDock(toRemoveInsert.imgId);
            this._removeTextBoxFromTheatreBar(toRemoveTextBox);

            if (this.reorderTOId) window.clearTimeout(this.reorderTOId);

            this.reorderTOId = window.setTimeout(() => {
                Theatre.reorderInserts();
                this.reorderTOId = null;
            }, 750);
        }, 1000);

        // return results of what was removed
        return { insert: toRemoveInsert, textBox: toRemoveTextBox };
    }

    /**
     * If the dock is active, a number > 0 will be returned indicating
     * the number of active Theatre Inserts in the dock. 0 meaning the dock
     * is inactive
     *
     * @return (Number) : The number of inserts in the dock
     */
    get dockActive() {
        return this.portraitDocks.length;
    }

    /**
     * Get nav item by ID
     *
     * @params id (String) : The theatreId insert whose navItem we want.
     *
     * @return (HTMLElement) : The nav item, if found, else undefined.
     */
    getNavItemById(id) {
        const theatreActor = this.stage[id];
        if (theatreActor) return theatreActor.navElement;
    }

    /**
     * Get nav item by Name
     *
     * @params name (String) : The label name of the insert whose navItem we want.
     *
     * @return (HTMLElement) : The nav item, if found, else undefined.
     */
    getNavItemByName(name) {
        for (let navItem of this.theatreNavBar.children) {
            if (navItem.getAttribute("name") == name) return navItem;
        }
    }

    /**
     * Get bar text box by ID
     *
     * @params id (String) : The theatreId of an insert whose textBox we want.
     *
     * @return (HTMLElement) : The TextBox of the given theatreId, or undefined.
     */
    getTextBoxById(id) {
        // Narrator is a special case
        if (id == CONSTANTS.NARRATOR) return this.theatreNarrator.getElementsByClassName("theatre-narrator-content")[0];
        for (let textBox of this._getTextBoxes()) {
            if (textBox.getAttribute("imgId") == id) {
                return textBox;
            }
        }
    }

    /**
     * Get bar text box by Name
     *
     * @params name (String) : The label name of an insert whose textBox we want.
     *
     * @return (HTMLElement) : The TextBox of the given theatreId, or undefined.
     */
    getTextBoxByName(name) {
        if (name == CONSTANTS.NARRATOR)
            return this.theatreNarrator.getElementsByClassName("theatre-narrator-content")[0];
        for (let textBox of this._getTextBoxes()) {
            if (textBox.getAttribute("name") == name) {
                return textBox;
            }
        }
    }

    /**
     * Get insert dock by ID
     *
     * @params id (String) : The theatreId of an insert we want.
     *
     * @return (Object) : The Object representing the insert, or undefined.
     */
    getInsertById(id) {
        for (let idx = this.portraitDocks.length - 1; idx >= 0; --idx)
            if (this.portraitDocks[idx].imgId == id) {
                if (this.portraitDocks[idx].dockContainer) return this.portraitDocks[idx];
                else {
                    this.portraitDocks.splice(idx, 1);
                    return undefined;
                }
            }
    }

    /**
     * Get insert dock by Name
     *
     * @params name (String) : The name of an insert we want.
     *
     * @return (Object) : The Object representing the insert, or undefined.
     */
    getInsertByName(name) {
        for (let idx = this.portraitDocks.length - 1; idx >= 0; --idx)
            if (this.portraitDocks[idx].name == name) {
                if (this.portraitDocks[idx].dockContainer) return this.portraitDocks[idx];
                else {
                    this.portraitDocks.splice(idx, 1);
                    return undefined;
                }
            }
    }

    /**
     * Get the portrait sprite given the insert
     *
     * @params insert (Object) : The Object representing the insert.
     *
     * @return (Object PIXISprite) : The PIXISprite portrait of the insert.
     *
     * @private
     */
    _getPortraitSpriteFromInsert(insert) {
        if (!insert || !insert.dockContainer || !insert.potrrait) return null;
        return insert.portrait;
    }

    /**
     * Get the portrait container given the insert
     *
     * @params insert (Object) : The Object representing the insert.
     *
     * @return (Object PIXIContainer) : The PIXIContainer portrait container of the sprite.
     *
     * @private
     */
    _getPortraitContainerFromInsert(insert) {
        if (!insert || !insert.dockContainer) return null;
        return insert.portraitContainer;
    }

    /**
     * Get the label sprite given the insert
     *
     * @params insert (Object) : The Object representing the insert.
     *
     * @return (Object PIXIText) : The PIXIText label of the insert.
     *
     * @private
     */
    _getLabelFromInsert(insert) {
        if (!insert || !insert.dockContainer) return null;
        return insert.label;
    }

    /**
     * Gets the theatre's chat cover image
     *
     * @return (HTMLElement) : The <img> tag of the cover portrait in the
     *	chat message area.
     */
    getTheatreCoverPortrait() {
        return this.theatreChatCover.getElementsByTagName("img")[0];
    }

    /**
     * Get speaking insert of /this/ user
     *
     * @return (Object) : The Object representing the insert that this
     *	User is speaking as, else undefined.
     */
    getSpeakingInsert() {
        let insert = this.getInsertById(this.speakingAs);
        return insert;
    }

    /**
     * Get speaking name of /this/ user
     *
     * @return (Object PIXISprite) : The PIXISrite label of the insert the
     *	User is speaking as, else undefined.
     */
    getSpeakingLabel() {
        let insert = this.getInsertById(this.speakingAs);
        return this._getLabelFromInsert(insert);
    }

    /**
     * Get speaking portrait container of /this/ user
     *
     * @return (Object PIXIContainer) : The PIXIContainer portrait container
     *	of the insert the User is speaking as, else undefined.
     */
    getSpeakingPortraitContainer() {
        let insert = this.getInsertById(this.speakingAs);
        return this._getPortraitContainerFromInsert(insert);
    }

    /**
     * Get speaking textBox of /this/ user
     *
     * @return (HTMLElement) : The textBox of the insert the User is
     *	speaking as, else undefined.
     */
    getSpeakingTextBox() {
        return this._getTextBoxById(this.speakingAs);
    }

    /**
     * Swap Inserts by ID
     *
     * @params id1 (String) : The theatreId of the first insert to swap.
     * @params id2 (String) : The theatreId of the second insert to swap.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     */
    swapInsertsById(id1, id2, remote) {
        if (this.portraitDocks.length < 2) return;

        let insert1, insert2, textBox1, textBox2;
        for (let insert of this.portraitDocks) {
            if (insert.imgId == id1 && !!!insert1) insert1 = insert;
            else if (insert.imgId == id2 && !!!insert2) insert2 = insert;
            if (!!insert1 && !!insert2) break;
        }
        for (let textBox of this._getTextBoxes()) {
            if (textBox.getAttribute("imgId") == id1 && !!!textBox1) textBox1 = textBox;
            else if (textBox.getAttribute("imgId") == id2 && !!!textBox2) textBox2 = textBox;
            if (!!textBox1 && !!textBox2) break;
        }

        if (!!!insert1 || !!!insert2) return;
        if (!!!textBox1 || !!!textBox2) return;
        this._swapInserts(insert1, insert2, textBox1, textBox2, remote);
    }

    /**
     * Swap Inserts by Name
     *
     * @params name1 (String) : The label name of the first insert to swap.
     * @params name2 (String) : The label name of the second insert to swap.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     */
    swapInsertsByName(name1, name2, remote) {
        if (this.portraitDocks.length < 2) return;

        let insert1, insert2, textBox1, textBox2;
        name1 = name1.toLowerCase();
        name2 = name2.toLowerCase();
        for (let insert of this.portraitDocks) {
            if (insert.name == name1 && !!!insert1) insert1 = insert;
            else if (insert.name == name2 && !!!insert2) insert2 = insert;
            if (!!insert1 && !!insert2) break;
        }
        for (let textBox of this._getTextBoxes()) {
            if (textBox.getAttribute("name") == name1 && !!!textBox1) textBox1 = textBox;
            else if (textBox.getAttribute("name") == name2 && !!!textBox2) textBox2 = textBox;
            if (!!textBox1 && !!textBox2) break;
        }

        if (!!!insert1 || !!!insert2) return;
        if (!!!textBox1 || !!!textBox2) return;
        this._swapInserts(insert1, insert2, textBox1, textBox2, remote);
    }

    /**
     * Swaps Inserts
     *
     * @params insert1 (Object) : The Object representing the first insert to swap.
     * @params insert2 (Object) : The Object representing the second insert to swap.
     * @params textBox1 (HTMLELement) : The textBox of the first insert to swap.
     * @params textBox2 (HTMLELement) : The textBox of the second insert to swap.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     *
     * @private
     */
    _swapInserts(insert1, insert2, textBox1, textBox2, remote) {
        let tsib1n = textBox1.nextSibling,
            tsib1p = textBox1.previousSibling,
            tsib2n = textBox2.nextSibling,
            tsib2p = textBox2.previousSibling;
        //Logger.debug("SWAP",textBox1,textBox2);
        let adjSwap = false;

        // permission check
        if (!remote && (!this.isPlayerOwned(insert1.imgId) || !this.isPlayerOwned(insert2.imgId))) {
            Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotSwapControlled"), true);
            return;
        } else if (
            !remote &&
            !this.isActorOwner(game.user.id, insert1.imgId) &&
            !this.isActorOwner(game.user.id, insert2.imgId)
        ) {
            Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotSwapOwner"), true);
            return;
        }

        // check the dual dock case
        if (this._isTextBoxInPrimeBar(textBox1) && this._isTextBoxInSecondBar(textBox2)) {
            let primeBar = document.getElementById("theatre-prime-bar");
            let secondBar = document.getElementById("theatre-second-bar");
            insert1.nameOrientation = "right";
            insert1.exitOrientation = "right";
            insert2.nameOrientation = "left";
            insert2.exitOrientation = "left";

            primeBar.appendChild(textBox2);
            secondBar.appendChild(textBox1);
        } else if (this._isTextBoxInPrimeBar(textBox2) && this._isTextBoxInSecondBar(textBox1)) {
            let primeBar = document.getElementById("theatre-prime-bar");
            let secondBar = document.getElementById("theatre-second-bar");
            insert1.nameOrientation = "left";
            insert1.exitOrientation = "left";
            insert2.nameOrientation = "right";
            insert2.exitOrientation = "right";

            primeBar.appendChild(textBox1);
            secondBar.appendChild(textBox2);
        } else {
            // full bar case
            if (tsib1n) {
                KHelpers.insertBefore(textBox2, tsib1n);
            } else if (tsib1p && tsib1p != textBox2) {
                KHelpers.insertAfter(textBox2, tsib1p);
            } else {
                Logger.debug("NO TSIB1 and PRIOR");
                KHelpers.insertAfter(textBox2, textBox1);
                adjSwap = true;
            }

            if (!adjSwap) {
                if (tsib2n) {
                    KHelpers.insertBefore(textBox1, tsib2n);
                } else if (tsib2p && tsib2p != textBox1) {
                    KHelpers.insertAfter(textBox1, tsib2p);
                } else {
                    Logger.debug("NO TSIB2 and PRIOR");
                    KHelpers.insertAfter(textBox1, textBox2);
                }
            }
        }

        if (this.reorderTOId) {
            window.clearTimeout(this.reorderTOId);
        }

        this.reorderTOId = window.setTimeout(() => {
            Theatre.reorderInserts();
            this.reorderTOId = null;
        }, 250);

        // Push to socket our event
        if (!remote) {
            Theatre.instance._sendSceneEvent("swap", {
                insertid1: insert1.imgId,
                insertid2: insert2.imgId,
            });
        }
    }

    /**
     * Move  Inserts by ID
     *
     * @params id1 (String) : The theatreId of the destination insert to move to.
     * @params id2 (String) : The theatreId of insert to move.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     */
    moveInsertById(id1, id2, remote) {
        if (this.portraitDocks.length < 2) return;

        let insert1, insert2, textBox1, textBox2;
        for (let insert of this.portraitDocks) {
            if (insert.imgId == id1 && !!!insert1) insert1 = insert;
            else if (insert.imgId == id2 && !!!insert2) insert2 = insert;
            if (!!insert1 && !!insert2) break;
        }
        for (let textBox of this._getTextBoxes()) {
            if (textBox.getAttribute("imgId") == id1 && !!!textBox1) textBox1 = textBox;
            else if (textBox.getAttribute("imgId") == id2 && !!!textBox2) textBox2 = textBox;
            if (!!textBox1 && !!textBox2) break;
        }

        if (!!!insert1 || !!!insert2) return;
        if (!!!textBox1 || !!!textBox2) return;
        this._moveInsert(insert1, insert2, textBox1, textBox2, remote);
    }

    /**
     * Move an insert
     *
     * @params insert1 (Object) : The Object representing the destination insert.
     * @params insert2 (Object) : The Object representing insert to move
     *
     * @params textBox1 (HTMLELement) : The textBox of the destination textbox
     * @params textBox2 (HTMLELement) : The textBox of the textbox to move
     *
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     *
     * @private
     */
    _moveInsert(insert1, insert2, textBox1, textBox2, remote) {
        let tsib1n = textBox1.nextSibling,
            tsib1p = textBox1.previousSibling,
            tsib2n = textBox2.nextSibling,
            tsib2p = textBox2.previousSibling;
        //Logger.debug("SWAP",textBox1,textBox2);
        let adjSwap = false;

        // permission check
        if (!remote && !this.isActorOwner(game.user.id, insert2.imgId)) {
            Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotMoveOwner"), true);
            return;
        } else if (!remote && (!this.isPlayerOwned(insert1.imgId) || !this.isPlayerOwned(insert2.imgId))) {
            Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotMoveControlled"), true);
            return;
        }

        // check the dual dock case
        if (this._isTextBoxInPrimeBar(textBox1) && this._isTextBoxInSecondBar(textBox2)) {
            let primeBar = document.getElementById("theatre-prime-bar");
            let secondBar = document.getElementById("theatre-second-bar");
            insert1.nameOrientation = "right";
            insert1.exitOrientation = "right";
            insert2.nameOrientation = "left";
            insert2.exitOrientation = "left";

            primeBar.appendChild(textBox2);
            secondBar.appendChild(textBox1);
        } else if (this._isTextBoxInPrimeBar(textBox2) && this._isTextBoxInSecondBar(textBox1)) {
            let primeBar = document.getElementById("theatre-prime-bar");
            let secondBar = document.getElementById("theatre-second-bar");
            insert1.nameOrientation = "left";
            insert1.exitOrientation = "left";
            insert2.nameOrientation = "right";
            insert2.exitOrientation = "right";

            primeBar.appendChild(textBox1);
            secondBar.appendChild(textBox2);
        } else {
            // full bar case
            if (insert2.order > insert1.order) KHelpers.insertBefore(textBox2, textBox1);
            else KHelpers.insertAfter(textBox2, textBox1);
        }

        if (this.reorderTOId) window.clearTimeout(this.reorderTOId);

        this.reorderTOId = window.setTimeout(() => {
            Theatre.reorderInserts();
            this.reorderTOId = null;
        }, 250);

        // Push to socket our event
        if (!remote) {
            Theatre.instance._sendSceneEvent("move", {
                insertid1: insert1.imgId,
                insertid2: insert2.imgId,
            });
        }
    }

    /**
     * Is the textbox in the prime bar
     *
     * @params textBox (HTMLElement) : The textBox to check.
     *
     * @return (Boolean) True if the textBox is in the Prime Bar, false otherwise.
     *
     * @private
     */
    _isTextBoxInPrimeBar(textBox) {
        let primeBar = document.getElementById("theatre-prime-bar");
        let id = textBox.getAttribute("imgId");
        for (let btb of primeBar.children) {
            if (btb.getAttribute("imgId") == id) return true;
        }
        return false;
    }

    /**
     * Is the textbox in the second bar
     *
     * @params textBox (HTMLElement) : The textBox to check.
     *
     * @return (Boolean) True if the textBox is in the Second Bar, false otherwise.
     *
     * @private
     */
    _isTextBoxInSecondBar(textBox) {
        let secondBar = document.getElementById("theatre-second-bar");
        let id = textBox.getAttribute("imgId");
        for (let btb of secondBar.children) {
            if (btb.getAttribute("imgId") == id) return true;
        }
        return false;
    }

    /**
     * Push Insert left or right of all others by Id
     *
     * @params id (String) : The theatreId of the insert to push.
     * @params isLeft (Boolean) : Wither we're pushing left or right.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     */
    pushInsertById(id, isLeft, remote) {
        if (this.portraitDocks.length <= 2) return;

        let targInsert;
        let targTextBox;
        for (let insert of this.portraitDocks) {
            if (insert.imgId == id) {
                targInsert = insert;
                break;
            }
        }
        for (let textBox of this._getTextBoxes()) {
            if (textBox.getAttribute("imgId") == id) {
                targTextBox = textBox;
                break;
            }
        }
        if (!!!targInsert || !!!targTextBox) return;

        this._pushInsert(targInsert, targTextBox, isLeft, remote);
    }

    /**
     * Push Insert left or right of all others by Name
     *
     * @params name (String) : The label name of the insert to push.
     * @params isLeft (Boolean) : Wither we're pushing left or right.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     */
    pushInsertByName(name, isLeft, remote) {
        if (this.portraitDocks.length <= 2) return;

        let targInsert;
        let targTextBox;
        for (let insert of this.portraitDocks) {
            if (insert.name == name) {
                targInsert = insert;
                break;
            }
        }
        for (let textBox of this._getTextBoxes()) {
            if (textBox.getAttribute("name") == name) {
                targTextBox = textBox;
                break;
            }
        }
        if (!!!targInsert || !!!targTextBox) return;

        this._pushInsert(targInsert, targTextBox, isLeft, remote);
    }

    /**
     * Push Insert left or right of all others
     *
     * @params insert (Object) : The Object represeting the insert.
     * @params textBox (HTMLElement) : The textBox of the insert.
     * @params isLeft (Boolean) : Wither we're pushing left or right.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     *
     * @private
     */
    _pushInsert(insert, textBox, isLeft, remote) {
        let textBoxes = this._getTextBoxes();
        let firstInsert = this.portraitDocks[0];
        let lastInsert = this.portraitDocks[this.portraitDocks.length - 1];
        let firstTextBox = textBoxes[0];
        let lastTextBox = textBoxes[textBoxes.length - 1];

        if (!!!firstInsert || !!!lastInsert || !!!firstTextBox || !!!lastTextBox) return;

        // permission check
        if (!remote && !this.isActorOwner(game.user.id, insert.imgId)) {
            Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
            return;
        } else if (
            !remote &&
            (isLeft ? !this.isPlayerOwned(firstInsert.imgId) : !this.isPlayerOwned(lastInsert.imgId))
        ) {
            if (isLeft) {
                Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotPushFront"), true);
            } else {
                Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotPushBack"), true);
            }
            return;
        }

        if (isLeft) {
            KHelpers.insertBefore(textBox, firstTextBox);
        } else {
            KHelpers.insertAfter(textBox, lastTextBox);
        }

        /*
		if (this.reorderTOId)
			window.clearTimeout(this.reorderTOId);

		this.reorderTOId = window.setTimeout(()=>{
			Theatre.reorderInserts();
			this.reorderTOId = null;
		},500);
		*/
        Theatre.reorderInserts();

        // Push to socket our event
        if (!remote) {
            Theatre.instance._sendSceneEvent("push", {
                insertid: insert.imgId,
                tofront: isLeft,
            });
        }
    }

    /**
     * Mirror a portrait by ID
     *
     * @params id (String) : The theatreId of the insert we wish to mirror.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     */
    mirrorInsertById(id, remote) {
        let insert = this.getInsertById(id);
        if (!insert) return;

        this._mirrorInsert(insert, remote);
    }

    /**
     * Mirror a portrait by Name
     *
     * @params name (String) : The label name of the insert we wish to mirror.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     */
    mirrorInsertByName(name, remote) {
        let insert = this.getInsertByName(name);
        if (!insert) return;

        this._mirrorInsert(insert, remote);
    }

    /**
     * Is an insertMirrored give Id
     *
     * @params id (String) : The theatreId of the insert we wish to mirror.
     * return (Boolean) : True if the insert is mirrored, false otherwise.
     */
    isInsertMirrored(id) {
        let insert = this.getInsertByName(id);
        return insert.mirrored;
    }

    /**
     * Mirror a portrait
     *
     * @params insert (Object) : The Object represeting the insert.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     *
     * @private
     */
    _mirrorInsert(insert, remote) {
        // permission check
        if (!remote && !this.isActorOwner(game.user.id, insert.imgId)) {
            Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
            return;
        }

        let tweenId = "mirrorFlip";
        let broadcast = false;
        if (!insert.mirrored && !insert.tweens[tweenId]) {
            insert.mirrored = true;
            let tween = TweenMax.to(insert.portraitContainer, 0.5, {
                pixi: { scaleX: -1 },
                ease: Power4.easeInOut,
                onComplete: function (ctx, imgId, tweenId) {
                    // decrement the rendering accumulator
                    ctx._removeDockTween(imgId, this, tweenId);
                },
                onCompleteParams: [this, insert.imgId, tweenId],
            });
            this._addDockTween(insert.imgId, tween, tweenId);
            broadcast = true;
        } else if (!insert.tweens[tweenId]) {
            insert.mirrored = false;
            let tween = TweenMax.to(insert.portraitContainer, 0.5, {
                pixi: { scaleX: 1 },
                ease: Power4.easeInOut,
                onComplete: function (ctx, imgId, tweenId) {
                    // decrement the rendering accumulator
                    ctx._removeDockTween(imgId, this, tweenId);
                },
                onCompleteParams: [this, insert.imgId, tweenId],
            });
            this._addDockTween(insert.imgId, tween, tweenId);
            broadcast = true;
        }

        // Push to socket our event
        if (!remote && broadcast) {
            Theatre.instance._sendSceneEvent("positionupdate", {
                insertid: insert.imgId,
                position: {
                    x: insert.portraitContainer.x,
                    y: insert.portraitContainer.y,
                    mirror: insert.mirrored,
                },
            });
        }
    }

    /**
     * Reset an insert's postion/mirror state by Id
     *
     * @param id (String) : The theatreId of the insert to reset.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     */
    resetInsertById(id, remote) {
        let insert = this.getInsertById(id);

        this._resetPortraitPosition(insert, remote);
    }

    /**
     * Reset an insert's postion/mirror state by Id
     *
     * @param name (String) : The name label of the insert to reset.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     */
    resetInsertByName(name, remote) {
        let insert = this.getInsertByName(name);

        this._resetPortraitPosition(insert, remote);
    }
    /**
     * Resets a portrait position/morror state
     *
     * @params insert (Object) : The Object represeting an insert.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     *
     * @private
     */
    _resetPortraitPosition(insert, remote) {
        // permission check
        if (!remote && !this.isActorOwner(game.user.id, insert.imgId)) {
            Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
            return;
        }

        let tweenId, tween;
        // reset mirroring
        // reset position of portraitContainer
        insert.mirrored = false;
        tweenId = "portraitMove";
        tween = TweenMax.to(insert.portraitContainer, 0.5, {
            pixi: { scaleX: 1, x: insert.portrait.width / 2, y: insert.portrait.height / 2 },
            ease: Power3.easeOut,
            onComplete: function (ctx, imgId, tweenId) {
                // decrement the rendering accumulator
                Logger.debug("portrait move onComplete %s", tweenId);
                ctx._removeDockTween(imgId, this, tweenId);
            },
            onCompleteParams: [this, insert.imgId, tweenId],
        });
        this._addDockTween(insert.imgId, tween, tweenId);

        // Push to socket our event
        if (!remote) {
            Theatre.instance._sendSceneEvent("positionupdate", {
                insertid: insert.imgId,
                position: { x: insert.portrait.width / 2, y: insert.portrait.height / 2, mirror: false },
            });
        }
    }

    /**
     * first verify, then immediately execute the set of tweens
     * defined in the animation syntax.
     *
     * If any tweens in the syntax are incorrect, none are executed, and
     * an empty array is returned indicating no tweens were performed
     *
     * Return an array of tweens applied to the target container
     *
     * @params animName (String) : The animation name.
     * @params animSyntax (String) : The animation syntax.
     * @params resMap (Array[Object]) : The resource map to use consisting of
     *                                  {name: (String), path: (String)} tuples.
     * @params insert (Object) :  The object represeting the insert that will contain this
     *                            animation.
     */
    async addTweensFromAnimationSyntax(animName, animSyntax, resMap, insert) {
        let tweenParams = Theatre.verifyAnimationSyntax(animSyntax);

        let resTarget = resMap.find((e) => e.name == tweenParams[0].resName);
        let texture = await PIXI.Assets.load(resTarget.path);

        Logger.debug(
            "Adding tweens for animation '%s' from syntax: %s with params: ",
            animName,
            animSyntax,
            tweenParams,
        );
        // Logger.debug("Resource path is %s, resource: ", resTarget.path, resource);
        if (!texture) {
            Logger.error(
                'ERROR: resource name : "%s" with path "%s" does not exist!',
                false,
                tweenParams[idx].resName,
                resTarget.path,
            );
            return;
        }

        let sprite = new PIXI.Sprite(texture);
        let spriteWidth = texture.width;
        let spriteHeight = texture.height;
        sprite.anchor.set(0.5);
        insert.portraitContainer.addChild(sprite);

        for (let idx = 0; idx < tweenParams.length; ++idx) {
            let advOptions = tweenParams[idx].advOptions;
            // advanced options breakdown
            let yoyo = null;
            let delay = 0;
            let repeat = 0;
            let repeatDelay = 0;
            let ease = Power0.easeNone;
            let yoyoEase = null;
            let noMirror = false; // Not Implemented
            if (advOptions) {
                Logger.debug("adv options arg: ", advOptions);
                yoyo = advOptions.yoyo ? true : false;
                noMirror = advOptions.noMirror ? true : false;
                delay = advOptions.delay ? Number(advOptions.delay) : delay;
                repeat = advOptions.repeat ? Number(advOptions.repeat) : repeat;
                repeatDelay = advOptions.repeatDelay ? Number(advOptions.repeatDelay) : repeatDelay;
                ease = advOptions.ease ? Theatre.verifyEase(advOptions.ease) : ease;
                yoyoEase = advOptions.yoyoEase ? Theatre.verifyEase(advOptions.yoyoEase) : yoyoEase;
            }

            let pixiParams = {};
            for (let prop of tweenParams[idx].props) {
                // special case of x/y/scale
                if (
                    prop.name == "x" ||
                    prop.name == "y" ||
                    prop.name == "rotation" ||
                    prop.name == "scaleX" ||
                    prop.name == "scaleY"
                ) {
                    if (prop.initial.includes("%")) {
                        prop.initial =
                            (Number(prop.initial.match(/-*\d+\.*\d*/)[0] || 0) / 100) *
                            (prop.name == "x" ? insert.portrait.width : insert.portrait.height);
                        prop.final =
                            (Number(prop.final.match(/-*\d+\.*\d*/)[0] || 0) / 100) *
                            (prop.name == "x" ? insert.portrait.width : insert.portrait.height);
                    } else if (["scaleX", "scaleY", "rotation"].some((e) => e == prop.name)) {
                        prop.initial = Number(prop.initial.match(/-*\d+\.*\d*/)[0] || 0);
                        prop.final = Number(prop.final.match(/-*\d+\.*\d*/)[0] || 0);
                    }

                    Logger.debug(
                        "new %s : %s,%s : w:%s,h:%s",
                        prop.name,
                        prop.initial,
                        prop.final,
                        insert.portrait.width,
                        insert.portrait.height,
                    );
                }

                // special case for some GSAP -> PIXI names
                switch (prop.name) {
                    case "scaleX":
                        sprite.scale.x = prop.initial;
                        break;
                    case "scaleY":
                        sprite.scale.y = prop.initial;
                        break;
                    case "rotation":
                        sprite.rotation = prop.initial * (Math.PI / 180);
                        break;
                    default:
                        sprite[prop.name] = prop.initial;
                        break;
                }
                pixiParams[prop.name] = prop.final;
            }

            let tweenId = animName + idx;
            let tween = TweenMax.to(sprite, tweenParams[idx].duration, {
                pixi: pixiParams,
                ease: ease,
                delay: delay,
                repeatDelay: repeatDelay,
                repeat: repeat,
                yoyo: yoyo,
                yoyoEase: yoyoEase,
                /*onRepeat: function() {
					Logger.debug("ANIMATION tween is repeating!",this);
				}, */
                onComplete: function (ctx, imgId, tweenId) {
                    Logger.debug("ANIMATION tween complete!");
                    // decrement the rendering accumulator
                    ctx._removeDockTween(imgId, this, tweenId);
                    // remove our own reference from the dockContainer tweens
                },
                onCompleteParams: [this, insert.imgId, tweenId],
            });
            if (repeat != 0) tween.duration(tweenParams[idx].duration);
            this._addDockTween(insert.imgId, tween, tweenId);
        }
    }

    /**
     * Given the insert params, return the correct
     * intitial emotion set when displaying an insert
     * which was previously staged, or not active
     *
     * first : actor.flags.theatre.<emote>.settings.<parameter>
     * second : actor.flags.theatre.settings.<parameter>
     * third : Theatre.instance.userEmotes[<userid>].<parameter>
     *
     * @params params (Object) : The set of emotion properties.
     * @params userDefault (Boolean) : Wither to use the default user settings over the
     *                                 settings in the params object.
     *
     * @return (Object) : The object containing the emotion properties to be used.
     *
     * @private
     */
    _getInitialEmotionSetFromInsertParams(params, useDefault) {
        Logger.debug("use default? %s", !useDefault);
        let emotions = {
            emote:
                (!useDefault && params.settings.emote ? params.settings.emote : null) ||
                (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].emote : null),
            textFlyin:
                (!useDefault &&
                params.settings.emote &&
                params.emotes[params.settings.emote] &&
                params.emotes[params.settings.emote].settings
                    ? params.emotes[params.settings.emote].settings.textflyin
                    : null) ||
                (!useDefault ? params.settings.textflyin : null) ||
                (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textFlyin : null),
            textStanding:
                (!useDefault &&
                params.settings.emote &&
                params.emotes[params.settings.emote] &&
                params.emotes[params.settings.emote].settings
                    ? params.emote.settings.textstanding
                    : null) ||
                (!useDefault ? params.settings.textstanding : null) ||
                (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textStanding : null),
            textFont:
                (!useDefault &&
                params.settings.emote &&
                params.emotes[params.settings.emote] &&
                params.emotes[params.settings.emote].settings
                    ? params.emote.settings.textfont
                    : null) ||
                (!useDefault ? params.settings.textfont : null) ||
                (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textFont : null),
            textSize:
                (!useDefault &&
                params.settings.emote &&
                params.emotes[params.settings.emote] &&
                params.emotes[params.settings.emote].settings
                    ? params.emote.settings.textsize
                    : null) ||
                (!useDefault ? params.settings.textsize : null) ||
                (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textSize : null),
            textColor:
                (!useDefault &&
                params.settings.emote &&
                params.emotes[params.settings.emote] &&
                params.emotes[params.settings.emote].settings
                    ? params.emote.settings.textcolor
                    : null) ||
                (!useDefault ? params.settings.textcolor : null) ||
                (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textColor : null),
        };
        return emotions;
    }

    /**
     * Activate an insert by Id, if it is staged to the navbar
     *
     * @params id (String) : The theatreId of the insert to activate.
     * @params ev (Event) : The event that possibly triggered this activation.
     */
    async activateInsertById(id, ev) {
        let actorId = id.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let navItem = this.getNavItemById(id);
        if (!navItem) {
            let actor = game.actors.get(actorId);
            Theatre.addToNavBar(actor);
            navItem = this.getNavItemById(id);
        }
        if (!navItem) return;

        let params = this._getInsertParamsFromActorId(actorId);

        Logger.debug(" set as active");
        // set as user active
        // If the insert does not exist in the dock, add it,
        // If it does, then simply toggle it as active if it isn't already
        // If it's already active, and we're GM, then we want to transition to 'god mode'
        // voice, thus we simply un-activate our character, and assume GM voice again
        // (the default, if no insert selected)
        let insert = this.getInsertById(id);
        let textBox = this.getTextBoxById(id);
        let label = insert ? insert.label : null;

        // remove old speaking as, shift it
        let oldSpeakingItem = this.getNavItemById(this.speakingAs);
        let oldSpeakingInsert = this.getInsertById(this.speakingAs);
        let oldSpeakingLabel = oldSpeakingInsert ? oldSpeakingInsert.label : null;
        if (oldSpeakingItem) KHelpers.removeClass(oldSpeakingItem, "theatre-control-nav-bar-item-speakingas");
        if (oldSpeakingInsert) {
            this._removeDockTween(this.speakingAs, null, "nameSpeakingPulse");
            oldSpeakingInsert.label.tint = 0xffffff;
        }
        // if narrator is active, deactivate it and push the button up
        if (game.user.isGM && this.speakingAs == CONSTANTS.NARRATOR) this.toggleNarratorBar(false);
        // if this insert / textbox pair is being removed, stop
        if (!!insert && textBox.getAttribute("deleting")) return;

        if (!!insert) {
            // already in theatre
            // if not same id toggle it
            let cimg = this.getTheatreCoverPortrait();
            if (this.speakingAs != id) {
                this.speakingAs = id;
                KHelpers.addClass(navItem, "theatre-control-nav-bar-item-speakingas");
                TweenMax.to(Theatre.instance.theatreNavBar, 0.4, {
                    scrollTo: { x: navItem.offsetLeft, offsetX: Theatre.instance.theatreNavBar.offsetWidth / 2 },
                });

                // add label pulse
                insert.label.tint = 0xffffff;
                let tweenId = "nameSpeakingPulse";
                let tween = TweenMax.to(insert.label, 1, {
                    pixi: { tint: 0xff6400 },
                    ease: Power0.easeNone,
                    repeat: -1,
                    yoyo: true,
                    onComplete: function (ctx, imgId, tweenId) {
                        // decrement the rendering accumulator
                        ctx._removeDockTween(imgId, this, tweenId);
                        // remove our own reference from the dockContainer tweens
                    },
                    onCompleteParams: [this, id, tweenId],
                });
                this._addDockTween(id, tween, tweenId);

                // change cover
                cimg.setAttribute("src", params.src);
                //cimg.style.left = `calc(100% - ${this.theatreChatCover.offsetHeight}px)`
                cimg.style.width = `${this.theatreChatCover.offsetHeight}px`;
                cimg.style.opacity = "0.3";
                // push focus to chat-message
                let chatMessage = document.getElementById("chat-message");
                chatMessage.focus();
                // send typing event
                //this._sendTypingEvent();
                //this.setUserTyping(game.user.id,this.speakingAs);
            } else {
                this.speakingAs = null;
                // clear cover
                cimg.removeAttribute("src");
                cimg.style.opacity = "0";
                // clear typing theatreId data
                this.removeUserTyping(game.user.id);
                this.usersTyping[game.user.id].theatreId = null;
            }
        } else {
            let src = params.src;
            let name = params.name;
            let optAlign = params.optalign;
            let cimg = this.getTheatreCoverPortrait();
            let emotions;

            // determine if to launch with actor saves or default settings
            if (ev && ev.altKey) {
                emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params, true);
            } else {
                emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params);
            }
            Logger.debug("ACTIVATING AND INJECTING with Emotions: ", emotions);

            if (ev && !ev.shiftKey) {
                if (game.user.isGM) {
                    await this.injectLeftPortrait(src, name, id, optAlign, emotions);
                } else {
                    await this.injectRightPortrait(src, name, id, optAlign, emotions);
                }
            } else {
                await this.injectRightPortrait(src, name, id, optAlign, emotions);
            }
            this.speakingAs = id;
            KHelpers.addClass(navItem, "theatre-control-nav-bar-item-speakingas");
            TweenMax.to(Theatre.instance.theatreNavBar, 0.4, {
                scrollTo: { x: navItem.offsetLeft, offsetX: Theatre.instance.theatreNavBar.offsetWidth / 2 },
            });

            window.setTimeout(() => {
                insert = this.getInsertById(id);
                // if our insert hasn't been destroyed
                if (insert && !!insert.dockContainer && this.speakingAs == id) {
                    label = this.label;
                    // add label pulse
                    insert.label.tint = 0xffffff;
                    let tweenId = "nameSpeakingPulse";
                    let tween = TweenMax.to(insert.label, 1, {
                        pixi: { tint: 0xff6400 },
                        ease: Power0.easeNone,
                        repeat: -1,
                        yoyo: true,
                        onComplete: function (ctx, imgId, tweenId) {
                            // decrement the rendering accumulator
                            ctx._removeDockTween(imgId, this, tweenId);
                            // remove our own reference from the dockContainer tweens
                        },
                        onCompleteParams: [this, id, tweenId],
                    });
                    this._addDockTween(id, tween, tweenId);
                }
            }, 1000);

            // change cover
            cimg.setAttribute("src", src);
            //cimg.style.left = `calc(100% - ${this.theatreChatCover.offsetHeight}px)`
            cimg.style.width = `${this.theatreChatCover.offsetHeight}px`;
            cimg.style.opacity = "0.3";
            // push focus to chat-message
            let chatMessage = document.getElementById("chat-message");
            chatMessage.focus();
        }
        // send typing event
        this._sendTypingEvent();
        this.setUserTyping(game.user.id, this.speakingAs);
        // re-render the emote menu (expensive)
        this.renderEmoteMenu();
    }

    /**
     * immediately decays a textbox's contents by shifting them down, and
     * fading it away
     *
     * @params theatreId (String) : The theatreId of the textBox we want to decay.
     * @params remote (Boolean) : Wither this is being invoked remotely, or locally.
     */
    decayTextBoxById(theatreId, remote) {
        let insert = this.getInsertById(theatreId);
        let textBox = this._getTextBoxById(theatreId);
        if (!textBox || !insert) return;

        if (!remote && !this.isActorOwner(game.user.id, theatreId)) {
            Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
            return;
        }
        // clear last speaking if present
        KHelpers.removeClass(textBox, "theatre-text-box-lastspeaking");
        textBox.style.background = "";
        textBox.style["box-shadow"] = "";

        // clear decay Timout if present
        if (insert.decayTOId) {
            window.clearTimeout(insert.decayTOId);
            insert.decayTOId = null;
        }
        // kill tweens
        for (let c of textBox.children) {
            for (let sc of c.children) TweenMax.killTweensOf(sc);
            TweenMax.killTweensOf(c);
        }
        TweenMax.killTweensOf(textBox);

        // decay
        TweenMax.to(textBox.children, 0.5, {
            top: this.theatreBar.offsetHeight / 2,
            opacity: 0,
            ease: Power0.easeNone,
            onComplete: function () {
                textBox.textContent = "";
            },
        });

        // Push to socket our event
        if (!remote) {
            Theatre.instance._sendSceneEvent("decaytext", { insertid: theatreId });
        }
    }

    /**
     * Applies the player color to the textbox as
     * a box-shadow, and background highlight.
     *
     * @params textBox (HTMLElement) : The textBox to apply the color to.
     * @params userId (String) : The User's Id.
     * @params color (String) : The CSS color string to use if available.
     */
    applyPlayerColorToTextBox(textBox, userId, color) {
        //let user = game.users.get(userId);
        //let userColor = user.color.replace("#","");
        color = color ? color.replace("#", "") : null || "FFFFFF";

        // break into radix
        let red = parseInt(color.substring(0, 2), 16);
        let green = parseInt(color.substring(2, 4), 16);
        let blue = parseInt(color.substring(4), 16);

        let darkred = Math.max(red - 50, 0);
        let darkgreen = Math.max(green - 50, 0);
        let darkblue = Math.max(blue - 50, 0);

        red = Math.min(red + 75, 255);
        green = Math.min(green + 75, 255);
        blue = Math.min(blue + 75, 255);

        Logger.debug(
            "color %s : red: %s:%s, green %s:%s, blue %s:%s",
            color,
            red,
            darkred,
            green,
            darkgreen,
            blue,
            darkblue,
        );

        // style specific settings
        switch (this.settings.theatreStyle) {
            case "clearbox": {
                textBox.style.cssText += `background: linear-gradient(transparent 0%, rgba(${red},${green},${blue},0.30) 40%, rgba(${red},${green},${blue},0.30) 60%, transparent 100%); box-shadow: 0px 5px 2px 1px rgba(${darkred}, ${darkgreen}, ${darkblue}, 0.30)`;
                break;
            }
            case "mangabubble":
            case "lightbox":
            case "textbox":
            default: {
                textBox.style.cssText += `background: linear-gradient(transparent 0%, rgba(${red},${green},${blue},0.10) 40%, rgba(${red},${green},${blue},0.10) 60%, transparent 100%); box-shadow: 0px 5px 2px 1px rgba(${darkred}, ${darkgreen}, ${darkblue}, .2)`;
                break;
            }
        }
    }

    /**
     * Gets the player 'flash' color that tints the insert as it 'pops.
     *
     * @params userId (String) : The User's Id.
     * @params color (String) : The CSS color string to use if available.
     *
     * @return (String) : The CSS color to be used for the color flash.
     */
    getPlayerFlashColor(userId, color) {
        //let user = game.users.get(userId);
        //let userColor = user.color.replace("#","");
        color = color ? color.replace("#", "") : null || "FFFFFF";

        // break into radix
        let red = parseInt(color.substring(0, 2), 16);
        let green = parseInt(color.substring(2, 4), 16);
        let blue = parseInt(color.substring(4), 16);

        // try to preserve ratios?
        red = Math.min(red + 75, 255);
        green = Math.min(green + 75, 255);
        blue = Math.min(blue + 75, 255);

        red = red.toString(16);
        green = green.toString(16);
        blue = blue.toString(16);

        Logger.debug(`#${red}${green}${blue}`);
        return `#${red}${green}${blue}`;
    }

    /**
     * Apply the font family to the given element
     *
     * @params elem (HTMLElement) : The HTMLElement to apply the font family to.
     * @params fontFamily (String) : The name of the font family to add.
     *
     * @private
     */
    _applyFontFamily(elem, fontFamily) {
        elem.style["font-family"] = `"${fontFamily}", "SignikaBold", "Palatino Linotype", serif`;
        elem.style["font-weight"] = this.fontWeight;
    }

    /**
     * Toggle the narrator bar
     *
     * @param active (Boolean) : Wither to activate or deactive the narrator bar.
     * @param remote (Boolean) : Winter this is being invoked remotely, or locally.
     */
    toggleNarratorBar(active, remote) {
        if (active) {
            // spawn it
            let narratorBackdrop =
                Theatre.instance.theatreNarrator.getElementsByClassName("theatre-narrator-backdrop")[0];
            Logger.debug("NarratorBackdrop ", narratorBackdrop, Theatre.instance.theatreNarrator);
            narratorBackdrop.style.width = "100%";
            Theatre.instance.theatreNarrator.style.opacity = "1";
            Theatre.instance.isNarratorActive = true;
            // check if a navItem is active, if so, deactive it.
            // set speakingAs to "narrator" note that this will need heavy regression testing
            // as it'll be plugging into the insert workflow when it's truely not a real insert
            if (game.user.isGM) {
                let btnNarrator =
                    Theatre.instance.theatreControls.getElementsByClassName("theatre-icon-narrator")[0].parentNode;
                let oldSpeakingItem = Theatre.instance.getNavItemById(Theatre.instance.speakingAs);
                let oldSpeakingInsert = Theatre.instance.getInsertById(Theatre.instance.speakingAs);
                let oldSpeakingLabel = Theatre.instance._getLabelFromInsert(oldSpeakingInsert);

                KHelpers.addClass(btnNarrator, "theatre-control-nav-bar-item-speakingas");
                if (oldSpeakingItem) KHelpers.removeClass(oldSpeakingItem, "theatre-control-nav-bar-item-speakingas");
                if (oldSpeakingInsert) {
                    oldSpeakingInsert.label.tint = 0xffffff;
                    this._removeDockTween(this.speakingAs, null, "nameSpeakingPulse");
                }

                let textFlyin = Theatre.instance.theatreNarrator.getAttribute("textflyin");
                let textStanding = Theatre.instance.theatreNarrator.getAttribute("textstanding");
                let textFont = Theatre.instance.theatreNarrator.getAttribute("textfont");
                let textSize = Theatre.instance.theatreNarrator.getAttribute("textsize");
                let textColor = Theatre.instance.theatreNarrator.getAttribute("textcolor");

                Theatre.instance.theatreNarrator.setAttribute(
                    "textflyin",
                    textFlyin
                        ? textFlyin
                        : Theatre.instance.userEmotes[game.user.id]
                          ? Theatre.instance.userEmotes[game.user.id].textFlyin
                          : null,
                );
                Theatre.instance.theatreNarrator.setAttribute(
                    "textstanding",
                    textStanding
                        ? textStanding
                        : Theatre.instance.userEmotes[game.user.id]
                          ? Theatre.instance.userEmotes[game.user.id].textStanding
                          : null,
                );
                Theatre.instance.theatreNarrator.setAttribute(
                    "textfont",
                    textFont
                        ? textFont
                        : Theatre.instance.userEmotes[game.user.id]
                          ? Theatre.instance.userEmotes[game.user.id].textFont
                          : null,
                );
                Theatre.instance.theatreNarrator.setAttribute(
                    "textsize",
                    textSize
                        ? Number(textSize)
                        : Theatre.instance.userEmotes[game.user.id]
                          ? Number(Theatre.instance.userEmotes[game.user.id].textSize)
                          : null,
                );
                Theatre.instance.theatreNarrator.setAttribute(
                    "textcolor",
                    textColor
                        ? textColor
                        : Theatre.instance.userEmotes[game.user.id]
                          ? Theatre.instance.userEmotes[game.user.id].textColor
                          : null,
                );

                let cimg = Theatre.instance.getTheatreCoverPortrait();
                // clear cover
                cimg.removeAttribute("src");
                cimg.style.opacity = "0";
                // clear typing theatreId data
                Theatre.instance.removeUserTyping(game.user.id);
                Theatre.instance.usersTyping[game.user.id].theatreId = null;
                // Mark speaking as Narrator
                Theatre.instance.speakingAs = CONSTANTS.NARRATOR;
                Theatre.instance.setUserTyping(game.user.id, CONSTANTS.NARRATOR);
                // push focus to chat-message
                let chatMessage = document.getElementById("chat-message");
                chatMessage.focus();
                // send event to triggier the narrator bar
                if (!remote) Theatre.instance._sendSceneEvent("narrator", { active: true });
                // re-render the emote menu (expensive)
                Theatre.instance.renderEmoteMenu();
            }
        } else {
            // remove it
            let narratorBackdrop =
                Theatre.instance.theatreNarrator.getElementsByClassName("theatre-narrator-backdrop")[0];
            let narratorContent =
                Theatre.instance.theatreNarrator.getElementsByClassName("theatre-narrator-content")[0];
            Logger.debug("NarratorBackdrop ", narratorBackdrop, Theatre.instance.theatreNarrator);
            narratorBackdrop.style.width = "0%";
            Theatre.instance.theatreNarrator.style.opacity = "0";
            Theatre.instance.isNarratorActive = false;
            // kill animations
            for (let c of narratorContent.children) {
                for (let sc of c.children) TweenMax.killTweensOf(sc);
                TweenMax.killTweensOf(c);
            }
            for (let c of narratorContent.children) c.parentNode.removeChild(c);
            TweenMax.killTweensOf(narratorContent);
            narratorContent.style["overflow-y"] = "scroll";
            narratorContent.style["overflow-x"] = "hidden";

            // Logger.debug("all tweens", TweenMax.getAllTweens());
            narratorContent.textContent = "";

            if (game.user.isGM) {
                let btnNarrator =
                    Theatre.instance.theatreControls.getElementsByClassName("theatre-icon-narrator")[0].parentNode;
                KHelpers.removeClass(btnNarrator, "theatre-control-nav-bar-item-speakingas");
                // clear narrator
                Theatre.instance.speakingAs = null;
                Theatre.instance.removeUserTyping(game.user.id);
                Theatre.instance.usersTyping[game.user.id].theatreId = null;
                // send event to turn off the narrator bar
                if (!remote) Theatre.instance._sendSceneEvent("narrator", { active: false });
                // re-render the emote menu (expensive)
                Theatre.instance.renderEmoteMenu();
            }
        }
    }

    /**
     * Render the emote menu
     */
    renderEmoteMenu() {
        // each actor may have a different emote set
        // get actor emote set for currently speaking emote, else use the default set
        let actorId = Theatre.instance.speakingAs
            ? Theatre.instance.speakingAs.replace(CONSTANTS.PREFIX_ACTOR_ID, "")
            : null;
        let insert = Theatre.instance.getInsertById(Theatre.instance.speakingAs);
        let actor;
        if (actorId) {
            actor = game.actors.get(actorId);
        }
        let emotes = Theatre.getActorEmotes(actorId);
        let fonts = Theatre.FONTS;
        let textFlyin = Theatre.FLYIN_ANIMS;
        let textStanding = Theatre.STANDING_ANIMS;
        let sideBar = document.getElementById("sidebar");
        renderTemplate("modules/theatre/templates/emote_menu.html", {
            emotes,
            textFlyin,
            textStanding,
            fonts,
        }).then((template) => {
            Logger.debug("emote window template rendered");
            Theatre.instance.theatreEmoteMenu.style.top = `${Theatre.instance.theatreControls.offsetTop - 410}px`;
            Theatre.instance.theatreEmoteMenu.innerHTML = template;

            let wheelFunc = function (ev) {
                //Logger.debug("wheel on text-box",ev.currentTarget.scrollTop,ev.deltaY,ev.deltaMode);
                let pos = ev.deltaY > 0;
                ev.currentTarget.scrollTop += pos ? 10 : -10;
                ev.preventDefault();
                ev.stopPropagation();
            };
            let wheelFunc2 = function (ev) {
                //Logger.debug("wheel on text-anim",ev.currentTarget.parentNode.scrollTop,ev.deltaY,ev.deltaMode);
                let pos = ev.deltaY > 0;
                ev.currentTarget.parentNode.scrollTop += pos ? 10 : -10;
                ev.preventDefault();
                ev.stopPropagation();
            };

            // bind handlers for the font/size/color selectors
            let sizeSelect = Theatre.instance.theatreEmoteMenu.getElementsByClassName("sizeselect")[0];
            let colorSelect = Theatre.instance.theatreEmoteMenu.getElementsByClassName("colorselect")[0];
            let fontSelect = Theatre.instance.theatreEmoteMenu.getElementsByClassName("fontselect")[0];
            //Logger.debug("Selectors found: ",sizeSelect,colorSelect,fontSelect);

            // assign font from insert
            if (insert && insert.textFont) {
                //if (fonts.includes(insert.textFont)) fontSelect.value = insert.textFont;
                //else fontSelect.value = fonts[0];
                fontSelect.value = insert.textFont;
            } else if (
                Theatre.instance.userEmotes[game.user.id] &&
                Theatre.instance.userEmotes[game.user.id].textFont
            ) {
                //if (fonts.includes(Theatre.instance.userEmotes[game.user.id].textFont))
                //fontSelect.value = Theatre.instance.userEmotes[game.user.id].textFont;
                //else
                //fontSelect.value = fonts[0];
                fontSelect.value = Theatre.instance.userEmotes[game.user.id].textFont;
                if (insert) insert.textFont = fontSelect.value;
            } else {
                fontSelect.value = fonts[0];
            }
            // assign color from insert
            if (insert && insert.textColor) {
                colorSelect.value = insert.textColor;
            } else if (
                Theatre.instance.userEmotes[game.user.id] &&
                Theatre.instance.userEmotes[game.user.id].textColor
            ) {
                colorSelect.value = Theatre.instance.userEmotes[game.user.id].textColor;
                if (insert) insert.textColor = colorSelect.value;
            }
            // assgin font size
            let sizeIcon = document.createElement("div");
            let sizeValue = 2;
            if (insert) sizeValue = insert.textSize;
            else if (Theatre.instance.userEmotes[game.user.id])
                sizeValue = Number(Theatre.instance.userEmotes[game.user.id].textSize);

            switch (sizeValue) {
                case 3:
                    KHelpers.addClass(sizeIcon, "theatre-icon-fontsize-large");
                    break;
                case 1:
                    KHelpers.addClass(sizeIcon, "theatre-icon-fontsize-small");
                    break;
                default:
                    KHelpers.addClass(sizeIcon, "theatre-icon-fontsize-medium");
                    break;
            }
            sizeSelect.appendChild(sizeIcon);

            sizeSelect.addEventListener("click", (ev) => {
                let insert = Theatre.instance.getInsertById(Theatre.instance.speakingAs);
                let icon = sizeSelect.children[0];
                let value = 2;
                if (insert) value = insert.textSize;
                else if (Theatre.instance.userEmotes[game.user.id])
                    value = Number(Theatre.instance.userEmotes[game.user.id].textSize);

                switch (value) {
                    case 3:
                        KHelpers.removeClass(icon, "theatre-icon-fontsize-large");
                        KHelpers.addClass(icon, "theatre-icon-fontsize-medium");
                        value = 2;
                        break;
                    case 1:
                        KHelpers.removeClass(icon, "theatre-icon-fontsize-small");
                        KHelpers.addClass(icon, "theatre-icon-fontsize-large");
                        value = 3;
                        break;
                    default:
                        KHelpers.removeClass(icon, "theatre-icon-fontsize-medium");
                        KHelpers.addClass(icon, "theatre-icon-fontsize-small");
                        value = 1;
                        break;
                }
                Theatre.instance.setUserEmote(game.user.id, Theatre.instance.speakingAs, "textsize", value);
            });
            fontSelect.addEventListener("change", (ev) => {
                Theatre.instance.setUserEmote(
                    game.user.id,
                    Theatre.instance.speakingAs,
                    "textfont",
                    ev.currentTarget.value,
                );
                Theatre.instance.renderEmoteMenu();
            });
            colorSelect.addEventListener("change", (ev) => {
                Theatre.instance.setUserEmote(
                    game.user.id,
                    Theatre.instance.speakingAs,
                    "textcolor",
                    ev.currentTarget.value,
                );
            });

            // Apply our language specific fonts to the template
            // OR apply the font specified by the insert
            let headers = Theatre.instance.theatreEmoteMenu.getElementsByTagName("h2");
            let textAnims = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textanim");
            for (let e of headers) Theatre.instance._applyFontFamily(e, Theatre.instance.titleFont);
            for (let e of textAnims) {
                let font = fontSelect.value;
                Theatre.instance._applyFontFamily(e, font);
                e.addEventListener("wheel", wheelFunc2);
            }

            // bind click listeners for the textanim elements to animate a preview
            // hover-off will reset the text content
            let flyinBox = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textflyin-box")[0];
            flyinBox = flyinBox.getElementsByClassName("theatre-container-column")[0];
            let standingBox = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textstanding-box")[0];
            standingBox = standingBox.getElementsByClassName("theatre-container-column")[0];

            flyinBox.addEventListener("wheel", wheelFunc);
            standingBox.addEventListener("wheel", wheelFunc);

            for (let child of flyinBox.children) {
                // get animation function
                // bind annonomous click listener
                child.addEventListener("mouseover", (ev) => {
                    let text = ev.currentTarget.getAttribute("otext");
                    let anim = ev.currentTarget.getAttribute("name");
                    //Logger.debug("child text: ",text,ev.currentTarget);
                    ev.currentTarget.textContent = "";
                    let charSpans = Theatre.splitTextBoxToChars(text, ev.currentTarget);
                    textFlyin[anim].func.call(this, charSpans, 0.5, 0.05, null);
                });
                child.addEventListener("mouseout", (ev) => {
                    for (let c of ev.currentTarget.children) {
                        for (let sc of c.children) TweenMax.killTweensOf(sc);
                        TweenMax.killTweensOf(c);
                    }
                    for (let c of ev.currentTarget.children) c.parentNode.removeChild(c);
                    TweenMax.killTweensOf(child);
                    child.style["overflow-y"] = "scroll";
                    child.style["overflow-x"] = "hidden";
                    //Logger.debug("all tweens",TweenMax.getAllTweens());
                    ev.currentTarget.textContent = ev.currentTarget.getAttribute("otext");
                });
                // bind text anim type
                child.addEventListener("mouseup", (ev) => {
                    if (ev.button == 0) {
                        if (KHelpers.hasClass(ev.currentTarget, "textflyin-active")) {
                            KHelpers.removeClass(ev.currentTarget, "textflyin-active");
                            Theatre.instance.setUserEmote(game.user.id, Theatre.instance.speakingAs, "textflyin", null);
                        } else {
                            let lastActives =
                                Theatre.instance.theatreEmoteMenu.getElementsByClassName("textflyin-active");
                            for (let la of lastActives) KHelpers.removeClass(la, "textflyin-active");
                            //if (insert || Theatre.instance.speakingAs == CONSTANTS.NARRATOR) {
                            KHelpers.addClass(ev.currentTarget, "textflyin-active");
                            Theatre.instance.setUserEmote(
                                game.user.id,
                                Theatre.instance.speakingAs,
                                "textflyin",
                                ev.currentTarget.getAttribute("name"),
                            );
                            //}
                        }
                        // push focus to chat-message
                        let chatMessage = document.getElementById("chat-message");
                        chatMessage.focus();
                    }
                });
                // check if this child is our configured 'text style'
                let childTextMode = child.getAttribute("name");
                if (insert) {
                    let insertTextMode = insert.textFlyin;
                    if (insertTextMode && insertTextMode == childTextMode) {
                        KHelpers.addClass(child, "textflyin-active");
                        // scroll to
                        //TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
                        flyinBox.scrollTop = child.offsetTop - Math.max(flyinBox.offsetHeight / 2, 0);
                    }
                } else if (Theatre.instance.speakingAs == CONSTANTS.NARRATOR) {
                    let insertTextMode = Theatre.instance.theatreNarrator.getAttribute("textflyin");
                    if (insertTextMode && insertTextMode == childTextMode) {
                        KHelpers.addClass(child, "textflyin-active");
                        // scroll to
                        //TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
                        flyinBox.scrollTop = child.offsetTop - Math.max(flyinBox.offsetHeight / 2, 0);
                    }
                } else if (
                    !insert &&
                    Theatre.instance.userEmotes[game.user.id] &&
                    child.getAttribute("name") == Theatre.instance.userEmotes[game.user.id].textFlyin
                ) {
                    KHelpers.addClass(child, "textflyin-active");
                    // scroll to
                    //TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
                    flyinBox.scrollTop = child.offsetTop - Math.max(flyinBox.offsetHeight / 2, 0);
                }
            }

            for (let child of standingBox.children) {
                // get animation function
                // bind annonomous click listener
                child.addEventListener("mouseover", (ev) => {
                    let text = ev.currentTarget.getAttribute("otext");
                    let anim = ev.currentTarget.getAttribute("name");
                    //Logger.debug("child text: ",text,ev.currentTarget);
                    ev.currentTarget.textContent = "";
                    let charSpans = Theatre.splitTextBoxToChars(text, ev.currentTarget);
                    textFlyin["typewriter"].func.call(
                        this,
                        charSpans,
                        0.5,
                        0.05,
                        textStanding[anim] ? textStanding[anim].func : null,
                    );
                });
                child.addEventListener("mouseout", (ev) => {
                    for (let c of ev.currentTarget.children) {
                        for (let sc of c.children) TweenMax.killTweensOf(sc);
                        TweenMax.killTweensOf(c);
                    }
                    for (let c of ev.currentTarget.children) c.parentNode.removeChild(c);
                    TweenMax.killTweensOf(child);
                    child.style["overflow-y"] = "scroll";
                    child.style["overflow-x"] = "hidden";
                    //Logger.debug("all tweens",TweenMax.getAllTweens());
                    ev.currentTarget.textContent = ev.currentTarget.getAttribute("otext");
                });
                // bind text anim type
                child.addEventListener("mouseup", (ev) => {
                    if (ev.button == 0) {
                        if (KHelpers.hasClass(ev.currentTarget, "textstanding-active")) {
                            KHelpers.removeClass(ev.currentTarget, "textstanding-active");
                            Theatre.instance.setUserEmote(
                                game.user.id,
                                Theatre.instance.speakingAs,
                                "textstanding",
                                null,
                            );
                        } else {
                            let lastActives =
                                Theatre.instance.theatreEmoteMenu.getElementsByClassName("textstanding-active");
                            for (let la of lastActives) KHelpers.removeClass(la, "textstanding-active");
                            //if (insert || Theatre.instance.speakingAs == CONSTANTS.NARRATOR) {
                            KHelpers.addClass(ev.currentTarget, "textstanding-active");
                            Theatre.instance.setUserEmote(
                                game.user.id,
                                Theatre.instance.speakingAs,
                                "textstanding",
                                ev.currentTarget.getAttribute("name"),
                            );
                            //}
                        }
                        // push focus to chat-message
                        let chatMessage = document.getElementById("chat-message");
                        chatMessage.focus();
                    }
                });
                // check if this child is our configured 'text style'
                let childTextMode = child.getAttribute("name");
                if (insert) {
                    let insertTextMode = insert.textStanding;
                    if (insertTextMode && insertTextMode == childTextMode) {
                        KHelpers.addClass(child, "textstanding-active");
                        //TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
                        standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
                    }
                } else if (Theatre.instance.speakingAs == CONSTANTS.NARRATOR) {
                    let insertTextMode = Theatre.instance.theatreNarrator.getAttribute("textstanding");
                    if (insertTextMode && insertTextMode == childTextMode) {
                        KHelpers.addClass(child, "textstanding-active");
                        // scroll to
                        //TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
                        standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
                    }
                } else if (
                    Theatre.instance.userEmotes[game.user.id] &&
                    child.getAttribute("name") == Theatre.instance.userEmotes[game.user.id].textStanding
                ) {
                    KHelpers.addClass(child, "textstanding-active");
                    // scroll to
                    //TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
                    standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
                }
            }

            // If speaking as theatre, minimize away the emote section
            let emoteBox = Theatre.instance.theatreEmoteMenu.getElementsByClassName("emote-box")[0];
            let emContainer = emoteBox.getElementsByClassName("theatre-container-tiles")[0];
            if (Theatre.instance.speakingAs == CONSTANTS.NARRATOR) {
                emoteBox.style.cssText += "flex: 0 0 40px";
                let emLabel = emoteBox.getElementsByTagName("h2")[0];
                fontSelect.style["max-width"] = "unset";
                emContainer.style.display = "none";
                emLabel.style.display = "none";
            } else {
                // configure handles to bind emote selection
                let emoteBtns = Theatre.instance.theatreEmoteMenu.getElementsByClassName("emote");
                for (let child of emoteBtns) {
                    //bind annomous click listener
                    child.addEventListener("mouseup", (ev) => {
                        if (ev.button == 0) {
                            let emName = ev.currentTarget.getAttribute("name");
                            Logger.debug("em name: %s was clicked", emName);
                            if (KHelpers.hasClass(ev.currentTarget, "emote-active")) {
                                KHelpers.removeClass(ev.currentTarget, "emote-active");
                                // if speaking set to base
                                Theatre.instance.setUserEmote(game.user.id, Theatre.instance.speakingAs, "emote", null);
                            } else {
                                let lastActives =
                                    Theatre.instance.theatreEmoteMenu.getElementsByClassName("emote-active");
                                for (let la of lastActives) KHelpers.removeClass(la, "emote-active");
                                KHelpers.addClass(ev.currentTarget, "emote-active");
                                // if speaking, then set our emote!
                                Theatre.instance.setUserEmote(
                                    game.user.id,
                                    Theatre.instance.speakingAs,
                                    "emote",
                                    emName,
                                );
                            }
                            // push focus to chat-message
                            let chatMessage = document.getElementById("chat-message");
                            chatMessage.focus();
                        }
                    });
                    // bind mouseenter Listener
                    child.addEventListener("mouseenter", (ev) => {
                        Theatre.instance.configureTheatreToolTip(
                            Theatre.instance.speakingAs,
                            ev.currentTarget.getAttribute("name"),
                        );
                    });
                    // check if this child is our configured 'emote'
                    let childEmote = child.getAttribute("name");
                    if (insert) {
                        // if we have an insert we're speaking through, we should get that emote state instead
                        // if the insert has no emote state, neither should we despite user settings
                        let insertEmote = insert.emote;
                        if (insertEmote && insertEmote == childEmote) {
                            KHelpers.addClass(child, "emote-active");
                            //emContainer.scrollTop = child.offsetTop-Math.max(emContainer.offsetHeight/2,0);
                        }
                        // we should 'highlight' emotes that at least have a base insert
                        if (emotes[childEmote] && emotes[childEmote].insert) KHelpers.addClass(child, "emote-imgavail");
                    }
                    if (
                        !insert &&
                        Theatre.instance.userEmotes[game.user.id] &&
                        childEmote == Theatre.instance.userEmotes[game.user.id].emote
                    ) {
                        KHelpers.addClass(child, "emote-active");
                        //emContainer.scrollTop = child.offsetTop-Math.max(emContainer.offsetHeight/2,0);
                    }
                }
                // bind mouseleave Listener
                emoteBtns[0].parentNode.addEventListener("mouseleave", (ev) => {
                    Theatre.instance.theatreToolTip.style.opacity = 0;
                });
            }
        });
    }

    /**
     * ============================================================
     *
     * Internal Theatre handlers
     *
     * ============================================================
     */

    /**
     * Handle the window resize eventWindow was resized
     *
     * @param ev (Event) : Event that triggered this handler
     */
    handleWindowResize(ev) {
        TheatreHelpers.resizeBars(ui.sidebar._collapsed);

        // emote menu
        if (Theatre.instance.theatreEmoteMenu)
            Theatre.instance.theatreEmoteMenu.style.top = `${Theatre.instance.theatreControls.offsetTop - 410}px`;
        /*
		Theatre.instance.theatreToolTip.style.top = `${Theatre.instance.theatreControls.offsetTop-Theatre.instance.theatreToolTip.offsetHeight}px`
		Theatre.instance.theatreToolTip.style.left = `${sideBar.offsetLeft - Theatre.instance.theatreToolTip.offsetWidth}px`
		*/

        let app = Theatre.instance.pixiCTX;
        let dockWidth = Theatre.instance.theatreDock.offsetWidth;
        let dockHeight = Theatre.instance.theatreDock.offsetHeight;
        Theatre.instance.theatreDock.setAttribute("width", dockWidth);
        Theatre.instance.theatreDock.setAttribute("height", dockHeight);
        app.width = dockWidth;
        app.height = dockHeight;
        app.renderer.view.width = dockWidth;
        app.renderer.view.height = dockHeight;
        app.renderer.resize(dockWidth, dockHeight);
        //app.render();
        if (!Theatre.instance.rendering) Theatre.instance._renderTheatre(performance.now());
    }

    /**
     * Store mouse position for our tooltip which will roam
     *
     * @param ev (Event) : The Event that triggered the mouse move.
     */
    handleEmoteMenuMouseMove(ev) {
        Theatre.instance.theatreToolTip.style.top = `${
            (ev.clientY || ev.pageY) - Theatre.instance.theatreToolTip.offsetHeight - 20
        }px`;
        Theatre.instance.theatreToolTip.style.left = `${Math.min(
            (ev.clientX || ev.pageX) - Theatre.instance.theatreToolTip.offsetWidth / 2,
            Theatre.instance.theatreDock.offsetWidth - Theatre.instance.theatreToolTip.offsetWidth,
        )}px`;
    }

    /**
     * Handle the emote click
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleBtnEmoteClick(ev) {
        Logger.debug("emote click");

        if (KHelpers.hasClass(ev.currentTarget, "theatre-control-btn-down")) {
            Theatre.instance.theatreEmoteMenu.style.display = "none";
            KHelpers.removeClass(ev.currentTarget, "theatre-control-btn-down");
        } else {
            Theatre.instance.renderEmoteMenu();
            Theatre.instance.theatreEmoteMenu.style.display = "flex";
            KHelpers.addClass(ev.currentTarget, "theatre-control-btn-down");
        }
    }

    /**
     * Handle chat-message focusOut
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleChatMessageFocusOut(ev) {
        KHelpers.removeClass(Theatre.instance.theatreChatCover, "theatre-control-chat-cover-ooc");
    }

    /**
     * Handle chat-message keyUp
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleChatMessageKeyUp(ev) {
        if (
            !ev.repeat &&
            //&& Theatre.instance.speakingAs
            ev.key == "Control"
        )
            KHelpers.removeClass(Theatre.instance.theatreChatCover, "theatre-control-chat-cover-ooc");
    }

    /**
     * Handle key-down events in the #chat-message area to fire
     * "typing" events to connected clients
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleChatMessageKeyDown(ev) {
        const context = KeyboardManager.getKeyboardEventContext(ev);
        const actions = KeyboardManager._getMatchingActions(context);
        for (const action of actions) {
            if (!action.action.includes(CONSTANTS.MODULE_ID)) {
                continue;
            }
            action.onDown.call(context);
        }

        let now = Date.now();

        if (
            !ev.repeat &&
            //&& Theatre.instance.speakingAs
            ev.key == "Control"
        ) {
            KHelpers.addClass(Theatre.instance.theatreChatCover, "theatre-control-chat-cover-ooc");
        }
        if (now - Theatre.instance.lastTyping < 3000) {
            return;
        }
        if (ev.key == "Enter" || ev.key == "Alt" || ev.key == "Shift" || ev.key == "Control") {
            return;
        }
        Logger.debug("keydown in chat-message");
        Theatre.instance.lastTyping = now;
        Theatre.instance.setUserTyping(game.user.id, Theatre.instance.speakingAs);
        Theatre.instance._sendTypingEvent();
    }

    /**
     * Handle the narrator click
     *
     * NOTE: this has issues with multiple GMs since the narrator bar currently works as a
     * "shim" in that it pretends to be a proper insert for text purposes only.
     *
     * If another GM activates another charater, it will minimize the bar for a GM that is trying
     * to use the bar
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleBtnNarratorClick(ev) {
        Logger.debug("narrator click");

        if (KHelpers.hasClass(ev.currentTarget, "theatre-control-nav-bar-item-speakingas")) {
            Theatre.instance.toggleNarratorBar(false);
        } else {
            Theatre.instance.toggleNarratorBar(true);
        }
    }

    /**
     * Handle the CutIn toggle click
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleBtnCinemaClick(ev) {
        Logger.debug("cinema click");
        Logger.info(game.i18n.localize("Theatre.NotYet"), true);
        /*
		if (KHelpers.hasClass(ev.currentTarget,"theatre-control-small-btn-down")) {
			KHelpers.removeClass(ev.currentTarget,"theatre-control-small-btn-down");
		} else {
			KHelpers.addClass(ev.currentTarget,"theatre-control-small-btn-down");
			Logger.info(game.i18n.localize("Theatre.NotYet"), true);
		}
		*/
    }

    /**
     * Handle the Delay Emote toggle click
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleBtnDelayEmoteClick(ev) {
        Logger.debug("delay emote click");

        if (Theatre.instance.isDelayEmote) {
            if (KHelpers.hasClass(ev.currentTarget, "theatre-control-small-btn-down")) {
                KHelpers.removeClass(ev.currentTarget, "theatre-control-small-btn-down");
            }
            Theatre.instance.isDelayEmote = false;
        } else {
            if (!KHelpers.hasClass(ev.currentTarget, "theatre-control-small-btn-down")) {
                KHelpers.addClass(ev.currentTarget, "theatre-control-small-btn-down");
            }
            Theatre.instance.isDelayEmote = true;
        }
        // push focus to chat-message
        let chatMessage = document.getElementById("chat-message");
        chatMessage.focus();
    }

    /**
     * Handle the Quote toggle click
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleBtnQuoteClick(ev) {
        Logger.debug("quote click");

        if (Theatre.instance.isQuoteAuto) {
            if (KHelpers.hasClass(ev.currentTarget, "theatre-control-small-btn-down"))
                KHelpers.removeClass(ev.currentTarget, "theatre-control-small-btn-down");
            Theatre.instance.isQuoteAuto = false;
        } else {
            if (!KHelpers.hasClass(ev.currentTarget, "theatre-control-small-btn-down"))
                KHelpers.addClass(ev.currentTarget, "theatre-control-small-btn-down");
            Theatre.instance.isQuoteAuto = true;
        }
        // push focus to chat-message
        let chatMessage = document.getElementById("chat-message");
        chatMessage.focus();
    }

    /**
     * Handle the resync click
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleBtnResyncClick(ev) {
        Logger.debug("resync click");
        if (game.user.isGM) {
            Theatre.instance._sendResyncRequest("players");
            Logger.info(game.i18n.localize("Theatre.UI.Notification.ResyncGM"), true);
        } else {
            Theatre.instance._sendResyncRequest("gm");
        }
    }

    /**
     * Handle the supression click
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleBtnSuppressClick(ev) {
        Logger.debug("suppression click");
        if (Theatre.instance.isSuppressed) {
            if (KHelpers.hasClass(ev.currentTarget, "theatre-control-btn-down")) {
                KHelpers.removeClass(ev.currentTarget, "theatre-control-btn-down");
            }
        } else {
            KHelpers.addClass(ev.currentTarget, "theatre-control-btn-down");
        }
        Theatre.instance.updateSuppression(!Theatre.instance.isSuppressed);
    }

    updateSuppression(suppress) {
        Theatre.instance.isSuppressed = suppress;

        let primeBar = document.getElementById("theatre-prime-bar");
        let secondBar = document.getElementById("theatre-second-bar");
        if (Theatre.instance.isSuppressed) {
            let combatActive = game.combats.active;
            Theatre.instance.isSuppressed = true;
            //Theatre.instance.theatreGroup.style.opacity = (combatActive ? "0.05" : "0.20");
            Theatre.instance.theatreDock.style.opacity = combatActive ? "0.05" : "0.20";
            Theatre.instance.theatreBar.style.opacity = combatActive ? "0.05" : "0.20";
            Theatre.instance.theatreNarrator.style.opacity = combatActive ? "0.05" : "0.20";

            primeBar.style["pointer-events"] = "none";
            secondBar.style["pointer-events"] = "none";
        } else {
            //Theatre.instance.theatreGroup.style.opacity = "1";
            Theatre.instance.theatreDock.style.opacity = "1";
            Theatre.instance.theatreBar.style.opacity = "1";
            Theatre.instance.theatreNarrator.style.opacity = "1";

            primeBar.style["pointer-events"] = "all";
            secondBar.style["pointer-events"] = "all";
        }

        // call hooks
        Hooks.call("theatreSuppression", Theatre.instance.isSuppressed);
    }

    /**
     * Handle naveBar Wheel
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleNavBarWheel(ev) {
        ev.preventDefault();
        let pos = ev.deltaY > 0;
        ev.currentTarget.scrollLeft += pos ? 10 : -10;
        //ev.currentTarget.scrollLeft -= ev.deltaY/4;
    }

    /**
     * Handle textBox Mouse Double Click
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleTextBoxMouseDoubleClick(ev) {
        Logger.debug("MOUSE DOUBLE CLICK");
        let id = ev.currentTarget.getAttribute("imgId");
        Theatre.instance.resetInsertById(id);
    }

    /**
     * Handle window mouse up
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleWindowMouseUp(ev) {
        // finish moving insert
        Logger.debug("WINDOW MOUSE UP");

        let x = ev.clientX || ev.pageX;
        let y = ev.clientY || ev.pageY;

        let insert = Theatre.instance.dragPoint.insert;
        let box = Theatre.instance.dragPoint.box;
        let ix = Theatre.instance.dragPoint.ix;
        let iy = Theatre.instance.dragPoint.iy;
        let ox = Theatre.instance.dragPoint.oleft;
        let oy = Theatre.instance.dragPoint.otop;

        let dx = x - ix + ox;
        let dy = y - iy + oy;

        if (dx < box.minleft) dx = box.minleft;
        if (dx > box.maxleft) dx = box.maxleft;
        if (dy > box.maxtop) dy = box.maxtop;
        if (dy < box.mintop) dy = box.mintop;

        Logger.debug(
            "WINDOW MOUSE UP FINAL x: " +
                x +
                " y: " +
                y +
                " ix: " +
                ix +
                " iy: " +
                iy +
                " dx: " +
                dx +
                " dy: " +
                dy +
                " ox: " +
                ox +
                " oy: " +
                oy,
        );
        //port.style.left = `${dx}px`;
        //port.style.top = `${dy}px`;
        //insert.portraitContainer.x = dx;
        //insert.portraitContainer.y = dy;
        if (!insert.dockContainer || !insert.portraitContainer) {
            Logger.error("ERROR: insert dockContainer or portrait is INVALID");
            window.removeEventListener("mouseup", Theatre.instance.handleWindowMouseUp);
            return;
        }

        let tweenId = "portraitMove";
        let tween = TweenMax.to(insert.portraitContainer, 0.5, {
            pixi: { x: dx, y: dy },
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
            position: { x: dx, y: dy, mirror: insert.mirrored },
        });

        window.removeEventListener("mouseup", Theatre.instance.handleWindowMouseUp);
        Theatre.instance.dragPoint = null;
        // push focus to chat-message
        let chatMessage = document.getElementById("chat-message");
        chatMessage.focus();
    }

    /**
     * Handle textBox MouseDown
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleTextBoxMouseDown(ev) {
        Logger.debug("MOUSE DOWN ", ev.buttons, ev.button);
        let id = ev.currentTarget.getAttribute("imgId");

        if (ev.button == 0) {
            if (!ev.ctrlKey && !ev.shiftKey && !ev.altKey) {
                // if old dragPoint exists reset the style, and clear any interval that may exist
                if (!!Theatre.instance.dragPoint && !!Theatre.instance.dragPoint.insert) {
                    Logger.warn("PREXISTING DRAGPOINT!", false);
                    //Theatre.instance.dragPoint.port.style.transition = "top 0.5s ease, left 0.5s ease, transform 0.5s ease";
                }
                // calculate bouding box
                let boundingBox = {};
                let insert = Theatre.instance.getInsertById(id);

                // permission check
                if (!Theatre.instance.isActorOwner(game.user.id, insert.imgId)) {
                    Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
                    return;
                }

                // max top is half natural height
                // min top is zero to prevent it from losing it's flush
                // max left is half natural width
                // min left is - half natural width
                boundingBox["maxtop"] = insert.optAlign == "top" ? 0 : insert.portrait.height;
                boundingBox["mintop"] = insert.portrait.height / 2;
                boundingBox["maxleft"] = (insert.portrait.width * 3) / 2;
                boundingBox["minleft"] = 0;

                // original cooords
                //let portStyles = KHelpers.style(port);
                let origX = insert.portraitContainer.x;
                let origY = insert.portraitContainer.y;

                Logger.debug(
                    "STORING DRAG POINT",
                    ev.clientX || ev.pageX,
                    ev.clientY || ev.PageY,
                    boundingBox,
                    origX,
                    origY,
                );

                // change the transition style while we're dragging
                //port.style.transition = "top 0.5s ease, left 0.5s ease, transform 0.5s ease";

                // normal mouse down, start "drag" tracking
                Theatre.instance.dragPoint = {
                    otop: origY,
                    oleft: origX,
                    ix: ev.clientX || ev.pageX,
                    iy: ev.clientY || ev.pageY,
                    insert: insert,
                    box: boundingBox,
                };
                // bind listeners
                window.removeEventListener("mouseup", Theatre.instance.handleWindowMouseUp);
                window.addEventListener("mouseup", Theatre.instance.handleWindowMouseUp);
                ev.stopPropagation();
            }
        } else if (ev.button == 2) {
            Theatre.instance.swapTarget = id;
            ev.stopPropagation();
        }
    }

    /**
     * Handle textBox mouse up
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleTextBoxMouseUp(ev) {
        Logger.debug("MOUSE UP ", ev.buttons, ev.button);
        let id = ev.currentTarget.getAttribute("imgId");
        let chatMessage = document.getElementById("chat-message");
        if (ev.button == 0) {
            if (ev.ctrlKey) {
                Theatre.instance.decayTextBoxById(id);
                ev.stopPropagation();
            } else if (ev.shiftKey) {
                Theatre.instance.pushInsertById(id, true);
                chatMessage.focus();
                ev.stopPropagation();
            } else if (ev.altKey) {
                // activate navitem
                // activate insert
                Theatre.instance.activateInsertById(id, ev);
            }
        } else if (ev.button == 2) {
            if (ev.ctrlKey) {
                Theatre.instance.removeInsertById(id);
                ev.stopPropagation();
            } else if (ev.shiftKey) {
                if (Theatre.instance.swapTarget && Theatre.instance.swapTarget != id) {
                    Theatre.instance.swapInsertsById(id, Theatre.instance.swapTarget);
                    Theatre.instance.swapTarget = null;
                } else {
                    Theatre.instance.pushInsertById(id, false);
                }
                chatMessage.focus();
                ev.stopPropagation();
            } else if (ev.altKey) {
                let actor = game.actors.get(id.replace(CONSTANTS.PREFIX_ACTOR_ID, ""));
                Theatre.addToNavBar(actor);
            } else if (Theatre.instance.swapTarget) {
                if (Theatre.instance.swapTarget != id) {
                    //Theatre.instance.swapInsertsById(id,Theatre.instance.swapTarget);
                    Theatre.instance.moveInsertById(id, Theatre.instance.swapTarget);
                    Theatre.instance.swapTarget = null;
                } else {
                    Theatre.instance.mirrorInsertById(id);
                }
                ev.stopPropagation();
                chatMessage.focus();
                Theatre.instance.swapTarget = null;
            }
        }
    }

    /**
     * Handle a nav item dragstart
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleNavItemDragStart(ev) {
        //ev.preventDefault();
        ev.dataTransfer.clearData("text/plain");
        ev.dataTransfer.clearData("text/html");
        ev.dataTransfer.clearData("text/uri-list");
        ev.dataTransfer.dropEffect = "move";
        ev.dataTransfer.setDragImage(ev.currentTarget, 16, 16);
        Theatre.instance.dragNavItem = ev.currentTarget;
    }

    /**
     * Handle a nav item dragend
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleNavItemDragEnd(ev) {
        ev.preventDefault();
        Theatre.instance.dragNavItem = null;
    }

    /**
     * Handle a nav item dragover
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleNavItemDragOver(ev) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "move";
    }

    /**
     * Handle a nav item dragdrop
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleNavItemDragDrop(ev) {
        ev.preventDefault();
        KHelpers.insertBefore(Theatre.instance.dragNavItem, ev.currentTarget);
    }

    /**
     * Handle mouse up on navItems
     *
     * @param ev (Event) : The Event that triggered this handler
     */
    handleNavItemMouseUp(ev) {
        let navItem = ev.currentTarget;
        let id = ev.currentTarget.getAttribute("imgId");
        let actorId = id.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        let params = Theatre.instance._getInsertParamsFromActorId(actorId);
        if (!params) {
            Logger.error("ERROR, actorId %s does not exist!", true, actorId);
            // remove the nav Item
            ev.currentTarget.parentNode.removeChild(ev.currentTarget);
            return;
        }

        Logger.debug("Button UP on nav add?", ev.button);

        switch (ev.button) {
            case 0:
                Theatre.instance.activateInsertById(id, ev);
                break;
            case 2:
                let removed = Theatre.instance.removeInsertById(id);
                let cimg = Theatre.instance.getTheatreCoverPortrait();
                if (ev.ctrlKey) {
                    // unstage the actor
                    Theatre.instance._removeFromStage(id);
                    return;
                }
                if (!removed) {
                    let src = params.src;
                    let name = params.name;
                    let optAlign = params.optalign;
                    let emotions;

                    // determine if to launch with actor saves or default settings
                    if (ev.altKey) emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params, true);
                    else emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params);

                    if (!ev.shiftKey) {
                        if (game.user.isGM) Theatre.instance.injectLeftPortrait(src, name, id, optAlign, emotions);
                        else Theatre.instance.injectRightPortrait(src, name, id, optAlign, emotions);
                    } else Theatre.instance.injectRightPortrait(src, name, id, optAlign, emotions);
                }
                break;
        }
    }

    /**
     * ============================================================
     *
     * Theatre statics
     *
     * ============================================================
     */

    /**
     * Reorder theatre inserts in the dockContainer to align with where their
     * text-box's position is on the bar such that the insert is always over
     * the corresponding text-box.
     *
     */
    static reorderInserts() {
        return TheatreHelpers.reorderInserts();
    }

    /**
     * Set wither or not to display or hide theatre debug information.
     *
     * @params state (Boolean) : Boolean indicating if we should toggle debug on/off
     */
    static setDebug(state) {
        return TheatreHelpers.setDebug(state);
    }

    /**
     * Verify the TweenMax ease from the animation syntax shorthand.
     *
     * @params str (String) : the ease to verify.
     */
    static verifyEase(str) {
        return TheatreHelpers.verifyEase(str);
    }

    /**
     * Return an array of tween params if the syntax is correct,
     * else return an empty array if any tweens in the syntax
     * are flag as incorrect.
     *
     * @param str (String) : The syntax to verify
     *
     * @return (Array[Object]) : The array of verified tween params, or null
     */
    static verifyAnimationSyntax(str) {
        return TheatreHelpers.verifyAnimationSyntax(str);
    }

    /**
     * Prepare fonts and return the list of fonts available
     *
     * @return (Array[(String)]) : The array of font familys to use.
     */
    static getFonts() {
        return TheatreHelpers.getFonts();
    }

    static getActorDisplayName(actorId) {
        return TheatreHelpers.getActorDisplayName(actorId);
    }

    /**
     * Get the emotes for the actor by merging
     * whatever is in the emotes flag with the default base
     *
     * @param actorId (String) : The actorId of the actor to get emotes from.
     * @param disableDefault (Boolean) : Wither or not default emotes are disabled.
     *                                   in which case, we don't merge the actor
     *                                   emotes with the default ones.
     *
     * @return (Object) : An Object containg the emotes for the requested actorId.
     */
    static getActorEmotes(actorId, disableDefault) {
        return TheatreHelpers.getActorEmotes(actorId, disableDefault);
    }

    /**
     * Get the rigging resources for the actor by merging
     * whater is in the rigging.resources flag with the default base
     *
     * @params actorId (String) : The actorId of the actor to get rigging resources
     *                            from.
     *
     * @return (Array[(Object)]) : An array of {name: (String), path: (String)} tuples
     *                             representing the rigging resource map for the specified actorId.
     */
    static getActorRiggingResources(actorId) {
        return TheatreHelpers.getActorRiggingResources(actorId);
    }

    /**
     * Default rigging resources
     *
     * @return (Array[(Object)]) : An array of {name: (String), path: (String)} tuples
     *                             representing the default rigging resource map.
     */
    static getDefaultRiggingResources() {
        return TheatreHelpers.getDefaultRiggingResources();
    }

    /**
     * Get default emotes, immutable
     *
     * @return (Object) : An Object, whose properties are the default set
     *                     emotes.
     */
    static getDefaultEmotes() {
        return TheatreHelpers.getDefaultEmotes();
    }

    /**
     * Split to chars, logically group words based on language.
     *
     * @param text (String) : The text to split.
     * @param textBox (HTMLElement) : The textBox the text will be contained in.
     *
     * @return (Array[HTMLElement]) : An array of HTMLElements of the split text.
     */
    static splitTextBoxToChars(text, textBox) {
        return TheatreHelpers.splitTextBoxToChars(text, textBox);
    }

    /**
     *
     * ActorSheet Configue Options
     *
     * @params ev (Event) : The event that triggered the configuration option.
     * @params actorSheet (Object ActorSheet) : The ActorSheet Object to spawn a configure
     *                                          window from.
     */
    static onConfigureInsert(ev, actorSheet) {
        return TheatreHelpers.onConfigureInsert(ev, actorSheet);
    }

    /**
     * Add to the nav bar staging area with an actorSheet.
     *
     * @params ev (Event) : The event that triggered adding to the NavBar staging area.
     */
    static onAddToNavBar(ev, actorSheet, removeLabelSheetHeader) {
        return TheatreHelpers.onAddToNavBar(ev, actorSheet, removeLabelSheetHeader);
    }

    static _getTheatreId(actor) {
        return TheatreHelpers._getTheatreId(actor);
    }

    /**
     * Add to the NavBar staging area
     *
     * @params actor (Actor) : The actor from which to add to the NavBar staging area.
     */
    static addToNavBar(actor) {
        return TheatreHelpers.addToNavBar(actor);
    }

    /**
     * Removes the actor from the nav bar.
     *
     * @params actor (Actor) : The actor to remove from the NavBar staging area.
     */
    static removeFromNavBar(actor) {
        return TheatreHelpers.removeFromNavBar(actor);
    }

    /**
     * Removes the actor from the stage.
     *
     * @params id (string) : The theatreId to remove from the stage.
     */
    _removeFromStage(theatreId) {
        return TheatreHelpers._removeFromStage(theatreId);
    }

    /**
     * Returns whether the actor is on the stage.
     * @params actor (Actor) : The actor.
     */
    static isActorStaged(actor) {
        return TheatreHelpers.isActorStaged(actor);
    }

    static clearStage() {
        return TheatreHelpers.clearStage();
    }

    /**
     * get the text animation given the name
     *
     * @param name (String) : The name of the standing text animation to get.
     *
     * @return (Object) : An Object tuple of {func: (Function), label: (String)}
     *                     representing the animation function and function label.
     *
     */
    static textStandingAnimation(name) {
        return TheatreHelpers.textStandingAnimation(name);
    }

    /**
     * Get text Flyin Animation funciton, still needs to supply
     * 1. charSpans
     * 2. delay
     * 3. speed
     * 4. standingAnim (optional standin animation)
     *
     * @params name (String) : The name of the fly-in animation to use
     *
     * @return (Object) : An Object tuple of {func: (Function), label: (String)}
     *                     representing the animation function and function label.
     *
     */
    static textFlyinAnimation(name) {
        return TheatreHelpers.textFlyinAnimation(name);
    }

    /**
     * Resize the UI Bars elements when the sidebar is collapsed or expanded
     *
     * @param collapsed (Boolean) : Whether the sidebar is collapsed or not
     */
    static resizeBars(collapsed) {
        TheatreHelpers.resizeBars(collapsed);
    }
}
