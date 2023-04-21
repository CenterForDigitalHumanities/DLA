import { DEER } from '../../deer-utils.js'
import NoticeBoard from '../../NoticeBoard.js'
import DeerView from './view.js'

let progress

const template = (obj,options={}) => {
    if(!obj.hasOwnProperty("numberOfItems")) { return }
// Full URIs can also be used, but the internal ids are a bit more readable and bookmarkable and stubbable.
    return `
    <style scoped>
        facet {
            display: block;
            position: relative;
            cursor: pointer;
            transition: background-color .2s;
            border-left: var(--accent) solid thin;
            padding-left: calc(var(--grid-gutter)/4);
            font-size: smaller;
        }

        facet:hover {
            background-color: var(--accent);
        }

        facet.clicked {
            background-color: var(--site-light);
            color: var(--font-color);
        }

        facet::after {
            content: "(" attr(data-count)")";
            position: absolute;
            right: 0;
            border-radius: 15%;
            background-color: rgba(255, 255, 255, .5);
        }

        progress::after {
            content: attr(value)" of " attr(max);
            font-size: .6em;
            color: #666666;
            position: relative;
            text-align: right;
            display: block;
            bottom: 1em;
        }

        .thumbnail {
            object-fit: cover;
            object-position: top center;
            padding: calc(var(--grid-gutter) / 2);
            max-height: 10em;
            min-width: 5em;
        }

        .record[class*='hide-'],
        facet[class*='hide-'] {
            display: none !important;
        }

        dd {
            word-break: break-word;
        }

        #Records {
            overflow: auto;
            height: calc(100vh - 60px);
        }
    </style>
    <div class="row">
            <div id="Records" class="col-9 order-last">
            ${(obj[options.list ?? "itemListElement"] ?? [])?.reduce((a, b) => a += `
            <dla-record-card class="record card" deer-id="${b['@id'].replace(/^https?:/,'https:')}">
            <h4><a href="./record/${(b.id ?? b['@id']).split("/").pop()}">${b.label ?? b['@id']}</a></h4>
            </dla-record-card>`, ``)}
            </div>
            <div class="col-3 bg-bright">
                <h5 title="${obj.description??``}">${obj.name}</h5>
                <hr />
                <p>Refine Results <button role="button" type="reset" class="btn btn-light btn-sm">clear all</button></p>
                <progress value="${obj.numberOfItems??0}" max="${obj.numberOfItems??10}">${obj.numberOfItems??``} of ${obj.numberOfItems??``}</progress>
                <input id="query" type="text" placeholder="type to filter">
                <section id="facetFilter"></section>
            </div>
    </div>`
}

export default class DLA_Collection extends DeerView {
    static get observedAttributes() { return [DEER.ID,DEER.LISTENING] }

    constructor() {
        super()
        this.template = template
        this.$final = false
    }

    get records() {return document.querySelectorAll(".record")}

    connectedCallback() {
        super.connectedCallback()
        const facetRecords = e => {
            switch (e.detail.action) {
                case "complete":
                    this.querySelector('button[type="reset"]')?.addEventListener("click", ev => {
                        Array.from(document.querySelectorAll(".clicked")).forEach(el => el.dispatchEvent(new Event("click")))
                        query.value = ""
                        query.dispatchEvent(new Event("input"))
                    })
                    this.$final = true
                    this.removeEventListener(this.getAttribute(DEER.ID), facetRecords)
                default:
            }
        }
        NoticeBoard.subscribe(this.getAttribute(DEER.ID).split('//:')[1], facetRecords.bind(this))
    }

    async #loadRecords(pagination = [0,]) {
        // const data = await this.#fetchList(this.getAttribute(DEER.ID)).catch(err => this.#flashMessage(err)) ?? {}
        // return (data[this.getAttribute(DEER.LIST) ?? "itemListElement"] ?? []).slice(pagination[0], pagination[1])
    }

    async #renderRecords(dataRecords) {
        // let list = dataRecords.reduce((a, b) => a += `
        // <deer-record class="record" deer-id="${b['@id']}">
        // <h4><a href="./record.html?id=${b['@id']}">${b.label ?? b['@id']}</a></h4>
        // </deer-record>`, ``)
    
        // document.getElementById('Records').innerHTML = list
        query.addEventListener("input", this.#filterQuery.bind(this))
        try {
            //await Promise.all(loading)
            // return this.#populateSidebar(facets, FILTERS)
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


customElements.define(DEER.COLLECTION, DLA_Collection)
