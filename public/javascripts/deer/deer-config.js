const base_rr = "https://store.rerum.io/v1"   // RERUM store
const base_tt = "https://tinypaul.rerum.io/dla"   // Tiny Things  
const namespace = "deer"                        // namespace for this projects custom elements

export default {
    ID: `${namespace}-id`, // attribute, URI for resource to render
    TYPE: `${namespace}-type`, // attribute, JSON-LD @type
    TEMPLATE: `${namespace}-template`, // attribute, enum for custom template
    VIEW: `${namespace}-view`, // basic element
    LAZY: `${namespace}-lazy`, // set to true for slower rendering
    FINAL: `${namespace}-final`, // attribute, set to true when data query is complete
    KEY: `${namespace}-key`, // attribute, key to use for annotation
    LABEL: `${namespace}-title`, // attribute, alternate label for properties
    CONTEXT: `${namespace}-context`, // attribute, JSON-LD @context, scoped
    ATTRIBUTION: `${namespace}-creator`, // attribute, Web Annotation `creator`, scoped
    MOTIVATION: `${namespace}-motivation`, // attribute, Web Annotation `motivation`, scoped
    LIST: `${namespace}-list`, // attribute, property with resource array
    COLLECTION: `${namespace}-collection`, // attribute, name of aggregating collection
    LISTENING: `${namespace}-listening`, // attribute, name of container to watch for clicks
    LINK: `${namespace}-link`, // attribute, location of href#[deer-id] for <a>s
    FORM: "form[type]", // selector, identifies data entry containers
    ITEMTYPE: `${namespace}item-type`, //attribute, specialty forms ('entity' by default)
    SOURCE: `${namespace}source`, // attribute, URI for asserting annotation
    EVIDENCE: "nv-evidence", // attribute, URI for supporting evidence
    INPUTTYPE: "input-type", //attribute, defines whether this is an array list, array set, or object 
    ARRAYDELIMETER: "array-delimeter", //attribute, denotes delimeter to use for array.join()

    INPUTS: ["input", "textarea", "dataset", "select"], // array of selectors, identifies inputs with .value
    CONTAINERS: ["ItemList", "ItemListElement", "List", "Set", "list", "set", "@list", "@set"], // array of supported list and set types the app will dig into for array values
    PRIMITIVES: ["name", "creator", "label"],

    URLS: {
        CREATE: `${base_tt}/create`,
        UPDATE: `${base_tt}/update`,
        OVERWRITE: `${base_tt}/overwrite`,
        QUERY: `${base_tt}/query`,
        SINCE: `${base_rr}/since`
    },

    EVENTS: {
        CREATED: "created",
        EXPANDED: "expanded",
        UPDATED: "updated",
        LOADED: "loaded",
        NEW_VIEW: "view",
        NEW_FORM: "form",
        VIEW_RENDERED: "view-rendered",
        FORM_RENDERED: "form-rendered",
        SELECTED: "selected"
    },

    SUPPRESS: ["__rerum", "@context", "@id"], //properties to ignore
    DELIMETERDEFAULT: ",", // Default delimeter for .split()ing and .join()ing 
    ROBUSTFEEDBACK: true,  // Show warnings along with errors in the web console.  Set to false to only see errors.  

    TEMPLATES: {
        /**
         * Add any custom templates here through import or copy paste.
         * Templates added here will overwrite the defaults.
         * 
         * Each property must be lower-cased and return a template literal
         * or an HTML String.
         */
        collectionCard: obj => {
            if (!obj.hasOwnProperty("numberOfItems")) { return }
            // Full URIs can also be used, but the internal ids are a bit more readable and bookmarkable and stubbable.
            return `<div><header><a href="/collection/${encodeURIComponent(obj.id.split('/').pop(), "UTF-8")}">${obj.name}</a></header>
                <p><span class="badge">${obj.numberOfItems ?? ``}</span> ${obj.description ?? ``}</p>
                </div>`
        }
    },

    version: "1.0.0"
}
