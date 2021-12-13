/**
 * TheatreActorConfig.js
 *
 * Copyright (c) 2019 - 2020 Ken L.
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
 * Application to configure Actor Theatre-Inserts
 *
 *
 *
 *
 *
 * ============================================================
 */
class TheatreActorConfig extends FormApplication {
	constructor(object={}, options={}) {
		if (object._theatre_mod_configTab) {
			options.tabs = [        
				{navSelector: ".tabs", contentSelector: ".theatre-config-contents", initial: object._theatre_mod_configTab}
      ];
      if (object._theatre_mod_configTab === "emotes") {
        options.height = 775;
      }
		}
		super(object, options);
	}

	/**
	 * Default options for TheatreActorConfig
	 */
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.id = "theatre-config";
		options.template = "modules/theatre/app/templates/theatre_actor_config.html";
		options.width = 500;
		options.height = 270; 
		options.tabs = [        
			{navSelector: ".tabs", contentSelector: ".theatre-config-contents", initial: "main"}
		];
	  return options;
  }

  /**
   * Add the Entity name into the window title
   */
  get title() {
    return `${this.object.name}: ${game.i18n.localize("Theatre.UI.Config.ConfigureTheatre")}`;
  }

  /**
   * Construct and return the data object used to render the HTML template for this form application.
	 *
   * @return (Object) : The Object to be used in handlebars compile
   */
  getData() {
    const entityName = this.object.name;
    return {
      entityName: entityName,
      isGM: game.user.isGM,
      object: duplicate(this.object.data),
			emote: Theatre.getActorEmotes(this.object.data._id),
      options: this.options,
    }
  }

  /**
   * Activate the default set of listeners for the Actor Sheet
   * These listeners handle basic stuff like form submission or updating images
   *
   * @param html (JQuery) The rendered template ready to have listeners attached
   */
	activateListeners(html) {
	  super.activateListeners(html);


    let btnAdd = html[0].getElementsByClassName("theatre-config-btn-add-emote")[0]; 
		if (btnAdd)
			btnAdd.addEventListener("click",this._onAddEmoteLine.bind(this)); 

    let btnsEmoteConfig = html[0].getElementsByClassName("theatre-config-btn-edit-emote"); 
		for (let btn of btnsEmoteConfig)
			btn.addEventListener("click",this._onEditEmoteLine.bind(this)); 

    // Support custom icon updates
		let iconsCustom = html[0].getElementsByClassName("customicon"); 
		for (let icon of iconsCustom)
			icon.addEventListener("click",this._onCustomIconImage.bind(this)); 

		// Support custom label updates
		let labelsCustom = html[0].getElementsByClassName("customlabel"); 
		for (let label of labelsCustom)
			this._setupCustomLabelEvents(label); 
  }

	/** @override */
	_onChangeTab(event, tabs, active) {
    this.object._theatre_mod_configTab = active;
    // Auto change height
    const tab = this.element.find(`.tab[data-tab="${active}"]`)[0];
		this.setPosition({height: (tab && tab.offsetHeight + 125) || "auto"})
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

		// find the formdata elements that contain "custom#" in their chain
		// once we find these objects, verify that there's a boolean attribute
		// specifying that it is a customEmote
		// next we need to verify that the name property is set, if not, we set
		// it to the prop key.
		// If any of this is missing in bot the form data AND the object data,
		// then we add it to the form submission
		for (let k in formData)
			if (formData[k] && /emotes\.custom\d+/.test(k)) {
				let mch = k.match(/flags\.theatre\.emotes\.custom\d+/)[0]; 
				let name = mch.match(/custom\d+/)[0]; 
				let labelPath =  mch + ".label"; 
				let cflagPath = mch + ".custom"; 
				let namePath = mch + ".name"; 
				if (Theatre.DEBUG) console.log("found %s",k,mch,cflagPath,namePath); 
				// if label is both the formData as well as the object, reject the submission
				let emoteProp = getProperty(this.object.data,mch); 
				let labelProp = null; 
				if (emoteProp)
					labelProp = getProperty(this.object.data,labelPath); 

				if ((!labelProp || labelProp == "")
				&& (!formData[labelPath] || formData[labelPath] == "")) {
					console.log("ERROR: No label for custom emote defined!"); 
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.BadCustomEmote"));
					return false; 
				}

				if (!emoteProp || !getProperty(this.object.data,cflagPath))
					formData[cflagPath] = true; 
				if (!emoteProp || !getProperty(this.object.data,namePath))
					formData[namePath] = name; 
			}

		// collect emote form updates + revised form updates
		let configElement = this.element[0]; 
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
						break; // don't add it to our new object
					}
			}
			if (!rem && isEmote)
				emoteFormData[k] = formData[k]; 
			else if (!rem && !isEmote)
				revisedFormData[k] = formData[k]; 
		}
		// null out the entries if deleted in emote form, revised simply does not have any updates
		// to deleted entries
		for (let elem of toDelete) {
			let name = elem.getAttribute("name"); 
			emoteFormData[`flags.theatre.emotes.${name}`] = null; 
		}

		return {emoteFormData: emoteFormData, revisedFormData: revisedFormData}; 
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
		let html = this.element[0]; 

		let dataLabels = html.querySelectorAll('label[data-edit]'); 
		for (let label of dataLabels) {
			let target = label.getAttribute("data-edit"); 
			formData[target] = label.textContent; 
		}
		return formData; 
	}

  /**
   * Implement the _updateObject method as required by the parent class spec
   * This defines how to update the subject of the form when the form is submitted
	 *
	 * @param event (Object) : event that triggered this update ? 
	 * @param formData (Object) : An object representing the formData that will be used to update the Entity. 
	 *
   * @private
   */
  async _updateObject(event, formData) {
    formData["_id"] = this.object._id;

		// if our baseinsert value was updated..
		if (Theatre.DEBUG) console.log(formData); 
		let insertDirty = false; 
		let baseInsert = formData["flags.theatre.baseinsert"]; 
		let optAlign = formData["flags.theatre.optalign"]; 
		let name = formData["flags.theatre.name"]; 
		let newBaseInsert = this.object.data.flags.theatre.baseinsert || (this.object.img ? this.object.img : "icons/mystery-man.png"); 
		let newName = this.object.data.flags.theatre.name || this.object.data.name; 
		let newAlign = this.object.data.flags.theatre.optalign || "top"; 

		// update Navbar of the corresponding ID
		let theatreId = `theatre-${this.object.data._id}`; 
		let navItem = Theatre.instance.getNavItemById(theatreId); 
		let cImg = Theatre.instance.getTheatreCoverPortrait(); 

		if (baseInsert != this.object.data.flags.theatre.baseinsert) {
			if (Theatre.DEBUG) console.log("baseinsert changed!"); 
			insertDirty = true; 
			newBaseInsert = (baseInsert == "" ? (this.object.img ? this.object.img : "icons/mystery-man.png") : baseInsert); 
			if (navItem) {
				navItem.setAttribute("src",newBaseInsert); 
				cImg.setAttribute("src",newBaseInsert); 
			}
		}
		if (optAlign != this.object.data.flags.theatre.optalign) {
			if (Theatre.DEBUG) console.log("optalign changed!"); 
			insertDirty = true; 
			newAlign = (optAlign == "" ? "top" : optAlign)
			if (navItem)
				navItem.setAttribute("optalign",newAlign); 
		}
		if (name != this.object.data.flags.theatre.name) {
			if (Theatre.DEBUG) console.log("name changed!"); 
			insertDirty = true; 
			newName = (name == "" ? this.object.data.name : name); 
			if (navItem) {
				navItem.setAttribute("name",newName); 
				navItem.setAttribute("title",newName+(newName == this.object.data.name ? "" : ` (${this.object.data.name})`)); 
			}
		}
		// Add label information to update if it has data-edit
		formData = this._processUpdateLabels(formData); 
		// Verify custom emotes if we have any
		let resForms = this._verifyCustomEmotes(formData);
		if (!resForms) return; 
		if (Theatre.DEBUG) console.log("Form data AFTER verification: ",resForms); 
		let revisedFormData = resForms.revisedFormData; 
		let emoteFormData = resForms.emoteFormData; 

		// check all image resources, if they differ the actor's, we need to replace the texture, and then tell all other clients to do so as well!
		//let inserts = formData.filter((e,k) => {return k.endsWith("insert") || k.endsWith("baseinsert")}); 
		let insert = Theatre.instance.getInsertById(theatreId); 
		let container = (insert ? insert.dockContainer : null); 
		let app = Theatre.instance.pixiCTX; 
		let insertEmote = Theatre.instance._getEmoteFromInsert(insert); 
		let newSrcImg = null; 
		let imgSrcs = []; 

		for (let k in formData)
			if (k.endsWith("insert") || k.endsWith("baseinsert")) {
				let oldValue = getProperty(this.object.data,k); 
				// if the old value does not exist, we will continue
				if (formData[k] != oldValue) {
					let emote = k.match(/emotes\.[a-z0-9\-]+/); 
					if (emote)
						emote = emote[0].replace(/emotes\./,"");
					let resName = formData[k]; 
					// A special case exists where the baseportrait is removed, and replaced with either
					// null or an empty string, we can set this value, but we need to change the re-render
					// behavior to take the sheet portrait or 'mystery man' image
					if (!resName || resName == "") {
						// try to restore baseinsert
						let formBaseInsert = formData["flags.theatre.baseinsert"]; 
						if (k.endsWith("insert") && !k.endsWith("baseinsert")) {
							if (formBaseInsert && formBaseInsert != "") 
								resName = formBaseInsert; 
							else if (this.object.data.flags.theatre.baseinsert && this.object.data.flags.theatre.baseinsert != "") 
								resName = this.object.data.flags.theatre.baseinsert; 
							else 
								resName = (this.object.data.img ? this.object.data.img : "icons/mystery-man.png"); 
						} else
							resName = (this.object.data.img ? this.object.data.img : "icons/mystery-man.png"); 
					}

					// ensure resource exists
					if (!await srcExists(resName)) {
						console.log("ERROR: Path %s does not exist!",resName); 
						ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.BadFilepath") + `"${resName}"`);
						return; 
					}

					// to prevent firing off X number of packets on a save submit
					imgSrcs.push({imgpath: resName, resname: resName}); 
					if (insertEmote == emote || !emote)
						newSrcImg = resName; 
				}
			}

		// check for null'd emotes, push the objects up a level if one exists
		const newData = mergeObject(this.object.data, emoteFormData, {inplace: false}); 
		let emMerge = newData.flags.theatre.emotes; 
		let nEmotes = {}; 
		for (let emProp in emMerge) {
			if (emMerge[emProp] == null)
				continue; 
			nEmotes[emProp] = emMerge[emProp]; 
		}
		// send the emote parent in bulk to get rid of unwanted children
		revisedFormData["flags.theatre.emotes"] = nEmotes; 
		if (Theatre.DEBUG) console.log("Final Push Config update:",revisedFormData); 
		
		this.object.update(revisedFormData).then((response)=>{
			// perform texture updates if needed
			if (imgSrcs.length > 0) {
				// we know the active emote, thus all we need is the new source image
				if (Theatre.DEBUG) console.log("sending imgSrcs for replaceAllTextures",imgSrcs); 
				Theatre.instance._AddAllTextureResources(imgSrcs,theatreId,insertEmote,newSrcImg, (loader,resources) => {
					// if our emote is active and we're replacing the emote texture, or base is active, and we're replacing the base texture
					if (Theatre.DEBUG) console.log("texture additions complete! ",newSrcImg, insertEmote); 

					if (app
					&& container
					&& newSrcImg) {
						if (Theatre.DEBUG) console.log("RE-RENDERING with NEW texture resource %s ",newSrcImg); 

						let resName = "icons/myster-man.png";
						if (insert.emote 
						&& this.object.data.flags.theatre.emotes[insert.emote].insert 
						&& this.object.data.flags.theatre.emotes[insert.emote].insert != "")
							resName = this.object.data.flags.theatre.emotes[insert.emote].insert; 
						else if (this.object.data.flags.theatre.baseinsert
						&& this.object.data.flags.theatre.baseinsert != "")
							resName = this.object.data.flags.theatre.baseinsert; 
						else if (this.object.data.img && this.object.data.img != "")
							resName = this.object.data.img; 

						// bubble up dataum from the update
						insert.optAlign = newAlign;
						insert.name = newName; 
						insert.label.text = newName; 

						Theatre.instance._clearPortraitContainer(theatreId); 
						Theatre.instance._setupPortraitContainer(theatreId,newAlign,newSrcImg,resources); 
						// re-attach label + typingBubble
						insert.dockContainer.addChild(insert.label); 
						insert.dockContainer.addChild(insert.typingBubble); 

						Theatre.instance._repositionInsertElements(insert); 

						if (!Theatre.instance.rendering)
							Theatre.instance._renderTheatre(performance.now()); 
					} 
				},false); 

				// replaceAllTextureResources will have performed the render, and sent the needed
				// packets
				// mark it as 'clean' since we're handling the render here
				insertDirty = false; 
			}

			// if the insert is dirty, clear and setup
			if (insertDirty && insert) {
				if (Theatre.DEBUG) console.log("Insert is dirty, re-render it!"); 
				let resName = "icons/myster-man.png";
				if (insert.emote 
				&& this.object.data.flags.theatre.emotes[insert.emote].insert 
				&& this.object.data.flags.theatre.emotes[insert.emote].insert != "")
					resName = this.object.data.flags.theatre.emotes[insert.emote].insert; 
				else if (this.object.data.flags.theatre.baseinsert
				&& this.object.data.flags.theatre.baseinsert != "")
					resName = this.object.data.flags.theatre.baseinsert; 
				else if (this.object.data.img && this.object.data.img != "")
					resName = this.object.data.img; 

				// bubble up dataum from the update
				insert.optAlign = newAlign;
				insert.name = newName; 
				insert.label.text = newName; 

				Theatre.instance._clearPortraitContainer(theatreId); 
				Theatre.instance._setupPortraitContainer(theatreId,newAlign,resName,PIXI.Loader.shared.resources); 
				// re-attach label + typingBubble
				insert.dockContainer.addChild(insert.label); 
				insert.dockContainer.addChild(insert.typingBubble); 

				Theatre.instance._repositionInsertElements(insert); 

				if (!Theatre.instance.rendering)
					Theatre.instance._renderTheatre(performance.now()); 
			}

			if (theatreId == Theatre.instance.speakingAs); 
				Theatre.instance.renderEmoteMenu(); 
			if (insertDirty)
				Theatre.instance._sendSceneEvent("renderinsert",{insertid: theatreId}); 

		});


  }

	/**
	 * Adds a new Custom emote, constructing the HTML to be injected
	 *
	 * @param ev (Event) triggered event
	 *
	 * @private
	 */
	_onAddEmoteLine(ev) {
		if (Theatre.DEBUG) console.log("Add Emote Pressed!"); 
		//ui.notifications.info(game.i18n.localize("Theatre.NotYet"));

		// We need to get a custom emote name for storage purposes, this is a running index from
		// 1-> MAXINT oh which the upper bound we don't account for, to get the correct custom
		// index to fill, we find all formGroups whose name starts with "custom" then when we
		// shave off the number, then we sort these numbers
		let emoteContainer = ev.currentTarget.parentNode; 
		let formEmoteElems = emoteContainer.getElementsByClassName("theatre-config-form-group"); 

		let customElems = []; 
		for (let elem of formEmoteElems) {
			let eName = elem.getAttribute("name"); 
			if (eName && eName.startsWith("custom"))
				customElems.push({sortidx: Number(eName.match(/\d+/)[0]),elem: elem}); 
		}
		// we grab max index, we don't care about possible missing indexes from removed custom emotes
		// so we'll just leave them as gaps
		customElems.sort((a,b)=>{return a.sortidx-b.sortidx}); 
		let customIdx = (customElems.length > 0 ? (customElems[customElems.length-1].sortidx+1) : 1); 


		let customObjElems = []; 
		for (let k in this.object.data.flags.theatre.emotes) {
			let eName = k; 
			if (eName && eName.startsWith("custom"))
				customObjElems.push({sortidx: Number(eName.match(/\d+/)[0]),elem: this.object.data.flags.theatre.emotes[k]}); 
		}
		// we grab max index, we don't care about possible missing indexes from removed custom emotes
		// so we'll just leave them as gaps
		customObjElems.sort((a,b)=>{return a.sortidx-b.sortidx}); 
		let customObjIdx = (customObjElems.length > 0 ? (customObjElems[customObjElems.length-1].sortidx+1) : 1); 
		let customName = `custom${Math.max(customIdx,customObjIdx)}`; 



		// inject a new DOM element to the emote list right before our button
		let formGroup = document.createElement("div"); 
		let emoteNameInput = document.createElement("input"); 
		let emoteIconHolder = document.createElement("div"); 
		let emoteIcon = document.createElement("img"); 
		let fileButton = document.createElement("button"); 
		let fileIcon = document.createElement("i"); 
		let fileInput = document.createElement("input"); 
		//let editEmoteButton = document.createElement("button"); 
		//let editEmoteIcon = document.createElement("i"); 

		KHelpers.addClass(formGroup,"theatre-config-form-group"); 
		KHelpers.addClass(emoteIconHolder,"theatre-emote-icon"); 
		KHelpers.addClass(emoteIconHolder,"file-picker"); 
		KHelpers.addClass(emoteIcon,"customicon"); 
		KHelpers.addClass(fileButton,"file-picker"); 
		KHelpers.addClass(fileIcon,"fas"); 
		KHelpers.addClass(fileIcon,"fa-file-import"); 
		KHelpers.addClass(fileIcon,"fa-fw"); 
		KHelpers.addClass(fileInput,"image"); 
		//KHelpers.addClass(editEmoteButton,"theatre-config-btn-edit-emote"); 
		//KHelpers.addClass(editEmoteIcon,"fas"); 
		//KHelpers.addClass(editEmoteIcon,"fa-sliders-h"); 

		formGroup.setAttribute("name",customName); 
		
		emoteNameInput.setAttribute("type","text"); 
		emoteNameInput.setAttribute("name",`flags.theatre.emotes.${customName}.label`); 
		emoteNameInput.setAttribute("data-dtype","String"); 
		emoteNameInput.setAttribute("placeholder",game.i18n.localize("Theatre.UI.Config.CustomEmotePlaceholder")); 
		emoteNameInput.value = game.i18n.localize("Theatre.UI.Config.CustomEmotePlaceholder"); 
		emoteNameInput.addEventListener("focusout",this._onCustomLabelInputFocusOut.bind(this)); 

		fileButton.setAttribute("type","button"); 
		fileButton.setAttribute("data-type","image"); 
		fileButton.setAttribute("data-target",`flags.theatre.emotes.${customName}.insert`); 
		fileButton.setAttribute("title","Browse Files"); 
		fileButton.setAttribute("tabindex","-1"); 

		emoteIcon.setAttribute("data-edit",`flags.theatre.emotes.${customName}.image`); 
		emoteIcon.setAttribute("src",Theatre.ICONLIB + "/blank.png"); 
		emoteIcon.setAttribute("title",game.i18n.localize("Theatre.UI.Title.ChooseEmoteIcon")); 

		//emoteIcon.setAttribute("src",`flags.theatre.emotes.${customName}.image`); 

		fileInput.setAttribute("type","text"); 
		fileInput.setAttribute("name",`flags.theatre.emotes.${customName}.insert`); 
		fileInput.setAttribute("data-dtype","String"); 
		fileInput.setAttribute("placeholder",game.i18n.localize("Theatre.UI.Config.PathPlaceholder")); 

		//editEmoteButton.setAttribute("type","button"); 
		//editEmoteButton.setAttribute("name", customName); 
		//editEmoteButton.setAttribute("title",game.i18n.localize("Theatre.UI.Config.ConfigureEmote")); 

		// assemble
		emoteIconHolder.appendChild(emoteIcon); 
		//editEmoteButton.appendChild(editEmoteIcon); 
		fileButton.appendChild(fileIcon); 

		formGroup.appendChild(emoteNameInput);
		formGroup.appendChild(emoteIconHolder);
		formGroup.appendChild(fileButton);
		formGroup.appendChild(fileInput);
		//formGroup.appendChild(editEmoteButton); 

		KHelpers.insertBefore(formGroup,ev.currentTarget); 
		this.activateListeners($(formGroup)); 

		// focus
		emoteNameInput.focus(); 
	}

  /**
   * Handle changing customEmote image by 
	 *
	 * @param ev (Event) triggered event
	 *
   * @private
   */
  _onCustomIconImage(ev) {
		let target = ev.currentTarget; 
    new FilePicker({
      type: "image",
      current: target.getAttribute("src"),
      callback: path => {
        target.src = path;
      },
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
		// replace the label with an input box
		ev.stopPropagation(); 
		let inputLabel = document.createElement("input"); 
		inputLabel.setAttribute("type","text"); 
		inputLabel.setAttribute("name",`flags.theatre.emotes.${ev.currentTarget.parentNode.getAttribute("name")}.label`); 
		inputLabel.setAttribute("data-dtype","String"); 
		inputLabel.setAttribute("placeholder",game.i18n.localize("Theatre.UI.Config.CustomEmotePlaceholder")); 
		inputLabel.setAttribute("value",ev.currentTarget.textContent); 
		inputLabel.addEventListener("focusout",this._onCustomLabelInputFocusOut.bind(this)); 
		KHelpers.insertBefore(inputLabel,ev.currentTarget); 
		inputLabel.select(); 
		inputLabel.focus(); 
		// replace
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
		// show dock
		let dock = ev.currentTarget.getElementsByClassName("theatre-config-emote-label-dock")[0]; 
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
		// hide dock
		let dock = ev.currentTarget.getElementsByClassName("theatre-config-emote-label-dock")[0]; 
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
		// re-build dock + label
		let label = document.createElement("label"); 
		let dock = document.createElement("div"); 
		let deleteIcon = document.createElement("i"); 
		KHelpers.addClass(label,"theatre-config-emote-label"); 
		KHelpers.addClass(label,"customlabel"); 
		KHelpers.addClass(dock,"theatre-config-emote-label-dock"); 
		KHelpers.addClass(deleteIcon,"fas"); 
		KHelpers.addClass(deleteIcon,"fa-trash"); 

		label.textContent = ev.currentTarget.value; 

		label.setAttribute("title",game.i18n.localize("Theatre.UI.Title.ChooseEmoteName")); 
		label.setAttribute("data-edit",`flags.theatre.emotes.${ev.currentTarget.parentNode.getAttribute("name")}.label`); 
		dock.setAttribute("title",game.i18n.localize("Theatre.UI.Title.DeleteCustomEmote")); 

		dock.appendChild(deleteIcon); 
		label.appendChild(dock); 
		KHelpers.insertBefore(label,ev.currentTarget); 
		this._setupCustomLabelEvents(label); 
		// replace
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
		// delete custom emote
		// mark the form group as 'to be deleted' as a rider on our update call
		let formGroup = KHelpers.seekParentClass(ev.currentTarget,"theatre-config-form-group",5); 
		if (!formGroup) return;
		formGroup.setAttribute("todelete",true); 
		formGroup.style.left = "20px";
		formGroup.style.transform = "scale(0.75)";
		formGroup.style.opacity = "0.25";
		ev.stopPropagation(); 
		formGroup.addEventListener("click",this._onUndoDockDelete.bind(this)); 
	}

	/**
	 * Undo a custom emote item delete
	 *
	 * @param ev (Event) triggered event
	 *
	 * @private
	 */
	_onUndoDockDelete(ev) {
		if (Theatre.DEBUG) console.log("undo delete!"); 
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
		label.addEventListener("click",this._onCustomLabelClick.bind(this)); 
		label.addEventListener("mouseenter",this._onCustomLabelMouseEnter.bind(this)); 
		label.addEventListener("mouseleave",this._onCustomLabelMouseLeave.bind(this)); 
		let dock = label.getElementsByClassName("theatre-config-emote-label-dock")[0]; 
		dock.addEventListener("click",this._onCustomLabelDockClick.bind(this)); 
	}

	/**
	 * Undo a custom emote item delete
	 *
	 * @param ev (Event) triggered event
	 *
	 * @private
	 */
	_onEditEmoteLine(ev) {
		if (Theatre.DEBUG) console.log("Emote config pressed for %s!",ev.currentTarget.getAttribute("name")); 
		ui.notifications.info(game.i18n.localize("Theatre.NotYet"));
	}


}

