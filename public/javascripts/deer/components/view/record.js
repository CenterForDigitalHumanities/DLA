import { default as UTILS } from '../../deer-utils.js'
import { default as DEER } from '../../deer-config.js'
import DeerView from './view.js'

let progress

// Full URIs can also be used, but the internal ids are a bit more readable and bookmarkable and stubbable.
const template = obj => `
    <h4><a href="./record.html?id=${obj.id}">${obj.label ?? obj.id}</a></h4>
        <div class="row">
            <dl>
            </dl>
        </div>`

export default class DLA_Record extends DeerView {
    static get observedAttributes() { return [`${DEER.PREFIX}-id`,`${DEER.PREFIX}-listening`] }

    constructor() {
        super()
        this.template = template
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue)
        switch (name) {
            case `${DEER.PREFIX}-final`: this.#renderRecord.bind(this)
        }
    }

    async #renderRecord() {
        const dataRecord = this.Entity?.assertions
        if (!dataRecord) { return }

        const FIELDS = [
            "Alternative Title", "Date Issued", "Is Part Of",
            "Date Issued", "Author(s) or Contributor(s)"
            // script, decoration, physical description
        ]
        const FILTERS = {
            "Type of Resource": ["additionalType","type","@type"], Genre: "genre", Language: "language",
            Script: "script", "Reading Difficulty": "readability", Topic: "topic",
            Region: "region", "Time Period": "period", Repository: "repository"
        }
        const SEARCH = [
            "Title", "Physical Description", "Note(s)", "Region",
            "Topic", "Subject", "Repository", "Call Number", "Is Part Of"
        ]
           
        let facets = {}
        let dl = ``
        const metadataMap = new Map()
        (dataRecord.metadata ?? Object.entries(dataRecord))?.forEach(dat => {
            let key, val
            if(Array.isArray(dat)) {
                key = dat[0]
                val = dat[1]
            } else {
                key = dat.label
                val = Array.isArray(dat.value) ? dat.value.join(", ") : dat.value
            }
            metadataMap.set(key,val)
            if (FIELDS.includes(key)) {
                dl += `<dt>${key}</dt><dd>${metadataMap.get(key)}</dd>`
            }
            if (FILTERS[key]) {
                this.setAttribute("data-" + FILTERS[key], metadataMap.get(key))
                let values = (Array.isArray(val)) ? val : [dat.value]
                if (!facets[FILTERS[key]]) {
                    facets[FILTERS[key]] = new Set()
                }
                for (const v of values) {
                    facets[FILTERS[key]] = facets[FILTERS[key]].add(v.replace(/\?/g, ""))
                }
            }
            this.setAttribute("data-query", SEARCH.reduce((a, b) => a += (metadataMap.has(b) ? metadataMap.get(b) : "*") + " ", ""))
            this.querySelector("dl").innerHTML = dl
            this.querySelector("img").src = dataRecord.sequences?.[0].canvases[Math.floor((dataRecord.sequences[0].canvases.length - 1) / 2)].thumbnail['@id'] ?? "https://via.placeholder.com/150"
        })
        .catch(err => { throw Error(err) })
    }
}


customElements.define(`${DEER.PREFIX}-record`, DLA_Record)
