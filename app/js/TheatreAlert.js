/**
 * TheatreAlert.js
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
 * TheatreAlert Class
 *
 * TheatreAlert app that spawns to inform of MOTD events by
 * querying the git-hub repo for MOTD information to show to
 * users such as module updates, compatability alerts, and timeline
 * goal updates where applicable. 
 *
 *
 * ============================================================
 */
class TheatreAlert extends Application {
	static get defaultOptions() {
	  const options = super.defaultOptions;
	  options.id = "theatre-alert";
	  options.template = "public/modules/theatre/app/templates/theatre_alert.html";
	  options.title = game.i18n.localize("Theatre.MOTD.Header");
	  options.width = 600;
	  return options;
  }


	/**
	 * Render the TheatreAlert if the motddata is present, and there is a
	 * new version available OR if the new info accumulator is greater than our current value
	 *
	 * @param (Boolean) force   Add the rendered application to the DOM if it is not already present. If false, the
	 *                          Application will only be re-rendered if it is already present.
	 * @param (Object) options  Additional rendering options which are applied to customize the way that the Application
	 *                          is rendered in the DOM.
	 */
	async render(force=false, options={}) {
		//let data = await fetch("modules/theatre/motd.json").then(r => r.text()); 
		let data = await this.makeGETRequest("https://gitlab.com/Ayanzo/motds/raw/master/motd_theatre.json"); 
		let module = game.modules.find(m => m.id == "theatre"); 
		let motdNewInfo = Theatre.instance.settings.motdNewInfo; 

		try {
			data = JSON.parse(data); 
			this.motdData = data; 
			if (!data || data.error) {
				console.log("ERROR: Unable to fetch MOTD!"); 
				return; 
			}
			if (Theatre.DEBUG) console.log("module, data ",module,data); 
			this.motdData.curversion = module.data.version; 

			if (isNewerVersion(data.version,module.data.version,module.data.version)) {
				// we don't update our new info accumulator to allow showing of the patchnotes later
				return super.render(force,options);
			} else if (motdNewInfo < data.newinfo) {
				this.motdData.update = true; 
				game.settings.set(Theatre.SETTINGS,"motdNewInfo",data.newinfo); 
				return super.render(force,options);
			} else {
				this.close(); 
			}
		} catch (e) {
			console.log("ERROR: Unable to fetch MOTD! ",e); 
			this.close(); 
		}
	}

	/**
	 * Get data for use for renderTemplate
	 *
	 * @return (Object) : The object to be passed to the handlebars complier
	 */
	async getData() {
		return {
			data: this.motdData
		}
	}


	/**
	 * Make an AJAX GET request to a URL
	 *
	 * @params url (String) : The URL to use when making a request. 
	 * @return (Promise) : The promise result of the AJAX request. 
	 */
	async makeGETRequest(url) {
		return new Promise(function (resolve,reject) {
			let cors_api = "https://cors-anywhere.herokuapp.com/"; 
			let xhr = new XMLHttpRequest();
			xhr.timeout = 3000; 
			xhr.open("GET",cors_api + url); 
			xhr.onload = function() {
				if (Theatre.DEBUG) console.log("got response %s %s",xhr.status,xhr.statusText); 	
				resolve(xhr.responseText); 
			}
			xhr.onerror = function() {
				if (Theatre.DEBUG) console.log("got response %s %s",xhr.status,xhr.statusText); 	
				reject('{error: "NODATA"}'); 
			}
			xhr.send(); 
		}); 
	}

	/**
	 * Activate Listeners
	 *
	 * @param html (JQuery) : JQuery object containing the the app level container
	 */
	activateListeners(html) {
		super.activateListeners(html);
	}

}
