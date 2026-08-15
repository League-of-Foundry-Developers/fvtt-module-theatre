var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const KHelpers$1 = {
  hasClass(el, className) {
    return el.classList ? el.classList.contains(className) : new RegExp("\\b" + className + "\\b").test(el.className);
  },
  addClass(el, className) {
    if (el.classList) el.classList.add(className);
    else if (!KHelpers$1.hasClass(el, className)) el.className += " " + className;
  },
  addClasses(el, classNames) {
    if (el.classList) {
      classNames.split(" ").forEach((className) => el.classList.add(className));
    } else {
      classNames.split(" ").forEach((className) => {
        if (!KHelpers$1.hasClass(el, className)) el.className += " " + className;
      });
    }
  },
  removeClass(el, className) {
    if (el.classList) el.classList.remove(className);
    else el.className = el.className.replace(new RegExp("\\b" + className + "\\b", "g"), "");
  },
  offset(el) {
    var rect = el.getBoundingClientRect(), scrollLeft = window.pageXOffset || document.documentElement.scrollLeft, scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  },
  style(el) {
    return el.currentStyle || window.getComputedStyle(el);
  },
  insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
  },
  insertBefore(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode);
  },
  /**
   * Helper to grab a parent class via CSS ClassName
   *
   * @param elem (HTMLElement) : the element to start from.
   * @param cls (String) : The class name to search for.
   * @param depth (Number) : The maximum height/depth to look up.
   * @returns (HTMLElement) : the parent class if found, or null if
   *                          no such parent exists within the specified
   *                          depth.
   */
  seekParentClass(elem, cls, depth) {
    depth = depth || 5;
    let el = elem;
    let targ = null;
    for (let i = 0; i < depth; ++i) {
      if (!el) break;
      if (KHelpers$1.hasClass(el, cls)) {
        targ = el;
        break;
      } else el = el.parentNode;
    }
    return targ;
  }
};
class TheatreActor {
  static {
    __name(this, "TheatreActor");
  }
  constructor(actor, navElement) {
    this.actor = actor;
    this.navElement = navElement;
  }
}
const CONSTANTS = {
  MODULE_ID: "theatre",
  PATH: `modules/theatre/`,
  PREFIX_I18N: `Theatre`,
  FLAGS: {},
  API: {
    EVENT_TYPE: {
      sceneevent: "sceneevent",
      typingevent: "typingevent",
      resyncevent: "resyncevent",
      reqresync: "reqresync"
    }
  },
  SOCKET: "module.theatre",
  NARRATOR: "Narrator",
  ICONLIB: "modules/theatre/assets/graphics/emotes",
  DEFAULT_PORTRAIT: "icons/mystery-man.png",
  PREFIX_ACTOR_ID: "theatre-",
  MAX_NUM_ACTORS_ON_CONTROL_GROUP: 5
};
CONSTANTS.PATH = `modules/${CONSTANTS.MODULE_ID}/`;
class Logger {
  static {
    __name(this, "Logger");
  }
  static get DEBUG() {
    return game.settings.get(CONSTANTS.MODULE_ID, "debug") || game.modules.get("_dev-mode")?.api?.getPackageDebugValue(CONSTANTS.MODULE_ID, "boolean");
  }
  // export let debugEnabled = 0;
  // 0 = none, warnings = 1, debug = 2, all = 3
  static debug(msg, ...args) {
    try {
      if (game.settings.get(CONSTANTS.MODULE_ID, "debug") || game.modules.get("_dev-mode")?.api?.getPackageDebugValue(CONSTANTS.MODULE_ID, "boolean")) {
        console.log(`DEBUG | ${CONSTANTS.MODULE_ID} | ${msg}`, ...args);
      }
    } catch (e) {
      console.error(e.message);
    }
    return msg;
  }
  static logObject(...args) {
    return this.log("", args);
  }
  static log(message, ...args) {
    try {
      message = `${CONSTANTS.MODULE_ID} | ${message}`;
      console.log(message.replace("<br>", "\n"), ...args);
    } catch (e) {
      console.error(e.message);
    }
    return message;
  }
  static notify(message, ...args) {
    try {
      message = `${CONSTANTS.MODULE_ID} | ${message}`;
      ui.notifications?.notify(message);
      console.log(message.replace("<br>", "\n"), ...args);
    } catch (e) {
      console.error(e.message);
    }
    return message;
  }
  static info(info, notify = false, ...args) {
    try {
      info = `${CONSTANTS.MODULE_ID} | ${info}`;
      if (notify) {
        ui.notifications?.info(info);
      }
      console.log(info.replace("<br>", "\n"), ...args);
    } catch (e) {
      console.error(e.message);
    }
    return info;
  }
  static warn(warning, notify = false, ...args) {
    try {
      warning = `${CONSTANTS.MODULE_ID} | ${warning}`;
      if (notify) {
        ui.notifications?.warn(warning);
      }
      console.warn(warning.replace("<br>", "\n"), ...args);
    } catch (e) {
      console.error(e.message);
    }
    return warning;
  }
  static errorObject(...args) {
    return this.error("", false, args);
  }
  static error(error, notify = true, ...args) {
    try {
      error = `${CONSTANTS.MODULE_ID} | ${error}`;
      if (notify) {
        ui.notifications?.error(error);
      }
      console.error(error.replace("<br>", "\n"), ...args);
    } catch (e) {
      console.error(e.message);
    }
    return new Error(error.replace("<br>", "\n"));
  }
  static timelog(message) {
    this.warn(Date.now(), message);
  }
  static i18n = /* @__PURE__ */ __name((key) => {
    return game.i18n.localize(key)?.trim();
  }, "i18n");
  static i18nFormat = /* @__PURE__ */ __name((key, data = {}) => {
    return game.i18n.format(key, data)?.trim();
  }, "i18nFormat");
  // setDebugLevel = (debugText): void => {
  //   debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
  //   // 0 = none, warnings = 1, debug = 2, all = 3
  //   if (debugEnabled >= 3) CONFIG.debug.hooks = true;
  // };
  static dialogWarning(message, icon = "fas fa-exclamation-triangle") {
    return `<p class="${CONSTANTS.MODULE_ID}-dialog">
        <i style="font-size:3rem;" class="${icon}"></i><br><br>
        <strong style="font-size:1.2rem;">${CONSTANTS.MODULE_ID}</strong>
        <br><br>${message}
    </p>`;
  }
}
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
class TheatreActorConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static {
    __name(this, "TheatreActorConfig");
  }
  constructor(options = {}) {
    super(options);
  }
  static DEFAULT_OPTIONS = {
    id: "theatre-config",
    classes: ["whisperBox"],
    tag: "form",
    position: { width: 500, height: 360 },
    window: { resizable: true, minimizable: true },
    form: {
      handler: this.#onSubmitForm,
      closeOnSubmit: true
    },
    actions: {
      onAddEmoteLine: this._onAddEmoteLine,
      onCustomIconImage: this._onCustomIconImage
    }
  };
  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    content: {
      template: "modules/theatre/templates/theatre_actor_config.html"
    }
  };
  static TABS = {
    primary: {
      tabs: [
        { id: "main", icon: "fas fa-user", label: "Theatre.UI.Config.Main" },
        { id: "emotes", icon: "far fa-laugh", label: "Theatre.Emote.Label" }
      ],
      initial: "main"
    }
  };
  /**
   * Add the Entity name into the window title
   */
  get title() {
    return `${this.object.name}: ${game.i18n.localize("Theatre.UI.Config.ConfigureTheatre")}`;
  }
  get object() {
    return this.options.document;
  }
  /**
   * Construct and return the data object used to render the HTML template for this form application.
   *
   * @return (Object) : The Object to be used in handlebars compile
   */
  async _prepareContext(options) {
    const parentContext = await super._prepareContext(options);
    const entityName = this.object.name;
    return foundry.utils.mergeObject(parentContext, {
      entityName,
      isGM: game.user.isGM,
      object: foundry.utils.duplicate(this.object),
      emote: Theatre.getActorEmotes(this.object._id),
      optalignChoices: {
        top: "Theatre.UI.Config.SetTopAlignTop",
        bottom: "Theatre.UI.Config.SetTopAlignBottom"
      }
    });
  }
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.activateListeners();
  }
  /**
   * Activate the default set of listeners for the Actor Sheet
   * These listeners handle basic stuff like updating images
   */
  activateListeners() {
    const labelsCustom = this.element.getElementsByClassName("customlabel");
    for (const label of labelsCustom) this._setupCustomLabelEvents(label);
  }
  /** @override */
  _onClickTab(event2) {
    super._onClickTab(event2);
    const { tab } = event2.target.dataset;
    this.setPosition({
      height: tab === "emotes" ? 795 : 360
    });
  }
  /**
   * Verify the form data just prior to submission
   *
   * @param formData (Object) : The object form data to be verified
   *
   * @return Object : an object containing the revised formData to be updated
   *                   as well as a set of data which only contains the updated
   *                   emotes (excluding other theatre updates)
   */
  _verifyCustomEmotes(formData) {
    for (let k in formData)
      if (formData[k] && /emotes\.custom\d+/.test(k)) {
        let mch = k.match(/flags\.theatre\.emotes\.custom\d+/)[0];
        let name2 = mch.match(/custom\d+/)[0];
        let labelPath = mch + ".label";
        let cflagPath = mch + ".custom";
        let namePath = mch + ".name";
        Logger.debug("found %s", k, mch, cflagPath, namePath);
        let emoteProp = foundry.utils.getProperty(this.object, mch);
        let labelProp = null;
        if (emoteProp) labelProp = foundry.utils.getProperty(this.object, labelPath);
        if ((!labelProp || labelProp == "") && (!formData[labelPath] || formData[labelPath] == "")) {
          Logger.error("ERROR: No label for custom emote defined!", true);
          Logger.error(game.i18n.localize("Theatre.UI.Notification.BadCustomEmote"), true);
          return false;
        }
        if (!emoteProp || !foundry.utils.getProperty(this.object, cflagPath)) formData[cflagPath] = true;
        if (!emoteProp || !foundry.utils.getProperty(this.object, namePath)) formData[namePath] = name2;
      }
    let configElement = this.element;
    let toDelete = configElement.querySelectorAll('.theatre-config-form-group[todelete="true"]');
    let emoteFormData = {};
    let revisedFormData = {};
    for (let k in formData) {
      let rem = false;
      let isCustom = /custom\d+/.test(k);
      let isEmote = /flags\.theatre\.emotes\./.test(k);
      if (formData[k] && isCustom) {
        let mch = k.match(/custom\d+/)[0];
        for (let d of toDelete)
          if (d.getAttribute("name") == mch) {
            rem = true;
            break;
          }
      }
      if (!rem && isEmote) emoteFormData[k] = formData[k];
      else if (!rem && !isEmote) revisedFormData[k] = formData[k];
    }
    for (let elem of toDelete) {
      let name2 = elem.getAttribute("name");
      emoteFormData[`flags.theatre.emotes.${name2}`] = null;
    }
    return { emoteFormData, revisedFormData };
  }
  /**
   * Given the formdata, check the levels in the given html element that have data-edit
   * and add their values to the formData update
   *
   * @param formData (Object) : An object representing the formData that will be used to update the Entity.
   *
   * @return Object : An object represeting the formData, but updated with new entries to be updated.
   */
  _processUpdateLabels(formData) {
    const html = this.element;
    const dataLabels = html.querySelectorAll("label[data-edit]");
    for (const label of dataLabels) {
      const target = label.getAttribute("data-edit");
      formData[target] = label.textContent;
    }
    return formData;
  }
  /**
   * This defines how to update the subject of the form when the form is submitted
   *
   * @param event (Object) : event that triggered this update
   * @param formData (Object) : An object representing the formData that will be used to update the Entity.
   *
   * @private
   */
  static async #onSubmitForm(event2, form, sentFormData) {
    event2.preventDefault();
    let formData = sentFormData.object;
    formData["_id"] = this.object._id;
    Logger.debug(formData);
    let insertDirty = false;
    let baseInsert = formData["flags.theatre.baseinsert"];
    let optAlign = formData["flags.theatre.optalign"];
    let name2 = formData["flags.theatre.name"];
    let newBaseInsert = this.object.flags.theatre.baseinsert || (this.object.img ? this.object.img : CONSTANTS.DEFAULT_PORTRAIT);
    let newName = this.object.flags.theatre.name || this.object.name;
    let newAlign = this.object.flags.theatre.optalign || "top";
    let theatreId = `theatre-${this.object._id}`;
    let navItem = Theatre.instance.getNavItemById(theatreId);
    let cImg = Theatre.instance.getTheatreCoverPortrait();
    if (baseInsert !== this.object.flags.theatre.baseinsert) {
      Logger.debug("baseinsert changed!");
      insertDirty = true;
      newBaseInsert = baseInsert === "" ? this.object.img ? this.object.img : CONSTANTS.DEFAULT_PORTRAIT : baseInsert;
      if (navItem) {
        navItem.setAttribute("src", newBaseInsert);
        cImg.setAttribute("src", newBaseInsert);
      }
    }
    if (optAlign !== this.object.flags.theatre.optalign) {
      Logger.debug("optalign changed!");
      insertDirty = true;
      newAlign = optAlign === "" ? "top" : optAlign;
      if (navItem) navItem.setAttribute("optalign", newAlign);
    }
    if (name2 !== this.object.flags.theatre.name) {
      Logger.debug("name changed!");
      insertDirty = true;
      newName = name2 === "" ? this.object.name : name2;
      if (navItem) {
        navItem.setAttribute("name", newName);
        navItem.setAttribute("title", newName + (newName == this.object.name ? "" : ` (${this.object.name})`));
      }
    }
    formData = this._processUpdateLabels(formData);
    let resForms = this._verifyCustomEmotes(formData);
    if (!resForms) {
      return;
    }
    Logger.debug("Form data AFTER verification: ", resForms);
    let revisedFormData = resForms.revisedFormData;
    let emoteFormData = resForms.emoteFormData;
    let insert = Theatre.instance.getInsertById(theatreId);
    let container = insert ? insert.dockContainer : null;
    let app = Theatre.instance.pixiCTX;
    let insertEmote = Theatre.instance._getEmoteFromInsert(insert);
    let newSrcImg = null;
    let imgSrcs = [];
    for (let k in formData) {
      if (k.endsWith("insert") || k.endsWith("baseinsert")) {
        let oldValue = foundry.utils.getProperty(this.object, k);
        if (formData[k] !== oldValue) {
          let emote = k.match(/emotes\.[a-z0-9\-]+/);
          if (emote) emote = emote[0].replace(/emotes\./, "");
          let resName = formData[k];
          if (!resName || resName === "") {
            const formBaseInsert = formData["flags.theatre.baseinsert"];
            if (k.endsWith("insert") && !k.endsWith("baseinsert")) {
              if (formBaseInsert && formBaseInsert !== "") {
                resName = formBaseInsert;
              } else if (this.object.flags.theatre.baseinsert && this.object.flags.theatre.baseinsert != "") {
                resName = this.object.flags.theatre.baseinsert;
              } else {
                resName = this.object.img ? this.object.img : CONSTANTS.DEFAULT_PORTRAIT;
              }
            } else {
              resName = this.object.img ? this.object.img : CONSTANTS.DEFAULT_PORTRAIT;
            }
          }
          if (!await foundry.canvas.srcExists(resName)) {
            Logger.error("ERROR: Path %s does not exist!", true, resName);
            Logger.error(game.i18n.localize("Theatre.UI.Notification.BadFilepath") + `"${resName}"`, true);
            return;
          }
          imgSrcs.push({ imgpath: resName, resname: resName });
          if (insertEmote == emote || !emote) {
            newSrcImg = resName;
          }
        }
      }
    }
    const newData = foundry.utils.mergeObject(this.object, emoteFormData, { inplace: false });
    const emMerge = newData.flags.theatre.emotes;
    const nEmotes = {};
    for (const emProp in emMerge) {
      nEmotes[emProp] = emMerge[emProp];
    }
    revisedFormData["flags.theatre.emotes"] = nEmotes;
    Logger.debug("Final Push Config update:", revisedFormData);
    this.object.update(revisedFormData).then(() => {
      if (imgSrcs.length > 0) {
        Logger.debug("sending imgSrcs for replaceAllTextures", imgSrcs);
        Theatre.instance._AddAllTextureResources(
          imgSrcs,
          theatreId,
          insertEmote,
          newSrcImg,
          (loader, resources) => {
            Logger.debug("texture additions complete! ", newSrcImg, insertEmote);
            if (app && container && newSrcImg) {
              Logger.debug("RE-RENDERING with NEW texture resource %s ", newSrcImg);
              if (insert.emote && this.object.flags.theatre.emotes[insert.emote].insert && this.object.flags.theatre.emotes[insert.emote].insert !== "") {
                this.object.flags.theatre.emotes[insert.emote].insert;
              } else if (this.object.flags.theatre.baseinsert && this.object.flags.theatre.baseinsert !== "") {
                this.object.flags.theatre.baseinsert;
              } else if (this.object.img && this.object.img !== "") {
                this.object.img;
              }
              insert.optAlign = newAlign;
              insert.name = newName;
              insert.label.text = newName;
              Theatre.instance._clearPortraitContainer(theatreId);
              Theatre.instance._setupPortraitContainer(theatreId, newAlign, newSrcImg, resources);
              insert.dockContainer.addChild(insert.label);
              insert.dockContainer.addChild(insert.typingBubble);
              Theatre.instance._repositionInsertElements(insert);
              if (!Theatre.instance.rendering) {
                Theatre.instance._renderTheatre(performance.now());
              }
            }
          },
          false
        );
        insertDirty = false;
      }
      if (insertDirty && insert) {
        Logger.debug("Insert is dirty, re-render it!");
        let resName = CONSTANTS.DEFAULT_PORTRAIT;
        if (insert.emote && this.object.flags.theatre.emotes[insert.emote].insert && this.object.flags.theatre.emotes[insert.emote].insert !== "") {
          resName = this.object.flags.theatre.emotes[insert.emote].insert;
        } else if (this.object.flags.theatre.baseinsert && this.object.flags.theatre.baseinsert !== "") {
          resName = this.object.flags.theatre.baseinsert;
        } else if (this.object.img && this.object.img !== "") {
          resName = this.object.img;
        }
        insert.optAlign = newAlign;
        insert.name = newName;
        insert.label.text = newName;
        const proxy = new Proxy(
          {},
          {
            get: /* @__PURE__ */ __name(function(target, name3) {
              return PIXI.Assets.cache.get(name3);
            }, "get")
          }
        );
        Theatre.instance._clearPortraitContainer(theatreId);
        Theatre.instance._setupPortraitContainer(theatreId, newAlign, resName, proxy);
        insert.dockContainer.addChild(insert.label);
        insert.dockContainer.addChild(insert.typingBubble);
        Theatre.instance._repositionInsertElements(insert);
        if (!Theatre.instance.rendering) {
          Theatre.instance._renderTheatre(performance.now());
        }
      }
      if (theatreId === Theatre.instance.speakingAs) {
        return;
      }
      Theatre.instance.renderEmoteMenu();
      if (insertDirty) {
        Theatre.instance._sendSceneEvent("renderinsert", { insertid: theatreId });
      }
    });
  }
  /**
   * Adds a new Custom emote, constructing the HTML to be injected
   *
   * @param ev (Event) triggered event
   *
   * @private
   */
  static _onAddEmoteLine(ev) {
    Logger.debug("Add Emote Pressed!");
    const emoteContainer = ev.target.parentNode;
    const formEmoteElems = emoteContainer.getElementsByClassName("theatre-config-form-group");
    const customElems = [];
    for (const elem of formEmoteElems) {
      const eName = elem.getAttribute("name");
      if (eName && eName.startsWith("custom"))
        customElems.push({ sortidx: Number(eName.match(/\d+/)[0]), elem });
    }
    customElems.sort((a, b) => {
      return a.sortidx - b.sortidx;
    });
    const customIdx = customElems.length > 0 ? customElems[customElems.length - 1].sortidx + 1 : 1;
    const customObjElems = [];
    for (const k in this.object.flags.theatre.emotes) {
      const eName = k;
      if (this.object.flags.theatre.emotes[k] !== null && eName && eName.startsWith("custom"))
        customObjElems.push({
          sortidx: Number(eName.match(/\d+/)[0]),
          elem: this.object.flags.theatre.emotes[k]
        });
    }
    customObjElems.sort((a, b) => {
      return a.sortidx - b.sortidx;
    });
    const customObjIdx = customObjElems.length > 0 ? customObjElems[customObjElems.length - 1].sortidx + 1 : 1;
    const customName = `custom${Math.max(customIdx, customObjIdx)}`;
    const formGroup = document.createElement("div");
    const emoteNameInput = document.createElement("input");
    const emoteIconHolder = document.createElement("div");
    const emoteIcon = document.createElement("img");
    const fileButton = document.createElement("file-picker");
    const fileIcon = document.createElement("i");
    KHelpers$1.addClass(formGroup, "theatre-config-form-group");
    KHelpers$1.addClass(emoteIconHolder, "theatre-emote-icon");
    KHelpers$1.addClass(emoteIconHolder, "file-picker");
    KHelpers$1.addClass(emoteIcon, "customicon");
    KHelpers$1.addClass(fileButton, "file-picker");
    KHelpers$1.addClass(fileIcon, "fas");
    KHelpers$1.addClass(fileIcon, "fa-file-import");
    KHelpers$1.addClass(fileIcon, "fa-fw");
    formGroup.setAttribute("name", customName);
    emoteNameInput.setAttribute("type", "text");
    emoteNameInput.setAttribute("name", `flags.theatre.emotes.${customName}.label`);
    emoteNameInput.setAttribute("data-dtype", "String");
    emoteNameInput.setAttribute("placeholder", game.i18n.localize("Theatre.UI.Config.CustomEmotePlaceholder"));
    emoteNameInput.value = game.i18n.localize("Theatre.UI.Config.CustomEmotePlaceholder");
    emoteNameInput.addEventListener("focusout", this._onCustomLabelInputFocusOut.bind(this));
    fileButton.setAttribute("type", "image");
    fileButton.setAttribute("name", `flags.theatre.emotes.${customName}.insert`);
    fileButton.setAttribute("data-dtype", "String");
    fileButton.setAttribute("placeholder", game.i18n.localize("Theatre.UI.Config.PathPlaceholder"));
    emoteIcon.setAttribute("data-edit", `flags.theatre.emotes.${customName}.image`);
    emoteIcon.setAttribute("src", CONSTANTS.ICONLIB + "/blank.png");
    emoteIcon.setAttribute("title", game.i18n.localize("Theatre.UI.Title.ChooseEmoteIcon"));
    emoteIcon.setAttribute("data-action", "onCustomIconImage");
    emoteIconHolder.appendChild(emoteIcon);
    fileButton.appendChild(fileIcon);
    formGroup.appendChild(emoteNameInput);
    formGroup.appendChild(emoteIconHolder);
    formGroup.appendChild(fileButton);
    KHelpers$1.insertBefore(formGroup, ev.target);
    this.activateListeners();
    emoteNameInput.focus();
  }
  /**
   * Handle changing customEmote image by
   *
   * @param ev (Event) triggered event
   *
   * @private
   */
  static _onCustomIconImage(ev) {
    const target = ev.target;
    new foundry.applications.apps.FilePicker({
      type: "image",
      current: target.getAttribute("src"),
      callback: /* @__PURE__ */ __name((path) => {
        target.src = path;
      }, "callback"),
      top: this.position.top + 40,
      left: this.position.left + 10
    }).browse(target.getAttribute("src"));
  }
  /**
   * Handle click event for the custom name label to allow it to be editable
   *
   * @param ev (Event) triggered event
   *
   * @private
   */
  _onCustomLabelClick(ev) {
    ev.stopPropagation();
    const inputLabel = document.createElement("input");
    inputLabel.setAttribute("type", "text");
    inputLabel.setAttribute(
      "name",
      `flags.theatre.emotes.${ev.currentTarget.parentNode.getAttribute("name")}.label`
    );
    inputLabel.setAttribute("data-dtype", "String");
    inputLabel.setAttribute("placeholder", game.i18n.localize("Theatre.UI.Config.CustomEmotePlaceholder"));
    inputLabel.setAttribute("value", ev.currentTarget.textContent);
    inputLabel.addEventListener("focusout", this._onCustomLabelInputFocusOut.bind(this));
    KHelpers$1.insertBefore(inputLabel, ev.currentTarget);
    inputLabel.select();
    inputLabel.focus();
    ev.currentTarget.parentNode.removeChild(ev.currentTarget);
  }
  /**
   * Handle mouse enter event for custom emote label to show the tool dock
   *
   * @param ev (Event) triggered event
   *
   * @private
   */
  _onCustomLabelMouseEnter(ev) {
    const dock = ev.currentTarget.getElementsByClassName("theatre-config-emote-label-dock")[0];
    dock.style.display = "flex";
  }
  /**
   * Handle mouse enter event for custom emote label to show the tool dock
   *
   * @param ev (Event) triggered event
   *
   * @private
   */
  _onCustomLabelMouseLeave(ev) {
    const dock = ev.currentTarget.getElementsByClassName("theatre-config-emote-label-dock")[0];
    dock.style.display = "none";
  }
  /**
   * Handle updating the custom label/input on focus loss
   *
   * @param ev (Event) triggered event
   *
   * @private
   */
  _onCustomLabelInputFocusOut(ev) {
    const label = document.createElement("label");
    const dock = document.createElement("div");
    const deleteIcon = document.createElement("i");
    KHelpers$1.addClass(label, "theatre-config-emote-label");
    KHelpers$1.addClass(label, "customlabel");
    KHelpers$1.addClass(dock, "theatre-config-emote-label-dock");
    KHelpers$1.addClass(deleteIcon, "fas");
    KHelpers$1.addClass(deleteIcon, "fa-trash");
    label.textContent = ev.currentTarget.value;
    label.setAttribute("title", game.i18n.localize("Theatre.UI.Title.ChooseEmoteName"));
    label.setAttribute(
      "data-edit",
      `flags.theatre.emotes.${ev.currentTarget.parentNode.getAttribute("name")}.label`
    );
    dock.setAttribute("title", game.i18n.localize("Theatre.UI.Title.DeleteCustomEmote"));
    dock.appendChild(deleteIcon);
    label.appendChild(dock);
    KHelpers$1.insertBefore(label, ev.currentTarget);
    this._setupCustomLabelEvents(label);
    ev.currentTarget.parentNode.removeChild(ev.currentTarget);
  }
  /**
   * Handle updating the custom label/input on click
   *
   * @param ev (Event) triggered event
   *
   * @private
   */
  _onCustomLabelDockClick(ev) {
    const formGroup = KHelpers$1.seekParentClass(ev.currentTarget, "theatre-config-form-group", 5);
    if (!formGroup) return;
    formGroup.setAttribute("todelete", true);
    formGroup.style.left = "20px";
    formGroup.style.transform = "scale(0.75)";
    formGroup.style.opacity = "0.25";
    ev.stopPropagation();
    formGroup.addEventListener("click", this._onUndoDockDelete.bind(this));
  }
  /**
   * Undo a custom emote item delete
   *
   * @param ev (Event) triggered event
   *
   * @private
   */
  _onUndoDockDelete(ev) {
    Logger.debug("undo delete!");
    ev.stopPropagation();
    ev.currentTarget.removeAttribute("todelete");
    ev.currentTarget.style.left = "0";
    ev.currentTarget.style.transform = "scale(1)";
    ev.currentTarget.style.opacity = "1";
  }
  /**
   * Setup the custom name label with several events
   *
   * @param label (HTMLElement) : Label HTML element to setup
   *
   * @private
   */
  _setupCustomLabelEvents(label) {
    label.addEventListener("click", this._onCustomLabelClick.bind(this));
    label.addEventListener("mouseenter", this._onCustomLabelMouseEnter.bind(this));
    label.addEventListener("mouseleave", this._onCustomLabelMouseLeave.bind(this));
    const dock = label.getElementsByClassName("theatre-config-emote-label-dock")[0];
    dock.addEventListener("click", this._onCustomLabelDockClick.bind(this));
  }
}
class TheatreHelpers {
  static {
    __name(this, "TheatreHelpers");
  }
  /**
   * Reorder theatre inserts in the dockContainer to align with where their
   * text-box's position is on the bar such that the insert is always over
   * the corresponding text-box.
   *
   */
  static reorderInserts() {
    if (!Theatre.instance) {
      return;
    }
    let boxes = Theatre.instance._getTextBoxes();
    let containerWidth = Theatre.instance.theatreDock.offsetWidth;
    let fontSize = Math.floor(Math.max(Math.min(containerWidth / boxes.length, 500) / 500 * 28, 18));
    Logger.debug("Reorder CALCUALTED FONT SIZE: ", fontSize);
    for (let textBox of boxes) {
      let theatreId = textBox.getAttribute("imgid");
      let insert = Theatre.instance.getInsertById(theatreId);
      if (!insert) {
        Theatre.instance._removeTextBoxFromTheatreBar(textBox);
        continue;
      }
      if (!insert.portrait || !insert.label) {
        Logger.warn("WARN: %s : %s was not ready!", false, insert.name, insert.imgId);
        continue;
      }
      if (textBox.getAttribute("deleting")) continue;
      Logger.debug("repositioning %s :", theatreId, insert);
      let offset = KHelpers$1.offset(textBox);
      let leftPos = Math.round(
        Number(offset.left || 0) - Number(KHelpers$1.style(textBox)["left"].match(/\-*\d+\.*\d*/) || 0) - Number(KHelpers$1.style(Theatre.instance.theatreBar)["margin-left"].match(/\-*\d+\.*\d*/) || 0)
      );
      if (insert.exitOrientation == "left") {
        Logger.debug(
          "LEFT (name: %s): ",
          insert.nameOrientation,
          leftPos,
          insert.name,
          Theatre.instance.theatreBar.offsetWidth / 2
        );
        if (leftPos + insert.dockContainer.width / 2 > Theatre.instance.theatreBar.offsetWidth / 2) {
          Logger.log("swapping " + insert.name + " to right alignment from left");
          insert.exitOrientation = "right";
        }
      } else {
        Logger.debug(
          "RIGHT (name: %s): ",
          insert.nameOrientation,
          leftPos,
          insert.name,
          Theatre.instance.theatreBar.offsetWidth / 2
        );
        if (leftPos + insert.dockContainer.width / 2 <= Theatre.instance.theatreBar.offsetWidth / 2) {
          Logger.debug("swapping " + insert.name + " to left alignment from right");
          insert.exitOrientation = "left";
        }
      }
      insert.label.style.fontSize = game.settings.get(CONSTANTS.MODULE_ID, "nameFontSize");
      insert.label.style.lineHeight = game.settings.get(CONSTANTS.MODULE_ID, "nameFontSize") * 1.5;
      insert.label.style.wordWrap = false;
      insert.label.style.wordWrapWidth = insert.portrait.width;
      let labelExceeds = insert.label.width + 20 + insert.label.style.fontSize > textBox.offsetWidth;
      let preLabelWidth = insert.label.width;
      insert.label.style.wordWrap = true;
      insert.label.style.wordWrapWidth = textBox.offsetWidth;
      if (labelExceeds) {
        let titleFontSize = Math.floor(Math.max(Math.min(containerWidth / boxes.length, 600) / 600 * 44, 28));
        insert.label.style.fontSize = titleFontSize;
        insert.label.style.lineHeight = titleFontSize * 1.5;
      }
      if (insert.nameOrientation == "left") {
        insert.label.x = 20;
        insert.typingBubble.anchor.set(0.5);
        insert.typingBubble.x = Math.min(
          preLabelWidth + 20 + insert.typingBubble.width / 2,
          textBox.offsetWidth - insert.typingBubble.width / 2
        );
      } else {
        if (labelExceeds) {
          insert.label.x = insert.portrait.width - insert.label.width - 20;
          if (insert.label.width - 20 > insert.portrait.width)
            insert.typingBubble.x = Math.min(
              insert.portrait.width - insert.label.width - insert.typingBubble.texture.width / 2 - 20,
              insert.typingBubble.width / 2
            );
          else
            insert.typingBubble.x = Math.max(
              insert.portrait.width - insert.label.width - insert.typingBubble.texture.width / 2 - 20,
              insert.typingBubble.width / 2
            );
        } else {
          insert.label.x = insert.portrait.width - preLabelWidth - 20;
          if (preLabelWidth - 20 > insert.portrait.width)
            insert.typingBubble.x = Math.min(
              insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width / 2 - 20,
              insert.typingBubble.width / 2
            );
          else
            insert.typingBubble.x = Math.max(
              insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width / 2 - 20,
              insert.typingBubble.width / 2
            );
        }
        insert.typingBubble.anchor.set(0.5);
        leftPos += textBox.offsetWidth - insert.portrait.width;
      }
      insert.typingBubble.y = insert.portrait.height - (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight + insert.typingBubble.height / 2;
      if (labelExceeds) {
        let divisor = Math.round(insert.label.height / insert.label.style.lineHeight);
        insert.label.y = insert.portrait.height - (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight * divisor;
      } else {
        insert.label.y = insert.portrait.height - (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight;
      }
      insert.typingBubble.rotation = 0.1745;
      insert.dockContainer.y = Theatre.instance.theatreDock.offsetHeight - (insert.optAlign == "top" ? Theatre.instance.theatreBar.offsetHeight : 0) - insert.portrait.height;
      switch (Theatre.instance.settings.theatreStyle) {
        case "lightbox":
          insert.dockContainer.y += insert.optAlign == "top" ? 8 : 0;
          insert.label.y -= insert.optAlign == "top" ? 8 : 0;
          break;
        case "clearbox":
          insert.dockContainer.y = Theatre.instance.theatreDock.offsetHeight - insert.portrait.height;
          insert.label.y += insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight;
          insert.typingBubble.y += insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight;
          break;
      }
      let insertFontSize = fontSize;
      textBox.setAttribute("osize", insertFontSize);
      switch (Number(insert.textSize)) {
        case 3:
          insertFontSize *= 1.5;
          break;
        case 1:
          insertFontSize *= 0.5;
          break;
      }
      textBox.style["font-size"] = `${insertFontSize}px`;
      if (textBox.children[0] && textBox.children[0].tagName.toLowerCase() != "hr" && textBox.children[0].offsetHeight != insertFontSize) {
        for (let c of textBox.children) {
          if (c.tagName.toLowerCase() == "hr") continue;
          for (let sc of c.children) sc.style.height = `${insertFontSize}px`;
          c.style.height = `${insertFontSize}px`;
        }
      }
      insert.order = leftPos;
      insert.renderOrder = leftPos;
      let tweenId = "containerSlide";
      let tween = TweenMax.to(insert.dockContainer, 1, {
        //delay: 0.5,
        pixi: { x: leftPos, alpha: 1 },
        ease: Power4.easeOut,
        onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
          ctx._removeDockTween(imgId, this, tweenId2);
        }, "onComplete"),
        onCompleteParams: [Theatre.instance, insert.imgId, tweenId]
      });
      Theatre.instance._addDockTween(theatreId, tween, tweenId);
    }
    Theatre.instance.portraitDocks.sort((a, b) => {
      return a.order - b.order;
    });
  }
  /**
   * Set wither or not to display or hide theatre debug information.
   *
   * @params state (Boolean) : Boolean indicating if we should toggle debug on/off
   */
  static setDebug(state) {
    if (state) {
      game.settings.set(CONSTANTS.MODULE_ID, "debug", true);
      for (let insert of Theatre.instance.portraitDocks) {
        Theatre.instance.renderInsertById(insert.imgId);
      }
    } else {
      game.settings.set(CONSTANTS.MODULE_ID, "debug", false);
      for (let insert of Theatre.instance.portraitDocks) {
        Theatre.instance.renderInsertById(insert.imgId);
      }
    }
  }
  static _isDebugActive() {
    return game.settings.get(CONSTANTS.MODULE_ID, "debug");
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
      case "power1In":
        return Power1.easeIn;
      case "power1InOut":
        return Power1.easeInOut;
      case "power2":
      case "power2Out":
        return Power2.easeOut;
      case "power2In":
        return Power2.easeIn;
      case "power2InOut":
        return Power2.easeInOut;
      case "power3":
      case "power3Out":
        return Power3.easeOut;
      case "power3In":
        return Power3.easeIn;
      case "power3InOut":
        return Power3.easeInOut;
      case "power4":
      case "power4Out":
        return Power4.easeOut;
      case "power4In":
        return Power4.easeIn;
      case "power4InOut":
        return Power4.easeInOut;
      case "back":
      case "backOut":
        return Back.easeOut;
      case "backIn":
        return Back.easeIn;
      case "backInOut":
        return Back.easeInOut;
      case "elastic":
      case "elasticOut":
        return Elastic.easeOut;
      case "elasticIn":
        return Elastic.easeIn;
      case "elasticInOut":
        return Elastic.easeInOut;
      case "bounce":
      case "bounceOut":
        return Bounce.easeOut;
      case "bounceIn":
        return Bounce.easeIn;
      case "bounceInOut":
        return Bounce.easeInOut;
      case "circ":
      case "circOut":
        return Circ.easeOut;
      case "circIn":
        return Circ.easeIn;
      case "circInOut":
        return Circ.easeInOut;
      case "expo":
      case "expoOut":
        return Expo.easeOut;
      case "expoIn":
        return Expo.easeIn;
      case "expoInOut":
        return Expo.easeInOut;
      case "sine":
      case "sineOut":
        return Sine.easeOut;
      case "sineIn":
        return Sine.easeIn;
      case "sineInOut":
        return Sine.easeInOut;
      case "power0":
      default:
        return Power0.easeNone;
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
    if (!str || typeof str != "string") {
      return null;
    }
    Logger.debug("verifying syntax %s", str);
    let tweenParams = [];
    try {
      let sections = str.split("|");
      let resName = sections[0];
      let verifyTarget = /* @__PURE__ */ __name(function(target) {
        return true;
      }, "verifyTarget");
      for (let sdx = 1; sdx < sections.length; ++sdx) {
        let parts = sections[sdx].split(";");
        let idx2 = 0;
        let duration, advOptions, targets, propDefs;
        duration = Number(parts[idx2]) || 1;
        if (/\([^\)\(]*\)/g.test(parts[++idx2])) {
          advOptions = parts[idx2];
          idx2++;
        }
        if (advOptions) {
          advOptions = advOptions.replace(/[\(\)]/g, "");
          let advParts = advOptions.split(",");
          advOptions = {};
          for (let advPart of advParts) {
            let components = advPart.split(":");
            if (components.length !== 2) {
              throw Logger.error("component properties definition : " + advPart + " is incorrect");
            }
            let advPropName = components[0].trim();
            let advPropValue = components[1].trim();
            advOptions[advPropName] = advPropValue;
          }
        }
        targets = [];
        propDefs = [];
        for (idx2; idx2 < parts.length; ++idx2) {
          targets.push(parts[idx2]);
        }
        for (let target of targets) {
          let components = target.split(":");
          if (components.length !== 2) {
            throw Logger.error("component properties definition : " + target + " is incorrect");
          }
          let propName = components[0];
          let scomps = components[1].split(",");
          if (scomps.length !== 2) {
            throw Logger.error("component properties definition : " + target + " is incorrect");
          }
          let init = scomps[0];
          let fin = scomps[1];
          if (verifyTarget(propName, init, fin)) {
            let propDef = { name: propName, initial: init, final: fin };
            propDefs.push(propDef);
          }
        }
        Logger.debug("Animation Syntax breakdown of %s : ", sections[sdx], duration, advOptions, propDefs);
        tweenParams.push({ resName, duration, advOptions, props: propDefs });
      }
    } catch (e) {
      Logger.error("BAD ANIMATION SYNTAX: %s", true, e);
      return tweenParams;
    }
    Logger.debug("tween params are valid with: ", tweenParams);
    return tweenParams;
  }
  /**
   * Prepare fonts and return the list of fonts available
   *
   * @return (Array[(String)]) : The array of font familys to use.
   */
  static getFonts() {
    if (!Theatre.FONTS) {
      switch (game.i18n.lang) {
        case "cn":
          Theatre.instance.titleFont = "SourceHanSerifSC-Medium";
          Theatre.instance.textFont = "BianHeiti";
          Theatre.instance.fontWeight = "normal";
          Theatre.FONTS = ["SourceHanSerifSC-Medium", "BianHeiti"];
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
      FontsLoader.load({
        custom: {
          families: [Theatre.instance.titleFont, Theatre.instance.textFont]
        }
      });
      let oFonts = [];
      for (let idx2 = Theatre.FONTS.length - 1; idx2 >= 0; --idx2) {
        if (Theatre.FONTS[idx2] == Theatre.instance.titleFont || Theatre.FONTS[idx2] == Theatre.instance.textFont)
          continue;
        oFonts.push(Theatre.FONTS[idx2]);
      }
      var aLoader = /* @__PURE__ */ __name(async function(fonts) {
        FontsLoader.load({
          custom: {
            families: fonts
          }
        });
      }, "aLoader");
      aLoader(oFonts);
    }
    return Theatre.FONTS;
  }
  static getActorDisplayName(actorId) {
    const actor = game.actors.get(actorId);
    if (game.modules.get("anonymous")?.active) {
      return game.modules.get("anonymous").api.getName(actor);
    }
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
  static getActorEmotes(actorId, disableDefault) {
    let actor = game.actors.get(actorId);
    let ae, de, re;
    if (actor && actor.flags.theatre) {
      ae = actor.flags.theatre.emotes;
      if (disableDefault) {
        re = ae;
      } else {
        de = Theatre.getDefaultEmotes();
        re = foundry.utils.mergeObject(de, ae);
      }
    } else re = Theatre.getDefaultEmotes();
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
    let ar, dr, rr;
    dr = Theatre.getDefaultRiggingResources();
    if (actor && actor.flags.theatre && actor.flags.theatre.rigging && actor.flags.theatre.rigging.resources) {
      ar = actor.flags.theatre.rigging.resources;
      rr = defaultRiggingResources.concat(ar);
    } else rr = dr;
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
      { name: "angry", path: "modules/theatre/assets/graphics/bubbles/angry.png" },
      { name: "frustrated", path: "modules/theatre/assets/graphics/bubbles/frustrated.png" },
      { name: "annoyed", path: "modules/theatre/assets/graphics/bubbles/annoyed.png" },
      { name: "hearts", path: "modules/theatre/assets/graphics/bubbles/hearts.png" },
      { name: "sleeping", path: "modules/theatre/assets/graphics/bubbles/sleeping.png" },
      { name: "surprised", path: "modules/theatre/assets/graphics/bubbles/surprised.png" },
      { name: "confused", path: "modules/theatre/assets/graphics/bubbles/confused.png" },
      { name: "awe-struck", path: "modules/theatre/assets/graphics/bubbles/awe-struck.png" },
      { name: "kiss", path: "modules/theatre/assets/graphics/bubbles/kiss.png" },
      { name: "blushing", path: "modules/theatre/assets/graphics/bubbles/blushing.png" },
      { name: "cry", path: "modules/theatre/assets/graphics/bubbles/cry.png" },
      { name: "dissatisfied", path: "modules/theatre/assets/graphics/bubbles/dissatisfied.png" },
      { name: "dizzy", path: "modules/theatre/assets/graphics/bubbles/dizzy.png" },
      { name: "evil", path: "modules/theatre/assets/graphics/bubbles/evil.png" },
      { name: "frown", path: "modules/theatre/assets/graphics/bubbles/frown.png" },
      { name: "happy", path: "modules/theatre/assets/graphics/bubbles/happy.png" },
      { name: "grin", path: "modules/theatre/assets/graphics/bubbles/grin.png" },
      { name: "happytears", path: "modules/theatre/assets/graphics/bubbles/happytears.png" },
      { name: "laughing", path: "modules/theatre/assets/graphics/bubbles/laughing.png" },
      { name: "laughingsquint", path: "modules/theatre/assets/graphics/bubbles/laughingsquint.png" },
      { name: "meh", path: "modules/theatre/assets/graphics/bubbles/meh.png" },
      { name: "worried", path: "modules/theatre/assets/graphics/bubbles/worried.png" },
      { name: "panic", path: "modules/theatre/assets/graphics/bubbles/panic.png" },
      { name: "rofl", path: "modules/theatre/assets/graphics/bubbles/rofl.png" },
      { name: "sad", path: "modules/theatre/assets/graphics/bubbles/sad.png" },
      { name: "scared", path: "modules/theatre/assets/graphics/bubbles/scared.png" },
      { name: "smile", path: "modules/theatre/assets/graphics/bubbles/smile.png" },
      { name: "playful", path: "modules/theatre/assets/graphics/bubbles/playful.png" },
      { name: "smug", path: "modules/theatre/assets/graphics/bubbles/smug.png" },
      { name: "tongue", path: "modules/theatre/assets/graphics/bubbles/tongue.png" },
      { name: "wink", path: "modules/theatre/assets/graphics/bubbles/wink.png" },
      { name: "speechless", path: "modules/theatre/assets/graphics/bubbles/speechless.png" },
      { name: "thinking", path: "modules/theatre/assets/graphics/bubbles/thinking.png" },
      { name: "idea", path: "modules/theatre/assets/graphics/bubbles/idea.png" },
      { name: "serious", path: "modules/theatre/assets/graphics/bubbles/serious.png" },
      { name: "innocent", path: "modules/theatre/assets/graphics/bubbles/innocent.png" },
      { name: "carefree", path: "modules/theatre/assets/graphics/bubbles/carefree.png" },
      // effects
      { name: "swirl", path: "modules/theatre/assets/graphics/effects/swirl.png" },
      { name: "sweatdrop", path: "modules/theatre/assets/graphics/effects/sweatdrop.png" },
      { name: "notice", path: "modules/theatre/assets/graphics/effects/notice.png" },
      { name: "loud", path: "modules/theatre/assets/graphics/effects/loud.png" },
      { name: "semiloud", path: "modules/theatre/assets/graphics/effects/semi-loud.png" },
      { name: "veins", path: "modules/theatre/assets/graphics/effects/veins.png" },
      { name: "veins_red", path: "modules/theatre/assets/graphics/effects/veins_red.png" },
      { name: "twisty", path: "modules/theatre/assets/graphics/effects/twisty.png" },
      { name: "glimmer", path: "modules/theatre/assets/graphics/effects/glimmer.png" },
      { name: "heart", path: "modules/theatre/assets/graphics/effects/heart.png" },
      { name: "puff", path: "modules/theatre/assets/graphics/effects/puff.png" },
      { name: "line", path: "modules/theatre/assets/graphics/effects/line.png" },
      { name: "linesteep", path: "modules/theatre/assets/graphics/effects/line_steep.png" },
      { name: "star", path: "modules/theatre/assets/graphics/effects/star.png" },
      { name: "musicnote", path: "modules/theatre/assets/graphics/effects/musicnote.png" },
      //{name: "ghostball", path: "modules/theatre/assets/graphics/effects/ghostball.png"},
      { name: "ghostball1", path: "modules/theatre/assets/graphics/effects/ghostball1.png" },
      { name: "ghostball2", path: "modules/theatre/assets/graphics/effects/ghostball2.png" },
      { name: "scribbleball", path: "modules/theatre/assets/graphics/effects/scribbleball.png" },
      { name: "thoughtbubble", path: "modules/theatre/assets/graphics/effects/thoughtbubble.png" },
      { name: "bubbledot", path: "modules/theatre/assets/graphics/effects/bubbledot.png" },
      { name: "dot", path: "modules/theatre/assets/graphics/effects/dot.png" },
      { name: "ziggy", path: "modules/theatre/assets/graphics/effects/ziggy.png" },
      { name: "sinking", path: "modules/theatre/assets/graphics/effects/sinking.png" },
      { name: "zzz", path: "modules/theatre/assets/graphics/effects/zzz.png" },
      { name: "lightbulb", path: "modules/theatre/assets/graphics/effects/lightbulb.png" },
      { name: "sigh", path: "modules/theatre/assets/graphics/effects/sigh.png" },
      { name: "halo", path: "modules/theatre/assets/graphics/effects/halo.png" },
      { name: "blush", path: "modules/theatre/assets/graphics/effects/blush.png" },
      { name: "miasma", path: "modules/theatre/assets/graphics/effects/miasma.png" },
      { name: "darkness", path: "modules/theatre/assets/graphics/effects/darkness.png" },
      { name: "tears", path: "modules/theatre/assets/graphics/effects/tears.png" }
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
      smile: {
        name: "smile",
        fatype: "far",
        faname: "fa-smile",
        label: game.i18n.localize("Theatre.Emote.Smile"),
        rigging: {
          animations: [{ name: "smile", syntax: "smile|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" }]
        }
      },
      grin: {
        name: "grin",
        fatype: "far",
        faname: "fa-grin",
        label: game.i18n.localize("Theatre.Emote.Grin"),
        rigging: {
          animations: [{ name: "grin", syntax: "grin|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" }]
        }
      },
      happy: {
        name: "happy",
        fatype: "far",
        faname: "fa-smile-beam",
        label: game.i18n.localize("Theatre.Emote.Happy"),
        rigging: {
          animations: [
            { name: "happy", syntax: "happy|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            { name: "line_a", syntax: "line|0.5;(ease:bounce);x:45%,40%;y:5%,0%;rotation:-20,-20" },
            { name: "line_b", syntax: "line|0.5;(ease:bounce);x:35%,25%;y:15%,12%;rotation:-65,-65" },
            { name: "line_c", syntax: "line|0.5;(ease:bounce);x:55%,60%;y:5%,0%;rotation:20,20" },
            { name: "line_d", syntax: "line|0.5;(ease:bounce);x:65%,75%;y:15%,12%;rotation:65,65" }
          ]
        }
      },
      happytears: {
        name: "happytears",
        fatype: "far",
        faname: "fa-grin-tears",
        label: game.i18n.localize("Theatre.Emote.HappyTears"),
        rigging: {
          animations: [
            { name: "happytears", syntax: "happytears|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "line_a",
              syntax: "line|0.5;(ease:bounce);x:40%,35%;y:5%,0%;rotation:-20,-20|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5"
            },
            {
              name: "line_b",
              syntax: "line|0.5;(ease:bounce);x:30%,20%;y:15%,12%;rotation:-65,-65|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5"
            },
            {
              name: "line_c",
              syntax: "line|0.5;(ease:bounce);x:60%,65%;y:5%,0%;rotation:20,20|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5"
            },
            {
              name: "line_d",
              syntax: "line|0.5;(ease:bounce);x:70%,80%;y:15%,12%;rotation:65,65|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5"
            },
            {
              name: "tears_a",
              syntax: "tears|0.5;(repeat:-1,repeatDelay:1.7);x:60%,110%;y:25%,40%;rotation:-30,-30;alpha:0.5,0|0;scaleX:-1,-1"
            },
            {
              name: "tears_b",
              syntax: "tears|0.5;(repeat:-1,repeatDelay:0.8);x:40%,-10%;y:25%,40%;rotation:30,30;alpha:0.5,0"
            }
          ]
        }
      },
      dissatisfied: {
        name: "dissatisfied",
        fatype: "far",
        faname: "fa-frown-open",
        label: game.i18n.localize("Theatre.Emote.Dissatisfied"),
        rigging: {
          animations: [
            { name: "dissatisfied", syntax: "dissatisfied|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" }
          ]
        }
      },
      frown: {
        name: "frown",
        fatype: "far",
        faname: "fa-frown",
        label: game.i18n.localize("Theatre.Emote.Frown"),
        rigging: {
          animations: [
            { name: "frown", syntax: "frown|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            { name: "sinking", syntax: "sinking|0.5;(ease:power2);x:50%,50%;y:-20%,15%;alpha:0,0.5" }
          ]
        }
      },
      sad: {
        name: "sad",
        fatype: "far",
        faname: "fa-sad-tear",
        label: game.i18n.localize("Theatre.Emote.Sad"),
        rigging: {
          animations: [
            { name: "sad", syntax: "sad|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "swirl_a",
              syntax: "swirl|0.5;(ease:power4);x:110%,75%;y:0%,10%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            },
            {
              name: "swirl_b",
              syntax: "swirl|0.5;(ease:power4);x:110%,65%;y:0%,40%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            },
            {
              name: "swirl_c",
              syntax: "swirl|0.5;(ease:power4);x:110%,90%;y:110%,50%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            },
            {
              name: "swirl_d",
              syntax: "swirl|0.5;(ease:power4);x:110%,85%;y:110%,70%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            },
            {
              name: "swirl_e",
              syntax: "swirl|0.5;(ease:power4);x:-10%,25%;y:0%,15%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            },
            {
              name: "swirl_f",
              syntax: "swirl|0.5;(ease:power4);x:-10%,15%;y:0%,38%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            },
            {
              name: "swirl_g",
              syntax: "swirl|0.5;(ease:power4);x:-10%,20%;y:110%,55%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            },
            {
              name: "swirl_h",
              syntax: "swirl|0.5;(ease:power4);x:-10%,35%;y:110%,67%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            },
            {
              name: "swirl_i",
              syntax: "swirl|0.5;(ease:power4);x:-10%,10%;y:110%,85%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            },
            {
              name: "swirl_j",
              syntax: "swirl|0.5;(ease:power4);x:-10%,45%;y:110%,95%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            },
            {
              name: "swirl_k",
              syntax: "swirl|0.5;(ease:power4);x:110%,95%;y:110%,90%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            },
            {
              name: "swirl_l",
              syntax: "swirl|0.5;(ease:power4);x:110%,70%;y:110%,82%;alpha:0,1|1;(repeat:-1);rotation:0,360"
            }
          ]
        }
      },
      cry: {
        name: "cry",
        fatype: "far",
        faname: "fa-sad-cry",
        label: game.i18n.localize("Theatre.Emote.Cry"),
        rigging: {
          animations: [
            { name: "cry", syntax: "cry|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "tears_a",
              syntax: "tears|0.5;(repeat:-1,repeatDelay:0.7);x:60%,110%;y:25%,40%;rotation:-30,-30;alpha:0.5,0|0;scaleX:-1,-1"
            },
            {
              name: "tears_b",
              syntax: "tears|0.5;(repeat:-1,repeatDelay:0.3);x:40%,-10%;y:25%,40%;rotation:30,30;alpha:0.5,0"
            },
            {
              name: "tears_c",
              syntax: "tears|0.5;(repeat:-1,repeatDelay:0.8);x:60%,90%;y:25%,50%;rotation:-10,-10;alpha:0.5,0|0;scaleX:-1,-1"
            },
            {
              name: "tears_d",
              syntax: "tears|0.5;(repeat:-1,repeatDelay:1.0);x:40%,10%;y:25%,50%;rotation:10,10;alpha:0.5,0"
            },
            {
              name: "tears_e",
              syntax: "tears|0.5;(repeat:-1,repeatDelay:0.2);x:60%,90%;y:25%,30%;rotation:-50,-50;alpha:0.5,0|0;scaleX:-1,-1"
            },
            {
              name: "tears_f",
              syntax: "tears|0.5;(repeat:-1,repeatDelay:1.2);x:40%,10%;y:25%,30%;rotation:50,50;alpha:0.5,0"
            }
          ]
        }
      },
      serious: {
        name: "serious",
        fatype: "far",
        faname: "fa-meh-rolling-eyes",
        image: "modules/theatre/assets/graphics/emotes/serious.png",
        label: game.i18n.localize("Theatre.Emote.Serious"),
        rigging: {
          animations: [{ name: "serious", syntax: "serious|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" }]
        }
      },
      annoyed: {
        name: "annoyed",
        fatype: "far",
        faname: "fa-meh-rolling-eyes",
        label: game.i18n.localize("Theatre.Emote.Annoyed"),
        rigging: {
          animations: [
            { name: "annoyed", syntax: "annoyed|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "ziggy",
              syntax: "ziggy|0;x:25%,25%;y:20%,20%|0.25;(repeat:-1,yoyo:true);rotation:-2,2"
            },
            {
              name: "ziggy_2",
              syntax: "ziggy|1;(repeat:-1,delay:1,repeatDelay:2);scaleX:1,2;scaleY:1,2;x:25%,25%;y:20%,20%;alpha:0.5,0|0.25;(repeat:-1,yoyo:true);rotation:0,5"
            }
          ]
        }
      },
      frustrated: {
        name: "frustrated",
        fatype: "far",
        faname: "fa-meh-rolling-eyes",
        image: "modules/theatre/assets/graphics/emotes/frustrated.png",
        label: game.i18n.localize("Theatre.Emote.Frustrated"),
        rigging: {
          animations: [
            { name: "frustrated", syntax: "frustrated|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "veins",
              syntax: "veins|0.5;x:45%,45%;y:10%,10%;alpha:0,1|1;(repeat:-1,yoyo:true,ease:bounce);scaleX:0.7,1;scaleY:0.7,1"
            }
          ]
        }
      },
      angry: {
        name: "angry",
        fatype: "far",
        faname: "fa-angry",
        label: game.i18n.localize("Theatre.Emote.Angry"),
        rigging: {
          animations: [
            { name: "angry", syntax: "angry|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "veins",
              syntax: "veins_red|0.5;x:45%,45%;y:10%,10%;alpha:0,1|1;(repeat:-1,yoyo:true,ease:elastic);scaleX:0.5,1;scaleY:0.5,1|0.25;(repeat:-1,yoyo:true);rotation:0,10"
            },
            {
              name: "puff_a",
              syntax: "puff|0;x:80%,80%;y:15%,15%;rotation:0,0|1;(repeat:-1,delay:1,yoyo:true,ease:power4);scaleX:0.3,1;scaleY:0.3,1;alpha:0,0.5"
            },
            {
              name: "puff_b",
              syntax: "puff|0;x:20%,20%;y:15%,15%;rotation:0,0|1;(repeat:-1,delay:1.5,yoyo:true,ease:power4);scaleX:-0.3,-1;scaleY:0.3,1;alpha:0,0.5"
            },
            {
              name: "puff_c",
              syntax: "puff|0;x:70%,70%;y:5%,5%;rotation:330,330|1;(repeat:-1,delay:2,yoyo:true,ease:power4);scaleX:0.3,1;scaleY:0.3,1;alpha:0,0.5"
            },
            {
              name: "puff_d",
              syntax: "puff|0;x:30%,30%;y:5%,5%;rotation:30,30|1;(repeat:-1,delay:2.5,yoyo:true,ease:power4);scaleX:-0.3,-1;scaleY:0.3,1;alpha:0,0.5"
            }
          ]
        }
      },
      laughing: {
        name: "laughing",
        fatype: "far",
        faname: "fa-laugh-beam",
        label: game.i18n.localize("Theatre.Emote.Laughing"),
        rigging: {
          animations: [
            { name: "laughing", syntax: "laughing|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "semiloud",
              syntax: "semiloud|0.5;x:25%,25%;y:20%,20%;alpha:0,1|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1|0.25;(repeat:-1,yoyo:true);rotation:-1,1"
            }
          ]
        }
      },
      laughingsquint: {
        name: "laughingsquint",
        fatype: "far",
        faname: "fa-laugh-squint",
        label: game.i18n.localize("Theatre.Emote.LaughingSquint"),
        rigging: {
          animations: [
            {
              name: "laughingsquint",
              syntax: "laughingsquint|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1"
            },
            {
              name: "loud",
              syntax: "loud|0.5;x:25%,25%;y:20%,20%;alpha:0,1|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1|0.125;(repeat:-1,yoyo:true);rotation:-1,1"
            }
          ]
        }
      },
      rofl: {
        name: "rofl",
        fatype: "far",
        faname: "fa-grin-squint-tears",
        label: game.i18n.localize("Theatre.Emote.ROFL"),
        rigging: {
          animations: [
            { name: "rofl", syntax: "rofl|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "loud_a",
              syntax: "loud|0.5;(ease:bounce);x:20%,20%;y:20%,20%;scaleX:0.1,1;scaleY:0.1,1|0.125;(repeat:-1,yoyo:true);rotation:-2,2"
            },
            {
              name: "loud_b",
              syntax: "loud|0.5;(ease:bounce);x:80%,80%;y:20%,20%;scaleX:-0.1,-1;scaleY:0.1,1|0.125;(repeat:-1,yoyo:true);rotation:-2,2"
            },
            {
              name: "loud_c",
              syntax: "loud|0;x:20%,20%;y:20%,20%|0.125;(repeat:-1,yoyo:true);rotation:-2,2|1;(repeat:-1);scaleX:1,1.5;scaleY:1,2;alpha:0.25,0"
            },
            {
              name: "loud_d",
              syntax: "loud|0;x:80%,80%;y:20%,20%|0.125;(repeat:-1,yoyo:true);rotation:-2,2|1;(repeat:-1);scaleX:-1,-1.5;scaleY:1,2;alpha:0.25,0"
            },
            {
              name: "tears_a",
              syntax: "tears|0.5;(repeat:-1,repeatDelay:1.7);x:60%,110%;y:25%,40%;rotation:-30,-30;alpha:0.5,0|0;scaleX:-1,-1"
            },
            {
              name: "tears_b",
              syntax: "tears|0.5;(repeat:-1,repeatDelay:0.8);x:40%,-10%;y:25%,40%;rotation:30,30;alpha:0.5,0"
            }
          ]
        }
      },
      worried: {
        name: "worried",
        fatype: "far",
        faname: "fa-grin-beam-sweat",
        label: game.i18n.localize("Theatre.Emote.Worried"),
        rigging: {
          animations: [
            { name: "worried", syntax: "worried|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            { name: "sweatdrop", syntax: "sweatdrop|2;(ease:bounce);x:30%,30%;y:0%,25%;alpha:0,1" }
          ]
        }
      },
      surprised: {
        name: "surprised",
        fatype: "far",
        faname: "fa-surprise",
        label: game.i18n.localize("Theatre.Emote.Surprised"),
        rigging: {
          animations: [
            { name: "surprised", syntax: "surprised|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "notice",
              syntax: "notice|0.5;x:25%,25%;y:20%,20%;alpha:0,1|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1"
            }
          ]
        }
      },
      "awe-struck": {
        name: "awe-struck",
        fatype: "far",
        faname: "fa-grin-stars",
        label: game.i18n.localize("Theatre.Emote.Awe-Struck"),
        rigging: {
          animations: [
            { name: "awe-struck", syntax: "awe-struck|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "glimmer_a",
              syntax: "glimmer|0.5;x:10%,10%;y:58%,58%|0.5;(delay:0.2,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "glimmer_b",
              syntax: "glimmer|0.5;x:85%,85%;y:20%,20%|0.5;(delay:0.3,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "glimmer_c",
              syntax: "glimmer|0.5;x:40%,40%;y:45%,45%|0.5;(delay:0.5,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "glimmer_d",
              syntax: "glimmer|0.5;x:35%,35%;y:30%,30%|0.5;(delay:0.6,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "glimmer_e",
              syntax: "glimmer|0.5;x:65%,65%;y:35%,35%|0.5;(delay:0.4,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "glimmer_f",
              syntax: "glimmer|0.5;x:80%,80%;y:50%,50%|0.5;(delay:0.1,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "glimmer_g",
              syntax: "glimmer|0.5;x:16%,16%;y:81%,81%|0.5;(delay:0.8,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "glimmer_h",
              syntax: "glimmer|0.5;x:55%,55%;y:64%,64%|0.5;(delay:0.9,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "glimmer_i",
              syntax: "glimmer|0.5;x:44%,44%;y:95%,95%|0.5;(delay:0.7,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "glimmer_j",
              syntax: "glimmer|0.5;x:67%,67%;y:84%,84%|0.5;(delay:0.35,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "glimmer_k",
              syntax: "glimmer|0.5;x:44%,44%;y:70%,70%|0.5;(delay:0,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "glimmer_l",
              syntax: "glimmer|0.5;x:20%,20%;y:23%,23%|0.5;(delay:0.65,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1"
            }
          ]
        }
      },
      blushing: {
        name: "blushing",
        fatype: "far",
        faname: "fa-flushed",
        label: game.i18n.localize("Theatre.Emote.Blushing"),
        rigging: {
          animations: [
            { name: "blushing", syntax: "blushing|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "blush",
              syntax: "blush|0.5;x:25%,25%;y:25%,25%|2;(ease:sineInOut,repeat:-1,yoyo:true);scaleX:0.9,1;scaleY:0.9,1;alpha:0.5,1|0.5;(repeat:-1,yoyo:true);rotation:-3,3"
            }
          ]
        }
      },
      hearts: {
        name: "hearts",
        fatype: "far",
        faname: "fa-grin-hearts",
        label: game.i18n.localize("Theatre.Emote.Hearts"),
        rigging: {
          animations: [
            { name: "hearts", syntax: "hearts|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "heart_a",
              syntax: "heart|2;(repeat:-1,delay:1.3);y:110%,-10%;alpha:1,0|0.5;(delay:0.1,repeat:-1,yoyo:true);x:5%,10%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"
            },
            {
              name: "heart_b",
              syntax: "heart|2;(repeat:-1,delay:0.3);y:110%,-10%;alpha:1,0|0.5;(delay:0.9,repeat:-1,yoyo:true);x:5%,10%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"
            },
            {
              name: "heart_c",
              syntax: "heart|2;(repeat:-1,delay:0.8);y:110%,-10%;alpha:1,0|0.5;(delay:0.2,repeat:-1,yoyo:true);x:15%,20%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"
            },
            {
              name: "heart_d",
              syntax: "heart|2;(repeat:-1,delay:0.5);y:110%,-10%;alpha:1,0|0.5;(delay:0.8,repeat:-1,yoyo:true);x:25%,30%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"
            },
            {
              name: "heart_e",
              syntax: "heart|2;(repeat:-1,delay:1.7);y:110%,-10%;alpha:1,0|0.5;(delay:0.3,repeat:-1,yoyo:true);x:35%,40%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"
            },
            {
              name: "heart_f",
              syntax: "heart|2;(repeat:-1,delay:2);y:110%,-10%;alpha:1,0|0.5;(delay:0.7,repeat:-1,yoyo:true);x:45%,50%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"
            },
            {
              name: "heart_g",
              syntax: "heart|2;(repeat:-1,delay:1.5);y:110%,-10%;alpha:1,0|0.5;(delay:0.4,repeat:-1,yoyo:true);x:55%,60%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"
            },
            {
              name: "heart_h",
              syntax: "heart|2;(repeat:-1,delay:0.7);y:110%,-10%;alpha:1,0|0.5;(delay:0.6,repeat:-1,yoyo:true);x:65%,70%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"
            },
            {
              name: "heart_i",
              syntax: "heart|2;(repeat:-1,delay:1.7);y:110%,-10%;alpha:1,0|0.5;(delay:0.5,repeat:-1,yoyo:true);x:75%,80%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"
            },
            {
              name: "heart_j",
              syntax: "heart|2;(repeat:-1,delay:0.4);y:110%,-10%;alpha:1,0|0.5;(delay:0.35,repeat:-1,yoyo:true);x:85%,90%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"
            },
            {
              name: "heart_k",
              syntax: "heart|2;(repeat:-1,delay:2.3);y:110%,-10%;alpha:1,0|0.5;(delay:0.25,repeat:-1,yoyo:true);x:95%,100%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1"
            }
          ]
        }
      },
      kiss: {
        name: "kiss",
        fatype: "far",
        faname: "fa-kiss-wink-heart",
        label: game.i18n.localize("Theatre.Emote.Kiss"),
        rigging: {
          animations: [
            { name: "kiss", syntax: "kiss|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "blowkiss",
              syntax: "heart|4;(ease:expo);x:45%,-10%;alpha:1,0|0.25;(repeat:6,yoyo:true);y:25%,30%|0.25;(repeat:6,yoyo:true,ease:power4);scaleX:0.8,1.5;scaleY:0.8,1.5"
            }
          ]
        }
      },
      thinking: {
        name: "thinking",
        fatype: "far",
        faname: "fa-blank",
        image: "modules/theatre/assets/graphics/emotes/thinking.png",
        label: game.i18n.localize("Theatre.Emote.Thinking"),
        rigging: {
          animations: [
            { name: "thinking", syntax: "thinking|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "thoughtbubble",
              syntax: "thoughtbubble|0.5;(ease:power3);x:25%,25%;y:10%,10%;alpha:0,1|0.5;(repeat:-1,yoyo:true);scaleX:0.95,1;scaleY:0.95,1"
            },
            {
              name: "bubbledot_a",
              syntax: "bubbledot|0.5;(ease:power3);x:28%,28%;y:18%,18%;alpha:0,1|1;(repeat:-1,yoyo:true,repeatDelay:0.3);scaleX:0.5,1;scaleY:0.5,1|5;(repeat:-1);rotation:0,360"
            },
            {
              name: "bubbledot_b",
              syntax: "bubbledot|0.5;(ease:power3);x:31%,31%;y:21%,21%;alpha:0,1|1;(repeat:-1,yoyo:true,repeatDelay:0.1);scaleX:0.5,1;scaleY:0.5,1|5;(repeat:-1);rotation:0,360"
            },
            {
              name: "bubbledot_c",
              syntax: "bubbledot|0.5;(ease:power3);x:34%,34%;y:24%,24%;alpha:0,1|1;(repeat:-1,yoyo:true,repeatDelay:0.5);scaleX:0.5,1;scaleY:0.5,1|5;(repeat:-1);rotation:0,360"
            }
          ]
        }
      },
      confused: {
        name: "confused",
        fatype: "far",
        faname: "fa-question-circle",
        image: "modules/theatre/assets/graphics/emotes/confused.png",
        label: game.i18n.localize("Theatre.Emote.Confused"),
        rigging: {
          animations: [
            { name: "confused", syntax: "confused|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "scribbleball",
              syntax: "scribbleball|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:45%,45%;y:0%,0%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:0,5"
            }
          ]
        }
      },
      idea: {
        name: "idea",
        fatype: "far",
        faname: "fa-lightbulb",
        image: "modules/theatre/assets/graphics/emotes/idea.png",
        label: game.i18n.localize("Theatre.Emote.Idea"),
        rigging: {
          animations: [
            { name: "idea", syntax: "idea|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "lightbulb",
              syntax: "lightbulb|0.5;(ease:bounce);x:50%,50%;y:-10%,-10%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:0,5|1;(repeat:-1,yoyo:true);scaleX:1,1.3;scaleY:1,1.3"
            }
          ]
        }
      },
      meh: {
        name: "meh",
        fatype: "far",
        faname: "fa-meh",
        label: game.i18n.localize("Theatre.Emote.Meh"),
        rigging: {
          animations: [
            { name: "meh", syntax: "meh|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "sigh",
              syntax: "sigh|3;(ease:power2);x:30%,10%;y:25%,45%;alpha:1,0;rotation:225,225;scaleX:1,1.5;scaleY:1,1.5"
            }
          ]
        }
      },
      smug: {
        name: "smug",
        fatype: "far",
        faname: "fa-grin-tongue-wink",
        image: "modules/theatre/assets/graphics/emotes/smug.png",
        label: game.i18n.localize("Theatre.Emote.Smug"),
        rigging: {
          animations: [{ name: "smug", syntax: "smug|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" }]
        }
      },
      wink: {
        name: "wink",
        fatype: "far",
        faname: "fa-grin-wink",
        label: game.i18n.localize("Theatre.Emote.Wink"),
        rigging: {
          animations: [
            { name: "wink", syntax: "wink|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "kawaii_a",
              syntax: "star|4;(ease:expo);x:45%,-10%;y:25%,25%;alpha:1,0|2;(repeat:4);rotation:0,360"
            },
            {
              name: "kawaii_b",
              syntax: "star|3;(ease:expo);x:45%,10%;y:25%,12%;alpha:1,0|2;(repeat:4);rotation:0,360"
            },
            {
              name: "kawaii_c",
              syntax: "star|3;(ease:expo);x:45%,10%;y:25%,38%;alpha:1,0|2;(repeat:4);rotation:0,360"
            }
          ]
        }
      },
      tongue: {
        name: "tongue",
        fatype: "far",
        faname: "fa-grin-tongue",
        label: game.i18n.localize("Theatre.Emote.Tongue"),
        rigging: {
          animations: [
            { name: "tongue", syntax: "tongue|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "kawaii",
              syntax: "star|4;(ease:expo,delay:2);x:30%,30%;y:25%,25%;alpha:1,0;scaleX:1.3,0.1;scaleY:1.3,0.1|2;(repeat:4);rotation:0,360"
            }
          ]
        }
      },
      playful: {
        name: "playful",
        fatype: "far",
        faname: "fa-grin-tongue-wink",
        label: game.i18n.localize("Theatre.Emote.Playful"),
        rigging: {
          animations: [
            { name: "playful", syntax: "playful|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "kawaii_a",
              syntax: "star|3;(ease:expo);x:40%,-10%;y:25%,-15%;alpha:1,0|2;(repeat:4);rotation:0,360"
            },
            {
              name: "kawaii_b",
              syntax: "star|4;(ease:expo);x:40%,-40%;y:25%,30%;alpha:1,0|2;(repeat:4);rotation:0,360"
            },
            {
              name: "kawaii_c",
              syntax: "star|3;(ease:expo);x:40%,-10%;y:25%,55%;alpha:1,0|2;(repeat:4);rotation:0,360"
            },
            {
              name: "kawaii_d",
              syntax: "star|3;(ease:expo);x:60%,110%;y:25%,-15%;alpha:1,0|2;(repeat:4);rotation:0,360"
            },
            {
              name: "kawaii_e",
              syntax: "star|4;(ease:expo);x:60%,140%;y:25%,30%;alpha:1,0|2;(repeat:4);rotation:0,360"
            },
            {
              name: "kawaii_f",
              syntax: "star|3;(ease:expo);x:60%,110%;y:25%,55%;alpha:1,0|2;(repeat:4);rotation:0,360"
            },
            {
              name: "kawaii_g",
              syntax: "star|4;(ease:expo);x:50%,50%;y:15%,-35%;alpha:1,0|2;(repeat:4);rotation:0,360"
            },
            {
              name: "kawaii_h",
              syntax: "star|4;(ease:expo);x:50%,50%;y:35%,85%;alpha:1,0|2;(repeat:4);rotation:0,360"
            }
          ]
        }
      },
      mischevious: {
        name: "mischevious",
        fatype: "fas",
        faname: "fa-book-dead",
        image: "modules/theatre/assets/graphics/emotes/evil.png",
        label: game.i18n.localize("Theatre.Emote.Mischevious"),
        rigging: {
          animations: [
            { name: "evil", syntax: "evil|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            { name: "shroud", syntax: "darkness|0;x:50%,50%;y:50%,50%" },
            {
              name: "miasma_a",
              syntax: "miasma|0;x:25%,25%;y:78%,78%|3;(repeat:-1,delay:0.3);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_b",
              syntax: "miasma|0;x:73%,73%;y:68%,68%|3;(repeat:-1,delay:1.3);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_c",
              syntax: "miasma|0;x:15%,15%;y:60%,60%|3;(repeat:-1,delay:0.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_d",
              syntax: "miasma|0;x:45%,45%;y:85%,85%|3;(repeat:-1,delay:2.6);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_e",
              syntax: "miasma|0;x:90%,90%;y:80%,80%|3;(repeat:-1,delay:3.5);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_f",
              syntax: "miasma|0;x:55%,55%;y:60%,60%|3;(repeat:-1,delay:2.1);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_g",
              syntax: "miasma|0;x:10%,10%;y:90%,90%|3;(repeat:-1,delay:3.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_h",
              syntax: "miasma|0;x:95%,95%;y:70%,70%|3;(repeat:-1,delay:1.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_i",
              syntax: "miasma|0;x:50%,50%;y:72%,72%|3;(repeat:-1,delay:5.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_j",
              syntax: "miasma|0;x:10%,10%;y:66%,66%|3;(repeat:-1,delay:3.6);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_k",
              syntax: "miasma|0;x:3%,3%;y:88%,88%|3;(repeat:-1,delay:2.2);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_l",
              syntax: "miasma|0;x:78%,78%;y:75%,75%|3;(repeat:-1,delay:1.7);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_m",
              syntax: "miasma|0;x:65%,65%;y:98%,98%|3;(repeat:-1,delay:.7);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_n",
              syntax: "miasma|0;x:33%,33%;y:78%,78%|3;(repeat:-1,delay:4.4);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            },
            {
              name: "miasma_o",
              syntax: "miasma|0;x:80%,80%;y:92%,92%|3;(repeat:-1,delay:5.2);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1"
            }
          ]
        }
      },
      innocent: {
        name: "innocent",
        fatype: "fas",
        faname: "fa-book-dead",
        image: "modules/theatre/assets/graphics/emotes/innocent.png",
        label: game.i18n.localize("Theatre.Emote.Innocent"),
        rigging: {
          animations: [
            { name: "innocent", syntax: "innocent|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "halo",
              syntax: "halo|2;(ease:power2);x:50%,50%;alpha:0,1|2;(ease:sine,repeat:-1,yoyo:true,yoyoEase:sine);y:-3%,-5%"
            }
          ]
        }
      },
      carefree: {
        name: "carefree",
        fatype: "fas",
        faname: "fa-book-dead",
        image: "modules/theatre/assets/graphics/emotes/carefree.png",
        label: game.i18n.localize("Theatre.Emote.CareFree"),
        rigging: {
          animations: [
            { name: "carefree", syntax: "carefree|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "musicnote_a",
              syntax: "musicnote|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:10%,10%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-10,10|1;(ease:sine,yoyo:true,yoyoEase:sine,repeat:-1);y:20%,30%"
            },
            {
              name: "musicnote_b",
              syntax: "musicnote|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:20%,20%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-10,10|1;(ease:sine,yoyo:true,yoyoEase:sine,repeat:-1,delay:0.25);y:15%,25%"
            },
            {
              name: "musicnote_c",
              syntax: "musicnote|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:30%,30%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-10,10|1;(ease:sine,yoyo:true,yoyoEase:sine,repeat:-1,delay:0.5);y:20%,30%"
            }
          ]
        }
      },
      panic: {
        name: "panic",
        fatype: "far",
        faname: "fa-tired",
        label: game.i18n.localize("Theatre.Emote.Panic"),
        rigging: {
          animations: [
            { name: "panic", syntax: "panic|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "line_a",
              syntax: "linesteep|0;x:50%,50%;y:-10%,-10%|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"
            },
            {
              name: "line_b",
              syntax: "linesteep|0;x:35%,35%;y:-5%,-5%;rotation:-22.5,-22.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"
            },
            {
              name: "line_c",
              syntax: "linesteep|0;x:15%,15%;y:5%,5%;rotation:-45,-45|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"
            },
            {
              name: "line_d",
              syntax: "linesteep|0;x:0%,0%;y:20%,20%;rotation:-67.5,-67.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"
            },
            {
              name: "line_e",
              syntax: "linesteep|0;x:-10%,-10%;y:30%,30%;rotation:-90,-90|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"
            },
            {
              name: "line_f",
              syntax: "linesteep|0;x:65%,65%;y:-5%,-5%;rotation:22.5,22.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"
            },
            {
              name: "line_g",
              syntax: "linesteep|0;x:85%,85%;y:5%,5%;rotation:45,45|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"
            },
            {
              name: "line_h",
              syntax: "linesteep|0;x:100%,100%;y:20%,20%;rotation:67.5,67.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"
            },
            {
              name: "line_i",
              syntax: "linesteep|0;x:110%,110%;y:30%,30%;rotation:90,90|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1"
            }
          ]
        }
      },
      dizzy: {
        name: "dizzy",
        fatype: "far",
        faname: "fa-dizzy",
        label: game.i18n.localize("Theatre.Emote.Dizzy"),
        rigging: {
          animations: [
            { name: "dizzy", syntax: "dizzy|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "stars_a",
              syntax: "star|2;(ease:sineInOut,repeat:-1,yoyo:true);x:10%,90%;y:35%,5%|1;(repeatDelay:1,repeat:-1,yoyo:true);scaleX:0.2,1;scaleY:0.2,1;alpha:0.2,1|2;(repeat:-1);rotation:0,360"
            },
            {
              name: "stars_b",
              syntax: "star|2;(ease:sineInOut,repeat:-1,yoyo:true);x:90%,10%;y:5%,35%|1;(repeatDelay:1,repeat:-1,yoyo:true);scaleX:1,0.2;scaleY:1,0.2;alpha:1,0.2|2;(repeat:-1);rotation:0,360"
            },
            {
              name: "stars_c",
              syntax: "star|2;(ease:sineInOut,repeat:-1,yoyo:true,delay:1);x:10%,90%;y:5%,35%|1;(repeatDelay:1,delay:1,repeat:-1,yoyo:true);scaleX:0.2,1;scaleY:0.2,1;alpha:0.2,1|2;(repeat:-1);rotation:0,360"
            },
            {
              name: "stars_d",
              syntax: "star|2;(ease:sineInOut,repeat:-1,yoyo:true,delay:1);x:90%,10%;y:35%,5%|1;(repeatDelay:1,delay:1,repeat:-1,yoyo:true);scaleX:1,0.2;scaleY:1,0.2;alpha:1,0.2|2;(repeat:-1);rotation:0,360"
            }
          ]
        }
      },
      speechless: {
        name: "speechless",
        fatype: "far",
        faname: "fa-comment-dots",
        image: "modules/theatre/assets/graphics/emotes/speechless.png",
        label: game.i18n.localize("Theatre.Emote.Speechless"),
        rigging: {
          animations: [
            { name: "speechless", syntax: "speechless|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "dot_a",
              syntax: "dot|0.5;(ease:power3);x:30%,30%;y:25%,25%;alpha:0,1|1;(ease:bounce,repeat:-1,delay:0,repeatDelay:3,yoyo:true,yoyoEase:power0);scaleX:0.5,1;scaleY:0.5,1"
            },
            {
              name: "dot_b",
              syntax: "dot|0.5;(ease:power3);x:25%,25%;y:25%,25%;alpha:0,1|1;(ease:bounce,repeat:-1,delay:1,repeatDelay:3,yoyo:true,yoyoEase:power0);scaleX:0.5,1;scaleY:0.5,1"
            },
            {
              name: "dot_c",
              syntax: "dot|0.5;(ease:power3);x:20%,20%;y:25%,25%;alpha:0,1|1;(ease:bounce,repeat:-1,delay:2,repeatDelay:3,yoyo:true,yoyoEase:power0);scaleX:0.5,1;scaleY:0.5,1"
            }
          ]
        }
      },
      scared: {
        name: "scared",
        fatype: "far",
        faname: "fa-grimace",
        label: game.i18n.localize("Theatre.Emote.Scared"),
        rigging: {
          animations: [
            { name: "scared", syntax: "scared|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "ghostball_a",
              syntax: "ghostball1|0;x:70%,70%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.5);y:30%,35%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"
            },
            {
              name: "ghostball_b",
              syntax: "ghostball1|0;x:30%,30%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:1);y:10%,15%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"
            },
            {
              name: "ghostball_c",
              syntax: "ghostball1|0;x:20%,20%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.8);y:60%,65%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"
            },
            {
              name: "ghostball_d",
              syntax: "ghostball2|0;x:85%,85%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.4);y:75%,80%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"
            },
            {
              name: "ghostball_e",
              syntax: "ghostball2|0;x:10%,10%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:1.2);y:40%,45%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"
            },
            {
              name: "ghostball_f",
              syntax: "ghostball2|0;x:60%,60%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.6);y:80%,85%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"
            },
            {
              name: "ghostball_g",
              syntax: "ghostball1|0;x:90%,90%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:1.5);y:10%,15%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"
            },
            {
              name: "ghostball_h",
              syntax: "ghostball2|0;x:75%,75%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.9);y:50%,55%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5"
            }
          ]
        }
      },
      sleeping: {
        name: "sleeping",
        fatype: "fas",
        faname: "fa-bed",
        image: "modules/theatre/assets/graphics/emotes/sleeping.png",
        label: game.i18n.localize("Theatre.Emote.Sleeping"),
        rigging: {
          animations: [
            { name: "sleeping", syntax: "sleeping|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
            {
              name: "zzz_a",
              syntax: "zzz|4;(repeat:-1,delay:0);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:0,yoyo:true);x:30%,40%"
            },
            {
              name: "zzz_b",
              syntax: "zzz|4;(repeat:-1,delay:1);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:0.5,yoyo:true);x:30%,40%"
            },
            {
              name: "zzz_c",
              syntax: "zzz|4;(repeat:-1,delay:2);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:1,yoyo:true);x:30%,40%"
            },
            {
              name: "zzz_d",
              syntax: "zzz|4;(repeat:-1,delay:3);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:1.5,yoyo:true);x:30%,40%"
            }
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
  static splitTextBoxToChars(text, textBox) {
    let charSpans = [];
    let fontSize = Number(KHelpers$1.style(textBox)["font-size"].match(/\-*\d+\.*\d*/) || 0);
    let splitMode = 1;
    switch (game.i18n.lang) {
      case "ja":
        splitMode = 3;
        break;
      case "cn":
        splitMode = 3;
        break;
      case "ko":
        splitMode = 4;
        break;
      case "zh":
      case "th":
        splitMode = 1;
        break;
      default:
        splitMode = 2;
        break;
    }
    if (splitMode == 1) {
      for (let c of text) {
        if (c == " ") {
          let cspan = document.createElement("span");
          cspan.textContent = c;
          cspan.style.height = `${fontSize}px`;
          cspan.style.width = `${fontSize / 4}px`;
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
      }
    } else if (splitMode == 2) {
      let word = document.createElement("div");
      let prevChar = "";
      word.style.height = `${fontSize}px`;
      word.style.position = "relative";
      for (let c of text) {
        if (c == " ") {
          let cspan = document.createElement("span");
          cspan.textContent = c;
          cspan.style.height = `${fontSize}px`;
          cspan.style.width = `${fontSize / 4}px`;
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
          cspan.style.position = "relative";
          word.appendChild(cspan);
          charSpans.push(cspan);
        }
        prevChar = c;
      }
      textBox.append(word);
    } else if (splitMode == 3) {
      let rHead = `)）]｝〕〉》」』】〙〗〟'"｠»ヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ々〻‐゠–〜? ! ‼ ⁇ ⁈ ⁉・、:;,。.`;
      let rTail = `(（[｛〔〈《「『【〘〖〝'"｟«`;
      let rSplit = "—.‥〳〴〵";
      let word = null;
      for (let idx2 = 0; idx2 < text.length; ++idx2) {
        let c = text[idx2];
        let rh = false;
        let rt = false;
        let rs = false;
        let nl = false;
        let sp = false;
        let nv = false;
        let la = text[idx2 + 1];
        if (la && rHead.match(RegExp.escape(la))) {
          rh = true;
          if (!word) {
            word = document.createElement("div");
            word.style.height = `${fontSize}px`;
            word.style.position = "relative";
            if (this._isDebugActive()) {
              word.style["background-color"] = "rgba(0,255,0,0.25)";
              word.style["color"] = "lime";
            }
          }
        }
        if (rTail.match(RegExp.escape(c))) {
          rt = true;
          if (!word) {
            word = document.createElement("div");
            word.style.height = `${fontSize}px`;
            word.style.position = "relative";
            if (this._isDebugActive()) {
              word.style["background-color"] = "rgba(0,255,0,0.25)";
              word.style["color"] = "lime";
            }
          }
        }
        if (rSplit.match(RegExp.escape(c)) && text[idx2 + 1] && text[idx2 + 1] == c) {
          rs = true;
          if (!word) {
            word = document.createElement("div");
            word.style.height = `${fontSize}px`;
            word.style.position = "relative";
            if (this._isDebugActive()) {
              word.style["background-color"] = "rgba(0,255,0,0.25)";
              word.style["color"] = "lime";
            }
          }
        }
        if (!isNaN(Number(c)) && text[idx2 + 1] && !isNaN(Number(text[idx2 + 1]))) {
          rs = true;
          if (!word) {
            word = document.createElement("div");
            word.style.height = `${fontSize}px`;
            word.style.position = "relative";
            if (this._isDebugActive()) {
              word.style["background-color"] = "rgba(0,255,0,0.25)";
              word.style["color"] = "lime";
            }
          }
        }
        if (text[idx2 + 1] && /*rTail.match(text[idx+1]) || */
        rHead.match(RegExp.escape(text[idx2 + 1])))
          nv = true;
        if (c == " ") {
          sp = true;
        } else if (c == "\n") {
          nl = true;
        } else {
          let cspan = document.createElement("span");
          cspan.textContent = c;
          cspan.style.height = `${fontSize}px`;
          cspan.style.position = "relative";
          if (word) word.appendChild(cspan);
          else textBox.appendChild(cspan);
          charSpans.push(cspan);
        }
        if (word && word.children.length >= 2 && !rt && !rh && !rs && !nv) {
          textBox.appendChild(word);
          word = null;
        }
        if (nl) {
          let cspan = document.createElement("hr");
          if (word) {
            textBox.appendChild(word);
            word = null;
          }
          textBox.appendChild(cspan);
        } else if (sp) {
          if (word) {
            textBox.appendChild(word);
            word = null;
          }
          let cspan = document.createElement("span");
          cspan.textContent = c;
          cspan.style.height = `${fontSize}px`;
          cspan.style.width = `${fontSize / 4}px`;
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
      let rHead = `!%),.:;?]}¢°'"†‡℃〆〈《「『〕！％），．：；？］｝ `;
      let rTail = `$([\\{£¥'"々〇〉》」〔＄（［｛｠￥￦#`;
      let word = null;
      for (let idx2 = 0; idx2 < text.length; ++idx2) {
        let c = text[idx2];
        let rh = false;
        let rt = false;
        let rs = false;
        let nl = false;
        let nv = false;
        let la = text[idx2 + 1];
        if (la && rHead.match(RegExp.escape(la))) {
          rh = true;
          if (!word) {
            word = document.createElement("div");
            word.style.height = `${fontSize}px`;
            word.style.position = "relative";
            if (this._isDebugActive()) {
              word.style["background-color"] = "rgba(0,255,0,0.25)";
              word.style["color"] = "lime";
            }
          }
        }
        if (rTail.match(RegExp.escape(c))) {
          rt = true;
          if (!word) {
            word = document.createElement("div");
            word.style.height = `${fontSize}px`;
            word.style.position = "relative";
            if (this._isDebugActive()) {
              word.style["background-color"] = "rgba(0,255,0,0.25)";
              word.style["color"] = "lime";
            }
          }
        }
        if (!isNaN(Number(c)) && text[idx2 + 1] && !isNaN(Number(text[idx2 + 1]))) {
          rs = true;
          if (!word) {
            word = document.createElement("div");
            word.style.height = `${fontSize}px`;
            word.style.position = "relative";
            if (this._isDebugActive()) {
              word.style["background-color"] = "rgba(0,255,0,0.25)";
              word.style["color"] = "lime";
            }
          }
        }
        if (text[idx2 + 1] && /*rTail.match(text[idx+1]) || */
        rHead.match(RegExp.escape(text[idx2 + 1])))
          nv = true;
        if (c == " ") {
          let cspan = document.createElement("span");
          cspan.textContent = c;
          cspan.style.height = `${fontSize}px`;
          cspan.style.width = `${fontSize / 4}px`;
          cspan.style.position = "relative";
          if (word) word.appendChild(cspan);
          else textBox.appendChild(cspan);
          charSpans.push(cspan);
        } else if (c == "\n") {
          nl = true;
        } else {
          let cspan = document.createElement("span");
          cspan.textContent = c;
          cspan.style.height = `${fontSize}px`;
          cspan.style.position = "relative";
          if (word) word.appendChild(cspan);
          else textBox.appendChild(cspan);
          charSpans.push(cspan);
        }
        if (word && word.children.length >= 2 && !rh && !rt && !rs && !nv) {
          textBox.appendChild(word);
          word = null;
        }
        if (nl) {
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
  static onConfigureInsert(ev, actorSheet) {
    ev.preventDefault();
    Logger.debug("Click Event on Configure Theatre!!!", actorSheet, actorSheet.actor, actorSheet.position);
    if (!actorSheet.actor.flags.theatre) {
      actorSheet.actor.flags.theatre = { baseinsert: "", name: "" };
    }
    new TheatreActorConfig({
      document: actorSheet.actor,
      top: actorSheet.position.top + 40,
      left: actorSheet.position.left + (actorSheet.position.width - 500) / 2,
      configureDefault: true
    }).render(true);
  }
  /**
   * Add to the nav bar staging area with an actorSheet.
   *
   * @params ev (Event) : The event that triggered adding to the NavBar staging area.
   */
  static onAddToNavBar(ev, actorSheet, removeLabelSheetHeader) {
    Logger.debug("Click Event on Add to NavBar!!", actorSheet, actorSheet.actor, actorSheet.position);
    const actor = actorSheet.document;
    const addLabel = removeLabelSheetHeader ? "" : game.i18n.localize("Theatre.UI.Config.AddToStage");
    const removeLabel = removeLabelSheetHeader ? "" : game.i18n.localize("Theatre.UI.Config.RemoveFromStage");
    let newText;
    if (Theatre.isActorStaged(actor)) {
      Theatre.removeFromNavBar(actor);
      newText = addLabel;
    } else {
      Theatre.addToNavBar(actor);
      newText = removeLabel;
    }
    const iconElement = ev.currentTarget.querySelector("i");
    iconElement.className = Theatre.isActorStaged(actor) ? "fas fa-mask" : "fas fa-theater-masks";
    const textNode = ev.currentTarget.childNodes[1];
    if (textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = newText;
    }
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
    if (!actor) {
      return;
    }
    Logger.debug("actor is valid!");
    let theatreId = Theatre._getTheatreId(actor);
    let portrait = actor.img ? actor.img : CONSTANTS.DEFAULT_PORTRAIT;
    let optAlign = "top";
    let name2 = actor.name;
    if (!Theatre.instance.isActorOwner(game.user.id, theatreId)) {
      Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
      return;
    }
    if (actor.flags.theatre) {
      if (actor.flags.theatre.name && actor.flags.theatre.name != "") {
        name2 = actor.flags.theatre.name;
      }
      if (actor.flags.theatre.baseinsert && actor.flags.theatre.baseinsert != "") {
        portrait = actor.flags.theatre.baseinsert;
      }
      if (actor.flags.theatre.optalign && actor.flags.theatre.optalign != "") {
        optAlign = actor.flags.theatre.optalign;
      }
    }
    if (Theatre.instance.stage[theatreId]) {
      Logger.info(actor.name + game.i18n.localize("Theatre.UI.Notification.AlreadyStaged"), true);
      return;
    }
    Logger.debug("new theatre id: " + theatreId);
    let navItem = document.createElement("img");
    KHelpers$1.addClass(navItem, "theatre-control-nav-bar-item");
    navItem.setAttribute("imgId", theatreId);
    navItem.setAttribute("src", portrait);
    navItem.setAttribute("title", name2 + (name2 == actor.name ? "" : ` (${actor.name})`));
    navItem.setAttribute("name", name2);
    navItem.setAttribute("optalign", optAlign);
    if (!!Theatre.instance.getInsertById(theatreId))
      KHelpers$1.addClass(navItem, "theatre-control-nav-bar-item-active");
    navItem.addEventListener("mouseup", Theatre.instance.handleNavItemMouseUp);
    navItem.addEventListener("dragstart", Theatre.instance.handleNavItemDragStart);
    navItem.addEventListener("dragend", Theatre.instance.handleNavItemDragEnd);
    navItem.addEventListener("dragover", Theatre.instance.handleNavItemDragOver);
    navItem.addEventListener("drop", Theatre.instance.handleNavItemDragDrop);
    Theatre.instance.theatreNavBar.appendChild(navItem);
    Theatre.instance.stageInsertById(theatreId);
    Theatre.instance.stage[theatreId] = new TheatreActor(actor, navItem);
    TheatreHelpers.relocateStage();
  }
  /**
   * Removes the actor from the nav bar.
   *
   * @params actor (Actor) : The actor to remove from the NavBar staging area.
   */
  static removeFromNavBar(actor) {
    if (!actor) {
      return;
    }
    const theatreId = Theatre._getTheatreId(actor);
    Theatre.instance._removeFromStage(theatreId);
    TheatreHelpers.relocateStage();
  }
  /**
   * Removes the actor from the stage.
   *
   * @params id (string) : The theatreId to remove from the stage.
   */
  static _removeFromStage(theatreId) {
    const staged = Theatre.instance.stage[theatreId];
    if (staged) {
      if (staged.navElement) {
        Theatre.instance.theatreNavBar.removeChild(staged.navElement);
      }
      Theatre.instance.removeInsertById(theatreId);
      delete Theatre.instance.stage[theatreId];
      TheatreHelpers.relocateStage();
    }
  }
  /**
   * Returns whether the actor is on the stage.
   * @params actor (Actor) : The actor.
   */
  static isActorStaged(actor) {
    if (!actor) {
      return false;
    }
    return !!Theatre.instance.stage[Theatre._getTheatreId(actor)];
  }
  static clearStage() {
    Object.keys(Theatre.instance.stage).forEach((theatreId) => {
      Theatre.instance._removeFromStage(theatreId);
    });
    TheatreHelpers.relocateStage();
  }
  static relocateStage(forceUpdate = false) {
    const showActorsOnTop = game.settings.get(CONSTANTS.MODULE_ID, "showActorsOnTop");
    if (!showActorsOnTop && !forceUpdate) {
      return;
    }
    const keys = Object.keys(Theatre.instance.stage);
    if (keys.length <= CONSTANTS.MAX_NUM_ACTORS_ON_CONTROL_GROUP || !showActorsOnTop) {
      const controlGroup = document.getElementsByClassName("theatre-control-group")[0];
      if (!controlGroup) {
        return;
      }
      const navBar2 = controlGroup.getElementsByClassName("theatre-control-nav-bar")[0];
      if (navBar2) {
        return;
      }
      KHelpers$1.insertBefore(Theatre.instance.theatreNavBar, controlGroup.firstChild);
      Logger.debug("moved nav bar to chat box");
      return;
    }
    const uiTop = document.getElementById("ui-top");
    if (!uiTop) {
      return;
    }
    const navBar = uiTop.getElementsByClassName("theatre-control-nav-bar")[0];
    if (navBar) {
      return;
    }
    uiTop.appendChild(Theatre.instance.theatreNavBar);
    Logger.debug("moved nav bar to top of screen");
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
  static textStandingAnimation(name2) {
    if (!Theatre.STANDING_ANIMS)
      Theatre.STANDING_ANIMS = {
        impact: {
          func: /* @__PURE__ */ __name(function(target, shakeradius) {
            if (!target) return;
            shakeradius = shakeradius || Math.random() * 7 + 7;
            shakeradius = Math.max(shakeradius - Math.random() * 0.5, 0);
            if (shakeradius == 0) {
              target.style.left = "0px";
              target.style.top = "0px";
              return;
            }
            TweenMax.to(target, 0.025, {
              left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius}px`,
              top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius}px`,
              onComplete: Theatre.textStandingAnimation("impact"),
              onCompleteParams: [target, shakeradius]
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Standing.Impact")
        },
        quiver: {
          func: /* @__PURE__ */ __name(function(target, quiverAmt) {
            if (!target) return;
            quiverAmt = quiverAmt || 2;
            quiverAmt = Math.max(quiverAmt - Math.random() * 0.1, 0);
            if (quiverAmt == 0) {
              target.style.left = "0px";
              target.style.top = "0px";
              return;
            }
            TweenMax.to(target, 0.1, {
              left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * quiverAmt}px`,
              top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * quiverAmt}px`,
              onComplete: Theatre.textStandingAnimation("quiver"),
              onCompleteParams: [target, quiverAmt]
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Standing.Quiver")
        },
        wave: {
          func: /* @__PURE__ */ __name(function(target, waveAmp) {
            if (!target) return;
            waveAmp = waveAmp || 4;
            if (waveAmp > 0) waveAmp = waveAmp - 0.5;
            else waveAmp = waveAmp + 0.5;
            if (waveAmp == 0) {
              target.style.top = "0px";
              return;
            }
            TweenMax.to(target, 0.5, {
              top: `${waveAmp}px`,
              onComplete: Theatre.textStandingAnimation("wave"),
              onCompleteParams: [target, -waveAmp]
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Standing.Wave")
        },
        fade: {
          func: /* @__PURE__ */ __name(function(target, fade) {
            if (!target) return;
            fade = fade || 1;
            fade = Math.max(fade - 0.025, 0);
            if (fade <= 0) {
              target.style.opacity = 0;
              return;
            }
            TweenMax.to(target, 0.1, {
              opacity: fade,
              onComplete: Theatre.textStandingAnimation("fade"),
              onCompleteParams: [target, fade]
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Standing.Fade")
        },
        excited: {
          func: /* @__PURE__ */ __name(function(target) {
            if (!target) return;
            TweenMax.to(target, 0.025, {
              left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
              top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
              onComplete: Theatre.textStandingAnimation("excited"),
              onCompleteParams: [target]
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Standing.Excited")
        },
        violent: {
          func: /* @__PURE__ */ __name(function(target, oshakeradius, ox, oy) {
            if (!target) return;
            ox = ox || 0;
            oy = oy || 0;
            oshakeradius = oshakeradius || 2;
            let shakeradius = Math.random() * oshakeradius + oshakeradius;
            if (!target.style.left.match("0px") || !target.style.top.match("0px")) shakeradius = 0;
            TweenMax.to(target, 0.025, {
              left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius + ox}px`,
              top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius + oy}px`,
              scale: `${Math.random() / 3 + 0.9}`,
              onComplete: Theatre.textStandingAnimation("violent"),
              onCompleteParams: [target, oshakeradius, ox, oy]
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Standing.Violent")
        },
        bubbly: {
          func: /* @__PURE__ */ __name(function(target) {
            if (!target) return;
            TweenMax.to(target, 0.5, {
              scale: `${Math.floor((Math.random() * 0.4 + 0.8) * 100) / 100}`,
              onComplete: Theatre.textStandingAnimation("bubbly"),
              onCompleteParams: [target]
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Standing.Bubbly")
        },
        spooky: {
          func: /* @__PURE__ */ __name(function(target) {
            if (!target) return;
            TweenMax.to(target, Math.floor((Math.random() * 0.25 + 0.2) * 100) / 100, {
              left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 3}px`,
              top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 3}px`,
              onComplete: Theatre.textStandingAnimation("spooky"),
              onCompleteParams: [target]
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Standing.Spooky")
        },
        insane: {
          func: /* @__PURE__ */ __name(function(target, rotation, scale) {
            if (!target) return;
            let spin = Math.random() * 100;
            let grow = Math.random() * 200;
            let animtime = 0.025;
            rotation = rotation || 0;
            scale = scale || 1;
            if (spin >= 99.95) {
              animtime = Math.random() * 0.5;
              rotation = 1080;
            } else if (spin >= 99.8) {
              animtime = Math.random() * 0.5 + 0.5;
              rotation = 360;
            } else if (spin >= 80) {
              rotation = rotation != 0 ? 0 : (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 30);
            }
            if (grow >= 199) {
              if (scale != 1) scale = 1;
              else scale = Math.random() * 0.5 + 1;
            }
            TweenMax.to(target, animtime, {
              left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
              top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
              rotation,
              scale,
              onComplete: Theatre.textStandingAnimation("insane"),
              onCompleteParams: [target, rotation, scale]
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Standing.Insane")
        }
      };
    if (Theatre.STANDING_ANIMS[name2]) {
      return Theatre.STANDING_ANIMS[name2].func;
    }
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
  static textFlyinAnimation(name2) {
    if (!Theatre.FLYIN_ANIMS)
      Theatre.FLYIN_ANIMS = {
        typewriter: {
          func: /* @__PURE__ */ __name(function(charSpans, animTime, speed, standingAnim) {
            gsap.from(charSpans, {
              duration: 0.05,
              stagger: {
                each: 0.05,
                onComplete: /* @__PURE__ */ __name(function() {
                  if (standingAnim) standingAnim.call(this, this.targets()[0]);
                }, "onComplete")
              },
              opacity: 0,
              scale: 1.5
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Flyin.Typewriter")
        },
        fadein: {
          func: /* @__PURE__ */ __name(function(charSpans, animTime, speed, standingAnim) {
            gsap.from(charSpans, {
              duration: animTime,
              stagger: {
                each: speed,
                onComplete: /* @__PURE__ */ __name(function() {
                  if (standingAnim) standingAnim.call(this, this.targets()[0]);
                }, "onComplete")
              },
              opacity: 0
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Flyin.Fadein")
        },
        slidein: {
          func: /* @__PURE__ */ __name(function(charSpans, animTime, speed, standingAnim) {
            gsap.from(charSpans, {
              duration: animTime,
              stagger: {
                each: speed,
                onComplete: /* @__PURE__ */ __name(function() {
                  if (standingAnim) standingAnim.call(this, this.targets()[0]);
                }, "onComplete")
              },
              opacity: 0,
              left: 200
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Flyin.Slidein")
        },
        scalein: {
          func: /* @__PURE__ */ __name(function(charSpans, animTime, speed, standingAnim) {
            gsap.from(charSpans, {
              duration: animTime,
              stagger: {
                each: speed,
                onComplete: /* @__PURE__ */ __name(function() {
                  if (standingAnim) standingAnim.call(this, this.targets()[0]);
                }, "onComplete")
              },
              opacity: 0,
              scale: 5,
              //rotation: -180,
              ease: Power4.easeOut
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Flyin.Scalein")
        },
        fallin: {
          func: /* @__PURE__ */ __name(function(charSpans, animTime, speed, standingAnim) {
            let textBox = null;
            if (charSpans[0]) {
              switch (Theatre.instance.settings.theatreStyle) {
                case "lightbox":
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                  if (!textBox)
                    textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
                case "clearbox":
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                  if (!textBox)
                    textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
                case "mangabubble":
                  break;
                case "textbox":
                default:
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
              }
              if (textBox) {
                textBox.style["overflow-y"] = "visible";
                textBox.style["overflow-x"] = "visible";
              }
            }
            gsap.from(charSpans, {
              duration: animTime,
              stagger: {
                each: speed,
                onComplete: /* @__PURE__ */ __name(function() {
                  if (standingAnim) standingAnim.call(this, this.targets()[0]);
                }, "onComplete")
              },
              opacity: 0,
              top: -100,
              ease: Power4.easeOut,
              onComplete: /* @__PURE__ */ __name(() => {
                Logger.debug("completeAll");
                if (textBox) {
                  textBox.style["overflow-y"] = "scroll";
                  textBox.style["overflow-x"] = "hidden";
                }
              }, "onComplete")
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Flyin.Fallin")
        },
        spin: {
          func: /* @__PURE__ */ __name(function(charSpans, animTime, speed, standingAnim) {
            gsap.from(charSpans, {
              duration: animTime,
              stagger: {
                each: speed,
                onComplete: /* @__PURE__ */ __name(function() {
                  if (standingAnim) standingAnim.call(this, this.targets()[0]);
                }, "onComplete")
              },
              opacity: 0,
              rotation: -360,
              left: 100,
              ease: Power4.easeOut
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Flyin.Spin")
        },
        spinscale: {
          func: /* @__PURE__ */ __name(function(charSpans, animTime, speed, standingAnim) {
            let textBox = null;
            if (charSpans[0]) {
              switch (Theatre.instance.settings.theatreStyle) {
                case "lightbox":
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                  if (!textBox)
                    textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
                case "clearbox":
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                  if (!textBox)
                    textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
                case "mangabubble":
                  break;
                case "textbox":
                default:
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
              }
              if (textBox) {
                textBox.style["overflow-y"] = "visible";
                textBox.style["overflow-x"] = "visible";
              }
            }
            gsap.from(charSpans, animTime * 1.5, {
              duration: animTime * 1.5,
              stagger: {
                each: speed,
                onComplete: /* @__PURE__ */ __name(function() {
                  if (standingAnim) standingAnim.call(this, this.targets()[0]);
                }, "onComplete")
              },
              opacity: 0,
              scale: 5,
              rotation: -360,
              left: 150,
              ease: Power4.easeOut,
              onComplete: /* @__PURE__ */ __name(() => {
                Logger.debug("completeAll");
                if (textBox) {
                  textBox.style["overflow-y"] = "scroll";
                  textBox.style["overflow-x"] = "hidden";
                }
              }, "onComplete")
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Flyin.SpinScale")
        },
        outlaw: {
          func: /* @__PURE__ */ __name(function(charSpans, animTime, speed, standingAnim) {
            let textBox = null;
            if (charSpans[0]) {
              switch (Theatre.instance.settings.theatreStyle) {
                case "lightbox":
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                  if (!textBox)
                    textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
                case "clearbox":
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                  if (!textBox)
                    textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
                case "mangabubble":
                  break;
                case "textbox":
                default:
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
              }
              if (textBox) {
                textBox.style["overflow-y"] = "visible";
                textBox.style["overflow-x"] = "visible";
              }
            }
            gsap.from(charSpans, {
              duration: animTime * 1.5,
              stagger: {
                each: speed,
                onComplete: /* @__PURE__ */ __name(function() {
                  if (standingAnim) standingAnim.call(this, this.targets()[0]);
                }, "onComplete")
              },
              opacity: 0,
              scale: 6,
              rotation: -1080,
              ease: Power4.easeOut,
              onComplete: /* @__PURE__ */ __name(() => {
                Logger.debug("completeAll");
                if (textBox) {
                  textBox.style["overflow-y"] = "scroll";
                  textBox.style["overflow-x"] = "hidden";
                }
              }, "onComplete")
            });
          }, "func"),
          label: game.i18n.localize("Theatre.Flyin.Outlaw")
        },
        vortex: {
          func: /* @__PURE__ */ __name(function(charSpans, animTime, speed, standingAnim) {
            let textBox = null;
            if (charSpans[0]) {
              switch (Theatre.instance.settings.theatreStyle) {
                case "lightbox":
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                  if (!textBox)
                    textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
                case "clearbox":
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                  if (!textBox)
                    textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
                case "mangabubble":
                  break;
                case "textbox":
                default:
                  textBox = KHelpers$1.seekParentClass(charSpans[0], "theatre-text-box", 5);
                  break;
              }
              if (textBox) {
                textBox.style["overflow-y"] = "visible";
                textBox.style["overflow-x"] = "visible";
              }
            }
            for (let idx2 = 0; idx2 < charSpans.length; ++idx2) {
              TweenMax.from(charSpans[idx2], animTime, {
                delay: idx2 * speed,
                opacity: 0,
                scale: 5,
                rotation: -720,
                left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 500}px`,
                top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 500}px`,
                onComplete: /* @__PURE__ */ __name(function() {
                  if (standingAnim) standingAnim.call(this, this.targets()[0]);
                }, "onComplete")
              });
            }
            if (textBox) {
              Logger.debug("vortext all start");
              TweenMax.from(textBox, 0.1, {
                delay: speed * charSpans.length + animTime,
                //opacity: 1,
                onComplete: /* @__PURE__ */ __name(function() {
                  Logger.debug("vortex all complete");
                  if (this.targets().length) {
                    this.targets()[0].style["overflow-y"] = "scroll";
                    this.targets()[0].style["overflow-x"] = "visible";
                  }
                }, "onComplete")
              });
            }
          }, "func"),
          label: game.i18n.localize("Theatre.Flyin.Vortex")
        },
        assemble: {
          func: /* @__PURE__ */ __name(function(charSpans, animTime, speed, standingAnim) {
            for (let idx2 = 0; idx2 < charSpans.length; ++idx2) {
              TweenMax.from(charSpans[idx2], animTime, {
                delay: idx2 * speed,
                opacity: 0,
                scale: 5,
                rotation: -180,
                left: `${Math.random() * 500}px`,
                top: `${Math.random() * 500}px`,
                onComplete: /* @__PURE__ */ __name(function() {
                  if (standingAnim) standingAnim.call(this, this.targets()[0]);
                }, "onComplete")
              });
            }
          }, "func"),
          label: game.i18n.localize("Theatre.Flyin.Assemble")
        }
      };
    if (Theatre.FLYIN_ANIMS[name2]) {
      return Theatre.FLYIN_ANIMS[name2].func;
    } else {
      return Theatre.FLYIN_ANIMS["typewriter"].func;
    }
  }
  /**
   * Resize the UI Bars elements when the sidebar is collapsed or expanded
   *
   * @param collapsed (Boolean) : Whether the sidebar is collapsed or not
   */
  static resizeBars(collapsed) {
    if (!Theatre.instance) {
      return;
    }
    const chatMessage = document.getElementById("chat-message");
    const isChatOutsideChatLog = chatMessage.parentElement.id === "chat-notifications";
    window.setTimeout(() => {
      let sideBar = document.getElementById("sidebar");
      let mainRightColumn = document.getElementById("ui-right");
      let primeBar = document.getElementById("theatre-prime-bar");
      let secondBar = document.getElementById("theatre-second-bar");
      let calculatedWidth = mainRightColumn.offsetWidth + 5;
      if (!collapsed && !isChatOutsideChatLog) {
        calculatedWidth = sideBar.offsetWidth + 2;
      }
      Theatre.instance.theatreBar.style.width = `calc(100% - ${calculatedWidth}px)`;
      Theatre.instance.theatreNarrator.style.width = `calc(100% - ${calculatedWidth}px)`;
      if (!collapsed && Theatre.instance._getTextBoxes().length === 2) {
        let dualWidth = Math.min(Math.floor(Theatre.instance.theatreBar.offsetWidth / 2), 650);
        primeBar.style.width = `${dualWidth}px`;
        secondBar.style.width = `${dualWidth}px`;
        secondBar.style.left = `calc(100% - ${dualWidth}px)`;
      }
      Theatre.instance.theatreEmoteMenu.style.top = `${Theatre.instance.theatreControls.offsetTop - 410}px`;
      if (Theatre.instance.reorderTOId) {
        window.clearTimeout(Theatre.instance.reorderTOId);
      }
      Theatre.instance.reorderTOId = window.setTimeout(() => {
        Theatre.reorderInserts();
        Theatre.instance.reorderTOId = null;
      }, 250);
    }, 250);
  }
}
const registerSettings = /* @__PURE__ */ __name(function() {
  let settingsCustom = {};
  game.settings.register(CONSTANTS.MODULE_ID, "gmOnly", {
    name: "Theatre.UI.Settings.gmOnly",
    hint: "Theatre.UI.Settings.gmOnlyHint",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    onChange: /* @__PURE__ */ __name(() => {
      if (!game.user.isGM) {
        location.reload();
      }
    }, "onChange")
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
      clearbox: "Theatre.UI.Settings.displayModeClearBox"
    },
    onChange: /* @__PURE__ */ __name((theatreStyle) => {
      Theatre.instance.configTheatreStyle(theatreStyle);
    }, "onChange")
  });
  game.settings.register(CONSTANTS.MODULE_ID, "theatreImageSize", {
    name: "Maximum image height",
    scope: "client",
    config: true,
    default: 400,
    type: Number
  });
  game.settings.register(CONSTANTS.MODULE_ID, "theatreImageUsePercent", {
    name: "Use screen height as maximum image height",
    scope: "world",
    config: true,
    default: false,
    type: Boolean
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
    type: Boolean
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
      "70%": "75%"
    },
    onChange: /* @__PURE__ */ __name((narrHeight) => {
      settingsCustom.narrHeight = narrHeight;
      if (Theatre.instance.theatreNarrator) {
        Theatre.instance.theatreNarrator.style.top = `calc(${narrHeight} - 50px)`;
      }
    }, "onChange")
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
    }, {})
  });
  game.settings.register(CONSTANTS.MODULE_ID, "nameFontSize", {
    name: "Theatre.UI.Settings.nameFontSize",
    hint: "Theatre.UI.Settings.nameFontSizeHint",
    scope: "world",
    config: true,
    default: 44,
    type: Number
  });
  game.settings.register(CONSTANTS.MODULE_ID, "textDecayMin", {
    name: "Theatre.UI.Settings.textDecayMin",
    hint: "Theatre.UI.Settings.textDecayMinHint",
    scope: "world",
    config: true,
    default: 30,
    type: Number,
    onChange: /* @__PURE__ */ __name((textDecayMin) => {
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
      settingsCustom.decayMin = textDecayMin * 1e3;
    }, "onChange")
  });
  game.settings.register(CONSTANTS.MODULE_ID, "textDecayRate", {
    name: "Theatre.UI.Settings.textDecayRate",
    hint: "Theatre.UI.Settings.textDecayRateHint",
    scope: "world",
    config: true,
    default: 1,
    type: Number,
    onChange: /* @__PURE__ */ __name((textDecayRate) => {
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
      settingsCustom.decayRate = textDecayRate * 1e3;
    }, "onChange")
  });
  game.settings.register(CONSTANTS.MODULE_ID, "autoHideBottom", {
    name: "Theatre.UI.Settings.autoHideBottom",
    hint: "Theatre.UI.Settings.autoHideBottomHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(CONSTANTS.MODULE_ID, "suppressMacroHotbar", {
    name: "Theatre.UI.Settings.suppressMacroHotbar",
    hint: "Theatre.UI.Settings.suppressMacroHotbarHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
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
      both: "Theatre.UI.Settings.showUIAboveStageBoth"
    }
  });
  game.settings.register(CONSTANTS.MODULE_ID, "removeLabelSheetHeader", {
    name: "Theatre.UI.Settings.removeLabelSheetHeader",
    hint: "Theatre.UI.Settings.removeLabelSheetHeaderHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(CONSTANTS.MODULE_ID, "ignoreMessagesToChat", {
    name: "Theatre.UI.Settings.ignoreMessagesToChat",
    hint: "Theatre.UI.Settings.ignoreMessagesToChatHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: /* @__PURE__ */ __name((value) => {
      settingsCustom.ignoreMessagesToChat = value;
    }, "onChange")
  });
  game.settings.register(CONSTANTS.MODULE_ID, "quoteType", {
    name: "Theatre.UI.Settings.quoteType",
    hint: game.i18n.format("Theatre.UI.Settings.quoteTypeHint", {
      setting: game.i18n.localize("Theatre.UI.Title.QuoteToggle")
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
      4: game.i18n.localize("Theatre.UI.Settings.quoteTypeChoices.4")
    },
    onChange: /* @__PURE__ */ __name((value) => {
      settingsCustom.quoteType = value;
    }, "onChange")
  });
  game.settings.register(CONSTANTS.MODULE_ID, "showActorsOnTop", {
    name: "Theatre.UI.Settings.showActorsOnTop",
    hint: "Theatre.UI.Settings.showActorsOnTopHint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: /* @__PURE__ */ __name(() => {
      TheatreHelpers.relocateStage(true);
    }, "onChange")
  });
  game.settings.register(CONSTANTS.MODULE_ID, "debug", {
    name: `Theatre.UI.Settings.debug`,
    hint: `Theatre.UI.Settings.debugHint`,
    scope: "client",
    config: true,
    default: false,
    type: Boolean
  });
  settingsCustom.decayMin = (game.settings.get(CONSTANTS.MODULE_ID, "textDecayMin") || 30) * 1e3;
  settingsCustom.decayRate = (game.settings.get(CONSTANTS.MODULE_ID, "textDecayRate") || 1) * 1e3;
  settingsCustom.ignoreMessagesToChat = game.settings.get(CONSTANTS.MODULE_ID, "ignoreMessagesToChat");
  settingsCustom.quoteType = game.settings.get(CONSTANTS.MODULE_ID, "quoteType");
  return settingsCustom;
}, "registerSettings");
const registerKeybindings = /* @__PURE__ */ __name(function() {
  game.keybindings.register(CONSTANTS.MODULE_ID, "unfocusTextArea", {
    name: "Theatre.UI.Keybinds.unfocusTextArea",
    hint: "",
    editable: [
      {
        key: "Escape"
      }
    ],
    onDown: /* @__PURE__ */ __name(() => {
      if (document.activeElement === document.getElementById("chat-message")) {
        event.preventDefault();
        event.stopPropagation();
        document.getElementById("chat-message").blur();
      }
    }, "onDown"),
    restricted: false
  });
  game.keybindings.register(CONSTANTS.MODULE_ID, "addOwnedToStage", {
    name: "Theatre.UI.Keybinds.addOwnedToStage",
    hint: "",
    editable: [
      {
        key: "Enter",
        modifiers: ["Alt"]
      }
    ],
    onDown: /* @__PURE__ */ __name(() => {
      const ownedActors = game.actors.filter((a) => a.permission === 3);
      const ownedTokens = ownedActors.map((a) => a.getActiveTokens());
      for (const tokenArray of ownedTokens) tokenArray.forEach((t) => Theatre.addToNavBar(t.actor));
    }, "onDown"),
    restricted: false
  });
  game.keybindings.register(CONSTANTS.MODULE_ID, "addSelectedToStage", {
    name: "Theatre.UI.Keybinds.addSelectedToStage",
    hint: "",
    editable: [
      {
        key: "Enter",
        modifiers: ["Shift"]
      }
    ],
    onDown: /* @__PURE__ */ __name(() => {
      for (const tkn of canvas.tokens.controlled) Theatre.addToNavBar(tkn.actor);
    }, "onDown"),
    restricted: true
  });
  game.keybindings.register(CONSTANTS.MODULE_ID, `removeSelectedFromStage`, {
    name: "Theatre.UI.Keybinds.removeSelectedFromStage",
    hint: "",
    editable: [],
    onDown: /* @__PURE__ */ __name((context) => {
      for (const tkn of canvas.tokens.controlled) Theatre.removeFromNavBar(tkn.actor);
    }, "onDown"),
    restricted: true
  });
  game.keybindings.register(CONSTANTS.MODULE_ID, "narratorMode", {
    name: "Theatre.UI.Keybinds.narratorMode",
    hint: "",
    editable: [
      {
        key: "KeyN",
        modifiers: ["Alt"]
      }
    ],
    onDown: /* @__PURE__ */ __name(() => {
      const narratorButton = $(document).find(`div.theatre-icon-narrator`).closest(`div.theatre-control-btn`);
      if (KHelpers.hasClass(narratorButton[0], "theatre-control-nav-bar-item-speakingas"))
        Theatre.instance.toggleNarratorBar(false);
      else Theatre.instance.toggleNarratorBar(true);
      document.getElementById("chat-message").blur();
    }, "onDown"),
    restricted: true
  });
  game.keybindings.register(CONSTANTS.MODULE_ID, "flipPortrait", {
    name: "Theatre.UI.Keybinds.flipPortrait",
    hint: "",
    editable: [
      {
        key: "KeyR",
        modifiers: ["Alt"]
      }
    ],
    onDown: /* @__PURE__ */ __name(() => {
      if (Theatre.instance.speakingAs) Theatre.instance.mirrorInsertById(Theatre.instance.speakingAs);
    }, "onDown"),
    restricted: false
  });
  game.keybindings.register(CONSTANTS.MODULE_ID, "nudgePortraitLeft", {
    name: "Theatre.UI.Keybinds.nudgePortraitLeft",
    hint: "",
    editable: [
      {
        key: "KeyZ",
        modifiers: ["Alt"]
      }
    ],
    onDown: /* @__PURE__ */ __name(() => {
      const imgId = Theatre.instance.speakingAs;
      if (!imgId) return;
      const insert = Theatre.instance.portraitDocks.find((p) => p.imgId === imgId);
      const oleft = insert.portraitContainer.x, otop = insert.portraitContainer.y;
      const tweenId = "portraitMove";
      const tween = TweenMax.to(insert.portraitContainer, 0.5, {
        pixi: { x: oleft - 50, y: otop },
        ease: Power3.easeOut,
        onComplete: /* @__PURE__ */ __name(function(ctx, imgId2, tweenId2) {
          ctx._removeDockTween(imgId2, this, tweenId2);
        }, "onComplete"),
        onCompleteParams: [Theatre.instance, insert.imgId, tweenId]
      });
      Theatre.instance._addDockTween(insert.imgId, tween, tweenId);
      Theatre.instance._sendSceneEvent("positionupdate", {
        insertid: insert.imgId,
        position: { x: oleft - 50, y: otop, mirror: insert.mirrored }
      });
    }, "onDown"),
    restricted: false
  });
  game.keybindings.register(CONSTANTS.MODULE_ID, "nudgePortraitRight", {
    name: "Theatre.UI.Keybinds.nudgePortraitRight",
    hint: "",
    editable: [
      {
        key: "KeyC",
        modifiers: ["Alt"]
      }
    ],
    onDown: /* @__PURE__ */ __name(() => {
      const imgId = Theatre.instance.speakingAs;
      if (!imgId) return;
      const insert = Theatre.instance.portraitDocks.find((p) => p.imgId === imgId);
      const oleft = insert.portraitContainer.x, otop = insert.portraitContainer.y;
      const tweenId = "portraitMove";
      const tween = TweenMax.to(insert.portraitContainer, 0.5, {
        pixi: { x: oleft + 50, y: otop },
        ease: Power3.easeOut,
        onComplete: /* @__PURE__ */ __name(function(ctx, imgId2, tweenId2) {
          ctx._removeDockTween(imgId2, this, tweenId2);
        }, "onComplete"),
        onCompleteParams: [Theatre.instance, insert.imgId, tweenId]
      });
      Theatre.instance._addDockTween(insert.imgId, tween, tweenId);
      Theatre.instance._sendSceneEvent("positionupdate", {
        insertid: insert.imgId,
        position: { x: oleft + 50, y: otop, mirror: insert.mirrored }
      });
    }, "onDown"),
    restricted: false
  });
  game.keybindings.register(CONSTANTS.MODULE_ID, "nudgePortraitUp", {
    name: "Theatre.UI.Keybinds.nudgePortraitUp",
    hint: "",
    editable: [
      {
        key: "KeyS",
        modifiers: ["Alt"]
      }
    ],
    onDown: /* @__PURE__ */ __name(() => {
      const imgId = Theatre.instance.speakingAs;
      if (!imgId) return;
      const insert = Theatre.instance.portraitDocks.find((p) => p.imgId === imgId);
      const oleft = insert.portraitContainer.x, otop = insert.portraitContainer.y;
      const tweenId = "portraitMove";
      const tween = TweenMax.to(insert.portraitContainer, 0.5, {
        pixi: { x: oleft, y: otop - 50 },
        ease: Power3.easeOut,
        onComplete: /* @__PURE__ */ __name(function(ctx, imgId2, tweenId2) {
          ctx._removeDockTween(imgId2, this, tweenId2);
        }, "onComplete"),
        onCompleteParams: [Theatre.instance, insert.imgId, tweenId]
      });
      Theatre.instance._addDockTween(insert.imgId, tween, tweenId);
      Theatre.instance._sendSceneEvent("positionupdate", {
        insertid: insert.imgId,
        position: { x: oleft, y: otop - 50, mirror: insert.mirrored }
      });
    }, "onDown"),
    restricted: false
  });
  game.keybindings.register(CONSTANTS.MODULE_ID, "nudgePortraitDown", {
    name: "Theatre.UI.Keybinds.nudgePortraitDown",
    hint: "",
    editable: [
      {
        key: "KeyX",
        modifiers: ["Alt"]
      }
    ],
    onDown: /* @__PURE__ */ __name(() => {
      const imgId = Theatre.instance.speakingAs;
      if (!imgId) return;
      const insert = Theatre.instance.portraitDocks.find((p) => p.imgId === imgId);
      const oleft = insert.portraitContainer.x, otop = insert.portraitContainer.y;
      const tweenId = "portraitMove";
      const tween = TweenMax.to(insert.portraitContainer, 0.5, {
        pixi: { x: oleft, y: otop + 50 },
        ease: Power3.easeOut,
        onComplete: /* @__PURE__ */ __name(function(ctx, imgId2, tweenId2) {
          ctx._removeDockTween(imgId2, this, tweenId2);
        }, "onComplete"),
        onCompleteParams: [Theatre.instance, insert.imgId, tweenId]
      });
      Theatre.instance._addDockTween(insert.imgId, tween, tweenId);
      Theatre.instance._sendSceneEvent("positionupdate", {
        insertid: insert.imgId,
        position: { x: oleft, y: otop + 50, mirror: insert.mirrored }
      });
    }, "onDown"),
    restricted: false
  });
  for (let i = 1; i < 11; i++) {
    game.keybindings.register(CONSTANTS.MODULE_ID, `activateStaged${i}`, {
      name: game.i18n.format(`Theatre.UI.Keybinds.activateStaged`, { number: i }),
      hint: "",
      editable: [
        {
          key: `Digit${i === 10 ? 0 : i}`,
          modifiers: ["Control"]
        }
      ],
      onDown: /* @__PURE__ */ __name(() => {
        const ids = Object.keys(Theatre.instance.stage);
        const id = ids[i - 1];
        if (id) Theatre.instance.activateInsertById(id);
        document.getElementById("chat-message").blur();
      }, "onDown"),
      restricted: false,
      reservedModifiers: ["Shift"]
    });
    game.keybindings.register(CONSTANTS.MODULE_ID, `removeStaged${i}`, {
      name: game.i18n.format(`Theatre.UI.Keybinds.removeStaged`, { number: i }),
      hint: "",
      editable: [
        {
          key: `Digit${i === 10 ? 0 : i}`,
          modifiers: ["Control", "Alt"]
        }
      ],
      onDown: /* @__PURE__ */ __name(() => {
        const ids = Object.keys(Theatre.instance.stage);
        const id = ids[i - 1];
        if (id) Theatre.instance.removeInsertById(id);
      }, "onDown"),
      restricted: true
    });
  }
}, "registerKeybindings");
let theatreSocket;
let _theatreProcessEventRegistered = false;
function registerSocket() {
  Logger.debug("Registered theatreSocket");
  if (theatreSocket) {
    return theatreSocket;
  }
  theatreSocket = socketlib.registerModule(CONSTANTS.MODULE_ID);
  game.modules.get(CONSTANTS.MODULE_ID).socket = theatreSocket;
  return theatreSocket;
}
__name(registerSocket, "registerSocket");
class Theatre {
  static {
    __name(this, "Theatre");
  }
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
      Theatre.instance = this;
      Theatre.textStandingAnimation(null);
      Theatre.textFlyinAnimation(null);
      this.titleFont = "Riffic";
      this.textFont = "SignikaBold";
      this.fontWeight = "bold";
      this.reorderTOId = null;
      this.swapTarget = null;
      this.dragPoint = null;
      this.dragNavItem = null;
      this.isNarratorActive = false;
      this.isSuppressed = false;
      this.isQuoteAuto = false;
      this.isDelayEmote = false;
      this.delayedSentState = 0;
      this.rendering = false;
      this.renderAnims = 0;
      this.speakingAs = null;
      this.stage = {};
      this.portraitDocks = [];
      this.userEmotes = {};
      this.usersTyping = {};
      this.userSettings = {};
      this.pixiCTX = null;
      this.pixiToolTipCTX = null;
      this.tooltipTweens = {};
      this.lastTyping = 0;
      this.resync = {
        type: "any",
        timeoutId: null
      };
      this.settings = {
        autoDecay: true,
        decayRate: 1e3,
        decayMin: 3e4,
        barStyle: "textbox",
        narrHeight: "50%"
      };
      this._initialized = false;
      this._resizeListenerBound = false;
      Theatre.getFonts();
      this._initModuleSettings();
    }
    return Theatre.instance;
  }
  functions = {
    addToNavBar: /* @__PURE__ */ __name((actor) => Theatre.addToNavBar(actor), "addToNavBar"),
    removeFromNavBar: /* @__PURE__ */ __name((actor) => Theatre.removeFromNavBar(actor), "removeFromNavBar"),
    activateStagedByID: /* @__PURE__ */ __name((i) => {
      const ids = Object.keys(Theatre.instance.stage);
      Theatre.instance.activateInsertById(ids[i]);
      document.getElementById("chat-message").blur();
    }, "activateStagedByID"),
    removeFromStagedByID: /* @__PURE__ */ __name((i) => {
      const ids = Object.keys(Theatre.instance.stage);
      Theatre.instance.removeInsertById(ids[i]);
    }, "removeFromStagedByID")
  };
  initialize() {
    if (this._initialized || document.getElementById("theatre-group")) {
      this._initialized = true;
      return;
    }
    this._injectHTML();
    if (!document.getElementById("theatre-group")) return;
    this._initSocket();
    if (!this._resizeListenerBound) {
      window.addEventListener("resize", this.handleWindowResize);
      this._resizeListenerBound = true;
    }
    this._sendResyncRequest("any");
    this._initialized = true;
  }
  /**
   * Inject HTML
   *
   * @private
   */
  _injectHTML() {
    let body = document.getElementsByTagName("body")[0];
    document.getElementById("chat");
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
    let barContainerPrime = document.createElement("div");
    let barContainerSecond = document.createElement("div");
    barContainerPrime.id = "theatre-prime-bar";
    barContainerSecond.id = "theatre-second-bar";
    let narratorBackdrop = document.createElement("div");
    let narratorContent = document.createElement("div");
    KHelpers$1.addClass(barContainerPrime, "theatre-bar-left");
    KHelpers$1.addClass(barContainerSecond, "theatre-bar-right");
    KHelpers$1.addClass(narratorBackdrop, "theatre-narrator-backdrop");
    KHelpers$1.addClass(narratorContent, "theatre-narrator-content");
    KHelpers$1.addClass(narratorContent, "no-scrollbar");
    KHelpers$1.addClass(this.theatreGroup, "theatre-group");
    KHelpers$1.addClass(this.theatreDock, "theatre-dock");
    KHelpers$1.addClass(this.theatreDock, "no-scrollbar");
    KHelpers$1.addClass(this.theatreBar, "theatre-bar");
    KHelpers$1.addClass(this.theatreNarrator, "theatre-narrator");
    this.theatreNarrator.appendChild(narratorBackdrop);
    this.theatreNarrator.appendChild(narratorContent);
    this.theatreBar.appendChild(barContainerPrime);
    this.theatreBar.appendChild(barContainerSecond);
    this.theatreGroup.appendChild(this.theatreDock);
    this.theatreGroup.appendChild(this.theatreBar);
    this.theatreGroup.appendChild(this.theatreNarrator);
    this.theatreGroup.appendChild(this.theatreToolTip);
    body.appendChild(this.theatreGroup);
    this.settings.theatreStyle = game.settings.get(CONSTANTS.MODULE_ID, "theatreStyle");
    this.configTheatreStyle(this.settings.theatreStyle);
    this.settings.narrHeight = game.settings.get(CONSTANTS.MODULE_ID, "theatreNarratorHeight");
    this.theatreNarrator.style.top = `calc(${this.settings.narrHeight} - 50px)`;
    const uiAbove = game.settings.get(CONSTANTS.MODULE_ID, "showUIAboveStage");
    const leftAbove = uiAbove == "left" || uiAbove == "both";
    if (leftAbove) document.getElementById("ui-left").classList.add("z-higher");
    const middleAbove = uiAbove == "middle" || uiAbove == "both";
    if (middleAbove) document.getElementById("ui-middle").classList.add("z-higher");
    let chatControls = document.getElementsByClassName("chat-controls")[0];
    if (!chatControls) {
      chatControls = document.getElementById("chat-controls");
    }
    chatControls.getElementsByClassName("control-buttons")[0];
    document.getElementById("chat-form");
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
    KHelpers$1.addClass(this.theatreControls, "theatre-control-group");
    KHelpers$1.addClass(this.theatreNavBar, "theatre-control-nav-bar");
    KHelpers$1.addClass(this.theatreNavBar, "no-scrollbar");
    KHelpers$1.addClass(this.theatreChatCover, "theatre-control-chat-cover");
    KHelpers$1.addClass(btnSuppress, "theatre-control-btn");
    KHelpers$1.addClass(iconSuppress, "theatre-icon-suppress");
    KHelpers$1.addClass(btnEmote, "theatre-control-btn");
    KHelpers$1.addClass(iconEmote, "theatre-icon-emote");
    KHelpers$1.addClasses(btnResync, "button ui-control icon");
    KHelpers$1.addClass(btnResync, "resync-theatre");
    KHelpers$1.addClass(iconResync, "fas");
    KHelpers$1.addClass(iconResync, "fa-sync");
    KHelpers$1.addClasses(btnQuote, "button ui-control icon");
    KHelpers$1.addClass(iconQuote, "fas");
    KHelpers$1.addClass(iconQuote, "fa-quote-right");
    KHelpers$1.addClasses(btnDelayEmote, "button ui-control icon");
    KHelpers$1.addClass(iconDelayEmote, "fas");
    KHelpers$1.addClass(iconDelayEmote, "fa-comment-alt");
    KHelpers$1.addClass(buttons, "theatre-control-button-bar");
    btnEmote.setAttribute("title", game.i18n.localize("Theatre.UI.Title.EmoteSelector"));
    btnSuppress.setAttribute("title", game.i18n.localize("Theatre.UI.Title.SuppressTheatre"));
    btnResync.setAttribute(
      "title",
      game.user.isGM ? game.i18n.localize("Theatre.UI.Title.ResyncGM") : game.i18n.localize("Theatre.UI.Title.ResyncPlayer")
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
      KHelpers$1.addClass(btnNarrator, "theatre-control-btn");
      KHelpers$1.addClass(iconNarrator, "theatre-icon-narrator");
      btnNarrator.setAttribute("title", game.i18n.localize("Theatre.UI.Title.Narrator"));
      btnNarrator.appendChild(iconNarrator);
      btnNarrator.addEventListener("click", this.handleBtnNarratorClick);
      this.theatreControls.appendChild(btnNarrator);
    }
    this.theatreControls.appendChild(btnEmote);
    this.theatreControls.appendChild(btnSuppress);
    KHelpers$1.insertBefore(this.theatreControls, chatMessage);
    const imgWrapper = document.createElement("div");
    KHelpers$1.addClass(imgWrapper, "theatre-control-chat-cover-wrapper");
    imgWrapper.appendChild(this.theatreChatCover);
    if (game.user.isGM || !game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
      buttons.appendChild(btnDelayEmote);
      buttons.appendChild(btnQuote);
      buttons.appendChild(btnResync);
      KHelpers$1.insertBefore(buttons, chatMessage);
    }
    KHelpers$1.insertBefore(imgWrapper, chatMessage);
    chatMessage.addEventListener("keydown", this.handleChatMessageKeyDown);
    chatMessage.addEventListener("keyup", this.handleChatMessageKeyUp);
    chatMessage.addEventListener("focusout", this.handleChatMessageFocusOut);
    chatMessage.addEventListener("focusin", this.handleChatMessageFocusIn);
    this.theatreEmoteMenu = document.createElement("div");
    KHelpers$1.addClass(this.theatreEmoteMenu, "theatre-emote-menu");
    KHelpers$1.addClass(this.theatreEmoteMenu, "app");
    KHelpers$1.insertBefore(this.theatreEmoteMenu, this.theatreControls);
    this.theatreEmoteMenu.addEventListener("mousemove", this.handleEmoteMenuMouseMove);
  }
  /**
   * Init Module Settings
   *
   * @private
   */
  _initModuleSettings() {
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
    this.theatreDock.offsetWidth;
    this.theatreDock.offsetHeight;
    switch (oldStyle || "textbox") {
      case "lightbox":
        KHelpers$1.removeClass(primeBar, "theatre-bar-left");
        KHelpers$1.removeClass(secondBar, "theatre-bar-right");
        KHelpers$1.removeClass(primeBar, "theatre-bar-lightleft");
        KHelpers$1.removeClass(secondBar, "theatre-bar-lightright");
        for (let tb of textBoxes) {
          KHelpers$1.removeClass(tb, "theatre-text-box-light");
          KHelpers$1.removeClass(tb, "theatre-text-box");
        }
        break;
      case "clearbox":
        KHelpers$1.removeClass(primeBar, "theatre-bar-left");
        KHelpers$1.removeClass(secondBar, "theatre-bar-right");
        KHelpers$1.removeClass(primeBar, "theatre-bar-clearleft");
        KHelpers$1.removeClass(secondBar, "theatre-bar-clearright");
        for (let tb of textBoxes) {
          KHelpers$1.removeClass(tb, "theatre-text-box-clear");
          KHelpers$1.removeClass(tb, "theatre-text-box");
        }
        break;
      case "mangabubble":
        KHelpers$1.removeClass(primeBar, "theatre-bar-left");
        KHelpers$1.removeClass(secondBar, "theatre-bar-right");
        for (let tb of textBoxes) {
          KHelpers$1.removeClass(tb, "theatre-text-box");
        }
        break;
      case "textbox":
      default:
        KHelpers$1.removeClass(primeBar, "theatre-bar-left");
        KHelpers$1.removeClass(secondBar, "theatre-bar-right");
        for (let tb of textBoxes) KHelpers$1.removeClass(tb, "theatre-text-box");
        break;
    }
    switch (theatreStyle) {
      case "lightbox":
        KHelpers$1.addClass(primeBar, "theatre-bar-lightleft");
        KHelpers$1.addClass(secondBar, "theatre-bar-lightright");
        this.theatreDock.style.height = "100%";
        this.theatreBar.style.top = "calc(100% - 170px)";
        this.theatreBar.style.height = "170px";
        this.theatreBar.style["border-radius"] = "5px 0px 0px 5px";
        this.theatreBar.style["box-shadow"] = "0 0 40px #000";
        this.theatreBar.style.background = "linear-gradient(transparent, rgba(20,20,20,0.98) 5%,rgba(20,20,20,0.85) 40%, rgba(20,20,20,0.6) 70%, rgba(20,20,20,0.5) 95%)";
        for (let tb of textBoxes) KHelpers$1.addClass(tb, "theatre-text-box-light");
        break;
      case "clearbox":
        KHelpers$1.addClass(primeBar, "theatre-bar-clearleft");
        KHelpers$1.addClass(secondBar, "theatre-bar-clearright");
        this.theatreDock.style.height = "100%";
        this.theatreBar.style.top = "calc(100% - 170px)";
        this.theatreBar.style.height = "170px";
        this.theatreBar.style["border-radius"] = "unset";
        this.theatreBar.style["box-shadow"] = "unset";
        this.theatreBar.style.background = "unset";
        for (let tb of textBoxes) KHelpers$1.addClass(tb, "theatre-text-box-clear");
        break;
      case "mangabubble":
        break;
      case "textbox":
      default:
        KHelpers$1.addClass(primeBar, "theatre-bar-left");
        KHelpers$1.addClass(secondBar, "theatre-bar-right");
        this.theatreDock.style.height = "99.5vh";
        this.theatreBar.style.top = "calc(100% - 160px - 0.5vh)";
        this.theatreBar.style.height = "160px";
        this.theatreBar.style["border-radius"] = "unset";
        this.theatreBar.style["box-shadow"] = "unset";
        this.theatreBar.style.background = "unset";
        for (let tb of textBoxes) KHelpers$1.addClass(tb, "theatre-text-box");
        break;
    }
    this.settings.theatreStyle = theatreStyle;
    for (let insert of this.portraitDocks) this.renderInsertById(insert.imgId);
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
    Hooks.once("socketlib.ready", registerSocket);
    registerSocket();
    if (_theatreProcessEventRegistered) return;
    _theatreProcessEventRegistered = true;
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
    theatreSocket.executeForEveryone("processEvent", {
      senderId: game.user.id,
      type: "sceneevent",
      subtype: eventType,
      data: eventData
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
    let insertTextFlyin = insert ? this._getTextFlyinFromInsert(insert) : this.speakingAs == CONSTANTS.NARRATOR ? this.theatreNarrator.getAttribute("textflyin") : "typewriter";
    let insertTextStanding = insert ? this._getTextStandingFromInsert(insert) : this.speakingAs == CONSTANTS.NARRATOR ? this.theatreNarrator.getAttribute("textstanding") : "none";
    let insertTextFont = insert ? this._getTextFontFromInsert(insert) : this.speakingAs == CONSTANTS.NARRATOR ? this.theatreNarrator.getAttribute("textfont") : null;
    let insertTextSize = insert ? this._getTextSizeFromInsert(insert) : this.speakingAs == CONSTANTS.NARRATOR ? this.theatreNarrator.getAttribute("textsize") : null;
    let insertTextColor = insert ? this._getTextColorFromInsert(insert) : this.speakingAs == CONSTANTS.NARRATOR ? this.theatreNarrator.getAttribute("textcolor") : null;
    let emotedata = {
      emote: insertEmote,
      textflyin: insertTextFlyin,
      textstanding: insertTextStanding,
      textfont: insertTextFont,
      textsize: insertTextSize,
      textcolor: insertTextColor
    };
    theatreSocket.executeForEveryone("processEvent", {
      senderId: game.user.id,
      type: "typingevent",
      data: {
        insertid: this.speakingAs,
        emotions: emotedata
      }
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
        narrator: this.isNarratorActive
      }
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
    for (let idx2 = 0; idx2 < this.portraitDocks.length; ++idx2) {
      let insert = this.portraitDocks[idx2];
      let insertEmote = this._getEmoteFromInsert(insert);
      let insertTextFlyin = this._getTextFlyinFromInsert(insert);
      let insertTextStanding = this._getTextStandingFromInsert(insert);
      let insertTextFont = this._getTextFontFromInsert(insert);
      let insertTextSize = this._getTextSizeFromInsert(insert);
      let insertTextColor = this._getTextColorFromInsert(insert);
      let dat = {
        insertid: insert.imgId,
        position: {
          x: insert.portraitContainer.x,
          y: insert.portraitContainer.y,
          mirror: insert.mirrored
        },
        emotions: {
          emote: insertEmote,
          textflyin: insertTextFlyin,
          textstanding: insertTextStanding,
          textfont: insertTextFont,
          textsize: insertTextSize,
          textcolor: insertTextColor
        },
        sortidx: insert.order || 0
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
    let data = {};
    if (type == "players" && game.user.isGM) {
      data.insertdata = this._buildResyncData();
      data.narrator = this.isNarratorActive;
    }
    theatreSocket.executeForEveryone("processEvent", {
      senderId: game.user.id,
      type: "reqresync",
      subtype: type || "any",
      data
    });
    if (type != "players") {
      this.resync.type = type;
      this.resync.timeoutId = window.setTimeout(() => {
        Logger.log("RESYNC REQUEST TIMEOUT");
        this.resync.timeoutId = null;
      }, 5e3);
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
    if (type == "any" && this.dockActive <= 0 && !this.isNarratorActive) {
      Logger.warn("OUR DOCK IS NOT ACTIVE, Not responding to reqresync");
      return;
    } else if (type == "gm" && !game.user.isGM) {
      return;
    } else if (type == "players") {
      for (let insert of this.portraitDocks) this.removeInsertById(insert.imgId, true);
      this.resync.timeoutId = 1;
      this._processResyncEvent("gm", senderId, {
        targetid: game.user.id,
        insertdata: data.insertdata,
        narrator: data.narrator
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
    if (this.resync.timeoutId && (data.targetid == game.user.id || "gm" == this.resync.type == type)) {
      window.clearTimeout(this.resync.timeoutId);
      this.resync.timeoutId = null;
      for (let insert2 of this.portraitDocks) this.removeInsertById(insert2.imgId, true);
      if (type == "gm") {
        Logger.info(game.i18n.localize("Theatre.UI.Notification.ResyncGM"), true);
      } else {
        Logger.info(
          game.i18n.localize("Theatre.UI.Notification.ResyncPlayer") + game.users.get(senderId).name,
          true
        );
      }
      let theatreId, insert, actorId, params;
      let toInject = [];
      for (let dat of data.insertdata) {
        theatreId = dat.insertid;
        actorId = theatreId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        params = this._getInsertParamsFromActorId(actorId);
        if (!params) continue;
        Logger.debug("params + emotions: ", params, dat.emotions);
        toInject.push({ params, emotions: dat.emotions });
      }
      window.setTimeout(async () => {
        let ids = data.insertdata.map((e) => e.insertid);
        await this.stageAllInserts(ids);
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
              textColor: toInject[toInject.length - 2].emotions.textcolor
            },
            true
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
              textColor: toInject[toInject.length - 1].emotions.textcolor
            },
            true
          );
          for (let idx2 = toInject.length - 3; idx2 >= 0; --idx2)
            await this.injectLeftPortrait(
              toInject[idx2].params.src,
              toInject[idx2].params.name,
              toInject[idx2].params.imgId,
              toInject[idx2].params.optalign,
              {
                emote: toInject[idx2].emotions.emote,
                textFlyin: toInject[idx2].emotions.textflyin,
                textStanding: toInject[idx2].emotions.textstanding,
                textFont: toInject[idx2].emotions.textfont,
                textSize: toInject[idx2].emotions.textsize,
                textColor: toInject[idx2].emotions.textcolor
              },
              true
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
              textColor: toInject[0].emotions.textcolor
            },
            true
          );
        }
        window.setTimeout(() => {
          for (let dat of data.insertdata) {
            insert = this.getInsertById(dat.insertid);
            if (insert) {
              Logger.debug("insert active post resync add, appying position");
              Logger.debug("Mirror ? %s : %s", dat.position.mirror, insert.mirrored);
              if (Boolean(dat.position.mirror) != insert.mirrored) {
                Logger.debug("no match!");
                insert.mirrored = Boolean(dat.position.mirror);
              }
              insert.portraitContainer.scale.x = insert.mirrored ? -1 : 1;
              insert.portraitContainer.x = dat.position.x;
              insert.portraitContainer.y = dat.position.y;
              insert.textFlyin = dat.emotions.textflyin;
              insert.textStanding = dat.emotions.textstanding;
              insert.textFont = dat.emotions.textfont;
              insert.textSize = dat.emotions.textsize;
              insert.textColor = dat.emotions.textcolor;
            }
          }
          this.toggleNarratorBar(data.narrator);
        }, 1e3);
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
    let insert, actorId, params, emote, emotions, app, insertEmote, render;
    switch (type) {
      case "enterscene": {
        Logger.debug("enterscene: aid:%s", actorId);
        actorId = data.insertid.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
        params = this._getInsertParamsFromActorId(actorId);
        emotions = data.emotions ? data.emotions : {
          emote: null,
          textFlying: null,
          textStanding: null,
          textFont: null,
          textSize: null,
          textColor: null
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
            true
          );
        } else {
          await this.injectRightPortrait(
            params.src,
            params.name,
            params.imgId,
            params.optalign,
            emotions,
            true
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
          Logger.debug("mirroring desired: %s , current mirror %s", data.position.mirror, insert.mirrored);
          if (Boolean(data.position.mirror) != insert.mirrored) {
            insert.mirrored = data.position.mirror;
          }
          let tweenId = "portraitMove";
          let tween = TweenMax.to(insert.portraitContainer, 0.5, {
            pixi: { scaleX: data.position.mirror ? -1 : 1, x: data.position.x, y: data.position.y },
            ease: Power3.easeOut,
            onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
              ctx._removeDockTween(imgId, this, tweenId2);
            }, "onComplete"),
            onCompleteParams: [this, insert.imgId, tweenId]
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
          true
        );
        Logger.debug("add replacement complete! ", resources[data.resname], insertEmote, data.emote, render);
        if (render && app && insert && insert.dockContainer) {
          Logger.debug("RE-RENDERING with NEW texture resource %s : %s", data.resname, data.imgsrc);
          insert.optAlign = params.optalign;
          insert.name = params.name;
          insert.label.text = params.name;
          this._clearPortraitContainer(data.insertid);
          await this._setupPortraitContainer(data.insertid, insert.optAlign, data.resname, resources);
          insert.dockContainer.addChild(insert.label);
          insert.dockContainer.addChild(insert.typingBubble);
          this._repositionInsertElements(insert);
          if (data.insertid == this.speakingAs) ;
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
          true
        );
        Logger.debug("add all textures complete! ", data.emote, data.eresname, params.emotes[data.emote]);
        if (render && app && insert && insert.dockContainer && data.eresname) {
          Logger.debug("RE-RENDERING with NEW texture resource %s", data.eresname);
          insert.optAlign = params.optalign;
          insert.name = params.name;
          insert.label.text = params.name;
          this._clearPortraitContainer(data.insertid);
          await this._setupPortraitContainer(data.insertid, insert.optAlign, data.eresname, resources);
          insert.dockContainer.addChild(insert.label);
          insert.dockContainer.addChild(insert.typingBubble);
          this._repositionInsertElements(insert);
          if (data.insertid == this.speakingAs) ;
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
    this.setUserTyping(userId, data.insertid);
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
        if (insert) {
          if (this.isDelayEmote && userId == game.user.id && (this.delayedSentState == 0 || this.delayedSentState == 1)) {
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
    Logger.debug("SEND EMOTE PACKET %s,%s ??", this.isDelayEmote, this.delayedSentState);
    if (!remote && (!this.isDelayEmote || this.delayedSentState == 2) && (insert || theatreId == CONSTANTS.NARRATOR)) {
      Logger.debug("SENDING EMOTE PACKET %s,%s", this.isDelayEmote, this.delayedSentState);
      this._sendSceneEvent("emote", {
        insertid: insert ? insert.imgId : CONSTANTS.NARRATOR,
        emotions: {
          emote: insert ? this._getEmoteFromInsert(insert) : null,
          textflyin: insert ? this._getTextFlyinFromInsert(insert) : this.theatreNarrator.getAttribute("textflyin"),
          textstanding: insert ? this._getTextStandingFromInsert(insert) : this.theatreNarrator.getAttribute("textstanding"),
          textfont: insert ? this._getTextFontFromInsert(insert) : this.theatreNarrator.getAttribute("textfont"),
          textsize: insert ? this._getTextSizeFromInsert(insert) : this.theatreNarrator.getAttribute("textsize"),
          textcolor: insert ? this._getTextColorFromInsert(insert) : this.theatreNarrator.getAttribute("textcolor")
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
  setUserTyping(userId, theatreId) {
    if (!this.usersTyping[userId]) this.usersTyping[userId] = {};
    let userTyping = this.usersTyping[userId];
    if (userTyping.timeoutId) window.clearTimeout(userTyping.timeoutId);
    if (theatreId != userTyping.theatreId) {
      let insert = this.getInsertById(userTyping.theatreId);
      if (insert && insert.portrait) {
        this._removeDockTween(insert.imgId, null, "typingAppear");
        this._removeDockTween(insert.imgId, null, "typingWiggle");
        this._removeDockTween(insert.imgId, null, "typingBounce");
        let oy = insert.portrait.height - (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);
        switch (this.settings.theatreStyle) {
          case "lightbox":
            break;
          case "clearbox":
            oy += insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight;
            break;
        }
        let tweenId = "typingVanish";
        let tween = TweenMax.to(insert.typingBubble, 0.2, {
          pixi: { scaleX: 0.01, scaleY: 0.01, alpha: 0, y: oy },
          ease: Power0.easeNone,
          onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
            ctx._removeDockTween(imgId, this, tweenId2);
            this.targets()[0].scale.x = 1;
            this.targets()[0].scale.y = 1;
          }, "onComplete"),
          onCompleteParams: [this, insert.imgId, tweenId]
        });
        this._addDockTween(insert.imgId, tween, tweenId);
        userTyping.theatreId = null;
      }
    }
    if (theatreId) {
      let insert = this.getInsertById(theatreId);
      if (insert && insert.portrait && !insert.tweens["typingWiggle"]) {
        this._removeDockTween(insert.imgId, null, "typingVanish");
        let tweenId = "typingAppear";
        insert.typingBubble.scale.x = 0.01;
        insert.typingBubble.scale.y = 0.01;
        let tween = TweenMax.to(insert.typingBubble, 0.2, {
          pixi: { scaleX: 1, scaleY: 1, alpha: 1 },
          ease: Power0.easeNone,
          onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
            ctx._removeDockTween(imgId, this, tweenId2);
            this.targets()[0].scale.x = 1;
            this.targets()[0].scale.y = 1;
          }, "onComplete"),
          onCompleteParams: [this, insert.imgId, tweenId]
        });
        this._addDockTween(insert.imgId, tween, tweenId);
        tweenId = "typingWiggle";
        insert.typingBubble.rotation = 0.174533;
        tween = TweenMax.to(insert.typingBubble, 0.5, {
          pixi: { rotation: -10 },
          ease: Power0.easeNone,
          repeat: -1,
          yoyo: true,
          onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
            ctx._removeDockTween(imgId, this, tweenId2);
          }, "onComplete"),
          onCompleteParams: [this, insert.imgId, tweenId]
        });
        this._addDockTween(insert.imgId, tween, tweenId);
        let oy = insert.portrait.height - (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight) - insert.label.style.lineHeight * 0.75;
        switch (this.settings.theatreStyle) {
          case "clearbox":
            insert.typingBubble.y = insert.portrait.height;
            oy += insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight;
            break;
          case "mangabubble":
          case "lightbox":
          case "textbox":
          default:
            insert.typingBubble.y = insert.portrait.height - (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);
            break;
        }
        tweenId = "typingBounce";
        tween = TweenMax.to(insert.typingBubble, 0.25, {
          pixi: { y: oy },
          ease: Power3.easeOut,
          repeat: -1,
          yoyo: true,
          yoyoEase: Power0.easeNone,
          onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
            ctx._removeDockTween(imgId, this, tweenId2);
            this.targets()[0].y = oy;
          }, "onComplete"),
          onCompleteParams: [this, insert.imgId, tweenId]
        });
        this._addDockTween(insert.imgId, tween, tweenId);
        userTyping.theatreId = theatreId;
      } else if (theatreId == CONSTANTS.NARRATOR) {
        userTyping.theatreId = theatreId;
      }
    }
    userTyping.timeoutId = window.setTimeout(() => {
      Logger.debug("%s typing timeout", userId);
      this.removeUserTyping(userId);
    }, 6e3);
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
      if (insert) {
        this._removeDockTween(insert.imgId, null, "typingAppear");
        this._removeDockTween(insert.imgId, null, "typingWiggle");
        this._removeDockTween(insert.imgId, null, "typingBounce");
        let oy = insert.portrait.height - (insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight);
        switch (this.settings.theatreStyle) {
          case "lightbox":
            break;
          case "clearbox":
            oy += insert.optAlign == "top" ? 0 : this.theatreBar.offsetHeight;
            break;
        }
        let tweenId = "typingVanish";
        let tween = TweenMax.to(insert.typingBubble, 0.2, {
          pixi: { scaleX: 0.01, scaleY: 0.01, alpha: 0, y: oy },
          ease: Power0.easeNone,
          onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
            ctx._removeDockTween(imgId, this, tweenId2);
            this.targets()[0].scale.x = 1;
            this.targets()[0].scale.y = 1;
          }, "onComplete"),
          onCompleteParams: [this, insert.imgId, tweenId]
        });
        this._addDockTween(insert.imgId, tween, tweenId);
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
    let theatreId = `theatre-${actor._id}`;
    let portrait = actor.img ? actor.img : CONSTANTS.DEFAULT_PORTRAIT;
    let optAlign = "top";
    let name2 = Theatre.getActorDisplayName(actor._id);
    let emotes = {};
    let settings = {};
    if (actor.flags.theatre) {
      if (actor.flags.theatre.name && actor.flags.theatre.name != "") name2 = actor.flags.theatre.name;
      if (actor.flags.theatre.baseinsert && actor.flags.theatre.baseinsert != "")
        portrait = actor.flags.theatre.baseinsert;
      if (actor.flags.theatre.optalign && actor.flags.theatre.optalign != "")
        optAlign = actor.flags.theatre.optalign;
      if (actor.flags.theatre.emotes) emotes = actor.flags.theatre.emotes;
      if (actor.flags.theatre.settings) settings = actor.flags.theatre.settings;
    }
    return {
      src: portrait,
      name: name2,
      optalign: optAlign,
      imgId: theatreId,
      emotes,
      settings
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
    if (actor.ownership[userId] && actor.ownership[userId] >= 3 || actor.ownership["default"] && actor.ownership["default"] >= 3) {
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
    insert.optAlign = params.optalign;
    insert.name = params.name;
    insert.label.text = params.name;
    this._clearPortraitContainer(id);
    await this._setupPortraitContainer(id, params.optalign, resName);
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
    let canvas2 = app.view;
    if (!canvas2) {
      Logger.error("FAILED TO INITILIZE TOOLTIP CANVAS!", true);
      return null;
    }
    let holder = document.createElement("div");
    KHelpers$1.addClass(holder, "theatre-tooltip");
    KHelpers$1.addClass(holder, "app");
    holder.appendChild(canvas2);
    app.ticker.autoStart = false;
    app.ticker.stop();
    this.pixiToolTipCTX = app;
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
    let resName = emote && params.emotes[emote] && params.emotes[emote].insert ? params.emotes[emote].insert : params.src;
    const texture = await PIXI.Assets.load(resName);
    if (!texture) {
      Logger.error("ERROR could not load texture (for tooltip) %s", true, resName);
      return;
    }
    let app = this.pixiToolTipCTX;
    for (let idx2 = app.stage.children.length - 1; idx2 >= 0; --idx2) {
      let child = app.stage.children[idx2];
      child.destroy();
    }
    for (const tooltipId in this.tooltipTweens) {
      this.tooltipTweens[tooltipId].kill();
    }
    const dockContainer = new PIXI.Container();
    const portraitContainer = new PIXI.Container();
    portraitContainer.x = 0;
    portraitContainer.y = 0;
    app.stage.addChild(portraitContainer);
    app.stage.addChild(dockContainer);
    let sprite = texture;
    if (!texture.animationSpeed) {
      sprite = new PIXI.Sprite(texture);
    } else {
      sprite = texture.clone();
    }
    let portWidth = texture.width;
    let portHeight = texture.height;
    const maxHeight = 140;
    let maxSide = Math.max(portWidth, portHeight);
    let scaledWidth, scaledHeight, ratio;
    if (maxSide == portWidth) {
      scaledWidth = maxHeight;
      scaledHeight = portHeight * maxHeight / portWidth;
      ratio = scaledHeight / portHeight;
      portraitContainer.width = scaledWidth;
      portraitContainer.height = scaledHeight;
      portraitContainer.addChild(sprite);
      portraitContainer.scale.x = ratio;
      portraitContainer.scale.y = ratio;
      portraitContainer.x = 0;
      portraitContainer.y = maxHeight / 2 - scaledHeight / 2;
      if (portWidth > maxHeight) {
        portHeight *= maxHeight / portWidth;
        portWidth = maxHeight;
      }
    } else {
      scaledHeight = maxHeight;
      scaledWidth = portWidth * maxHeight / portHeight;
      ratio = scaledWidth / portWidth;
      portraitContainer.width = scaledWidth;
      portraitContainer.height = scaledHeight;
      portraitContainer.addChild(sprite);
      portraitContainer.scale.x = ratio;
      portraitContainer.scale.y = ratio;
      portraitContainer.x = maxHeight / 2 - scaledWidth / 2;
      portraitContainer.y = 0;
      if (portHeight > maxHeight) {
        portWidth *= maxHeight / portHeight;
        portHeight = maxHeight;
      }
    }
    dockContainer.width = portWidth;
    dockContainer.height = portHeight;
    dockContainer.scale.x = 0.5;
    dockContainer.scale.y = 0.5;
    dockContainer.y = 10;
    const portWidthEmote = maxHeight * 2;
    const portHeightEmote = maxHeight * 1.9;
    sprite.x = 0;
    sprite.y = 0;
    if (emote && (!params.emotes[emote] || !params.emotes[emote].insert)) {
      await this.showTooltipEmote(app, dockContainer, actorId, emote, portWidthEmote, portHeightEmote);
    }
    app.render();
    this.theatreToolTip.style.opacity = 1;
  }
  async showTooltipEmote(app, dockContainer, actorId, emote, portWidthEmote, portHeightEmote) {
    const defaultDisabled = this.isDefaultDisabled(actorId);
    Logger.debug("is default disabled? : %s", defaultDisabled);
    const emotes = Theatre.getActorEmotes(actorId, defaultDisabled);
    const rigResMap = Theatre.getActorRiggingResources(actorId);
    if (emotes[emote] && emotes[emote].rigging) {
      for (let anim of emotes[emote].rigging.animations) {
        const animName = anim.name;
        const animSyntax = anim.syntax;
        const tweenParams = Theatre.verifyAnimationSyntax(animSyntax);
        const resTarget = rigResMap.find((e) => e.name == tweenParams[0].resName);
        const textureEmote = await PIXI.Assets.load(resTarget.path);
        Logger.debug(
          "Adding tweens for animation '%s' from syntax: %s with params: ",
          animName,
          animSyntax,
          tweenParams
        );
        if (!textureEmote) {
          Logger.error(
            'ERROR: resource name : "%s" with path "%s" does not exist!',
            false,
            tweenParams[idx].resName,
            resTarget.path
          );
          return;
        }
        const emoteSprite = new PIXI.Sprite(textureEmote);
        emoteSprite.anchor.set(0.5);
        dockContainer.addChild(emoteSprite);
        emoteSprite.x = 0;
        emoteSprite.y = 0;
        for (let idx2 = 0; idx2 < tweenParams.length; ++idx2) {
          const advOptions = tweenParams[idx2].advOptions;
          let yoyo = null;
          let delay = 0;
          let repeat = 0;
          let repeatDelay = 0;
          let ease = Power0.easeNone;
          let yoyoEase = null;
          if (advOptions) {
            Logger.debug("adv options arg: ", advOptions);
            yoyo = advOptions.yoyo ? true : false;
            advOptions.noMirror ? true : false;
            delay = advOptions.delay ? Number(advOptions.delay) : delay;
            repeat = advOptions.repeat ? Number(advOptions.repeat) : repeat;
            repeatDelay = advOptions.repeatDelay ? Number(advOptions.repeatDelay) : repeatDelay;
            ease = advOptions.ease ? Theatre.verifyEase(advOptions.ease) : ease;
            yoyoEase = advOptions.yoyoEase ? Theatre.verifyEase(advOptions.yoyoEase) : yoyoEase;
          }
          const { emoteSprite: formattedEmoteSprite, pixiParams } = this.formatTweenParams(
            emoteSprite,
            tweenParams[idx2].props,
            portWidthEmote,
            portHeightEmote
          );
          const tweenId = animName + idx2;
          const tween = TweenMax.to(formattedEmoteSprite, tweenParams[idx2].duration, {
            pixi: pixiParams,
            ease,
            delay,
            repeatDelay,
            repeat,
            yoyo,
            yoyoEase,
            onComplete: /* @__PURE__ */ __name(function(ctx, tweenId2) {
              Logger.debug("ANIMATION tween complete!");
              if (this) {
                this.kill();
              }
              if (!this.tooltipTweens || !this.tooltipTweens[tweenId2]) {
                return;
              }
              if (!this) {
                this.tooltipTweens[tweenId2].kill();
              }
              this.tooltipTweens[tweenId2] = null;
              let nTweens = {};
              for (let prop in this.tooltipTweens) {
                if (this.tooltipTweens[prop] != null) {
                  nTweens[prop] = this.tooltipTweens[prop];
                }
              }
              this.tooltipTweens = nTweens;
            }, "onComplete"),
            onCompleteParams: [this, tweenId]
          });
          if (repeat != 0) {
            tween.duration(tweenParams[idx2].duration);
          }
          if (!app.stage) {
            if (tween) {
              tween.kill();
            }
            return;
          }
          if (this.tooltipTweens[tweenId]) {
            this.tooltipTweens[tweenId].kill();
          }
          this.tooltipTweens[tweenId] = tween;
        }
      }
    }
  }
  formatTweenParams(emoteSprite, tweenParamsProps, portWidthEmote, portHeightEmote) {
    const pixiParams = {};
    for (const prop of tweenParamsProps) {
      if (prop.name == "x" || prop.name == "y" || prop.name == "rotation" || prop.name == "scaleX" || prop.name == "scaleY") {
        if (prop.initial.includes("%")) {
          prop.initial = Number(prop.initial.match(/-*\d+\.*\d*/)[0] || 0) / 100 * (prop.name == "x" ? portWidthEmote : portHeightEmote);
          prop.final = Number(prop.final.match(/-*\d+\.*\d*/)[0] || 0) / 100 * (prop.name == "x" ? portWidthEmote : portHeightEmote);
        } else if (["scaleX", "scaleY", "rotation"].some((e) => e == prop.name)) {
          prop.initial = Number(prop.initial.match(/-*\d+\.*\d*/)[0] || 0);
          prop.final = Number(prop.final.match(/-*\d+\.*\d*/)[0] || 0);
        }
        Logger.debug("new %s : %s,%s", prop.name, prop.initial, prop.final);
      }
      switch (prop.name) {
        case "scaleX":
          emoteSprite.scale.x = prop.initial;
          break;
        case "scaleY":
          emoteSprite.scale.y = prop.initial;
          break;
        case "rotation":
          emoteSprite.rotation = prop.initial * (Math.PI / 180);
          break;
        default:
          emoteSprite[prop.name] = prop.initial;
          break;
      }
      pixiParams[prop.name] = prop.final;
    }
    return { emoteSprite, pixiParams };
  }
  /**
   * Inititalize Face API
   *
   *
   * @private
   */
  _initFaceAPI() {
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
    let app = new PIXI.Application({
      backgroundAlpha: 0,
      antialias: true,
      width: document.body.offsetWidth,
      resolution: game.settings.get("core", "pixelRatioResolutionScaling") ? window.devicePixelRatio : 1
    });
    let canvas2 = app.view;
    if (!canvas2) {
      Logger.error("FAILED TO INITILIZE DOCK CANVAS!", true);
      return null;
    }
    this.theatreDock = canvas2;
    this.pixiCTX = app;
    app.ticker.autoStart = false;
    app.ticker.stop();
    return canvas2;
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
    this.pixiCTX.ticker.update(time);
    this.pixiToolTipCTX.ticker.update(time);
    for (let insert of this.portraitDocks) {
      if (insert.dockContainer) {
        if (TheatreHelpers._isDebugActive()) {
          this._updateTheatreDebugInfo(insert);
        }
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
      Logger.error("Invalid Tween for %s", false, imgId);
      if (tween) tween.kill();
      return;
    }
    if (insert.tweens[tweenId]) {
      insert.tweens[tweenId].kill();
      this.renderAnims--;
    }
    if (this.renderAnims > 0) {
      this.renderAnims++;
      insert.tweens[tweenId] = tween;
    } else {
      this.renderAnims = 1;
      insert.tweens[tweenId] = tween;
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
      if (!insert.tweens[tweenId]) return;
      if (!tween) insert.tweens[tweenId].kill();
      insert.tweens[tweenId] = null;
      let nTweens = {};
      for (let prop in insert.tweens) {
        if (insert.tweens[prop] != null) nTweens[prop] = insert.tweens[prop];
      }
      insert.tweens = nTweens;
    }
    this.renderAnims--;
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
    this.pixiCTX;
    let insert = this.getInsertById(imgId);
    if (insert && insert.dockContainer) {
      for (let tweenId in insert.tweens) this._removeDockTween(imgId, null, tweenId);
      insert.tweens = null;
      for (let child of insert.portraitContainer.children) child.destroy();
      for (let child of insert.dockContainer.children) child.destroy();
      insert.portrait = null;
      insert.portraitContainer = null;
      insert.label = null;
      insert.dockContainer.destroy();
      insert.dockContainer = null;
      let idx2 = this.portraitDocks.findIndex((e) => e.imgId == imgId);
      this.portraitDocks.splice(idx2, 1);
      document.querySelectorAll("#pause").forEach((ele) => KHelpers$1.removeClass(ele, "theatre-centered"));
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
    let dockContainer = new PIXI.Container();
    let portraitContainer = new PIXI.Container();
    dockContainer.addChild(portraitContainer);
    portraitContainer.x = 0;
    portraitContainer.y = 0;
    let app = this.pixiCTX;
    app.stage.addChild(dockContainer);
    if (!!this.getInsertById(imgId)) {
      Logger.debug("PRE-EXISTING PIXI CONTAINER FOR %s ", imgId);
      this._destroyPortraitDock(imgId);
    }
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
      imgId,
      dockContainer,
      name: portName,
      emote: ename,
      textFlyin,
      textStanding,
      textFont,
      textSize,
      textColor,
      portraitContainer,
      portrait: null,
      label: null,
      typingBubble: null,
      exitOrientation: isLeft ? "left" : "right",
      nameOrientation: "left",
      mirrored: false,
      optAlign,
      tweens: {},
      order: 0,
      renderOrder: 0,
      meta: {}
    });
    let imgSrcs = [];
    imgSrcs.push({
      imgpath: "modules/theatre/assets/graphics/typing.png",
      resname: "modules/theatre/assets/graphics/typing.png"
    });
    imgSrcs.push({ imgpath: imgPath, resname: imgPath });
    Logger.debug("Adding %s with src %s", portName, imgPath);
    let actorId = imgId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
    let params = this._getInsertParamsFromActorId(actorId);
    if (!params) {
      Logger.error("ERROR: Actor does not exist for %s", false, actorId);
      this._destroyPortraitDock(imgId);
      return null;
    }
    let rigResources = Theatre.getActorRiggingResources(actorId);
    Logger.debug("RigResources for %s :", portName, rigResources);
    for (let rigResource of rigResources) imgSrcs.push({ imgpath: rigResource.path, resname: rigResource.path });
    for (let emName in params.emotes)
      if (params.emotes[emName]) {
        if (params.emotes[emName].insert && params.emotes[emName].insert != "")
          imgSrcs.push({ imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert });
      }
    const resources = await this._addSpritesToPixi(imgSrcs);
    Logger.debug("Sprites added to PIXI _createPortraitPIXIContainer", resources);
    let portWidth = ename && params.emotes[ename] && params.emotes[ename].insert ? resources[params.emotes[ename].insert].width : resources[imgPath].width;
    let initX = isLeft ? -1 * portWidth : this.theatreDock.offsetWidth + portWidth;
    if (!ename) {
      dockContainer.x = initX;
      await this._setupPortraitContainer(imgId, optAlign, imgPath, resources, true);
    } else {
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
          "Theatre.UI.Notification.ImageLoadFail_P2"
        )} ${resName}`,
        true
      );
      this.removeInsertById(imgId);
      return;
    }
    if (!resources[resName]) {
      Logger.error("ERROR could not load texture %s", true, resName, resources);
      Logger.error(
        `${game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1")} ${imgId} ${game.i18n.localize(
          "Theatre.UI.Notification.ImageLoadFail_P2"
        )} ${resName}`,
        true
      );
      this.removeInsertById(imgId);
      return;
    }
    this.pixiCTX;
    let dockContainer = insert.dockContainer;
    let portraitContainer = insert.portraitContainer;
    let sprite = resources[resName];
    if (!resources[resName].animationSpeed) {
      sprite = new PIXI.Sprite(resources[resName]);
    } else {
      sprite = resources[resName].clone();
    }
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
    dockContainer.width = portWidth;
    dockContainer.height = portHeight;
    portraitContainer.width = portWidth;
    portraitContainer.height = portHeight;
    dockContainer.y = this.theatreDock.offsetHeight - (optAlign == "top" ? this.theatreBar.offsetHeight : 0) - portHeight;
    insert.portrait = sprite;
    insert.portrait.width = portWidth;
    insert.portrait.height = portHeight;
    portraitContainer.addChild(sprite);
    portraitContainer.pivot.x = portWidth / 2;
    portraitContainer.pivot.y = portHeight / 2;
    portraitContainer.x = portraitContainer.x + portWidth / 2;
    portraitContainer.y = portraitContainer.y + portHeight / 2;
    sprite.x = 0;
    sprite.y = 0;
    if (insert.mirrored) {
      portraitContainer.scale.x = -1;
    }
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
        wordWrapWidth: portWidth
      });
      let label = new PIXI.Text(insert.name, textStyle);
      label.theatreComponentName = "label";
      insert.label = label;
      dockContainer.addChild(label);
      insert.label.x = 20;
    }
    insert.label.y = portHeight - (optAlign == "top" ? 0 : this.theatreBar.offsetHeight) - insert.label.lineHeight - 20;
    if (!insert.typingBubble) {
      let typingBubble = new PIXI.Sprite();
      typingBubble.texture = resources["modules/theatre/assets/graphics/typing.png"];
      typingBubble.width = 55;
      typingBubble.height = 55;
      typingBubble.theatreComponentName = "typingBubble";
      typingBubble.alpha = 0;
      typingBubble.y = portHeight - (optAlign == "top" ? 0 : this.theatreBar.offsetHeight) - insert.label.style.lineHeight + typingBubble.height / 2;
      insert.typingBubble = typingBubble;
      dockContainer.addChild(typingBubble);
    }
    switch (this.settings.theatreStyle) {
      case "lightbox":
        dockContainer.y += optAlign == "top" ? 8 : 0;
        insert.label.y -= insert.optAlign == "top" ? 8 : 0;
        break;
      case "clearbox":
        dockContainer.y = this.theatreDock.offsetHeight - portHeight;
        insert.label.y += optAlign == "top" ? 0 : this.theatreBar.offsetHeight;
        insert.typingBubble.y += optAlign == "top" ? 0 : this.theatreBar.offsetHeight;
        break;
    }
    Logger.debug("Portrait loaded with w:%s h:%s", portWidth, portHeight, sprite);
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
      let graphics = new PIXI.Graphics();
      graphics.lineStyle(1, 16706423, 1);
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
        wordWrapWidth: portWidth
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
        wordWrapWidth: portWidth
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
        wordWrapWidth: portWidth
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
      graphics = new PIXI.Graphics();
      graphics.lineStyle(1, 16777215, 1);
      graphics.moveTo(0, 0);
      graphics.lineTo(portWidth, 0);
      graphics.lineTo(portWidth, portHeight);
      graphics.lineTo(0, portHeight);
      graphics.lineTo(0, 0);
      portraitContainer.addChild(graphics);
    }
    if (reorder) {
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
      info.text = `imgId: ${insert.imgId}
dockContainer (exists): ${!!insert.dockContainer}
name: ${insert.name}
emote: ${insert.emote}
textFlyin: ${insert.textFlyin}
textStanding: ${insert.textStanding}
textFont: ${insert.textFont}
textSize: ${insert.textSize}
textColor: ${insert.textColor}
portraitContainer (exists): ${!!insert.portraitContainer}
portraitContainer (XPos): ${insert.portraitContainer.x}
portraitContainer (YPos): ${insert.portraitContainer.y}
portrait (exists): ${!!insert.portrait}
label: ${insert.label.text}
typingBubble (exists): ${!!insert.typingBubble}
exitOrientation: ${insert.exitOrientation}
nameOrientation: ${insert.nameOrientation}
mirrored: ${insert.mirrored}
optAlign: ${insert.optAlign}
tweens (# active): ${Object.keys(insert.tweens).length}
decayTOId: ${insert.decayTOId}
order: ${insert.order}
renderOrder: ${insert.renderOrder}
`;
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
    let textBox = this.getTextBoxById(insert.imgId);
    let offset = KHelpers$1.offset(textBox);
    let leftPos = Math.round(
      Number(offset.left || 0) - Number(KHelpers$1.style(textBox)["left"].match(/\-*\d+\.*\d*/) || 0) - Number(KHelpers$1.style(this.theatreBar)["margin-left"].match(/\-*\d+\.*\d*/) || 0)
    );
    insert.label.style.wordWrap = false;
    insert.label.style.wordWrapWidth = insert.portrait.width;
    let labelExceeds = insert.label.width + 20 + insert.label.style.fontSize > textBox.offsetWidth;
    let preLabelWidth = insert.label.width;
    insert.label.style.wordWrap = true;
    insert.label.style.wordWrapWidth = textBox.offsetWidth;
    if (insert.nameOrientation == "left") {
      insert.label.x = 20;
      insert.typingBubble.anchor.set(0.5);
      insert.typingBubble.x = Math.min(
        preLabelWidth + 20 + insert.typingBubble.width / 2,
        textBox.offsetWidth - insert.typingBubble.width / 2
      );
    } else {
      if (labelExceeds) {
        insert.label.x = insert.portrait.width - insert.label.width - 20;
        if (insert.label.width - 20 > insert.portrait.width)
          insert.typingBubble.x = Math.min(
            insert.portrait.width - insert.label.width - insert.typingBubble.texture.width / 2 - 20,
            insert.typingBubble.width / 2
          );
        else
          insert.typingBubble.x = Math.max(
            insert.portrait.width - insert.label.width - insert.typingBubble.texture.width / 2 - 20,
            insert.typingBubble.width / 2
          );
      } else {
        insert.label.x = insert.portrait.width - preLabelWidth - 20;
        if (preLabelWidth - 20 > insert.portrait.width)
          insert.typingBubble.x = Math.min(
            insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width / 2 - 20,
            insert.typingBubble.width / 2
          );
        else
          insert.typingBubble.x = Math.max(
            insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width / 2 - 20,
            insert.typingBubble.width / 2
          );
      }
      insert.typingBubble.anchor.set(0.5);
      leftPos += textBox.offsetWidth - insert.portrait.width;
    }
    insert.typingBubble.y = insert.portrait.height - (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight + insert.typingBubble.height / 2;
    if (labelExceeds) {
      let divisor = Math.round(insert.label.height / insert.label.style.lineHeight);
      insert.label.y = insert.portrait.height - (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight * divisor;
    } else {
      insert.label.y = insert.portrait.height - (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight;
    }
    insert.typingBubble.rotation = 0.1745;
    insert.dockContainer.x = leftPos;
    insert.dockContainer.y = this.theatreDock.offsetHeight - (insert.optAlign == "top" ? this.theatreBar.offsetHeight : 0) - insert.portrait.height;
    switch (this.settings.theatreStyle) {
      case "lightbox":
        insert.dockContainer.y += insert.optAlign == "top" ? 8 : 0;
        insert.label.y -= insert.optAlign == "top" ? 8 : 0;
        break;
      case "clearbox":
        insert.dockContainer.y = this.theatreDock.offsetHeight - insert.portrait.height;
        insert.label.y += insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight;
        insert.typingBubble.y += insert.optAlign == "top" ? 0 : Theatre.instance.offsetHeight;
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
    let insert = this.getInsertById(imgId);
    insert ? insert.dockContainer : null;
    this.pixiCTX;
    let actorId = imgId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
    this._getInsertParamsFromActorId(actorId);
    if (!await foundry.canvas.srcExists(imgSrc)) {
      Logger.error("ERROR (_AddTextureResource) : Replacement texture does not exist %s ", false, imgSrc);
      return;
    }
    if (!resName || resName == "") {
      return {};
    }
    let imgSrcs = [{ resname: resName, imgpath: imgSrc }];
    Logger.debug("replace textures", imgSrcs);
    if (!remote) {
      this._sendSceneEvent("addtexture", {
        insertid: imgId,
        imgsrc: imgSrc,
        resname: resName,
        emote
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
    let insert = this.getInsertById(imgId);
    insert ? insert.dockContainer : null;
    this.pixiCTX;
    let actorId = imgId.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
    this._getInsertParamsFromActorId(actorId);
    for (let src of imgSrcs)
      if (!await foundry.canvas.srcExists(src.imgpath)) {
        Logger.error("ERROR (_AddAllTextureResources) : Replacement texture does not exist %s ", false, src);
        return;
      }
    if (imgSrcs.length <= 0) {
      return {};
    }
    Logger.debug("replace textures", imgSrcs);
    if (!remote) {
      this._sendSceneEvent("addalltextures", {
        insertid: imgId,
        imgsrcs: imgSrcs,
        emote,
        eresname: eresName
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
    let ox = insert.portraitContainer.x - insert.portrait.width / 2;
    let oy = insert.portraitContainer.y - insert.portrait.height / 2;
    let ocx = insert.dockContainer.x;
    let ocy = insert.dockContainer.y;
    let oLabelAnim = insert.tweens["nameSpeakingPulse"];
    let oTypingBounceAnim = insert.tweens["typingBounce"];
    let oTypingWiggleAnim = insert.tweens["typingWiggle"];
    let oTypingAppearAnim = insert.tweens["typingAppear"];
    let oTypingVanishAnim = insert.tweens["typingVanish"];
    for (let tweenId in insert.tweens) {
      if (tweenId == "nameSpeakingPulse" || tweenId == "typingBounce" || tweenId == "typingAppear" || tweenId == "typingVanish" || tweenId == "typingWiggle")
        continue;
      this._removeDockTween(imgId, null, tweenId);
    }
    insert.tweens = {};
    if (oLabelAnim) insert.tweens["nameSpeakingPulse"] = oLabelAnim;
    if (oTypingBounceAnim) insert.tweens["typingBounce"] = oTypingBounceAnim;
    if (oTypingWiggleAnim) insert.tweens["typingWiggle"] = oTypingWiggleAnim;
    if (oTypingAppearAnim) insert.tweens["typingAppear"] = oTypingAppearAnim;
    if (oTypingVanishAnim) insert.tweens["typingVanish"] = oTypingVanishAnim;
    for (let child of insert.portraitContainer.children) child.destroy();
    for (let idx2 = insert.dockContainer.children.length - 1; idx2 >= 0; --idx2) {
      let child = insert.dockContainer.children[idx2];
      if (child.theatreComponentName && child.theatreComponentName == "label")
        insert.dockContainer.removeChildAt(idx2);
      else if (child.theatreComponentName && child.theatreComponentName == "typingBubble")
        insert.dockContainer.removeChildAt(idx2);
      else child.destroy();
    }
    insert.portrait = null;
    insert.portraitContainer = null;
    insert.dockContainer.destroy();
    insert.dockContainer = null;
    let dockContainer = new PIXI.Container();
    let portraitContainer = new PIXI.Container();
    dockContainer.addChild(portraitContainer);
    portraitContainer.x = ox;
    portraitContainer.y = oy;
    dockContainer.x = ocx;
    dockContainer.y = ocy;
    insert.dockContainer = dockContainer;
    insert.portraitContainer = portraitContainer;
    Logger.debug("saving ox: %s, oy: %s", ox, oy);
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
      })
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
      imgSrcs.push({ imgpath: params.src, resname: params.src });
      let rigResources = Theatre.getActorRiggingResources(actorId);
      Logger.debug("RigResources for %s :", params.name, rigResources);
      for (let rigResource of rigResources)
        imgSrcs.push({ imgpath: rigResource.path, resname: rigResource.path });
      for (let emName in params.emotes)
        if (params.emotes[emName]) {
          if (params.emotes[emName].insert && params.emotes[emName].insert != "")
            imgSrcs.push({ imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert });
        }
    }
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
    let imgSrcs = [];
    if (!params) {
      Logger.error("ERROR: Actor does not exist for %s", false, actorId);
      return null;
    }
    imgSrcs.push({ imgpath: params.src, resname: params.src });
    let rigResources = Theatre.getActorRiggingResources(actorId);
    Logger.debug("RigResources for %s :", params.name, rigResources);
    for (let rigResource of rigResources) imgSrcs.push({ imgpath: rigResource.path, resname: rigResource.path });
    for (let emName in params.emotes)
      if (params.emotes[emName]) {
        if (params.emotes[emName].insert && params.emotes[emName].insert != "")
          imgSrcs.push({ imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert });
      }
    await this._addSpritesToPixi(imgSrcs);
    Logger.debug("staging complete for %s", theatreId);
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
  setEmoteForInsertByName(ename, name2, remote) {
    let insert = this.getInsertByName(name2);
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
    if (remote || !this.isDelayEmote) {
      if (aEmote == ename || ename == null && aEmote == null) {
        return;
      }
    }
    this.pixiCTX;
    if (!!ename && emotes[ename] && emotes[ename].insert && emotes[ename].insert != "") {
      this._clearPortraitContainer(insert.imgId);
      let imgSrcs = [];
      let emoteResName = emotes[ename].insert;
      imgSrcs.push({ imgpath: emotes[ename].insert, resname: emoteResName });
      const resources = await this._addSpritesToPixi(imgSrcs);
      Logger.debug("emote insert loaded", resources);
      if (!resources[emoteResName] || resources[emoteResName].error) {
        Logger.error(
          "ERROR loading resource %s : %s : %s",
          true,
          insert.imgId,
          emoteResName,
          emotes[ename].insert
        );
        Logger.error(
          game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1") + +emoteResName + game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2") + emotes[ename].insert + "'",
          true
        );
        this.removeInsertById(insert.imgId);
      }
      insert.emote = ename;
      await this._setupPortraitContainer(insert.imgId, insert.optAlign, emoteResName, resources);
      insert.dockContainer.addChild(insert.label);
      insert.dockContainer.addChild(insert.typingBubble);
      this._repositionInsertElements(insert);
      if (!this.rendering) this._renderTheatre(performance.now());
    } else {
      this._clearPortraitContainer(insert.imgId);
      if (ename) insert.emote = ename;
      else insert.emote = null;
      let imgSrcs = [];
      imgSrcs.push({ imgpath: baseInsert, resname: baseInsert });
      const resources = await this._addSpritesToPixi(imgSrcs);
      Logger.debug("base insert loaded", resources);
      if (!resources[baseInsert] || resources[baseInsert].error) {
        Logger.error("ERROR loading resource %s : %s : %s", true, insert.imgId, baseInsert, baseInsert);
        Logger.error(
          game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P1") + +baseInsert + game.i18n.localize("Theatre.UI.Notification.ImageLoadFail_P2") + baseInsert + "'",
          true
        );
        this.removeInsertById(insert.imgId);
      }
      await this._setupPortraitContainer(insert.imgId, insert.optAlign, baseInsert, resources);
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
  _getTextBoxByName(name2) {
    return this._getTextBoxes().find((e) => {
      return e.getAttribute("name") == name2;
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
      primeBar.appendChild(textBox);
      primeBar.style.left = "0%";
      primeBar.style.opacity = "1";
      primeBar.style["pointer-events"] = "all";
      this.theatreBar.style.opacity = "1";
      Hooks.call("theatreDockActive", this.dockActive);
    } else if (textBoxes.length == 1) {
      let insert = this.getInsertById(textBox.getAttribute("imgId"));
      if (insert) {
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
      for (let sbb of secondBar.children) {
        let insert = this.getInsertById(sbb.getAttribute("imgId"));
        if (insert) {
          insert.nameOrientation = "left";
        }
        primeBar.appendChild(sbb);
      }
      secondBar.style.left = "200%";
      secondBar.style.opacity = "0";
      secondBar.style["pointer-events"] = "none";
      primeBar.style.width = "100%";
      if (isLeft) KHelpers$1.insertBefore(textBox, primeBar.children[0]);
      else primeBar.appendChild(textBox);
      Hooks.call("theatreDockActive", this.dockActive);
    } else if (textBoxes.length > 2) {
      if (isLeft) KHelpers$1.insertBefore(textBox, primeBar.children[0]);
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
      Logger.debug("REMOVE TEXTBOX ERROR, NO TEXTBOXES", textBox, this.theatreBar);
    } else if (textBoxes.length == 1) {
      primeBar.style.left = "-100%";
      primeBar.style.opacity = "0";
      primeBar.style["pointer-events"] = "none";
      textBox.parentNode.removeChild(textBox);
      this.theatreBar.style.opacity = "0";
      Hooks.call("theatreDockActive", this.dockActive);
    } else if (textBoxes.length == 2) {
      for (let sbb of secondBar.children) {
        if (sbb.getAttribute("imgId") != textBox.getAttribute("imgId")) {
          let insert = this.getInsertById(sbb.getAttribute("imgId"));
          if (insert) {
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
      for (let idx2 = primeBar.children.length - 1; idx2 >= 0; --idx2) {
        if (primeBar.children[idx2].getAttribute("imgId") != textBox.getAttribute("imgId")) {
          let insert = this.getInsertById(primeBar.children[idx2].getAttribute("imgId"));
          if (insert) {
            insert.nameOrientation = "right";
          }
          secondBar.appendChild(primeBar.children[idx2]);
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
      await this.injectRightPortrait(imgPath, portName, imgId, optAlign, emotions, remote);
      return;
    }
    let navItem = this.getNavItemById(imgId);
    if (navItem) KHelpers$1.addClass(navItem, "theatre-control-nav-bar-item-active");
    this._createPortraitPIXIContainer(imgPath, portName, imgId, optAlign, emotions, true);
    let textBox = document.createElement("div");
    switch (this.settings.theatreStyle) {
      case "lightbox":
        KHelpers$1.addClass(textBox, "theatre-text-box-light");
        break;
      case "clearbox":
        KHelpers$1.addClass(textBox, "theatre-text-box-clear");
        break;
      case "mangabubble":
        break;
      case "textbox":
      default:
        KHelpers$1.addClass(textBox, "theatre-text-box");
        break;
    }
    KHelpers$1.addClass(textBox, "no-scrollbar");
    portName = portName.toLowerCase();
    textBox.setAttribute("name", portName);
    textBox.setAttribute("imgid", imgId);
    textBox.style.opacity = "0";
    this._applyFontFamily(textBox, this.textFont);
    textBox.addEventListener("mousedown", this.handleTextBoxMouseDown);
    textBox.addEventListener("mouseup", this.handleTextBoxMouseUp);
    textBox.addEventListener("dblclick", this.handleTextBoxMouseDoubleClick);
    this._addTextBoxToTheatreBar(textBox, true);
    if (!remote) this._sendSceneEvent("enterscene", { insertid: imgId, emotions, isleft: true });
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
      await this.injectLeftPortrait(imgPath, portName, imgId, optAlign, emotions, remote);
      return;
    }
    let navItem = this.getNavItemById(imgId);
    if (navItem) KHelpers$1.addClass(navItem, "theatre-control-nav-bar-item-active");
    this._createPortraitPIXIContainer(imgPath, portName, imgId, optAlign, emotions, false);
    let textBox = document.createElement("div");
    switch (this.settings.theatreStyle) {
      case "lightbox":
        KHelpers$1.addClass(textBox, "theatre-text-box-light");
        break;
      case "clearbox":
        KHelpers$1.addClass(textBox, "theatre-text-box-clear");
        break;
      case "mangabubble":
        break;
      case "textbox":
      default:
        KHelpers$1.addClass(textBox, "theatre-text-box");
        break;
    }
    KHelpers$1.addClass(textBox, "no-scrollbar");
    portName = portName.toLowerCase();
    textBox.setAttribute("name", portName);
    textBox.setAttribute("imgid", imgId);
    textBox.style.opacity = "0";
    this._applyFontFamily(textBox, this.textFont);
    textBox.addEventListener("mousedown", this.handleTextBoxMouseDown);
    textBox.addEventListener("mouseup", this.handleTextBoxMouseUp);
    textBox.addEventListener("dblclick", this.handleTextBoxMouseDoubleClick);
    this._addTextBoxToTheatreBar(textBox);
    if (!remote) this._sendSceneEvent("enterscene", { insertid: imgId, emotions, isleft: false });
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
  removeInsertByName(name2, remote) {
    name2 = name2.toLowerCase();
    let id = null, toRemoveInsert, toRemoveTextBox;
    for (let insert of this.portraitDocks) {
      if (insert.name == name2 && !insert.deleting) {
        id = insert.imgId;
        insert.deleting = true;
        toRemoveInsert = insert;
        break;
      }
    }
    if (!id) return;
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
    if (!remote && !isOwner) {
      Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
      return null;
    }
    if (toRemoveInsert.decayTOId) {
      window.clearTimeout(toRemoveInsert.decayTOId);
      toRemoveInsert.decayTOId = null;
    }
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
    let exitX = 0;
    if (toRemoveInsert.portrait) {
      if (toRemoveInsert.exitOrientation == "left") {
        exitX = toRemoveInsert.dockContainer.x - toRemoveInsert.portrait.width;
      } else {
        exitX = toRemoveInsert.dockContainer.x + toRemoveInsert.portrait.width;
      }
    }
    if (!remote) this._sendSceneEvent("exitscene", { insertid: toRemoveInsert.imgId });
    for (let navItem of this.theatreNavBar.children)
      if (navItem.getAttribute("imgId") == toRemoveInsert.imgId) {
        KHelpers$1.removeClass(navItem, "theatre-control-nav-bar-item-active");
        if (toRemoveInsert.imgId == this.speakingAs)
          KHelpers$1.removeClass(navItem, "theatre-control-nav-bar-item-speakingas");
      }
    if (this.speakingAs == toRemoveInsert.imgId) {
      let cimg = this.getTheatreCoverPortrait();
      cimg.removeAttribute("src");
      cimg.style.opacity = "0";
      let label = this._getLabelFromInsert(toRemoveInsert);
      TweenMax.killTweensOf(label);
      for (let userId in this.usersTyping)
        if (this.usersTyping[userId] && this.usersTyping[userId].theatreId == toRemoveInsert.imgId) {
          this.removeUserTyping(userId);
          this.usersTyping[userId] = null;
          break;
        }
      this.speakingAs = null;
      this.renderEmoteMenu();
    }
    for (let c of toRemoveTextBox.children) {
      for (let sc of c.children) TweenMax.killTweensOf(sc);
      TweenMax.killTweensOf(c);
    }
    TweenMax.killTweensOf(toRemoveTextBox);
    toRemoveTextBox.style.opacity = 0;
    let tweenId = "containerSlide";
    let tween = TweenMax.to(toRemoveInsert.dockContainer, 1, {
      //delay: 0.5,
      pixi: { x: exitX, alpha: 0 },
      ease: Power4.easeOut,
      onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
        ctx._removeDockTween(imgId, this, tweenId2);
      }, "onComplete"),
      onCompleteParams: [this, toRemoveInsert.imgId, tweenId]
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
    }, 1e3);
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
  getNavItemByName(name2) {
    for (let navItem of this.theatreNavBar.children) {
      if (navItem.getAttribute("name") == name2) return navItem;
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
  getTextBoxByName(name2) {
    if (name2 == CONSTANTS.NARRATOR)
      return this.theatreNarrator.getElementsByClassName("theatre-narrator-content")[0];
    for (let textBox of this._getTextBoxes()) {
      if (textBox.getAttribute("name") == name2) {
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
    for (let idx2 = this.portraitDocks.length - 1; idx2 >= 0; --idx2)
      if (this.portraitDocks[idx2].imgId == id) {
        if (this.portraitDocks[idx2].dockContainer) return this.portraitDocks[idx2];
        else {
          this.portraitDocks.splice(idx2, 1);
          return void 0;
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
  getInsertByName(name2) {
    for (let idx2 = this.portraitDocks.length - 1; idx2 >= 0; --idx2)
      if (this.portraitDocks[idx2].name == name2) {
        if (this.portraitDocks[idx2].dockContainer) return this.portraitDocks[idx2];
        else {
          this.portraitDocks.splice(idx2, 1);
          return void 0;
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
    let tsib1n = textBox1.nextSibling, tsib1p = textBox1.previousSibling, tsib2n = textBox2.nextSibling, tsib2p = textBox2.previousSibling;
    let adjSwap = false;
    if (!remote && (!this.isPlayerOwned(insert1.imgId) || !this.isPlayerOwned(insert2.imgId))) {
      Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotSwapControlled"), true);
      return;
    } else if (!remote && !this.isActorOwner(game.user.id, insert1.imgId) && !this.isActorOwner(game.user.id, insert2.imgId)) {
      Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotSwapOwner"), true);
      return;
    }
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
      if (tsib1n) {
        KHelpers$1.insertBefore(textBox2, tsib1n);
      } else if (tsib1p && tsib1p != textBox2) {
        KHelpers$1.insertAfter(textBox2, tsib1p);
      } else {
        Logger.debug("NO TSIB1 and PRIOR");
        KHelpers$1.insertAfter(textBox2, textBox1);
        adjSwap = true;
      }
      if (!adjSwap) {
        if (tsib2n) {
          KHelpers$1.insertBefore(textBox1, tsib2n);
        } else if (tsib2p && tsib2p != textBox1) {
          KHelpers$1.insertAfter(textBox1, tsib2p);
        } else {
          Logger.debug("NO TSIB2 and PRIOR");
          KHelpers$1.insertAfter(textBox1, textBox2);
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
    if (!remote) {
      Theatre.instance._sendSceneEvent("swap", {
        insertid1: insert1.imgId,
        insertid2: insert2.imgId
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
    textBox1.nextSibling;
    textBox1.previousSibling;
    textBox2.nextSibling;
    textBox2.previousSibling;
    if (!remote && !this.isActorOwner(game.user.id, insert2.imgId)) {
      Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotMoveOwner"), true);
      return;
    } else if (!remote && (!this.isPlayerOwned(insert1.imgId) || !this.isPlayerOwned(insert2.imgId))) {
      Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotMoveControlled"), true);
      return;
    }
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
      if (insert2.order > insert1.order) KHelpers$1.insertBefore(textBox2, textBox1);
      else KHelpers$1.insertAfter(textBox2, textBox1);
    }
    if (this.reorderTOId) window.clearTimeout(this.reorderTOId);
    this.reorderTOId = window.setTimeout(() => {
      Theatre.reorderInserts();
      this.reorderTOId = null;
    }, 250);
    if (!remote) {
      Theatre.instance._sendSceneEvent("move", {
        insertid1: insert1.imgId,
        insertid2: insert2.imgId
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
  pushInsertByName(name2, isLeft, remote) {
    if (this.portraitDocks.length <= 2) return;
    let targInsert;
    let targTextBox;
    for (let insert of this.portraitDocks) {
      if (insert.name == name2) {
        targInsert = insert;
        break;
      }
    }
    for (let textBox of this._getTextBoxes()) {
      if (textBox.getAttribute("name") == name2) {
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
    if (!remote && !this.isActorOwner(game.user.id, insert.imgId)) {
      Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
      return;
    } else if (!remote && (isLeft ? !this.isPlayerOwned(firstInsert.imgId) : !this.isPlayerOwned(lastInsert.imgId))) {
      if (isLeft) {
        Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotPushFront"), true);
      } else {
        Logger.info(game.i18n.localize("Theatre.UI.Notification.CannotPushBack"), true);
      }
      return;
    }
    if (isLeft) {
      KHelpers$1.insertBefore(textBox, firstTextBox);
    } else {
      KHelpers$1.insertAfter(textBox, lastTextBox);
    }
    Theatre.reorderInserts();
    if (!remote) {
      Theatre.instance._sendSceneEvent("push", {
        insertid: insert.imgId,
        tofront: isLeft
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
  mirrorInsertByName(name2, remote) {
    let insert = this.getInsertByName(name2);
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
        onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
          ctx._removeDockTween(imgId, this, tweenId2);
        }, "onComplete"),
        onCompleteParams: [this, insert.imgId, tweenId]
      });
      this._addDockTween(insert.imgId, tween, tweenId);
      broadcast = true;
    } else if (!insert.tweens[tweenId]) {
      insert.mirrored = false;
      let tween = TweenMax.to(insert.portraitContainer, 0.5, {
        pixi: { scaleX: 1 },
        ease: Power4.easeInOut,
        onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
          ctx._removeDockTween(imgId, this, tweenId2);
        }, "onComplete"),
        onCompleteParams: [this, insert.imgId, tweenId]
      });
      this._addDockTween(insert.imgId, tween, tweenId);
      broadcast = true;
    }
    if (!remote && broadcast) {
      Theatre.instance._sendSceneEvent("positionupdate", {
        insertid: insert.imgId,
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
  resetInsertByName(name2, remote) {
    let insert = this.getInsertByName(name2);
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
    if (!remote && !this.isActorOwner(game.user.id, insert.imgId)) {
      Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
      return;
    }
    let tweenId, tween;
    insert.mirrored = false;
    tweenId = "portraitMove";
    tween = TweenMax.to(insert.portraitContainer, 0.5, {
      pixi: { scaleX: 1, x: insert.portrait.width / 2, y: insert.portrait.height / 2 },
      ease: Power3.easeOut,
      onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
        Logger.debug("portrait move onComplete %s", tweenId2);
        ctx._removeDockTween(imgId, this, tweenId2);
      }, "onComplete"),
      onCompleteParams: [this, insert.imgId, tweenId]
    });
    this._addDockTween(insert.imgId, tween, tweenId);
    if (!remote) {
      Theatre.instance._sendSceneEvent("positionupdate", {
        insertid: insert.imgId,
        position: { x: insert.portrait.width / 2, y: insert.portrait.height / 2, mirror: false }
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
      tweenParams
    );
    if (!texture) {
      Logger.error(
        'ERROR: resource name : "%s" with path "%s" does not exist!',
        false,
        tweenParams[idx].resName,
        resTarget.path
      );
      return;
    }
    let sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    insert.portraitContainer.addChild(sprite);
    for (let idx2 = 0; idx2 < tweenParams.length; ++idx2) {
      let advOptions = tweenParams[idx2].advOptions;
      let yoyo = null;
      let delay = 0;
      let repeat = 0;
      let repeatDelay = 0;
      let ease = Power0.easeNone;
      let yoyoEase = null;
      if (advOptions) {
        Logger.debug("adv options arg: ", advOptions);
        yoyo = advOptions.yoyo ? true : false;
        advOptions.noMirror ? true : false;
        delay = advOptions.delay ? Number(advOptions.delay) : delay;
        repeat = advOptions.repeat ? Number(advOptions.repeat) : repeat;
        repeatDelay = advOptions.repeatDelay ? Number(advOptions.repeatDelay) : repeatDelay;
        ease = advOptions.ease ? Theatre.verifyEase(advOptions.ease) : ease;
        yoyoEase = advOptions.yoyoEase ? Theatre.verifyEase(advOptions.yoyoEase) : yoyoEase;
      }
      const { emoteSprite: formattedSprite, pixiParams } = this.formatTweenParams(
        sprite,
        tweenParams[idx2].props,
        insert.portrait.width,
        insert.portrait.height
      );
      let tweenId = animName + idx2;
      let tween = TweenMax.to(formattedSprite, tweenParams[idx2].duration, {
        pixi: pixiParams,
        ease,
        delay,
        repeatDelay,
        repeat,
        yoyo,
        yoyoEase,
        /*onRepeat: function() {
        	Logger.debug("ANIMATION tween is repeating!",this);
        }, */
        onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
          Logger.debug("ANIMATION tween complete!");
          ctx._removeDockTween(imgId, this, tweenId2);
        }, "onComplete"),
        onCompleteParams: [this, insert.imgId, tweenId]
      });
      if (repeat != 0) tween.duration(tweenParams[idx2].duration);
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
      emote: (!useDefault && params.settings.emote ? params.settings.emote : null) || (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].emote : null),
      textFlyin: (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings ? params.emotes[params.settings.emote].settings.textflyin : null) || (!useDefault ? params.settings.textflyin : null) || (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textFlyin : null),
      textStanding: (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings ? params.emote.settings.textstanding : null) || (!useDefault ? params.settings.textstanding : null) || (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textStanding : null),
      textFont: (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings ? params.emote.settings.textfont : null) || (!useDefault ? params.settings.textfont : null) || (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textFont : null),
      textSize: (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings ? params.emote.settings.textsize : null) || (!useDefault ? params.settings.textsize : null) || (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textSize : null),
      textColor: (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings ? params.emote.settings.textcolor : null) || (!useDefault ? params.settings.textcolor : null) || (this.userEmotes[game.user.id] ? this.userEmotes[game.user.id].textColor : null)
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
    let insert = this.getInsertById(id);
    let textBox = this.getTextBoxById(id);
    insert ? insert.label : null;
    let oldSpeakingItem = this.getNavItemById(this.speakingAs);
    let oldSpeakingInsert = this.getInsertById(this.speakingAs);
    oldSpeakingInsert ? oldSpeakingInsert.label : null;
    if (oldSpeakingItem) KHelpers$1.removeClass(oldSpeakingItem, "theatre-control-nav-bar-item-speakingas");
    if (oldSpeakingInsert) {
      this._removeDockTween(this.speakingAs, null, "nameSpeakingPulse");
      oldSpeakingInsert.label.tint = 16777215;
    }
    if (game.user.isGM && this.speakingAs == CONSTANTS.NARRATOR) this.toggleNarratorBar(false);
    if (!!insert && textBox.getAttribute("deleting")) return;
    if (!!insert) {
      let cimg = this.getTheatreCoverPortrait();
      if (this.speakingAs != id) {
        this.speakingAs = id;
        KHelpers$1.addClass(navItem, "theatre-control-nav-bar-item-speakingas");
        TweenMax.to(Theatre.instance.theatreNavBar, 0.4, {
          scrollTo: { x: navItem.offsetLeft, offsetX: Theatre.instance.theatreNavBar.offsetWidth / 2 }
        });
        insert.label.tint = 16777215;
        let tweenId = "nameSpeakingPulse";
        let tween = TweenMax.to(insert.label, 1, {
          pixi: { tint: 16737280 },
          ease: Power0.easeNone,
          repeat: -1,
          yoyo: true,
          onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
            ctx._removeDockTween(imgId, this, tweenId2);
          }, "onComplete"),
          onCompleteParams: [this, id, tweenId]
        });
        this._addDockTween(id, tween, tweenId);
        cimg.setAttribute("src", params.src);
        cimg.style.opacity = "0.3";
        let chatMessage = document.getElementById("chat-message");
        chatMessage.focus();
      } else {
        this.speakingAs = null;
        cimg.removeAttribute("src");
        cimg.style.opacity = "0";
        this.removeUserTyping(game.user.id);
        this.usersTyping[game.user.id].theatreId = null;
      }
    } else {
      let src = params.src;
      let name2 = params.name;
      let optAlign = params.optalign;
      let cimg = this.getTheatreCoverPortrait();
      let emotions;
      if (ev && ev.altKey) {
        emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params, true);
      } else {
        emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params);
      }
      Logger.debug("ACTIVATING AND INJECTING with Emotions: ", emotions);
      if (ev && !ev.shiftKey) {
        if (game.user.isGM) {
          await this.injectLeftPortrait(src, name2, id, optAlign, emotions);
        } else {
          await this.injectRightPortrait(src, name2, id, optAlign, emotions);
        }
      } else {
        await this.injectRightPortrait(src, name2, id, optAlign, emotions);
      }
      this.speakingAs = id;
      KHelpers$1.addClass(navItem, "theatre-control-nav-bar-item-speakingas");
      TweenMax.to(Theatre.instance.theatreNavBar, 0.4, {
        scrollTo: { x: navItem.offsetLeft, offsetX: Theatre.instance.theatreNavBar.offsetWidth / 2 }
      });
      window.setTimeout(() => {
        insert = this.getInsertById(id);
        if (insert && !!insert.dockContainer && this.speakingAs == id) {
          this.label;
          insert.label.tint = 16777215;
          let tweenId = "nameSpeakingPulse";
          let tween = TweenMax.to(insert.label, 1, {
            pixi: { tint: 16737280 },
            ease: Power0.easeNone,
            repeat: -1,
            yoyo: true,
            onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
              ctx._removeDockTween(imgId, this, tweenId2);
            }, "onComplete"),
            onCompleteParams: [this, id, tweenId]
          });
          this._addDockTween(id, tween, tweenId);
        }
      }, 1e3);
      cimg.setAttribute("src", src);
      cimg.style.opacity = "0.3";
      let chatMessage = document.getElementById("chat-message");
      chatMessage.focus();
    }
    this._sendTypingEvent();
    this.setUserTyping(game.user.id, this.speakingAs);
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
    KHelpers$1.removeClass(textBox, "theatre-text-box-lastspeaking");
    textBox.style.background = "";
    textBox.style["box-shadow"] = "";
    if (insert.decayTOId) {
      window.clearTimeout(insert.decayTOId);
      insert.decayTOId = null;
    }
    for (let c of textBox.children) {
      for (let sc of c.children) TweenMax.killTweensOf(sc);
      TweenMax.killTweensOf(c);
    }
    TweenMax.killTweensOf(textBox);
    TweenMax.to(textBox.children, 0.5, {
      top: this.theatreBar.offsetHeight / 2,
      opacity: 0,
      ease: Power0.easeNone,
      onComplete: /* @__PURE__ */ __name(function() {
        textBox.textContent = "";
      }, "onComplete")
    });
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
    color = color ? color.replace("#", "") : "FFFFFF";
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
      darkblue
    );
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
    color = color ? color.replace("#", "") : "FFFFFF";
    let red = parseInt(color.substring(0, 2), 16);
    let green = parseInt(color.substring(2, 4), 16);
    let blue = parseInt(color.substring(4), 16);
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
      let narratorBackdrop = Theatre.instance.theatreNarrator.getElementsByClassName("theatre-narrator-backdrop")[0];
      Logger.debug("NarratorBackdrop ", narratorBackdrop, Theatre.instance.theatreNarrator);
      narratorBackdrop.style.width = "100%";
      Theatre.instance.theatreNarrator.style.opacity = "1";
      Theatre.instance.isNarratorActive = true;
      if (game.user.isGM) {
        let btnNarrator = Theatre.instance.theatreControls.getElementsByClassName("theatre-icon-narrator")[0].parentNode;
        let oldSpeakingItem = Theatre.instance.getNavItemById(Theatre.instance.speakingAs);
        let oldSpeakingInsert = Theatre.instance.getInsertById(Theatre.instance.speakingAs);
        Theatre.instance._getLabelFromInsert(oldSpeakingInsert);
        KHelpers$1.addClass(btnNarrator, "theatre-control-nav-bar-item-speakingas");
        if (oldSpeakingItem) KHelpers$1.removeClass(oldSpeakingItem, "theatre-control-nav-bar-item-speakingas");
        if (oldSpeakingInsert) {
          oldSpeakingInsert.label.tint = 16777215;
          this._removeDockTween(this.speakingAs, null, "nameSpeakingPulse");
        }
        let textFlyin = Theatre.instance.theatreNarrator.getAttribute("textflyin");
        let textStanding = Theatre.instance.theatreNarrator.getAttribute("textstanding");
        let textFont = Theatre.instance.theatreNarrator.getAttribute("textfont");
        let textSize = Theatre.instance.theatreNarrator.getAttribute("textsize");
        let textColor = Theatre.instance.theatreNarrator.getAttribute("textcolor");
        Theatre.instance.theatreNarrator.setAttribute(
          "textflyin",
          textFlyin ? textFlyin : Theatre.instance.userEmotes[game.user.id] ? Theatre.instance.userEmotes[game.user.id].textFlyin : null
        );
        Theatre.instance.theatreNarrator.setAttribute(
          "textstanding",
          textStanding ? textStanding : Theatre.instance.userEmotes[game.user.id] ? Theatre.instance.userEmotes[game.user.id].textStanding : null
        );
        Theatre.instance.theatreNarrator.setAttribute(
          "textfont",
          textFont ? textFont : Theatre.instance.userEmotes[game.user.id] ? Theatre.instance.userEmotes[game.user.id].textFont : null
        );
        Theatre.instance.theatreNarrator.setAttribute(
          "textsize",
          textSize ? Number(textSize) : Theatre.instance.userEmotes[game.user.id] ? Number(Theatre.instance.userEmotes[game.user.id].textSize) : null
        );
        Theatre.instance.theatreNarrator.setAttribute(
          "textcolor",
          textColor ? textColor : Theatre.instance.userEmotes[game.user.id] ? Theatre.instance.userEmotes[game.user.id].textColor : null
        );
        let cimg = Theatre.instance.getTheatreCoverPortrait();
        cimg.removeAttribute("src");
        cimg.style.opacity = "0";
        Theatre.instance.removeUserTyping(game.user.id);
        Theatre.instance.usersTyping[game.user.id].theatreId = null;
        Theatre.instance.speakingAs = CONSTANTS.NARRATOR;
        Theatre.instance.setUserTyping(game.user.id, CONSTANTS.NARRATOR);
        let chatMessage = document.getElementById("chat-message");
        chatMessage.focus();
        if (!remote) Theatre.instance._sendSceneEvent("narrator", { active: true });
        Theatre.instance.renderEmoteMenu();
      }
    } else {
      let narratorBackdrop = Theatre.instance.theatreNarrator.getElementsByClassName("theatre-narrator-backdrop")[0];
      let narratorContent = Theatre.instance.theatreNarrator.getElementsByClassName("theatre-narrator-content")[0];
      Logger.debug("NarratorBackdrop ", narratorBackdrop, Theatre.instance.theatreNarrator);
      narratorBackdrop.style.width = "0%";
      Theatre.instance.theatreNarrator.style.opacity = "0";
      Theatre.instance.isNarratorActive = false;
      for (let c of narratorContent.children) {
        for (let sc of c.children) TweenMax.killTweensOf(sc);
        TweenMax.killTweensOf(c);
      }
      for (let c of narratorContent.children) c.parentNode.removeChild(c);
      TweenMax.killTweensOf(narratorContent);
      narratorContent.style["overflow-y"] = "scroll";
      narratorContent.style["overflow-x"] = "hidden";
      narratorContent.textContent = "";
      if (game.user.isGM) {
        let btnNarrator = Theatre.instance.theatreControls.getElementsByClassName("theatre-icon-narrator")[0].parentNode;
        KHelpers$1.removeClass(btnNarrator, "theatre-control-nav-bar-item-speakingas");
        Theatre.instance.speakingAs = null;
        Theatre.instance.removeUserTyping(game.user.id);
        Theatre.instance.usersTyping[game.user.id].theatreId = null;
        if (!remote) Theatre.instance._sendSceneEvent("narrator", { active: false });
        Theatre.instance.renderEmoteMenu();
      }
    }
  }
  /**
   * Render the emote menu
   */
  renderEmoteMenu() {
    let actorId = Theatre.instance.speakingAs ? Theatre.instance.speakingAs.replace(CONSTANTS.PREFIX_ACTOR_ID, "") : null;
    let insert = Theatre.instance.getInsertById(Theatre.instance.speakingAs);
    if (actorId) {
      game.actors.get(actorId);
    }
    let emotes = Theatre.getActorEmotes(actorId);
    let fonts = Theatre.FONTS;
    let textFlyin = Theatre.FLYIN_ANIMS;
    let textStanding = Theatre.STANDING_ANIMS;
    document.getElementById("sidebar");
    foundry.applications.handlebars.renderTemplate("modules/theatre/templates/emote_menu.html", {
      emotes,
      textFlyin,
      textStanding,
      fonts
    }).then((template) => {
      Logger.debug("emote window template rendered");
      Theatre.instance.theatreEmoteMenu.style.top = `${Theatre.instance.theatreControls.offsetTop - 410}px`;
      Theatre.instance.theatreEmoteMenu.innerHTML = template;
      let wheelFunc = /* @__PURE__ */ __name(function(ev) {
        let pos = ev.deltaY > 0;
        ev.currentTarget.scrollTop += pos ? 10 : -10;
        ev.preventDefault();
        ev.stopPropagation();
      }, "wheelFunc");
      let wheelFunc2 = /* @__PURE__ */ __name(function(ev) {
        let pos = ev.deltaY > 0;
        ev.currentTarget.parentNode.scrollTop += pos ? 10 : -10;
        ev.preventDefault();
        ev.stopPropagation();
      }, "wheelFunc2");
      let sizeSelect = Theatre.instance.theatreEmoteMenu.getElementsByClassName("sizeselect")[0];
      let colorSelect = Theatre.instance.theatreEmoteMenu.getElementsByClassName("colorselect")[0];
      let fontSelect = Theatre.instance.theatreEmoteMenu.getElementsByClassName("fontselect")[0];
      if (insert && insert.textFont) {
        fontSelect.value = insert.textFont;
      } else if (Theatre.instance.userEmotes[game.user.id] && Theatre.instance.userEmotes[game.user.id].textFont) {
        fontSelect.value = Theatre.instance.userEmotes[game.user.id].textFont;
        if (insert) insert.textFont = fontSelect.value;
      } else {
        fontSelect.value = fonts[0];
      }
      if (insert && insert.textColor) {
        colorSelect.value = insert.textColor;
      } else if (Theatre.instance.userEmotes[game.user.id] && Theatre.instance.userEmotes[game.user.id].textColor) {
        colorSelect.value = Theatre.instance.userEmotes[game.user.id].textColor;
        if (insert) insert.textColor = colorSelect.value;
      }
      let sizeIcon = document.createElement("div");
      let sizeValue = 2;
      if (insert) sizeValue = insert.textSize;
      else if (Theatre.instance.userEmotes[game.user.id])
        sizeValue = Number(Theatre.instance.userEmotes[game.user.id].textSize);
      switch (sizeValue) {
        case 3:
          KHelpers$1.addClass(sizeIcon, "theatre-icon-fontsize-large");
          break;
        case 1:
          KHelpers$1.addClass(sizeIcon, "theatre-icon-fontsize-small");
          break;
        default:
          KHelpers$1.addClass(sizeIcon, "theatre-icon-fontsize-medium");
          break;
      }
      sizeSelect.appendChild(sizeIcon);
      sizeSelect.addEventListener("click", (ev) => {
        let insert2 = Theatre.instance.getInsertById(Theatre.instance.speakingAs);
        let icon = sizeSelect.children[0];
        let value = 2;
        if (insert2) value = insert2.textSize;
        else if (Theatre.instance.userEmotes[game.user.id])
          value = Number(Theatre.instance.userEmotes[game.user.id].textSize);
        switch (value) {
          case 3:
            KHelpers$1.removeClass(icon, "theatre-icon-fontsize-large");
            KHelpers$1.addClass(icon, "theatre-icon-fontsize-medium");
            value = 2;
            break;
          case 1:
            KHelpers$1.removeClass(icon, "theatre-icon-fontsize-small");
            KHelpers$1.addClass(icon, "theatre-icon-fontsize-large");
            value = 3;
            break;
          default:
            KHelpers$1.removeClass(icon, "theatre-icon-fontsize-medium");
            KHelpers$1.addClass(icon, "theatre-icon-fontsize-small");
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
          ev.currentTarget.value
        );
        Theatre.instance.renderEmoteMenu();
      });
      colorSelect.addEventListener("change", (ev) => {
        Theatre.instance.setUserEmote(
          game.user.id,
          Theatre.instance.speakingAs,
          "textcolor",
          ev.currentTarget.value
        );
      });
      let headers = Theatre.instance.theatreEmoteMenu.getElementsByTagName("h2");
      let textAnims = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textanim");
      for (let e of headers) Theatre.instance._applyFontFamily(e, Theatre.instance.titleFont);
      for (let e of textAnims) {
        let font = fontSelect.value;
        Theatre.instance._applyFontFamily(e, font);
        e.addEventListener("wheel", wheelFunc2);
      }
      let flyinBox = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textflyin-box")[0];
      flyinBox = flyinBox.getElementsByClassName("theatre-container-column")[0];
      let standingBox = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textstanding-box")[0];
      standingBox = standingBox.getElementsByClassName("theatre-container-column")[0];
      flyinBox.addEventListener("wheel", wheelFunc);
      standingBox.addEventListener("wheel", wheelFunc);
      for (let child of flyinBox.children) {
        child.addEventListener("mouseover", (ev) => {
          let text = ev.currentTarget.getAttribute("otext");
          let anim = ev.currentTarget.getAttribute("name");
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
          ev.currentTarget.textContent = ev.currentTarget.getAttribute("otext");
        });
        child.addEventListener("mouseup", (ev) => {
          if (ev.button == 0) {
            if (KHelpers$1.hasClass(ev.currentTarget, "textflyin-active")) {
              KHelpers$1.removeClass(ev.currentTarget, "textflyin-active");
              Theatre.instance.setUserEmote(
                game.user.id,
                Theatre.instance.speakingAs,
                "textflyin",
                null
              );
            } else {
              let lastActives = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textflyin-active");
              for (let la of lastActives) KHelpers$1.removeClass(la, "textflyin-active");
              KHelpers$1.addClass(ev.currentTarget, "textflyin-active");
              Theatre.instance.setUserEmote(
                game.user.id,
                Theatre.instance.speakingAs,
                "textflyin",
                ev.currentTarget.getAttribute("name")
              );
            }
            let chatMessage = document.getElementById("chat-message");
            chatMessage.focus();
          }
        });
        let childTextMode = child.getAttribute("name");
        if (insert) {
          let insertTextMode = insert.textFlyin;
          if (insertTextMode && insertTextMode == childTextMode) {
            KHelpers$1.addClass(child, "textflyin-active");
            flyinBox.scrollTop = child.offsetTop - Math.max(flyinBox.offsetHeight / 2, 0);
          }
        } else if (Theatre.instance.speakingAs == CONSTANTS.NARRATOR) {
          let insertTextMode = Theatre.instance.theatreNarrator.getAttribute("textflyin");
          if (insertTextMode && insertTextMode == childTextMode) {
            KHelpers$1.addClass(child, "textflyin-active");
            flyinBox.scrollTop = child.offsetTop - Math.max(flyinBox.offsetHeight / 2, 0);
          }
        } else if (!insert && Theatre.instance.userEmotes[game.user.id] && child.getAttribute("name") == Theatre.instance.userEmotes[game.user.id].textFlyin) {
          KHelpers$1.addClass(child, "textflyin-active");
          flyinBox.scrollTop = child.offsetTop - Math.max(flyinBox.offsetHeight / 2, 0);
        }
      }
      for (let child of standingBox.children) {
        child.addEventListener("mouseover", (ev) => {
          let text = ev.currentTarget.getAttribute("otext");
          let anim = ev.currentTarget.getAttribute("name");
          ev.currentTarget.textContent = "";
          let charSpans = Theatre.splitTextBoxToChars(text, ev.currentTarget);
          textFlyin["typewriter"].func.call(
            this,
            charSpans,
            0.5,
            0.05,
            textStanding[anim] ? textStanding[anim].func : null
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
          ev.currentTarget.textContent = ev.currentTarget.getAttribute("otext");
        });
        child.addEventListener("mouseup", (ev) => {
          if (ev.button == 0) {
            if (KHelpers$1.hasClass(ev.currentTarget, "textstanding-active")) {
              KHelpers$1.removeClass(ev.currentTarget, "textstanding-active");
              Theatre.instance.setUserEmote(
                game.user.id,
                Theatre.instance.speakingAs,
                "textstanding",
                null
              );
            } else {
              let lastActives = Theatre.instance.theatreEmoteMenu.getElementsByClassName("textstanding-active");
              for (let la of lastActives) KHelpers$1.removeClass(la, "textstanding-active");
              KHelpers$1.addClass(ev.currentTarget, "textstanding-active");
              Theatre.instance.setUserEmote(
                game.user.id,
                Theatre.instance.speakingAs,
                "textstanding",
                ev.currentTarget.getAttribute("name")
              );
            }
            let chatMessage = document.getElementById("chat-message");
            chatMessage.focus();
          }
        });
        let childTextMode = child.getAttribute("name");
        if (insert) {
          let insertTextMode = insert.textStanding;
          if (insertTextMode && insertTextMode == childTextMode) {
            KHelpers$1.addClass(child, "textstanding-active");
            standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
          }
        } else if (Theatre.instance.speakingAs == CONSTANTS.NARRATOR) {
          let insertTextMode = Theatre.instance.theatreNarrator.getAttribute("textstanding");
          if (insertTextMode && insertTextMode == childTextMode) {
            KHelpers$1.addClass(child, "textstanding-active");
            standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
          }
        } else if (Theatre.instance.userEmotes[game.user.id] && child.getAttribute("name") == Theatre.instance.userEmotes[game.user.id].textStanding) {
          KHelpers$1.addClass(child, "textstanding-active");
          standingBox.scrollTop = child.offsetTop - Math.max(standingBox.offsetHeight / 2, 0);
        }
      }
      let emoteBox = Theatre.instance.theatreEmoteMenu.getElementsByClassName("emote-box")[0];
      let emContainer = emoteBox.getElementsByClassName("theatre-container-tiles")[0];
      if (Theatre.instance.speakingAs == CONSTANTS.NARRATOR) {
        emoteBox.style.cssText += "flex: 0 0 40px";
        let emLabel = emoteBox.getElementsByTagName("h2")[0];
        fontSelect.style["max-width"] = "unset";
        emContainer.style.display = "none";
        emLabel.style.display = "none";
      } else {
        let emoteBtns = Theatre.instance.theatreEmoteMenu.getElementsByClassName("emote");
        for (let child of emoteBtns) {
          child.addEventListener("mouseup", (ev) => {
            if (ev.button == 0) {
              let emName = ev.currentTarget.getAttribute("name");
              Logger.debug("em name: %s was clicked", emName);
              if (KHelpers$1.hasClass(ev.currentTarget, "emote-active")) {
                KHelpers$1.removeClass(ev.currentTarget, "emote-active");
                Theatre.instance.setUserEmote(
                  game.user.id,
                  Theatre.instance.speakingAs,
                  "emote",
                  null
                );
              } else {
                let lastActives = Theatre.instance.theatreEmoteMenu.getElementsByClassName("emote-active");
                for (let la of lastActives) KHelpers$1.removeClass(la, "emote-active");
                KHelpers$1.addClass(ev.currentTarget, "emote-active");
                Theatre.instance.setUserEmote(
                  game.user.id,
                  Theatre.instance.speakingAs,
                  "emote",
                  emName
                );
              }
              let chatMessage = document.getElementById("chat-message");
              chatMessage.focus();
            }
          });
          child.addEventListener("mouseenter", (ev) => {
            Theatre.instance.configureTheatreToolTip(
              Theatre.instance.speakingAs,
              ev.currentTarget.getAttribute("name")
            );
          });
          let childEmote = child.getAttribute("name");
          if (insert) {
            let insertEmote = insert.emote;
            if (insertEmote && insertEmote == childEmote) {
              KHelpers$1.addClass(child, "emote-active");
            }
            if (emotes[childEmote] && emotes[childEmote].insert)
              KHelpers$1.addClass(child, "emote-imgavail");
          }
          if (!insert && Theatre.instance.userEmotes[game.user.id] && childEmote == Theatre.instance.userEmotes[game.user.id].emote) {
            KHelpers$1.addClass(child, "emote-active");
          }
        }
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
    if (Theatre.instance.theatreEmoteMenu)
      Theatre.instance.theatreEmoteMenu.style.top = `${Theatre.instance.theatreControls.offsetTop - 410}px`;
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
    if (!Theatre.instance.rendering) Theatre.instance._renderTheatre(performance.now());
  }
  /**
   * Store mouse position for our tooltip which will roam
   *
   * @param ev (Event) : The Event that triggered the mouse move.
   */
  handleEmoteMenuMouseMove(ev) {
    Theatre.instance.theatreToolTip.style.top = `${(ev.clientY || ev.pageY) - Theatre.instance.theatreToolTip.offsetHeight - 20}px`;
    Theatre.instance.theatreToolTip.style.left = `${Math.min(
      (ev.clientX || ev.pageX) - Theatre.instance.theatreToolTip.offsetWidth / 2,
      Theatre.instance.theatreDock.offsetWidth - Theatre.instance.theatreToolTip.offsetWidth
    )}px`;
  }
  /**
   * Handle the emote click
   *
   * @param ev (Event) : The Event that triggered this handler
   */
  handleBtnEmoteClick(ev) {
    Logger.debug("emote click");
    if (KHelpers$1.hasClass(ev.currentTarget, "theatre-control-btn-down")) {
      Theatre.instance.theatreEmoteMenu.style.display = "none";
      KHelpers$1.removeClass(ev.currentTarget, "theatre-control-btn-down");
    } else {
      Theatre.instance.renderEmoteMenu();
      Theatre.instance.theatreEmoteMenu.style.display = "flex";
      KHelpers$1.addClass(ev.currentTarget, "theatre-control-btn-down");
    }
  }
  /**
   * Handle chat-message focusOut
   *
   * @param ev (Event) : The Event that triggered this handler
   */
  handleChatMessageFocusOut(ev) {
    if (!$(".theatre-control-chat-cover").hasClass("theatre-control-chat-cover-inside")) {
      $(".theatre-control-chat-cover").removeClass("theatre-control-chat-cover-focus");
    }
    KHelpers$1.removeClass(Theatre.instance.theatreChatCover, "theatre-control-chat-cover-ooc");
  }
  /**
   * Handle chat-message focusIn
   *
   * @param ev (Event) : The Event that triggered this handler
   */
  handleChatMessageFocusIn(ev) {
    if (!$(".theatre-control-chat-cover").hasClass("theatre-control-chat-cover-inside")) {
      $(".theatre-control-chat-cover").addClass("theatre-control-chat-cover-focus");
    }
  }
  /**
   * Handle chat-message keyUp
   *
   * @param ev (Event) : The Event that triggered this handler
   */
  handleChatMessageKeyUp(ev) {
    if (!ev.repeat && //&& Theatre.instance.speakingAs
    ev.key == "Control")
      KHelpers$1.removeClass(Theatre.instance.theatreChatCover, "theatre-control-chat-cover-ooc");
  }
  /**
   * Handle key-down events in the #chat-message area to fire
   * "typing" events to connected clients
   *
   * @param ev (Event) : The Event that triggered this handler
   */
  handleChatMessageKeyDown(ev) {
    const context = foundry.helpers.interaction.KeyboardManager.getKeyboardEventContext(ev);
    const actions = foundry.helpers.interaction.KeyboardManager._getMatchingActions(context);
    for (const action of actions) {
      if (!action.action.includes(CONSTANTS.MODULE_ID)) {
        continue;
      }
      action.onDown.call(context);
    }
    let now = Date.now();
    if (!ev.repeat && //&& Theatre.instance.speakingAs
    ev.key == "Control") {
      KHelpers$1.addClass(Theatre.instance.theatreChatCover, "theatre-control-chat-cover-ooc");
    }
    if (now - Theatre.instance.lastTyping < 3e3) {
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
    if (KHelpers$1.hasClass(ev.currentTarget, "theatre-control-nav-bar-item-speakingas")) {
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
  }
  /**
   * Handle the Delay Emote toggle click
   *
   * @param ev (Event) : The Event that triggered this handler
   */
  handleBtnDelayEmoteClick(ev) {
    Logger.debug("delay emote click");
    if (Theatre.instance.isDelayEmote) {
      if (KHelpers$1.hasClass(ev.currentTarget, "theatre-control-small-btn-down")) {
        KHelpers$1.removeClass(ev.currentTarget, "theatre-control-small-btn-down");
      }
      Theatre.instance.isDelayEmote = false;
    } else {
      if (!KHelpers$1.hasClass(ev.currentTarget, "theatre-control-small-btn-down")) {
        KHelpers$1.addClass(ev.currentTarget, "theatre-control-small-btn-down");
      }
      Theatre.instance.isDelayEmote = true;
    }
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
      if (KHelpers$1.hasClass(ev.currentTarget, "theatre-control-small-btn-down"))
        KHelpers$1.removeClass(ev.currentTarget, "theatre-control-small-btn-down");
      Theatre.instance.isQuoteAuto = false;
    } else {
      if (!KHelpers$1.hasClass(ev.currentTarget, "theatre-control-small-btn-down"))
        KHelpers$1.addClass(ev.currentTarget, "theatre-control-small-btn-down");
      Theatre.instance.isQuoteAuto = true;
    }
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
      if (KHelpers$1.hasClass(ev.currentTarget, "theatre-control-btn-down")) {
        KHelpers$1.removeClass(ev.currentTarget, "theatre-control-btn-down");
      }
    } else {
      KHelpers$1.addClass(ev.currentTarget, "theatre-control-btn-down");
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
      Theatre.instance.theatreDock.style.opacity = combatActive ? "0.05" : "0.20";
      Theatre.instance.theatreBar.style.opacity = combatActive ? "0.05" : "0.20";
      Theatre.instance.theatreNarrator.style.opacity = combatActive ? "0.05" : "0.20";
      primeBar.style["pointer-events"] = "none";
      secondBar.style["pointer-events"] = "none";
    } else {
      Theatre.instance.theatreDock.style.opacity = "1";
      Theatre.instance.theatreBar.style.opacity = "1";
      Theatre.instance.theatreNarrator.style.opacity = "1";
      primeBar.style["pointer-events"] = "all";
      secondBar.style["pointer-events"] = "all";
    }
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
      "WINDOW MOUSE UP FINAL x: " + x + " y: " + y + " ix: " + ix + " iy: " + iy + " dx: " + dx + " dy: " + dy + " ox: " + ox + " oy: " + oy
    );
    if (!insert.dockContainer || !insert.portraitContainer) {
      Logger.error("ERROR: insert dockContainer or portrait is INVALID");
      window.removeEventListener("mouseup", Theatre.instance.handleWindowMouseUp);
      return;
    }
    let tweenId = "portraitMove";
    let tween = TweenMax.to(insert.portraitContainer, 0.5, {
      pixi: { x: dx, y: dy },
      ease: Power3.easeOut,
      onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
        ctx._removeDockTween(imgId, this, tweenId2);
      }, "onComplete"),
      onCompleteParams: [Theatre.instance, insert.imgId, tweenId]
    });
    Theatre.instance._addDockTween(insert.imgId, tween, tweenId);
    Theatre.instance._sendSceneEvent("positionupdate", {
      insertid: insert.imgId,
      position: { x: dx, y: dy, mirror: insert.mirrored }
    });
    window.removeEventListener("mouseup", Theatre.instance.handleWindowMouseUp);
    Theatre.instance.dragPoint = null;
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
        if (!!Theatre.instance.dragPoint && !!Theatre.instance.dragPoint.insert) {
          Logger.warn("PREXISTING DRAGPOINT!", false);
        }
        let boundingBox = {};
        let insert = Theatre.instance.getInsertById(id);
        if (!Theatre.instance.isActorOwner(game.user.id, insert.imgId)) {
          Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
          return;
        }
        boundingBox["maxtop"] = insert.optAlign == "top" ? 0 : insert.portrait.height;
        boundingBox["mintop"] = insert.portrait.height / 2;
        boundingBox["maxleft"] = insert.portrait.width * 3 / 2;
        boundingBox["minleft"] = 0;
        let origX = insert.portraitContainer.x;
        let origY = insert.portraitContainer.y;
        Logger.debug(
          "STORING DRAG POINT",
          ev.clientX || ev.pageX,
          ev.clientY || ev.PageY,
          boundingBox,
          origX,
          origY
        );
        Theatre.instance.dragPoint = {
          otop: origY,
          oleft: origX,
          ix: ev.clientX || ev.pageX,
          iy: ev.clientY || ev.pageY,
          insert,
          box: boundingBox
        };
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
    KHelpers$1.insertBefore(Theatre.instance.dragNavItem, ev.currentTarget);
  }
  /**
   * Handle mouse up on navItems
   *
   * @param ev (Event) : The Event that triggered this handler
   */
  handleNavItemMouseUp(ev) {
    ev.currentTarget;
    let id = ev.currentTarget.getAttribute("imgId");
    let actorId = id.replace(CONSTANTS.PREFIX_ACTOR_ID, "");
    let params = Theatre.instance._getInsertParamsFromActorId(actorId);
    if (!params) {
      Logger.error("ERROR, actorId %s does not exist!", true, actorId);
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
        Theatre.instance.getTheatreCoverPortrait();
        if (ev.ctrlKey) {
          Theatre.instance._removeFromStage(id);
          return;
        }
        if (!removed) {
          let src = params.src;
          let name2 = params.name;
          let optAlign = params.optalign;
          let emotions;
          if (ev.altKey) emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params, true);
          else emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params);
          if (!ev.shiftKey) {
            if (game.user.isGM) Theatre.instance.injectLeftPortrait(src, name2, id, optAlign, emotions);
            else Theatre.instance.injectRightPortrait(src, name2, id, optAlign, emotions);
          } else Theatre.instance.injectRightPortrait(src, name2, id, optAlign, emotions);
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
  static textStandingAnimation(name2) {
    return TheatreHelpers.textStandingAnimation(name2);
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
  static textFlyinAnimation(name2) {
    return TheatreHelpers.textFlyinAnimation(name2);
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
const API = {
  /**
   * Reorder theatre inserts in the dockContainer to align with where their
   * text-box's position is on the bar such that the insert is always over
   * the corresponding text-box.
   *
   */
  reorderInserts() {
    return TheatreHelpers.reorderInserts();
  },
  /**
   * Set wither or not to display or hide theatre debug information.
   *
   * @params state (Boolean) : Boolean indicating if we should toggle debug on/off
   */
  setDebug(state) {
    return TheatreHelpers.setDebug(state);
  },
  /**
   * Verify the TweenMax ease from the animation syntax shorthand.
   *
   * @params str (String) : the ease to verify.
   */
  verifyEase(str) {
    return TheatreHelpers.verifyEase(str);
  },
  /**
   * Return an array of tween params if the syntax is correct,
   * else return an empty array if any tweens in the syntax
   * are flag as incorrect.
   *
   * @param str (String) : The syntax to verify
   *
   * @return (Array[Object]) : The array of verified tween params, or null
   */
  verifyAnimationSyntax(str) {
    return TheatreHelpers.verifyAnimationSyntax(str);
  },
  /**
   * Prepare fonts and return the list of fonts available
   *
   * @return (Array[(String)]) : The array of font familys to use.
   */
  getFonts() {
    return TheatreHelpers.getFonts();
  },
  getActorDisplayName(actorId) {
    return TheatreHelpers.getActorDisplayName(actorId);
  },
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
  getActorEmotes(actorId, disableDefault) {
    return TheatreHelpers.getActorEmotes(actorId, disableDefault);
  },
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
  getActorRiggingResources(actorId) {
    return TheatreHelpers.getActorRiggingResources(actorId);
  },
  /**
   * Default rigging resources
   *
   * @return (Array[(Object)]) : An array of {name: (String), path: (String)} tuples
   *                             representing the default rigging resource map.
   */
  getDefaultRiggingResources() {
    return TheatreHelpers.getDefaultRiggingResources();
  },
  /**
   * Get default emotes, immutable
   *
   * @return (Object) : An Object, whose properties are the default set
   *                     emotes.
   */
  getDefaultEmotes() {
    return TheatreHelpers.getDefaultEmotes();
  },
  /**
   * Split to chars, logically group words based on language.
   *
   * @param text (String) : The text to split.
   * @param textBox (HTMLElement) : The textBox the text will be contained in.
   *
   * @return (Array[HTMLElement]) : An array of HTMLElements of the split text.
   */
  splitTextBoxToChars(text, textBox) {
    return TheatreHelpers.splitTextBoxToChars(text, textBox);
  },
  /**
   *
   * ActorSheet Configue Options
   *
   * @params ev (Event) : The event that triggered the configuration option.
   * @params actorSheet (Object ActorSheet) : The ActorSheet Object to spawn a configure
   *                                          window from.
   */
  onConfigureInsert(ev, actorSheet) {
    return TheatreHelpers.onConfigureInsert(ev, actorSheet);
  },
  /**
   * Add to the nav bar staging area with an actorSheet.
   *
   * @params ev (Event) : The event that triggered adding to the NavBar staging area.
   */
  onAddToNavBar(ev, actorSheet, removeLabelSheetHeader) {
    return TheatreHelpers.onAddToNavBar(ev, actorSheet, removeLabelSheetHeader);
  },
  /**
   * Add to the NavBar staging area
   *
   * @params actor (Actor) : The actor from which to add to the NavBar staging area.
   */
  addToNavBar(actor) {
    return TheatreHelpers.addToNavBar(actor);
  },
  /**
   * Removes the actor from the nav bar.
   *
   * @params actor (Actor) : The actor to remove from the NavBar staging area.
   */
  removeFromNavBar(actor) {
    return TheatreHelpers.removeFromNavBar(actor);
  },
  /**
   * Returns whether the actor is on the stage.
   * @params actor (Actor) : The actor.
   */
  isActorStaged(actor) {
    return TheatreHelpers.isActorStaged(actor);
  },
  clearStage() {
    return TheatreHelpers.clearStage();
  },
  /**
   * get the text animation given the name
   *
   * @param name (String) : The name of the standing text animation to get.
   *
   * @return (Object) : An Object tuple of {func: (Function), label: (String)}
   *                     representing the animation function and function label.
   *
   */
  textStandingAnimation(name2) {
    return TheatreHelpers.textStandingAnimation(name2);
  },
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
  textFlyinAnimation(name2) {
    return TheatreHelpers.textFlyinAnimation(name2);
  }
};
function setupSpotlightSearch(INDEX) {
  Logger.debug("Setting up Spotlight Index");
  INDEX.filter((item) => item?.data?.uuid?.startsWith("Actor"))?.forEach((item) => {
    const addActorToNavHandler = /* @__PURE__ */ __name((event2) => {
      const actor = fromUuidSync(item.data.uuid);
      if (Theatre.isActorStaged(actor)) {
        Logger.debug("Action: Remove Actor from Nav Bar", actor.name);
        Theatre.removeFromNavBar(actor);
      } else {
        Logger.debug("Action: Add Actor to Nav Bar", actor.name);
        Theatre.addToNavBar(actor);
      }
      ui.spotlightOmnisearch?.close();
    }, "addActorToNavHandler");
    const showActorHandler = /* @__PURE__ */ __name((event2) => {
      const actor = fromUuidSync(item.data.uuid);
      const theaterActorId = CONSTANTS.PREFIX_ACTOR_ID + actor.id;
      const navItem = Theatre.instance.getNavItemById(theaterActorId);
      if (navItem) {
        Logger.debug("Action: Remove Actor from Stage", actor.name);
        Theatre.instance.removeInsertById(theaterActorId);
      } else {
        Logger.debug("Action: Show Actor on Stage", actor.name);
        if (!Theatre.isActorStaged(actor)) {
          Theatre.addToNavBar(actor);
        }
        Theatre.instance.activateInsertById(theaterActorId);
      }
      ui.spotlightOmnisearch?.close();
    }, "showActorHandler");
    const getAddToBarLabel = /* @__PURE__ */ __name(() => {
      try {
        Logger.debug("Action: Add Actor to Nav Bar", item.name);
        const actor = fromUuidSync(item.data.uuid);
        return Theatre.isActorStaged(actor) ? game.i18n.localize("Theatre.Omnisearch.RemoveFromBar") : game.i18n.localize("Theatre.Omnisearch.AddToBar");
      } catch (error) {
        return game.i18n.localize("Theatre.Omnisearch.AddToBar");
      }
    }, "getAddToBarLabel");
    const getShowOnStageLabel = /* @__PURE__ */ __name(() => {
      try {
        Logger.debug("Action: Show Actor on Stage", item.name);
        const actor = fromUuidSync(item.data.uuid);
        const theaterActorId = CONSTANTS.PREFIX_ACTOR_ID + actor.id;
        const navItem = Theatre.instance.getNavItemById(theaterActorId);
        return navItem ? game.i18n.localize("Theatre.Omnisearch.RemoveFromStage") : game.i18n.localize("Theatre.Omnisearch.ShowOnStage");
      } catch (error) {
        return game.i18n.localize("Theatre.Omnisearch.ShowOnStage");
      }
    }, "getShowOnStageLabel");
    item.actions.push(
      {
        name: getAddToBarLabel(),
        icon: `<i class="fa-solid fa-plus"></i>`,
        callback: addActorToNavHandler
      },
      {
        name: getShowOnStageLabel(),
        icon: `<i class="fa-solid fa-masks-theater"></i>`,
        callback: showActorHandler
      }
    );
  });
}
__name(setupSpotlightSearch, "setupSpotlightSearch");
Handlebars.registerHelper("cat", function(arg1, arg2, hash) {
  let res = String(arg1) + String(arg2);
  return res;
});
Handlebars.registerHelper("resprop", function(propPath, hash) {
  let prop = foundry.utils.getProperty(hash.data.root, propPath);
  return prop;
});
Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
  if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
    return;
  }
  const removeLabelSheetHeader = game.settings.get(CONSTANTS.MODULE_ID, "removeLabelSheetHeader");
  let theatreButtons = [];
  if (app.document.isOwner) {
    if (!app.document.token) {
      theatreButtons.push({
        label: removeLabelSheetHeader ? "" : "Theatre.UI.Config.Theatre",
        class: "configure-theatre",
        icon: "fas fa-user-edit",
        onclick: /* @__PURE__ */ __name((ev) => Theatre.onConfigureInsert(ev, app.document.sheet), "onclick")
      });
    }
    theatreButtons.push({
      label: removeLabelSheetHeader ? "" : Theatre.isActorStaged(app.document) ? "Theatre.UI.Config.RemoveFromStage" : "Theatre.UI.Config.AddToStage",
      class: "add-to-theatre-navbar",
      icon: Theatre.isActorStaged(app.document) ? "fas fa-mask" : "fas fa-theater-masks",
      onclick: /* @__PURE__ */ __name(async (ev) => {
        Theatre.onAddToNavBar(ev, app.document.sheet, removeLabelSheetHeader);
        await app.close();
        app.render(true);
      }, "onclick")
    });
  }
  buttons.unshift(...theatreButtons);
});
Hooks.on("getHeaderControlsDocumentSheetV2", (app, buttons) => {
  if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
    return;
  }
  const removeLabelSheetHeader = game.settings.get(CONSTANTS.MODULE_ID, "removeLabelSheetHeader");
  let theatreButtons = [];
  if (app.document.isOwner && app.document.documentName === "Actor") {
    if (!app.document.token) {
      theatreButtons.push({
        action: "configure-theatre",
        label: removeLabelSheetHeader ? "" : "Theatre.UI.Config.Theatre",
        class: "configure-theatre",
        icon: "fas fa-user-edit",
        onClick: /* @__PURE__ */ __name((ev) => Theatre.onConfigureInsert(ev, app.document.sheet), "onClick")
      });
    }
    theatreButtons.push({
      action: "add-to-theatre-navbar",
      label: removeLabelSheetHeader ? "" : Theatre.isActorStaged(app.document) ? "Theatre.UI.Config.RemoveFromStage" : "Theatre.UI.Config.AddToStage",
      class: "add-to-theatre-navbar",
      icon: Theatre.isActorStaged(app.document) ? "fas fa-mask" : "fas fa-theater-masks",
      onClick: /* @__PURE__ */ __name(async (ev) => {
        Theatre.onAddToNavBar(ev, app.document.sheet, removeLabelSheetHeader);
        await app.close();
        app.render(true);
      }, "onClick")
    });
  }
  buttons.unshift(...theatreButtons);
});
Hooks.on("collapseSidebar", function(a, collapsed) {
  Theatre.resizeBars(collapsed);
});
Hooks.on("renderChatInput", () => {
  const chatMessage = document.getElementById("chat-message");
  const isChatOutsideChatLog = chatMessage.parentElement.id === "chat-notifications";
  if (!isChatOutsideChatLog) {
    const parentChatMessage = $("#chat-message").parent();
    if (parentChatMessage.children(".chat-controls").length > 0) {
      $(".theatre-control-group").insertBefore(parentChatMessage.children(".chat-controls"));
    } else {
      $(".theatre-control-group").insertBefore(parentChatMessage.children("#chat-controls"));
    }
    $(".theatre-control-button-bar").insertBefore("#chat-message");
    $(".theatre-control-chat-cover").addClass("theatre-control-chat-cover-inside");
    $(".theatre-control-chat-cover").addClass("theatre-control-chat-cover-focus");
    if (parentChatMessage.parent().attr("id") === "chat") {
      $(".theatre-emote-menu").css("position", "absolute");
    } else {
      $(".theatre-emote-menu").css("position", "initial");
    }
  } else {
    $(".theatre-control-group").insertBefore("#chat-message");
    $(".theatre-control-button-bar").insertBefore("#chat-message");
    $(".theatre-control-chat-cover").removeClass("theatre-control-chat-cover-inside");
    $(".theatre-control-chat-cover").removeClass("theatre-control-chat-cover-focus");
    $(".theatre-emote-menu").css("position", "initial");
  }
  $(".theatre-control-chat-cover-wrapper").insertBefore("#chat-message");
  $(".theatre-emote-menu").insertBefore(".theatre-control-group");
  Theatre.resizeBars(ui.sidebar._collapsed);
});
Hooks.on("createCombat", function() {
  if (!Theatre.instance) {
    return;
  }
  if (Theatre.instance.isSuppressed) {
    Logger.debug("COMBAT CREATED");
    Theatre.instance.theatreDock.style.opacity = "0.05";
    Theatre.instance.theatreBar.style.opacity = "0.05";
    Theatre.instance.theatreNarrator.style.opacity = "0.05";
  }
});
Hooks.on("deleteCombat", function() {
  if (!Theatre.instance) {
    return;
  }
  if (!game.combats.size && Theatre.instance.isSuppressed) {
    Logger.debug("COMBAT DELETED");
    Theatre.instance.theatreDock.style.opacity = "0.20";
    Theatre.instance.theatreBar.style.opacity = "0.20";
    Theatre.instance.theatreNarrator.style.opacity = "0.20";
  }
});
Hooks.on("preCreateChatMessage", function(chatMessage, data) {
  let chatData = {
    speaker: {
      scene: data.speaker?.scene,
      flags: {}
    }
  };
  Logger.debug("preCreateChatMessage", chatMessage);
  if (!Theatre.instance) {
    return;
  }
  if (chatMessage.rolls.length) {
    return;
  }
  if ($(theatre.theatreChatCover).hasClass("theatre-control-chat-cover-ooc")) {
    const user = game.users.get(chatMessage.author.id);
    chatData.speaker.alias = user.name;
    if (foundry.utils.isNewerVersion(game.version, 12)) {
      chatData.style = CONST.CHAT_MESSAGE_STYLES.OOC;
    } else {
      chatData.type = CONST.CHAT_MESSAGE_TYPES.OOC;
    }
    chatMessage.updateSource(chatData);
    return;
  }
  if (Theatre.instance.speakingAs && Theatre.instance.usersTyping[chatMessage.author.id]) {
    let theatreId = Theatre.instance.usersTyping[chatMessage.author.id].theatreId;
    let insert = Theatre.instance.getInsertById(theatreId);
    Logger.debug("speakingAs %s", theatreId);
    if (insert && chatMessage.speaker) {
      let label = Theatre.instance._getLabelFromInsert(insert);
      let name2 = label.text;
      Logger.debug("name is %s", name2);
      chatData.speaker.alias = name2;
      if (foundry.utils.isNewerVersion(game.version, 12)) {
        chatData.style = CONST.CHAT_MESSAGE_STYLES.IC;
      } else {
        chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
      }
      if (Theatre.instance.isDelayEmote && Theatre.instance.delayedSentState === 1) {
        Logger.debug("setting emote now! as %s", insert.emote);
        Theatre.instance.delayedSentState = 2;
        Theatre.instance.setUserEmote(game.user._id, theatreId, "emote", insert.emote, false);
        Theatre.instance.delayedSentState = 0;
      }
    } else if (insert) {
      let label = Theatre.instance._getLabelFromInsert(insert);
      let name2 = label.text;
      chatData.speaker.alias = name2;
      if (foundry.utils.isNewerVersion(game.version, 12)) {
        chatData.style = CONST.CHAT_MESSAGE_STYLES.IC;
      } else {
        chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
      }
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
  Logger.debug("speaker? ", chatMessage.speaker);
  if (Theatre.instance.isQuoteAuto && chatMessage.speaker && (chatData.speaker.actor || chatData.speaker.token || chatData.speaker.alias) && !chatMessage.content.match(/\<div.*\>[\s\S]*\<\/div\>/)) {
    const { quoteType } = Theatre.instance.settings;
    const openBracket = game.i18n.localize(`Theatre.Text.OpenBracket.${quoteType}`);
    const closeBracket = game.i18n.localize(`Theatre.Text.CloseBracket.${quoteType}`);
    chatData.content = `${openBracket}${chatMessage.content}${closeBracket}`;
  }
  chatMessage.updateSource(chatData);
});
Hooks.on("createChatMessage", function(chatEntity, _, userId) {
  Logger.debug("createChatMessage");
  let theatreId = null;
  if (!Theatre.instance) {
    return;
  }
  if (Theatre.instance.usersTyping[userId]) {
    theatreId = Theatre.instance.usersTyping[userId].theatreId;
    Theatre.instance.removeUserTyping(userId);
  }
  let chatData = chatEntity;
  const isOCC = foundry.utils.isNewerVersion(game.version, 12) ? chatData.style === CONST.CHAT_MESSAGE_STYLES.OOC : chatData.type === CONST.CHAT_MESSAGE_TYPES.OOC;
  // Skip rolls/OOC/emotes, UUID embeds, and structured HTML cards (not normal V14 <p> speech)
  if (chatData.rolls.length || chatData.emote || isOCC || // || Object.keys(chatData.speaker).length == 0
  chatData.content.match(/@[a-zA-Z0-9]+\[[a-zA-Z0-9]+\]/) || chatData.content.match(/\<div.*\>[\s\S]*\<\/div\>/)) {
    return;
  }
  let textBox = Theatre.instance.getTextBoxById(theatreId);
  let insert = Theatre.instance.getInsertById(theatreId);
  let charSpans = [];
  // V14 stores chat as HTML (e.g. <p>…</p>); strip tags for stage/narrator plaintext
  let textContent = chatData.content;
  textContent = textContent.replace(/<br(| \/)>/gi, "\n");
  let txtTemp = document.createElement("hiddentext");
  txtTemp.innerHTML = textContent;
  textContent = txtTemp.textContent || "";
  // Slash commands may arrive HTML-wrapped on V14; check after strip
  if (!textContent || textContent.trimStart().startsWith("/")) {
    return;
  }
  if (textBox) {
    for (let c of textBox.children) {
      for (let sc of c.children) TweenMax.killTweensOf(sc);
      TweenMax.killTweensOf(c);
    }
    for (let c of textBox.children) c.parentNode.removeChild(c);
    TweenMax.killTweensOf(textBox);
    textBox.style["overflow-y"] = "scroll";
    textBox.style["overflow-x"] = "hidden";
    textBox.textContent = "";
    if (insert) {
      let lastSpeaking = Theatre.instance.theatreBar.getElementsByClassName("theatre-text-box-lastspeaking");
      if (lastSpeaking[0]) {
        lastSpeaking[0].style.background = "";
        lastSpeaking[0].style["box-shadow"] = "";
        KHelpers$1.removeClass(lastSpeaking[0], "theatre-text-box-lastspeaking");
      }
      KHelpers$1.addClass(textBox, "theatre-text-box-lastspeaking");
      Theatre.instance.applyPlayerColorToTextBox(textBox, userId, insert.textColor);
      for (let dockInsert of Theatre.instance.portraitDocks) dockInsert.renderOrder = dockInsert.order;
      insert.renderOrder = 999999;
      Theatre.instance.portraitDocks.sort((a, b) => {
        return a.renderOrder - b.renderOrder;
      });
      let tweenId = "portraitPop";
      let tween = TweenMax.to(insert.portraitContainer, 0.25, {
        pixi: { scaleX: insert.mirrored ? -1.05 : 1.05, scaleY: 1.05 },
        ease: Power3.easeOut,
        repeat: 1,
        yoyo: true,
        onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
          let insert2 = Theatre.instance.getInsertById(imgId);
          if (insert2) {
            this.targets()[0].scale.x = insert2.mirrored ? -1 : 1;
            this.targets()[0].scale.y = 1;
          }
          ctx._removeDockTween(imgId, this, tweenId2);
        }, "onComplete"),
        onCompleteParams: [Theatre.instance, insert.imgId, tweenId]
      });
      Theatre.instance._addDockTween(insert.imgId, tween, tweenId);
      tweenId = "portraitFlash";
      tween = TweenMax.to(insert.portrait, 0.25, {
        // Pixi:{tint: 0xAAEDFF},
        pixi: {
          tint: Theatre.instance.getPlayerFlashColor(userId, insert.textColor)
        },
        ease: Power3.easeOut,
        repeat: 1,
        yoyo: true,
        onComplete: /* @__PURE__ */ __name(function(ctx, imgId, tweenId2) {
          this.targets()[0].tint = 16777215;
          ctx._removeDockTween(imgId, this, tweenId2);
        }, "onComplete"),
        onCompleteParams: [Theatre.instance, insert.imgId, tweenId]
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
    switch (insertFontSize) {
      case 3:
        fontSize *= 1.5;
        break;
      case 1:
        fontSize *= 0.5;
        break;
    }
    Logger.debug("font size is (%s): ", insertFontSize, fontSize);
    if (typeof polyglot !== "undefined" && typeof chatData.flags.polyglot !== "undefined") {
      const lang = chatData.flags.polyglot.language;
      const langs = game.polyglot.knownLanguages;
      const understood = langs.has(lang) || game.user.isGM || game.view === "stream";
      if (!understood) {
        const fontStyle = game.polyglot._getFontStyle(lang);
        fontSize *= Math.floor(Number(fontStyle.slice(0, 3)) / 100);
        insertFontType = fontStyle.slice(5);
        textContent = game.polyglot.scrambleString(textContent, chatData._id, lang);
      }
    }
    Theatre.instance._applyFontFamily(textBox, insertFontType || Theatre.instance.textFont);
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
      Theatre.textStandingAnimation(insertStandingMode)
    );
    if (insert && insert.decayTOId) {
      window.clearTimeout(insert.decayTOId);
    }
    if (insert && Theatre.instance.settings.autoDecay) {
      insert.decayTOId = window.setTimeout(
        (imgId) => {
          let insert2 = Theatre.instance.getInsertById(imgId);
          if (insert2) Theatre.instance.decayTextBoxById(imgId, true);
        },
        Math.max(Theatre.instance.settings.decayRate * charSpans.length, Theatre.instance.settings.decayMin),
        insert.imgId
      );
    }
  }
});
Hooks.on("renderChatMessageHTML", function(ChatMessage, html, context) {
  if (game.settings.get(CONSTANTS.MODULE_ID, "ignoreMessagesToChat") && ChatMessage.flags?.[CONSTANTS.MODULE_ID]?.theatreMessage) {
    html.style.display = "none";
  }
  return true;
});
Hooks.on("renderChatLog", function(app, html, data) {
  if (app.id === "chat-popout") {
    return;
  }
  theatre.initialize();
  if (!window.Theatre) {
    window.Theatre = Theatre;
    window.theatre = theatre;
  }
});
Hooks.on("getActorContextOptions", async (app, menuItems) => {
  if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
    return;
  }
  const getActorData = /* @__PURE__ */ __name((target) => {
    return game.actors.get($(target).data("entry-id"));
  }, "getActorData");
  menuItems.splice(
    3,
    0,
    {
      name: "Theatre.UI.Config.AddToStage",
      condition: /* @__PURE__ */ __name((target) => !Theatre.isActorStaged(getActorData(target)), "condition"),
      icon: '<i class="fas fa-theater-masks"></i>',
      callback: /* @__PURE__ */ __name((target) => Theatre.addToNavBar(getActorData(target)), "callback")
    },
    {
      name: "Theatre.UI.Config.RemoveFromStage",
      condition: /* @__PURE__ */ __name((target) => Theatre.isActorStaged(getActorData(target)), "condition"),
      icon: '<i class="fas fa-theater-masks"></i>',
      callback: /* @__PURE__ */ __name((target) => Theatre.removeFromNavBar(getActorData(target)), "callback")
    }
  );
});
let theatre = null;
Hooks.once("setup", () => {
  theatre = new Theatre();
  game.modules.get(CONSTANTS.MODULE_ID).api = API;
  registerKeybindings();
});
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
Hooks.once("ready", () => {
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
    "MIXED"
  );
});
Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(CONSTANTS.MODULE_ID);
});
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
Hooks.on("updateActor", (actor, data) => {
  const insert = Theatre.instance.getInsertById(`theatre-${actor.id}`);
  if (!insert) {
    return;
  }
  insert.label.text = Theatre.getActorDisplayName(actor.id);
  Theatre.instance._renderTheatre(performance.now());
});
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "gmOnly")) {
    const suppressTheatreTool = {
      name: "suppressTheatre",
      title: "Theatre.UI.Title.SuppressTheatre",
      icon: "fas fa-theater-masks",
      toggle: true,
      active: false,
      onChange: /* @__PURE__ */ __name((event2, toggle) => {
        Theatre.instance.updateSuppression(toggle);
      }, "onChange"),
      visible: true
    };
    const tokenControls = controls.tokens.tools;
    tokenControls.suppressTheatre = suppressTheatreTool;
  }
});
Hooks.on("spotlightOmnisearch.indexBuilt", (INDEX) => {
  Logger.debug("Adding Theatre to the spotlight search index");
  setupSpotlightSearch(INDEX);
});
//# sourceMappingURL=module.js.map
