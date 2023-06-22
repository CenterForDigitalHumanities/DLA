import { DEER, UTILS } from '../../deer-utils.js'
import DeerView from './view.js'

const template = obj => {
    let tmpl = `<h2>${UTILS.getLabel(obj)}</h2>`
    let list = ``

    for (let key in obj) {
        if (DEER.SUPPRESS.indexOf(key) > -1) { continue }
        let label = key
        let value = UTILS.getValue(obj[key], key)
        if (value.image?.length > 0) {
            list += (label === "depiction") ? `<img title="${label}" src="${value.image ?? value}" ${DEER.SOURCE}="${UTILS.getValue(obj[key].source, "citationSource")}">` : `<dt ${DEER.SOURCE}="${UTILS.getValue(obj[key].source, "citationSource")}">${label}</dt><dd>${value.image ?? value}</dd>`
            continue
        }
        // is it object/array?
        list += `<dt>${label}</dt>`
        if (Array.isArray(value)) {
            value.filter(undefinedCheck=>undefinedCheck!==undefined).forEach((v, index) => list += (v["@id"]) ? `<dd><a href="#${v["@id"]}">${UTILS.getLabel(v, (v.type ?? v['@type'] ?? label + '' + index))}</a></dd>` : `<dd ${DEER.SOURCE}="${UTILS.getValue(v.source, "citationSource")}">${UTILS.getValue(v)}</dd>`)
        } else {
            // a single, probably
            // TODO: export buildValueObject() from UTILS for use here
            if (typeof value === "string") {
                value = {
                    value: value,
                    source: {
                        citationSource: obj['@id'] || obj.id || "",
                        citationNote: "Primitive object from DEER",
                        comment: "Learn about the assembler for this object at https://github.com/CenterForDigitalHumanities/deer"
                    }
                }
            }
            let v = UTILS.getValue(value)
            if (typeof v === "object") { v = UTILS.getLabel(v) }
            if (v === "[ unlabeled ]") { v = v['@id'] || v.id || "[ complex value unknown ]" }
            list += value?.['@id'] ? `<dd ${DEER.SOURCE}="${UTILS.getValue(value.source, "citationSource")}"><a href="${options.link || ""}#${value['@id']}">${v}</a></dd>` : `<dd ${DEER.SOURCE}="${UTILS.getValue(value, "citationSource")}">${v}</dd>`
        }
    }
    if (list.includes("</dd>")) { tmpl+=`<dl>${list}</dl>` }
    return tmpl
}

export default class ViewEntity extends DeerView {
    static get observedAttributes() { return [DEER.ID,DEER.LISTENING] }

    constructor() {
        super()
        this.template = template
    }
}

customElements.define(`deer-entity`, ViewEntity)


const collections = new Set([
    {
        id: "https://store.rerum.io/v1/id/61ae693050c86821e60b5d13",
        name: "Correspondence between Paul Laurence Dunbar and Alice Moore Dunbar",
        itemsKey: "itemListElement"
    },
    {
        id: "https://store.rerum.io/v1/id/6353016612678843589262b0",
        name: "DLA Poems Collection",
        itemsKey: "itemListElement"
    },
    {
        id: "https://store.rerum.io/v1/id/62506f071d974d1311abd651",
        name: "Dunbar at Ohio History Connection",
        itemsKey: "items"
    }
])
export class CollectionLabel extends DeerView {
    static get observedAttributes() { return [DEER.ID,DEER.LISTENING] }

    constructor() {
        super()
        this.template = (obj={}) => `<a href="../${[...collections].find(r=>r.name === obj.targetCollection)?.id.split('/').pop()}">${UTILS.getValue(obj.targetCollection)}</a>`
    }

    connectedCallback() {
        this.innerHTML = this.template
    }
}

customElements.define(`deer-collection-label`, CollectionLabel)

export class Label extends DeerView {
    static get observedAttributes() { return [DEER.ID,DEER.LISTENING] }

    constructor() {
        super()
        this.template = obj => `${UTILS.getLabel(obj)}`
        this.classList.add('text-light')
    }

    connectedCallback() {
        this.innerHTML = this.template
    }
}

customElements.define(`deer-label`, Label)
