import { default as UTILS } from '../../deer-utils.js'
import { default as DEER } from '../../deer-config.js'
import DeerView from './view.js'

let progress

const template = obj => {
// Full URIs can also be used, but the internal ids are a bit more readable and bookmarkable and stubbable.
    return `<div><header>${obj.name}</header>
        <span class="badge">${obj.numberOfItems??``}</span> ${obj.description??``}
        <div class="container reverse">
            <div id="Records" class="grow wrap">list loading</div>
            <div class="sidebar">
                <h3>Refine Results <button role="button" id="queryReset">clear all</button></h3>
                <progress value="${obj.numberOfItems??0}" max="${obj.numberOfItems??10}">${obj.numberOfItems??``} of ${obj.numberOfItems??``}</progress>
                <input id="query" type="text" placeholder="type to filter">
                <section id="facetFilter"></section>
            </div>
        </div>
    </div>`
}

export default class DLA_Collection extends DeerView {
    static get observedAttributes() { return [`${DEER.PREFIX}-id`,`${DEER.PREFIX}-listening`] }

    constructor() {
        super()
        this.template = template
    }

    get records() {return document.querySelectorAll(".record")}

    connectedCallback() {
        super.connectedCallback()
        UTILS.worker.addEventListener('message', e => {
            if (e.data.id !== this.getAttribute(`${DEER.PREFIX}-${DEER.ID}`)) { return }
            switch (e.data.action) {
                case "update":
                this.innerHTML = this.template(e.data.payload)
                this.#loadRecords()
                .then(dataRecords => this.#renderRecords(dataRecords))
                break
                case "reload":
                    this.Entity = e.data.payload 
                default:
            }
        })        
    }

    async #loadRecords(pagination = [0,]) {
        const data = await this.#fetchList(this.getAttribute(`${DEER.PREFIX}-id`)).catch(err => flashMessage(err)) ?? {}
        return (data[this.getAttribute(`${DEER.PREFIX}-list`) ?? "itemListElement"] ?? []).slice(pagination[0], pagination[1])
    }

    async #renderRecords(dataRecords) {

        const FIELDS = [
            "Alternative Title", "Date Issued", "Is Part Of",
            "Date Issued", "Author(s) or Contributor(s)"
            // script, decoration, physical description
        ]
        const FILTERS = {
            "Type of Resource": "resource-type", Genre: "genre", Language: "language",
            Script: "script", "Reading Difficulty": "readability", Topic: "topic",
            Region: "region", "Time Period": "period", Repository: "repository"
        }
        const SEARCH = [
            "Title", "Physical Description", "Note(s)", "Region",
            "Topic", "Subject", "Repository", "Call Number", "Is Part Of"
        ]
    
        let list = dataRecords.reduce((a, b) => a += `
        <x-deer-view class="record" deer-id="${b['@id']}">
            <h4><a href="./record.html?id=${b['@id']}">${b.label}</a></h4>
            <div class="row">
                <dl>
                </dl>
            </div>
        </x-deer-view>`, ``)
    
        document.getElementById('Records').innerHTML = list
    
        let facets = {}
        let loading = []
        Array.from(this.records).forEach(r => {
            const url = r.getAttribute("data-id")
            let dl = ``
            // loading.push(fetch(url)
            //     .then(status => { if (!status.ok) { throw Error(status) } return status })
            //     .then(response => response.json())
            //     .then(dataRecord => {
            //         let metadataMap = new Map()
            //         dataRecord.metadata?.forEach(dat => {
            //             metadataMap.set(dat.label, Array.isArray(dat.value) ? dat.value.join(", ") : dat.value)
            //             if (FIELDS.includes(dat.label)) {
            //                 dl += `<dt>${dat.label}</dt><dd>${metadataMap.get(dat.label)}</dd>`
            //             }
            //             if (FILTERS[dat.label]) {
            //                 r.setAttribute("data-" + FILTERS[dat.label], metadataMap.get(dat.label))
            //                 let values = (Array.isArray(dat.value)) ? dat.value : [dat.value]
            //                 if (!facets[FILTERS[dat.label]]) {
            //                     facets[FILTERS[dat.label]] = new Set()
            //                 }
            //                 for (const v of values) {
            //                     facets[FILTERS[dat.label]] = facets[FILTERS[dat.label]].add(v.replace(/\?/g, ""))
            //                 }
            //             }
            //         })
                    r.setAttribute("data-query", r.textContent.trim())
            //         r.setAttribute("data-query", SEARCH.reduce((a, b) => a += (metadataMap.has(b) ? metadataMap.get(b) : "*") + " ", ""))
            //         r.querySelector("dl").innerHTML = dl
            //         r.querySelector("img").src = dataRecord.sequences?.[0].canvases[Math.floor((dataRecord.sequences[0].canvases.length - 1) / 2)].thumbnail['@id'] ?? "https://via.placeholder.com/150"
            //     })
            //     .catch(err => { throw Error(err) })
            // )
        })
        query.addEventListener("input", this.#filterQuery.bind(this))
        try {
            await Promise.all(loading)
            return this.#populateSidebar(facets, FILTERS)
        } catch (err_1) {
            return console.error(err_1)
        }
    }
    
    #filterQuery(event) {
        const queryString = event.target.value
        Array.from(this.records).forEach(r => new RegExp(queryString, "i").test(r.getAttribute("data-query")) ? r.classList.remove("hide-query") : r.classList.add("hide-query"))
        //Records.querySelectorAll(".record:not([data-query*='"+queryString+"'])")
        this.#updateCount()
    }
    
    #filterFacets(event) {
        const clicked = event.target
        clicked.classList.toggle("clicked")
        const action = clicked.classList.contains("clicked") ? "add" : "remove"
        const k = clicked.getAttribute("data-facet")
        const v = clicked.textContent
        Array.from(this.records).forEach(r => { if (!new RegExp(v, "i").test(r.getAttribute("data-" + k))) r.classList[action]("hide-facet") })
        this.#updateCount()
    }
    
    #updateCount() {
        let hiddenCount = document.querySelectorAll(".record[class*='hide-']").length
        let countBar = query.previousElementSibling
        let countBarValue = this.records.length - hiddenCount
        countBar.max = this.records.length
        countBar.textContent = countBarValue + " of " + countBar.max
        clearInterval(progress)
        const notzero = countBarValue > countBar.value ? 1 : -1
        let step = parseInt((countBarValue - countBar.value) / 25) || notzero
        progress = setInterval(() => {
            countBar.value += step
            if (Math.abs(countBar.value - countBarValue) < 2) {
                countBar.value = countBarValue
                clearInterval(progress)
            }
        }, 10)
        let facetsElements = document.querySelectorAll("facet")
        Array.from(facetsElements).forEach(f => {
            const k = f.getAttribute("data-facet")
            const v = f.textContent
            let count = document.querySelectorAll(".record:not([class*='hide-'])[data-" + k + "*='" + v + "']").length
            f.setAttribute("data-count", count)
            if (count === 0) {
                f.classList.add("hide-sidebar")
            } else {
                f.classList.remove("hide-sidebar")
            }
        })
    }
    
    #populateSidebar(facets, FILTERS) {
        let side = `<ul>`
        for (const f in FILTERS) {
            if (!facets[FILTERS[f]]) continue
            side += `<li>${f}</li>`
            side += Array.from(facets[FILTERS[f]]).reduce((a, b) => a += `<facet data-facet="${FILTERS[f]}" data-label="${b}">${b}</facet>`, ``)
        }
        side += `</ul>`
        facetFilter.innerHTML = side
        let facetsElements = document.querySelectorAll("[data-facet]")
        Array.from(facetsElements).forEach(el => el.addEventListener("click", filterFacets.bind(this)))
        this.#updateCount()
        this.#loadQuery()
    }
    
    #loadQuery() {
        const params = new URLSearchParams(location.search)
        params.forEach((v,k)=>{
            document.querySelectorAll(`[data-facet="${k}"][data-label="${v}"]`)
             .forEach(el=>el.click())
        })
        const queryString = params.get("q")
        if(queryString){
            query.value = queryString
            query.dispatchEvent(new Event('input'))
        }
    }
    
    async #fetchList(url) {
        try {
            const status = await fetch(url)
            if (!status.ok) { throw Error(status)} 
            const response = status
            return await response.json()
        } catch (err) {
            throw Error(err)
        }
    }
    
    #flashMessage(err) {
        alert(err.message)
    }
    
}


customElements.define(`${DEER.PREFIX}-collection`, DLA_Collection)
