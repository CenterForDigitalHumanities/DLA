import { DEER, UTILS } from '../../deer-utils.js'
import NoticeBoard from '../../NoticeBoard.js'
import DlaPoemDetail from './poem.js'
import DeerView from './view.js'

let progress

// Full URIs can also be used, but the internal ids are a bit more readable and bookmarkable and stubbable.
const recordCardTemplate = obj => `
    <h4><a href="./record.html?id=${obj.id}">${UTILS.getLabel(obj)}</a></h4>
        <div class="row">
            <dl>
            </dl>
        </div>`

export default class DlaRecordCard extends DeerView {
    static get observedAttributes() { return [DEER.ID,DEER.LISTENING] }

    constructor() {
        super()
        this.template = recordCardTemplate
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue)
        switch (name) {
            case DEER.FINAL: this.#renderRecord.bind(this)
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

/**
 * A simple generic view for a piece of data with metadata.
 * The goal is to consider the most generic things one would expect to be in all data (like 'label')
 * The view should be simple, like something that comes back from a search through a bucket of information.
 * Generic fields to consider
 * type/@type
 * id/@id
 * label/name
 * description/summary
 * collection it belongs to (targetCollection)
 * thumbnail
 * existing transcription (tpenProject)
 * 
 * @param obj - The piece of data with as much metadata as could be found
 */ 
const recordTemplate = obj => {
    let list = ``
    let t = obj.type ?? obj["@type"] ?? "No Type"
    const at = obj.additionalType ?? ""
    if(t && at) {
        t += `, specifically a ${at.split("/").pop()}`
    }
    const projects = obj.tpenProject ?? []
    let projectList
    if(projects.length){
        projectList = projects.map(pid => {
            const link = `<a src="http://t-pen.org/TPEN/manifest/${pid.value}" target="_blank"> ${pid.value} </a>`
            return link
        })
        projectList = projectList.join(", ")
    }
    list += `<dt>Record Type: </dt><dd>${t}</dd>`
    list += obj.description ? 
        `<dt>Record Description: </dt><dd>${UTILS.getValue(obj.description, [], "string")}</dd>` : ""
    list += (obj.depiction || obj.image) ?
        `<img title="${t}" src="${obj.depiction ? UTILS.getValue(obj.depiction) : UTILS.getValue(obj.image)}"/>` : ""
    list += projects.length ?
        `<dt>T-PEN Manifest(s): </dt><dd> ${projectList} </dd>` : ""
    list += obj.targetCollection ?
        `<dt>Find it in Collection: </dt><dd> ${UTILS.getValue(obj.targetCollection, [], "string")} </dd>` : ""
    
    return `
       <header>
          <h4><a href="/record/${encodeURIComponent(obj.id.split('/').pop(), "UTF-8")}">${UTILS.getLabel(obj)}</a></h4>
       </header>
       <dl>
          ${list}
       <dl>
    `
}



export class DlaRecord extends DeerView {
    constructor() {
        super()
        this.template = recordTemplate
    }
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue)
        switch (name) {
            case DEER.ID: 
                NoticeBoard.subscribe(this.getAttribute(DEER.ID), ev=>{
                    if(ev.detail.type === "final") {
                        // some logic to discover what it is.
                        // match poem => DlaPoemDetail
                        // match letter => DlaLetterDetail
                        // match record => DlaRecordDetail
                    }
                })
        }
    }
}

customElements.define(`dla-record-card`, DlaRecordCard)
customElements.define(`dla-record`, DlaRecord)
