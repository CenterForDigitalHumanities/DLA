import { default as UTILS } from '../../deer-utils.js'
import { default as DEER } from '../../deer-config.js'
import DeerView from './view.js'

const template = obj => {
// Full URIs can also be used, but the internal ids are a bit more readable and bookmarkable and stubbable.
    let tmpl = `<div><header>${obj.name}</header>
    <p><span class="badge">${obj.numberOfItems??``}</span> ${obj.description??``}</p>
    <ul>
    ${obj.itemListElement?.reduce((acc, item) => acc + `<li>${item.label}</li>`, ``)}
    </ul>
    </div>`
    return tmpl
}

export default class DLA_Collection extends DeerView {
    static get observedAttributes() { return [`${DEER.PREFIX}-id`,`${DEER.PREFIX}-listening`] }

    constructor() {
        super()
        this.template = template
    }
}

customElements.define(`${DEER.PREFIX}-collection`, DLA_Collection)
