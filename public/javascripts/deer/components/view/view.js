import { UTILS, DEER } from '../../deer-utils.js'

const template = (obj, options = {}) => {
    let indent = options.indent ?? 4
    let replacer = (k, v) => {
        if (DEER.SUPPRESS.indexOf(k) !== -1) return
        return v
    }
    try {
        return `<pre>${JSON.stringify(obj, replacer, indent)}</pre>`
    } catch (err) {
        return null
    }
}

export default class DeerView extends HTMLElement {
    static get observedAttributes() { return [`${DEER.PREFIX}-id`, `${DEER.PREFIX}-final`, `${DEER.PREFIX}-lazy`, `${DEER.PREFIX}-key`, `${DEER.PREFIX}-list`, `${DEER.PREFIX}-link`, `${DEER.PREFIX}-listening`]; }
    #final = false

    constructor() {
        super()
        this.template = DEER.TEMPLATES[this.getAttribute(`${DEER.PREFIX}-template`)] ?? template
    }

    connectedCallback() {
        this.innerHTML = this.innerHTML?.trim() ?? `<small>&copy;2022 Research Computing Group</small>`
        UTILS.worker.addEventListener('message', e => {
            if (e.data.id !== this.getAttribute(`${DEER.PREFIX}-${DEER.ID}`)) { return }
            switch (e.data.action) {
                case "reload":
                    this.Entity = e.data.payload 
                case "update":
                    this.innerHTML = this.template(e.data.payload) ?? this.innerHTML
                    break
                case "error":
                    this.#handleErrors(e.data.payload)
                    break
                case "complete":
                    this.$final = true
                default:
            }
        })
    }
    set $final(bool) {
        this.setAttribute(`${DEER.PREFIX}-final`, bool)
        this.#final = Boolean(bool)
    }

    get $final() { return this.#final }

    disconnectedCallback() { }
    adoptedCallback() { }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name.split('-')[1]) {
            case DEER.ID:
            case DEER.KEY:
            case DEER.LINK:
            case DEER.LIST:
                let id = this.getAttribute(`${DEER.PREFIX}-${DEER.ID}`)
                if (id === null || this.getAttribute(DEER.COLLECTION)) { return }
                UTILS.postView(id, this.getAttribute(`${DEER.PREFIX}-lazy`))
                break
            case DEER.LISTENING:
                let listensTo = this.getAttribute(DEER.LISTENING)
                if (listensTo) {
                    this.addEventListener(DEER.EVENTS.CLICKED, e => {
                        let loadId = e.detail["@id"]
                        if (loadId === listensTo) { this.setAttribute("deer-id", loadId) }
                    })
                }
        }
    }

    #handleErrors(err) {
        switch (err.status) {
            case 404:
                this.innerHTML = `<small>ID ${this.getAttribute(`${DEER.PREFIX}-${DEER.ID}`)} could not be loaded.</small>`
                break
            case 500:
                this.innerHTML = `<small>A server error occurred while loading ${this.getAttribute(`${DEER.PREFIX}-${DEER.ID}`)}.</small>`
                break
            default:
                this.innerHTML = `<small>An unknown error occurred while loading ${this.getAttribute(`${DEER.PREFIX}-${DEER.ID}`)}.</small>`
        }
        console.error(err)
    }
}

customElements.define(`${DEER.PREFIX}-${DEER.VIEW}`, DeerView)
