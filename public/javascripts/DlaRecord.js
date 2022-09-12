import { DEER, UTILS } from 'https://deer.rerum.io/releases/rc-1.0/js/deer-utils.js'
import {default as configObj} from 'deer-config.js'
DEER.config(configObj)
import DeerView from 'https://deer.rerum.io/releases/rc-1.0/components/view/view.js'

let progress

// Full URIs can also be used, but the internal ids are a bit more readable and bookmarkable and stubbable.
const template = obj => `
    <h4><a href="./record.html?id=${obj.id}">${UTILS.getLabel(obj)}</a></h4>
        <div class="row">
            <dl>
            </dl>
        </div>`

export default class DlaRecord extends DeerView {
    static get observedAttributes() { return [`${DEER.PREFIX}-id`,`${DEER.PREFIX}-listening`] }

    constructor() {
        super()
        this.template = template
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue)
        if (name === DEER.FINAL) { this.#renderRecord.bind(this) }
    }

    async #renderRecord() {
        const dataRecord = this.Entity?.assertions
        if (!dataRecord) { return }

        const FIELDS = [
            "Alternative Title", "Date Issued", "Is Part Of",
            "Date Issued", "Author(s) or Contributor(s)"
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
        const metadata = dataRecord.metadata ?? Object.entries(dataRecord)
        metadata.forEach(dat => {
            const {key,val} = simplifyDataValue(dat)
            metadataMap.set(key,val)
            dl += addIncludedField(FIELDS,key,val)
            Object.assign(facets,registerFiltersOnFacets(this,FILTERS,key,val))
            this.setAttribute("data-query", dataQueryString(SEARCH,metadataMap))
            this.querySelector("dl").innerHTML = dl
            this.querySelector("img").src = getThumbnailSrc(manifest)
        })
        .catch(err => { throw Error(err) })

        function simplifyDataValue(datum){
            let key, val
            if(Array.isArray(datum)) {
                key = datum[0]
                val = datum[1]
            } else {
                key = datum.label
                val = Array.isArray(datum.value) ? datum.value.join(", ") : datum.value
            }
            return {key,val}
        }

        function addIncludedField(fields,key,val){
            if (fields.includes(key)) {
                return `<dt>${key}</dt><dd>${val}</dd>`
            }
            return ``
        }

        function registerFiltersOnFacets(elem,filters,key,val){
            if (filters.hasOwnProperty(key)) {
                elem.setAttribute(`data-${filters[key]}`, val)
                return {[filters[key]]:val.replace(/\?/g, "")}
            }
            return {}
        }

        function dataQueryString(search,metaMap){
            return search.reduce((a, b) => a += (metaMap.has(b) ? metaMap.get(b) : "*") + " ", "")
        }

        function getThumbnailSrc(manifest){
            return manifest.sequences?.[0].canvases[Math.floor((manifest.sequences[0].canvases.length - 1) / 2)].thumbnail['@id'] ?? "https://via.placeholder.com/150"
        }
    }
}


customElements.define(`dla-record`, DlaRecord)
