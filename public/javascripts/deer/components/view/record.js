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
    static get observedAttributes() { return [DEER.ID, DEER.LISTENING] }

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
            "Type of Resource": ["additionalType", "type", "@type"], Genre: "genre", Language: "language",
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
                if (Array.isArray(dat)) {
                    key = dat[0]
                    val = dat[1]
                } else {
                    key = dat.label
                    val = Array.isArray(dat.value) ? dat.value.join(", ") : dat.value
                }
                metadataMap.set(key, val)
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
const recordTemplate = obj => `
    <h4>DLA Record</h4>
`
import { isPoem } from './poem.js'

export class DlaRecord extends DeerView {
    constructor() {
        super()
        this.template = recordTemplate
    }
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue)
        switch (name) {
            switch (name) {
                case DEER.FINAL: this.#renderGenericRecord.bind(this)
            }
        }
    }
    #replaceElement(tagName) {
        const swap = document.createElement(tagName)
        swap.Entity = this.Entity
        this.getAttributeNames().forEach(attr => swap.setAttribute(attr, this.getAttribute(attr)))
        this.replaceWith(swap)
        this.remove()
    }
    #poemSwap(ev) {
        if (["complete"].includes(ev.detail.action)) {
            if (isPoem(this)) {
                NoticeBoard.unsubscribe(this.getAttribute(DEER.ID), this.#poemSwap.bind(this))
                this.#replaceElement("dla-poem-detail")
            }
        }
    }
    async #renderGenericRecord() {
        const dataRecord = this.Entity?.assertions
        if (!dataRecord) { return }
        let type = dataRecord.type ?? dataRecord["@type"] ?? "No Type"
        const additionalType = dataRecord.additionalType ?? ""
        if(type && additionalType) {
            type += `, specifically a ${additionalType.split("/").pop()}`
        }
        const projects = dataRecord.tpenProject ?? []
        let projectList
        let thumbnailList = []
        if(projects.length){
            // Right now this is only of length 0 or 1, but that could change in the future
            for await (const pid of projects){
                const link = `<a src="http://t-pen.org/TPEN/manifest/${pid.value}" target="_blank"> ${pid.value} </a>`
                const projData = await fetch(`http://t-pen.org/TPEN/manifest/${pid.value}`).then(resp => resp.json()).catch(err => {return ""})
                let thumbnail = ""
                if(projData){
                    const canvas = projData.sequences[0].canvases[0]
                    const image = canvas.images ? canvas.images[0].resource["@id"] : ""
                    if(image){
                        thumbnail = `<img src="${image}" />`
                    }
                }
                if(thumbnail){
                    projectList.push(thumbnail)
                }
                else{
                    projectList.push(link)
                }
            }
            projectList = projectList.join(", ")
        }    
        let targetCollection = UTILS.getValue(dataRecord.targetCollection, [], "string") ?? ""
        let targetCollectionLink = ""
        let linkOut = "record"
        if(targetCollection.indexOf("Poems Collection") > -1){
            targetCollectionLink = "/collection/615b724650c86821e60b11fa"
            linkOut = "poem"
        }
        else if(targetCollection.indexOf("Correspondence") > -1){
            targetCollectionLink = "/collection/61ae693050c86821e60b5d13"
            linkOut = "letter"
        }
        let generic_template = `
            <header>
              <h4><a href="/${linkOut}/${encodeURIComponent(obj.id.split('/').pop(), "UTF-8")}">${UTILS.getLabel(obj)}</a></h4>
           </header>
           <dl>
        `
        generic_template += `<dt>Record Type: </dt><dd>${type}</dd>`
        generic_template += dataRecord.description ? 
            `<dt>Record Description: </dt><dd>${UTILS.getValue(dataRecord.description, [], "string")}</dd>` : ""
        generic_template += projects.length ?
            `<dt>T-PEN Manifest(s): </dt><dd> ${projectList} </dd>` : ""
        generic_template += dataRecord.targetCollection ?
            `<dt>Find it in Collection: </dt><dd><a target="_blank" href="${targetCollectionLink}">${targetCollection}</a></dd>` : ""
        generic_template += `</dl>`

        this.querySelector("h4").replaceWith = generic_template
        
        return generic_template
    }
}

customElements.define(`dla-record-card`, DlaRecordCard)
customElements.define(`dla-record`, DlaRecord)
