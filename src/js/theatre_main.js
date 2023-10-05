import { KHelpers } from "./KHelpers.js";
import { Theatre } from "./Theatre.js";

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
  let prop = getProperty(hash.data.root, propPath);
  return prop;
});

/**
 * Hook in on Actorsheet's Header buttons + context menus
 */
Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
  if (!game.user.isGM && game.settings.get("theatre", "gmOnly")) return;

  let theatreButtons = [];
  if (app.object.isOwner) {
    // only prototype actors
    if (!app.object.token) {
      theatreButtons.push({
        label: "Theatre.UI.Config.Theatre",
        class: "configure-theatre",
        icon: "fas fa-user-edit",
        onclick: (ev) => Theatre.onConfigureInsert(ev, app.object.sheet),
      });
    }
    theatreButtons.push({
      label: Theatre.isActorStaged(app.object) ? "Theatre.UI.Config.RemoveFromStage" : "Theatre.UI.Config.AddToStage",
      class: "add-to-theatre-navbar",
      icon: "fas fa-theater-masks",
      onclick: (ev) => {
        Theatre.onAddToNavBar(ev, app.object.sheet);
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
  if (!Theatre.instance) return;

  if (Theatre.DEBUG) console.log("collapse? : ", a, collapsed);
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

  if (Theatre.instance.reorderTOId) window.clearTimeout(Theatre.instance.reorderTOId);

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
  if (!Theatre.instance) return;

  if (!!game.combats.active && game.combats.active.round == 0 && Theatre.instance.isSuppressed) {
    if (Theatre.DEBUG) console.log("COMBAT CREATED");
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
  if (!Theatre.instance) return;

  if (!game.combats.active && Theatre.instance.isSuppressed) {
    if (Theatre.DEBUG) console.log("COMBAT DELETED");
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
Hooks.on("preCreateChatMessage", function (chatMessage) {
  let chatData = {
    speaker: {
      //actor: null,
      //The above line is causing issues with chat buttons in v11 in certain systems. Will revert if it causes unforseen issues in other systems.
      scene: null,
      flags: {},
    },
  };
  if (Theatre.DEBUG) console.log("preCreateChatMessage", chatMessage);
  // If theatre isn't even ready, then just no
  if (!Theatre.instance) return;
  if (chatMessage.rolls.length) return;

  // make the message OOC if needed
  if ($(theatre.theatreChatCover).hasClass("theatre-control-chat-cover-ooc")) {
    const user = game.users.get(chatMessage.user.id);
    chatData.speaker.alias = user.name;
    chatData.type = CONST.CHAT_MESSAGE_TYPES.OOC;

    chatMessage.updateSource(chatData);
    return;
  }

  if (Theatre.instance.speakingAs && Theatre.instance.usersTyping[chatMessage.user.id]) {
    let theatreId = Theatre.instance.usersTyping[chatMessage.user.id].theatreId;
    let insert = Theatre.instance.getInsertById(theatreId);
    let actorId = theatreId.replace("theatre-", "");
    let actor = game.actors.get(actorId) || null;
    if (Theatre.DEBUG) console.log("speakingAs %s", theatreId);

    if (insert && chatMessage.speaker) {
      let label = Theatre.instance._getLabelFromInsert(insert);
      let name = label.text;
      let theatreColor = Theatre.instance.getPlayerFlashColor(chatMessage.user.id, insert.textColor);
      if (Theatre.DEBUG) console.log("name is %s", name);
      chatData.speaker.alias = name;
      //chatData.flags.theatreColor = theatreColor;
      chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
      // if delay emote is active
      if (Theatre.instance.isDelayEmote && Theatre.instance.delayedSentState == 1) {
        if (Theatre.DEBUG) console.log("setting emote now! as %s", insert.emote);
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
      chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
      // if delay emote is active
      if (Theatre.instance.isDelayEmote && Theatre.instance.delayedSentState == 1) {
        if (Theatre.DEBUG) console.log("setting emote now! as %s", insert.emote);
        Theatre.instance.delayedSentState = 2;
        Theatre.instance.setUserEmote(game.user._id, theatreId, "emote", insert.emote, false);
        Theatre.instance.delayedSentState = 0;
      }
    } else if (Theatre.instance.speakingAs == Theatre.NARRATOR) {
      chatData.speaker.alias = game.i18n.localize("Theatre.UI.Chat.Narrator");
      chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
    }

    if (!chatData.flags) chatData.flags = {};
    chatData.flags[Theatre.SETTINGS] = { theatreMessage: true };
  }
  // alter message data
  // append chat emote braces
  if (Theatre.DEBUG) console.log("speaker? ", chatMessage.speaker);
  if (
    Theatre.instance.isQuoteAuto &&
    chatMessage.speaker &&
    (chatData.speaker.actor || chatData.speaker.token || chatData.speaker.alias) &&
    !chatMessage.content.match(/\<div.*\>[\s\S]*\<\/div\>/)
  ) {
    chatData.content =
      game.i18n.localize(`Theatre.Text.OpenBracket.${Theatre.instance.settings.quoteType}`) +
      chatMessage.content +
      game.i18n.localize(`Theatre.Text.CloseBracket.${Theatre.instance.settings.quoteType}`);
  }
  chatMessage.updateSource(chatData);
});

/**
 * Chat message Binding
 */
Hooks.on("createChatMessage", function (chatEntity, _, userId) {
  if (Theatre.DEBUG) console.log("createChatMessage");
  let theatreId = null;

  // If theatre isn't even ready, then just no
  if (!Theatre.instance) return;

  if (Theatre.instance.usersTyping[userId]) {
    theatreId = Theatre.instance.usersTyping[userId].theatreId;
    Theatre.instance.removeUserTyping(userId);
  }

  // slash commands are pass through
  let chatData = chatEntity;
  if (
    chatData.content.startsWith("<") || //Bandaid fix so that texts that start with html formatting don't utterly break it
    chatData.content.startsWith("/") ||
    chatData.rolls.length ||
    chatData.emote ||
    chatData.type == CONST.CHAT_MESSAGE_TYPES.OOC ||
    //|| Object.keys(chatData.speaker).length == 0
    chatData.content.match(/@[a-zA-Z0-9]+\[[a-zA-Z0-9]+\]/) ||
    chatData.content.match(/\<div.*\>[\s\S]*\<\/div\>/)
  )
    return;

  let textBox = Theatre.instance.getTextBoxById(theatreId);
  let insert = Theatre.instance.getInsertById(theatreId);
  let charSpans = [];
  let textContent = chatData.content;

  // replace entities
  textContent = textContent.replace(/&gt;/g, ">");
  textContent = textContent.replace(/&lt;/g, "<");
  textContent = textContent.replace(/&amp;/g, "&");
  textContent = textContent.replace(/<br>/g, "\n");

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

    if (Theatre.DEBUG) console.log("all tweens", TweenMax.getAllTweens());
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
    } else if (theatreId == Theatre.NARRATOR) {
      insertFlyinMode = Theatre.instance.theatreNarrator.getAttribute("textflyin");
      insertStandingMode = Theatre.instance.theatreNarrator.getAttribute("textstanding");
      insertFontType = Theatre.instance.theatreNarrator.getAttribute("textfont");
      insertFontSize = Number(Theatre.instance.theatreNarrator.getAttribute("textsize"));
      insertFontColor = Theatre.instance.theatreNarrator.getAttribute("textcolor");
    }
    let fontSize = Number(textBox.getAttribute("osize") || 28);
    //console.log("font PRE(%s): ",insertFontSize,fontSize)
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
    if (Theatre.DEBUG) console.log("font size is (%s): ", insertFontSize, fontSize);
    Theatre.instance._applyFontFamily(textBox, insertFontType || Theatre.instance.textFont);
    //textBox.style["font-family"] = insertFontType || Theatre.instance.textFont;
    textBox.style.color = insertFontColor || "white";
    textBox.style["font-size"] = `${fontSize}px`;
    textBox.scrollTop = 0;
    // If polyglot is active, and message contains its flag (e.g. not an emote), begin processing
    if (typeof polyglot !== "undefined" && typeof chatData.flags.polyglot !== "undefined") {
      // Get current language being processed
      const lang = chatData.flags.polyglot.language;
      // Fetch the languages known by current user
      let langs = game.polyglot.getUserLanguages();
      let understood = false;
      for (lang_set of langs.values()) {
        for (item of lang_set.values()) {
          // If the user has a matching language in their list, we understand it
          if (lang == item) {
            understood = true;
            break;
          }
        }
      }
      if (game.user.isGM || game.user.name == "Stream" || game.user.name == "stream") {
        understood = true;
      }
      if (!understood) {
        // If not understood, scramble the text
        const fontStyle = game.polyglot._getFontStyle(lang);
        fontSize *= Math.floor(Number(fontStyle.slice(0, 3)) / 100);
        insertFontType = fontStyle.slice(5);
        textContent = game.polyglot.scrambleString(textContent, chatData._id, lang);
      }
    }

    charSpans = Theatre.splitTextBoxToChars(textContent, textBox);

    if (Theatre.DEBUG) console.log("animating text: " + textContent);

    Theatre.textFlyinAnimation(insertFlyinMode || "typewriter").call(
      this,
      charSpans,
      0.5,
      0.05,
      Theatre.textStandingAnimation(insertStandingMode)
    );

    // auto decay?
    if (insert && insert.decayTOId) window.clearTimeout(insert.decayTOId);
    if (insert && Theatre.instance.settings.autoDecay) {
      insert.decayTOId = window.setTimeout(
        (imgId) => {
          let insert = Theatre.instance.getInsertById(imgId);
          if (insert) Theatre.instance.decayTextBoxById(imgId, true);
        },
        Math.max(Theatre.instance.settings.decayRate * charSpans.length, Theatre.instance.settings.decayMin),
        insert.imgId
      );
    }
  }
});

Hooks.on("renderChatMessage", function (ChatMessage, html, data) {
  if (Theatre.instance.settings.ignoreMessagesToChat && ChatMessage.flags?.[Theatre.SETTINGS]?.theatreMessage)
    html[0].style.display = "none";
  return true;
});

Hooks.on("renderChatLog", function (app, html, data) {
  if (data.cssId === "chat-popout") return;
  theatre.initialize();
  // window may not be ready?
  console.log("%cTheatre Inserts", "font-weight: bold; font-size: 30px; font-style: italic; color: black;");
  // NOTE: Closed alpha/beta is currently all rights reserved!
  console.log("%c-- Theatre is Powered by Free Open Source GPLv3 Software --", "font-weight: bold; font-size: 12");
});

/**
 * Add to stage button on ActorDirectory Sidebar
 */
Hooks.on("getActorDirectoryEntryContext", async (html, options) => {
  if (!game.user.isGM && game.settings.get("theatre", "gmOnly")) return;

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
    }
  );
});

// Fixed global singleton/global object
var theatre = null;
Hooks.once("setup", () => {
  theatre = new Theatre();

  // module keybinds
  game.keybindings.register("theatre", "unfocusTextArea", {
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

  game.keybindings.register("theatre", "addOwnedToStage", {
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

  game.keybindings.register("theatre", "addSelectedToStage", {
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

  game.keybindings.register("theatre", `removeSelectedFromStage`, {
    name: "Theatre.UI.Keybinds.removeSelectedFromStage",
    hint: "",
    editable: [],
    onDown: (context) => {
      for (const tkn of canvas.tokens.controlled) Theatre.removeFromNavBar(tkn.actor);
    },
    restricted: true,
  });

  game.keybindings.register("theatre", "narratorMode", {
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

  game.keybindings.register("theatre", "flipPortrait", {
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

  game.keybindings.register("theatre", "nudgePortraitLeft", {
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

  game.keybindings.register("theatre", "nudgePortraitRight", {
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

  game.keybindings.register("theatre", "nudgePortraitUp", {
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

  game.keybindings.register("theatre", "nudgePortraitDown", {
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
    game.keybindings.register("theatre", `activateStaged${i}`, {
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

    game.keybindings.register("theatre", `removeStaged${i}`, {
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
});

/**
 * Hide player list (and macro hotbar) when stage is active (and not suppressed)
 */
Hooks.on("theatreDockActive", (insertCount) => {
  if (!insertCount) return;

  // The "MyTab" module inserts another element with id "pause". Use querySelectorAll to make sure we catch both
  document.querySelectorAll("#pause").forEach((ele) => KHelpers.addClass(ele, "theatre-centered"));

  if (!game.settings.get(Theatre.SETTINGS, "autoHideBottom")) return;

  if (!theatre.isSuppressed) {
    $("#players").addClass("theatre-invisible");
    $("#hotbar").addClass("theatre-invisible");
  }
});

/**
 * If Argon is active, wrap CombatHudCanvasElement#toggleMacroPlayers to prevent playesr list and macro hotbar from being shown
 */
Hooks.once("ready", () => {
  if (!game.settings.get(Theatre.SETTINGS, "autoHideBottom")) return;
  if (!game.modules.get("enhancedcombathud")?.active) return;

  libWrapper.register(
    Theatre.SETTINGS,
    "CombatHudCanvasElement.prototype.toggleMacroPlayers",
    (wrapped, togg) => {
      if (togg && theatre?.dockActive) return;
      return wrapped(togg);
    },
    "MIXED"
  );
});

/**
 * Hide/show macro hotbar when stage is suppressed
 */
Hooks.on("theatreSuppression", (suppressed) => {
  if (!game.settings.get(Theatre.SETTINGS, "autoHideBottom")) return;
  if (!game.settings.get(Theatre.SETTINGS, "suppressMacroHotbar")) return;
  if (!theatre.dockActive) return;

  if (suppressed) {
    $("#players").removeClass("theatre-invisible");
    $("#hotbar").removeClass("theatre-invisible");
  } else {
    $("#players").addClass("theatre-invisible");
    $("#hotbar").addClass("theatre-invisible");
  }
});

Hooks.on("renderPause", () => {
  if (!theatre?.dockActive) return;
  // The "MyTab" module inserts another element with id "pause". Use querySelectorAll to make sure we catch both
  document.querySelectorAll("#pause").forEach((ele) => KHelpers.addClass(ele, "theatre-centered"));
});

/**
 * If an actor changes, update the stage accordingly
 */
Hooks.on("updateActor", (actor, data) => {
  const insert = Theatre.instance.getInsertById(`theatre-${actor.id}`);
  if (!insert) return;

  insert.label.text = Theatre.getActorDisplayName(actor.id);
  Theatre.instance._renderTheatre(performance.now());
});

Hooks.on("getSceneControlButtons", (controls) => {
  // Use "theatre", since Theatre.SETTINGS may not be available yet
  if (!game.user.isGM && game.settings.get("theatre", "gmOnly")) {
    const suppressTheatreTool = {
      name: "suppressTheatre",
      title: "Theatre.UI.Title.SuppressTheatre",
      icon: "fas fa-theater-masks",
      toggle: true,
      active: false,
      onClick: (toggle) => Theatre.instance.updateSuppression(toggle), // TODO Suppress theatre
      visible: true,
    };
    const tokenControls = controls.find((group) => group.name === "token").tools;
    tokenControls.push(suppressTheatreTool);
  }
});
