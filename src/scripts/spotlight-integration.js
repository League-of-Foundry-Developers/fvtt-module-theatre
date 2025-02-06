import Logger from "./lib/Logger.js";
import { Theatre } from "./Theatre.js";
import CONSTANTS from "./constants/constants.js";

export function setupSpotlightSearch(INDEX) {
    Logger.debug("Setting up Spotlight Index");

    // Filter for actor entries in the spotlight index
    INDEX.filter((item) => item?.data?.uuid?.startsWith("Actor"))?.forEach((item) => {
        // Handler for adding/removing actor to/from Theatre navigation bar
        const addActorToNavHandler = (event) => {
            const actor = fromUuidSync(item.data.uuid);

            if (Theatre.isActorStaged(actor)) {
                Logger.debug("Action: Remove Actor from Nav Bar", actor.name);
                Theatre.removeFromNavBar(actor);
            } else {
                Logger.debug("Action: Add Actor to Nav Bar", actor.name);
                Theatre.addToNavBar(actor);
            }

            ui.spotlightOmnisearch?.close();
        };

        // Handler for showing/removing actor on/from stage
        const showActorHandler = (event) => {
            const actor = fromUuidSync(item.data.uuid);
            const theaterActorId = CONSTANTS.PREFIX_ACTOR_ID + actor.id;
            const navItem = Theatre.instance.getNavItemById(theaterActorId);

            if (navItem) {
                Logger.debug("Action: Remove Actor from Stage", actor.name);
                Theatre.instance.removeInsertById(theaterActorId);
            } else {
                Logger.debug("Action: Show Actor on Stage", actor.name);
                // Make sure actor is in nav bar before activating
                if (!Theatre.isActorStaged(actor)) {
                    Theatre.addToNavBar(actor);
                }
                Theatre.instance.activateInsertById(theaterActorId);
            }

            ui.spotlightOmnisearch?.close();
        };

        // Define the dynamic label for the actions based on current state
        const getAddToBarLabel = () => {
            try {
                Logger.debug("Action: Add Actor to Nav Bar", item.name);
                const actor = fromUuidSync(item.data.uuid);
                return Theatre.isActorStaged(actor)
                    ? game.i18n.localize("Theatre.Omnisearch.RemoveFromBar")
                    : game.i18n.localize("Theatre.Omnisearch.AddToBar");
            } catch (error) {
                return game.i18n.localize("Theatre.Omnisearch.AddToBar");
            }
        };

        const getShowOnStageLabel = () => {
            try {
                Logger.debug("Action: Show Actor on Stage", item.name);
                const actor = fromUuidSync(item.data.uuid);
                const theaterActorId = CONSTANTS.PREFIX_ACTOR_ID + actor.id;
                const navItem = Theatre.instance.getNavItemById(theaterActorId);
                return navItem
                    ? game.i18n.localize("Theatre.Omnisearch.RemoveFromStage")
                    : game.i18n.localize("Theatre.Omnisearch.ShowOnStage");
            } catch (error) {
                return game.i18n.localize("Theatre.Omnisearch.ShowOnStage");
            }
        };

        // Add the actions to the spotlight item
        item.actions.push(
            {
                name: getAddToBarLabel(),
                icon: `<i class="fa-solid fa-plus"></i>`,
                callback: addActorToNavHandler,
            },
            {
                name: getShowOnStageLabel(),
                icon: `<i class="fa-solid fa-masks-theater"></i>`,
                callback: showActorHandler,
            },
        );
    });
}
