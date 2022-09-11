/**
 * Theatre.js
 *
 * Copyright (c) 2019 Ken L.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>. 
 *
 */



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
class Theatre {

	/**
	 * Make singleton and initalize the inner instance object. 
	 * Return singleton if already created. 
	 */
	constructor() {
		if (!Theatre.instance) {
			// build theater-wide statics
			Theatre.SOCKET = "module.theatre"; 
			Theatre.SETTINGS = "theatre"; 
			Theatre.NARRATOR = "Narrator"; 
			Theatre.ICONLIB = "modules/theatre/app/graphics/emotes"; 
			Theatre.DEBUG = false; 
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
				timeoutId: null
			}; 
			// configurable settings
			this.settings = {
				autoDecay: true,
				decayRate: 1000,
				decayMin: 30000,
				barStyle: "textbox",
				narrHeight: "50%"
			}
			// Font library
			Theatre.getFonts(); 
			// FaceAPI
			//this._initFaceAPI(); 
			// module settings
			this._initModuleSettings(); 
		}
		return Theatre.instance; 
	}

	initialize() {
		// inject HTML
		this._injectHTML(); 
		// socket 
		this._initSocket(); 
		// global listeners
		window.addEventListener("resize",this.handleWindowResize);
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
			console.error("Theatre encountered a FATAL error during initialization"); 
			ui.notifications.error(game.i18n.localize("Theatre.UI.Notification.Fatal")); 
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

		KHelpers.addClass(barContainerPrime,"theatre-bar-left"); 
		KHelpers.addClass(barContainerSecond,"theatre-bar-right"); 
		KHelpers.addClass(narratorBackdrop,"theatre-narrator-backdrop"); 
		KHelpers.addClass(narratorContent,"theatre-narrator-content"); 
		KHelpers.addClass(narratorContent,"no-scrollbar"); 
		KHelpers.addClass(this.theatreGroup,"theatre-group"); 
		KHelpers.addClass(this.theatreDock,"theatre-dock"); 
		KHelpers.addClass(this.theatreDock,"no-scrollbar"); 
		KHelpers.addClass(this.theatreBar,"theatre-bar"); 
		KHelpers.addClass(this.theatreNarrator,"theatre-narrator"); 

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
		this.settings.theatreStyle = game.settings.get(Theatre.SETTINGS,"theatreStyle"); 
		this.configTheatreStyle(this.settings.theatreStyle); 
		// set narrator height
		this.settings.narrHeight =  game.settings.get(Theatre.SETTINGS,"theatreNarratorHeight"); 
		this.theatreNarrator.style.top = `calc(${this.settings.narrHeight} - 50px)`; 

		// set dock canvas hard dimensions after CSS has caclulated it

		/**
		 * Theatre Chat Controls
		 */
		let chatControls = document.getElementById("chat-controls"); 
		let controlButtons = chatControls.getElementsByClassName("control-buttons")[0]; 
		let chatForm = document.getElementById("chat-form"); 
		let chatMessage = document.getElementById("chat-message"); 

		this.theatreControls =  document.createElement("div"); 
		this.theatreNavBar = document.createElement("div"); 
		this.theatreChatCover = document.createElement("div"); 

		if (!game.user.isGM && game.settings.get(Theatre.SETTINGS, "gmOnly")) {
			this.theatreControls.style.display = "none";
		}

		let imgCover = document.createElement("img"); 
		let btnSuppress = document.createElement("div"); 
		let iconSuppress = document.createElement("div"); 
		let btnEmote = document.createElement("div"); 
		let iconEmote = document.createElement("div"); 
		//let btnCinema = document.createElement("div"); 
		//let iconCinema = document.createElement("div"); 
		let btnNarrator; 
		let iconNarrator; 

		let btnResync = document.createElement("a"); 
		let iconResync = document.createElement("i"); 
		let btnQuote = document.createElement("a"); 
		let iconQuote = document.createElement("i"); 
		let btnDelayEmote = document.createElement("a"); 
		let iconDelayEmote = document.createElement("i"); 

		KHelpers.addClass(this.theatreControls,"theatre-control-group"); 
		KHelpers.addClass(this.theatreNavBar,"theatre-control-nav-bar"); 
		KHelpers.addClass(this.theatreNavBar,"no-scrollbar"); 
		KHelpers.addClass(this.theatreChatCover,"theatre-control-chat-cover"); 
		KHelpers.addClass(btnSuppress,"theatre-control-btn"); 
		KHelpers.addClass(iconSuppress,"theatre-icon-suppress"); 
		KHelpers.addClass(btnEmote,"theatre-control-btn"); 
		KHelpers.addClass(iconEmote,"theatre-icon-emote"); 
		//KHelpers.addClass(btnCinema,"theatre-control-btn"); 
		//KHelpers.addClass(iconCinema,"theatre-icon-cinema"); 
		KHelpers.addClass(btnResync,"button"); 
		KHelpers.addClass(btnResync,"resync-theatre"); 
		KHelpers.addClass(iconResync,"fas"); 
		KHelpers.addClass(iconResync,"fa-sync"); 
		KHelpers.addClass(btnQuote,"button"); 
		KHelpers.addClass(iconQuote,"fas"); 
		KHelpers.addClass(iconQuote,"fa-quote-right"); 
		KHelpers.addClass(btnDelayEmote,"button"); 
		KHelpers.addClass(iconDelayEmote,"fas"); 
		KHelpers.addClass(iconDelayEmote,"fa-comment-alt"); 

		btnEmote.setAttribute("title",game.i18n.localize("Theatre.UI.Title.EmoteSelector")); 
		btnSuppress.setAttribute("title",game.i18n.localize("Theatre.UI.Title.SuppressTheatre")); 
		btnResync.setAttribute("title",(game.user.isGM ? game.i18n.localize("Theatre.UI.Title.ResyncGM") : game.i18n.localize("Theatre.UI.Title.ResyncPlayer"))); 
		btnQuote.setAttribute("title",game.i18n.localize("Theatre.UI.Title.QuoteToggle")); 
		btnDelayEmote.setAttribute("title",game.i18n.localize("Theatre.UI.Title.DelayEmoteToggle")); 
		//btnCinema.setAttribute("title",game.i18n.localize("Theatre.UI.Title.CinemaSelector")); 
		btnEmote.addEventListener("click", this.handleBtnEmoteClick); 
		btnSuppress.addEventListener("click", this.handleBtnSuppressClick); 
		btnResync.addEventListener("click", this.handleBtnResyncClick); 
		btnQuote.addEventListener("click", this.handleBtnQuoteClick); 
		btnDelayEmote.addEventListener("click", this.handleBtnDelayEmoteClick); 
		//btnCinema.addEventListener("click", this.handleBtnCinemaClick); 
		this.theatreNavBar.addEventListener("wheel", this.handleNavBarWheel); 
		
		btnEmote.appendChild(iconEmote); 
		btnSuppress.appendChild(iconSuppress); 
		btnResync.appendChild(iconResync); 
		btnQuote.appendChild(iconQuote); 
		btnDelayEmote.appendChild(iconDelayEmote); 
		//btnCinema.appendChild(iconCinema); 
		this.theatreChatCover.appendChild(imgCover); 

		this.theatreControls.appendChild(this.theatreNavBar); 

		if (game.user.isGM) {
			btnNarrator = document.createElement("div"); 
			iconNarrator = document.createElement("div"); 
			KHelpers.addClass(btnNarrator,"theatre-control-btn"); 
			KHelpers.addClass(iconNarrator,"theatre-icon-narrator"); 
			btnNarrator.setAttribute("title",game.i18n.localize("Theatre.UI.Title.Narrator")); 
			btnNarrator.appendChild(iconNarrator); 
			btnNarrator.addEventListener("click",this.handleBtnNarratorClick); 
			this.theatreControls.appendChild(btnNarrator); 
		}

		this.theatreControls.appendChild(btnEmote); 
		//this.theatreControls.appendChild(btnCinema); 
		this.theatreControls.appendChild(btnSuppress); 

		btnDelayEmote.style["margin"] = "0 4px";
		btnQuote.style["margin"] = "0 4px";
		btnResync.style["margin"] = "0 4px";

		if (game.user.isGM || !game.settings.get(Theatre.SETTINGS, "gmOnly")) {
			if (controlButtons) {
				controlButtons.style["flex-basis"] = "150px";
				KHelpers.insertBefore(btnResync,controlButtons.children[0]);
				KHelpers.insertBefore(btnQuote,btnResync);
				KHelpers.insertBefore(btnDelayEmote,btnQuote);
			} else {
				controlButtons = document.createElement("div");
				KHelpers.addClass(controlButtons,"control-buttons");
				controlButtons.style["flex-basis"] = "66px";
				controlButtons.appendChild(btnDelayEmote);
				controlButtons.appendChild(btnQuote);
				controlButtons.appendChild(btnResync);
				chatControls.appendChild(controlButtons);
			}
		}

		KHelpers.insertBefore(this.theatreControls,chatControls); 
		KHelpers.insertAfter(this.theatreChatCover,chatMessage); 

		// bind listener to chat message
		chatMessage.addEventListener("keydown",this.handleChatMessageKeyDown); 
		chatMessage.addEventListener("keyup",this.handleChatMessageKeyUp); 
		chatMessage.addEventListener("focusout",this.handleChatMessageFocusOut); 

		/*
		* Emote Menu
		*/
		this.theatreEmoteMenu = document.createElement("div"); 
		KHelpers.addClass(this.theatreEmoteMenu,"theatre-emote-menu"); 
		KHelpers.addClass(this.theatreEmoteMenu,"app"); 
		KHelpers.insertBefore(this.theatreEmoteMenu,this.theatreControls); 

		/**
		 * Tooltip
		 */
		this.theatreEmoteMenu.addEventListener("mousemove",this.handleEmoteMenuMouseMove); 
	}

	/**
	 * Init Module Settings
	 *
	 * @private
	 */
	_initModuleSettings() {
		// module settings

		game.settings.register(Theatre.SETTINGS, "gmOnly", {
			name: "Theatre.UI.Settings.gmOnly",
			hint: "Theatre.UI.Settings.gmOnlyHint",
			scope: "world",
			config: true,
			defualt: false,
			type: Boolean,
			onChange: () => {if (!game.user.isGM) location.reload();},
		});

		game.settings.register(Theatre.SETTINGS, "theatreStyle", {
			name: "Theatre.UI.Settings.displayMode",
			hint: "Theatre.UI.Settings.displayModeHint",
			scope: "world",
			config: true,
			default: "textbox",
			type: String,
			choices: {
				"textbox": "Theatre.UI.Settings.displayModeTextBox",
				"lightbox": "Theatre.UI.Settings.displayModeLightBox",
				"clearbox": "Theatre.UI.Settings.displayModeClearBox"
			},
			onChange: theatreStyle => Theatre.instance.configTheatreStyle(theatreStyle)
		});

		game.settings.register(Theatre.SETTINGS, "theatreImageSize", {
			name: "Maximum image height",
			scope: "client",
			config: true,
			default: 400,
			type: Number,
		  });

		game.settings.register(Theatre.SETTINGS, "theatreNarratorHeight", {
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
				"70%": "75%"
			},
			onChange: narrHeight => {
				this.settings.narrHeight = narrHeight; 
				if (this.theatreNarrator)
					this.theatreNarrator.style.top = `calc(${narrHeight} - 50px)`; 
			}
		});

		game.settings.register(Theatre.SETTINGS, "nameFont", {
			name: "Theatre.UI.Settings.nameFont",
			hint: "Theatre.UI.Settings.nameFontHint",
			scope: "world",
			config: true,
			default: Theatre.instance.titleFont,
			type: String,
		choices: Theatre.FONTS.reduce((a, font) => { a[font]=font;
			return a;
		}, {}),
		});

		game.settings.register(Theatre.SETTINGS, "nameFontSize", {
			name: "Theatre.UI.Settings.nameFontSize",
			hint: "Theatre.UI.Settings.nameFontSizeHint",
			scope: "world",
			config: true,
			default: 44,
			type: Number,
		});
		
		game.settings.register(Theatre.SETTINGS, "textDecayMin", {
			name: "Theatre.UI.Settings.textDecayMin",
			hint: "Theatre.UI.Settings.textDecayMinHint",
			scope: "world",
			config: true,
			default: 30,
			type: Number,
			onChange: textDecayMin => {
				if (Theatre.DEBUG) console.log("Text decay minimum set to %s",textDecayMin); 
				textDecayMin = Number(textDecayMin); 
				if(isNaN(textDecayMin) || textDecayMin <= 0) {
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.InvalidDecayMin")); 
					game.settings.set(Theatre.SETTINGS,"textDecayMin",30); 
					return; 
				}
				if(textDecayMin > 600) {
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayMin")); 
					game.settings.set(Theatre.SETTINGS,"textDecayMin",600); 
					return; 
				}

				this.settings.decayMin = textDecayMin*1000; 
			}
		});

		game.settings.register(Theatre.SETTINGS, "textDecayRate", {
			name: "Theatre.UI.Settings.textDecayRate",
			hint: "Theatre.UI.Settings.textDecayRateHint",
			scope: "world",
			config: true,
			default: 1,
			type: Number,
			onChange: textDecayRate => {
				if (Theatre.DEBUG) console.log("Text decay rate set to %s",textDecayRate); 
				textDecayRate = Number(textDecayRate); 
				if(isNaN(textDecayRate) || textDecayRate <= 0) {
					textDecayRate = 1; 
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.InvalidDecayRate")); 
					game.settings.set(Theatre.SETTINGS,"textDecayRate",1); 
					return; 
				}
				if (textDecayRate > 10) {
					textDecayRate = 10; 
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayRate")); 
					game.settings.set(Theatre.SETTINGS,"textDecayRate",10); 
					return; 
				}
				this.settings.decayRate = textDecayRate*1000; 
			}
		});

		game.settings.register(Theatre.SETTINGS, "motdNewInfo", {
			name: "MOTD New Info",
			scope: "client",
			default: 0,
			type: Number,
			onChange: newInfo => {
				// NOOP
			}
		});
		
		game.settings.register(Theatre.SETTINGS, "autoHideBottom", {
			name: "Theatre.UI.Settings.autoHideBottom",
		  	hint: "Theatre.UI.Settings.autoHideBottomHint",
		  	scope: "world",
		  	config: true,
		  	type: Boolean,
		  	default: true
		});

		game.settings.register(Theatre.SETTINGS, "suppressMacroHotbar", {
			name: "Theatre.UI.Settings.suppressMacroHotbar",
		  	hint: "",
		  	scope: "world",
		  	config: true,
		  	type: Boolean,
		  	default: true
		});

		game.settings.register(Theatre.SETTINGS, "removeLabelSheetHeader", {
			name: "Theatre.UI.Settings.removeLabelSheetHeader",
		  	hint: "Theatre.UI.Settings.removeLabelSheetHeaderHint",
		  	scope: "world",
		  	config: true,
		  	type: Boolean,
		  	default: false
		});

		// Load in default settings (theatreStyle is loaded on HTML Injection)
		this.settings.decayMin = (game.settings.get(Theatre.SETTINGS,"textDecayMin")||30)*1000; 
		this.settings.decayRate = (game.settings.get(Theatre.SETTINGS,"textDecayRate")||1)*1000; 
		this.settings.motdNewInfo = game.settings.get(Theatre.SETTINGS,"motdNewInfo")||1; 

	}

	/**
	 * Configure the theatre display mode
	 *
	 * @param theatreStyle (String) : The theatre Style to apply
	 */
	configTheatreStyle(theatreStyle) {
		if (Theatre.DEBUG) console.log("SWITCHING THEATRE BAR MODE : %s from %s",theatreStyle,this.settings.theatreStyle); 
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
				KHelpers.removeClass(primeBar,"theatre-bar-left"); 
				KHelpers.removeClass(secondBar,"theatre-bar-right"); 
				KHelpers.removeClass(primeBar,"theatre-bar-lightleft"); 
				KHelpers.removeClass(secondBar,"theatre-bar-lightright"); 
				for (let tb of textBoxes) {
					KHelpers.removeClass(tb,"theatre-text-box-light"); 
					KHelpers.removeClass(tb,"theatre-text-box"); 
				}
				break; 
			case "clearbox":
				KHelpers.removeClass(primeBar,"theatre-bar-left"); 
				KHelpers.removeClass(secondBar,"theatre-bar-right"); 
				KHelpers.removeClass(primeBar,"theatre-bar-clearleft"); 
				KHelpers.removeClass(secondBar,"theatre-bar-clearright"); 
				for (let tb of textBoxes) {
					KHelpers.removeClass(tb,"theatre-text-box-clear"); 
					KHelpers.removeClass(tb,"theatre-text-box"); 
				}
				break; 
			case "mangabubble":
				KHelpers.removeClass(primeBar,"theatre-bar-left"); 
				KHelpers.removeClass(secondBar,"theatre-bar-right"); 
				for (let tb of textBoxes) {
					KHelpers.removeClass(tb,"theatre-text-box"); 
				}
				// PLACEHOLDER FOR FUTURE
				break; 
			case "textbox":
			default:
				KHelpers.removeClass(primeBar,"theatre-bar-left"); 
				KHelpers.removeClass(secondBar,"theatre-bar-right"); 
				for (let tb of textBoxes)
					KHelpers.removeClass(tb,"theatre-text-box"); 
				break; 
		}

		// apply new style
		switch (theatreStyle) {
			case "lightbox":
				KHelpers.addClass(primeBar,"theatre-bar-lightleft"); 
				KHelpers.addClass(secondBar,"theatre-bar-lightright"); 
				this.theatreDock.style.height = "100%"; 
				this.theatreBar.style.top = "calc(100% - 170px)"; 
				this.theatreBar.style.height = "170px"; 
				this.theatreBar.style["border-radius"] = "5px 0px 0px 5px"; 
				this.theatreBar.style["box-shadow"] = "0 0 40px #000"; 
				this.theatreBar.style.background = "linear-gradient(transparent, rgba(20,20,20,0.98) 5%,rgba(20,20,20,0.85) 40%, rgba(20,20,20,0.6) 70%, rgba(20,20,20,0.5) 95%)"; 
				for (let tb of textBoxes)
					KHelpers.addClass(tb,"theatre-text-box-light"); 
				break; 
			case "clearbox":
				KHelpers.addClass(primeBar,"theatre-bar-clearleft"); 
				KHelpers.addClass(secondBar,"theatre-bar-clearright"); 
				this.theatreDock.style.height = "100%"; 
				this.theatreBar.style.top = "calc(100% - 170px)"; 
				this.theatreBar.style.height = "170px"; 
				this.theatreBar.style["border-radius"] = "unset"; 
				this.theatreBar.style["box-shadow"] = "unset"; 
				this.theatreBar.style.background = "unset"; 
				for (let tb of textBoxes)
					KHelpers.addClass(tb,"theatre-text-box-clear"); 
				break; 
			case "mangabubble":
				// PLACEHOLDER FOR FUTURE
				break; 
			case "textbox":
			default:
				KHelpers.addClass(primeBar,"theatre-bar-left"); 
				KHelpers.addClass(secondBar,"theatre-bar-right"); 
				this.theatreDock.style.height = "99.5vh"; 
				this.theatreBar.style.top = "calc(100% - 160px - 0.5vh)"; 
				this.theatreBar.style.height = "160px"; 
				this.theatreBar.style["border-radius"] = "unset"; 
				this.theatreBar.style["box-shadow"] = "unset"; 
				this.theatreBar.style.background = "unset"; 
				for (let tb of textBoxes)
					KHelpers.addClass(tb,"theatre-text-box"); 
				break; 
		}

		this.settings.theatreStyle = theatreStyle; 

		// re-render all inserts
		for (let insert of this.portraitDocks)
			this.renderInsertById(insert.imgId); 

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
		game.socket.on(Theatre.SOCKET, payload => {
			if (Theatre.DEBUG) console.log("Received packet",payload)
			switch (payload.type) {
				case "sceneevent":
					this._processSceneEvent(payload.senderId,payload.subtype,payload.data); 
					break;
				case "typingevent":
					this._processTypingEvent(payload.senderId,payload.data); 
					break; 
				case "resyncevent":
					this._processResyncEvent(payload.subtype,payload.senderId,payload.data); 
					break; 
				case "reqresync":
					this._processResyncRequest(payload.subtype,payload.senderId,payload.data); 
					break; 
				default:
					console.log("UNKNOWN THEATRE EVENT TYPE %s",payload.type,payload); 
					break;
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
	_sendSceneEvent(eventType,eventData) {
		if (Theatre.DEBUG) console.log("Sending Scene state %s with payload: ",eventType, eventData)

		// Do we even need verification? There's no User Input outside of 
		// cookie cutter responses

		game.socket.emit(Theatre.SOCKET, 
				{
					senderId: game.user.id, 
					type: "sceneevent", 
					subtype: eventType, 
					data: eventData
				}
		);

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
		if (Theatre.DEBUG) console.log("Sending Typing Event")

		let insert = this.getInsertById(this.speakingAs); 
		let insertEmote = this._getEmoteFromInsert(insert); 
		let insertTextFlyin = 
			(insert ? this._getTextFlyinFromInsert(insert) : (this.speakingAs == Theatre.NARRATOR ? this.theatreNarrator.getAttribute("textflyin") : "typewriter")); 
		let insertTextStanding = 
			(insert ? this._getTextStandingFromInsert(insert) : (this.speakingAs == Theatre.NARRATOR ? this.theatreNarrator.getAttribute("textstanding") : "none")); 
		let insertTextFont = 
			(insert ? this._getTextFontFromInsert(insert) : (this.speakingAs == Theatre.NARRATOR ? this.theatreNarrator.getAttribute("textfont") : null)); 
		let insertTextSize = 
			(insert ? this._getTextSizeFromInsert(insert) : (this.speakingAs == Theatre.NARRATOR ? this.theatreNarrator.getAttribute("textsize") : null)); 
		let insertTextColor = 
			(insert ? this._getTextColorFromInsert(insert) : (this.speakingAs == Theatre.NARRATOR ? this.theatreNarrator.getAttribute("textcolor") : null)); 

		let emotedata = {
			emote: insertEmote, 
			textflyin: insertTextFlyin, 
			textstanding: insertTextStanding,
			textfont: insertTextFont,
			textsize: insertTextSize,
			textcolor: insertTextColor
		}

		game.socket.emit(Theatre.SOCKET, 
				{
					senderId: game.user.id, 
					type: "typingevent", 
					data: {
						insertid : this.speakingAs,
						emotions: emotedata
					}
				},
		);

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
		if (Theatre.DEBUG) console.log("Sending RESYNC Event (isGM)%s (to)%s: ",game.user.isGM,targetId,insertData)

		game.socket.emit(Theatre.SOCKET, 
				{
					senderId: game.user.id, 
					type: "resyncevent", 
					subtype: (game.user.isGM ? "gm" : "player"), 
					data: {
						targetid: targetId,
						insertdata: insertData,
						narrator: this.isNarratorActive
					}
				},
		);

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
		for (let idx=0; idx<this.portraitDocks.length; ++idx) {
			let insert = this.portraitDocks[idx]; 
			let insertEmote = this._getEmoteFromInsert(insert); 
			let insertTextFlyin = this._getTextFlyinFromInsert(insert); 
			let insertTextStanding = this._getTextStandingFromInsert(insert); 
			let insertTextFont = this._getTextFontFromInsert(insert); 
			let insertTextSize = this._getTextSizeFromInsert(insert); 
			let insertTextColor = this._getTextColorFromInsert(insert); 

			let dat = {
				insertid : insert.imgId,
				position : {
					x: insert.portraitContainer.x/* - insert.portrait.width/2*/,
					y: insert.portraitContainer.y/* - insert.portrait.height/2*/,
					mirror: insert.mirrored
				},
				emotions : {
					emote: insertEmote, 
					textflyin: insertTextFlyin, 
					textstanding: insertTextStanding,
					textfont: insertTextFont,
					textsize: insertTextSize,
					textcolor: insertTextColor
				},
				sortidx : insert.order || 0
			}
			insertData.push(dat); 
		}
		insertData.sort((a,b)=>{return a.sortidx-b.sortidx}); 
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
		if (Theatre.DEBUG) console.log("Sending RESYNC Request ", type); 

		// If there's a GM, request to resync from them
		let data = {}; 
		if (type == "players" && game.user.isGM) {
			data.insertdata = this._buildResyncData(); 
			data.narrator = this.isNarratorActive; 
		}

		game.socket.emit(Theatre.SOCKET, 
				{
					senderId: game.user.id, 
					type: "reqresync", 
					subtype: type || "any",
					data: data
				},
		);

		if (type != "players") {
			this.resync.type = type; 
			this.resync.timeoutId = window.setTimeout(()=>{
				console.log("RESYNC REQUEST TIMEOUT"); 
				this.resync.timeoutId = null; 
			},5000); 
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
		if (Theatre.DEBUG) console.log("Processing resync request"); 
		// If the dock is not active, no need to send anything
		if (type == "any" && this.dockActive <= 0 && !this.isNarratorActive) {
			console.log("OUR DOCK IS NOT ACTIVE, Not responding to reqresync")
			return;
		} else if (type == "gm" && !game.user.isGM) {
			return; 
		} else if (type == "players") {
			// clear our theatre
			for (let insert of this.portraitDocks)
				this.removeInsertById(insert.imgId,true); 
			// process this as if it were a resyncevent
			this.resync.timeoutId = 1; 
			this._processResyncEvent("gm",senderId,{
				targetid : game.user.id,
				insertdata : data.insertdata,
				narrator : data.narrator
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
		if (Theatre.DEBUG) console.log("Processing resync event %s :",type,data,game.users.get(senderId)); 
		// if we're resyncing and it's us that's the target
		if (this.resync.timeoutId && (data.targetid == game.user.id || ("gm" == this.resync.type == type))) {
			// drop all other resync responses, first come, first process
			window.clearTimeout(this.resync.timeoutId); 
			this.resync.timeoutId = null; 

			// clear our theatre
			for (let insert of this.portraitDocks)
				this.removeInsertById(insert.imgId,true); 

			if (type == "gm")
				ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.ResyncGM"));
			else
				ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.ResyncPlayer") + game.users.get(senderId).data.name);

			let theatreId,insert,port,actorId,actor,params; 
			let toInject = []; 
			for (let dat of data.insertdata) {
				theatreId = dat.insertid;
				actorId = theatreId.replace("theatre-",""); 
				params = this._getInsertParamsFromActorId(actorId); 
				if (!params) continue;

				if (Theatre.DEBUG) console.log("params + emotions: ",params,dat.emotions); 
				toInject.push({params: params, emotions: dat.emotions}); 
			}
			// let the clearing animation complete
			window.setTimeout(()=>{
				// stage all inserts; 
				let ids = data.insertdata.map(e => e.insertid); 
				//once all inserts are staged, start our injections
				this.stageAllInserts(ids,(loader,resources)=>{
					// due to the 'dual dock' mode and how it combines, we can't just push the reverse
					// if we want to preserve order
					if (toInject.length >= 2) {
						this.injectLeftPortrait(
								toInject[toInject.length-2].params.src,
								toInject[toInject.length-2].params.name,
								toInject[toInject.length-2].params.imgId,
								toInject[toInject.length-2].params.optalign,
								{
									emote : toInject[toInject.length-2].emotions.emote,
									textFlyin : toInject[toInject.length-2].emotions.textflyin,
									textStanding : toInject[toInject.length-2].emotions.textstanding,
									textFont : toInject[toInject.length-2].emotions.textfont,
									textSize : toInject[toInject.length-2].emotions.textsize,
									textColor : toInject[toInject.length-2].emotions.textcolor
								},
								true); 
						this.injectLeftPortrait(
								toInject[toInject.length-1].params.src,
								toInject[toInject.length-1].params.name,
								toInject[toInject.length-1].params.imgId,
								toInject[toInject.length-1].params.optalign,
								{
									emote : toInject[toInject.length-1].emotions.emote,
									textFlyin : toInject[toInject.length-1].emotions.textflyin,
									textStanding : toInject[toInject.length-1].emotions.textstanding,
									textFont : toInject[toInject.length-1].emotions.textfont,
									textSize : toInject[toInject.length-1].emotions.textsize,
									textColor : toInject[toInject.length-1].emotions.textcolor
								},
								true); 
						for (let idx=toInject.length-3; idx>=0; --idx)
							this.injectLeftPortrait(
									toInject[idx].params.src,
									toInject[idx].params.name,
									toInject[idx].params.imgId,
									toInject[idx].params.optalign,
									{
										emote : toInject[idx].emotions.emote,
										textFlyin : toInject[idx].emotions.textflyin,
										textStanding : toInject[idx].emotions.textstanding,
										textFont : toInject[idx].emotions.textfont,
										textSize : toInject[idx].emotions.textsize,
										textColor : toInject[idx].emotions.textcolor
									},
									true); 
					} else if (toInject.length == 1) {
						this.injectLeftPortrait(
								toInject[0].params.src,
								toInject[0].params.name,
								toInject[0].params.imgId,
								toInject[0].params.optalign,
								{
									emote : toInject[0].emotions.emote,
									textFlyin : toInject[0].emotions.textflyin,
									textStanding : toInject[0].emotions.textstanding,
									textFont : toInject[0].emotions.textfont,
									textSize : toInject[0].emotions.textsize,
									textColor : toInject[0].emotions.textcolor
								},
								true); 
					}
					// finally apply positioning for 3n total run speed
					window.setTimeout(()=>{
						for (let dat of data.insertdata) {
							insert = this.getInsertById(dat.insertid); 
							//console.log("attempting to apply position to ",insert,dat.insertid,dat); 
							if (insert) {
								if (Theatre.DEBUG) console.log("insert active post resync add, appying position"); 
								// apply mirror state
								/*
								if (Boolean(dat.position.mirror) != insert.mirrored)
									this._mirrorInsert(port,true); 
								*/
								if (Theatre.DEBUG) console.log("Mirror ? %s : %s",dat.position.mirror, insert.mirrored); 
								if (Boolean(dat.position.mirror) != insert.mirrored) {
									if (Theatre.DEBUG) console.log("no match!"); 
									insert.mirrored = Boolean(dat.position.mirror); 
								}
								// apply positioning data
								insert.portraitContainer.scale.x = (insert.mirrored ? -1 : 1); 
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
					},1000); 
				}); 
			},1600); 

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
	_processSceneEvent(senderId, type, data) {
		if (Theatre.DEBUG) console.log("Processing scene event %s",type,data); 
		let insert,actorId,params,emote,port,emotions,resName,app,insertEmote,render; 

		switch (type) {
			case "enterscene":
				if (Theatre.DEBUG) console.log("enterscene: aid:%s",actorId); 
				actorId = data.insertid.replace("theatre-",""); 
				params = this._getInsertParamsFromActorId(actorId); 
				emotions = (data.emotions ? data.emotions : {
					emote: null, 
					textFlying: null, 
					textStanding: null, 
					textFont: null, 
					textSize: null, 
					textColor: null
				}); 
				if (!params) return;
				if (Theatre.DEBUG) console.log("params: ",params); 
				if (data.isleft)
					this.injectLeftPortrait(params.src,params.name,params.imgId,params.optalign,emotions,true); 
				else
					this.injectRightPortrait(params.src,params.name,params.imgId,params.optalign,emotions,true); 

				break;
			case "exitscene":
				if (Theatre.DEBUG) console.log("exitscene: tid:%s",data.insertid); 
				this.removeInsertById(data.insertid,true); 
				break;
			case "positionupdate":
				if (Theatre.DEBUG) console.log("positionupdate: tid:%s",data.insertid); 
				insert = this.getInsertById(data.insertid); 
				if (insert) {
					// apply mirror state
					if (Theatre.DEBUG) console.log("mirroring desired: %s , current mirror %s",data.position.mirror,insert.mirrored); 
					if (Boolean(data.position.mirror) != insert.mirrored)
						insert.mirrored = data.position.mirror; 
					// apply positioning data
					//insert.portraitContainer.x = data.position.x; 
					//insert.portraitContainer.y = data.position.y; 
					let tweenId = "portraitMove"; 	
					let tween = TweenMax.to(insert.portraitContainer,0.5,{
						pixi:{scaleX:(data.position.mirror ? -1 : 1) ,x: data.position.x, y: data.position.y},
						ease: Power3.easeOut,
						onComplete: function(ctx,imgId,tweenId) {
							// decrement the rendering accumulator
							ctx._removeDockTween(imgId,this,tweenId); 
							// remove our own reference from the dockContainer tweens
						},
						onCompleteParams: [this,insert.imgId,tweenId]
					}); 
					this._addDockTween(insert.imgId,tween,tweenId); 
				}
				break;
			case "push":
				if (Theatre.DEBUG) console.log("insertpush: tid:%s",data.insertid); 
				this.pushInsertById(data.insertid,data.tofront,true); 
				break; 
			case "swap":
				if (Theatre.DEBUG) console.log("insertswap: tid1:%s tid2:%s",data.insertid1,data.insertid2); 
				this.swapInsertsById(data.insertid1,data.insertid2,true); 
				break; 
			case "move":
				if (Theatre.DEBUG) console.log("insertmove: tid1:%s tid2:%s",data.insertid1,data.insertid2); 
				this.moveInsertById(data.insertid1,data.insertid2,true); 
				break; 
			case "emote":
				if (Theatre.DEBUG) console.log("emote:",data); 
				emote = data.emotions.emote;
				let textFlyin = data.emotions.textflyin; 
				let textStanding = data.emotions.textstanding; 
				let textFont = data.emotions.textfont; 
				let textSize = data.emotions.textsize; 
				let textColor = data.emotions.textcolor; 
				this.setUserEmote(senderId,data.insertid,"emote",emote,true); 
				this.setUserEmote(senderId,data.insertid,"textflyin",textFlyin,true); 
				this.setUserEmote(senderId,data.insertid,"textstanding",textStanding,true); 
				this.setUserEmote(senderId,data.insertid,"textfont",textFont,true); 
				this.setUserEmote(senderId,data.insertid,"textsize",textSize,true); 
				this.setUserEmote(senderId,data.insertid,"textcolor",textColor,true); 
				if (data.insertid == this.speakingAs)
					this.renderEmoteMenu(); 
				break; 
			case "addtexture":
				if (Theatre.DEBUG) console.log("texturereplace:",data); 
				insert = this.getInsertById(data.insertid); 
				actorId = data.insertid.replace("theatre-",""); 
				params = this._getInsertParamsFromActorId(actorId); 
				if (!params) return; 
				
				app = this.pixiCTX; 
				insertEmote = this._getEmoteFromInsert(insert); 
				render = false; 

				if (insertEmote == data.emote)
					render = true; 
				else if (!data.emote)
					render = true; 

				this._AddTextureResource(data.imgsrc, data.resname, data.insertid, data.emote, (loader,resources)=>{
					// if oure emote is active and we're replacing the emote texture, or base is active, and we're replacing the base texture

					if (Theatre.DEBUG) console.log("add replacement complete! ",resources[data.resname],insertEmote,data.emote,render); 
					if (render && app && insert && insert.dockContainer) {
						if (Theatre.DEBUG) console.log("RE-RENDERING with NEW texture resource %s : %s",data.resname,data.imgsrc); 

						// bubble up dataum from the update
						insert.optAlign = params.optalign;
						insert.name = params.name; 
						insert.label.text = params.name; 

						this._clearPortraitContainer(data.insertid); 
						this._setupPortraitContainer(data.insertid,insert.optAlign,data.resname,resources); 
						// re-attach label + typingBubble
						insert.dockContainer.addChild(insert.label); 
						insert.dockContainer.addChild(insert.typingBubble); 

						this._repositionInsertElements(insert); 

						if (data.insertid == this.speakingAs); 
							this.renderEmoteMenu(); 
						if (!this.rendering)
							this._renderTheatre(performance.now()); 
					} 
				},true); 
				break; 
			case "addalltextures":
				if (Theatre.DEBUG) console.log("textureallreplace:",data); 
				insert = this.getInsertById(data.insertid); 
				actorId = data.insertid.replace("theatre-",""); 
				params = this._getInsertParamsFromActorId(actorId); 
				if (!params) return; 
				
				app = this.pixiCTX; 
				insertEmote = this._getEmoteFromInsert(insert); 
				render = false; 

				if (insertEmote == data.emote)
					render = true; 
				else if (!data.emote)
					render = true; 

				this._AddAllTextureResources(data.imgsrcs, data.insertid, data.emote, data.eresname, (loader,resources)=>{
					// if oure emote is active and we're replacing the emote texture, or base is active, and we're replacing the base texture
	
					if (Theatre.DEBUG) console.log("add all textures complete! ",data.emote,data.eresname,params.emotes[data.emote]); 
					if (render 
					&& app 
					&& insert 
					&& insert.dockContainer
					&& data.eresname) {
						if (Theatre.DEBUG) console.log("RE-RENDERING with NEW texture resource %s",data.eresname); 

						// bubble up dataum from the update
						insert.optAlign = params.optalign;
						insert.name = params.name; 
						insert.label.text = params.name; 

						this._clearPortraitContainer(data.insertid); 
						this._setupPortraitContainer(data.insertid,insert.optAlign,data.eresname,resources); 
						// re-attach label + typingBubble
						insert.dockContainer.addChild(insert.label); 
						insert.dockContainer.addChild(insert.typingBubble); 

						this._repositionInsertElements(insert); 

						if (data.insertid == this.speakingAs); 
							this.renderEmoteMenu(); 
						if (!this.rendering)
							this._renderTheatre(performance.now()); 
					} 
				},true); 

				break; 
			case "stage":
				if (Theatre.DEBUG) console.log("staging insert",data.insertid); 
				this.stageInsertById(data.insertid,true); 
				break; 
			case "narrator":
				if (Theatre.DEBUG) console.log("toggle narrator bar",data.active); 
				this.toggleNarratorBar(data.active,true); 
				break; 
			case "decaytext":
				if (Theatre.DEBUG) console.log("decay textbox",data.insertid); 
				this.decayTextBoxById(data.insertid,true); 
				break; 
			case "renderinsert":
				insert = this.getInsertById(data.insertid); 
				if (insert)
					this.renderInsertById(data.insertid); 
				break; 
			default:
				console.log("UNKNOWN SCENE EVENT: %s with data: ",type,data); 
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
	_processTypingEvent(userId,data) {
		// Possibly other things ? 
		this.setUserTyping(userId, data.insertid); 
		// emote information is a rider on this event, process it
		let emote = data.emotions.emote;
		let textFlyin = data.emotions.textflyin; 
		let textStanding = data.emotions.textstanding; 
		let textFont = data.emotions.textfont; 
		let textSize = data.emotions.textsize; 
		let textColor = data.emotions.textcolor; 
		
		this.setUserEmote(userId,data.insertid,"emote",emote,true); 
		this.setUserEmote(userId,data.insertid,"textflyin",textFlyin,true); 
		this.setUserEmote(userId,data.insertid,"textstanding",textStanding,true); 
		this.setUserEmote(userId,data.insertid,"textfont",textFont,true); 
		this.setUserEmote(userId,data.insertid,"textsize",textSize,true); 
		this.setUserEmote(userId,data.insertid,"textcolor",textColor,true); 
		// if the insertid is our speaking id, update our emote menu
		if (data.insertid == this.speakingAs)
			this.renderEmoteMenu(); 
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
		if (this.isDelayEmote) 
			return insert.delayedOldEmote; 
		return insert.emote; 
	}

	/**
	 * Get the inserts which are typing based on if their users are typing
	 */
	getInsertsTyping() {
		let typing = []; 
		for (let userId in this.usersTyping)
			if (this.usersTyping[userId].theatreId)
				typing.push(userId); 

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
	setUserEmote(userId,theatreId,subType,value,remote) {
		if (!this.userEmotes[userId])
			this.userEmotes[userId] = {}; 

		let userEmoting = this.userEmotes[userId]; 
		let insert = this.getInsertById(theatreId); 

		switch(subType) {
			case "textfont":
				if (insert) {
					if (value) insert.textFont = value; 
					else insert.textFont = null; 
				} else if (theatreId == Theatre.NARRATOR) {
					if (value) this.theatreNarrator.setAttribute("textfont",value); 					
					else this.theatreNarrator.removeAttribute("textfont",value); 
				} else {
					userEmoting.textFont = value; 
				}
				break;
			case "textsize":
				if (insert) {
					if (value) insert.textSize = value; 
					else insert.textSize = null; 
				} else if (theatreId == Theatre.NARRATOR) {
					if (value) this.theatreNarrator.setAttribute("textsize",value); 					
					else this.theatreNarrator.removeAttribute("textsize",value); 
					userEmoting.textSize = value; 
				} else {
					userEmoting.textSize = value; 
				}
				break;
			case "textcolor":
				if (insert) {
					if (value) insert.textColor = value; 
					else insert.textColor = null; 
				} else if (theatreId == Theatre.NARRATOR) {
					if (value) this.theatreNarrator.setAttribute("textcolor",value); 					
					else this.theatreNarrator.removeAttribute("textcolor",value); 
				} else {
					userEmoting.textColor = value; 
				}
				break; 
			case "textflyin":
				if (insert) {
					if (value) insert.textFlyin = value; 
					else insert.textFlyin = null; 
				} else if (theatreId == Theatre.NARRATOR) {
					if (value) this.theatreNarrator.setAttribute("textflyin",value); 					
					else this.theatreNarrator.removeAttribute("textflyin",value); 
				} else {
					userEmoting.textFlyin = value; 
				}
				break; 
			case "textstanding":
				if (insert) {
					if (value) insert.textStanding = value; 
					else insert.textStanding = null; 
				} else if (theatreId == Theatre.NARRATOR) {
					if (value) this.theatreNarrator.setAttribute("textstanding",value); 
					else this.theatreNarrator.removeAttribute("textstanding",value); 
				} else {
					userEmoting.textStanding = value; 
				}
				break; 
			case "emote":
				// if provided a theatreId, set that insert's emote image + effects
				if (insert) {
					// if we're delaying our emote, and ths user is us, hold off on setting it
					if (this.isDelayEmote 
					&& userId == game.user.id
					&& (this.delayedSentState == 0 || this.delayedSentState == 1)) {
						if (this.delayedSentState == 0) {
							insert.delayedOldEmote = insert.emote; 
							this.delayedSentState = 1; 
						}
						if (Theatre.DEBUG) console.log("DELAYING EMOTE %s, 'showing' %s",value,insert.delayedOldEmote); 
					} else {
						insert.delayedOldEmote = insert.emote; 
						this.setEmoteForInsertById(value,theatreId,remote); 
					}
					if (value) insert.emote = value; 
					else insert.emote = null; 
				} else {
					userEmoting.emote = value; 
				}
				break; 
		}
		// Send to socket
		if (Theatre.DEBUG) console.log("SEND EMOTE PACKET %s,%s ??",this.isDelayEmote,this.delayedSentState); 
		if (!remote && (!this.isDelayEmote || this.delayedSentState == 2) && (insert || theatreId == Theatre.NARRATOR)) {
			if (Theatre.DEBUG) console.log("SENDING EMOTE PACKET %s,%s",this.isDelayEmote,this.delayedSentState); 
			this._sendSceneEvent("emote",{
				insertid: (insert ? insert.imgId : Theatre.NARRATOR), 
				emotions: {
					emote: (insert ? this._getEmoteFromInsert(insert) : null), 
					textflyin: (insert ? this._getTextFlyinFromInsert(insert) : this.theatreNarrator.getAttribute("textflyin")),
					textstanding: (insert ? this._getTextStandingFromInsert(insert) : this.theatreNarrator.getAttribute("textstanding")),
					textfont: (insert ? this._getTextFontFromInsert(insert) : this.theatreNarrator.getAttribute("textfont")),
					textsize: (insert ? this._getTextSizeFromInsert(insert) : this.theatreNarrator.getAttribute("textsize")),
					textcolor: (insert ? this._getTextColorFromInsert(insert) : this.theatreNarrator.getAttribute("textcolor")),
				}
			}); 
		}
	}

	/**
	 * set the user as typing, and or update the last typed
	 *
	 * @param userId (String) : The userId of the user that is to be set as 'typing'.
	 * @param theatreId (String) : The theatreId the user is 'typing' as.
	 */
	setUserTyping(userId,theatreId) {
		if (!this.usersTyping[userId])
			this.usersTyping[userId] = {}; 

		let userTyping = this.usersTyping[userId]; 
		if (userTyping.timeoutId)
			window.clearTimeout(userTyping.timeoutId);

		// clear old speakingId if it still exists
		if (theatreId != userTyping.theatreId) {
			let insert = this.getInsertById(userTyping.theatreId); 
			// if not destroyed already
			if (insert && insert.portrait) {
				// kill tweens
				// hide
				this._removeDockTween(insert.imgId,null,"typingAppear"); 
				this._removeDockTween(insert.imgId,null,"typingWiggle"); 
				this._removeDockTween(insert.imgId,null,"typingBounce"); 
				// fade away
				let oy = insert.portrait.height - 
					(insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);  

				// style specific settings
				switch (this.settings.theatreStyle) {
					case "lightbox":
						break; 
					case "clearbox":
						oy += (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);  
						break; 
					case "mangabubble":
						break; 
					case "textbox":
						break; 
					default:
						break; 
				}

				let tweenId = "typingVanish"; 	
				let tween = TweenMax.to(insert.typingBubble,0.2,{
					pixi:{scaleX: 0.01, scaleY: 0.01, alpha: 0, y: oy},
					ease: Power0.easeNone,
					onComplete: function(ctx,imgId,tweenId) {
						// decrement the rendering accumulator
						ctx._removeDockTween(imgId,this,tweenId); 
						this.targets()[0].scale.x = 1; 
						this.targets()[0].scale.y = 1; 
						// remove our own reference from the dockContainer tweens
					},
					onCompleteParams: [this,insert.imgId,tweenId]
				}); 
				this._addDockTween(insert.imgId,tween,tweenId); 

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
				this._removeDockTween(insert.imgId,null,"typingVanish"); 

				let tweenId = "typingAppear"; 	
				insert.typingBubble.scale.x = 0.01; 
				insert.typingBubble.scale.y = 0.01; 
				let tween = TweenMax.to(insert.typingBubble,0.2,{
					pixi:{scaleX: 1, scaleY: 1, alpha: 1},
					ease: Power0.easeNone,
					onComplete: function(ctx,imgId,tweenId) {
						// decrement the rendering accumulator
						ctx._removeDockTween(imgId,this,tweenId); 
						this.targets()[0].scale.x = 1; 
						this.targets()[0].scale.y = 1; 
						// remove our own reference from the dockContainer tweens
					},
					onCompleteParams: [this,insert.imgId,tweenId]
				}); 
				this._addDockTween(insert.imgId,tween,tweenId); 

				tweenId = "typingWiggle"; 	
				insert.typingBubble.rotation = 0.174533; 
				tween = TweenMax.to(insert.typingBubble,0.5,{
					pixi:{rotation: -10},
					ease: Power0.easeNone,
					repeat: -1,
					yoyo: true,
					onComplete: function(ctx,imgId,tweenId) {
						// decrement the rendering accumulator
						ctx._removeDockTween(imgId,this,tweenId); 
						// remove our own reference from the dockContainer tweens
					},
					onCompleteParams: [this,insert.imgId,tweenId]
				}); 
				this._addDockTween(insert.imgId,tween,tweenId); 

				let oy = insert.portrait.height - 
					(insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight) - insert.label.style.lineHeight*0.75;  
				// style specific settings
				switch (this.settings.theatreStyle) {
					case "clearbox":
						insert.typingBubble.y = insert.portrait.height;  
						oy += (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);  
						break; 
					case "mangabubble":
					case "lightbox":
					case "textbox":
					default:
						insert.typingBubble.y = insert.portrait.height - (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);  
						break; 
				}

				tweenId = "typingBounce"; 	
				tween = TweenMax.to(insert.typingBubble,0.25,{
					pixi:{y: oy},
					ease: Power3.easeOut,
					repeat: -1,
					yoyo: true,
					yoyoEase: Power0.easeNone,
					onComplete: function(ctx,imgId,tweenId) {
						// decrement the rendering accumulator
						ctx._removeDockTween(imgId,this,tweenId); 
						this.targets()[0].y = oy; 
						// remove our own reference from the dockContainer tweens
					},
					onCompleteParams: [this,insert.imgId,tweenId]
				}); 
				this._addDockTween(insert.imgId,tween,tweenId); 


				//insert.typingBubble.alpha = 1; 
				userTyping.theatreId = theatreId; 
			} else if (theatreId == Theatre.NARRATOR) {
				userTyping.theatreId = theatreId; 
			}
		}

		userTyping.timeoutId = window.setTimeout(()=>{
			if (Theatre.DEBUG) console.log("%s typing timeout",userId); 
			this.removeUserTyping(userId); 
		},6000); 
	}


	/**
	 * set the user as no longer typing
	 *
	 * @param userId (String) : The userId to remove as 'typing'.
	 */
	removeUserTyping(userId) {
		if (Theatre.DEBUG) console.log("removeUserTyping: ",this.usersTyping[userId]); 
		if (!this.usersTyping[userId]) {
			this.usersTyping[userId] = {}; 
			return; 
		}
		if (!this.usersTyping[userId].timeoutId) 
			return;

		if (this.usersTyping[userId].theatreId) {
			let insert = this.getInsertById(this.usersTyping[userId].theatreId); 
			// if not destroyed already
			if (insert) {
				// kill tweens
				// hide
				this._removeDockTween(insert.imgId,null,"typingAppear"); 
				this._removeDockTween(insert.imgId,null,"typingWiggle"); 
				this._removeDockTween(insert.imgId,null,"typingBounce"); 
				// fade away
				let oy = insert.portrait.height - 
					(insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);  
				// style specific settings
				switch (this.settings.theatreStyle) {
					case "lightbox":
						break; 
					case "clearbox":
						oy += (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);  
						break; 
					case "mangabubble":
						break; 
					case "textbox":
						break; 
					default:
						break; 
				}

				let tweenId = "typingVanish"; 	
				let tween = TweenMax.to(insert.typingBubble,0.2,{
					pixi:{scaleX: 0.01, scaleY: 0.01, alpha: 0, y: oy},
					ease: Power0.easeNone,
					onComplete: function(ctx,imgId,tweenId) {
						// decrement the rendering accumulator
						ctx._removeDockTween(imgId,this,tweenId); 
						this.targets()[0].scale.x = 1; 
						this.targets()[0].scale.y = 1; 
						// remove our own reference from the dockContainer tweens
					},
					onCompleteParams: [this,insert.imgId,tweenId]
				}); 
				this._addDockTween(insert.imgId,tween,tweenId); 

				//insert.typingBubble.alpha = 0; 
			}
		}

		if (Theatre.DEBUG) console.log("%s is no longer typing (removed)",userId); 
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
			console.log("ERROR, ACTOR %s DOES NOT EXIST!",actorId); 
			return null;
		}
		actor = actor.data; 
		//console.log("getting params from actor: ",actor); 

		let theatreId = `theatre-${actor._id}`; 
		let portrait = (actor.img ? actor.img : "icons/mystery-man.png"); 
		let optAlign = "top"; 
		let name = Theatre.getActorDisplayName(actor._id); 
		let emotes = {}; 
		let settings = {}; 

		// Use defaults incase the essential flag attributes are missing
		if (actor.flags.theatre) {
			if (actor.flags.theatre.name && actor.flags.theatre.name != "")
				name = actor.flags.theatre.name; 
			if (actor.flags.theatre.baseinsert && actor.flags.theatre.baseinsert != "")
				portrait = actor.flags.theatre.baseinsert; 
			if (actor.flags.theatre.optalign && actor.flags.theatre.optalign != "")
				optAlign = actor.flags.theatre.optalign; 
			if (actor.flags.theatre.emotes)
				emotes = actor.flags.theatre.emotes; 
			if (actor.flags.theatre.settings)
				settings = actor.flags.theatre.settings; 
		}

		return {
			src: portrait, 
			name: name, 
			optalign: optAlign, 
			imgId: theatreId, 
			emotes: emotes,
			settings: settings
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
		let actorId = theatreId.replace("theatre-",""); 
		let actor = game.actors.get(actorId); 

		if (!!!actor) {
			console.log("ERROR, ACTOR %s DOES NOT EXIST!",actorId); 
			return null;
		}

		if (Theatre.DEBUG) console.log('isDefaultDisabled ',actor); 

		if (actor.data.flags.theatre && actor.data.flags.theatre.disabledefault)
			return true;
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
	isActorOwner(userId,theatreId) {
		let user = game.users.get(userId); 
		if (user.isGM) return true; 
		let actorId = theatreId.replace("theatre-",""); 
		let actor = game.actors.get(actorId); 

		if (!!!actor) {
			console.log("ERROR, ACTOR %s DOES NOT EXIST!",actorId); 
			return false;
		}
		actor = actor.data; 
		if ((actor.permission[userId] && actor.permission[userId] >= 3)
		|| (actor.permission["default"] && actor.permission["default"] >= 3))
			return true; 
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
		let actorId = theatreId.replace("theatre-",""); 
		let actor = game.actors.get(actorId); 
		let user;

		if (!!!actor) {
			console.log("ERROR, ACTOR %s DOES NOT EXIST!",actorId); 
			return;
		}
		actor = actor.data; 
		for (let perm in actor.permission) {
			if (perm != "default") {
				user = game.users.get(perm); 
				if (!user.isGM)
					return true; 
			} else {
				if (actor.permission[perm] >=1)
					return true; 
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
	renderInsertById(id) {
		let insert = this.getInsertById(id); 
		let actorId = id.replace("theatre-",""); 
		let resName = "icons/myster-man.png";
		let params = this._getInsertParamsFromActorId(actorId); 
		if (!insert || !params) return; 

		if (insert.emote 
		&& params.emotes[insert.emote].insert 
		&& params.emotes[insert.emote].insert != "")
			resName = params.emotes[insert.emote].insert; 
		else
			resName = params.src; 

		// bubble up dataum from the update
		insert.optAlign = params.optalign;
		insert.name = params.name; 
		insert.label.text = params.name; 

		this._clearPortraitContainer(id); 
		this._setupPortraitContainer(id,params.optalign,resName,PIXI.Loader.shared.resources); 
		// re attach label + typing bubble
		insert.dockContainer.addChild(insert.label); 
		insert.dockContainer.addChild(insert.typingBubble); 

		this._repositionInsertElements(insert); 

		if (!this.rendering)
			this._renderTheatre(performance.now()); 
	}

	/**
	 * Initialize the tooltip canvas which renders previews for the emote menu
	 *
	 * @return (HTMLElement) : The canvas HTMLElement of the PIXI canvas created, or 
	 *                          null if unsuccessful. 
	 * @private
	 */
	_initTheatreToolTip() {
		let app = new PIXI.Application({width: 140, height: 140, transparent: true, antialias: true}); 
		let canvas = app.view; 

		if (!canvas) {
			console.log("FAILED TO INITILIZE TOOLTIP CANVAS!");
			return null; 
		}

		let holder = document.createElement("div"); 
		KHelpers.addClass(holder,"theatre-tooltip"); 
		KHelpers.addClass(holder,"app"); 
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
	configureTheatreToolTip(theatreId,emote) {
		if (!theatreId || theatreId == Theatre.NARRATOR) return; 

		let actorId = theatreId.replace("theatre-",""); 
		let params = this._getInsertParamsFromActorId(actorId); 
		let resources = PIXI.Loader.shared.resources; 

		if (!params) {
			console.log("ERROR actor no longer exists for %s",theatreId); 
			return; 
		}

		let resName = (emote && params.emotes[emote] && params.emotes[emote].insert ? params.emotes[emote].insert : params.src); 

		if (!resources[resName] || !resources[resName].texture) {
			console.log("ERROR could not load texture (for tooltip) %s",resName,resources); 
			return; 
		}

		let app = this.pixiToolTipCTX; 

		// clear canvas
		for (let idx=app.stage.children.length-1; idx >= 0; --idx) {
			let child = app.stage.children[idx]; 
			child.destroy(); 
			//app.stage.removeChildAt(idx); 
		}


		let sprite = new PIXI.Sprite(resources[resName].texture); 
		let portWidth =  resources[resName].texture.width; 
		let portHeight =  resources[resName].texture.height; 
		let maxSide = Math.max(portWidth,portHeight); 
		let scaledWidth,scaledHeight,ratio; 
		if (maxSide == portWidth) {
			// scale portWidth to 200px, assign height as a fraction
			scaledWidth = 140; 
			scaledHeight = portHeight * 140 / portWidth; 
			ratio = scaledHeight/portHeight; 
			app.stage.width = scaledWidth;
			app.stage.height = scaledHeight; 

			app.stage.addChild(sprite); 
			app.stage.scale.x = ratio*2; 
			app.stage.scale.y = ratio*2; 
			app.stage.y = 70 - (portHeight*ratio)/2; 
		} else {
			// scale portHeight to 200px, assign width as a fraction
			scaledHeight = 140; 
			scaledWidth = portWidth * 140 / portHeight; 
			ratio = scaledWidth/portWidth; 
			app.stage.width = scaledWidth;
			app.stage.height = scaledHeight; 

			app.stage.addChild(sprite); 
			app.stage.scale.x = ratio*2; 
			app.stage.scale.y = ratio*2; 
			app.stage.x = 70 - (portWidth*ratio*2)/2; 
		}

		// adjust dockContainer + portraitContainer dimensions to fit the image
		//app.stage.y = portHeight*ratio/2; 

		// set sprite initial coordinates + state
		sprite.x = 0; 
		sprite.y = 0; 
		
		//console.log("Tooltip Portrait loaded with w:%s h:%s scale:%s",portWidth,portHeight,ratio,sprite); 

		// render and show the tooltip
		app.render(); 
		this.theatreToolTip.style.opacity = 1; 
		// face detect
		/*
		faceapi.detectSingleFace(app.view,new faceapi.TinyFaceDetectorOptions()).then((detection)=>{
			console.log("face detected: ", detection); 
			if (detection) {
				let box = detection.box; 
				console.log("successful preview face detection: ", box); 
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
				console.log("FAILED TO FIND PREVIEW FACE"); 
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
		const MODEL_URL = "modules/theatre/app/weights"; 

		faceapi.loadSsdMobilenetv1Model(MODEL_URL); 
		faceapi.loadTinyFaceDetectorModel(MODEL_URL); 
		faceapi.loadFaceLandmarkModel(MODEL_URL); 
		faceapi.loadFaceRecognitionModel(MODEL_URL); 
	}

	/**
	 * Create the initial dock canvas, future 'portraits'
	 * witll be PIXI containers whom are sized to the portraits
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
			transparent: true, 
			antialias: true,
			width: document.body.offsetWidth
		});

		let canvas = app.view; 

		if (!canvas) {
			console.log("FAILED TO INITILIZE DOCK CANVAS!");
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
				if (Theatre.DEBUG) this._updateTheatreDebugInfo(insert); 
				// PIXI.v6 The renderer should not clear the canvas on rendering
				this.pixiCTX.renderer.render(insert.dockContainer, { clear: false });
			}
			else {
				console.log("INSERT HAS NO CONTAINER! _renderTheatre : HOT-EJECTING it! ",insert); 
				this._destroyPortraitDock(insert.imgId); 
			}
		}
		if (this.renderAnims > 0) {
			requestAnimationFrame(this._renderTheatre.bind(this)); 
		} else {
			if (Theatre.DEBUG) console.log("RENDERING LOOP STOPPED"); 
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
	_addDockTween(imgId,tween,tweenId) {
		let insert = this.getInsertById(imgId); 
		if (!insert || !insert.dockContainer) {
			// if dockContainer is destroyed, destroy the tween we were trying to add
			console.log("Invalid Tween for %s",imgId); 
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
				if (Theatre.DEBUG) console.log("RENDERING LOOP STARTED"); 
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
	_removeDockTween(imgId,tween,tweenId) {
		if (tween) tween.kill(); 

		let insert = this.getInsertById(imgId); 
		if (insert) {
			// if the tweenId doesn't exist, do nothing more
			if (!insert.tweens[tweenId])
				return; 
			if (!tween)
				insert.tweens[tweenId].kill(); 
			insert.tweens[tweenId] = null; 
			let nTweens = {}; 
			for (let prop in insert.tweens) {
				if (insert.tweens[prop] != null)
					nTweens[prop] = insert.tweens[prop]; 
			}
			// replace after we removed the prop
			insert.tweens = nTweens; 
		}

		this.renderAnims--; 

		//sanit check
		if(this.renderAnims < 0) {
			console.error("ERROR RENDER ANIM < 0 from %s of %s",tweenId,(insert ? insert.name : imgId)); 
			ui.notifications.error("ERROR RENDER ANIM < 0 "); 
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
		let insert = this.getInsertById(imgId)
		if (insert && insert.dockContainer) {
			// kill and release all tweens
			for (let tweenId in insert.tweens)
				this._removeDockTween(imgId,null,tweenId); 
			insert.tweens = null; 
			// destroy children
			for (let child of insert.portraitContainer.children)
				child.destroy(); 
			for (let child of insert.dockContainer.children)
				child.destroy(); 
			insert.portrait = null; 
			insert.portraitContainer = null; 
			insert.label = null; 
			// destroy self
			insert.dockContainer.destroy(); 
			insert.dockContainer = null; 
			let idx = this.portraitDocks.findIndex(e => e.imgId == imgId);
			this.portraitDocks.splice(idx,1); 
			// The "MyTab" module inserts another element with id "pause". Use querySelectorAll to make sure we catch both
			document.querySelectorAll("#pause").forEach(ele => KHelpers.removeClass(ele, "theatre-centered"));
			$('#players').removeClass("theatre-invisible");
			$('#hotbar').removeClass("theatre-invisible");
		}
		// force a render update
		//app.render(); 
		if (!this.rendering)
			this._renderTheatre(performance.now()); 

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
	_createPortraitPIXIContainer(imgPath,portName,imgId,optAlign,emotions,isLeft) {
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
			console.log("PRE-EXISTING PIXI CONTAINER FOR %s ",imgId); 
			this._destroyPortraitDock(imgId); 
		}

		//console.log("Creating PortraintPIXIContainer with emotions: ",emotions); 

		let ename,textFlyin,textStanding,textFont,textSize,textColor
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
			exitOrientation: (isLeft ? "left" : "right"),
			nameOrientation: "left",
			mirrored: false,
			optAlign: optAlign,
			tweens: {},
			order: 0,
			renderOrder: 0,
			meta: {}
		}); 

		let imgSrcs = [];

		imgSrcs.push({imgpath: "modules/theatre/app/graphics/typing.png", resname: "modules/theatre/app/graphics/typing.png"}); 
		imgSrcs.push({imgpath: imgPath, resname: imgPath}); 
		if (Theatre.DEBUG) console.log("Adding %s with src %s",portName,imgPath);  
		// get actor, load all emote images
		let actorId = imgId.replace("theatre-",""); 
		let params = this._getInsertParamsFromActorId(actorId); 

		if (!params) {
			console.log("ERROR: Actor does not exist for %s",actorId); 
			this._destroyPortraitDock(imgId); 
			return null; 
		}
		// load all rigging assets
		let rigResources = Theatre.getActorRiggingResources(actorId); 

		if (Theatre.DEBUG) console.log("RigResources for %s :",portName,rigResources); 
			
		for (let rigResource of rigResources)
			imgSrcs.push({imgpath: rigResource.path, resname: rigResource.path}); 

		// load all emote base images + rigging for the emotes
		for (let emName in params.emotes)
			if (params.emotes[emName])
				if (params.emotes[emName].insert &&  params.emotes[emName].insert != "")
					imgSrcs.push({imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert}); 

		// handles the waiting game of grabbing loader for us
		this._addSpritesToPixi(imgSrcs, (loader, resources)=>{
			// PIXI Container is ready!
			// Setup the dockContainer to display the base insert
			if (Theatre.DEBUG) console.log("Sprites added to PIXI _createPortraitPIXIContainer",resources); 
			let portWidth = (ename && params.emotes[ename] && params.emotes[ename].insert) ? 
				resources[params.emotes[ename].insert].texture.width : resources[imgPath].texture.width; 
			let initX = isLeft ? (-1 * portWidth) : (this.theatreDock.offsetWidth + portWidth); 

			if (!ename) {
				// load in default portrait
				dockContainer.x = initX; 
				this._setupPortraitContainer(imgId,optAlign,imgPath,resources,true); 
			} else {
				// load in the ename emote portrait instead if possible, else load the default
				if (params.emotes[ename] && params.emotes[ename].insert) {
					dockContainer.x = isLeft ? 
						(-1 * portWidth) : (this.theatreDock.offsetWidth + portWidth); 
					this._setupPortraitContainer(imgId,optAlign,params.emotes[ename].insert,resources,true); 
				} else {
					dockContainer.x = initX; 
					this._setupPortraitContainer(imgId,optAlign,imgPath,resources,true); 
				}
			}

		}); 
	}

	/**
	 * Sets up a portrait's PIXI dockContainer to size to
	 * the given resource
	 *
	 * @params imgId (String) : The theatreId of the insert whose portrait we're setting up.
	 * @params resName (String) : The resource name of the sprite to configure.
	 * @params resources (Object) : The resource object from PIXI.Loader.shared.
	 * @params reorder (Boolean) : Boolean to indicate if a reorder should be performed after
	 *                             an update. 
	 *
	 * @private
	 */
	_setupPortraitContainer(imgId,optAlign,resName,resources,reorder) {
		let insert = this.getInsertById(imgId); 

		if (!insert || !insert.dockContainer)	{
			console.error("ERROR PIXI Container was destroyed before setup could execute for %s",imgId); 
			ui.notifications.error(`${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1")} ${imgId} ${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2")} ${resName}`); 
			this.removeInsertById(imgId); 
			return; 
		}

		if (!resources[resName] || !resources[resName].texture) {
			console.error("ERROR could not load texture %s",resName,resources); 
			ui.notifications.error(`${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1")} ${imgId} ${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2")} ${resName}`); 
			this.removeInsertById(imgId); 
			return; 
		}

		let app = this.pixiCTX; 
		let dockContainer = insert.dockContainer; 
		let portraitContainer = insert.portraitContainer; 

		let sprite = new PIXI.Sprite(resources[resName].texture);
		let portWidth =  resources[resName].texture.width; 
		let portHeight =  resources[resName].texture.height; 
		let maxHeight = game.settings.get(Theatre.SETTINGS,"theatreImageSize");
		if (portHeight > maxHeight) {
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
		dockContainer.y = this.theatreDock.offsetHeight - (optAlign == "top" ? this.theatreBar.offsetHeight : 0) - portHeight; 
		
		// save and stage our sprite
		insert.portrait = sprite;
		insert.portrait.width = portWidth;
		insert.portrait.height = portHeight;

		portraitContainer.addChild(sprite);
		portraitContainer.pivot.x = portWidth/2; 
		portraitContainer.pivot.y = portHeight/2; 
		portraitContainer.x = portraitContainer.x + portWidth/2; 
		portraitContainer.y = portraitContainer.y + portHeight/2; 
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
				fontFamily: game.settings.get(Theatre.SETTINGS,"nameFont"),
				fontSize: 44,
				lineHeight: 64,
				//fontStyle: 'italic',
				fontWeight: this.fontWeight,
				fill: ['#ffffff'],
				stroke: '#000000',
				strokeThickness: 2,
				dropShadow: true,
				dropShadowColor: '#000000',
				dropShadowBlur: 1,
				dropShadowAngle: Math.PI / 6,
				breakWords: true,
				wordWrap: true,
				wordWrapWidth: portWidth
			}); 
			let label = new PIXI.Text(insert.name,textStyle); 
			// save and stage our label
			label.theatreComponentName = "label"; 
			insert.label = label; 
			dockContainer.addChild(label); 
			// initital positioning
			insert.label.x = 20;
		}
		// position the label
		insert.label.y = portHeight - (optAlign == "top" ? 0 : this.theatreBar.offsetHeight) - insert.label.lineHeight - 20; 

		// setup typing bubble
		if (!insert.typingBubble) {
			let typingBubble = new PIXI.Sprite(); 
			typingBubble.texture = resources["modules/theatre/app/graphics/typing.png"].texture; 
			typingBubble.width = 55; 
			typingBubble.height = 55; 
			typingBubble.theatreComponentName = "typingBubble"; 
			typingBubble.alpha = 0; 
			typingBubble.y = portHeight - 
				(optAlign == "top" ? 0 : this.theatreBar.offsetHeight) - insert.label.style.lineHeight + typingBubble.height/2;  

			insert.typingBubble = typingBubble; 
			dockContainer.addChild(typingBubble); 
		}

		// TheatreStyle specific adjustments
		switch (this.settings.theatreStyle) {
			case "lightbox":
				// to allow top-aligned portraits to work without a seam
				dockContainer.y += (optAlign == "top" ? 8 : 0); 
				insert.label.y -= (insert.optAlign == "top" ? 8 : 0); 
				break; 
			case "clearbox":
				dockContainer.y = this.theatreDock.offsetHeight - portHeight; 
				insert.label.y += (optAlign == "top" ? 0 : this.theatreBar.offsetHeight); 
				insert.typingBubble.y += (optAlign == "top" ? 0 : this.theatreBar.offsetHeight);  
				break; 
			case "mangabubble":
				break; 
			case "textbox":
				break; 
			default:
				break; 
		}
		
		if (Theatre.DEBUG) console.log("Portrait loaded with w:%s h:%s",portWidth,portHeight,sprite); 

		// run rigging animations if we have have any
		if (insert.emote) {
			let actorId = insert.imgId.replace("theatre-",""); 
			let defaultDisabled = this.isDefaultDisabled(insert.imgId); 
			if (Theatre.DEBUG) console.log("is default disabled? : %s",defaultDisabled); 
			let emotes = Theatre.getActorEmotes(actorId,defaultDisabled); 
			let rigResMap = Theatre.getActorRiggingResources(actorId); 
			if (emotes[insert.emote] && emotes[insert.emote].rigging) {
				for (let anim of emotes[insert.emote].rigging.animations) {
					this.addTweensFromAnimationSyntax(anim.name,anim.syntax,rigResMap,insert); 
				}
			}
		}

		if (Theatre.DEBUG) {
			// DEBUG BOX dockContainer
			let graphics = new PIXI.Graphics(); 
			graphics.lineStyle (1,0xFEEB77,1); 
			graphics.moveTo(0,0);
			graphics.lineTo(portWidth,0);
			graphics.lineTo(portWidth,portHeight); 
			graphics.lineTo(0,portHeight); 
			graphics.lineTo(0,0); 
			dockContainer.addChild(graphics); 
			let dimStyle = new PIXI.TextStyle({
				fontSize: 10,
				lineHeight: 30,
				fontWeight: "bold",
				fill: ['#FF383A'],
				stroke: '#000000',
				strokeThickness: 2,
				wordWrap: true,
				wordWrapWidth: portWidth
			}); 
			let pathStyle = new PIXI.TextStyle({
				fontSize: 22,
				lineHeight: 22,
				fontWeight: "bold",
				fill: ['#38FFEB'],
				stroke: '#000000',
				strokeThickness: 2,
				wordWrap: true,
				breakWords: true,
				wordWrapWidth: portWidth
			}); 
			let infoStyle = new PIXI.TextStyle({
				fontSize: 14,
				lineHeight: 14,
				fontWeight: "bold",
				fill: ['#ffffff'],
				stroke: '#000000',
				strokeThickness: 2,
				wordWrap: true,
				breakWords: true,
				wordWrapWidth: portWidth
			}); 
			let dims = new PIXI.Text(`${portWidth} px x ${portHeight} px`,dimStyle); 
			let path = new PIXI.Text(resources[resName].url,pathStyle); 
			let info = new PIXI.Text("X",infoStyle); 
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
			graphics.lineStyle (1,0xFFFFFF,1); 
			graphics.moveTo(0,0);
			graphics.lineTo(portWidth,0);
			graphics.lineTo(portWidth,portHeight); 
			graphics.lineTo(0,portHeight); 
			graphics.lineTo(0,0); 
			portraitContainer.addChild(graphics); 
		}

		if (reorder) {
			// fade in
			dockContainer.alpha = 0; 

			window.setTimeout(()=>{
				let tb = this._getTextBoxById(imgId);
				if (tb) tb.style.opacity = 1; 

				window.clearTimeout(this.reorderTOId)
				this.reorderTOId = window.setTimeout(()=>{
					Theatre.reorderInserts(); 
					this.reorderTOId = null; 
				},500); 
			},100); 
		} else {
			dockContainer.alpha = 1; 
		}

		//app.render(); 
		if (!this.rendering)
			this._renderTheatre(performance.now()); 
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
		if (!insert || !insert.dockContainer)
			return; 
		let info = insert.dockContainer.children.find(e => e.theatreComponentName == "debugInfo");
		if (info) {
			info.text = (
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
				`renderOrder: ${insert.renderOrder}\n`
				/*
				`meta (#): ${insert.meta.length}\n`
				*/
			); 
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
			console.log("ERROR: No insert, or portrait available ", insert); 
			return; 
		}
		// re-align the dockContainer to the textBox and its nameOrientation
		let textBox = this.getTextBoxById(insert.imgId); 
		let offset = KHelpers.offset(textBox); 
		let leftPos = Math.round(
				Number(offset.left || 0)
				- Number(KHelpers.style(textBox)["left"].match(/\-*\d+\.*\d*/) || 0)
				- Number(KHelpers.style(this.theatreBar)["margin-left"].match(/\-*\d+\.*\d*/) || 0)
		); 
		// pre-split measurement
		insert.label.style.wordWrap = false; 
		insert.label.style.wordWrapWidth = insert.portrait.width; 
		let labelExceeds = (insert.label.width+20+insert.label.style.fontSize) > textBox.offsetWidth; 
		let preLabelWidth = insert.label.width; 
		// split measurement
		insert.label.style.wordWrap = true; 
		insert.label.style.wordWrapWidth = textBox.offsetWidth; 
		// Scale the name bar length and orient the portait
		if (insert.nameOrientation == "left") {
			insert.label.x = 20; 
			insert.typingBubble.anchor.set(0.5); 
			insert.typingBubble.x = Math.min(preLabelWidth + 20 + insert.typingBubble.width/2, textBox.offsetWidth - insert.typingBubble.width/2); 

		} else {
			if (labelExceeds) {
				insert.label.x = insert.portrait.width - insert.label.width - 20; 
				if (insert.label.width - 20 > insert.portrait.width)
					insert.typingBubble.x = Math.min(insert.portrait.width - insert.label.width - insert.typingBubble.texture.width/2 - 20, insert.typingBubble.width/2); 
				else
					insert.typingBubble.x = Math.max(insert.portrait.width - insert.label.width - insert.typingBubble.texture.width/2 - 20, insert.typingBubble.width/2); 
			} else {
				insert.label.x = insert.portrait.width - preLabelWidth - 20; 
				if (preLabelWidth - 20 > insert.portrait.width)
					insert.typingBubble.x = Math.min(insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width/2 - 20, insert.typingBubble.width/2); 
				else
					insert.typingBubble.x = Math.max(insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width/2 - 20, insert.typingBubble.width/2); 
			}

			insert.typingBubble.anchor.set(0.5); 

			leftPos += textBox.offsetWidth - insert.portrait.width; 
		}
		insert.typingBubble.y = insert.portrait.height - 
			(insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight + insert.typingBubble.height/2;  
		// if the label height > font-size, it word wrapped wrap, so we need to bump up the height
		if (labelExceeds) {
			let divisor = Math.round(insert.label.height/insert.label.style.lineHeight); 
			insert.label.y = insert.portrait.height - 
				(insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - (insert.label.style.lineHeight*divisor);  
		} else {
			// normal
			insert.label.y = insert.portrait.height - 
				(insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight;  
		}
		insert.typingBubble.rotation = 0.1745; 
		insert.dockContainer.x = leftPos; 
		insert.dockContainer.y = this.theatreDock.offsetHeight 
			- (insert.optAlign == "top" ? this.theatreBar.offsetHeight : 0) - insert.portrait.height; 

		// theatreStyle specific adjustments
		switch (this.settings.theatreStyle) {
			case "lightbox":
				// to allow top-aligned portraits to work without a seam
				insert.dockContainer.y += (insert.optAlign == "top" ? 8 : 0); 
				insert.label.y -= (insert.optAlign == "top" ? 8 : 0); 
				break; 
			case "clearbox":
				insert.dockContainer.y = this.theatreDock.offsetHeight - insert.portrait.height; 
				insert.label.y += (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight); 
				insert.typingBubble.y += (insert.optAlign == "top" ? 0 : Theatre.instance.offsetHeight);  
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
	async _AddTextureResource(imgSrc,resName,imgId,emote,cb,remote) {
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
		let container = (insert ? insert.dockContainer : null); 
		// If no insert/container, this is fine
		let app = this.pixiCTX; 
		let actorId = imgId.replace("theatre-",""); 	
		let actorParams = this._getInsertParamsFromActorId(actorId); 
		// no actor is also fine if this is some kind of rigging resource

		// src check, not fine at all!
		if (!await srcExists(imgSrc)) {
			console.log("ERROR (_AddTextureResource) : Replacement texture does not exist %s ",imgSrc); 
			return; 
		}

		let loader = PIXI.Loader.shared;
		/*
		if (loader.resources[resName])
			loader.resources[resName] = null; 
		*/

		// if we have no resName then just return the cb
		if (!resName || resName == "") {
			cb.call(this,loader,loader.resources); 
			return; 
		}

		let imgSrcs = [{resname: resName, imgpath: imgSrc}]; 
		if (Theatre.DEBUG) console.log("replace textures",imgSrcs); 
		this._addSpritesToPixi(imgSrcs, (loader, resources)=>{
			cb.call(this,loader,resources); 
		}); 

		// Send to socket
		if (!remote) {
			// broadcast change to clients
			this._sendSceneEvent("addtexture",{
				insertid: imgId,
				imgsrc: imgSrc,
				resname: resName,
				emote: emote
			}); 
		}

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
	async _AddAllTextureResources(imgSrcs,imgId,emote,eresName,cb,remote) {
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
		let container = (insert ? insert.dockContainer : null); 
		// If no insert/container, this is fine
		let app = this.pixiCTX; 
		let actorId = imgId.replace("theatre-",""); 	
		let actorParams = this._getInsertParamsFromActorId(actorId); 
		// no actor is also fine if this is some kind of rigging resource

		// src check, not fine at all!
		for (let src of imgSrcs)
			if (!await srcExists(src.imgpath)) {
				console.log("ERROR (_AddAllTextureResources) : Replacement texture does not exist %s ",src); 
				return; 
			}

		let loader = PIXI.Loader.shared;
		/*
		if (loader.resources[resName])
			loader.resources[resName] = null; 
		*/

		// if we have an emtpy imgSrc array, just return the cb
		if (imgSrcs.length <= 0) {
			cb.call(this,loader,loader.resources); 
			return; 
		}

		if (Theatre.DEBUG) console.log("replace textures",imgSrcs); 
		this._addSpritesToPixi(imgSrcs, (loader, resources)=>{
			cb.call(this,loader,resources); 
		}); 

		// Send to socket
		if (!remote) {
			// broadcast change to clients
			this._sendSceneEvent("addalltextures",{
				insertid: imgId,
				imgsrcs: imgSrcs,
				emote: emote,
				eresname: eresName
			}); 
		}

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
		let ox = insert.portraitContainer.x - insert.portrait.width/2; 
		let oy = insert.portraitContainer.y - insert.portrait.height/2; 
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
			if (tweenId == "nameSpeakingPulse"
			|| tweenId == "typingBounce"
			|| tweenId == "typingAppear"
			|| tweenId == "typingVanish"
			|| tweenId == "typingWiggle")
				continue; 
			this._removeDockTween(imgId,null,tweenId); 
		}
		insert.tweens = {}; 
		if (oLabelAnim)
			insert.tweens["nameSpeakingPulse"] = oLabelAnim; 
		if (oTypingBounceAnim)
			insert.tweens["typingBounce"] = oTypingBounceAnim; 
		if (oTypingWiggleAnim)
			insert.tweens["typingWiggle"] = oTypingWiggleAnim; 
		if (oTypingAppearAnim)
			insert.tweens["typingAppear"] = oTypingAppearAnim; 
		if (oTypingVanishAnim)
			insert.tweens["typingVanish"] = oTypingVanishAnim; 

		// destroy children
		for (let child of insert.portraitContainer.children)
			child.destroy(); 
		// attempt to preserve label + typingBubble
		for (let idx=insert.dockContainer.children.length-1; idx >=0; --idx) {
			let child = insert.dockContainer.children[idx]; 
			if (child.theatreComponentName && child.theatreComponentName == "label")
				insert.dockContainer.removeChildAt(idx); 
			else if (child.theatreComponentName && child.theatreComponentName == "typingBubble")
				insert.dockContainer.removeChildAt(idx); 
			else
				child.destroy(); 
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
		dockContainer.y = ocy
		// assignment
		insert.dockContainer = dockContainer; 
		insert.portraitContainer = portraitContainer; 
		if (Theatre.DEBUG) console.log("saving ox: %s, oy: %s",ox,oy); 
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
	_addSpritesToPixi(imgSrcs, cb) {
		if (Theatre.DEBUG) console.log("adding sprite to dockContainer"); 
		let loader = PIXI.Loader.shared; 

		// Load in our resources if needed


		// if loader is running, we will stick a timeout and wait,
		// possibly fighting with others on the event looop for the loader
		if (!loader.loading) {
			if (Theatre.DEBUG) console.log("resources",loader); 
			for (let imgTuple of imgSrcs) {
				let resName = imgTuple.resname; 
				if (!loader.resources[resName])
					loader.add(resName,imgTuple.imgpath); 
			}

			loader.load((loader,resources)=>{
				cb.call(this,loader,resources); 
			}); 
		} else {
			window.setTimeout(()=>{
				if (Theatre.DEBUG) console.log("loader not done, waiting"); 
				this._getLoaderChainWait(this,imgSrcs,cb).call(this); 
			},200); 
		}
	}

	/**
	 * Loader chain waiting
	 *
	 * @params ctx (Context) : The context to invoke the callback with
	 * @params imcSrcs (Array[Object]) : An array of {imgsrc: (String), resname (String)} pairs
	 *                                   representing the assets to be loaded into PIXI's loader.
	 * @params cb (Function) : The function to invoke once the assets are loaded. 
	 *
	 * @private
	 */
	_getLoaderChainWait(ctx,imgSrcs,cb) {
		let loader = PIXI.Loader.shared; 
		let func = function () {
			if (!loader.loading) {
				if (Theatre.DEBUG) console.log("delayed loading resources",loader); 
				for (let imgTuple of imgSrcs) {
					let resName = imgTuple.resname; 
					if (!loader.resources[resName])
						loader.add(resName,imgTuple.imgpath); 
				}

				loader.load((loader,resources)=>{
					cb.call(ctx,loader,resources); 
				}); 
			} else {
				window.setTimeout(()=>{
					if (Theatre.DEBUG) console.log("loader not done, waiting"); 
					this._getLoaderChainWait(this,imgSrcs,cb).call(this); 
				},200); 
			}
		}
		return func; 
	}

	/**
	 * Given an array of theatreIds, stage them all
	 *
	 * @params ids (Array[(String)] : An array of theatreIds of inserts to load.
	 * @params cb (Function) : The function to invoke once the assets are loaded. 
	 */
	stageAllInserts(ids,cb) {
		let actorId,params; 
		let imgSrcs = []; 
		for (let id of ids) {
			actorId = id.replace("theatre-",""); 
			params = this._getInsertParamsFromActorId(actorId); 
			if (!params) continue; 

			// base insert
			imgSrcs.push({imgpath: params.src, resname: params.src}); 

			// load all rigging assets
			let rigResources = Theatre.getActorRiggingResources(actorId); 

			if (Theatre.DEBUG) console.log("RigResources for %s :",params.name,rigResources); 
				
			for (let rigResource of rigResources)
				imgSrcs.push({imgpath: rigResource.path, resname: rigResource.path}); 

			// load all emote base images + rigging for the emotes
			for (let emName in params.emotes)
				if (params.emotes[emName])
					if (params.emotes[emName].insert &&  params.emotes[emName].insert != "")
						imgSrcs.push({imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert}); 
		}

		// load in the sprites
		this._addSpritesToPixi(imgSrcs,cb); 
	}

	/**
	 * "Stages" an insert by pre-loading the base + all emote images
	 *
	 * @params theatreId (String) : The theatreId of the insert to load.
	 * @params remote (Boolean) : Whether this is being invoked remotely or locally. 
	 */
	stageInsertById(theatreId,remote) {
		let actorId = theatreId.replace("theatre-",""); 
		let params = this._getInsertParamsFromActorId(actorId); 
		if (!params) return;
		//console.log("params: ",params); 
		// kick asset loader to cache the portrait + emotes
		let imgSrcs = [];

		//imgSrcs.push({imgpath: params.src, resname: `portrait-${theatreId}`}); 
		// get actor, load all emote images
		if (!params) {
			console.log("ERROR: Actor does not exist for %s",actorId); 
			return null; 
		}

		imgSrcs.push({imgpath: params.src, resname: params.src}); 

		// load all rigging assets
		let rigResources = Theatre.getActorRiggingResources(actorId); 

		if (Theatre.DEBUG) console.log("RigResources for %s :",params.name,rigResources); 
			
		for (let rigResource of rigResources)
			imgSrcs.push({imgpath: rigResource.path, resname: rigResource.path}); 

		// load all emote base images + rigging for the emotes
		for (let emName in params.emotes)
			if (params.emotes[emName])
				if (params.emotes[emName].insert &&  params.emotes[emName].insert != "")
					imgSrcs.push({imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert}); 

		// load in the sprites
		this._addSpritesToPixi(imgSrcs,(loader, resources)=>{
			if (Theatre.DEBUG) console.log("staging complete for %s",theatreId,resources); 
		}); 

		// Send socket event
		if (!remote)
			Theatre.instance._sendSceneEvent("stage",{insertid: theatreId})
	}

	/**
	 * Set the emote given the id
	 *
	 * @params ename (String) : The emote name.
	 * @params id (String) : The theatreId of the insert. 
	 * @params remote (Boolean) : Wither this is being invoked remotely or locally. 
	 */
	setEmoteForInsertById(ename,id,remote) {
		let insert = this.getInsertById(id);

		this._setEmoteForInsert(ename,insert,remote); 
	}
	/**
	 * Set the emote given the name
	 *
	 * @params ename (String) : The emote name.
	 * @params name (String) : The label name of the insert. 
	 * @params remote (Boolean) : Wither this is being invoked remotely or locally. 
	 */
	setEmoteForInsertByName(ename,name,remote) {
		let insert = this.getInsertByName(name);

		this._setEmoteForInsert(ename,insert,remote); 
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
	_setEmoteForInsert(ename,insert,remote) {
		// given the emote name, get the image if possible,
		// and add it to the insert canvas.
		//
		// If the insert already is that emote, do nothing,
		// If the insert emote does not exist, set the base insert
		// if the insert emote does not exist and the insert is
		// already either the base insert, or an emote without an
		// insert, do nothing
		if (!insert) return; 
		let aEmote = insert.emote; 
		let actorId = insert.imgId.replace("theatre-",""); 
		let actor = game.actors.get(actorId); 
		if (!actor) return; 

		let baseInsert = actor.data.img ? actor.data.img : "icons/mystery-man.png"; 
		if (actor.data.flags.theatre)
			baseInsert = actor.data.flags.theatre.baseinsert ? actor.data.flags.theatre.baseinsert : baseInsert; 
		let emotes = Theatre.getActorEmotes(actorId); 

		// emote already active
		//if ((this.speakingAs != insert.imgId && !this.isDelayEmote) || this.delayedSentState > 2)
		if (remote || !this.isDelayEmote)
			if (aEmote == ename || (ename == null && aEmote == null)) return; 

		// if emote insert exists
		let app = this.pixiCTX; 
		if (!!ename
		&& emotes[ename] 
		&& emotes[ename].insert
		&& emotes[ename].insert != "") {
			// clear the pixi container
			this._clearPortraitContainer(insert.imgId)
			// set this sprite to span the PIXI Container via _setupPortraitCanvas
			let imgSrcs = [];
			// emote base image
			let emoteResName = emotes[ename].insert; 
			imgSrcs.push({imgpath: emotes[ename].insert, resname: emoteResName}); 
			// add sprites
			this._addSpritesToPixi(imgSrcs, (loader, resources) => {
				if (Theatre.DEBUG) console.log("emote insert loaded",resources); 
				// Error loading the sprite
				if (!resources[emoteResName] || resources[emoteResName].error) {
					console.error("ERROR loading resource %s : %s : %s",insert.imgId,emoteResName,emotes[ename].insert); 
					ui.notifications.error(game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1") + 
							+ emoteResName
							+ game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2") + emotes[ename].insert + "'");
					this.removeInsertById(insert.imgId); 
				}

				// flag our insert with our emote state
				insert.emote = ename; 
				// now fix up the PIXI Container and make it pretty
				this._setupPortraitContainer(insert.imgId,insert.optAlign,emoteResName,resources); 
				// re-attach label + typingBubble
				insert.dockContainer.addChild(insert.label); 
				insert.dockContainer.addChild(insert.typingBubble); 

				this._repositionInsertElements(insert); 

				if (!this.rendering)
					this._renderTheatre(performance.now()); 
			}); 
		} else {
			// load base insert unless the base insert is already loaded
			let loader = PIXI.Loader.shared;
			let baseExists = false; 

			this._clearPortraitContainer(insert.imgId)

			// flag our insert with our emote state, unless we're "actually" no emote rather
			// than just emoting with no insert available
			if (ename)
				insert.emote = ename; 
			else
				insert.emote = null; 

			// if baseInsert is not present, put it in
			if (!loader.resources[baseInsert]) {
				let imgSrcs = []; 
				// clear the PIXI Container
				imgSrcs.push({imgpath: baseInsert, resname: baseInsert}); 
				this._addSpritesToPixi(imgSrcs, (loader, resources) => {
					if (Theatre.DEBUG) console.log("base insert re-loaded",resources); 
					// Error loading the sprite
					if (!resources[baseInsert] || resources[baseInsert].error) {
						console.error("ERROR loading resource %s : %s : %s",insert.imgId,baseInsert,baseInsert); 
						ui.notifications.error(game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1") + 
								+ baseInsert
								+ game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2") + baseInsert + "'");
						this.removeInsertById(insert.imgId); 
					}

					// now fix up the PIXI Container and make it pretty
					this._setupPortraitContainer(insert.imgId,insert.optAlign,baseInsert,resources); 

					// re-attach label + typingBubble
					insert.dockContainer.addChild(insert.label); 
					insert.dockContainer.addChild(insert.typingBubble); 

					this._repositionInsertElements(insert); 

					if (!this.rendering)
						this._renderTheatre(performance.now()); 
				}); 
			} else {
				// base exists
				this._setupPortraitContainer(insert.imgId,insert.optAlign,baseInsert,loader.resources); 

				// re-attach label + typingBubble
				insert.dockContainer.addChild(insert.label); 
				insert.dockContainer.addChild(insert.typingBubble); 

				this._repositionInsertElements(insert); 

				if (!this.rendering)
					this._renderTheatre(performance.now()); 
			}

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
		for (let container of this.theatreBar.children)
			for (let textBox of container.children) 
				textBoxes.push(textBox); 
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
		return this._getTextBoxes().find(e=>{return e.getAttribute("imgId") == id}); 
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
		return this._getTextBoxes().find(e=>{return e.getAttribute("name") == name}); 
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
	_addTextBoxToTheatreBar(textBox,isLeft) {
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
			Hooks.call("theatreDockActive",this.dockActive);
		} else if (textBoxes.length == 1) {
			// single dock
			// 1. slide in second container, and add new textBox to it
			let insert = this.getInsertById(textBox.getAttribute("imgId")); 
			if (insert) {
				//insert.meta.fromPrime = true;
				insert.nameOrientation = "right"; 
			}

			let dualWidth = Math.min(Math.floor(this.theatreBar.offsetWidth/2),650); 
			secondBar.style.left = `calc(100% - ${dualWidth}px)`; 
			secondBar.style.opacity = "1";  
			secondBar.style["pointer-events"] = "all";  
			secondBar.style.width = `${dualWidth}px`; 
			primeBar.style.width = `${dualWidth}px`; 

			secondBar.appendChild(textBox); 
			Hooks.call("theatreDockActive",this.dockActive);
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

			if (isLeft) KHelpers.insertBefore(textBox,primeBar.children[0]); 
			else primeBar.appendChild(textBox); 
			Hooks.call("theatreDockActive",this.dockActive);

		} else if (textBoxes.length > 2){
			// bar dock
			// 1. Just find the prime container, and add the new textBox to it
			if (isLeft) KHelpers.insertBefore(textBox,primeBar.children[0]); 
			else primeBar.appendChild(textBox); 
			Hooks.call("theatreDockActive",this.dockActive);

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
			console.log("REMOVE TEXTBOX ERROR, NO TEXTBOXES",textBox,this.theatreBar); 
		} else if (textBoxes.length == 1) {
			// single dock
			// 1. Remove the text Box, and close the primary bar
			primeBar.style.left = "-100%";
			primeBar.style.opacity = "0";  
			primeBar.style["pointer-events"] = "none"; 
			textBox.parentNode.removeChild(textBox); 
			this.theatreBar.style.opacity = "0";  
			Hooks.call("theatreDockActive",this.dockActive);
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
			Hooks.call("theatreDockActive",this.dockActive);

		} else if (textBoxes.length == 3){
			// bar dock
			// 1. create the dual docks 
			for (let idx=primeBar.children.length-1; idx>=0; --idx) {
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
			let dualWidth = Math.min(Math.floor(this.theatreBar.offsetWidth/2),650); 
			secondBar.style.left = `calc(100% - ${dualWidth}px)`; 
			secondBar.style.opacity = "1";  
			secondBar.style["pointer-events"] = "all";  
			secondBar.style.width = `${dualWidth}px`; 
			primeBar.style.width = `${dualWidth}px`; 

			textBox.parentNode.removeChild(textBox); 
			Hooks.call("theatreDockActive",this.dockActive);
		} else {
			// normal bar removal
			textBox.parentNode.removeChild(textBox); 
			Hooks.call("theatreDockActive",this.dockActive);
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
	injectLeftPortrait(imgPath,portName,imgId,optAlign,emotions,remote) {
		if (!!this.getInsertById(imgId)) {
			console.log('ID "%s" already exists! Refusing to inject %s',imgId,portName); 
			return; 
		}
		if (this.portraitDocks.length == 1) {
			// inject Right instread
			this.injectRightPortrait(imgPath,portName,imgId,optAlign,emotions,remote); 
			return; 
		}

		// activate in navbar if not already
		let navItem = this.getNavItemById(imgId);
		if (navItem)
			KHelpers.addClass(navItem,"theatre-control-nav-bar-item-active");

		let dock = this._createPortraitPIXIContainer(imgPath,portName,imgId,optAlign,emotions,true);
		let textBox = document.createElement("div");
		// textBox class + style depends on our display mode
		switch (this.settings.theatreStyle) {
			case "lightbox":
				KHelpers.addClass(textBox,"theatre-text-box-light"); 
				break; 
			case "clearbox":
				KHelpers.addClass(textBox,"theatre-text-box-clear"); 
				break; 
			case "mangabubble":
				break; 
			case "textbox":
			default:
				KHelpers.addClass(textBox,"theatre-text-box"); 
				break; 
		}
		KHelpers.addClass(textBox,"no-scrollbar"); 

		portName = portName.toLowerCase(); 
		textBox.setAttribute('name',portName); 
		textBox.setAttribute("imgid",imgId); 
		textBox.style.opacity = "0"; 
		this._applyFontFamily(textBox,this.textFont); 

		textBox.addEventListener("mousedown",this.handleTextBoxMouseDown); 
		textBox.addEventListener("mouseup",this.handleTextBoxMouseUp); 
		textBox.addEventListener("dblclick",this.handleTextBoxMouseDoubleClick); 

		// NOTE: we leave insert container positioning up to reorderInserts
		// which will fire when the loader processes it for injection
		this._addTextBoxToTheatreBar(textBox,true); 

		// Push to socket our event
		if (!remote)
		this._sendSceneEvent("enterscene",{insertid: imgId, emotions: emotions, isleft: true}); 
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
	injectRightPortrait(imgPath,portName,imgId,optAlign,emotions,remote) {
		if (!!this.getInsertById(imgId)) {
			console.log('ID "%s" already exists! Refusing to inject %s',imgId,portName); 
			return; 
		}
		if (this.portraitDocks.length == 0) {
			// inject Left instread
			this.injectLeftPortrait(imgPath,portName,imgId,optAlign,emotions,remote); 
			return; 
		}

		// activate in navbar if not already
		let navItem = this.getNavItemById(imgId);
		if (navItem)
			KHelpers.addClass(navItem,"theatre-control-nav-bar-item-active");

		let dock = this._createPortraitPIXIContainer(imgPath,portName,imgId,optAlign,emotions,false);
		let textBox = document.createElement("div"); 
		// textBox class + style depends on our display mode
		switch (this.settings.theatreStyle) {
			case "lightbox":
				KHelpers.addClass(textBox,"theatre-text-box-light"); 
				break; 
			case "clearbox":
				KHelpers.addClass(textBox,"theatre-text-box-clear"); 
				break; 
			case "mangabubble":
				break; 
			case "textbox":
			default:
				KHelpers.addClass(textBox,"theatre-text-box"); 
				break; 
		}
		KHelpers.addClass(textBox,"no-scrollbar"); 

		portName = portName.toLowerCase(); 
		textBox.setAttribute('name',portName); 
		textBox.setAttribute("imgid",imgId); 
		textBox.style.opacity = "0"; 
		this._applyFontFamily(textBox,this.textFont); 

		textBox.addEventListener("mousedown",this.handleTextBoxMouseDown); 
		textBox.addEventListener("mouseup",this.handleTextBoxMouseUp); 
		textBox.addEventListener("dblclick",this.handleTextBoxMouseDoubleClick); 

		this._addTextBoxToTheatreBar(textBox); 

		// Push to socket our event
		if (!remote)
			this._sendSceneEvent("enterscene",{insertid: imgId, emotions: emotions, isleft: false}); 
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
	removeInsertById(id,remote) {
		name = name.toLowerCase(); 
		let toRemoveInsert,
				toRemoveTextBox; 
		for (let insert of this.portraitDocks) {
			if (insert.imgId == id && !insert.deleting) {
				insert.deleting = true; 
				toRemoveInsert = insert; 
				break; 
			}
		}
		for (let textBox of this._getTextBoxes()) {
			if (textBox.getAttribute("imgId") == id && !!!textBox.getAttribute("deleting")) {
				textBox.setAttribute("deleting",true); 
				toRemoveTextBox = textBox
				break; 
			}
		}
		if (!!!toRemoveInsert || !!!toRemoveTextBox)
			return null; 

		return this._removeInsert(toRemoveInsert,toRemoveTextBox,remote); 	
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
	removeInsertByName(name,remote) {
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
				textBox.setAttribute("deleting",true); 
				toRemoveTextBox = textBox
				break; 
			}
		}
		if (!!!toRemoveInsert || !!!toRemoveTextBox)
			return null; 

		return this._removeInsert(toRemoveInsert,toRemoveTextBox,remote); 	
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
	_removeInsert(toRemoveInsert,toRemoveTextBox,remote) {
		let isOwner = this.isActorOwner(game.user.id,toRemoveInsert.imgId); 
		// permission check
		if (!remote && !isOwner) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return null; 
		}

		if (toRemoveInsert.decayTOId) {
			window.clearTimeout(toRemoveInsert.decayTOId); 
			toRemoveInsert.decayTOId = null; 
		}

		// Save configuration if this is not a remote operation, and we're the owners of this 
		// insert
		if (!remote && isOwner) {
			let actorId = toRemoveInsert.imgId.replace("theatre-",""); 
			let actor = game.actors.get(actorId); 
			if (actor) {
				let skel = {}; 
				skel["flags.theatre.settings.emote"] = toRemoveInsert.emote; 
				skel["flags.theatre.settings.textflyin"] = toRemoveInsert.textFlyin; 
				skel["flags.theatre.settings.textstanding"] = toRemoveInsert.textStanding; 
				skel["flags.theatre.settings.textfont"] = toRemoveInsert.textFont; 
				skel["flags.theatre.settings.textsize"] = toRemoveInsert.textSize; 
				skel["flags.theatre.settings.textcolor"] = toRemoveInsert.textColor; 
				actor.update(skel).then((response)=>{
					if (Theatre.DEBUG) console.log("updated with resp: ",response); 
				}); 
			}
		}

		// animate and delayed removal
		//let isLeft = toRemoveInsert.getElementsByClassName("theatre-portrait-left").length > 0; 
		let exitX = 0; 
		if (toRemoveInsert.portrait) {
			if (toRemoveInsert.exitOrientation == "left") {
				exitX = toRemoveInsert.dockContainer.x - toRemoveInsert.portrait.width
			} else {
				exitX = toRemoveInsert.dockContainer.x + toRemoveInsert.portrait.width
			}
		}

		// Push to socket our event
		if (!remote)
			this._sendSceneEvent("exitscene",{insertid: toRemoveInsert.imgId}); 

		// unactivate from navbar
		for(let navItem of this.theatreNavBar.children)
			if (navItem.getAttribute("imgId") == toRemoveInsert.imgId) {
				KHelpers.removeClass(navItem,"theatre-control-nav-bar-item-active"); 
				if (toRemoveInsert.imgId == this.speakingAs)
					KHelpers.removeClass(navItem,"theatre-control-nav-bar-item-speakingas"); 
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
				if (this.usersTyping[userId] && (this.usersTyping[userId].theatreId == toRemoveInsert.imgId)) {
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
			for (let sc of c.children) 
				TweenMax.killTweensOf(sc); 
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
		let tween = TweenMax.to(toRemoveInsert.dockContainer,1,{
			//delay: 0.5,
			pixi:{x: exitX, alpha: 0},
			ease: Power4.easeOut,
			onComplete: function(ctx,imgId,tweenId) {
				// decrement the rendering accumulator
				ctx._removeDockTween(imgId,this,tweenId); 
				// remove our own reference from the dockContainer tweens
			},
			onCompleteParams: [this,toRemoveInsert.imgId,tweenId],
		}); 
		this._addDockTween(toRemoveInsert.imgId,tween,tweenId); 


		window.setTimeout(()=>{
			this._destroyPortraitDock(toRemoveInsert.imgId)
			this._removeTextBoxFromTheatreBar(toRemoveTextBox); 

			if (this.reorderTOId)
				window.clearTimeout(this.reorderTOId)

			this.reorderTOId = window.setTimeout(()=>{
				Theatre.reorderInserts(); 
				this.reorderTOId = null; 
			},750); 

		},1000); 

		// return results of what was removed
		return {insert: toRemoveInsert, textBox: toRemoveTextBox}; 
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
		if (theatreActor)
			return theatreActor.navElement;
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
			if (navItem.getAttribute("name") == name)
				return navItem; 
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
		if (id == Theatre.NARRATOR)
			return this.theatreNarrator.getElementsByClassName("theatre-narrator-content")[0]; 
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
		if (name == Theatre.NARRATOR)
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
		for (let idx=this.portraitDocks.length-1; idx>=0; --idx)
			if (this.portraitDocks[idx].imgId == id) {
				if (this.portraitDocks[idx].dockContainer)
					return this.portraitDocks[idx]; 
				else {
					this.portraitDocks.splice(idx,1); 
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
		for (let idx=this.portraitDocks.length-1; idx>=0; --idx)
			if (this.portraitDocks[idx].name == name) {
				if (this.portraitDocks[idx].dockContainer)
					return this.portraitDocks[idx]; 
				else {
					this.portraitDocks.splice(idx,1); 
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
	swapInsertsById(id1,id2,remote) {
		if (this.portraitDocks.length < 2) return; 

		let insert1,
				insert2,
				textBox1,
				textBox2; 
		for (let insert of this.portraitDocks) {
			if (insert.imgId == id1 && !!!insert1)
				insert1 = insert; 
			else if (insert.imgId == id2 && !!!insert2)
				insert2 = insert; 
			if (!!insert1 && !!insert2) break; 
		}
		for (let textBox of this._getTextBoxes()) {
			if (textBox.getAttribute("imgId") == id1 && !!!textBox1)
				textBox1 = textBox; 
			else if (textBox.getAttribute("imgId") == id2 && !!!textBox2)
				textBox2 = textBox; 
			if (!!textBox1 && !!textBox2) break; 
		}

		if (!!!insert1 || !!!insert2) return; 
		if (!!!textBox1 || !!!textBox2) return; 
		this._swapInserts(insert1,insert2,textBox1,textBox2,remote); 
	}

	/**
	 * Swap Inserts by Name
	 *
	 * @params name1 (String) : The label name of the first insert to swap.
	 * @params name2 (String) : The label name of the second insert to swap.
	 * @params remote (Boolean) : Wither this is being invoked remotely, or locally. 
	 */
	swapInsertsByName(name1,name2,remote) {
		if (this.portraitDocks.length < 2) return; 

		let insert1,
				insert2,
				textBox1,
				textBox2; 
		name1 = name1.toLowerCase(); 
		name2 = name2.toLowerCase(); 
		for (let insert of this.portraitDocks) {
			if (insert.name == name1 && !!!insert1)
				insert1 = insert; 
			else if (insert.name == name2 && !!!insert2)
				insert2 = insert; 
			if (!!insert1 && !!insert2) break; 
		}
		for (let textBox of this._getTextBoxes()) {
			if (textBox.getAttribute("name") == name1 && !!!textBox1)
				textBox1 = textBox; 
			else if (textBox.getAttribute("name") == name2 && !!!textBox2)
				textBox2 = textBox; 
			if (!!textBox1 && !!textBox2) break; 
		}

		if (!!!insert1 || !!!insert2) return; 
		if (!!!textBox1 || !!!textBox2) return; 
		this._swapInserts(insert1,insert2,textBox1,textBox2,remote); 
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
	_swapInserts(insert1,insert2,textBox1,textBox2,remote) {
		let tsib1n = textBox1.nextSibling,
				tsib1p = textBox1.previousSibling,
				tsib2n = textBox2.nextSibling,
				tsib2p = textBox2.previousSibling; 
		//console.log("SWAP",textBox1,textBox2); 
		let adjSwap = false; 

		// permission check
		if (!remote && (!this.isPlayerOwned(insert1.imgId) || !this.isPlayerOwned(insert2.imgId))) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotSwapControlled"));
			return; 
		} else if (!remote && (!this.isActorOwner(game.user.id,insert1.imgId) && !this.isActorOwner(game.user.id,insert2.imgId))) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotSwapOwner"));
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
			if (tsib1n) KHelpers.insertBefore(textBox2,tsib1n); 
			else if (tsib1p && (tsib1p != textBox2)) KHelpers.insertAfter(textBox2,tsib1p);
			else {
				if (Theatre.DEBUG) console.log("NO TSIB1 and PRIOR");
				KHelpers.insertAfter(textBox2,textBox1); 
				adjSwap = true; 
			}

			if (!adjSwap) {
				if (tsib2n) KHelpers.insertBefore(textBox1,tsib2n); 
				else if (tsib2p && (tsib2p != textBox1)) KHelpers.insertAfter(textBox1,tsib2p);
				else {
					if (Theatre.DEBUG) console.log("NO TSIB2 and PRIOR"); 
					KHelpers.insertAfter(textBox1,textBox2); 
				}
			}
		}

		if (this.reorderTOId)
			window.clearTimeout(this.reorderTOId); 

		this.reorderTOId = window.setTimeout(()=>{
			Theatre.reorderInserts(); 
			this.reorderTOId = null; 
		},250); 

		// Push to socket our event
		if (!remote) {
			Theatre.instance._sendSceneEvent("swap",{
				insertid1 : insert1.imgId,
				insertid2 : insert2.imgId,
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
	moveInsertById(id1,id2,remote) {
		if (this.portraitDocks.length < 2) return; 

		let insert1,
				insert2,
				textBox1,
				textBox2; 
		for (let insert of this.portraitDocks) {
			if (insert.imgId == id1 && !!!insert1)
				insert1 = insert; 
			else if (insert.imgId == id2 && !!!insert2)
				insert2 = insert; 
			if (!!insert1 && !!insert2) break; 
		}
		for (let textBox of this._getTextBoxes()) {
			if (textBox.getAttribute("imgId") == id1 && !!!textBox1)
				textBox1 = textBox; 
			else if (textBox.getAttribute("imgId") == id2 && !!!textBox2)
				textBox2 = textBox; 
			if (!!textBox1 && !!textBox2) break; 
		}

		if (!!!insert1 || !!!insert2) return; 
		if (!!!textBox1 || !!!textBox2) return; 
		this._moveInsert(insert1,insert2,textBox1,textBox2,remote); 
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
	_moveInsert(insert1,insert2,textBox1,textBox2,remote) {
		let tsib1n = textBox1.nextSibling,
				tsib1p = textBox1.previousSibling,
				tsib2n = textBox2.nextSibling,
				tsib2p = textBox2.previousSibling; 
		//console.log("SWAP",textBox1,textBox2); 
		let adjSwap = false; 

		// permission check
		if (!remote && !this.isActorOwner(game.user.id,insert2.imgId)) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotMoveOwner"));
			return; 
		} else if (!remote && (!this.isPlayerOwned(insert1.imgId) || !this.isPlayerOwned(insert2.imgId))) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotMoveControlled"));
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
			if (insert2.order > insert1.order)
				KHelpers.insertBefore(textBox2,textBox1); 
			else
				KHelpers.insertAfter(textBox2,textBox1); 
		}

		if (this.reorderTOId)
			window.clearTimeout(this.reorderTOId); 

		this.reorderTOId = window.setTimeout(()=>{
			Theatre.reorderInserts(); 
			this.reorderTOId = null; 
		},250); 

		// Push to socket our event
		if (!remote) {
			Theatre.instance._sendSceneEvent("move",{
				insertid1 : insert1.imgId,
				insertid2 : insert2.imgId,
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
			if (btb.getAttribute("imgId") == id)
				return true; 
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
			if (btb.getAttribute("imgId") == id)
				return true; 
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

		this._pushInsert(targInsert,targTextBox,isLeft, remote); 
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

		this._pushInsert(targInsert,targTextBox,isLeft, remote); 
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
	_pushInsert(insert,textBox,isLeft, remote) {
		let textBoxes = this._getTextBoxes(); 
		let firstInsert = this.portraitDocks[0]; 
		let lastInsert = this.portraitDocks[this.portraitDocks.length-1]; 
		let firstTextBox = textBoxes[0] ; 
		let lastTextBox = textBoxes[textBoxes.length-1]; 

		if (!!!firstInsert || !!!lastInsert || !!!firstTextBox || !!!lastTextBox) return; 

		// permission check
		if (!remote && !this.isActorOwner(game.user.id,insert.imgId)) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return; 
		} else if (!remote && (isLeft ? !this.isPlayerOwned(firstInsert.imgId) : !this.isPlayerOwned(lastInsert.imgId))) {
			if (isLeft)
				ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotPushFront"));
			else
				ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotPushBack"));
			return; 
		}

		if (isLeft) {
			KHelpers.insertBefore(textBox,firstTextBox); 
		} else {
			KHelpers.insertAfter(textBox,lastTextBox); 
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
			Theatre.instance._sendSceneEvent("push",{
				insertid : insert.imgId,
				tofront : isLeft
			}); 
		}
	}

	/**
	 * Mirror a portrait by ID
	 *
	 * @params id (String) : The theatreId of the insert we wish to mirror. 
	 * @params remote (Boolean) : Wither this is being invoked remotely, or locally. 
	 */
	mirrorInsertById(id,remote) {
		let insert = this.getInsertById(id); 
		if (!insert) return; 

		this._mirrorInsert(insert,remote); 
	}

	/**
	 * Mirror a portrait by Name
	 *
	 * @params name (String) : The label name of the insert we wish to mirror. 
	 * @params remote (Boolean) : Wither this is being invoked remotely, or locally. 
	 */
	mirrorInsertByName(name,remote) {
		let insert = this.getInsertByName(name); 
		if (!insert) return; 

		this._mirrorInsert(insert,remote); 
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
	_mirrorInsert(insert,remote) {
		// permission check
		if (!remote && (!this.isActorOwner(game.user.id,insert.imgId))) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return; 
		}

		let tweenId = "mirrorFlip";
		let broadcast = false; 
		if (!insert.mirrored && !insert.tweens[tweenId]) {
			insert.mirrored = true; 
			let tween = TweenMax.to(insert.portraitContainer,0.5,{
				pixi:{scaleX: -1},
				ease: Power4.easeInOut,
				onComplete: function(ctx,imgId,tweenId) {
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId,this,tweenId); 
				},
				onCompleteParams: [this,insert.imgId,tweenId],
			}); 
			this._addDockTween(insert.imgId,tween,tweenId); 
			broadcast = true; 
		} else if (!insert.tweens[tweenId]) {
			insert.mirrored = false; 
			let tween = TweenMax.to(insert.portraitContainer,0.5,{
				pixi:{scaleX: 1},
				ease: Power4.easeInOut,
				onComplete: function(ctx,imgId,tweenId) {
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId,this,tweenId); 
				},
				onCompleteParams: [this,insert.imgId,tweenId],
			}); 
			this._addDockTween(insert.imgId,tween,tweenId); 
			broadcast = true; 
		}

		// Push to socket our event
		if (!remote && broadcast) {
			Theatre.instance._sendSceneEvent("positionupdate",{
				insertid : insert.imgId,
				position: {
					x: insert.portraitContainer.x,
					y: insert.portraitContainer.y,
					mirror: insert.mirrored
				}
			}); 
		}

	}

	/**
	 * Reset an insert's postion/mirror state by Id
	 *
	 * @param id (String) : The theatreId of the insert to reset.
	 * @params remote (Boolean) : Wither this is being invoked remotely, or locally. 
	 */
	resetInsertById(id,remote) {
		let insert = this.getInsertById(id); 

		this._resetPortraitPosition(insert, remote); 
	}

	/**
	 * Reset an insert's postion/mirror state by Id
	 *
	 * @param name (String) : The name label of the insert to reset.
	 * @params remote (Boolean) : Wither this is being invoked remotely, or locally. 
	 */
	resetInsertByName(name,remote) {
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
		if (!remote && !this.isActorOwner(game.user.id,insert.imgId)) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return; 
		}

		let tweenId,tween; 
		// reset mirroring
		// reset position of portraitContainer
		insert.mirrored = false; 
		tweenId = "portraitMove"; 
		tween = TweenMax.to(insert.portraitContainer,0.5,{
			pixi:{scaleX: 1, x: insert.portrait.width/2, y: insert.portrait.height/2},
			ease: Power3.easeOut,
			onComplete: function(ctx,imgId,tweenId) {
				// decrement the rendering accumulator
				if (Theatre.DEBUG) console.log("portrait move onComplete %s",tweenId); 
				ctx._removeDockTween(imgId,this,tweenId); 
			},
			onCompleteParams: [this,insert.imgId,tweenId]
		}); 
		this._addDockTween(insert.imgId,tween,tweenId);

		// Push to socket our event
		if (!remote) {
			Theatre.instance._sendSceneEvent("positionupdate",{
				insertid : insert.imgId,
				position: {x: insert.portrait.width/2, y: insert.portrait.height/2 ,mirror: false}
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
	addTweensFromAnimationSyntax(animName,animSyntax,resMap,insert) {
		let tweenParams = Theatre.verifyAnimationSyntax(animSyntax); 

		let resTarget = resMap.find(e => (e.name == tweenParams[0].resName)); 
		let resource = PIXI.Loader.shared.resources[resTarget.path]; 

		if (Theatre.DEBUG) console.log("Adding tweens for animation '%s' from syntax: %s with params: ", animName, animSyntax, tweenParams); 
		//console.log("Resource path is %s, resource: ", resTarget.path, resource); 
		if (!resource) {
			console.log ('ERROR: resource name : "%s" with path "%s" does not exist!',tweenParams[idx].resName,resTarget.path); 
			return; 
		}

		let sprite = new PIXI.Sprite(resource.texture); 
		let spriteWidth =  resource.texture.width; 
		let spriteHeight =  resource.texture.height; 
		sprite.anchor.set(0.5); 
		insert.portraitContainer.addChild(sprite); 

		for (let idx=0; idx<tweenParams.length; ++idx) {

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
				if (Theatre.DEBUG) console.log("adv options arg: ",advOptions); 
				yoyo = advOptions.yoyo ? true : false;
				noMirror = advOptions.noMirror ? true : false; 
				delay = advOptions.delay ? Number(advOptions.delay) : delay; 
				repeat = advOptions.repeat ? Number(advOptions.repeat) : repeat;
				repeatDelay = advOptions.repeatDelay ? Number(advOptions.repeatDelay) : repeatDelay; 
				ease = advOptions.ease ? Theatre.verifyEase(advOptions.ease) : ease; 
				yoyoEase = advOptions.yoyoEase ? Theatre.verifyEase(advOptions.yoyoEase) : yoyoEase; 
			}

			let pixiParams = {}; 
			for(let prop of tweenParams[idx].props) {
				// special case of x/y/scale
				if (prop.name == "x" 
				|| prop.name == "y"
				|| prop.name == "rotation"
				|| prop.name == "scaleX"
				|| prop.name == "scaleY") {
					if (prop.initial.includes("%")) {
						prop.initial = Number(prop.initial.match(/-*\d+\.*\d*/)[0] || 0)/100 
							* (prop.name == "x" ? insert.portrait.width : insert.portrait.height); 
						prop.final = Number(prop.final.match(/-*\d+\.*\d*/)[0] || 0)/100 
							* (prop.name == "x" ? insert.portrait.width : insert.portrait.height); 
					} else if (["scaleX","scaleY","rotation"].some(e => e == prop.name)) {
						prop.initial = Number(prop.initial.match(/-*\d+\.*\d*/)[0] || 0); 
						prop.final = Number(prop.final.match(/-*\d+\.*\d*/)[0] || 0); 
					}
					if (Theatre.DEBUG) console.log("new %s : %s,%s : w:%s,h:%s",prop.name,prop.initial,prop.final,insert.portrait.width,insert.portrait.height); 
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
						sprite.rotation = prop.initial * (Math.PI/180); 
						break; 
					default:
						sprite[prop.name] = prop.initial; 
						break; 
				}
				pixiParams[prop.name] = prop.final; 
			}

			let tweenId = animName+idx; 	
			let tween = TweenMax.to(sprite,tweenParams[idx].duration,{
				pixi: pixiParams,
				ease: ease,
				delay: delay,
				repeatDelay: repeatDelay,
				repeat: repeat,
				yoyo: yoyo,
				yoyoEase: yoyoEase,
				/*onRepeat: function() {
					console.log("ANIMATION tween is repeating!",this); 
				}, */
				onComplete: function(ctx,imgId,tweenId) {
					if (Theatre.DEBUG) console.log("ANIMATION tween complete!"); 
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId,this,tweenId); 
					// remove our own reference from the dockContainer tweens
				},
				onCompleteParams: [this,insert.imgId,tweenId]
			}); 
			if (repeat != 0)
				tween.duration(tweenParams[idx].duration); 
			this._addDockTween(insert.imgId,tween,tweenId); 

		}
	}

	/**
	 * Given the insert params, return the correct
	 * intitial emotion set when displaying an insert
	 * which was previously staged, or not active
	 *
	 * first : actor.data.flags.theatre.<emote>.settings.<parameter>
	 * second : actor.data.flags.theatre.settings.<parameter>
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
	_getInitialEmotionSetFromInsertParams(params,useDefault) {
		if (Theatre.DEBUG) console.log("use default? %s", !useDefault); 
		let emotions = {
				emote : (!useDefault && params.settings.emote ? params.settings.emote : null)
					|| (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].emote : null),
				textFlyin : (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings 
						? params.emotes[params.settings.emote].settings.textflyin : null)
					|| (!useDefault ? params.settings.textflyin : null)
					|| (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textFlyin : null),
				textStanding : (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings 
						? params.emote.settings.textstanding : null)
					|| (!useDefault ? params.settings.textstanding : null)
					|| (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textStanding : null),
				textFont : (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings 
						? params.emote.settings.textfont : null)
					|| (!useDefault ? params.settings.textfont : null)
					|| (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textFont : null),
				textSize : (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings 
						? params.emote.settings.textsize : null)
					|| (!useDefault ? params.settings.textsize : null)
					|| (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textSize : null),
				textColor : (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings 
						? params.emote.settings.textcolor : null)
					|| (!useDefault ? params.settings.textcolor : null)
					|| (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textColor : null)
			}
		return emotions; 
	}

	/**
	 * Activate an insert by Id, if it is staged to the navbar
	 *
	 * @params id (String) : The theatreId of the insert to activate.
	 * @params ev (Event) : The event that possibly triggered this activation. 
	 */
	activateInsertById(id,ev) {
		let actorId = id.replace("theatre-",""); 
		let navItem = this.getNavItemById(id); 
		if (!navItem) {
			let actor = game.actors.get(actorId); 
			Theatre.addToNavBar(actor.data); 
			navItem = this.getNavItemById(id); 
		}
		if (!navItem) return; 


		let params = this._getInsertParamsFromActorId(actorId); 

		if (Theatre.DEBUG) console.log(" set as active"); 
		// set as user active
		// If the insert does not exist in the dock, add it,
		// If it does, then simply toggle it as active if it isn't already
		// If it's already active, and we're GM, then we want to transition to 'god mode'
		// voice, thus we simply un-activate our character, and assume GM voice again
		// (the default, if no insert selected)
		let insert = this.getInsertById(id); 
		let textBox = this.getTextBoxById(id); 
		let label =  (insert ? insert.label : null); 

		// remove old speaking as, shift it
		let oldSpeakingItem = this.getNavItemById(this.speakingAs); 
		let oldSpeakingInsert = this.getInsertById(this.speakingAs); 
		let oldSpeakingLabel = (oldSpeakingInsert ? oldSpeakingInsert.label : null); 
		if (oldSpeakingItem)
			KHelpers.removeClass(oldSpeakingItem,"theatre-control-nav-bar-item-speakingas"); 
		if (oldSpeakingInsert) {
			this._removeDockTween(this.speakingAs,null,"nameSpeakingPulse"); 
			oldSpeakingInsert.label.tint = 0xFFFFFF; 
		}
		// if narrator is active, deactivate it and push the button up
		if (game.user.isGM && this.speakingAs == Theatre.NARRATOR)
			this.toggleNarratorBar(false); 
		// if this insert / textbox pair is being removed, stop
		if (!!insert && textBox.getAttribute("deleting"))
			return; 
		
		if (!!insert) {
			// already in theatre
			// if not same id toggle it
			let cimg = this.getTheatreCoverPortrait(); 
			if (this.speakingAs != id) {
				this.speakingAs = id; 
				KHelpers.addClass(navItem,"theatre-control-nav-bar-item-speakingas"); 
				TweenMax.to(Theatre.instance.theatreNavBar,.4, {scrollTo:{x:navItem.offsetLeft,offsetX:Theatre.instance.theatreNavBar.offsetWidth/2}})

				// add label pulse
				insert.label.tint = 0xFFFFFF; 
				let tweenId = "nameSpeakingPulse"; 	
				let tween = TweenMax.to(insert.label,1,{
					pixi:{tint: 0xFF6400},
					ease: Power0.easeNone,
					repeat: -1,
					yoyo: true,
					onComplete: function(ctx,imgId,tweenId) {
						// decrement the rendering accumulator
						ctx._removeDockTween(imgId,this,tweenId); 
						// remove our own reference from the dockContainer tweens
					},
					onCompleteParams: [this,id,tweenId]
				}); 
				this._addDockTween(id,tween,tweenId); 

				// change cover
				cimg.setAttribute("src",params.src);
				//cimg.style.left = `calc(100% - ${this.theatreChatCover.offsetHeight}px)`
				cimg.style.width = `${this.theatreChatCover.offsetHeight}px`
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
			if (ev && ev.altKey)
				emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params,true); 
			else
				emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params); 

			if (Theatre.DEBUG) console.log("ACTIVATING AND INJECTING with Emotions: ",emotions); 

			if (ev && !ev.shiftKey) {
				if (game.user.isGM)
					this.injectLeftPortrait(src,name,id,optAlign,emotions); 
				else
					this.injectRightPortrait(src,name,id,optAlign,emotions); 
			} else 
				this.injectRightPortrait(src,name,id,optAlign,emotions); 

			this.speakingAs = id; 
			KHelpers.addClass(navItem,"theatre-control-nav-bar-item-speakingas"); 
			TweenMax.to(Theatre.instance.theatreNavBar,.4,{scrollTo:{x:navItem.offsetLeft,offsetX:Theatre.instance.theatreNavBar.offsetWidth/2}})

			window.setTimeout(()=>{
				insert = this.getInsertById(id); 
				// if our insert hasn't been destroyed
				if (insert && !!insert.dockContainer && this.speakingAs == id) {
					label = this.label; 
					// add label pulse
					insert.label.tint = 0xFFFFFF; 
					let tweenId = "nameSpeakingPulse"; 	
					let tween = TweenMax.to(insert.label,1,{
						pixi:{tint: 0xFF6400},
						ease: Power0.easeNone,
						repeat: -1,
						yoyo: true,
						onComplete: function(ctx,imgId,tweenId) {
							// decrement the rendering accumulator
							ctx._removeDockTween(imgId,this,tweenId); 
							// remove our own reference from the dockContainer tweens
						},
						onCompleteParams: [this,id,tweenId]
					}); 
					this._addDockTween(id,tween,tweenId); 
				}
			},1000); 

			// change cover
			cimg.setAttribute("src",src);
			//cimg.style.left = `calc(100% - ${this.theatreChatCover.offsetHeight}px)`
			cimg.style.width = `${this.theatreChatCover.offsetHeight}px`
			cimg.style.opacity = "0.3"; 
			// push focus to chat-message
			let chatMessage = document.getElementById("chat-message"); 
			chatMessage.focus(); 
		}
		// send typing event
		this._sendTypingEvent(); 
		this.setUserTyping(game.user.id,this.speakingAs); 
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

		if (!remote && !this.isActorOwner(game.user.id,theatreId)) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return; 
		}
		// clear last speaking if present
		KHelpers.removeClass(textBox,"theatre-text-box-lastspeaking"); 
		textBox.style.background = ""; 
		textBox.style["box-shadow"] = ""; 

		// clear decay Timout if present
		if (insert.decayTOId) {
			window.clearTimeout(insert.decayTOId); 
			insert.decayTOId = null; 
		}
		// kill tweens
		for (let c of textBox.children) {
			for (let sc of c.children) 
				TweenMax.killTweensOf(sc); 
			TweenMax.killTweensOf(c); 
		}
		TweenMax.killTweensOf(textBox); 

		// decay
		TweenMax.to(textBox.children,0.5,{
			top: this.theatreBar.offsetHeight/2,
			opacity: 0,
			ease: Power0.easeNone,
			onComplete: function () {
				textBox.textContent = ''; 
			}
		}); 

		// Push to socket our event
		if (!remote) {
			Theatre.instance._sendSceneEvent("decaytext",{insertid : theatreId}); 
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
	applyPlayerColorToTextBox(textBox,userId,color) {
		//let user = game.users.get(userId); 
		//let userColor = user.color.replace("#",""); 
		color = color ? color.replace("#","") : null || "FFFFFF"; 

		// break into radix
		let red = parseInt(color.substring(0,2),16); 
		let green = parseInt(color.substring(2,4),16); 
		let blue = parseInt(color.substring(4),16); 

		let darkred = Math.max(red-50,0); 
		let darkgreen = Math.max(green-50,0); 
		let darkblue = Math.max(blue-50,0); 

		red = Math.min(red+75,255); 
		green = Math.min(green+75,255); 
		blue = Math.min(blue+75,255); 

		if (Theatre.DEBUG) console.log("color %s : red: %s:%s, green %s:%s, blue %s:%s",color,red,darkred,green,darkgreen,blue,darkblue); 

		// style specific settings
		switch (this.settings.theatreStyle) {
			case "clearbox":
				textBox.style.cssText += `background: linear-gradient(transparent 0%, rgba(${red},${green},${blue},0.30) 40%, rgba(${red},${green},${blue},0.30) 60%, transparent 100%); box-shadow: 0px 5px 2px 1px rgba(${darkred}, ${darkgreen}, ${darkblue}, 0.30)`; 
				break; 
			case "mangabubble":
			case "lightbox":
			case "textbox":
			default:
				textBox.style.cssText += `background: linear-gradient(transparent 0%, rgba(${red},${green},${blue},0.10) 40%, rgba(${red},${green},${blue},0.10) 60%, transparent 100%); box-shadow: 0px 5px 2px 1px rgba(${darkred}, ${darkgreen}, ${darkblue}, .2)`; 
				break; 
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
	getPlayerFlashColor(userId,color) {
		//let user = game.users.get(userId); 
		//let userColor = user.color.replace("#",""); 
		color = color ? color.replace("#","") : null || "FFFFFF"; 

		// break into radix
		let red = parseInt(color.substring(0,2),16); 
		let green = parseInt(color.substring(2,4),16); 
		let blue = parseInt(color.substring(4),16); 

		// try to preserve ratios?
		red = Math.min(red+75,255); 
		green = Math.min(green+75,255); 
		blue = Math.min(blue+75,255); 

		red = red.toString(16); 
		green = green.toString(16); 
		blue = blue.toString(16); 

		if (Theatre.DEBUG) console.log(`#${red}${green}${blue}`); 
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
	_applyFontFamily(elem,fontFamily) {
		elem.style["font-family"] = `"${fontFamily}", "SignikaBold", "Palatino Linotype", serif`;
		elem.style["font-weight"] = this.fontWeight; 
	}

	/**
	 * Toggle the narrator bar
	 *
	 * @param active (Boolean) : Wither to activate or deactive the narrator bar.
	 * @param remote (Boolean) : Winter this is being invoked remotely, or locally. 
	 */
	toggleNarratorBar(active,remote) {
		if (active) {
			// spawn it
			let narratorBackdrop = Theatre.instance.theatreNarrator.getElementsByClassName("theatre-narrator-backdrop")[0];
			if (Theatre.DEBUG) console.log("NarratorBackdrop ",narratorBackdrop,Theatre.instance.theatreNarrator); 
			narratorBackdrop.style.width = "100%"; 
			Theatre.instance.theatreNarrator.style.opacity = "1"; 
			Theatre.instance.isNarratorActive = true; 
			// check if a navItem is active, if so, deactive it. 
			// set speakingAs to "narrator" note that this will need heavy regression testing
			// as it'll be plugging into the insert workflow when it's truely not a real insert
			if (game.user.isGM) {
				let btnNarrator = Theatre.instance.theatreControls.getElementsByClassName("theatre-icon-narrator")[0].parentNode; 
				let oldSpeakingItem = Theatre.instance.getNavItemById(Theatre.instance.speakingAs); 
				let oldSpeakingInsert = Theatre.instance.getInsertById(Theatre.instance.speakingAs); 
				let oldSpeakingLabel = Theatre.instance._getLabelFromInsert(oldSpeakingInsert); 

				KHelpers.addClass(btnNarrator,"theatre-control-nav-bar-item-speakingas"); 
				if (oldSpeakingItem)
					KHelpers.removeClass(oldSpeakingItem,"theatre-control-nav-bar-item-speakingas"); 
				if (oldSpeakingInsert) {
					oldSpeakingInsert.label.tint = 0xFFFFFF; 
					this._removeDockTween(this.speakingAs,null,"nameSpeakingPulse"); 
				}

				let textFlyin = Theatre.instance.theatreNarrator.getAttribute("textflyin"); 
				let textStanding = Theatre.instance.theatreNarrator.getAttribute("textstanding"); 
				let textFont = Theatre.instance.theatreNarrator.getAttribute("textfont"); 
				let textSize = Theatre.instance.theatreNarrator.getAttribute("textsize"); 
				let textColor = Theatre.instance.theatreNarrator.getAttribute("textcolor"); 

				Theatre.instance.theatreNarrator.setAttribute("textflyin", textFlyin ? textFlyin
						: (Theatre.instance.userEmotes[game.user.id] ? Theatre.instance.userEmotes[game.user.id].textFlyin : null))
				Theatre.instance.theatreNarrator.setAttribute("textstanding", textStanding ? textStanding
						: (Theatre.instance.userEmotes[game.user.id] ? Theatre.instance.userEmotes[game.user.id].textStanding : null))
				Theatre.instance.theatreNarrator.setAttribute("textfont", textFont ? textFont 
						: (Theatre.instance.userEmotes[game.user.id] ? Theatre.instance.userEmotes[game.user.id].textFont : null))
				Theatre.instance.theatreNarrator.setAttribute("textsize", textSize ? textSize
						: (Theatre.instance.userEmotes[game.user.id] ? Theatre.instance.userEmotes[game.user.id].textSize : null))
				Theatre.instance.theatreNarrator.setAttribute("textcolor", textColor ? textColor 
						: (Theatre.instance.userEmotes[game.user.id] ? Theatre.instance.userEmotes[game.user.id].textColor : null))

				let cimg = Theatre.instance.getTheatreCoverPortrait(); 
				// clear cover
				cimg.removeAttribute("src"); 
				cimg.style.opacity = "0"; 
				// clear typing theatreId data
				Theatre.instance.removeUserTyping(game.user.id); 
				Theatre.instance.usersTyping[game.user.id].theatreId = null; 
				// Mark speaking as Narrator
				Theatre.instance.speakingAs = Theatre.NARRATOR; 
				Theatre.instance.setUserTyping(game.user.id,Theatre.NARRATOR); 
				// push focus to chat-message
				let chatMessage = document.getElementById("chat-message"); 
				chatMessage.focus(); 
				// send event to triggier the narrator bar
				if (!remote)
					Theatre.instance._sendSceneEvent("narrator",{active: true}); 
				// re-render the emote menu (expensive)
				Theatre.instance.renderEmoteMenu(); 
			}
		} else {
			// remove it
			let narratorBackdrop = Theatre.instance.theatreNarrator.getElementsByClassName("theatre-narrator-backdrop")[0];
			let narratorContent = Theatre.instance.theatreNarrator.getElementsByClassName("theatre-narrator-content")[0];
			if (Theatre.DEBUG) console.log("NarratorBackdrop ",narratorBackdrop,Theatre.instance.theatreNarrator); 
			narratorBackdrop.style.width = "0%";
			Theatre.instance.theatreNarrator.style.opacity = "0"; 
			Theatre.instance.isNarratorActive = false; 
			// kill animations
			for (let c of narratorContent.children) {
				for (let sc of c.children) 
					TweenMax.killTweensOf(sc); 
				TweenMax.killTweensOf(c); 
			}
			for (let c of narratorContent.children)
				c.parentNode.removeChild(c); 
			TweenMax.killTweensOf(narratorContent); 
			narratorContent.style["overflow-y"] = "scroll"; 
			narratorContent.style["overflow-x"] = "hidden"; 

			if (Theatre.DEBUG) console.log("all tweens",TweenMax.getAllTweens()); 
			narratorContent.textContent = ''; 

			if (game.user.isGM) {
				let btnNarrator = Theatre.instance.theatreControls.getElementsByClassName("theatre-icon-narrator")[0].parentNode; 
				KHelpers.removeClass(btnNarrator,"theatre-control-nav-bar-item-speakingas"); 
				// clear narrator
				Theatre.instance.speakingAs = null; 
				Theatre.instance.removeUserTyping(game.user.id); 
				Theatre.instance.usersTyping[game.user.id].theatreId = null; 
				// send event to turn off the narrator bar
				if (!remote)
					Theatre.instance._sendSceneEvent("narrator",{active: false}); 
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
		let actorId = Theatre.instance.speakingAs ? Theatre.instance.speakingAs.replace("theatre-","") : null; 
		let insert = Theatre.instance.getInsertById(Theatre.instance.speakingAs); 
		let actor; 
		if (actorId)
			actor = game.actors.get(actorId); 

		let emotes = Theatre.getActorEmotes(actorId); 
		let fonts = Theatre.FONTS; 
		let textFlyin = Theatre.FLYIN_ANIMS; 
		let textStanding = Theatre.STANDING_ANIMS; 
		let sideBar = document.getElementById("sidebar"); 
		renderTemplate("modules/theatre/app/templates/emote_menu.html",{emotes,textFlyin,textStanding,fonts}).then(template=>{
			if (Theatre.DEBUG) console.log("emote window template rendered"); 
			Theatre.instance.theatreEmoteMenu.style.top = `${Theatre.instance.theatreControls.offsetTop-410}px`; 
			Theatre.instance.theatreEmoteMenu.innerHTML = template; 

			let wheelFunc = function (ev) {
				//console.log("wheel on text-box",ev.currentTarget.scrollTop,ev.deltaY,ev.deltaMode); 
				let pos = ev.deltaY > 0; 
				ev.currentTarget.scrollTop += (pos ? 10 : -10); 
				ev.preventDefault(); 
				ev.stopPropagation(); 
			}
			let wheelFunc2 = function (ev) {
				//console.log("wheel on text-anim",ev.currentTarget.parentNode.scrollTop,ev.deltaY,ev.deltaMode); 
				let pos = ev.deltaY > 0; 
				ev.currentTarget.parentNode.scrollTop += (pos ? 10 : -10); 
				ev.preventDefault(); 
				ev.stopPropagation(); 
			}

			// bind handlers for the font/size/color selectors
			let sizeSelect = Theatre.instance.theatreEmoteMenu.getElementsByClassName('sizeselect')[0]; 
			let colorSelect = Theatre.instance.theatreEmoteMenu.getElementsByClassName('colorselect')[0]; 
			let fontSelect = Theatre.instance.theatreEmoteMenu.getElementsByClassName('fontselect')[0]; 
			//console.log("Selectors found: ",sizeSelect,colorSelect,fontSelect); 

			// assign font from insert
			if (insert && insert.textFont) {
				//if (fonts.includes(insert.textFont)) fontSelect.value = insert.textFont;
				//else fontSelect.value = fonts[0]; 
				fontSelect.value = insert.textFont; 
			} else if (Theatre.instance.userEmotes[game.user.id] && Theatre.instance.userEmotes[game.user.id].textFont) {
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
			} else if (Theatre.instance.userEmotes[game.user.id] && Theatre.instance.userEmotes[game.user.id].textColor) {
				colorSelect.value = Theatre.instance.userEmotes[game.user.id].textColor; 
				if (insert) insert.textColor = colorSelect.value; 
			}
			// assgin font size
			let sizeIcon = document.createElement("div"); 
			let sizeValue = 2; 
			if (insert)
				sizeValue = insert.textSize;
			else if (Theatre.instance.userEmotes[game.user.id])
				sizeValue = Theatre.instance.userEmotes[game.user.id].textSize; 

			switch (sizeValue) {
				case 3:
					KHelpers.addClass(sizeIcon,"theatre-icon-fontsize-large"); 
					break;
				case 1:
					KHelpers.addClass(sizeIcon,"theatre-icon-fontsize-small"); 
					break;
				default:
					KHelpers.addClass(sizeIcon,"theatre-icon-fontsize-medium"); 
					break; 
			}
			sizeSelect.appendChild(sizeIcon); 

			sizeSelect.addEventListener("click",ev=>{
				
				let insert = Theatre.instance.getInsertById(Theatre.instance.speakingAs); 
				let icon = sizeSelect.children[0]; 
				let value = 2; 
				if (insert)
					value = insert.textSize;
				else if (Theatre.instance.userEmotes[game.user.id])
					value = Theatre.instance.userEmotes[game.user.id].textSize; 


				switch (value) {
					case 3:
						KHelpers.removeClass(icon,"theatre-icon-fontsize-large"); 
						KHelpers.addClass(icon,"theatre-icon-fontsize-medium"); 
						value = 2; 
						break;
					case 1:
						KHelpers.removeClass(icon,"theatre-icon-fontsize-small"); 
						KHelpers.addClass(icon,"theatre-icon-fontsize-large"); 
						value = 3; 
						break;
					default:
						KHelpers.removeClass(icon,"theatre-icon-fontsize-medium"); 
						KHelpers.addClass(icon,"theatre-icon-fontsize-small"); 
						value = 1; 
						break; 
				}
				Theatre.instance.setUserEmote(game.user.id,Theatre.instance.speakingAs,'textsize',value); 
			}); 
			fontSelect.addEventListener("change",ev=>{
				Theatre.instance.setUserEmote(game.user.id,Theatre.instance.speakingAs,'textfont',ev.currentTarget.value); 
				Theatre.instance.renderEmoteMenu(); 
			}); 
			colorSelect.addEventListener("change",ev=>{
				Theatre.instance.setUserEmote(game.user.id,Theatre.instance.speakingAs,'textcolor',ev.currentTarget.value); 
			}); 


			// Apply our language specific fonts to the template
			// OR apply the font specified by the insert
			let headers = Theatre.instance.theatreEmoteMenu.getElementsByTagName('h2'); 
			let textAnims = Theatre.instance.theatreEmoteMenu.getElementsByClassName('textanim'); 
			for (let e of headers)
				Theatre.instance._applyFontFamily(e,Theatre.instance.titleFont); 
			for (let e of textAnims) {
				let font = fontSelect.value; 
				Theatre.instance._applyFontFamily(e, font); 
				e.addEventListener("wheel",wheelFunc2); 
			}

			// bind click listeners for the textanim elements to animate a preview
			// hover-off will reset the text content
			let flyinBox = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textflyin-box")[0]; 
			flyinBox = flyinBox.getElementsByClassName("theatre-container-column")[0]; 
			let standingBox = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textstanding-box")[0]; 
			standingBox = standingBox.getElementsByClassName("theatre-container-column")[0]; 

			flyinBox.addEventListener("wheel",wheelFunc); 
			standingBox.addEventListener("wheel",wheelFunc)


			for (let child of flyinBox.children) {
				// get animation function
				// bind annonomous click listener
				child.addEventListener("mouseover", (ev) => {
					let text = ev.currentTarget.getAttribute("otext"); 
					let anim = ev.currentTarget.getAttribute("name"); 
					//console.log("child text: ",text,ev.currentTarget); 
					ev.currentTarget.textContent = ""; 
					let charSpans = Theatre.splitTextBoxToChars(text,ev.currentTarget); 
					textFlyin[anim].func.call(this,charSpans,0.5,0.05,null); 
				}); 
				child.addEventListener("mouseout", (ev) => {
					for (let c of ev.currentTarget.children) {
						for (let sc of c.children) 
							TweenMax.killTweensOf(sc); 
						TweenMax.killTweensOf(c); 
					}
					for (let c of ev.currentTarget.children)
						c.parentNode.removeChild(c); 
					TweenMax.killTweensOf(child); 
					child.style["overflow-y"] = "scroll"; 
					child.style["overflow-x"] = "hidden"; 
					//console.log("all tweens",TweenMax.getAllTweens()); 
					ev.currentTarget.textContent = ev.currentTarget.getAttribute("otext"); 
				}); 
				// bind text anim type
				child.addEventListener("mouseup", (ev) => {
					if (ev.button == 0) {
						if (KHelpers.hasClass(ev.currentTarget,"textflyin-active")) {
							KHelpers.removeClass(ev.currentTarget,"textflyin-active"); 
							Theatre.instance.setUserEmote(game.user.id,Theatre.instance.speakingAs,'textflyin',null); 
						} else {
							let lastActives = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textflyin-active"); 
							for (let la of lastActives)
								KHelpers.removeClass(la,"textflyin-active"); 
							//if (insert || Theatre.instance.speakingAs == Theatre.NARRATOR) {
							KHelpers.addClass(ev.currentTarget,"textflyin-active"); 
							Theatre.instance.setUserEmote(game.user.id,Theatre.instance.speakingAs,'textflyin',ev.currentTarget.getAttribute("name")); 
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
						KHelpers.addClass(child,"textflyin-active");
						// scroll to
						//TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
						flyinBox.scrollTop = child.offsetTop-Math.max(flyinBox.offsetHeight/2,0); 
					}
				} else if (Theatre.instance.speakingAs == Theatre.NARRATOR) {
					let insertTextMode = Theatre.instance.theatreNarrator.getAttribute("textflyin"); 
					if (insertTextMode && insertTextMode == childTextMode) {
						KHelpers.addClass(child,"textflyin-active");
						// scroll to
						//TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
						flyinBox.scrollTop = child.offsetTop-Math.max(flyinBox.offsetHeight/2,0); 
					}
				} else if (!insert && Theatre.instance.userEmotes[game.user.id] && (child.getAttribute("name") == Theatre.instance.userEmotes[game.user.id].textFlyin)) {
					KHelpers.addClass(child,"textflyin-active"); 
					// scroll to
					//TweenMax.to(flyinBox,.4,{scrollTo:{y:child.offsetTop, offsetY:flyinBox.offsetHeight/2}})
					flyinBox.scrollTop = child.offsetTop-Math.max(flyinBox.offsetHeight/2,0); 
				}
			}

			for (let child of standingBox.children) {
				// get animation function
				// bind annonomous click listener
				child.addEventListener("mouseover", (ev) => {
					let text = ev.currentTarget.getAttribute("otext"); 
					let anim = ev.currentTarget.getAttribute("name"); 
					//console.log("child text: ",text,ev.currentTarget); 
					ev.currentTarget.textContent = ""; 
					let charSpans = Theatre.splitTextBoxToChars(text,ev.currentTarget); 
					textFlyin["typewriter"].func.call(this,charSpans,0.5,0.05,(textStanding[anim] ? textStanding[anim].func : null)); 
				}); 
				child.addEventListener("mouseout", (ev) => {
					for (let c of ev.currentTarget.children) {
						for (let sc of c.children) 
							TweenMax.killTweensOf(sc); 
						TweenMax.killTweensOf(c); 
					}
					for (let c of ev.currentTarget.children)
						c.parentNode.removeChild(c); 
					TweenMax.killTweensOf(child); 
					child.style["overflow-y"] = "scroll"; 
					child.style["overflow-x"] = "hidden"; 
					//console.log("all tweens",TweenMax.getAllTweens()); 
					ev.currentTarget.textContent = ev.currentTarget.getAttribute("otext"); 
				}); 
				// bind text anim type
				child.addEventListener("mouseup", (ev) => {
					if (ev.button == 0) {
						if (KHelpers.hasClass(ev.currentTarget,"textstanding-active")) {
							KHelpers.removeClass(ev.currentTarget,"textstanding-active"); 
							Theatre.instance.setUserEmote(game.user.id,Theatre.instance.speakingAs,'textstanding',null); 
						} else {
							let lastActives = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textstanding-active"); 
							for (let la of lastActives)
								KHelpers.removeClass(la,"textstanding-active"); 
							//if (insert || Theatre.instance.speakingAs == Theatre.NARRATOR) {
							KHelpers.addClass(ev.currentTarget,"textstanding-active"); 
							Theatre.instance.setUserEmote(game.user.id,Theatre.instance.speakingAs,'textstanding',ev.currentTarget.getAttribute("name")); 
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
						KHelpers.addClass(child,"textstanding-active");
						//TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
						standingBox.scrollTop = child.offsetTop-Math.max(standingBox.offsetHeight/2,0); 
					}
				} else if (Theatre.instance.speakingAs == Theatre.NARRATOR) {
					let insertTextMode = Theatre.instance.theatreNarrator.getAttribute("textstanding"); 
					if (insertTextMode && insertTextMode == childTextMode) {
						KHelpers.addClass(child,"textstanding-active");
						// scroll to
						//TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
						standingBox.scrollTop = child.offsetTop-Math.max(standingBox.offsetHeight/2,0); 
					}
				} else if (Theatre.instance.userEmotes[game.user.id] && (child.getAttribute("name") ==  Theatre.instance.userEmotes[game.user.id].textStanding)) {
					KHelpers.addClass(child,"textstanding-active"); 
					// scroll to
					//TweenMax.to(standingBox,.4,{scrollTo:{y:child.offsetTop, offsetY:standingBox.offsetHeight/2}})
					standingBox.scrollTop = child.offsetTop-Math.max(standingBox.offsetHeight/2,0); 
				}
			}

			// If speaking as theatre, minimize away the emote section
			let emoteBox = Theatre.instance.theatreEmoteMenu.getElementsByClassName("emote-box")[0]; 
			let emContainer = emoteBox.getElementsByClassName("theatre-container-tiles")[0]; 
			if (Theatre.instance.speakingAs == Theatre.NARRATOR) {
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
							if (Theatre.DEBUG) console.log("em name: %s was clicked",emName); 
							if (KHelpers.hasClass(ev.currentTarget,"emote-active")) {
								KHelpers.removeClass(ev.currentTarget,"emote-active"); 
								// if speaking set to base
								Theatre.instance.setUserEmote(game.user.id,Theatre.instance.speakingAs,'emote',null); 
							} else {
								let lastActives = Theatre.instance.theatreEmoteMenu.getElementsByClassName("emote-active"); 
								for (let la of lastActives)
									KHelpers.removeClass(la,"emote-active"); 
								KHelpers.addClass(ev.currentTarget,"emote-active"); 
								// if speaking, then set our emote!
								Theatre.instance.setUserEmote(game.user.id,Theatre.instance.speakingAs,'emote',emName); 
							}
							// push focus to chat-message
							let chatMessage = document.getElementById("chat-message"); 
							chatMessage.focus(); 
						}
					}); 
					// bind mouseenter Listener
					child.addEventListener("mouseenter", (ev) => {
						Theatre.instance.configureTheatreToolTip(Theatre.instance.speakingAs,ev.currentTarget.getAttribute("name")); 
					}); 
					// check if this child is our configured 'emote'
					let childEmote = child.getAttribute("name"); 
					if (insert) {
						// if we have an insert we're speaking through, we should get that emote state instead
						// if the insert has no emote state, neither should we despite user settings
						let insertEmote = insert.emote; 
						if (insertEmote && insertEmote == childEmote) {
							KHelpers.addClass(child,"emote-active");
							//emContainer.scrollTop = child.offsetTop-Math.max(emContainer.offsetHeight/2,0); 
						}
						// we should 'highlight' emotes that at least have a base insert
						if (emotes[childEmote] && emotes[childEmote].insert)
							KHelpers.addClass(child,"emote-imgavail");

					}
					if (!insert && Theatre.instance.userEmotes[game.user.id] && (childEmote == Theatre.instance.userEmotes[game.user.id].emote)) {
						KHelpers.addClass(child,"emote-active"); 
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
		//Theatre.instance.theatreDock.style.width = `calc(100% - ${document.getElementById("sidebar").offsetWidth+2}px)`;
		let sideBar = document.getElementById("sidebar"); 
		Theatre.instance.theatreBar.style.width = (ui.sidebar._collapsed ? "100%" : `calc(100% - ${sideBar.offsetWidth+2}px)`);
		Theatre.instance.theatreNarrator.style.width = (ui.sidebar._collapsed ? "100%" : `calc(100% - ${sideBar.offsetWidth+2}px)`);
		let primeBar = document.getElementById("theatre-prime-bar"); 
		let secondBar = document.getElementById("theatre-second-bar");
		if (Theatre.instance._getTextBoxes().length == 2) {
			let dualWidth = Math.min(Math.floor(Theatre.instance.theatreBar.offsetWidth/2),650); 
			primeBar.style.width = dualWidth + "px"; 
			secondBar.style.width = dualWidth + "px"; 
			secondBar.style.left = `calc(100% - ${dualWidth}px)`; 
		}
		// emote menu
		if (Theatre.instance.theatreEmoteMenu)
			Theatre.instance.theatreEmoteMenu.style.top = `${Theatre.instance.theatreControls.offsetTop-410}px`
		/*
		Theatre.instance.theatreToolTip.style.top = `${Theatre.instance.theatreControls.offsetTop-Theatre.instance.theatreToolTip.offsetHeight}px`
		Theatre.instance.theatreToolTip.style.left = `${sideBar.offsetLeft - Theatre.instance.theatreToolTip.offsetWidth}px`
		*/

		let app = Theatre.instance.pixiCTX; 
		let dockWidth = Theatre.instance.theatreDock.offsetWidth; 
		let dockHeight = Theatre.instance.theatreDock.offsetHeight; 
		Theatre.instance.theatreDock.setAttribute("width",dockWidth); 
		Theatre.instance.theatreDock.setAttribute("height",dockHeight); 
		app.width = dockWidth;
		app.height = dockHeight; 
		app.renderer.view.width = dockWidth; 
		app.renderer.view.height = dockHeight; 
		app.renderer.resize(dockWidth,dockHeight); 
		//app.render(); 
		if (!Theatre.instance.rendering)
			Theatre.instance._renderTheatre(performance.now()); 

		if (Theatre.instance.reorderTOId)
			window.clearTimeout(Theatre.instance.reorderTOId)

		Theatre.instance.reorderTOId = window.setTimeout(()=>{
			Theatre.reorderInserts(); 
			Theatre.instance.reorderTOId = null; 
		},250); 

	}



	/**
	 * Store mouse position for our tooltip which will roam
	 *
	 * @param ev (Event) : The Event that triggered the mouse move.
	 */
	handleEmoteMenuMouseMove(ev) {
		Theatre.instance.theatreToolTip.style.top = 
			`${(ev.clientY || ev.pageY) - Theatre.instance.theatreToolTip.offsetHeight - 20}px`; 
		Theatre.instance.theatreToolTip.style.left = 
			`${Math.min(
					(ev.clientX || ev.pageX) - Theatre.instance.theatreToolTip.offsetWidth/2, 
					Theatre.instance.theatreDock.offsetWidth-Theatre.instance.theatreToolTip.offsetWidth)}px`; 
	}

	/**
	 * Handle the emote click
	 *
	 * @param ev (Event) : The Event that triggered this handler
	 */
	handleBtnEmoteClick(ev) {
		if (Theatre.DEBUG) console.log("emote click"); 

		if (KHelpers.hasClass(ev.currentTarget,"theatre-control-btn-down")) {
			Theatre.instance.theatreEmoteMenu.style.display = "none"; 
			KHelpers.removeClass(ev.currentTarget,"theatre-control-btn-down"); 
		} else {
			Theatre.instance.renderEmoteMenu(); 
			Theatre.instance.theatreEmoteMenu.style.display = "flex"; 
			KHelpers.addClass(ev.currentTarget,"theatre-control-btn-down"); 
		}
	}

	/**
	 * Handle chat-message focusOut
	 *
	 * @param ev (Event) : The Event that triggered this handler
	 */
	handleChatMessageFocusOut(ev) {
		KHelpers.removeClass(Theatre.instance.theatreChatCover,"theatre-control-chat-cover-ooc"); 
	}

	/**
	 * Handle chat-message keyUp
	 *
	 * @param ev (Event) : The Event that triggered this handler
	 */
	handleChatMessageKeyUp(ev) {
		if (!ev.repeat 
		//&& Theatre.instance.speakingAs
		&& ev.key == "Control")
			KHelpers.removeClass(Theatre.instance.theatreChatCover,"theatre-control-chat-cover-ooc"); 
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
			if (!action.action.includes("theatre")) continue;
			action.onDown.call(context);
		}

		let now = Date.now(); 

		if (!ev.repeat 
		//&& Theatre.instance.speakingAs
		&& ev.key == "Control")
			KHelpers.addClass(Theatre.instance.theatreChatCover,"theatre-control-chat-cover-ooc"); 

		if (now - Theatre.instance.lastTyping < 3000) return; 
		if (ev.key == "Enter"
		|| ev.key == "Alt"
		|| ev.key == "Shift"
		|| ev.key == "Control") return; 
		if (Theatre.DEBUG) console.log("keydown in chat-message"); 
		Theatre.instance.lastTyping = now; 
		Theatre.instance.setUserTyping(game.user.id,Theatre.instance.speakingAs)
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
		if (Theatre.DEBUG) console.log("narrator click"); 

		if (KHelpers.hasClass(ev.currentTarget,"theatre-control-nav-bar-item-speakingas")) {
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
		if (Theatre.DEBUG) console.log("cinema click"); 
		ui.notifications.info(game.i18n.localize("Theatre.NotYet"));
		/*
		if (KHelpers.hasClass(ev.currentTarget,"theatre-control-small-btn-down")) {
			KHelpers.removeClass(ev.currentTarget,"theatre-control-small-btn-down"); 
		} else {
			KHelpers.addClass(ev.currentTarget,"theatre-control-small-btn-down"); 
			ui.notifications.info(game.i18n.localize("Theatre.NotYet"));
		}
		*/
	}

	/**
	 * Handle the Delay Emote toggle click
	 *
	 * @param ev (Event) : The Event that triggered this handler
	 */
	handleBtnDelayEmoteClick(ev) {
		if (Theatre.DEBUG) console.log("delay emote click"); 

		if (Theatre.instance.isDelayEmote) {
			if (KHelpers.hasClass(ev.currentTarget,"theatre-control-small-btn-down"))
				KHelpers.removeClass(ev.currentTarget,"theatre-control-small-btn-down"); 
			Theatre.instance.isDelayEmote = false; 
		} else {
			if (!KHelpers.hasClass(ev.currentTarget,"theatre-control-small-btn-down"))
				KHelpers.addClass(ev.currentTarget,"theatre-control-small-btn-down"); 
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
		if (Theatre.DEBUG) console.log("quote click"); 

		if (Theatre.instance.isQuoteAuto) {
			if (KHelpers.hasClass(ev.currentTarget,"theatre-control-small-btn-down"))
				KHelpers.removeClass(ev.currentTarget,"theatre-control-small-btn-down"); 
			Theatre.instance.isQuoteAuto = false; 
		} else {
			if (!KHelpers.hasClass(ev.currentTarget,"theatre-control-small-btn-down"))
				KHelpers.addClass(ev.currentTarget,"theatre-control-small-btn-down"); 
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
		if (Theatre.DEBUG) console.log("resync click"); 
		if (game.user.isGM) {
			Theatre.instance._sendResyncRequest("players"); 
            ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.ResyncGM"));
        }
		else {
			Theatre.instance._sendResyncRequest("gm"); 
		}
	}

	/**
	 * Handle the supression click
	 *
	 * @param ev (Event) : The Event that triggered this handler
	 */
	handleBtnSuppressClick(ev) {
		if (Theatre.DEBUG) console.log("suppression click"); 
		if (Theatre.instance.isSuppressed) {
			if (KHelpers.hasClass(ev.currentTarget,"theatre-control-btn-down")) {
				KHelpers.removeClass(ev.currentTarget,"theatre-control-btn-down"); 
			}
		}
		else {
			KHelpers.addClass(ev.currentTarget,"theatre-control-btn-down"); 
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
			Theatre.instance.theatreDock.style.opacity = (combatActive ? "0.05" : "0.20");
			Theatre.instance.theatreBar.style.opacity = (combatActive ? "0.05" : "0.20");
			Theatre.instance.theatreNarrator.style.opacity = (combatActive ? "0.05" : "0.20");


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
		ev.currentTarget.scrollLeft += (pos ? 10 : -10);
		//ev.currentTarget.scrollLeft -= ev.deltaY/4; 	
	}

	/**
	 * Handle textBox Mouse Double Click
	 *
	 * @param ev (Event) : The Event that triggered this handler
	 */
	handleTextBoxMouseDoubleClick(ev) {
		if (Theatre.DEBUG) console.log("MOUSE DOUBLE CLICK"); 
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
		if (Theatre.DEBUG) console.log("WINDOW MOUSE UP"); 

		let x = ev.clientX || ev.pageX;
		let y = ev.clientY || ev.pageY; 

		let insert = Theatre.instance.dragPoint.insert
		let box = Theatre.instance.dragPoint.box
		let ix = Theatre.instance.dragPoint.ix; 
		let iy = Theatre.instance.dragPoint.iy; 
		let ox = Theatre.instance.dragPoint.oleft; 
		let oy = Theatre.instance.dragPoint.otop; 

		let dx = (x-ix)+ox; 
		let dy = (y-iy)+oy; 

		if (dx < box.minleft) dx = box.minleft; 
		if (dx > box.maxleft) dx = box.maxleft; 
		if (dy > box.maxtop) dy = box.maxtop; 
		if (dy < box.mintop) dy = box.mintop; 

		if (Theatre.DEBUG) console.log("WINDOW MOUSE UP FINAL x: "+x+" y: "+y+" ix: "+ix+" iy: "+iy+" dx: "+dx+" dy: "+dy+" ox: "+ox+" oy: "+oy); 
		//port.style.left = `${dx}px`; 
		//port.style.top = `${dy}px`; 
		//insert.portraitContainer.x = dx; 
		//insert.portraitContainer.y = dy; 
		if (!insert.dockContainer || !insert.portraitContainer) {
			console.log("ERROR: insert dockContainer or portrait is INVALID"); 
			window.removeEventListener("mouseup",Theatre.instance.handleWindowMouseUp); 
			return; 
		}

		let tweenId = "portraitMove"; 	
		let tween = TweenMax.to(insert.portraitContainer,0.5,{
			pixi:{x: dx, y: dy},
			ease: Power3.easeOut,
			onComplete: function(ctx,imgId,tweenId) {
				// decrement the rendering accumulator
				ctx._removeDockTween(imgId,this,tweenId); 
				// remove our own reference from the dockContainer tweens
			},
			onCompleteParams: [Theatre.instance,insert.imgId,tweenId]
		}); 
		Theatre.instance._addDockTween(insert.imgId,tween,tweenId); 

		// send sceneEvent
		Theatre.instance._sendSceneEvent("positionupdate",{
			insertid : insert.imgId,
			position: {x: dx, y: dy, mirror: insert.mirrored}
		}); 

		window.removeEventListener("mouseup",Theatre.instance.handleWindowMouseUp); 
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
		if (Theatre.DEBUG) console.log("MOUSE DOWN ",ev.buttons, ev.button); 
		let id = ev.currentTarget.getAttribute("imgId"); 

		if (ev.button == 0) {
			if (!ev.ctrlKey 
			&& !ev.shiftKey
			&& !ev.altKey) {
				// if old dragPoint exists reset the style, and clear any interval that may exist
				if (!!Theatre.instance.dragPoint && !!Theatre.instance.dragPoint.insert) {
					console.log("PREXISTING DRAGPOINT!"); 
					//Theatre.instance.dragPoint.port.style.transition = "top 0.5s ease, left 0.5s ease, transform 0.5s ease"; 
				}
				// calculate bouding box
				let boundingBox = {}; 
				let insert = Theatre.instance.getInsertById(id); 

				// permission check
				if (!Theatre.instance.isActorOwner(game.user.id,insert.imgId)) {
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
					return; 
				}

				// max top is half natural height
				// min top is zero to prevent it from losing it's flush
				// max left is half natural width
				// min left is - half natural width
				boundingBox["maxtop"] = (insert.optAlign == "top" ? 0 : insert.portrait.height); 
				boundingBox["mintop"] = insert.portrait.height / 2; 
				boundingBox["maxleft"] = insert.portrait.width * 3 / 2; 
				boundingBox["minleft"] = 0; 

				// original cooords
				//let portStyles = KHelpers.style(port); 
				let origX = insert.portraitContainer.x; 
				let origY = insert.portraitContainer.y; 

				if (Theatre.DEBUG) console.log("STORING DRAG POINT",ev.clientX || ev.pageX, ev.clientY || ev.PageY, boundingBox, origX, origY); 

				// change the transition style while we're dragging
				//port.style.transition = "top 0.5s ease, left 0.5s ease, transform 0.5s ease"; 

				// normal mouse down, start "drag" tracking
				Theatre.instance.dragPoint = {
					otop: origY,
					oleft: origX, 
					ix: (ev.clientX || ev.pageX),
					iy: (ev.clientY || ev.pageY),
					insert: insert,
					box: boundingBox,
				}
				// bind listeners
				window.removeEventListener("mouseup",Theatre.instance.handleWindowMouseUp); 
				window.addEventListener("mouseup",Theatre.instance.handleWindowMouseUp); 
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
		if (Theatre.DEBUG) console.log("MOUSE UP ",ev.buttons, ev.button); 
		let id = ev.currentTarget.getAttribute("imgId"); 
		let chatMessage = document.getElementById("chat-message"); 
		if (ev.button == 0) {
			if (ev.ctrlKey) {
				Theatre.instance.decayTextBoxById(id); 
				ev.stopPropagation(); 
			} else if (ev.shiftKey) {
				Theatre.instance.pushInsertById(id,true); 
				chatMessage.focus(); 
				ev.stopPropagation(); 
			} else if (ev.altKey) {
				// activate navitem
				// activate insert
				Theatre.instance.activateInsertById(id,ev); 
			}
		} else if (ev.button == 2) {
			if (ev.ctrlKey) {
				Theatre.instance.removeInsertById(id); 
				ev.stopPropagation(); 
			} else if (ev.shiftKey) {
				if (Theatre.instance.swapTarget 
				&& Theatre.instance.swapTarget != id) {
					Theatre.instance.swapInsertsById(id,Theatre.instance.swapTarget); 
					Theatre.instance.swapTarget = null; 
				} else {
					Theatre.instance.pushInsertById(id,false); 
				}
				chatMessage.focus(); 
				ev.stopPropagation(); 
			} else if (ev.altKey) {
				let actor = game.actors.get(id.replace("theatre-","")); 
				Theatre.addToNavBar(actor.data); 
			} else if (Theatre.instance.swapTarget) {
				if (Theatre.instance.swapTarget != id) {
					//Theatre.instance.swapInsertsById(id,Theatre.instance.swapTarget); 
					Theatre.instance.moveInsertById(id,Theatre.instance.swapTarget); 
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
		ev.dataTransfer.setDragImage(ev.currentTarget,16,16); 
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
		KHelpers.insertBefore(Theatre.instance.dragNavItem,ev.currentTarget); 
	}

	/**
	 * Handle mouse up on navItems
	 *
	 * @param ev (Event) : The Event that triggered this handler
	 */
	handleNavItemMouseUp(ev) {
		let navItem = ev.currentTarget; 
		let id = ev.currentTarget.getAttribute("imgId"); 
		let actorId = id.replace("theatre-",""); 
		let params = Theatre.instance._getInsertParamsFromActorId(actorId); 
		if (!params) {
			console.log("ERROR, actorId %s does not exist!",actorId); 
			// remove the nav Item
			ev.currentTarget.parentNode.removeChild(ev.currentTarget); 
			return; 
		}

		if (Theatre.DEBUG) console.log("Button UP on nav add?",ev.button); 

		switch(ev.button) {
			case 0:
				Theatre.instance.activateInsertById(id,ev); 
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
					if (ev.altKey)
						emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params,true); 
					else
						emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params); 

					if (!ev.shiftKey) {
						if (game.user.isGM)
							Theatre.instance.injectLeftPortrait(src,name,id,optAlign,emotions); 
						else
							Theatre.instance.injectRightPortrait(src,name,id,optAlign,emotions); 
					} else
						Theatre.instance.injectRightPortrait(src,name,id,optAlign,emotions); 

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
		if (!Theatre.instance) return; 
		let boxes = Theatre.instance._getTextBoxes(); 
		let containerWidth = Theatre.instance.theatreDock.offsetWidth; 
		// Min 22px, max 32px, scale for all values inbetween
		let fontSize = Math.floor(Math.max((Math.min(containerWidth/boxes.length,500)/500)*28,18)); 
		if (Theatre.DEBUG) console.log("Reorder CALCUALTED FONT SIZE: ",fontSize); 

		for (let textBox of boxes) {
			let theatreId = textBox.getAttribute("imgid"); 
			let insert = Theatre.instance.getInsertById(theatreId); 
			
			if (!insert) {
				Theatre.instance._removeTextBoxFromTheatreBar(textBox); 
				continue; 
			}
			// if somehow the containers are not setup, skip and hope the next re-order has them ready
			
			if (!insert.portrait || !insert.label) {
				if (Theatre.DEBUG) console.log("WARN: %s : %s was not ready!",insert.name,insert.imgId); 
				continue; 
			}
			// if the insert/textBox pair is in the process of being removed.
			if (textBox.getAttribute("deleting"))
				continue; 

			//console.log("repositioning %s :",theatreId,insert); 
			let offset = KHelpers.offset(textBox); 
			//left calc
			let leftPos = Math.round(
					Number(offset.left || 0)
					- Number(KHelpers.style(textBox)["left"].match(/\-*\d+\.*\d*/) || 0)
					- Number(KHelpers.style(Theatre.instance.theatreBar)["margin-left"].match(/\-*\d+\.*\d*/) || 0)
			); 

			//insert.dockContainer.width = textBox.offsetWidth; 

			if (insert.exitOrientation == "left") {
				if (Theatre.DEBUG) console.log("LEFT (name: %s): ",insert.nameOrientation,leftPos,insert.name, Theatre.instance.theatreBar.offsetWidth/2); 
				if (leftPos+(insert.dockContainer.width/2) > Theatre.instance.theatreBar.offsetWidth/2) {
					if (Theatre.DEBUG) console.log("swapping " + insert.name + " to right alignment from left"); 
					insert.exitOrientation = "right"; 
				}
			} else {
				if (Theatre.DEBUG) console.log("RIGHT (name: %s): ",insert.nameOrientation,leftPos,insert.name, Theatre.instance.theatreBar.offsetWidth/2); 
				//right
				if (leftPos+(insert.dockContainer.width/2) <= Theatre.instance.theatreBar.offsetWidth/2) {
					if (Theatre.DEBUG) console.log("swapping " + insert.name + " to left alignment from right"); 
					insert.exitOrientation = "left"; 
				}
			}
			// pre-split measurement
			insert.label.style.fontSize = game.settings.get(Theatre.SETTINGS,"nameFontSize");
			insert.label.style.lineHeight = game.settings.get(Theatre.SETTINGS,"nameFontSize")*1.5; 
			insert.label.style.wordWrap = false; 
			insert.label.style.wordWrapWidth = insert.portrait.width; 
			let labelExceeds = (insert.label.width+20+insert.label.style.fontSize) > textBox.offsetWidth; 
			let preLabelWidth = insert.label.width; 
			// split measurement
			insert.label.style.wordWrap = true; 
			insert.label.style.wordWrapWidth = textBox.offsetWidth; 
			// shrink if label exceeds
			if (labelExceeds) {
				// apply title font size
				let titleFontSize = Math.floor(Math.max((Math.min(containerWidth/boxes.length,600)/600)*44,28)); 
				insert.label.style.fontSize = titleFontSize; 
				insert.label.style.lineHeight = titleFontSize*1.5; 
			}

			// Scale the name bar length and orient the portait
			
			if (insert.nameOrientation == "left") {
				insert.label.x = 20; 
				insert.typingBubble.anchor.set(0.5); 
				insert.typingBubble.x = Math.min(preLabelWidth + 20 + insert.typingBubble.width/2, textBox.offsetWidth - insert.typingBubble.width/2); 

			} else {
				if (labelExceeds) {
					insert.label.x = insert.portrait.width - insert.label.width - 20; 
					if (insert.label.width - 20 > insert.portrait.width)
						insert.typingBubble.x = Math.min(insert.portrait.width - insert.label.width - insert.typingBubble.texture.width/2 - 20, insert.typingBubble.width/2); 
					else
						insert.typingBubble.x = Math.max(insert.portrait.width - insert.label.width - insert.typingBubble.texture.width/2 - 20, insert.typingBubble.width/2); 
				} else {
					insert.label.x = insert.portrait.width - preLabelWidth - 20; 
					if (preLabelWidth - 20 > insert.portrait.width)
						insert.typingBubble.x = Math.min(insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width/2 - 20, insert.typingBubble.width/2); 
					else
						insert.typingBubble.x = Math.max(insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width/2 - 20, insert.typingBubble.width/2); 
				}

				insert.typingBubble.anchor.set(0.5); 

				leftPos += textBox.offsetWidth - insert.portrait.width; 
			}
			insert.typingBubble.y = insert.portrait.height - 
				(insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight + insert.typingBubble.height/2;  
			// if the label height > font-size, it word wrapped wrap, so we need to bump up the height
			if (labelExceeds) {
				let divisor = Math.round(insert.label.height/insert.label.style.lineHeight); 
				insert.label.y = insert.portrait.height - 
					(insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - (insert.label.style.lineHeight*divisor);  
			} else {
				// normal
				insert.label.y = insert.portrait.height - 
					(insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight;  
			}
			insert.typingBubble.rotation = 0.1745; 
			insert.dockContainer.y = Theatre.instance.theatreDock.offsetHeight 
				- (insert.optAlign == "top" ? Theatre.instance.theatreBar.offsetHeight : 0) - insert.portrait.height; 

			// theatreStyle specific adjustments
			switch (Theatre.instance.settings.theatreStyle) {
				case "lightbox":
					// to allow top-aligned portraits to work without a seam
					insert.dockContainer.y += (insert.optAlign == "top" ? 8 : 0); 
					insert.label.y -= (insert.optAlign == "top" ? 8 : 0); 
					break; 
				case "clearbox":
					insert.dockContainer.y = Theatre.instance.theatreDock.offsetHeight - insert.portrait.height; 
					insert.label.y += (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) 
					insert.typingBubble.y += (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight);  
					break; 
				case "mangabubble":
					break; 
				case "textbox":
					break; 
				default:
					break; 
			}

			// Based on the number of active inserts, space, and user /desired/ font size, we'll set the font size
			let insertFontSize = fontSize; 
			textBox.setAttribute('osize',insertFontSize); 
			switch (Number(insert.textSize)) {
				case 3: 
					insertFontSize *= 1.5
					break; 
				case 1:
					insertFontSize *= 0.5
					break; 
				default:
					break; 
			}
			textBox.style["font-size"] = `${insertFontSize}px`;

			// now apply it to all children and sub child heights if the height is different
			// note that we only care about growing, not shrinking to conserve a bit.
			if (textBox.children[0] 
			&& textBox.children[0].tagName.toLowerCase() != "hr" 
			&& textBox.children[0].offsetHeight != insertFontSize) {
				for (let c of textBox.children) {
					if (c.tagName.toLowerCase() == "hr")
						continue; 
					for (let sc of c.children)
						sc.style.height = `${insertFontSize}px`;
					c.style.height = `${insertFontSize}px`;
				}
			}
			// bookmark leftPos as order for sorting
			insert.order = leftPos; 
			insert.renderOrder = leftPos; 

			let tweenId = "containerSlide"; 
			let tween = TweenMax.to(insert.dockContainer,1,{
				//delay: 0.5,
				pixi:{x: leftPos, alpha: 1},
				ease: Power4.easeOut,
				onComplete: function(ctx,imgId,tweenId) {
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId,this,tweenId); 
					// remove our own reference from the dockContainer tweens
				},
				onCompleteParams: [Theatre.instance,insert.imgId,tweenId]
			}); 
			Theatre.instance._addDockTween(theatreId,tween,tweenId); 
		}
		// sort the render order by left position order
		Theatre.instance.portraitDocks.sort((a,b)=>{return a.order-b.order}); 

	}



	/**
	 * Set wither or not to display or hide theatre debug information. 
	 *
	 * @params state (Boolean) : Boolean indicating if we should toggle debug on/off
	 */
	static setDebug(state) {
		if (state) {
			Theatre.DEBUG = true; 
			for (let insert of Theatre.instance.portraitDocks)
				Theatre.instance.renderInsertById(insert.imgId); 
		} else {
			Theatre.DEBUG = false; 
			for (let insert of Theatre.instance.portraitDocks)
				Theatre.instance.renderInsertById(insert.imgId); 
		}
	}

	/**
	 * Verify the TweenMax ease from the animation syntax shorthand.
	 *
	 * @params str (String) : the ease to verify. 
	 */
	static verifyEase(str) {
		switch (str) {
			case "power1":
			case "power1Out":
				return Power1.easeOut; 
				break; 
			case "power1In":
				return Power1.easeIn; 
				break; 
			case "power1InOut":
				return Power1.easeInOut; 
				break; 
			case "power2":
			case "power2Out":
				return Power2.easeOut; 
				break; 
			case "power2In":
				return Power2.easeIn; 
				break; 
			case "power2InOut":
				return Power2.easeInOut; 
				break; 

			case "power3":
			case "power3Out":
				return Power3.easeOut; 
				break; 
			case "power3In":
				return Power3.easeIn; 
				break; 
			case "power3InOut":
				return Power3.easeInOut; 
				break; 

			case "power4":
			case "power4Out":
				return Power4.easeOut; 
				break; 
			case "power4In":
				return Power4.easeIn; 
				break; 
			case "power4InOut":
				return Power4.easeInOut; 
				break; 

			case "back":
			case "backOut":
				return Back.easeOut; 
				break; 
			case "backIn":
				return Back.easeIn; 
				break; 
			case "backInOut":
				return Back.easeInOut; 
				break; 

			case "elastic":
			case "elasticOut":
				return Elastic.easeOut; 
				break; 
			case "elasticIn":
				return Elastic.easeIn; 
				break; 
			case "elasticInOut":
				return Elastic.easeInOut; 
				break; 

			case "bounce":
			case "bounceOut":
				return Bounce.easeOut; 
				break; 
			case "bounceIn":
				return Bounce.easeIn; 
				break; 
			case "bounceInOut":
				return Bounce.easeInOut; 
				break; 

			case "circ":
			case "circOut":
				return Circ.easeOut; 
				break; 
			case "circIn":
				return Circ.easeIn; 
				break; 
			case "circInOut":
				return Circ.easeInOut; 
				break; 

			case "expo":
			case "expoOut":
				return Expo.easeOut; 
				break; 
			case "expoIn":
				return Expo.easeIn; 
				break; 
			case "expoInOut":
				return Expo.easeInOut; 
				break; 

			case "sine":
			case "sineOut":
				return Sine.easeOut; 
				break; 
			case "sineIn":
				return Sine.easeIn; 
				break; 
			case "sineInOut":
				return Sine.easeInOut; 
				break; 

			case "power0":
			default:
				return Power0.easeNone; 
				break; 
		}
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
		if (!str || typeof(str) != "string") return null; 
		if (Theatre.DEBUG) console.log("verifying syntax %s",str); 
		let tweenParams = []; 

		try {
			let sections = str.split('|'); 
			let resName = sections[0]; 

			let verifyTarget = function (target) {
				// TODO verify each property
				return true; 
			}

			for (let sdx=1; sdx<sections.length; ++sdx) {
				let parts = sections[sdx].split(';'); 
				let idx = 0; 
				let duration,advOptions,targets,propDefs; 

				duration = Number(parts[idx]) || 1;
				if (/\([^\)\(]*\)/g.test(parts[++idx])) {
					advOptions = parts[idx]; 
					idx++; 
				}
				if (advOptions) {
					advOptions = advOptions.replace(/[\(\)]/g,""); 
					let advParts = advOptions.split(',');
					advOptions = {}; 
					for (let advPart of advParts) {
						let components = advPart.split(':'); 
						if (components.length != 2) throw "component properties definition : "+advPart+" is incorrect"; 
						let advPropName = components[0].trim(); 
						let advPropValue = components[1].trim(); 
						advOptions[advPropName] = advPropValue;  
					}
				}

				targets = []; 
				propDefs = []; 
				for (idx; idx<parts.length; ++idx)
					targets.push(parts[idx]);

				for (let target of targets) {
					let components = target.split(':'); 
					if (components.length != 2) throw "component properties definition : "+target+" is incorrect"; 
					let propName = components[0]; 
					let scomps = components[1].split(','); 
					if (scomps.length != 2) throw "component properties definition : "+target+" is incorrect"; 
					let init = scomps[0];
					let fin = scomps[1]; 
					if (verifyTarget(propName,init,fin)) {
						let propDef = {name: propName, initial: init, final: fin}; 
						propDefs.push(propDef); 
					} else
						throw "component properties definition : "+target+" is incorrect"; 
				}
				if (Theatre.DEBUG) console.log("Animation Syntax breakdown of %s : ",sections[sdx],duration,advOptions,propDefs); 
				tweenParams.push({resName: resName, duration: duration, advOptions: advOptions, props: propDefs}); 
			}
		} catch (e) {
			console.log("BAD ANIMATION SYNTAX: %s",e); 
			return tweenParams; 
		}

		if (Theatre.DEBUG) console.log("tween params are valid with: ", tweenParams); 

		return tweenParams; 
	}

	/**
	 * Prepare fonts and return the list of fonts available
	 *
	 * @return (Array[(String)]) : The array of font familys to use. 
	 */
	static getFonts() {
		if (!Theatre.FONTS) {
			// language specific fonts 
			switch (game.i18n.lang) {
			    case "cn":
					Theatre.instance.titleFont = "SourceHanSerifSC-Medium";
					Theatre.instance.textFont = "BianHeiti"; 
					Theatre.instance.fontWeight = "normal";
					Theatre.FONTS = [
						"SourceHanSerifSC-Medium",
						"BianHeiti"
					];
					break;
				case "ja":
					Theatre.instance.titleFont = "Togalite";
					Theatre.instance.textFont = "NotoSansJPBold"; 
					Theatre.instance.fontWeight = "normal";
					Theatre.FONTS = [
						"NotoSansJPBold",
						"Togalite",
						"GenEiLateMin_v2",
						"HannariMincho",
						"TogoshiMincho",
						"AppliMincho",
						"GenkaiMincho",
						"CorporateLogoBold",
						"CineCaption",
						"RiiPopkk",
						"MikaChan",
						"PopRumCute",
						"MaleCharacters",
						"AsobiMemogaki",
						"ArmedLemon",
						"ChikaraYowaku",
						"Otsutome",
						"ZinHenaBokuryu",
						"KohichiFeltPen",
						"KaisoNextB",
						"TegakiKakutto",
						"NicoMojiPlus",
						"Pigmo01",
						"NagurigakiCrayon",
						"TanukiPermanentMarker",
						"MinaMoji",
						"Zomzi",
						"ReallyScaryMinchotai"
					]; 
					break;
				case "ko":
					Theatre.instance.titleFont = "BMDohyeon";
					Theatre.instance.textFont = "NotoSansKRBold"; 
					Theatre.instance.fontWeight = "normal";
					Theatre.FONTS = [
						"NotoSansKRBold",
						"BMDohyeon",
						"BMHannaPro",
						"BMYeonSung",
						"Sunflower",
						"BlackHanSans",
						"JejuHallasan",
						"KirangHaerang",
						"Daraehand",
						"GabiaSolmee",
						"NanumBrush",
						"HiMelody",
						"UhBeeSeHyun",
						"UhBeeJisyuk",
						"SSShinRegular",
						"SSShinB7Regular",
						"TvNEnjoyStories"
					]; 
					break; 
				case "th":
					Theatre.instance.titleFont = "Prompt";
					Theatre.instance.textFont = "NotoSansThaiBold"; 
					Theatre.instance.fontWeight = "normal"; 
					Theatre.FONTS = [
						"NotoSansThaiBold",
						"Prompt",
						"K2DBold",
						"Kanit",
						"Chonburi",
						"Charm",
						"Charmonman",
						"Srisakdi",
						"Sriracha",
						"Pattaya",
						"Athiti",
						"ChakraPetch",
						"Kodchasan",
						"Fahkwang",
						"Itim",
						"KoHo",
						"Krub",
						"Maitree",
						"Mali",
						"Niramit",
						"Pridi",
						"Sarabun",
						"Taviraj",
						"Thasadith",
						"BaiJamjuree"
					]; 
					break; 
				case "en":
					Theatre.instance.titleFont = "Riffic";
					Theatre.instance.textFont = "SignikaBold"; 
					Theatre.instance.fontWeight = "normal";
					Theatre.FONTS = [
						"Caslon",
						"CaslonAntique",
						"SignikaBold", 
						"Riffic",
						"IronSans",
						"LinLibertine",
						"TimesNewRomance",
						"TimesNewYorker",
						"LPEducational",
						"Cardinal",
						"OldLondon",
						"StoneHenge",
						"SunnyDay",
						"PaulSignature",
						"LemonTuesday",
						"FairProsper",
						"BalletHarmony",
						"MagieraScript",
						"Cathallina",
						"Hamish",
						"DreamersBrush",
						"FastInMyCar",
						"ChildWriting",
						"Kindergarten",
						"FuturaHandwritten",
						"Fewriter",
						"TrashHand",
						"GoodBrush",
						"BaksoSapi",
						"SuplexmentaryComic",
						"ComicInk",
						"DreamyLand",
						"Yikes",
						"GangOfThree",
						"JianGkrik",
						"Yozakura",
						"Hiroshio",
						"ArabDances",
						"Rooters",
						"Subway",
						"Himagsikan",
						"MilTown",
						"Galactico",
						"Oko",
						"Ethnocentric",
						"VenusRising",
						"StampAct",
						"Kirsty",
						"Western",
						"BreakAway",
						"YoungerThanMe",
						"Underground",
						"VarsityTeam",
						"Valentino",
						"GlassHouses",
						"Makayla",
						"DancingVampyrish",
						"Codex",
						"DSNetStamped",
						"HappyFrushZero",
						"Shoplifter",
						"Stereofidelic",
						"Headache",
						"HorrorHouse",
						"GhostTheory2",
						"Syemox",
						"GhostChase"
					]; 
					break; 
				default:
					Theatre.instance.titleFont = "Riffic";
					Theatre.instance.textFont = "SignikaBold"; 
					Theatre.instance.fontWeight = "normal"; 
					Theatre.FONTS = [
						"Caslon",
						"CaslonAntique",
						"SignikaBold", 
						"Riffic",
						"LinLibertine",
						"TimesNewRomance",
						"LPEducational",
						"Cardinal",
						"OldLondon",
						"StoneHenge",
						"Alamain",
						"LemonTuesday",
						"FairProsper",
						"Exmouth",
						"Hamish",
						"DreamersBrush",
						"FuturaHandwritten",
						"Fewriter",
						"TrashHand",
						"GoodBrush",
						"BaksoSapi",
						"SuplexmentaryComic",
						"DreamyLand",
						"GangOfThree",
						"JianGkrik",
						"Yozakura",
						"Hiroshio",
						"Rooters",
						"Himagsikan",
						"Galactico",
						"Oko",
						"Ethnocentric",
						"VenusRising",
						"StampAct",
						"Kirsty",
						"YoungerThanMe",
						"Underground",
						"VarsityTeam",
						"Valentino",
						"Makayla",
						"HappyFrushZero",
						"Stereofidelic",
						"Headache",
						"HorrorHouse",
						"Syemox"
					]; 
					break; 
			}
			// Load some essential fonts we use in PIXI
			WebFont.load({
				custom: {
					families: [Theatre.instance.titleFont,Theatre.instance.textFont]
				}
			}); 
			// async load everything else
			let oFonts = []; 
			for (let idx=Theatre.FONTS.length-1; idx>= 0; --idx) {
				if (Theatre.FONTS[idx] == Theatre.instance.titleFont 
				|| Theatre.FONTS[idx] == Theatre.instance.textFont)
					continue;
				oFonts.push(Theatre.FONTS[idx]); 
			}
			var aLoader = async function(fonts) {
				WebFont.load({
					custom: {
						families: fonts
					}
				}); 
			}

			aLoader(oFonts); 

		}

		return Theatre.FONTS; 
	}

	static getActorDisplayName(actorId) {
		const actor = game.actors.get(actorId);
		if (game.modules.get("combat-utility-belt")?.active) {
			if (game.settings.get("combat-utility-belt", "enableHideNPCNames")) {
				if (game.cub.hideNames.constructor.shouldReplaceName(actor)) {
					return game.cub.hideNames.constructor.getReplacementName(actor);
				}
			}
		}
		return actor.name;
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
	static getActorEmotes(actorId,disableDefault) {
		let actor = game.actors.get(actorId); 
		let data,ae,de,re; 

		if (actor)
			data = actor.data; 

		if (data && data.flags.theatre) {
			ae = data.flags.theatre.emotes; 
			if (disableDefault) {
				re = ae; 
			} else {
				de = Theatre.getDefaultEmotes(); 
				re = mergeObject(de,ae); 
			}
		} else
			re = Theatre.getDefaultEmotes();

		return re; 
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
		let actor = game.actors.get(actorId); 
		let data,ar,dr,rr; 

		if (actor)
			data = actor.data; 

		dr = Theatre.getDefaultRiggingResources(); 
		if (data 
		&& data.flags.theatre 
		&& data.flags.theatre.rigging
		&& data.flags.theatre.rigging.resources) {
			ar = data.flags.theatre.rigging.resources; 
			rr = dr.concat(ar); 
		} else
			rr = dr; 

		return rr; 

	}

	/**
	 * Default rigging resources
	 *
	 * @return (Array[(Object)]) : An array of {name: (String), path: (String)} tuples
	 *                             representing the default rigging resource map. 
	 */
	static getDefaultRiggingResources() {
		return [
			// bubbles
			{name: "angry", path: "modules/theatre/app/graphics/bubbles/angry.png"},
			{name: "frustrated", path: "modules/theatre/app/graphics/bubbles/frustrated.png"},
			{name: "annoyed", path: "modules/theatre/app/graphics/bubbles/annoyed.png"},
			{name: "hearts", path: "modules/theatre/app/graphics/bubbles/hearts.png"},
			{name: "sleeping", path: "modules/theatre/app/graphics/bubbles/sleeping.png"},
			{name: "surprised", path: "modules/theatre/app/graphics/bubbles/surprised.png"},
			{name: "confused", path: "modules/theatre/app/graphics/bubbles/confused.png"},
			{name: "awe-struck", path: "modules/theatre/app/graphics/bubbles/awe-struck.png"},
			{name: "kiss", path: "modules/theatre/app/graphics/bubbles/kiss.png"},
			{name: "blushing", path: "modules/theatre/app/graphics/bubbles/blushing.png"},
			{name: "cry", path: "modules/theatre/app/graphics/bubbles/cry.png"},
			{name: "dissatisfied", path: "modules/theatre/app/graphics/bubbles/dissatisfied.png"},
			{name: "dizzy", path: "modules/theatre/app/graphics/bubbles/dizzy.png"},
			{name: "evil", path: "modules/theatre/app/graphics/bubbles/evil.png"},
			{name: "frown", path: "modules/theatre/app/graphics/bubbles/frown.png"},
			{name: "happy", path: "modules/theatre/app/graphics/bubbles/happy.png"},
			{name: "grin", path: "modules/theatre/app/graphics/bubbles/grin.png"},
			{name: "happytears", path: "modules/theatre/app/graphics/bubbles/happytears.png"},
			{name: "laughing", path: "modules/theatre/app/graphics/bubbles/laughing.png"},
			{name: "laughingsquint", path: "modules/theatre/app/graphics/bubbles/laughingsquint.png"},
			{name: "meh", path: "modules/theatre/app/graphics/bubbles/meh.png"},
			{name: "worried", path: "modules/theatre/app/graphics/bubbles/worried.png"},
			{name: "panic", path: "modules/theatre/app/graphics/bubbles/panic.png"},
			{name: "rofl", path: "modules/theatre/app/graphics/bubbles/rofl.png"},
			{name: "sad", path: "modules/theatre/app/graphics/bubbles/sad.png"},
			{name: "scared", path: "modules/theatre/app/graphics/bubbles/scared.png"},
			{name: "smile", path: "modules/theatre/app/graphics/bubbles/smile.png"},
			{name: "playful", path: "modules/theatre/app/graphics/bubbles/playful.png"},
			{name: "smug", path: "modules/theatre/app/graphics/bubbles/smug.png"},
			{name: "tongue", path: "modules/theatre/app/graphics/bubbles/tongue.png"},
			{name: "wink", path: "modules/theatre/app/graphics/bubbles/wink.png"},
			{name: "speechless", path: "modules/theatre/app/graphics/bubbles/speechless.png"},
			{name: "thinking", path: "modules/theatre/app/graphics/bubbles/thinking.png"},
			{name: "idea", path: "modules/theatre/app/graphics/bubbles/idea.png"},
			{name: "serious", path: "modules/theatre/app/graphics/bubbles/serious.png"},
			{name: "innocent", path: "modules/theatre/app/graphics/bubbles/innocent.png"},
			{name: "carefree", path: "modules/theatre/app/graphics/bubbles/carefree.png"},

			// effects
			{name: "swirl", path: "modules/theatre/app/graphics/effects/swirl.png"},
			{name: "sweatdrop", path: "modules/theatre/app/graphics/effects/sweatdrop.png"},
			{name: "notice", path: "modules/theatre/app/graphics/effects/notice.png"},
			{name: "loud", path: "modules/theatre/app/graphics/effects/loud.png"},
			{name: "semiloud", path: "modules/theatre/app/graphics/effects/semi-loud.png"},
			{name: "veins", path: "modules/theatre/app/graphics/effects/veins.png"},
			{name: "veins_red", path: "modules/theatre/app/graphics/effects/veins_red.png"},
			{name: "twisty", path: "modules/theatre/app/graphics/effects/twisty.png"},
			{name: "glimmer", path: "modules/theatre/app/graphics/effects/glimmer.png"},
			{name: "heart", path: "modules/theatre/app/graphics/effects/heart.png"},
			{name: "puff", path: "modules/theatre/app/graphics/effects/puff.png"},
			{name: "line", path: "modules/theatre/app/graphics/effects/line.png"},
			{name: "linesteep", path: "modules/theatre/app/graphics/effects/line_steep.png"},
			{name: "star", path: "modules/theatre/app/graphics/effects/star.png"},
			{name: "musicnote", path: "modules/theatre/app/graphics/effects/musicnote.png"},
			//{name: "ghostball", path: "modules/theatre/app/graphics/effects/ghostball.png"},
			{name: "ghostball1", path: "modules/theatre/app/graphics/effects/ghostball1.png"},
			{name: "ghostball2", path: "modules/theatre/app/graphics/effects/ghostball2.png"},
			{name: "scribbleball", path: "modules/theatre/app/graphics/effects/scribbleball.png"},
			{name: "thoughtbubble", path: "modules/theatre/app/graphics/effects/thoughtbubble.png"},
			{name: "bubbledot", path: "modules/theatre/app/graphics/effects/bubbledot.png"},
			{name: "dot", path: "modules/theatre/app/graphics/effects/dot.png"},
			{name: "ziggy", path: "modules/theatre/app/graphics/effects/ziggy.png"},
			{name: "sinking", path: "modules/theatre/app/graphics/effects/sinking.png"},
			{name: "zzz", path: "modules/theatre/app/graphics/effects/zzz.png"},
			{name: "lightbulb", path: "modules/theatre/app/graphics/effects/lightbulb.png"},
			{name: "sigh", path: "modules/theatre/app/graphics/effects/sigh.png"},
			{name: "halo", path: "modules/theatre/app/graphics/effects/halo.png"},
			{name: "blush", path: "modules/theatre/app/graphics/effects/blush.png"},
			{name: "miasma", path: "modules/theatre/app/graphics/effects/miasma.png"},
			{name: "darkness", path: "modules/theatre/app/graphics/effects/darkness.png"},
			{name: "tears", path: "modules/theatre/app/graphics/effects/tears.png"}
		]; 
	}


	/**
	 * Get default emotes, immutable
	 *
	 * @return (Object) : An Object, whose properties are the default set
	 *                     emotes. 
	 */
	static getDefaultEmotes() {
		return {
			"smile": {
				name: "smile",
				fatype:"far",
				faname:"fa-smile",
				label:game.i18n.localize("Theatre.Emote.Smile"),
				rigging: {
					animations: [
						{name: "smile", syntax:"smile|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"}
					]
				}
			},
			"grin": {
				name: "grin",
				fatype:"far",
				faname:"fa-grin",
				label:game.i18n.localize("Theatre.Emote.Grin"),
				rigging: {
					animations: [
						{name: "grin", syntax:"grin|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"}
					]
				}
			},
			"happy": {
				name: "happy",
				fatype:"far",
				faname:"fa-smile-beam",
				label:game.i18n.localize("Theatre.Emote.Happy"),
				rigging: {
					animations: [
						{name: "happy", syntax:"happy|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "line_a", syntax:"line|0.5;(ease:bounce);x:45%,40%;y:5%,0%;rotation:-20,-20"},
						{name: "line_b", syntax:"line|0.5;(ease:bounce);x:35%,25%;y:15%,12%;rotation:-65,-65"},
						{name: "line_c", syntax:"line|0.5;(ease:bounce);x:55%,60%;y:5%,0%;rotation:20,20"},
						{name: "line_d", syntax:"line|0.5;(ease:bounce);x:65%,75%;y:15%,12%;rotation:65,65"}
					]
				}
			},
			"happytears": {
				name: "happytears",
				fatype:"far",
				faname:"fa-grin-tears",
				label:game.i18n.localize("Theatre.Emote.HappyTears"),
				rigging: {
					animations: [
						{name: "happytears", syntax:"happytears|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "line_a", syntax:"line|0.5;(ease:bounce);x:40%,35%;y:5%,0%;rotation:-20,-20|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5"},
						{name: "line_b", syntax:"line|0.5;(ease:bounce);x:30%,20%;y:15%,12%;rotation:-65,-65|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5"},
						{name: "line_c", syntax:"line|0.5;(ease:bounce);x:60%,65%;y:5%,0%;rotation:20,20|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5"},
						{name: "line_d", syntax:"line|0.5;(ease:bounce);x:70%,80%;y:15%,12%;rotation:65,65|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5"},
						{name: "tears_a", syntax:"tears|0.5;(repeat:-1,repeatDelay:1.7);x:60%,110%;y:25%,40%;rotation:-30,-30;alpha:0.5,0|0;scaleX:-1,-1"},
						{name: "tears_b", syntax:"tears|0.5;(repeat:-1,repeatDelay:0.8);x:40%,-10%;y:25%,40%;rotation:30,30;alpha:0.5,0"}
					]
				}
			},
			"dissatisfied": {
				name: "dissatisfied",
				fatype:"far",
				faname:"fa-frown-open",
				label:game.i18n.localize("Theatre.Emote.Dissatisfied"),
				rigging: {
					animations: [
						{name: "dissatisfied", syntax:"dissatisfied|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"}
					]
				}
			},
			"frown": {
				name: "frown",
				fatype:"far",
				faname:"fa-frown",
				label:game.i18n.localize("Theatre.Emote.Frown"),
				rigging: {
					animations: [
						{name: "frown", syntax:"frown|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "sinking", syntax:"sinking|0.5;(ease:power2);x:50%,50%;y:-20%,15%;alpha:0,0.5"}
					]
				}
			},
			"sad": {
				name: "sad",
				fatype:"far",
				faname:"fa-sad-tear",
				label:game.i18n.localize("Theatre.Emote.Sad"),
				rigging: {
					animations: [
						{name: "sad", syntax:"sad|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "swirl_a", syntax:"swirl|0.5;(ease:power4);x:110%,75%;y:0%,10%;alpha:0,1|1;(repeat:-1);rotation:0,360"},
						{name: "swirl_b", syntax:"swirl|0.5;(ease:power4);x:110%,65%;y:0%,40%;alpha:0,1|1;(repeat:-1);rotation:0,360"},
						{name: "swirl_c", syntax:"swirl|0.5;(ease:power4);x:110%,90%;y:110%,50%;alpha:0,1|1;(repeat:-1);rotation:0,360"},
						{name: "swirl_d", syntax:"swirl|0.5;(ease:power4);x:110%,85%;y:110%,70%;alpha:0,1|1;(repeat:-1);rotation:0,360"},
						{name: "swirl_e", syntax:"swirl|0.5;(ease:power4);x:-10%,25%;y:0%,15%;alpha:0,1|1;(repeat:-1);rotation:0,360"},
						{name: "swirl_f", syntax:"swirl|0.5;(ease:power4);x:-10%,15%;y:0%,38%;alpha:0,1|1;(repeat:-1);rotation:0,360"},
						{name: "swirl_g", syntax:"swirl|0.5;(ease:power4);x:-10%,20%;y:110%,55%;alpha:0,1|1;(repeat:-1);rotation:0,360"},
						{name: "swirl_h", syntax:"swirl|0.5;(ease:power4);x:-10%,35%;y:110%,67%;alpha:0,1|1;(repeat:-1);rotation:0,360"},
						{name: "swirl_i", syntax:"swirl|0.5;(ease:power4);x:-10%,10%;y:110%,85%;alpha:0,1|1;(repeat:-1);rotation:0,360"},
						{name: "swirl_j", syntax:"swirl|0.5;(ease:power4);x:-10%,45%;y:110%,95%;alpha:0,1|1;(repeat:-1);rotation:0,360"},
						{name: "swirl_k", syntax:"swirl|0.5;(ease:power4);x:110%,95%;y:110%,90%;alpha:0,1|1;(repeat:-1);rotation:0,360"},
						{name: "swirl_l", syntax:"swirl|0.5;(ease:power4);x:110%,70%;y:110%,82%;alpha:0,1|1;(repeat:-1);rotation:0,360"}

					]
				}
			},
			"cry": {
				name: "cry",
				fatype:"far",
				faname:"fa-sad-cry",
				label:game.i18n.localize("Theatre.Emote.Cry"),
				rigging: {
					animations: [
						{name: "cry", syntax:"cry|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "tears_a", syntax:"tears|0.5;(repeat:-1,repeatDelay:0.7);x:60%,110%;y:25%,40%;rotation:-30,-30;alpha:0.5,0|0;scaleX:-1,-1"},
						{name: "tears_b", syntax:"tears|0.5;(repeat:-1,repeatDelay:0.3);x:40%,-10%;y:25%,40%;rotation:30,30;alpha:0.5,0"},
						{name: "tears_c", syntax:"tears|0.5;(repeat:-1,repeatDelay:0.8);x:60%,90%;y:25%,50%;rotation:-10,-10;alpha:0.5,0|0;scaleX:-1,-1"},
						{name: "tears_d", syntax:"tears|0.5;(repeat:-1,repeatDelay:1.0);x:40%,10%;y:25%,50%;rotation:10,10;alpha:0.5,0"},
						{name: "tears_e", syntax:"tears|0.5;(repeat:-1,repeatDelay:0.2);x:60%,90%;y:25%,30%;rotation:-50,-50;alpha:0.5,0|0;scaleX:-1,-1"},
						{name: "tears_f", syntax:"tears|0.5;(repeat:-1,repeatDelay:1.2);x:40%,10%;y:25%,30%;rotation:50,50;alpha:0.5,0"}

					]
				}
			},
			"serious": {
				name: "serious",
				fatype:"far",
				faname:"fa-meh-rolling-eyes",
				image: "modules/theatre/app/graphics/emotes/serious.png",
				label:game.i18n.localize("Theatre.Emote.Serious"),
				rigging: {
					animations: [
						{name: "serious", syntax:"serious|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"}
					]
				}
			},
			"annoyed": {
				name: "annoyed",
				fatype:"far",
				faname:"fa-meh-rolling-eyes",
				label:game.i18n.localize("Theatre.Emote.Annoyed"),
				rigging: {
					animations: [
						{name: "annoyed", syntax:"annoyed|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "ziggy", syntax:"ziggy|0;x:25%,25%;y:20%,20%|0.25;(repeat:-1,yoyo:true);rotation:-2,2"},
						{name: "ziggy_2", syntax:"ziggy|1;(repeat:-1,delay:1,repeatDelay:2);scaleX:1,2;scaleY:1,2;x:25%,25%;y:20%,20%;alpha:0.5,0|0.25;(repeat:-1,yoyo:true);rotation:0,5"}
					]
				}
			},
			"frustrated": {
				name: "frustrated",
				fatype:"far",
				faname:"fa-meh-rolling-eyes",
				image: "modules/theatre/app/graphics/emotes/frustrated.png",
				label:game.i18n.localize("Theatre.Emote.Frustrated"),
				rigging: {
					animations: [
						{name: "frustrated", syntax:"frustrated|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "veins", syntax:"veins|0.5;x:45%,45%;y:10%,10%;alpha:0,1|1;(repeat:-1,yoyo:true,ease:bounce);scaleX:0.7,1;scaleY:0.7,1"}
					]
				}
			},
			"angry": {
				name: "angry",
				fatype:"far",
				faname:"fa-angry",
				label:game.i18n.localize("Theatre.Emote.Angry"),
				rigging: {
					animations: [
						{name: "angry", syntax:"angry|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "veins", syntax:"veins_red|0.5;x:45%,45%;y:10%,10%;alpha:0,1|1;(repeat:-1,yoyo:true,ease:elastic);scaleX:0.5,1;scaleY:0.5,1|0.25;(repeat:-1,yoyo:true);rotation:0,10"},
						{name: "puff_a", syntax:"puff|0;x:80%,80%;y:15%,15%;rotation:0,0|1;(repeat:-1,delay:1,yoyo:true,ease:power4);scaleX:0.3,1;scaleY:0.3,1;alpha:0,0.5"},
						{name: "puff_b", syntax:"puff|0;x:20%,20%;y:15%,15%;rotation:0,0|1;(repeat:-1,delay:1.5,yoyo:true,ease:power4);scaleX:-0.3,-1;scaleY:0.3,1;alpha:0,0.5"},
						{name: "puff_c", syntax:"puff|0;x:70%,70%;y:5%,5%;rotation:330,330|1;(repeat:-1,delay:2,yoyo:true,ease:power4);scaleX:0.3,1;scaleY:0.3,1;alpha:0,0.5"},
						{name: "puff_d", syntax:"puff|0;x:30%,30%;y:5%,5%;rotation:30,30|1;(repeat:-1,delay:2.5,yoyo:true,ease:power4);scaleX:-0.3,-1;scaleY:0.3,1;alpha:0,0.5"}
					]
				}
			},
			"laughing": {
				name: "laughing",
				fatype:"far",
				faname:"fa-laugh-beam",
				label:game.i18n.localize("Theatre.Emote.Laughing"),
				rigging: {
					animations: [
						{name: "laughing", syntax:"laughing|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "semiloud", syntax:"semiloud|0.5;x:25%,25%;y:20%,20%;alpha:0,1|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1|0.25;(repeat:-1,yoyo:true);rotation:-1,1"}
					]
				}
			},
			"laughingsquint": {
				name: "laughingsquint",
				fatype:"far",
				faname:"fa-laugh-squint",
				label:game.i18n.localize("Theatre.Emote.LaughingSquint"),
				rigging: {
					animations: [
						{name: "laughingsquint", syntax:"laughingsquint|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "loud", syntax:"loud|0.5;x:25%,25%;y:20%,20%;alpha:0,1|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1|0.125;(repeat:-1,yoyo:true);rotation:-1,1"}
					]
				}
			},
			"rofl": {
				name: "rofl",
				fatype:"far",
				faname:"fa-grin-squint-tears",
				label:game.i18n.localize("Theatre.Emote.ROFL"),
				rigging: {
					animations: [
						{name: "rofl", syntax:"rofl|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "loud_a", syntax:"loud|0.5;(ease:bounce);x:20%,20%;y:20%,20%;scaleX:0.1,1;scaleY:0.1,1|0.125;(repeat:-1,yoyo:true);rotation:-2,2"},
						{name: "loud_b", syntax:"loud|0.5;(ease:bounce);x:80%,80%;y:20%,20%;scaleX:-0.1,-1;scaleY:0.1,1|0.125;(repeat:-1,yoyo:true);rotation:-2,2"},
						{name: "loud_c", syntax:"loud|0;x:20%,20%;y:20%,20%|0.125;(repeat:-1,yoyo:true);rotation:-2,2|1;(repeat:-1);scaleX:1,1.5;scaleY:1,2;alpha:0.25,0"},
						{name: "loud_d", syntax:"loud|0;x:80%,80%;y:20%,20%|0.125;(repeat:-1,yoyo:true);rotation:-2,2|1;(repeat:-1);scaleX:-1,-1.5;scaleY:1,2;alpha:0.25,0"},
						{name: "tears_a", syntax:"tears|0.5;(repeat:-1,repeatDelay:1.7);x:60%,110%;y:25%,40%;rotation:-30,-30;alpha:0.5,0|0;scaleX:-1,-1"},
						{name: "tears_b", syntax:"tears|0.5;(repeat:-1,repeatDelay:0.8);x:40%,-10%;y:25%,40%;rotation:30,30;alpha:0.5,0"}
					]
				}
			},
			"worried": {
				name: "worried",
				fatype:"far",
				faname:"fa-grin-beam-sweat",
				label:game.i18n.localize("Theatre.Emote.Worried"),
				rigging: {
					animations: [
						{name: "worried", syntax:"worried|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "sweatdrop", syntax:"sweatdrop|2;(ease:bounce);x:30%,30%;y:0%,25%;alpha:0,1"}
					]
				}
			},
			"surprised": {
				name: "surprised",
				fatype:"far",
				faname:"fa-surprise",
				label:game.i18n.localize("Theatre.Emote.Surprised"),
				rigging: {
					animations: [
						{name: "surprised", syntax:"surprised|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "notice", syntax:"notice|0.5;x:25%,25%;y:20%,20%;alpha:0,1|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1"}
					]
				}
			},
			"awe-struck": {
				name: "awe-struck",
				fatype:"far",
				faname:"fa-grin-stars",
				label:game.i18n.localize("Theatre.Emote.Awe-Struck"),
				rigging: {
					animations: [
						{name: "awe-struck", syntax:"awe-struck|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "glimmer_a", syntax:"glimmer|0.5;x:10%,10%;y:58%,58%|0.5;(delay:0.2,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"},
						{name: "glimmer_b", syntax:"glimmer|0.5;x:85%,85%;y:20%,20%|0.5;(delay:0.3,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"},
						{name: "glimmer_c", syntax:"glimmer|0.5;x:40%,40%;y:45%,45%|0.5;(delay:0.5,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"},
						{name: "glimmer_d", syntax:"glimmer|0.5;x:35%,35%;y:30%,30%|0.5;(delay:0.6,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"},
						{name: "glimmer_e", syntax:"glimmer|0.5;x:65%,65%;y:35%,35%|0.5;(delay:0.4,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"},
						{name: "glimmer_f", syntax:"glimmer|0.5;x:80%,80%;y:50%,50%|0.5;(delay:0.1,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"},
						{name: "glimmer_g", syntax:"glimmer|0.5;x:16%,16%;y:81%,81%|0.5;(delay:0.8,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"},
						{name: "glimmer_h", syntax:"glimmer|0.5;x:55%,55%;y:64%,64%|0.5;(delay:0.9,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"},
						{name: "glimmer_i", syntax:"glimmer|0.5;x:44%,44%;y:95%,95%|0.5;(delay:0.7,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"},
						{name: "glimmer_j", syntax:"glimmer|0.5;x:67%,67%;y:84%,84%|0.5;(delay:0.35,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"},
						{name: "glimmer_k", syntax:"glimmer|0.5;x:44%,44%;y:70%,70%|0.5;(delay:0,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"},
						{name: "glimmer_l", syntax:"glimmer|0.5;x:20%,20%;y:23%,23%|0.5;(delay:0.65,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"}
					]
				}
			},
			"blushing": {
				name: "blushing",
				fatype:"far",
				faname:"fa-flushed",
				label:game.i18n.localize("Theatre.Emote.Blushing"),
				rigging: {
					animations: [
						{name: "blushing", syntax:"blushing|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "blush", syntax:"blush|0.5;x:25%,25%;y:25%,25%|2;(ease:sineInOut,repeat:-1,yoyo:true);scaleX:0.9,1;scaleY:0.9,1;alpha:0.5,1|0.5;(repeat:-1,yoyo:true);rotation:-3,3"}
					]
				}
			},
			"hearts": {
				name: "hearts",
				fatype:"far",
				faname:"fa-grin-hearts",
				label:game.i18n.localize("Theatre.Emote.Hearts"),
				rigging: {
					animations: [
						{name: "hearts", syntax:"hearts|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "heart_a", syntax:"heart|2;(repeat:-1,delay:1.3);y:110%,-10%;alpha:1,0|0.5;(delay:0.1,repeat:-1,yoyo:true);x:5%,10%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"},
						{name: "heart_b", syntax:"heart|2;(repeat:-1,delay:0.3);y:110%,-10%;alpha:1,0|0.5;(delay:0.9,repeat:-1,yoyo:true);x:5%,10%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"},
						{name: "heart_c", syntax:"heart|2;(repeat:-1,delay:0.8);y:110%,-10%;alpha:1,0|0.5;(delay:0.2,repeat:-1,yoyo:true);x:15%,20%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"},
						{name: "heart_d", syntax:"heart|2;(repeat:-1,delay:0.5);y:110%,-10%;alpha:1,0|0.5;(delay:0.8,repeat:-1,yoyo:true);x:25%,30%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"},
						{name: "heart_e", syntax:"heart|2;(repeat:-1,delay:1.7);y:110%,-10%;alpha:1,0|0.5;(delay:0.3,repeat:-1,yoyo:true);x:35%,40%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"},
						{name: "heart_f", syntax:"heart|2;(repeat:-1,delay:2);y:110%,-10%;alpha:1,0|0.5;(delay:0.7,repeat:-1,yoyo:true);x:45%,50%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"},
						{name: "heart_g", syntax:"heart|2;(repeat:-1,delay:1.5);y:110%,-10%;alpha:1,0|0.5;(delay:0.4,repeat:-1,yoyo:true);x:55%,60%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"},
						{name: "heart_h", syntax:"heart|2;(repeat:-1,delay:0.7);y:110%,-10%;alpha:1,0|0.5;(delay:0.6,repeat:-1,yoyo:true);x:65%,70%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"},
						{name: "heart_i", syntax:"heart|2;(repeat:-1,delay:1.7);y:110%,-10%;alpha:1,0|0.5;(delay:0.5,repeat:-1,yoyo:true);x:75%,80%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"},
						{name: "heart_j", syntax:"heart|2;(repeat:-1,delay:0.4);y:110%,-10%;alpha:1,0|0.5;(delay:0.35,repeat:-1,yoyo:true);x:85%,90%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"},
						{name: "heart_k", syntax:"heart|2;(repeat:-1,delay:2.3);y:110%,-10%;alpha:1,0|0.5;(delay:0.25,repeat:-1,yoyo:true);x:95%,100%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"}

					]
				}
			},
			"kiss": {
				name: "kiss",
				fatype:"far",
				faname:"fa-kiss-wink-heart",
				label:game.i18n.localize("Theatre.Emote.Kiss"),
				rigging: {
					animations: [
						{name: "kiss", syntax:"kiss|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "blowkiss", syntax:"heart|4;(ease:expo);x:45%,-10%;alpha:1,0|0.25;(repeat:6,yoyo:true);y:25%,30%|0.25;(repeat:6,yoyo:true,ease:power4);scaleX:0.8,1.5;scaleY:0.8,1.5"}
					]
				}
			},
			"thinking": {
				name: "thinking",
				fatype:"far",
				faname:"fa-blank",
				image: "modules/theatre/app/graphics/emotes/thinking.png",
				label:game.i18n.localize("Theatre.Emote.Thinking"),
				rigging: {
					animations: [
						{name: "thinking", syntax:"thinking|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "thoughtbubble", syntax:"thoughtbubble|0.5;(ease:power3);x:25%,25%;y:10%,10%;alpha:0,1|0.5;(repeat:-1,yoyo:true);scaleX:0.95,1;scaleY:0.95,1"},
						{name: "bubbledot_a", syntax:"bubbledot|0.5;(ease:power3);x:28%,28%;y:18%,18%;alpha:0,1|1;(repeat:-1,yoyo:true,repeatDelay:0.3);scaleX:0.5,1;scaleY:0.5,1|5;(repeat:-1);rotation:0,360"},
						{name: "bubbledot_b", syntax:"bubbledot|0.5;(ease:power3);x:31%,31%;y:21%,21%;alpha:0,1|1;(repeat:-1,yoyo:true,repeatDelay:0.1);scaleX:0.5,1;scaleY:0.5,1|5;(repeat:-1);rotation:0,360"},
						{name: "bubbledot_c", syntax:"bubbledot|0.5;(ease:power3);x:34%,34%;y:24%,24%;alpha:0,1|1;(repeat:-1,yoyo:true,repeatDelay:0.5);scaleX:0.5,1;scaleY:0.5,1|5;(repeat:-1);rotation:0,360"},
					]
				}
			},
			"confused": {
				name: "confused",
				fatype:"far",
				faname:"fa-question-circle",
				image: "modules/theatre/app/graphics/emotes/confused.png",
				label:game.i18n.localize("Theatre.Emote.Confused"),
				rigging: {
					animations: [
						{name: "confused", syntax:"confused|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "scribbleball", syntax:"scribbleball|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:45%,45%;y:0%,0%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:0,5"}
					]
				}
			},
			"idea": {
				name: "idea",
				fatype:"far",
				faname:"fa-lightbulb",
				image: "modules/theatre/app/graphics/emotes/idea.png",
				label:game.i18n.localize("Theatre.Emote.Idea"),
				rigging: {
					animations: [
						{name: "idea", syntax:"idea|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "lightbulb", syntax:"lightbulb|0.5;(ease:bounce);x:50%,50%;y:-10%,-10%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:0,5|1;(repeat:-1,yoyo:true);scaleX:1,1.3;scaleY:1,1.3"}
					]
				}
			},
			"meh": {
				name: "meh",
				fatype:"far",
				faname:"fa-meh",
				label:game.i18n.localize("Theatre.Emote.Meh"),
				rigging: {
					animations: [
						{name: "meh", syntax:"meh|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "sigh", syntax:"sigh|3;(ease:power2);x:30%,10%;y:25%,45%;alpha:1,0;rotation:225,225;scaleX:1,1.5;scaleY:1,1.5"}
					]
				}
			},
			"smug": {
				name: "smug",
				fatype:"far",
				faname:"fa-grin-tongue-wink",
				image: "modules/theatre/app/graphics/emotes/smug.png",
				label:game.i18n.localize("Theatre.Emote.Smug"),
				rigging: {
					animations: [
						{name: "smug", syntax:"smug|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"}
					]
				}
			},
			"wink": {
				name: "wink",
				fatype:"far",
				faname:"fa-grin-wink",
				label:game.i18n.localize("Theatre.Emote.Wink"),
				rigging: {
					animations: [
						{name: "wink", syntax:"wink|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "kawaii_a", syntax:"star|4;(ease:expo);x:45%,-10%;y:25%,25%;alpha:1,0|2;(repeat:4);rotation:0,360"},
						{name: "kawaii_b", syntax:"star|3;(ease:expo);x:45%,10%;y:25%,12%;alpha:1,0|2;(repeat:4);rotation:0,360"},
						{name: "kawaii_c", syntax:"star|3;(ease:expo);x:45%,10%;y:25%,38%;alpha:1,0|2;(repeat:4);rotation:0,360"}
					]
				}
			},
			"tongue": {
				name: "tongue",
				fatype:"far",
				faname:"fa-grin-tongue",
				label:game.i18n.localize("Theatre.Emote.Tongue"),
				rigging: {
					animations: [
						{name: "tongue", syntax:"tongue|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "kawaii", syntax:"star|4;(ease:expo,delay:2);x:30%,30%;y:25%,25%;alpha:1,0;scaleX:1.3,0.1;scaleY:1.3,0.1|2;(repeat:4);rotation:0,360"}
					]
				}
			},
			"playful": {
				name: "playful",
				fatype:"far",
				faname:"fa-grin-tongue-wink",
				label:game.i18n.localize("Theatre.Emote.Playful"),
				rigging: {
					animations: [
						{name: "playful", syntax:"playful|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "kawaii_a", syntax:"star|3;(ease:expo);x:40%,-10%;y:25%,-15%;alpha:1,0|2;(repeat:4);rotation:0,360"},
						{name: "kawaii_b", syntax:"star|4;(ease:expo);x:40%,-40%;y:25%,30%;alpha:1,0|2;(repeat:4);rotation:0,360"},
						{name: "kawaii_c", syntax:"star|3;(ease:expo);x:40%,-10%;y:25%,55%;alpha:1,0|2;(repeat:4);rotation:0,360"},
						{name: "kawaii_d", syntax:"star|3;(ease:expo);x:60%,110%;y:25%,-15%;alpha:1,0|2;(repeat:4);rotation:0,360"},
						{name: "kawaii_e", syntax:"star|4;(ease:expo);x:60%,140%;y:25%,30%;alpha:1,0|2;(repeat:4);rotation:0,360"},
						{name: "kawaii_f", syntax:"star|3;(ease:expo);x:60%,110%;y:25%,55%;alpha:1,0|2;(repeat:4);rotation:0,360"},
						{name: "kawaii_g", syntax:"star|4;(ease:expo);x:50%,50%;y:15%,-35%;alpha:1,0|2;(repeat:4);rotation:0,360"},
						{name: "kawaii_h", syntax:"star|4;(ease:expo);x:50%,50%;y:35%,85%;alpha:1,0|2;(repeat:4);rotation:0,360"}
					]
				}
			},
			"mischevious": {
				name: "mischevious",
				fatype:"fas",
				faname:"fa-book-dead",
				image: "modules/theatre/app/graphics/emotes/evil.png",
				label:game.i18n.localize("Theatre.Emote.Mischevious"),
				rigging: {
					animations: [
						{name: "evil", syntax:"evil|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "shroud", syntax:"darkness|0;x:50%,50%;y:50%,50%"},
						{name: "miasma_a", syntax:"miasma|0;x:25%,25%;y:78%,78%|3;(repeat:-1,delay:0.3);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_b", syntax:"miasma|0;x:73%,73%;y:68%,68%|3;(repeat:-1,delay:1.3);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_c", syntax:"miasma|0;x:15%,15%;y:60%,60%|3;(repeat:-1,delay:0.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_d", syntax:"miasma|0;x:45%,45%;y:85%,85%|3;(repeat:-1,delay:2.6);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_e", syntax:"miasma|0;x:90%,90%;y:80%,80%|3;(repeat:-1,delay:3.5);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_f", syntax:"miasma|0;x:55%,55%;y:60%,60%|3;(repeat:-1,delay:2.1);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_g", syntax:"miasma|0;x:10%,10%;y:90%,90%|3;(repeat:-1,delay:3.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_h", syntax:"miasma|0;x:95%,95%;y:70%,70%|3;(repeat:-1,delay:1.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_i", syntax:"miasma|0;x:50%,50%;y:72%,72%|3;(repeat:-1,delay:5.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_j", syntax:"miasma|0;x:10%,10%;y:66%,66%|3;(repeat:-1,delay:3.6);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_k", syntax:"miasma|0;x:3%,3%;y:88%,88%|3;(repeat:-1,delay:2.2);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_l", syntax:"miasma|0;x:78%,78%;y:75%,75%|3;(repeat:-1,delay:1.7);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_m", syntax:"miasma|0;x:65%,65%;y:98%,98%|3;(repeat:-1,delay:.7);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_n", syntax:"miasma|0;x:33%,33%;y:78%,78%|3;(repeat:-1,delay:4.4);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"},
						{name: "miasma_o", syntax:"miasma|0;x:80%,80%;y:92%,92%|3;(repeat:-1,delay:5.2);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"}
					]
				}
			},
			"innocent": {
				name: "innocent",
				fatype:"fas",
				faname:"fa-book-dead",
				image: "modules/theatre/app/graphics/emotes/innocent.png",
				label:game.i18n.localize("Theatre.Emote.Innocent"),
				rigging: {
					animations: [
						{name: "innocent", syntax:"innocent|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "halo", syntax:"halo|2;(ease:power2);x:50%,50%;alpha:0,1|2;(ease:sine,repeat:-1,yoyo:true,yoyoEase:sine);y:-3%,-5%"}
					]
				}
			},
			"carefree": {
				name: "carefree",
				fatype:"fas",
				faname:"fa-book-dead",
				image: "modules/theatre/app/graphics/emotes/carefree.png",
				label:game.i18n.localize("Theatre.Emote.CareFree"),
				rigging: {
					animations: [
						{name: "carefree", syntax:"carefree|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "musicnote_a", syntax:"musicnote|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:10%,10%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-10,10|1;(ease:sine,yoyo:true,yoyoEase:sine,repeat:-1);y:20%,30%"},
						{name: "musicnote_b", syntax:"musicnote|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:20%,20%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-10,10|1;(ease:sine,yoyo:true,yoyoEase:sine,repeat:-1,delay:0.25);y:15%,25%"},
						{name: "musicnote_c", syntax:"musicnote|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:30%,30%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-10,10|1;(ease:sine,yoyo:true,yoyoEase:sine,repeat:-1,delay:0.5);y:20%,30%"}
					]
				}
			},
			"panic": {
				name: "panic",
				fatype:"far",
				faname:"fa-tired",
				label:game.i18n.localize("Theatre.Emote.Panic"),
				rigging: {
					animations: [
						{name: "panic", syntax:"panic|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "line_a", syntax:"linesteep|0;x:50%,50%;y:-10%,-10%|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"},

						{name: "line_b", syntax:"linesteep|0;x:35%,35%;y:-5%,-5%;rotation:-22.5,-22.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"},
						{name: "line_c", syntax:"linesteep|0;x:15%,15%;y:5%,5%;rotation:-45,-45|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"},
						{name: "line_d", syntax:"linesteep|0;x:0%,0%;y:20%,20%;rotation:-67.5,-67.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"},
						{name: "line_e", syntax:"linesteep|0;x:-10%,-10%;y:30%,30%;rotation:-90,-90|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"},

						{name: "line_f", syntax:"linesteep|0;x:65%,65%;y:-5%,-5%;rotation:22.5,22.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"},
						{name: "line_g", syntax:"linesteep|0;x:85%,85%;y:5%,5%;rotation:45,45|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"},
						{name: "line_h", syntax:"linesteep|0;x:100%,100%;y:20%,20%;rotation:67.5,67.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"},
						{name: "line_i", syntax:"linesteep|0;x:110%,110%;y:30%,30%;rotation:90,90|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"}
					]
				}
			},
			"dizzy": {
				name: "dizzy",
				fatype:"far",
				faname:"fa-dizzy",
				label:game.i18n.localize("Theatre.Emote.Dizzy"),
				rigging: {
					animations: [
						{name: "dizzy", syntax:"dizzy|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "stars_a", syntax:"star|2;(ease:sineInOut,repeat:-1,yoyo:true);x:10%,90%;y:35%,5%|1;(repeatDelay:1,repeat:-1,yoyo:true);scaleX:0.2,1;scaleY:0.2,1;alpha:0.2,1|2;(repeat:-1);rotation:0,360"},
						{name: "stars_b", syntax:"star|2;(ease:sineInOut,repeat:-1,yoyo:true);x:90%,10%;y:5%,35%|1;(repeatDelay:1,repeat:-1,yoyo:true);scaleX:1,0.2;scaleY:1,0.2;alpha:1,0.2|2;(repeat:-1);rotation:0,360"},
						{name: "stars_c", syntax:"star|2;(ease:sineInOut,repeat:-1,yoyo:true,delay:1);x:10%,90%;y:5%,35%|1;(repeatDelay:1,delay:1,repeat:-1,yoyo:true);scaleX:0.2,1;scaleY:0.2,1;alpha:0.2,1|2;(repeat:-1);rotation:0,360"},
						{name: "stars_d", syntax:"star|2;(ease:sineInOut,repeat:-1,yoyo:true,delay:1);x:90%,10%;y:35%,5%|1;(repeatDelay:1,delay:1,repeat:-1,yoyo:true);scaleX:1,0.2;scaleY:1,0.2;alpha:1,0.2|2;(repeat:-1);rotation:0,360"}
					]
				}
			},
			"speechless": {
				name: "speechless",
				fatype:"far",
				faname:"fa-comment-dots",
				image: "modules/theatre/app/graphics/emotes/speechless.png",
				label:game.i18n.localize("Theatre.Emote.Speechless"),
				rigging: {
					animations: [
						{name: "speechless", syntax:"speechless|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "dot_a", syntax:"dot|0.5;(ease:power3);x:30%,30%;y:25%,25%;alpha:0,1|1;(ease:bounce,repeat:-1,delay:0,repeatDelay:3,yoyo:true,yoyoEase:power0);scaleX:0.5,1;scaleY:0.5,1"},
						{name: "dot_b", syntax:"dot|0.5;(ease:power3);x:25%,25%;y:25%,25%;alpha:0,1|1;(ease:bounce,repeat:-1,delay:1,repeatDelay:3,yoyo:true,yoyoEase:power0);scaleX:0.5,1;scaleY:0.5,1"},
						{name: "dot_c", syntax:"dot|0.5;(ease:power3);x:20%,20%;y:25%,25%;alpha:0,1|1;(ease:bounce,repeat:-1,delay:2,repeatDelay:3,yoyo:true,yoyoEase:power0);scaleX:0.5,1;scaleY:0.5,1"}
					]
				}
			},
			"scared": {
				name: "scared",
				fatype:"far",
				faname:"fa-grimace",
				label:game.i18n.localize("Theatre.Emote.Scared"),
				rigging: {
					animations: [
						{name: "scared", syntax:"scared|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "ghostball_a", syntax:"ghostball1|0;x:70%,70%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.5);y:30%,35%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"},
						{name: "ghostball_b", syntax:"ghostball1|0;x:30%,30%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:1);y:10%,15%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"},
						{name: "ghostball_c", syntax:"ghostball1|0;x:20%,20%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.8);y:60%,65%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"},
						{name: "ghostball_d", syntax:"ghostball2|0;x:85%,85%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.4);y:75%,80%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"},
						{name: "ghostball_e", syntax:"ghostball2|0;x:10%,10%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:1.2);y:40%,45%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"},
						{name: "ghostball_f", syntax:"ghostball2|0;x:60%,60%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.6);y:80%,85%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"},
						{name: "ghostball_g", syntax:"ghostball1|0;x:90%,90%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:1.5);y:10%,15%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"},
						{name: "ghostball_h", syntax:"ghostball2|0;x:75%,75%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.9);y:50%,55%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"}
					]
				}
			},
			"sleeping": {
				name: "sleeping",
				fatype:"fas",
				faname:"fa-bed",
				image: "modules/theatre/app/graphics/emotes/sleeping.png",
				label:game.i18n.localize("Theatre.Emote.Sleeping"),
				rigging: {
					animations: [
						{name: "sleeping", syntax:"sleeping|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"},
						{name: "zzz_a", syntax:"zzz|4;(repeat:-1,delay:0);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:0,yoyo:true);x:30%,40%"},
						{name: "zzz_b", syntax:"zzz|4;(repeat:-1,delay:1);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:0.5,yoyo:true);x:30%,40%"},
						{name: "zzz_c", syntax:"zzz|4;(repeat:-1,delay:2);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:1,yoyo:true);x:30%,40%"},
						{name: "zzz_d", syntax:"zzz|4;(repeat:-1,delay:3);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:1.5,yoyo:true);x:30%,40%"}
					]
				}
			}
		}; 
	}

	/**
	 * Split to chars, logically group words based on language. 
	 *
	 * @param text (String) : The text to split.
	 * @param textBox (HTMLElement) : The textBox the text will be contained in. 
	 *
	 * @return (Array[HTMLElement]) : An array of HTMLElements of the split text.
	 */
	static splitTextBoxToChars(text,textBox) {
		let charSpans = []; 
		let fontSize = Number(KHelpers.style(textBox)["font-size"].match(/\-*\d+\.*\d*/) || 0); 
		let splitMode = 1; 

		// we have 2 modes, if we're a latin based language, or a language that does word
		// grouping of characters, we should attempt to preserve words by collecting
		// character spans into divs.
		// If we're a language that is symbol based, and don't care about word groupings
		// then we just out a stream of characters without regard to groupings. 
		//
		//
		switch (game.i18n.lang) {
			case "ja":
				// Kinsoku Shori (JP)
				splitMode = 3; 
				break; 
			case "cn":
				// 按照日文方式换行 (CN)
				splitMode = 3; 
				break; 
			case "ko":
				// KS X ISO/IEC 26300:2007 (KO) 
				splitMode = 4; 
				break; 
			case "zh":
			case "th":
				// word break with impunity
				splitMode = 1; 
				break; 
			default:
				// don't word break
				splitMode = 2; 
				break; 
		}

		if (splitMode == 1) {
			// split chars
			for (let c of text) {
				if (c == " ") {
					let cspan = document.createElement("span");
					cspan.textContent = c; 
					cspan.style.height = `${fontSize}px`; 
					cspan.style.width = `${fontSize/4}px`; 
					cspan.style.position = "relative"; 
					textBox.appendChild(cspan); 
					charSpans.push(cspan); 
				} else if (c == "\n") {
					let cspan = document.createElement("hr");
					textBox.appendChild(cspan); 
				} else {
					let cspan = document.createElement("span");
					cspan.textContent = c; 
					cspan.style.height = `${fontSize}px`; 
					cspan.style.position = "relative"; 
					textBox.appendChild(cspan); 
					charSpans.push(cspan); 
				}

				// relative positioning
			}
		} else if (splitMode == 2) {
			// split chars, group words
			let word = document.createElement("div"); 
			let prevChar = ""; 
			word.style.height = `${fontSize}px`; 
			word.style.position = "relative"; 

			for (let c of text) {
				if (c == " ") {
					let cspan = document.createElement("span");
					cspan.textContent = c; 
					cspan.style.height = `${fontSize}px`; 
					cspan.style.width = `${fontSize/4}px`; 
					// not part of an extended white space, append word, start new one
					if (prevChar != " " && prevChar != "\n") {
						textBox.appendChild(word); 
						word = document.createElement("div"); 
						word.style.height = `${fontSize}px`; 
						word.style.position = "relative"; 
					}
					textBox.appendChild(cspan); 
					cspan.style.position = "relative"; 
					charSpans.push(cspan); 
				} else if (c == "\n") {
					let cspan = document.createElement("hr");
					if (prevChar != " " && prevChar != "\n") {
						textBox.appendChild(word); 
						word = document.createElement("div"); 
						word.style.height = `${fontSize}px`; 
						word.style.position = "relative"; 
					}
					textBox.appendChild(cspan); 
				} else {
					let cspan = document.createElement("span");
					cspan.textContent = c; 
					cspan.style.height = `${fontSize}px`; 
					// we're part of a word
					cspan.style.position = "relative"; 
					word.appendChild(cspan); 
					charSpans.push(cspan); 
				}

				// prevChar
				prevChar = c; 
			}
			textBox.append(word); 
		} else if (splitMode == 3) {
			// Kinsoku Shori (JP)
			let rHead = ")）]｝〕〉》」』】〙〗〟'\"｠»ヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ々〻‐゠–〜? ! ‼ ⁇ ⁈ ⁉・、:;,。.";
			let rTail = "(（[｛〔〈《「『【〘〖〝'\"｟«"; 
			let rSplit = "—.‥〳〴〵"; 
			let word = null; 
			for (let idx=0; idx<text.length; ++idx) {
				let c = text[idx]; 
				let rh = false;
				let rt = false; 
				let rs = false; 
				let nl = false; 
				let sp = false; 
				let nv = false; 
				let la = text[idx+1]; 
				//if (!la) la = text[idx+1];

				if (la && rHead.match(RegExp.escape(la))) {
					// if la is of the rHead set
					rh = true; 
					if (!word) {
						word = document.createElement("div"); 
						word.style.height = `${fontSize}px`; 
						word.style.position = "relative"; 
						if (Theatre.DEBUG) word.style["background-color"] = "rgba(0,255,0,0.25)"; 
						if (Theatre.DEBUG) word.style["color"] = "lime"; 
					}
				}
				if (rTail.match(RegExp.escape(c))) {
					// if c is of the rTail set
					rt = true; 
					if (!word) {
						word = document.createElement("div"); 
						word.style.height = `${fontSize}px`; 
						word.style.position = "relative"; 
						if (Theatre.DEBUG) word.style["background-color"] = "rgba(0,255,0,0.25)"; 
						if (Theatre.DEBUG) word.style["color"] = "lime"; 
					}
				}
				if (rSplit.match(RegExp.escape(c)) && text[idx+1] && (text[idx+1] == c)) {
					// if c is of the rSplit set, and is followed by another of its type
					rs = true; 
					if (!word) {
						word = document.createElement("div"); 
						word.style.height = `${fontSize}px`; 
						word.style.position = "relative"; 
						if (Theatre.DEBUG) word.style["background-color"] = "rgba(0,255,0,0.25)"; 
						if (Theatre.DEBUG) word.style["color"] = "lime"; 
					}
				}
				if (!isNaN(Number(c)) && text[idx+1] && !isNaN(Number(text[idx+1]))) {
					// keep numbers together
					rs = true; 
					if (!word) {
						word = document.createElement("div"); 
						word.style.height = `${fontSize}px`; 
						word.style.position = "relative"; 
						if (Theatre.DEBUG) word.style["background-color"] = "rgba(0,255,0,0.25)"; 
						if (Theatre.DEBUG) word.style["color"] = "lime"; 
					}
				}

				// scan next character to see if it belongs in the rHead or rTail
				if (text[idx+1] && (/*rTail.match(text[idx+1]) || */rHead.match(RegExp.escape(text[idx+1]))))
					nv = true; 

				if (c == " ") {
					sp = true; 
				} else if (c == "\n") {
					// end any word immediately, we trust the formatting over the Kinsoku Shori
					nl = true; 
				} else {
					let cspan = document.createElement("span");
					cspan.textContent = c; 
					cspan.style.height = `${fontSize}px`; 
					cspan.style.position = "relative"; 
					if (word)
						word.appendChild(cspan); 
					else
						textBox.appendChild(cspan); 
					charSpans.push(cspan); 
				}

				// output word when we hit our limit, and current c is not in rTail/rHead/rSplit
				// and that the character following our word is not in the restricted rHead
				if (word && word.children.length >= 2 && !rt && !rh && !rs && !nv) {
					textBox.appendChild(word);
					word = null; 
				}

				if (nl) {
					// newline after word if present
					let cspan = document.createElement("hr");
					if (word) {
						textBox.appendChild(word); 
						word = null; 
					}
					textBox.appendChild(cspan); 
				} else if (sp) {
					// if not a newline, but a space output word before space
					if (word) {
						textBox.appendChild(word); 
						word = null; 
					}
					let cspan = document.createElement("span");
					cspan.textContent = c; 
					cspan.style.height = `${fontSize}px`; 
					cspan.style.width = `${fontSize/4}px`; 
					cspan.style.position = "relative"; 
					textBox.appendChild(cspan); 
					charSpans.push(cspan); 
				}

			}
			if (word) {
				textBox.appendChild(word); 
				word = null; 
			}
		} else if (splitMode == 4) {
			// Korean Line breaking KS X ISO/IEC 26300:2007 (KO) 
			let rHead = "!%),.:;?]}¢°'\"†‡℃〆〈《「『〕！％），．：；？］｝ ";
			let rTail = "$([\\{£¥'\"々〇〉》」〔＄（［｛｠￥￦#"; 
			let word = null; 
			for (let idx=0; idx<text.length; ++idx) {
				let c = text[idx]; 
				let rh = false;
				let rt = false; 
				let rs = false; 
				let nl = false; 
				let nv = false; 
				let la = text[idx+1]; 
				//if (!la) la = text[idx+1];

				if (la && rHead.match(RegExp.escape(la))) {
					// if la is of the rHead set
					rh = true; 
					if (!word) {
						word = document.createElement("div"); 
						word.style.height = `${fontSize}px`; 
						word.style.position = "relative"; 
						if (Theatre.DEBUG) word.style["background-color"] = "rgba(0,255,0,0.25)"; 
						if (Theatre.DEBUG) word.style["color"] = "lime"; 
					}
				}
				if (rTail.match(RegExp.escape(c))) {
					// if c is of the rTail set
					rt = true; 
					if (!word) {
						word = document.createElement("div"); 
						word.style.height = `${fontSize}px`; 
						word.style.position = "relative"; 
						if (Theatre.DEBUG) word.style["background-color"] = "rgba(0,255,0,0.25)"; 
						if (Theatre.DEBUG) word.style["color"] = "lime"; 
					}
				}
				if (!isNaN(Number(c)) && text[idx+1] && !isNaN(Number(text[idx+1]))) {
					// keep numbers together
					rs = true; 
					if (!word) {
						word = document.createElement("div"); 
						word.style.height = `${fontSize}px`; 
						word.style.position = "relative"; 
						if (Theatre.DEBUG) word.style["background-color"] = "rgba(0,255,0,0.25)"; 
						if (Theatre.DEBUG) word.style["color"] = "lime"; 
					}
				}

				// scan next character to see if it belongs in the rHead or rTail
				if (text[idx+1] && (/*rTail.match(text[idx+1]) || */rHead.match(RegExp.escape(text[idx+1]))))
					nv = true; 

				if (c == " ") {
					// if not a newline, but a space output the space just like any other character. 
					let cspan = document.createElement("span");
					cspan.textContent = c; 
					cspan.style.height = `${fontSize}px`; 
					cspan.style.width = `${fontSize/4}px`; 
					cspan.style.position = "relative"; 
					if (word)
						word.appendChild(cspan); 
					else
						textBox.appendChild(cspan); 
					charSpans.push(cspan); 
				} else if (c == "\n") {
					// end any word immediately, we trust the formatting over the Kinsoku Shori
					nl = true; 
				} else {
					let cspan = document.createElement("span");
					cspan.textContent = c; 
					cspan.style.height = `${fontSize}px`; 
					cspan.style.position = "relative"; 
					if (word)
						word.appendChild(cspan); 
					else
						textBox.appendChild(cspan); 
					charSpans.push(cspan); 
				}

				// output word when we hit our limit, and current c is not in rTail/rHead/rSplit
				// and that the character following our word is not in the restricted rHead
				if (word && word.children.length >= 2 && !rh && !rt && !rs && !nv) {
					textBox.appendChild(word);
					word = null; 
				}

				if (nl) {
					// newline after word if present
					let cspan = document.createElement("hr");
					if (word) {
						textBox.appendChild(word); 
						word = null; 
					}
					textBox.appendChild(cspan); 
				}

			}
			if (word) {
				textBox.appendChild(word); 
				word = null; 
			}

		}
		
		return charSpans; 
	}

	/**
	 *
	 * ActorSheet Configue Options
	 *
	 * @params ev (Event) : The event that triggered the configuration option.
	 * @params actorSheet (Object ActorSheet) : The ActorSheet Object to spawn a configure
	 *                                          window from. 
	 */
	static onConfigureInsert(ev,actorSheet) {
		ev.preventDefault(); 
		if (Theatre.DEBUG) console.log("Click Event on Configure Theatre!!!",actorSheet,actorSheet.actor,actorSheet.position); 

		if (!actorSheet.actor.data.flags.theatre) {
			actorSheet.actor.data.flags.theatre = {baseinsert:"", name:""}; 
		}

		new TheatreActorConfig(actorSheet.actor, {
			top: actorSheet.position.top+40,
			left: actorSheet.position.left + ((actorSheet.position.width - 500) / 2),
			configureDefault: true
		}).render(true); 
	}

	/**
	 * Add to the nav bar staging area with an actorSheet.
	 *
	 * @params ev (Event) : The event that triggered adding to the NavBar staging area.
	 */
	static onAddToNavBar(ev,actorSheet,removeLabelSheetHeader) {
		if (Theatre.DEBUG) console.log("Click Event on Add to NavBar!!",actorSheet,actorSheet.actor,actorSheet.position); 
		const actor = actorSheet.object.data; 
		const addLabel = removeLabelSheetHeader ? "" : game.i18n.localize("Theatre.UI.Config.AddToStage");
		const removeLabel = removeLabelSheetHeader ? "" : game.i18n.localize("Theatre.UI.Config.RemoveFromStage");
		let newText;
		if (Theatre.isActorStaged(actor)) {
			Theatre.removeFromNavBar(actor)
			newText = addLabel
		} else {
			Theatre.addToNavBar(actor); 
			newText = removeLabel;
		}
		ev.currentTarget.innerHTML = Theatre.isActorStaged(actor) ? `<i class="fas fa-theater-masks"></i>${newText}` :  `<i class="fas fa-mask"></i>${newText}`;
	}

	static _getTheatreId(actor) {
		return `theatre-${actor._id}`; 
	}

	/**
	 * Add to the NavBar staging area
	 *
	 * @params actor (Actor) : The actor from which to add to the NavBar staging area. 
	 */
	static addToNavBar(actor) {
		if (!actor) return; 
		if (Theatre.DEBUG) console.log("actor is valid!"); 
		// if already on stage, dont add it again
		// create nav-list-item
		// set picture as actor.data.img
		// set attribute "theatre-id" to "theatre" + _id
		// set attribute "insertImg" to object.data.flags.theatre.baseinsert or img if not specified
		// add click handler to push it into the theatre bar, if it already exists on the bar, remove it
		// from the bar
		// add click handler logic to remove it from the stage
		let theatreId = Theatre._getTheatreId(actor);
		let portrait = (actor.img ? actor.img : "icons/mystery-man.png"); 
		let optAlign = "top"; 
		let name = actor.name; 

		if (!Theatre.instance.isActorOwner(game.user.id,theatreId)) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return; 
		}

		// Use defaults incase the essential flag attributes are missing
		if (actor.flags.theatre) {
			if (actor.flags.theatre.name && actor.flags.theatre.name != "")
				name = actor.flags.theatre.name; 
			if (actor.flags.theatre.baseinsert && actor.flags.theatre.baseinsert != "")
				portrait = actor.flags.theatre.baseinsert; 
			if (actor.flags.theatre.optalign && actor.flags.theatre.optalign != "")
				optAlign = actor.flags.theatre.optalign; 
		}

		if (Theatre.instance.stage[theatreId]) {
			ui.notifications.info(actor.name + game.i18n.localize("Theatre.UI.Notification.AlreadyStaged"));
			return; 
		}

		if (Theatre.DEBUG) console.log("new theatre id: " + theatreId); 

		let navItem = document.createElement("img");
		KHelpers.addClass(navItem,"theatre-control-nav-bar-item"); 
		//navItem.setAttribute("draggable",false); 
		navItem.setAttribute("imgId",theatreId); 
		navItem.setAttribute("src",portrait); 
		navItem.setAttribute("title",name + (name == actor.name ? "" : ` (${actor.name})`)); 
		navItem.setAttribute("name",name); 
		navItem.setAttribute("optalign",optAlign); 

		// if the theatreId is present, then set our navItem as active!
		if (!!Theatre.instance.getInsertById(theatreId))
			KHelpers.addClass(navItem,"theatre-control-nav-bar-item-active"); 

		navItem.addEventListener("mouseup",Theatre.instance.handleNavItemMouseUp); 
		navItem.addEventListener("dragstart",Theatre.instance.handleNavItemDragStart); 
		navItem.addEventListener("dragend",Theatre.instance.handleNavItemDragEnd); 
		navItem.addEventListener("dragover",Theatre.instance.handleNavItemDragOver); 
		navItem.addEventListener("drop",Theatre.instance.handleNavItemDragDrop); 
		Theatre.instance.theatreNavBar.appendChild(navItem); 
		// stage event
		Theatre.instance.stageInsertById(theatreId); 
		// Store reference
		Theatre.instance.stage[theatreId] = new TheatreActor(actor, navItem);
	}

	/**
	 * Removes the actor from the nav bar.
	 *
	 * @params actor (Actor) : The actor to remove from the NavBar staging area. 
	 */
	static removeFromNavBar(actor) {
		if (!actor) return; 
		const theatreId = Theatre._getTheatreId(actor);
		Theatre.instance._removeFromStage(theatreId);

	}

	/**
	 * Removes the actor from the stage.
	 *
	 * @params id (string) : The theatreId to remove from the stage.
	 */
	 _removeFromStage(theatreId) {
		const staged = Theatre.instance.stage[theatreId];
		if(staged) {
			if(staged.navElement) {
				Theatre.instance.theatreNavBar.removeChild(staged.navElement);
			}
			Theatre.instance.removeInsertById(theatreId);
			delete Theatre.instance.stage[theatreId];
		}
	}

	/**
	 * Returns whether the actor is on the stage.
	 * @params actor (Actor) : The actor. 
	 */
	static isActorStaged(actor) {
		if (!actor) return false; 
		return !!Theatre.instance.stage[Theatre._getTheatreId(actor)]
	}

	static clearStage() {
		Object.keys(Theatre.instance.stage).forEach(theatreId => {
			Theatre._removeFromStage(theatreId);
		})
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
		if (!Theatre.STANDING_ANIMS)
			Theatre.STANDING_ANIMS = {

				"impact" : {
					"func" : function(target, shakeradius) {
						if (!target) return; 
						shakeradius = shakeradius || Math.random()*7+7; 
						shakeradius = Math.max(shakeradius - Math.random()*0.5, 0); 
						// Impact complete!
						if (shakeradius == 0) {
							target.style.left = "0px"; 
							target.style.top = "0px"; 
							return; 
						}

						TweenMax.to(target, 0.025, {
							left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*shakeradius}px`, 
							top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*shakeradius}px`,
							onComplete: Theatre.textStandingAnimation("impact"),
							onCompleteParams: [target,shakeradius]
						}); 
					},
					"label" : game.i18n.localize("Theatre.Standing.Impact")
				},

				"quiver" : {
					"func" : function(target,quiverAmt) {
						if (!target) return; 
						quiverAmt = quiverAmt || 2; 
						quiverAmt = Math.max(quiverAmt - Math.random()*0.1, 0); 
						// Waver complete
						if (quiverAmt == 0) {
							target.style.left = "0px"; 
							target.style.top = "0px"; 
							return; 
						}

						TweenMax.to(target, 0.1, {
							left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*quiverAmt}px`, 
							top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*quiverAmt}px`,
							onComplete: Theatre.textStandingAnimation("quiver"),
							onCompleteParams: [target,quiverAmt]
						}); 
					},
					"label" : game.i18n.localize("Theatre.Standing.Quiver")
				},

				"wave" : {
					"func" : function(target,waveAmp) {
						if (!target) return; 
						waveAmp = waveAmp || 4; 
						if (waveAmp > 0)
							waveAmp = waveAmp - 0.5
						else
							waveAmp = waveAmp + 0.5

						// Waver complete
						if (waveAmp == 0) {
							target.style.top = "0px"; 
							return; 
						}

						TweenMax.to(target, 0.5, {
							top: `${waveAmp}px`,
							onComplete: Theatre.textStandingAnimation("wave"),
							onCompleteParams: [target,-waveAmp]
						}); 
					},
					"label" : game.i18n.localize("Theatre.Standing.Wave")
				},

				"fade" : {
					"func" : function(target,fade) {
						if (!target) return; 
						fade = fade || 1; 
						fade = Math.max(fade - 0.025, 0); 
						// fade complete
						if (fade <= 0) {
							target.style.opacity = 0; 
							return; 
						}

						TweenMax.to(target, 0.1, {
							opacity: fade,
							onComplete: Theatre.textStandingAnimation("fade"),
							onCompleteParams: [target,fade]
						}); 
					},
					"label" : game.i18n.localize("Theatre.Standing.Fade")
				},

				"excited" : {
					"func" : function(target) {
						if (!target) return; 
						TweenMax.to(target, 0.025, {
							left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*1}px`, 
							top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*1}px`,
							onComplete: Theatre.textStandingAnimation("excited"),
							onCompleteParams: [target]
						}); 
					},
					"label" : game.i18n.localize("Theatre.Standing.Excited")
				},

				"violent" : {
					"func" : function(target, oshakeradius, ox, oy) {
						if (!target) return; 
						ox = ox || 0; 
						oy = oy || 0; 
						oshakeradius = oshakeradius || 2; 
						let shakeradius = Math.random()*oshakeradius+oshakeradius; 
						if (!target.style.left.match("0px") || !target.style.top.match("0px"))
							shakeradius = 0; 

						TweenMax.to(target, 0.025, {
							left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*shakeradius+ox}px`, 
							top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*shakeradius+oy}px`,
							scale: `${Math.random()/3 + 0.9}`,
							onComplete: Theatre.textStandingAnimation("violent"),
							onCompleteParams: [target,oshakeradius,ox,oy]
						}); 
					},
					"label" : game.i18n.localize("Theatre.Standing.Violent")
				},

				"bubbly" : {
					"func" : function(target) {
						if (!target) return; 
						TweenMax.to(target, 0.5, {
							scale: `${Math.floor((Math.random()*0.4+0.8)*100)/100}`, 
							onComplete: Theatre.textStandingAnimation("bubbly"),
							onCompleteParams: [target]
						}); 
					},
					"label" : game.i18n.localize("Theatre.Standing.Bubbly")
				},

				"spooky" : {
					"func" : function(target) {
						if (!target) return; 
						TweenMax.to(target,Math.floor((Math.random()*0.25+0.2)*100)/100, {
							left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*3}px`, 
							top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*3}px`,
							onComplete: Theatre.textStandingAnimation("spooky"),
							onCompleteParams: [target]
						}); 
					},
					"label" : game.i18n.localize("Theatre.Standing.Spooky")
				},

				"insane" : {
					"func" : function(target, rotation, scale) {
						if (!target) return; 
						let spin = (Math.random() * 100); 
						let grow = (Math.random() * 200); 
						let animtime = 0.025; 
						rotation = rotation || 0; 
						scale = scale || 1; 

						if (spin >= 99.95) {
							animtime = Math.random()*0.5; 
							rotation = 1080; 
						} else if (spin >= 99.8) {
							animtime = Math.random()*0.5 + 0.5; 
							rotation = 360; 
						} else if (spin >= 80) {
							rotation = (rotation != 0 ? 0 : (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random()*30)); 
						}

						if (grow >= 199) {
							if (scale != 1)
								scale = 1;
							else
								scale = Math.random() * 0.5 + 1; 
						}


						TweenMax.to(target, animtime, {
							left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*1}px`, 
							top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*1}px`,
							rotation: rotation,
							scale: scale,
							onComplete: Theatre.textStandingAnimation("insane"),
							onCompleteParams: [target,rotation,scale]
						}); 
					},
					"label" : game.i18n.localize("Theatre.Standing.Insane")
				}

			};

		if (Theatre.STANDING_ANIMS[name])
			return Theatre.STANDING_ANIMS[name].func; 
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
		if (!Theatre.FLYIN_ANIMS)
			Theatre.FLYIN_ANIMS = {
				"typewriter" : {
					"func" : function(charSpans,animTime,speed,standingAnim) {
						gsap.from(charSpans,{
                            duration: 0.05,
                            stagger: {
                                each: 0.05,
                                onComplete: function() {
                                    if (standingAnim)
                                        standingAnim.call(this, this.targets()[0]);
                                }
                            },
							opacity: 0,
							scale: 1.5
                        }); 

					},
					"label" : game.i18n.localize("Theatre.Flyin.Typewriter")
				},

				"fadein" : {
					"func" : function(charSpans,animTime,speed,standingAnim) {
						gsap.from(charSpans,{
                            duration: animTime,
                            stagger: {
                                each: speed,
                                onComplete: function() {
                                    if (standingAnim)
                                        standingAnim.call(this, this.targets()[0]);
                                }
                            },
							opacity: 0,
						}); 
					},
					"label" : game.i18n.localize("Theatre.Flyin.Fadein")
				},

				"slidein" : {
					"func" : function(charSpans,animTime,speed,standingAnim) {
						gsap.from(charSpans,
							{
                                duration: animTime,
                                stagger: {
                                    each: speed,
                                    onComplete: function() {
                                        if (standingAnim)
                                            standingAnim.call(this, this.targets()[0]);
                                    }
                                },
								opacity: 0,
								left: 200
							}
						); 
					},
					"label" : game.i18n.localize("Theatre.Flyin.Slidein")
				},

				"scalein" : {
					"func" : function(charSpans,animTime,speed,standingAnim) {
						gsap.from(charSpans,
							{
                                duration: animTime,
                                stagger: {
                                    each: speed,
                                    onComplete: function() {
                                        if (standingAnim)
                                            standingAnim.call(this, this.targets()[0]);
                                    }
                                },
								opacity: 0,
								scale: 5,
								//rotation: -180,
								ease: Power4.easeOut
							}
						); 
					},
					"label" : game.i18n.localize("Theatre.Flyin.Scalein")
				},

				"fallin" : {
					"func" : function(charSpans,animTime,speed,standingAnim) {
						let textBox = null; 
						if (charSpans[0]) {
							switch (Theatre.instance.settings.theatreStyle) {
								case "lightbox":
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box-light",5); 
									if (!textBox)
										textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
								case "clearbox":
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box-clear",5); 
									if (!textBox)
										textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
								case "mangabubble":
									break; 
								case "textbox":
								default:
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
							}
							if (textBox) {
								textBox.style["overflow-y"] = "visible"; 
								textBox.style["overflow-x"] = "visible"; 
							}
						}
						gsap.from(charSpans,
							{
                                duration: animTime,
                                stagger: {
                                    each: speed,
                                    onComplete: function() {
                                        if (standingAnim)
                                            standingAnim.call(this, this.targets()[0]);
                                    }
                                },
								opacity: 0,
								top: -100,
								ease: Power4.easeOut,
								onComplete: () => {
                                    if (Theatre.DEBUG) console.log("completeAll"); 
                                    if (textBox) {
                                        textBox.style["overflow-y"] = "scroll"; 
                                        textBox.style["overflow-x"] = "hidden"; 
                                    }
								}
							}
						); 
					},
					"label" : game.i18n.localize("Theatre.Flyin.Fallin")
				},


				"spin" : {
					"func" : function(charSpans,animTime,speed,standingAnim) {
						gsap.from(charSpans,
							{
                                duration: animTime,
                                stagger: {
                                    each: speed,
                                    onComplete: function() {
                                        if (standingAnim)
                                            standingAnim.call(this, this.targets()[0]);
                                    }
                                },
								opacity: 0,
								rotation: -360,
								left: 100,
								ease: Power4.easeOut
							}
						); 
					},
					"label" : game.i18n.localize("Theatre.Flyin.Spin")
				},

				"spinscale" : {
					"func" : function(charSpans,animTime,speed,standingAnim) {
						let textBox = null; 
						if (charSpans[0]) {
							switch (Theatre.instance.settings.theatreStyle) {
								case "lightbox":
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box-light",5); 
									if (!textBox)
										textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
								case "clearbox":
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box-clear",5); 
									if (!textBox)
										textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
								case "mangabubble":
									break; 
								case "textbox":
								default:
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
							}
							if (textBox) {
								textBox.style["overflow-y"] = "visible"; 
								textBox.style["overflow-x"] = "visible"; 
							}
						}
						gsap.from(charSpans,animTime*1.5,
							{
                                duration: animTime*1.5,
                                stagger: {
                                    each: speed,
                                    onComplete: function() {
                                        if (standingAnim)
                                            standingAnim.call(this, this.targets()[0]);
                                    }
                                },
								opacity: 0,
								scale: 5,
								rotation: -360,
								left: 150,
								ease: Power4.easeOut,
								onComplete: () => {
                                    if (Theatre.DEBUG) console.log("completeAll"); 
                                    if (textBox) {
                                        textBox.style["overflow-y"] = "scroll"; 
                                        textBox.style["overflow-x"] = "hidden"; 
                                    }
								}
							}
						); 
					},
					"label" : game.i18n.localize("Theatre.Flyin.SpinScale")
				},

				"outlaw" : {
					"func" : function(charSpans,animTime,speed,standingAnim) {
						//let barTop = 0;
						//let barLeft = 0;
						let textBox = null; 
						if (charSpans[0]) {
							switch (Theatre.instance.settings.theatreStyle) {
								case "lightbox":
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box-light",5); 
									if (!textBox)
										textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
								case "clearbox":
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box-clear",5); 
									if (!textBox)
										textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
								case "mangabubble":
									break; 
								case "textbox":
								default:
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
							}
							if (textBox) {
								textBox.style["overflow-y"] = "visible"; 
								textBox.style["overflow-x"] = "visible"; 
							}
						}
						gsap.from(charSpans,
							{
                                duration: animTime*1.5,
                                stagger: {
                                    each: speed,
                                    onComplete: function() {
                                        if (standingAnim)
                                            standingAnim.call(this, this.targets()[0]);
                                    }
                                },
								opacity: 0,
								scale: 6,
								rotation: -1080,
								ease: Power4.easeOut,
								onComplete: () => {
                                    if (Theatre.DEBUG) console.log("completeAll"); 
                                    if (textBox) {
                                        textBox.style["overflow-y"] = "scroll"; 
                                        textBox.style["overflow-x"] = "hidden"; 
                                        // shaking box
                                        //TweenMax.killTweensOf(charSpans[0].parentNode.parentNode); 
                                        //charSpans[0].parentNode.parentNode.style.top = `${barTop}px`; 
                                        //charSpans[0].parentNode.parentNode.style.left = `${barLeft}px`; 
                                    }
								}
							}
						); 
					},
					"label" : game.i18n.localize("Theatre.Flyin.Outlaw")
				},

				"vortex" : {
						"func" : function(charSpans,animTime,speed,standingAnim) {

						let textBox = null; 
						if (charSpans[0]) {
							switch (Theatre.instance.settings.theatreStyle) {
								case "lightbox":
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box-light",5); 
									if (!textBox)
										textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
								case "clearbox":
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box-clear",5); 
									if (!textBox)
										textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
								case "mangabubble":
									break; 
								case "textbox":
								default:
									textBox = KHelpers.seekParentClass(charSpans[0],"theatre-text-box",5); 
									break; 
							}
							if (textBox) {
								textBox.style["overflow-y"] = "visible"; 
								textBox.style["overflow-x"] = "visible"; 
							}
						}
						for (let idx=0; idx<charSpans.length; ++idx) {
							TweenMax.from(charSpans[idx],animTime,{
								delay: idx*speed,
								opacity: 0,
								scale: 5,
								rotation: -720,
								left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*500}px`,
								top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random()*500}px`,
								onComplete: function() {
									if (standingAnim)
										standingAnim.call(this,this.targets()[0])
								}
							}); 
						}
						if (textBox) {
							if (Theatre.DEBUG) console.log("vortext all start"); 
							TweenMax.from(textBox,0.1, {
								delay: (speed*charSpans.length)+animTime,
								//opacity: 1,
								onComplete: function() {
									if (Theatre.DEBUG) console.log("vortex all complete"); 
									if (this.targets().length) {
										this.targets()[0].style["overflow-y"] = "scroll"; 
										this.targets()[0].style["overflow-x"] = "visible"; 
									}
								}
							}); 
						}

					},
					"label" : game.i18n.localize("Theatre.Flyin.Vortex")
				},

				"assemble" : {
					"func" : function(charSpans,animTime,speed,standingAnim) {
						for (let idx=0; idx<charSpans.length; ++idx) {
							TweenMax.from(charSpans[idx],animTime,{
								delay: idx*speed,
								opacity: 0,
								scale: 5,
								rotation: -180,
								left: `${Math.random()*500}px`,
								top: `${Math.random()*500}px`,
								onComplete: function() {
									if (standingAnim)
										standingAnim.call(this,this.targets()[0])
								}
							}); 
						}
					},
					"label" : game.i18n.localize("Theatre.Flyin.Assemble")
				}

			}

		if (Theatre.FLYIN_ANIMS[name])
			return Theatre.FLYIN_ANIMS[name].func; 
		else
			return Theatre.FLYIN_ANIMS["typewriter"].func; 
	}

}
