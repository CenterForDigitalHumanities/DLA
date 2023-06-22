import { UTILS, DEER } from '../../deer-utils.js'
import NoticeBoard from '../../NoticeBoard.js'

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
    static get observedAttributes() { return [DEER.ID, DEER.FINAL, DEER.LAZY, DEER.KEY, DEER.LIST, DEER.LINK, DEER.LISTENING]; }
    #final = false

    constructor() {
        super()
        this.template = DEER.TEMPLATES[this.getAttribute(DEER.TEMPLATE)] ?? template
    }

    #updateEntity(e) {
        const msg = e.detail
        switch (msg.action) {
            case "reload":
                this.Entity = Object.assign(this.Entity ?? {},msg.payload)
                this.innerHTML = this.template(msg.payload?.assertions) ?? this.innerHTML
                break
            case "update":
                this.Entity = Object.assign(this.Entity ?? {},msg.payload)
                this.innerHTML = this.template(msg.payload) ?? this.innerHTML
                break
            case "error":
                this.#handleErrors(msg.payload)
                break
            case "complete":
                this.$final = true
                NoticeBoard.unsubscribe(UTILS.normalizeEventType(this.getAttribute(DEER.ID)), this.#updateEntity.bind(this))
            default:
        }
    }

    connectedCallback() {
        this.innerHTML = this.innerHTML?.trim() ?? `<small>&copy;2022 Research Computing Group</small>`
    }
    set $final(bool) {
        this.setAttribute(DEER.FINAL, bool)
        this.#final = Boolean(bool)
    }

    get $final() { return this.#final }

    disconnectedCallback() { }
    adoptedCallback() { }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case DEER.ID:
            case DEER.KEY:
            case DEER.LINK:
            case DEER.LIST:
                const id = UTILS.normalizeEventType(this.getAttribute(DEER.ID))
                if (id === null || this.getAttribute(DEER.COLLECTION)) { return }
                NoticeBoard.subscribe(UTILS.normalizeEventType(id), this.#updateEntity.bind(this))
                NoticeBoard.publish(DEER.EVENTS.NEW_VIEW, {
                    id,
                    isLazy: this.getAttribute(DEER.LAZY)
                })
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
                this.innerHTML = `<small>ID ${this.getAttribute(DEER.ID)} could not be loaded.</small>`
                break
            case 500:
                this.innerHTML = `<small>A server error occurred while loading ${this.getAttribute(DEER.ID)}.</small>`
                break
            default:
                this.innerHTML = `<small>An unknown error occurred while loading ${this.getAttribute(DEER.ID)}.</small>`
        }
        console.error(err)
    }
}

customElements.define(DEER.VIEW, DeerView)
