import { DEER, UTILS } from '../../deer-utils.js'
import DeerView from './view.js'

let progress

const template = (obj,options={}) => {
    if(!obj.hasOwnProperty("numberOfItems")) { return }
// Full URIs can also be used, but the internal ids are a bit more readable and bookmarkable and stubbable.
    return `
    <style scoped>
        .flex-reverse {
            box-sizing: border-box;
            max-width: var(--grid-maxWidth);
            margin: 0 auto;
            width: 96%;
            padding: 0 calc(var(--grid-gutter) / 2);
            display: flex;
            flex-direction: row-reverse;
        }

        .row {
            display: flex;
            flex-flow: row wrap;
            justify-content: flex-start;
            margin-left: calc(var(--grid-gutter) / -2);
            margin-right: calc(var(--grid-gutter) / -2);
            flex-wrap: initial;
        }

        .col {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
        }

        .col,
        [class*=" col-"],
        [class^='col-'] {
            margin: 0 calc(var(--grid-gutter) / 2) calc(var(--grid-gutter) / 2);
        }

        a.col {
            max-width: 40vw;
        }

        a.col img {
            object-fit: contain;
            object-position: center;
            max-width: 100%;
        }

        p img {
            width: 100%;
        }

        .sidebar {
            max-width: 30em;
            min-width: 200px;
            flex-basis: 200px;
            position: relative;
            flex-grow: 2;
        }

        .sidebar ul {
            margin: 0;
            padding: 0;
        }

        .sidebar li {
            padding: calc(var(--grid-gutter) / 10) 0;
            margin: 0;
            display: block;
            overflow: hidden;
            text-transform: capitalize;
            text-overflow: ellipsis;
            background: var(--site-dark);
            color: var(--site-light);
            border-left: var(--site-dark) solid thick;
        }

        a {
            text-decoration: none;
            font-weight: 400;
            color: var(--color-link);
            transition: color 0.5s ease;
        }

        a:hover,
        a:focus {
            color: var(--action);
            text-decoration: none !important;
            cursor: pointer;
        }

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

        .sidebar progress,
        .sidebar input {
            box-sizing: border-box;
            width: 100%;
            transition: width, progress-value .5s ease-out;
        }

        .sidebar input {
            line-height: 1.6;
            margin-bottom: var(--grid-gutter);
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

        .grow {
            flex-grow: 6;
        }

        .wrap {
            flex-wrap: wrap;
            display: flex;
        }

        .thumbnail {
            object-fit: cover;
            object-position: top center;
            padding: calc(var(--grid-gutter) / 2);
            max-height: 10em;
            min-width: 5em;
        }

        .record {
            display: flex;
            flex-basis: 100%;
            flex-direction: column;
            padding: calc(var(--grid-gutter) / 2);
            box-shadow: -1px -1px 3px rgba(0, 0, 0, .4);
            margin: calc(var(--grid-gutter) / 4);
        }

        .record[class*='hide-'],
        facet[class*='hide-'] {
            display: none !important;
        }

        dt,
        dd {
            border-top: 1px solid var(--bg-secondary-color);
            padding-right: 0;
            line-height: 1.42857143;
            margin: 0 auto;
            color: var(--font-color);
            display: inline-block;
            padding-top: 6px;
            padding-bottom: 4px;
            box-sizing: border-box;
            vertical-align: top;
        }

        dt {
            font-weight: 700;
            width: 15%;
        }

        dd {
            width: 85%;
            word-break: break-word;
            padding-left: 40px;
        }

        dd p {
            padding: 0;
            margin: 0;
        }

        .record h4 {
            margin: 0 auto;
            font-size: 1.3em;
            padding: 0.5em 0em;
        }

        #Records {
            overflow: auto;
            height: calc(100vh - 75px - 52px - var(--body-padding));
        }
    </style>
    <div>
        <div class="flex-reverse">
            <div id="Records" class="grow wrap">
            ${(obj[options.list ?? "itemListElement"] ?? [])?.reduce((a, b) => a += `
            <deer-record class="record" deer-id="${b['@id']}">
            <h4><a href="./record.html?id=${b['@id']}">${b.label ?? b['@id']}</a></h4>
            </deer-record>`, ``)}
            </div>
            <div class="sidebar">
                <header title="${obj.description??``}">${obj.name}</header>
                <h3>Refine Results <button role="button" type="reset">clear all</button></h3>
                <progress value="${obj.numberOfItems??0}" max="${obj.numberOfItems??10}">${obj.numberOfItems??``} of ${obj.numberOfItems??``}</progress>
                <input id="query" type="text" placeholder="type to filter">
                <section id="facetFilter"></section>
            </div>
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
            if (e.data.id !== this.getAttribute(DEER.ID)) { return }
            switch (e.data.action) {
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
        this.addEventListener(this.getAttribute(DEER.ID), facetRecords)
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
