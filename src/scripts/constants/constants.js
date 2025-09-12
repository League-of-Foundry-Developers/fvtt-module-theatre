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
            reqresync: "reqresync",
        },
    },
    SOCKET: "module.theatre",
    NARRATOR: "Narrator",
    ICONLIB: "modules/theatre/assets/graphics/emotes",
    DEFAULT_PORTRAIT: "icons/mystery-man.png",
    PREFIX_ACTOR_ID: "theatre-",
    MAX_NUM_ACTORS_ON_CONTROL_GROUP: 5,
};

CONSTANTS.PATH = `modules/${CONSTANTS.MODULE_ID}/`;

export default CONSTANTS;
