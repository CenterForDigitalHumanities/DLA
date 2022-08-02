import { default as UTILS } from '../../deer-utils.js'
import { default as DEER } from '../../deer-config.js'
import DeerView from './view.js'

const template = obj => {
// Full URIs can also be used, but the internal ids are a bit more readable and bookmarkable and stubbable.
    let tmpl = `<div><header><a href="/collection/${encodeURIComponent(obj.id.split('/').pop(),"UTF-8")}">${obj.name}</a></header>
    <p><span class="badge">${obj.numberOfItems??``}</span> ${obj.description??``}</p>
    </div>`
    return tmpl
}

export default class CollectionCard extends DeerView {
    static get observedAttributes() { return [`${DEER.PREFIX}-id`,`${DEER.PREFIX}-listening`] }

    constructor() {
        super()
        this.template = template
    }
}

customElements.define(`${DEER.PREFIX}-collection-card`, CollectionCard)
