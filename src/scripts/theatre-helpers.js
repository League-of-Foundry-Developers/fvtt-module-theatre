import KHelpers from "./KHelpers.js";
import { Theatre } from "./Theatre.js";
import { TheatreActor } from "./TheatreActor.js";
import { TheatreActorConfig } from "./TheatreActorConfig.js";
import CONSTANTS from "./constants/constants.js";
import Logger from "./lib/Logger.js";

export class TheatreHelpers {
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
        // Min 22px, max 32px, scale for all values inbetween
        let fontSize = Math.floor(Math.max((Math.min(containerWidth / boxes.length, 500) / 500) * 28, 18));
        Logger.debug("Reorder CALCUALTED FONT SIZE: ", fontSize);

        for (let textBox of boxes) {
            let theatreId = textBox.getAttribute("imgid");
            let insert = Theatre.instance.getInsertById(theatreId);

            if (!insert) {
                Theatre.instance._removeTextBoxFromTheatreBar(textBox);
                continue;
            }
            // if somehow the containers are not setup, skip and hope the next re-order has them ready

            if (!insert.portrait || !insert.label) {
                Logger.warn("WARN: %s : %s was not ready!", false, insert.name, insert.imgId);
                continue;
            }
            // if the insert/textBox pair is in the process of being removed.
            if (textBox.getAttribute("deleting")) continue;

            Logger.debug("repositioning %s :", theatreId, insert);
            let offset = KHelpers.offset(textBox);
            //left calc
            let leftPos = Math.round(
                Number(offset.left || 0) -
                    Number(KHelpers.style(textBox)["left"].match(/\-*\d+\.*\d*/) || 0) -
                    Number(KHelpers.style(Theatre.instance.theatreBar)["margin-left"].match(/\-*\d+\.*\d*/) || 0),
            );

            //insert.dockContainer.width = textBox.offsetWidth;

            if (insert.exitOrientation == "left") {
                Logger.debug(
                    "LEFT (name: %s): ",
                    insert.nameOrientation,
                    leftPos,
                    insert.name,
                    Theatre.instance.theatreBar.offsetWidth / 2,
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
                    Theatre.instance.theatreBar.offsetWidth / 2,
                );
                //right
                if (leftPos + insert.dockContainer.width / 2 <= Theatre.instance.theatreBar.offsetWidth / 2) {
                    Logger.debug("swapping " + insert.name + " to left alignment from right");
                    insert.exitOrientation = "left";
                }
            }
            // pre-split measurement
            insert.label.style.fontSize = game.settings.get(CONSTANTS.MODULE_ID, "nameFontSize");
            insert.label.style.lineHeight = game.settings.get(CONSTANTS.MODULE_ID, "nameFontSize") * 1.5;
            insert.label.style.wordWrap = false;
            insert.label.style.wordWrapWidth = insert.portrait.width;
            let labelExceeds = insert.label.width + 20 + insert.label.style.fontSize > textBox.offsetWidth;
            let preLabelWidth = insert.label.width;
            // split measurement
            insert.label.style.wordWrap = true;
            insert.label.style.wordWrapWidth = textBox.offsetWidth;
            // shrink if label exceeds
            if (labelExceeds) {
                // apply title font size
                let titleFontSize = Math.floor(Math.max((Math.min(containerWidth / boxes.length, 600) / 600) * 44, 28));
                insert.label.style.fontSize = titleFontSize;
                insert.label.style.lineHeight = titleFontSize * 1.5;
            }

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
            insert.dockContainer.y =
                Theatre.instance.theatreDock.offsetHeight -
                (insert.optAlign == "top" ? Theatre.instance.theatreBar.offsetHeight : 0) -
                insert.portrait.height;

            // theatreStyle specific adjustments
            switch (Theatre.instance.settings.theatreStyle) {
                case "lightbox":
                    // to allow top-aligned portraits to work without a seam
                    insert.dockContainer.y += insert.optAlign == "top" ? 8 : 0;
                    insert.label.y -= insert.optAlign == "top" ? 8 : 0;
                    break;
                case "clearbox":
                    insert.dockContainer.y = Theatre.instance.theatreDock.offsetHeight - insert.portrait.height;
                    insert.label.y += insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight;
                    insert.typingBubble.y += insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight;
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
            textBox.setAttribute("osize", insertFontSize);
            switch (Number(insert.textSize)) {
                case 3:
                    insertFontSize *= 1.5;
                    break;
                case 1:
                    insertFontSize *= 0.5;
                    break;
                default:
                    break;
            }
            textBox.style["font-size"] = `${insertFontSize}px`;

            // now apply it to all children and sub child heights if the height is different
            // note that we only care about growing, not shrinking to conserve a bit.
            if (
                textBox.children[0] &&
                textBox.children[0].tagName.toLowerCase() != "hr" &&
                textBox.children[0].offsetHeight != insertFontSize
            ) {
                for (let c of textBox.children) {
                    if (c.tagName.toLowerCase() == "hr") continue;
                    for (let sc of c.children) sc.style.height = `${insertFontSize}px`;
                    c.style.height = `${insertFontSize}px`;
                }
            }
            // bookmark leftPos as order for sorting
            insert.order = leftPos;
            insert.renderOrder = leftPos;

            let tweenId = "containerSlide";
            let tween = TweenMax.to(insert.dockContainer, 1, {
                //delay: 0.5,
                pixi: { x: leftPos, alpha: 1 },
                ease: Power4.easeOut,
                onComplete: function (ctx, imgId, tweenId) {
                    // decrement the rendering accumulator
                    ctx._removeDockTween(imgId, this, tweenId);
                    // remove our own reference from the dockContainer tweens
                },
                onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
            });
            Theatre.instance._addDockTween(theatreId, tween, tweenId);
        }
        // sort the render order by left position order
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
            // Theatre.DEBUG = true;
            game.settings.set(CONSTANTS.MODULE_ID, "debug", true);
            for (let insert of Theatre.instance.portraitDocks) {
                Theatre.instance.renderInsertById(insert.imgId);
            }
        } else {
            // Theatre.DEBUG = false;
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
        if (!str || typeof str != "string") {
            return null;
        }
        Logger.debug("verifying syntax %s", str);
        let tweenParams = [];

        try {
            let sections = str.split("|");
            let resName = sections[0];

            let verifyTarget = function (target) {
                // TODO verify each property
                return true;
            };

            for (let sdx = 1; sdx < sections.length; ++sdx) {
                let parts = sections[sdx].split(";");
                let idx = 0;
                let duration, advOptions, targets, propDefs;

                duration = Number(parts[idx]) || 1;
                if (/\([^\)\(]*\)/g.test(parts[++idx])) {
                    advOptions = parts[idx];
                    idx++;
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
                for (idx; idx < parts.length; ++idx) {
                    targets.push(parts[idx]);
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
                    } else {
                        throw Logger.error("component properties definition : " + target + " is incorrect");
                    }
                }

                Logger.debug("Animation Syntax breakdown of %s : ", sections[sdx], duration, advOptions, propDefs);
                tweenParams.push({ resName: resName, duration: duration, advOptions: advOptions, props: propDefs });
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
            // language specific fonts
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
                        "ReallyScaryMinchotai",
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
                        "TvNEnjoyStories",
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
                        "BaiJamjuree",
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
                        "GhostChase",
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
                        "Syemox",
                    ];
                    break;
            }
            // Load some essential fonts we use in PIXI
            FontsLoader.load({
                custom: {
                    families: [Theatre.instance.titleFont, Theatre.instance.textFont],
                },
            });
            // async load everything else
            let oFonts = [];
            for (let idx = Theatre.FONTS.length - 1; idx >= 0; --idx) {
                if (Theatre.FONTS[idx] == Theatre.instance.titleFont || Theatre.FONTS[idx] == Theatre.instance.textFont)
                    continue;
                oFonts.push(Theatre.FONTS[idx]);
            }
            var aLoader = async function (fonts) {
                FontsLoader.load({
                    custom: {
                        families: fonts,
                    },
                });
            };

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
            { name: "tears", path: "modules/theatre/assets/graphics/effects/tears.png" },
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
                    animations: [{ name: "smile", syntax: "smile|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" }],
                },
            },
            grin: {
                name: "grin",
                fatype: "far",
                faname: "fa-grin",
                label: game.i18n.localize("Theatre.Emote.Grin"),
                rigging: {
                    animations: [{ name: "grin", syntax: "grin|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" }],
                },
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
                        { name: "line_d", syntax: "line|0.5;(ease:bounce);x:65%,75%;y:15%,12%;rotation:65,65" },
                    ],
                },
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
                            syntax: "line|0.5;(ease:bounce);x:40%,35%;y:5%,0%;rotation:-20,-20|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5",
                        },
                        {
                            name: "line_b",
                            syntax: "line|0.5;(ease:bounce);x:30%,20%;y:15%,12%;rotation:-65,-65|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5",
                        },
                        {
                            name: "line_c",
                            syntax: "line|0.5;(ease:bounce);x:60%,65%;y:5%,0%;rotation:20,20|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5",
                        },
                        {
                            name: "line_d",
                            syntax: "line|0.5;(ease:bounce);x:70%,80%;y:15%,12%;rotation:65,65|0.5;(repeat:-1,yoyo:true);scaleX:1,1.2;scaleY:1,1.5",
                        },
                        {
                            name: "tears_a",
                            syntax: "tears|0.5;(repeat:-1,repeatDelay:1.7);x:60%,110%;y:25%,40%;rotation:-30,-30;alpha:0.5,0|0;scaleX:-1,-1",
                        },
                        {
                            name: "tears_b",
                            syntax: "tears|0.5;(repeat:-1,repeatDelay:0.8);x:40%,-10%;y:25%,40%;rotation:30,30;alpha:0.5,0",
                        },
                    ],
                },
            },
            dissatisfied: {
                name: "dissatisfied",
                fatype: "far",
                faname: "fa-frown-open",
                label: game.i18n.localize("Theatre.Emote.Dissatisfied"),
                rigging: {
                    animations: [
                        { name: "dissatisfied", syntax: "dissatisfied|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
                    ],
                },
            },
            frown: {
                name: "frown",
                fatype: "far",
                faname: "fa-frown",
                label: game.i18n.localize("Theatre.Emote.Frown"),
                rigging: {
                    animations: [
                        { name: "frown", syntax: "frown|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
                        { name: "sinking", syntax: "sinking|0.5;(ease:power2);x:50%,50%;y:-20%,15%;alpha:0,0.5" },
                    ],
                },
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
                            syntax: "swirl|0.5;(ease:power4);x:110%,75%;y:0%,10%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "swirl_b",
                            syntax: "swirl|0.5;(ease:power4);x:110%,65%;y:0%,40%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "swirl_c",
                            syntax: "swirl|0.5;(ease:power4);x:110%,90%;y:110%,50%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "swirl_d",
                            syntax: "swirl|0.5;(ease:power4);x:110%,85%;y:110%,70%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "swirl_e",
                            syntax: "swirl|0.5;(ease:power4);x:-10%,25%;y:0%,15%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "swirl_f",
                            syntax: "swirl|0.5;(ease:power4);x:-10%,15%;y:0%,38%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "swirl_g",
                            syntax: "swirl|0.5;(ease:power4);x:-10%,20%;y:110%,55%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "swirl_h",
                            syntax: "swirl|0.5;(ease:power4);x:-10%,35%;y:110%,67%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "swirl_i",
                            syntax: "swirl|0.5;(ease:power4);x:-10%,10%;y:110%,85%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "swirl_j",
                            syntax: "swirl|0.5;(ease:power4);x:-10%,45%;y:110%,95%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "swirl_k",
                            syntax: "swirl|0.5;(ease:power4);x:110%,95%;y:110%,90%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "swirl_l",
                            syntax: "swirl|0.5;(ease:power4);x:110%,70%;y:110%,82%;alpha:0,1|1;(repeat:-1);rotation:0,360",
                        },
                    ],
                },
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
                            syntax: "tears|0.5;(repeat:-1,repeatDelay:0.7);x:60%,110%;y:25%,40%;rotation:-30,-30;alpha:0.5,0|0;scaleX:-1,-1",
                        },
                        {
                            name: "tears_b",
                            syntax: "tears|0.5;(repeat:-1,repeatDelay:0.3);x:40%,-10%;y:25%,40%;rotation:30,30;alpha:0.5,0",
                        },
                        {
                            name: "tears_c",
                            syntax: "tears|0.5;(repeat:-1,repeatDelay:0.8);x:60%,90%;y:25%,50%;rotation:-10,-10;alpha:0.5,0|0;scaleX:-1,-1",
                        },
                        {
                            name: "tears_d",
                            syntax: "tears|0.5;(repeat:-1,repeatDelay:1.0);x:40%,10%;y:25%,50%;rotation:10,10;alpha:0.5,0",
                        },
                        {
                            name: "tears_e",
                            syntax: "tears|0.5;(repeat:-1,repeatDelay:0.2);x:60%,90%;y:25%,30%;rotation:-50,-50;alpha:0.5,0|0;scaleX:-1,-1",
                        },
                        {
                            name: "tears_f",
                            syntax: "tears|0.5;(repeat:-1,repeatDelay:1.2);x:40%,10%;y:25%,30%;rotation:50,50;alpha:0.5,0",
                        },
                    ],
                },
            },
            serious: {
                name: "serious",
                fatype: "far",
                faname: "fa-meh-rolling-eyes",
                image: "modules/theatre/assets/graphics/emotes/serious.png",
                label: game.i18n.localize("Theatre.Emote.Serious"),
                rigging: {
                    animations: [{ name: "serious", syntax: "serious|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" }],
                },
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
                            syntax: "ziggy|0;x:25%,25%;y:20%,20%|0.25;(repeat:-1,yoyo:true);rotation:-2,2",
                        },
                        {
                            name: "ziggy_2",
                            syntax: "ziggy|1;(repeat:-1,delay:1,repeatDelay:2);scaleX:1,2;scaleY:1,2;x:25%,25%;y:20%,20%;alpha:0.5,0|0.25;(repeat:-1,yoyo:true);rotation:0,5",
                        },
                    ],
                },
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
                            syntax: "veins|0.5;x:45%,45%;y:10%,10%;alpha:0,1|1;(repeat:-1,yoyo:true,ease:bounce);scaleX:0.7,1;scaleY:0.7,1",
                        },
                    ],
                },
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
                            syntax: "veins_red|0.5;x:45%,45%;y:10%,10%;alpha:0,1|1;(repeat:-1,yoyo:true,ease:elastic);scaleX:0.5,1;scaleY:0.5,1|0.25;(repeat:-1,yoyo:true);rotation:0,10",
                        },
                        {
                            name: "puff_a",
                            syntax: "puff|0;x:80%,80%;y:15%,15%;rotation:0,0|1;(repeat:-1,delay:1,yoyo:true,ease:power4);scaleX:0.3,1;scaleY:0.3,1;alpha:0,0.5",
                        },
                        {
                            name: "puff_b",
                            syntax: "puff|0;x:20%,20%;y:15%,15%;rotation:0,0|1;(repeat:-1,delay:1.5,yoyo:true,ease:power4);scaleX:-0.3,-1;scaleY:0.3,1;alpha:0,0.5",
                        },
                        {
                            name: "puff_c",
                            syntax: "puff|0;x:70%,70%;y:5%,5%;rotation:330,330|1;(repeat:-1,delay:2,yoyo:true,ease:power4);scaleX:0.3,1;scaleY:0.3,1;alpha:0,0.5",
                        },
                        {
                            name: "puff_d",
                            syntax: "puff|0;x:30%,30%;y:5%,5%;rotation:30,30|1;(repeat:-1,delay:2.5,yoyo:true,ease:power4);scaleX:-0.3,-1;scaleY:0.3,1;alpha:0,0.5",
                        },
                    ],
                },
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
                            syntax: "semiloud|0.5;x:25%,25%;y:20%,20%;alpha:0,1|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1|0.25;(repeat:-1,yoyo:true);rotation:-1,1",
                        },
                    ],
                },
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
                            syntax: "laughingsquint|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1",
                        },
                        {
                            name: "loud",
                            syntax: "loud|0.5;x:25%,25%;y:20%,20%;alpha:0,1|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1|0.125;(repeat:-1,yoyo:true);rotation:-1,1",
                        },
                    ],
                },
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
                            syntax: "loud|0.5;(ease:bounce);x:20%,20%;y:20%,20%;scaleX:0.1,1;scaleY:0.1,1|0.125;(repeat:-1,yoyo:true);rotation:-2,2",
                        },
                        {
                            name: "loud_b",
                            syntax: "loud|0.5;(ease:bounce);x:80%,80%;y:20%,20%;scaleX:-0.1,-1;scaleY:0.1,1|0.125;(repeat:-1,yoyo:true);rotation:-2,2",
                        },
                        {
                            name: "loud_c",
                            syntax: "loud|0;x:20%,20%;y:20%,20%|0.125;(repeat:-1,yoyo:true);rotation:-2,2|1;(repeat:-1);scaleX:1,1.5;scaleY:1,2;alpha:0.25,0",
                        },
                        {
                            name: "loud_d",
                            syntax: "loud|0;x:80%,80%;y:20%,20%|0.125;(repeat:-1,yoyo:true);rotation:-2,2|1;(repeat:-1);scaleX:-1,-1.5;scaleY:1,2;alpha:0.25,0",
                        },
                        {
                            name: "tears_a",
                            syntax: "tears|0.5;(repeat:-1,repeatDelay:1.7);x:60%,110%;y:25%,40%;rotation:-30,-30;alpha:0.5,0|0;scaleX:-1,-1",
                        },
                        {
                            name: "tears_b",
                            syntax: "tears|0.5;(repeat:-1,repeatDelay:0.8);x:40%,-10%;y:25%,40%;rotation:30,30;alpha:0.5,0",
                        },
                    ],
                },
            },
            worried: {
                name: "worried",
                fatype: "far",
                faname: "fa-grin-beam-sweat",
                label: game.i18n.localize("Theatre.Emote.Worried"),
                rigging: {
                    animations: [
                        { name: "worried", syntax: "worried|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" },
                        { name: "sweatdrop", syntax: "sweatdrop|2;(ease:bounce);x:30%,30%;y:0%,25%;alpha:0,1" },
                    ],
                },
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
                            syntax: "notice|0.5;x:25%,25%;y:20%,20%;alpha:0,1|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1",
                        },
                    ],
                },
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
                            syntax: "glimmer|0.5;x:10%,10%;y:58%,58%|0.5;(delay:0.2,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "glimmer_b",
                            syntax: "glimmer|0.5;x:85%,85%;y:20%,20%|0.5;(delay:0.3,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "glimmer_c",
                            syntax: "glimmer|0.5;x:40%,40%;y:45%,45%|0.5;(delay:0.5,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "glimmer_d",
                            syntax: "glimmer|0.5;x:35%,35%;y:30%,30%|0.5;(delay:0.6,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "glimmer_e",
                            syntax: "glimmer|0.5;x:65%,65%;y:35%,35%|0.5;(delay:0.4,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "glimmer_f",
                            syntax: "glimmer|0.5;x:80%,80%;y:50%,50%|0.5;(delay:0.1,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "glimmer_g",
                            syntax: "glimmer|0.5;x:16%,16%;y:81%,81%|0.5;(delay:0.8,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "glimmer_h",
                            syntax: "glimmer|0.5;x:55%,55%;y:64%,64%|0.5;(delay:0.9,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "glimmer_i",
                            syntax: "glimmer|0.5;x:44%,44%;y:95%,95%|0.5;(delay:0.7,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "glimmer_j",
                            syntax: "glimmer|0.5;x:67%,67%;y:84%,84%|0.5;(delay:0.35,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "glimmer_k",
                            syntax: "glimmer|0.5;x:44%,44%;y:70%,70%|0.5;(delay:0,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "glimmer_l",
                            syntax: "glimmer|0.5;x:20%,20%;y:23%,23%|0.5;(delay:0.65,repeat:-1,yoyo:true);scaleX:0.0,1;scaleY:0.0,1",
                        },
                    ],
                },
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
                            syntax: "blush|0.5;x:25%,25%;y:25%,25%|2;(ease:sineInOut,repeat:-1,yoyo:true);scaleX:0.9,1;scaleY:0.9,1;alpha:0.5,1|0.5;(repeat:-1,yoyo:true);rotation:-3,3",
                        },
                    ],
                },
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
                            syntax: "heart|2;(repeat:-1,delay:1.3);y:110%,-10%;alpha:1,0|0.5;(delay:0.1,repeat:-1,yoyo:true);x:5%,10%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1",
                        },
                        {
                            name: "heart_b",
                            syntax: "heart|2;(repeat:-1,delay:0.3);y:110%,-10%;alpha:1,0|0.5;(delay:0.9,repeat:-1,yoyo:true);x:5%,10%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1",
                        },
                        {
                            name: "heart_c",
                            syntax: "heart|2;(repeat:-1,delay:0.8);y:110%,-10%;alpha:1,0|0.5;(delay:0.2,repeat:-1,yoyo:true);x:15%,20%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1",
                        },
                        {
                            name: "heart_d",
                            syntax: "heart|2;(repeat:-1,delay:0.5);y:110%,-10%;alpha:1,0|0.5;(delay:0.8,repeat:-1,yoyo:true);x:25%,30%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1",
                        },
                        {
                            name: "heart_e",
                            syntax: "heart|2;(repeat:-1,delay:1.7);y:110%,-10%;alpha:1,0|0.5;(delay:0.3,repeat:-1,yoyo:true);x:35%,40%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1",
                        },
                        {
                            name: "heart_f",
                            syntax: "heart|2;(repeat:-1,delay:2);y:110%,-10%;alpha:1,0|0.5;(delay:0.7,repeat:-1,yoyo:true);x:45%,50%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1",
                        },
                        {
                            name: "heart_g",
                            syntax: "heart|2;(repeat:-1,delay:1.5);y:110%,-10%;alpha:1,0|0.5;(delay:0.4,repeat:-1,yoyo:true);x:55%,60%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1",
                        },
                        {
                            name: "heart_h",
                            syntax: "heart|2;(repeat:-1,delay:0.7);y:110%,-10%;alpha:1,0|0.5;(delay:0.6,repeat:-1,yoyo:true);x:65%,70%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1",
                        },
                        {
                            name: "heart_i",
                            syntax: "heart|2;(repeat:-1,delay:1.7);y:110%,-10%;alpha:1,0|0.5;(delay:0.5,repeat:-1,yoyo:true);x:75%,80%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1",
                        },
                        {
                            name: "heart_j",
                            syntax: "heart|2;(repeat:-1,delay:0.4);y:110%,-10%;alpha:1,0|0.5;(delay:0.35,repeat:-1,yoyo:true);x:85%,90%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1",
                        },
                        {
                            name: "heart_k",
                            syntax: "heart|2;(repeat:-1,delay:2.3);y:110%,-10%;alpha:1,0|0.5;(delay:0.25,repeat:-1,yoyo:true);x:95%,100%|0.25;(delay:0.2,repeat:-1,yoyo:true,ease:bounce);scaleX:0.8,1;scaleY:0.8,1",
                        },
                    ],
                },
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
                            syntax: "heart|4;(ease:expo);x:45%,-10%;alpha:1,0|0.25;(repeat:6,yoyo:true);y:25%,30%|0.25;(repeat:6,yoyo:true,ease:power4);scaleX:0.8,1.5;scaleY:0.8,1.5",
                        },
                    ],
                },
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
                            syntax: "thoughtbubble|0.5;(ease:power3);x:25%,25%;y:10%,10%;alpha:0,1|0.5;(repeat:-1,yoyo:true);scaleX:0.95,1;scaleY:0.95,1",
                        },
                        {
                            name: "bubbledot_a",
                            syntax: "bubbledot|0.5;(ease:power3);x:28%,28%;y:18%,18%;alpha:0,1|1;(repeat:-1,yoyo:true,repeatDelay:0.3);scaleX:0.5,1;scaleY:0.5,1|5;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "bubbledot_b",
                            syntax: "bubbledot|0.5;(ease:power3);x:31%,31%;y:21%,21%;alpha:0,1|1;(repeat:-1,yoyo:true,repeatDelay:0.1);scaleX:0.5,1;scaleY:0.5,1|5;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "bubbledot_c",
                            syntax: "bubbledot|0.5;(ease:power3);x:34%,34%;y:24%,24%;alpha:0,1|1;(repeat:-1,yoyo:true,repeatDelay:0.5);scaleX:0.5,1;scaleY:0.5,1|5;(repeat:-1);rotation:0,360",
                        },
                    ],
                },
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
                            syntax: "scribbleball|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:45%,45%;y:0%,0%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:0,5",
                        },
                    ],
                },
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
                            syntax: "lightbulb|0.5;(ease:bounce);x:50%,50%;y:-10%,-10%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:0,5|1;(repeat:-1,yoyo:true);scaleX:1,1.3;scaleY:1,1.3",
                        },
                    ],
                },
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
                            syntax: "sigh|3;(ease:power2);x:30%,10%;y:25%,45%;alpha:1,0;rotation:225,225;scaleX:1,1.5;scaleY:1,1.5",
                        },
                    ],
                },
            },
            smug: {
                name: "smug",
                fatype: "far",
                faname: "fa-grin-tongue-wink",
                image: "modules/theatre/assets/graphics/emotes/smug.png",
                label: game.i18n.localize("Theatre.Emote.Smug"),
                rigging: {
                    animations: [{ name: "smug", syntax: "smug|1;(ease:elastic);x:80%,80%;y:0%,25%;alpha:0,1" }],
                },
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
                            syntax: "star|4;(ease:expo);x:45%,-10%;y:25%,25%;alpha:1,0|2;(repeat:4);rotation:0,360",
                        },
                        {
                            name: "kawaii_b",
                            syntax: "star|3;(ease:expo);x:45%,10%;y:25%,12%;alpha:1,0|2;(repeat:4);rotation:0,360",
                        },
                        {
                            name: "kawaii_c",
                            syntax: "star|3;(ease:expo);x:45%,10%;y:25%,38%;alpha:1,0|2;(repeat:4);rotation:0,360",
                        },
                    ],
                },
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
                            syntax: "star|4;(ease:expo,delay:2);x:30%,30%;y:25%,25%;alpha:1,0;scaleX:1.3,0.1;scaleY:1.3,0.1|2;(repeat:4);rotation:0,360",
                        },
                    ],
                },
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
                            syntax: "star|3;(ease:expo);x:40%,-10%;y:25%,-15%;alpha:1,0|2;(repeat:4);rotation:0,360",
                        },
                        {
                            name: "kawaii_b",
                            syntax: "star|4;(ease:expo);x:40%,-40%;y:25%,30%;alpha:1,0|2;(repeat:4);rotation:0,360",
                        },
                        {
                            name: "kawaii_c",
                            syntax: "star|3;(ease:expo);x:40%,-10%;y:25%,55%;alpha:1,0|2;(repeat:4);rotation:0,360",
                        },
                        {
                            name: "kawaii_d",
                            syntax: "star|3;(ease:expo);x:60%,110%;y:25%,-15%;alpha:1,0|2;(repeat:4);rotation:0,360",
                        },
                        {
                            name: "kawaii_e",
                            syntax: "star|4;(ease:expo);x:60%,140%;y:25%,30%;alpha:1,0|2;(repeat:4);rotation:0,360",
                        },
                        {
                            name: "kawaii_f",
                            syntax: "star|3;(ease:expo);x:60%,110%;y:25%,55%;alpha:1,0|2;(repeat:4);rotation:0,360",
                        },
                        {
                            name: "kawaii_g",
                            syntax: "star|4;(ease:expo);x:50%,50%;y:15%,-35%;alpha:1,0|2;(repeat:4);rotation:0,360",
                        },
                        {
                            name: "kawaii_h",
                            syntax: "star|4;(ease:expo);x:50%,50%;y:35%,85%;alpha:1,0|2;(repeat:4);rotation:0,360",
                        },
                    ],
                },
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
                            syntax: "miasma|0;x:25%,25%;y:78%,78%|3;(repeat:-1,delay:0.3);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_b",
                            syntax: "miasma|0;x:73%,73%;y:68%,68%|3;(repeat:-1,delay:1.3);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_c",
                            syntax: "miasma|0;x:15%,15%;y:60%,60%|3;(repeat:-1,delay:0.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_d",
                            syntax: "miasma|0;x:45%,45%;y:85%,85%|3;(repeat:-1,delay:2.6);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_e",
                            syntax: "miasma|0;x:90%,90%;y:80%,80%|3;(repeat:-1,delay:3.5);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_f",
                            syntax: "miasma|0;x:55%,55%;y:60%,60%|3;(repeat:-1,delay:2.1);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_g",
                            syntax: "miasma|0;x:10%,10%;y:90%,90%|3;(repeat:-1,delay:3.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_h",
                            syntax: "miasma|0;x:95%,95%;y:70%,70%|3;(repeat:-1,delay:1.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_i",
                            syntax: "miasma|0;x:50%,50%;y:72%,72%|3;(repeat:-1,delay:5.8);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_j",
                            syntax: "miasma|0;x:10%,10%;y:66%,66%|3;(repeat:-1,delay:3.6);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_k",
                            syntax: "miasma|0;x:3%,3%;y:88%,88%|3;(repeat:-1,delay:2.2);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_l",
                            syntax: "miasma|0;x:78%,78%;y:75%,75%|3;(repeat:-1,delay:1.7);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_m",
                            syntax: "miasma|0;x:65%,65%;y:98%,98%|3;(repeat:-1,delay:.7);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_n",
                            syntax: "miasma|0;x:33%,33%;y:78%,78%|3;(repeat:-1,delay:4.4);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                        {
                            name: "miasma_o",
                            syntax: "miasma|0;x:80%,80%;y:92%,92%|3;(repeat:-1,delay:5.2);alpha:1,0;scaleX:0.0,1;scaleY:0.0,1",
                        },
                    ],
                },
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
                            syntax: "halo|2;(ease:power2);x:50%,50%;alpha:0,1|2;(ease:sine,repeat:-1,yoyo:true,yoyoEase:sine);y:-3%,-5%",
                        },
                    ],
                },
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
                            syntax: "musicnote|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:10%,10%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-10,10|1;(ease:sine,yoyo:true,yoyoEase:sine,repeat:-1);y:20%,30%",
                        },
                        {
                            name: "musicnote_b",
                            syntax: "musicnote|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:20%,20%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-10,10|1;(ease:sine,yoyo:true,yoyoEase:sine,repeat:-1,delay:0.25);y:15%,25%",
                        },
                        {
                            name: "musicnote_c",
                            syntax: "musicnote|0.5;(ease:bounce);scaleX:0.1,1;scaleY:0.1,1;x:30%,30%;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-10,10|1;(ease:sine,yoyo:true,yoyoEase:sine,repeat:-1,delay:0.5);y:20%,30%",
                        },
                    ],
                },
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
                            syntax: "linesteep|0;x:50%,50%;y:-10%,-10%|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1",
                        },

                        {
                            name: "line_b",
                            syntax: "linesteep|0;x:35%,35%;y:-5%,-5%;rotation:-22.5,-22.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1",
                        },
                        {
                            name: "line_c",
                            syntax: "linesteep|0;x:15%,15%;y:5%,5%;rotation:-45,-45|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1",
                        },
                        {
                            name: "line_d",
                            syntax: "linesteep|0;x:0%,0%;y:20%,20%;rotation:-67.5,-67.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1",
                        },
                        {
                            name: "line_e",
                            syntax: "linesteep|0;x:-10%,-10%;y:30%,30%;rotation:-90,-90|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1",
                        },

                        {
                            name: "line_f",
                            syntax: "linesteep|0;x:65%,65%;y:-5%,-5%;rotation:22.5,22.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1",
                        },
                        {
                            name: "line_g",
                            syntax: "linesteep|0;x:85%,85%;y:5%,5%;rotation:45,45|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1",
                        },
                        {
                            name: "line_h",
                            syntax: "linesteep|0;x:100%,100%;y:20%,20%;rotation:67.5,67.5|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1",
                        },
                        {
                            name: "line_i",
                            syntax: "linesteep|0;x:110%,110%;y:30%,30%;rotation:90,90|1;(repeat:-1,yoyo:true);scaleX:0.5,1;scaleY:0.5,1",
                        },
                    ],
                },
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
                            syntax: "star|2;(ease:sineInOut,repeat:-1,yoyo:true);x:10%,90%;y:35%,5%|1;(repeatDelay:1,repeat:-1,yoyo:true);scaleX:0.2,1;scaleY:0.2,1;alpha:0.2,1|2;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "stars_b",
                            syntax: "star|2;(ease:sineInOut,repeat:-1,yoyo:true);x:90%,10%;y:5%,35%|1;(repeatDelay:1,repeat:-1,yoyo:true);scaleX:1,0.2;scaleY:1,0.2;alpha:1,0.2|2;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "stars_c",
                            syntax: "star|2;(ease:sineInOut,repeat:-1,yoyo:true,delay:1);x:10%,90%;y:5%,35%|1;(repeatDelay:1,delay:1,repeat:-1,yoyo:true);scaleX:0.2,1;scaleY:0.2,1;alpha:0.2,1|2;(repeat:-1);rotation:0,360",
                        },
                        {
                            name: "stars_d",
                            syntax: "star|2;(ease:sineInOut,repeat:-1,yoyo:true,delay:1);x:90%,10%;y:35%,5%|1;(repeatDelay:1,delay:1,repeat:-1,yoyo:true);scaleX:1,0.2;scaleY:1,0.2;alpha:1,0.2|2;(repeat:-1);rotation:0,360",
                        },
                    ],
                },
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
                            syntax: "dot|0.5;(ease:power3);x:30%,30%;y:25%,25%;alpha:0,1|1;(ease:bounce,repeat:-1,delay:0,repeatDelay:3,yoyo:true,yoyoEase:power0);scaleX:0.5,1;scaleY:0.5,1",
                        },
                        {
                            name: "dot_b",
                            syntax: "dot|0.5;(ease:power3);x:25%,25%;y:25%,25%;alpha:0,1|1;(ease:bounce,repeat:-1,delay:1,repeatDelay:3,yoyo:true,yoyoEase:power0);scaleX:0.5,1;scaleY:0.5,1",
                        },
                        {
                            name: "dot_c",
                            syntax: "dot|0.5;(ease:power3);x:20%,20%;y:25%,25%;alpha:0,1|1;(ease:bounce,repeat:-1,delay:2,repeatDelay:3,yoyo:true,yoyoEase:power0);scaleX:0.5,1;scaleY:0.5,1",
                        },
                    ],
                },
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
                            syntax: "ghostball1|0;x:70%,70%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.5);y:30%,35%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5",
                        },
                        {
                            name: "ghostball_b",
                            syntax: "ghostball1|0;x:30%,30%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:1);y:10%,15%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5",
                        },
                        {
                            name: "ghostball_c",
                            syntax: "ghostball1|0;x:20%,20%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.8);y:60%,65%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5",
                        },
                        {
                            name: "ghostball_d",
                            syntax: "ghostball2|0;x:85%,85%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.4);y:75%,80%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5",
                        },
                        {
                            name: "ghostball_e",
                            syntax: "ghostball2|0;x:10%,10%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:1.2);y:40%,45%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5",
                        },
                        {
                            name: "ghostball_f",
                            syntax: "ghostball2|0;x:60%,60%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.6);y:80%,85%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5",
                        },
                        {
                            name: "ghostball_g",
                            syntax: "ghostball1|0;x:90%,90%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:1.5);y:10%,15%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5",
                        },
                        {
                            name: "ghostball_h",
                            syntax: "ghostball2|0;x:75%,75%|1;(ease:sine,yoyoEase:sine,repeat:-1,yoyo:true,delay:0.9);y:50%,55%;scaleX:0.8,1;scaleY:0.8,1;alpha:0,1|0.25;(repeat:-1,yoyo:true);rotation:-5,5",
                        },
                    ],
                },
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
                            syntax: "zzz|4;(repeat:-1,delay:0);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:0,yoyo:true);x:30%,40%",
                        },
                        {
                            name: "zzz_b",
                            syntax: "zzz|4;(repeat:-1,delay:1);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:0.5,yoyo:true);x:30%,40%",
                        },
                        {
                            name: "zzz_c",
                            syntax: "zzz|4;(repeat:-1,delay:2);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:1,yoyo:true);x:30%,40%",
                        },
                        {
                            name: "zzz_d",
                            syntax: "zzz|4;(repeat:-1,delay:3);y:25%,-20%;alpha:0,1;scaleX:0.1,1;scaleY:0.1,1|1;(ease:sineInOut,repeat:-1,delay:1.5,yoyo:true);x:30%,40%",
                        },
                    ],
                },
            },
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
                    cspan.style.width = `${fontSize / 4}px`;
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
            let rHead =
                ")）]｝〕〉》」』】〙〗〟'\"｠»ヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ々〻‐゠–〜? ! ‼ ⁇ ⁈ ⁉・、:;,。.";
            let rTail = "(（[｛〔〈《「『【〘〖〝'\"｟«";
            let rSplit = "—.‥〳〴〵";
            let word = null;
            for (let idx = 0; idx < text.length; ++idx) {
                let c = text[idx];
                let rh = false;
                let rt = false;
                let rs = false;
                let nl = false;
                let sp = false;
                let nv = false;
                let la = text[idx + 1];
                //if (!la) la = text[idx+1];

                if (la && rHead.match(RegExp.escape(la))) {
                    // if la is of the rHead set
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
                    // if c is of the rTail set
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
                if (rSplit.match(RegExp.escape(c)) && text[idx + 1] && text[idx + 1] == c) {
                    // if c is of the rSplit set, and is followed by another of its type
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
                if (!isNaN(Number(c)) && text[idx + 1] && !isNaN(Number(text[idx + 1]))) {
                    // keep numbers together
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

                // scan next character to see if it belongs in the rHead or rTail
                if (text[idx + 1] && /*rTail.match(text[idx+1]) || */ rHead.match(RegExp.escape(text[idx + 1])))
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
                    if (word) word.appendChild(cspan);
                    else textBox.appendChild(cspan);
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
            // Korean Line breaking KS X ISO/IEC 26300:2007 (KO)
            let rHead = "!%),.:;?]}¢°'\"†‡℃〆〈《「『〕！％），．：；？］｝ ";
            let rTail = "$([\\{£¥'\"々〇〉》」〔＄（［｛｠￥￦#";
            let word = null;
            for (let idx = 0; idx < text.length; ++idx) {
                let c = text[idx];
                let rh = false;
                let rt = false;
                let rs = false;
                let nl = false;
                let nv = false;
                let la = text[idx + 1];
                //if (!la) la = text[idx+1];

                if (la && rHead.match(RegExp.escape(la))) {
                    // if la is of the rHead set
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
                    // if c is of the rTail set
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
                if (!isNaN(Number(c)) && text[idx + 1] && !isNaN(Number(text[idx + 1]))) {
                    // keep numbers together
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

                // scan next character to see if it belongs in the rHead or rTail
                if (text[idx + 1] && /*rTail.match(text[idx+1]) || */ rHead.match(RegExp.escape(text[idx + 1])))
                    nv = true;

                if (c == " ") {
                    // if not a newline, but a space output the space just like any other character.
                    let cspan = document.createElement("span");
                    cspan.textContent = c;
                    cspan.style.height = `${fontSize}px`;
                    cspan.style.width = `${fontSize / 4}px`;
                    cspan.style.position = "relative";
                    if (word) word.appendChild(cspan);
                    else textBox.appendChild(cspan);
                    charSpans.push(cspan);
                } else if (c == "\n") {
                    // end any word immediately, we trust the formatting over the Kinsoku Shori
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
    static onConfigureInsert(ev, actorSheet) {
        ev.preventDefault();

        Logger.debug("Click Event on Configure Theatre!!!", actorSheet, actorSheet.actor, actorSheet.position);

        if (!actorSheet.actor.flags.theatre) {
            actorSheet.actor.flags.theatre = { baseinsert: "", name: "" };
        }

        new TheatreActorConfig(actorSheet.actor, {
            top: actorSheet.position.top + 40,
            left: actorSheet.position.left + (actorSheet.position.width - 500) / 2,
            configureDefault: true,
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
        // Toggle iconElement class
        const iconElement = ev.currentTarget.querySelector("i");
        iconElement.className = Theatre.isActorStaged(actor) ? "fas fa-mask" : "fas fa-theater-masks";
        //Set the new text content
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
        // if already on stage, dont add it again
        // create nav-list-item
        // set picture as actor.img
        // set attribute "theatre-id" to "theatre" + _id
        // set attribute "insertImg" to object.flags.theatre.baseinsert or img if not specified
        // add click handler to push it into the theatre bar, if it already exists on the bar, remove it
        // from the bar
        // add click handler logic to remove it from the stage
        let theatreId = Theatre._getTheatreId(actor);
        let portrait = actor.img ? actor.img : CONSTANTS.DEFAULT_PORTRAIT;
        let optAlign = "top";
        let name = actor.name;

        if (!Theatre.instance.isActorOwner(game.user.id, theatreId)) {
            Logger.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"), true);
            return;
        }

        // Use defaults incase the essential flag attributes are missing
        if (actor.flags.theatre) {
            if (actor.flags.theatre.name && actor.flags.theatre.name != "") {
                name = actor.flags.theatre.name;
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
        KHelpers.addClass(navItem, "theatre-control-nav-bar-item");
        //navItem.setAttribute("draggable",false);
        navItem.setAttribute("imgId", theatreId);
        navItem.setAttribute("src", portrait);
        navItem.setAttribute("title", name + (name == actor.name ? "" : ` (${actor.name})`));
        navItem.setAttribute("name", name);
        navItem.setAttribute("optalign", optAlign);

        // if the theatreId is present, then set our navItem as active!
        if (!!Theatre.instance.getInsertById(theatreId))
            KHelpers.addClass(navItem, "theatre-control-nav-bar-item-active");

        navItem.addEventListener("mouseup", Theatre.instance.handleNavItemMouseUp);
        navItem.addEventListener("dragstart", Theatre.instance.handleNavItemDragStart);
        navItem.addEventListener("dragend", Theatre.instance.handleNavItemDragEnd);
        navItem.addEventListener("dragover", Theatre.instance.handleNavItemDragOver);
        navItem.addEventListener("drop", Theatre.instance.handleNavItemDragDrop);
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
        if (!actor) {
            return;
        }
        const theatreId = Theatre._getTheatreId(actor);
        Theatre.instance._removeFromStage(theatreId);
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
                impact: {
                    func: function (target, shakeradius) {
                        if (!target) return;
                        shakeradius = shakeradius || Math.random() * 7 + 7;
                        shakeradius = Math.max(shakeradius - Math.random() * 0.5, 0);
                        // Impact complete!
                        if (shakeradius == 0) {
                            target.style.left = "0px";
                            target.style.top = "0px";
                            return;
                        }

                        TweenMax.to(target, 0.025, {
                            left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius}px`,
                            top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * shakeradius}px`,
                            onComplete: Theatre.textStandingAnimation("impact"),
                            onCompleteParams: [target, shakeradius],
                        });
                    },
                    label: game.i18n.localize("Theatre.Standing.Impact"),
                },

                quiver: {
                    func: function (target, quiverAmt) {
                        if (!target) return;
                        quiverAmt = quiverAmt || 2;
                        quiverAmt = Math.max(quiverAmt - Math.random() * 0.1, 0);
                        // Waver complete
                        if (quiverAmt == 0) {
                            target.style.left = "0px";
                            target.style.top = "0px";
                            return;
                        }

                        TweenMax.to(target, 0.1, {
                            left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * quiverAmt}px`,
                            top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * quiverAmt}px`,
                            onComplete: Theatre.textStandingAnimation("quiver"),
                            onCompleteParams: [target, quiverAmt],
                        });
                    },
                    label: game.i18n.localize("Theatre.Standing.Quiver"),
                },

                wave: {
                    func: function (target, waveAmp) {
                        if (!target) return;
                        waveAmp = waveAmp || 4;
                        if (waveAmp > 0) waveAmp = waveAmp - 0.5;
                        else waveAmp = waveAmp + 0.5;

                        // Waver complete
                        if (waveAmp == 0) {
                            target.style.top = "0px";
                            return;
                        }

                        TweenMax.to(target, 0.5, {
                            top: `${waveAmp}px`,
                            onComplete: Theatre.textStandingAnimation("wave"),
                            onCompleteParams: [target, -waveAmp],
                        });
                    },
                    label: game.i18n.localize("Theatre.Standing.Wave"),
                },

                fade: {
                    func: function (target, fade) {
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
                            onCompleteParams: [target, fade],
                        });
                    },
                    label: game.i18n.localize("Theatre.Standing.Fade"),
                },

                excited: {
                    func: function (target) {
                        if (!target) return;
                        TweenMax.to(target, 0.025, {
                            left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
                            top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
                            onComplete: Theatre.textStandingAnimation("excited"),
                            onCompleteParams: [target],
                        });
                    },
                    label: game.i18n.localize("Theatre.Standing.Excited"),
                },

                violent: {
                    func: function (target, oshakeradius, ox, oy) {
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
                            onCompleteParams: [target, oshakeradius, ox, oy],
                        });
                    },
                    label: game.i18n.localize("Theatre.Standing.Violent"),
                },

                bubbly: {
                    func: function (target) {
                        if (!target) return;
                        TweenMax.to(target, 0.5, {
                            scale: `${Math.floor((Math.random() * 0.4 + 0.8) * 100) / 100}`,
                            onComplete: Theatre.textStandingAnimation("bubbly"),
                            onCompleteParams: [target],
                        });
                    },
                    label: game.i18n.localize("Theatre.Standing.Bubbly"),
                },

                spooky: {
                    func: function (target) {
                        if (!target) return;
                        TweenMax.to(target, Math.floor((Math.random() * 0.25 + 0.2) * 100) / 100, {
                            left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 3}px`,
                            top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 3}px`,
                            onComplete: Theatre.textStandingAnimation("spooky"),
                            onCompleteParams: [target],
                        });
                    },
                    label: game.i18n.localize("Theatre.Standing.Spooky"),
                },

                insane: {
                    func: function (target, rotation, scale) {
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
                            rotation =
                                rotation != 0 ? 0 : (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 30);
                        }

                        if (grow >= 199) {
                            if (scale != 1) scale = 1;
                            else scale = Math.random() * 0.5 + 1;
                        }

                        TweenMax.to(target, animtime, {
                            left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
                            top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 1}px`,
                            rotation: rotation,
                            scale: scale,
                            onComplete: Theatre.textStandingAnimation("insane"),
                            onCompleteParams: [target, rotation, scale],
                        });
                    },
                    label: game.i18n.localize("Theatre.Standing.Insane"),
                },
            };

        if (Theatre.STANDING_ANIMS[name]) {
            return Theatre.STANDING_ANIMS[name].func;
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
    static textFlyinAnimation(name) {
        if (!Theatre.FLYIN_ANIMS)
            Theatre.FLYIN_ANIMS = {
                typewriter: {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        gsap.from(charSpans, {
                            duration: 0.05,
                            stagger: {
                                each: 0.05,
                                onComplete: function () {
                                    if (standingAnim) standingAnim.call(this, this.targets()[0]);
                                },
                            },
                            opacity: 0,
                            scale: 1.5,
                        });
                    },
                    label: game.i18n.localize("Theatre.Flyin.Typewriter"),
                },

                fadein: {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        gsap.from(charSpans, {
                            duration: animTime,
                            stagger: {
                                each: speed,
                                onComplete: function () {
                                    if (standingAnim) standingAnim.call(this, this.targets()[0]);
                                },
                            },
                            opacity: 0,
                        });
                    },
                    label: game.i18n.localize("Theatre.Flyin.Fadein"),
                },

                slidein: {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        gsap.from(charSpans, {
                            duration: animTime,
                            stagger: {
                                each: speed,
                                onComplete: function () {
                                    if (standingAnim) standingAnim.call(this, this.targets()[0]);
                                },
                            },
                            opacity: 0,
                            left: 200,
                        });
                    },
                    label: game.i18n.localize("Theatre.Flyin.Slidein"),
                },

                scalein: {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        gsap.from(charSpans, {
                            duration: animTime,
                            stagger: {
                                each: speed,
                                onComplete: function () {
                                    if (standingAnim) standingAnim.call(this, this.targets()[0]);
                                },
                            },
                            opacity: 0,
                            scale: 5,
                            //rotation: -180,
                            ease: Power4.easeOut,
                        });
                    },
                    label: game.i18n.localize("Theatre.Flyin.Scalein"),
                },

                fallin: {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        let textBox = null;
                        if (charSpans[0]) {
                            switch (Theatre.instance.settings.theatreStyle) {
                                case "lightbox":
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                                    if (!textBox)
                                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                                    break;
                                case "clearbox":
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                                    if (!textBox)
                                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                                    break;
                                case "mangabubble":
                                    break;
                                case "textbox":
                                default:
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
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
                                onComplete: function () {
                                    if (standingAnim) standingAnim.call(this, this.targets()[0]);
                                },
                            },
                            opacity: 0,
                            top: -100,
                            ease: Power4.easeOut,
                            onComplete: () => {
                                Logger.debug("completeAll");
                                if (textBox) {
                                    textBox.style["overflow-y"] = "scroll";
                                    textBox.style["overflow-x"] = "hidden";
                                }
                            },
                        });
                    },
                    label: game.i18n.localize("Theatre.Flyin.Fallin"),
                },

                spin: {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        gsap.from(charSpans, {
                            duration: animTime,
                            stagger: {
                                each: speed,
                                onComplete: function () {
                                    if (standingAnim) standingAnim.call(this, this.targets()[0]);
                                },
                            },
                            opacity: 0,
                            rotation: -360,
                            left: 100,
                            ease: Power4.easeOut,
                        });
                    },
                    label: game.i18n.localize("Theatre.Flyin.Spin"),
                },

                spinscale: {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        let textBox = null;
                        if (charSpans[0]) {
                            switch (Theatre.instance.settings.theatreStyle) {
                                case "lightbox":
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                                    if (!textBox)
                                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                                    break;
                                case "clearbox":
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                                    if (!textBox)
                                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                                    break;
                                case "mangabubble":
                                    break;
                                case "textbox":
                                default:
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
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
                                onComplete: function () {
                                    if (standingAnim) standingAnim.call(this, this.targets()[0]);
                                },
                            },
                            opacity: 0,
                            scale: 5,
                            rotation: -360,
                            left: 150,
                            ease: Power4.easeOut,
                            onComplete: () => {
                                Logger.debug("completeAll");
                                if (textBox) {
                                    textBox.style["overflow-y"] = "scroll";
                                    textBox.style["overflow-x"] = "hidden";
                                }
                            },
                        });
                    },
                    label: game.i18n.localize("Theatre.Flyin.SpinScale"),
                },

                outlaw: {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        //let barTop = 0;
                        //let barLeft = 0;
                        let textBox = null;
                        if (charSpans[0]) {
                            switch (Theatre.instance.settings.theatreStyle) {
                                case "lightbox":
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                                    if (!textBox)
                                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                                    break;
                                case "clearbox":
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                                    if (!textBox)
                                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                                    break;
                                case "mangabubble":
                                    break;
                                case "textbox":
                                default:
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
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
                                onComplete: function () {
                                    if (standingAnim) standingAnim.call(this, this.targets()[0]);
                                },
                            },
                            opacity: 0,
                            scale: 6,
                            rotation: -1080,
                            ease: Power4.easeOut,
                            onComplete: () => {
                                Logger.debug("completeAll");
                                if (textBox) {
                                    textBox.style["overflow-y"] = "scroll";
                                    textBox.style["overflow-x"] = "hidden";
                                    // shaking box
                                    //TweenMax.killTweensOf(charSpans[0].parentNode.parentNode);
                                    //charSpans[0].parentNode.parentNode.style.top = `${barTop}px`;
                                    //charSpans[0].parentNode.parentNode.style.left = `${barLeft}px`;
                                }
                            },
                        });
                    },
                    label: game.i18n.localize("Theatre.Flyin.Outlaw"),
                },

                vortex: {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        let textBox = null;
                        if (charSpans[0]) {
                            switch (Theatre.instance.settings.theatreStyle) {
                                case "lightbox":
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-light", 5);
                                    if (!textBox)
                                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                                    break;
                                case "clearbox":
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box-clear", 5);
                                    if (!textBox)
                                        textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                                    break;
                                case "mangabubble":
                                    break;
                                case "textbox":
                                default:
                                    textBox = KHelpers.seekParentClass(charSpans[0], "theatre-text-box", 5);
                                    break;
                            }
                            if (textBox) {
                                textBox.style["overflow-y"] = "visible";
                                textBox.style["overflow-x"] = "visible";
                            }
                        }
                        for (let idx = 0; idx < charSpans.length; ++idx) {
                            TweenMax.from(charSpans[idx], animTime, {
                                delay: idx * speed,
                                opacity: 0,
                                scale: 5,
                                rotation: -720,
                                left: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 500}px`,
                                top: `${(Math.random() < 0.5 ? -1 : 1) * Math.random() * 500}px`,
                                onComplete: function () {
                                    if (standingAnim) standingAnim.call(this, this.targets()[0]);
                                },
                            });
                        }
                        if (textBox) {
                            Logger.debug("vortext all start");
                            TweenMax.from(textBox, 0.1, {
                                delay: speed * charSpans.length + animTime,
                                //opacity: 1,
                                onComplete: function () {
                                    Logger.debug("vortex all complete");
                                    if (this.targets().length) {
                                        this.targets()[0].style["overflow-y"] = "scroll";
                                        this.targets()[0].style["overflow-x"] = "visible";
                                    }
                                },
                            });
                        }
                    },
                    label: game.i18n.localize("Theatre.Flyin.Vortex"),
                },

                assemble: {
                    func: function (charSpans, animTime, speed, standingAnim) {
                        for (let idx = 0; idx < charSpans.length; ++idx) {
                            TweenMax.from(charSpans[idx], animTime, {
                                delay: idx * speed,
                                opacity: 0,
                                scale: 5,
                                rotation: -180,
                                left: `${Math.random() * 500}px`,
                                top: `${Math.random() * 500}px`,
                                onComplete: function () {
                                    if (standingAnim) standingAnim.call(this, this.targets()[0]);
                                },
                            });
                        }
                    },
                    label: game.i18n.localize("Theatre.Flyin.Assemble"),
                },
            };

        if (Theatre.FLYIN_ANIMS[name]) {
            return Theatre.FLYIN_ANIMS[name].func;
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
        let chatMessage = document.getElementById("chat-message");
        const isShowingChat = chatMessage.parentElement.id === "chat-notifications";

        // Give time to sidebar to finish collapsing
        window.setTimeout(() => {
            let sideBar = document.getElementById("sidebar");
            let mainRightColumn = document.getElementById("ui-right");
            let primeBar = document.getElementById("theatre-prime-bar");
            let secondBar = document.getElementById("theatre-second-bar");
            let calculatedWidth = mainRightColumn.offsetWidth + 5;
            if (!collapsed && !isShowingChat) {
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
