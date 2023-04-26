import { UTILS, DEER } from '../../deer-utils.js'
import NoticeBoard from '../../NoticeBoard.js'
import DeerView from './view.js'

const template = (obj, options = {}) => `
    <style>
h1+.publication-info {
    top: -1.32em;
    position: relative;
    left: 1.32em;
    font-style: italic;
}
.poemMusic small+small {
    display: block;
    text-align: right;
}
      </style>
<!--    <h1>${UTILS.getLabel(obj)}</h1> -->
    <span class="publication-info"></span>
    <div class="row">
        <div class="textSample col">
            <h4 class='placeholder w-25 rounded'></h4>
            <div class='row  p-3'>
                <line class='placeholder col-12 mb-1 rounded'></line>
                <line class='placeholder col-12 mb-1 rounded'></line>
                <line class='placeholder col-12 mb-1 rounded'></line>
                <line class='placeholder col-9 rounded '></line>
            </div>
            <div class='row p-3'>
                <line class='placeholder col-12 mb-1 rounded'></line>
                <line class='placeholder col-12 mb-1 rounded'></line>
                <line class='placeholder col-12 mb-1 rounded'></line>
                <line class='placeholder col-9 rounded '></line>
            </div>
        </div>
        <div class="col">
            <div class="audioSample card hidden mb-3">
                <div class="card-header">Spoken Performance</div>
                <div class="card-body"></div>
            </div>
            <div class="poemMusic card hidden mb-3">
                <div class="card-header">Musical Setting</div>
                <div class="card-body"></div>
            </div>
        </div>
    </div>
    `


export default class DlaPoemDetail extends DeerView {
    static get observedAttributes() { return [DEER.ID, DEER.LAZY] }

    constructor() {
        super()
        this.template = template
    }

    connectedCallback() {
        super.connectedCallback()
        this.classList.remove(this.dataset.spinner)
        const historyWildcard = { "$exists": true, "$size": 0 }
        const exprQuery = {
            $or: [{
                "body.isRealizationOf": UTILS.httpsQueryArray(this.Entity?.id)
            }, {
                "body.isRealizationOf.value": UTILS.httpsQueryArray(this.Entity?.id)
            }],
            "__rerum.history.next": historyWildcard
        }
        const expressionCard = c => `<div class="col"><dla-simple-expression class="card" deer-link="/collection/record/" deer-id="${c}">${c}</dla-simple-expression></div>`
        const cards = document.createElement('div')
        cards.classList.add("row")
        fetch(DEER.URLS.QUERY, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(exprQuery)
        })
            .then(response => response.json())
            .then(annos => {
                const expressions = new Set()
                annos.forEach(anno => expressions.add(UTILS.getValue(anno.target)))
                return expressions
            })
            .then(expr => cards.innerHTML = Array.from(expr.values()).map(conn => expressionCard(conn)).join(''))
            .then(() => {
                this.after(cards)
            })
    }
}

customElements.define(`dla-poem-detail`, DlaPoemDetail)

export function isPoem(elem) {
    if (!elem.Entity) { return false }
    const obj = elem.Entity.data
    return obj.type?.includes("Work") && obj.additionalType?.includes("dcmitype/Text")
}

class simpleExpression extends DeerView {
    #simpleExpressionTemplate = (obj) => `
        <header class="card-header"><h4>${UTILS.getLabel(obj, obj.id)}</h4></header>
        <div class="card-body">
            <h6>View links below for connected content</h6>
            <div class="row manifestation-url">
            ${this?.manifestations?.length ? this.manifestations.map(manId => `<a href="${manId}" target="_blank">${manId}</a>`).join('') : ``}
            </div>
        </div>
        <div class="card-footer">
            <a class="tag is-small" style="color:darkgrey" href="/collection/record/${(obj["@id"] ?? obj.id)?.split('/').pop()}">full view</a>
        </div>
        `
    constructor() {
        super()
        this.template = this.#simpleExpressionTemplate
    }

    connectedCallback() {
        super.connectedCallback()
        const historyWildcard = { "$exists": true, "$size": 0 }
        const manQuery = {
            $or: [{
                "body.isEmbodimentOf": UTILS.httpsQueryArray(this.Entity?.id)
            }, {
                "body.isEmbodimentOf.value": UTILS.httpsQueryArray(this.Entity?.id)
            }],
            "__rerum.history.next": historyWildcard
        }
        const manifestationIds = fetch(DEER.URLS.QUERY, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(manQuery)
        })
            .then(response => response.json())
            .then(annos => annos.map(anno => UTILS.getValue(anno.target)))
            .then(ids => ids.map(id => id.selector ? `${id?.source}#${id.selector.value}` : id))
            .then(manifestationIds => {
                this.manifestations = manifestationIds
                if (manifestationIds?.[0].includes("ecommons")) {
                    getCachedPoemByUrl(manifestationIds[0].replace(/https?:/, 'https:')).then(poem => {
                        if (!poem) return
                        document.querySelector('.publication-info').innerHTML += `${poem.author_display} (${(new Date(poem.publication_date)).getFullYear()})`
                        if (poem.download_link) {
                            const audioSamples = document.querySelector('.audioSample .card-body')
                            audioSamples.innerHTML += `
                        <audio controls><source src="${poem.download_link}" type="audio/mpeg"></audio>
                        <a target="_blank" title="View on eCommons 🡕" href="${poem.url}">${poem.configured_field_t_publication_information}</a>`
                            audioSamples.parentElement.classList.remove('hidden')
                        }
                        if (poem.music?.length) {
                            let musicHTML = ``

                            musicHTML += poem.music.reduce((a, b) => a += `
                        <p>
                        <a target="_blank" title="View on eCommons 🡕" href="${b.url}"><cite>${b.author_display} (${(new Date(b.publication_date)).getFullYear()})</cite></a>
                        <small><a href="${b.fulltext_url}" target="_blank">
                            <object data="${b.fulltext_url}" type="application/pdf" width="100%" height="500px">PDF 🡕</object>
                        </a></small>
                        </p>`, ``)

                            const linkedMusic = document.querySelector('.poemMusic .card-body')
                            linkedMusic.innerHTML = musicHTML
                            linkedMusic.parentElement.classList.remove('hidden')
                        }
                    })
                }
                if (manifestationIds?.[0].includes("xml")) {
                    const parentPoemTextSlot = document?.querySelector(".textSample")
                    if (!parentPoemTextSlot) return
                    try {
                        SaxonJS.getResource({
                            location: manifestationIds[0],
                            type: 'xml'
                        })
                            .then(sampleSource => {
                                const poemText = SaxonJS.XPath.evaluate("/" + manifestationIds[0].split("#")[1], sampleSource, { xpathDefaultNamespace: 'http://www.tei-c.org/ns/1.0' })
                                parentPoemTextSlot.innerHTML = `${true ? markText(poemText.innerHTML) : poemText.innerHTML} <small><a target="_blank" class="button" href="${manifestationIds[0]}">TEI-XML 🡕</a></small>`
                            })
                    } catch (err) {
                        parentPoemTextSlot.innerHTML = `Select a version below to view the poem text.`
                    }
                }
            })
    }
}

customElements.define("dla-simple-expression", simpleExpression)

/** Poem Utils */

/**
 * Use the cached export from the eCommons repository to find linked poems.
 * @param {URL} poemUrl University of Dayton eCommons URL for a poem
 */
const getCachedPoemByUrl = (poemUrl) => {
    return fetch(`/cache/ecommons-poems.json`)
        .then(response => response.json())
        .then(res => {
            const poems = res.results
            const thisPoem = poems.find(poem => poem.url === poemUrl)
            if (!thisPoem.document_type.includes("collected_poetry")) { return }
            return Object.assign(thisPoem, { music: poems.filter(record => isUrlVariant(record.configured_field_t_response_to_url?.[0], poemUrl)) })
        })
}

/**
 * Find both URLs with and without a terminal slash.
 * @param {URL} url value to test
 * @param {URL} control value to test against
 * @returns {Boolean} true if the two URLs are the same
 */
const isUrlVariant = (url = "", control) => {
    return url.replaceAll("/", "").toLowerCase() === control.replaceAll("/", "").toLowerCase()
}


/** Glossary */
const GLOSSARY = await fetch('https://centerfordigitalhumanities.github.io/Dunbar-books/glossary-min.json')
    .then(res => res.json())
    .then(data => data.results)

const debounce = (wait, func) => {
    let timeout
    return function f(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

const applyFilter = debounce(200, function (ev) {
    const TERM = ev.target.value.toLowerCase()
    if (TERM?.length < 2) {
        resetClasses(false)
        return
    }
    resetClasses(true)
    const LINES = document.querySelectorAll('l')
    let results = new Set()
    LINES.forEach(line => {
        if (line.textContent.toLowerCase().includes(TERM)) {
            results.add(line)
        }
    })
    results.forEach(el => {
            el.innerHTML = el.innerHTML.replace(new RegExp("</?mark>", 'g'), ``)
            el.innerHTML = el.innerHTML.replace(new RegExp(TERM, 'gi'), match => `<mark>${match}</mark>`)
        setTimeout(() => el.classList.add('found-term'), 0)
    })
})

function resetClasses(isSearching) {
    document.querySelectorAll('.found-term,.marked').forEach(el => {
        el?.classList.remove('found-term','.marked')
    })
}

// Glossary Handling
const markupLink = (poem) => {
    if(poem.classList.contains("marked")) { return }
    const LINES = poem.querySelectorAll('l')
    GLOSSARY.forEach(entry=>{
        if(!poemContainsTerm(poem,entry.title)) { return }
        LINES.forEach(line=>{
            // broken to keep interface looking okay
            if (line.innerHTML.includes("data-definition")) { return }
            line.innerHTML = line.innerHTML.replace(new RegExp(String.raw`\b${entry.title}\b`, 'gi'), match => `<a href="${entry.url}" data-ipa="${entry.configured_field_t_ipa[0]}" data-definition="${entry.configured_field_t_definition}" data-sound="${entry.download_link}">${match}</a>${glossaryTip(entry)}`)
        })
    })
    poem.classList.add("marked")
}

const markText = (html) => {
    const shadow = document.createElement('DIV')
    shadow.innerHTML = html.normalize()
    const LINES = shadow.querySelectorAll('l')
    GLOSSARY.forEach(entry=>{
        if(!(new RegExp(String.raw`${entry.title.normalize()}`, 'i')).test(html)) { return }
        LINES.forEach(line=>{
            if (line.innerHTML.includes("data-definition")) { return }
            line.innerHTML = line.innerHTML.replace(new RegExp(String.raw`\b${entry.title}\b`, 'gi'), match => `<a href="${entry.url}" data-ipa="${entry.configured_field_t_ipa[0]}" data-definition="${entry.configured_field_t_definition}" data-sound="${entry.download_link}">${match}</a>${glossaryTip(entry)}`)
        })
    })
    return shadow.innerHTML
}


let glossaryTip = ({title,url,download_link,configured_field_t_definition,configured_field_t_ipa})=>`
<div class="glossaryTip popover fade show bs-popover-top rounded">
    <h3 class="popover-header">${title}</h3>
    <div class="popover-body">
        <p>
            ${configured_field_t_ipa} 
            ${configured_field_t_definition}
        </p>
        <audio controls src="${download_link}">
            <a href="${download_link}" target="_blank">download audio</a>
        </audio>
    </div>
    <h6 class="popover-footer"><a href="${url}" target="_blank">Visit Glossary</a></div>
    
</div>`

const poemContainsTerm = (poem,term)=> (new RegExp(String.raw`\b${term}\b`, 'i')).test(poem.textContent)
