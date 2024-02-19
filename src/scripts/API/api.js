import KHelpers from "../KHelpers.js";
import { Theatre } from "../Theatre.js";
import CONSTANTS from "../constants/constants.js";
import { TheatreHelpers } from "../theatre-helpers.js";

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
  textStandingAnimation(name) {
    return TheatreHelpers.textStandingAnimation(name);
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
  textFlyinAnimation(name) {
    return TheatreHelpers.textFlyinAnimation(name);
  },
};

export default API;
