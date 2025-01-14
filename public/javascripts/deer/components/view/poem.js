import { DEER, UTILS } from '../../deer-utils.js'
import NoticeBoard from '../../NoticeBoard.js'
import DeerView from './view.js'

const template = (obj, options = {}) => `
    <style>
    .textSample {
        width: fit-content;
      }
      
      .textSample lg {
        padding: 0.68em 0;
      }
      
      .textSample stanza, .textSample line {
        display: block;
      }
      .textSample stanza {
        margin-bottom: 0.68em;
        min-width: 25em;
      }
      .textSample line {
        width: 100%;
        background-color: hsl(0deg 0% 90%);
        border-radius: 0.5em;
        line-height: 1.2;
        height: 1em;
        margin: 0.15em;
        box-shadow: inset 0 0 2px white;
        animation: loaderColor alternate 500ms;
      }
      .textSample line:last-of-type {
        width: 80%;
      }
      @keyframes loaderColor {
        0% {
          background-color: hsl(0deg 0% 95%);
        }
        100% {
          background-color: hsl(0deg 0% 85%);
        }
      }
      
/* TEI pseudoXSLT */
.textSample {
  font-variant: small-caps;
  font-weight: bold;
}
.textSample lg[type='stanza'],.textSample l {
  font-family: Georgia, 'Times New Roman', Times, serif;
  font-variant: initial;
  font-weight: initial;
  display: block;
  width: 100%;
}
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
    <h1>${UTILS.getLabel(obj)}</h1>
    <span class="publication-info"></span>
    <row>
        <div class="textSample card col">
        ${false ? true : `
        [ Text Sample ]
        <stanza>
            <line></line>
            <line></line>
            <line></line>
            <line></line>
        </stanza>
        <stanza>
            <line></line>
            <line></line>
            <line></line>
            <line></line>
        </stanza>`}
        </div>
        <div class="col">
            <div class="audioSample card">
                <h3>Spoken Performance</h3>
            </div>
            <div class="poemMusic card">
            </div>
        </div>
    </row>
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
                "body.isRealizationOf": UTILS.httpsIdArray(this.Entity?.id)
            }, {
                "body.isRealizationOf.value": UTILS.httpsIdArray(this.Entity?.id)
            }],
            "__rerum.history.next": historyWildcard
        }
        const expressionCard = c => `<dla-simple-expression class="col" deer-link="/collection/record/" deer-id="${c}">${c}</dla-simple-expression>`
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
    const obj = elem.Entity.getObject()
    return obj.type?.includes("Work") && obj.additionalType?.includes("dcmitype/Text")
}

class DlaSimpleExpression extends DeerView {
    #simpleExpressionTemplate = (obj) => `
    <div class="card">
        <p class="card-header card-title">${UTILS.getLabel(obj)}</p>
        <div class="card-body">
        <div class="label">
        ${obj.collection_label}
        </div>
            <h6>View links below for connected content</h6>
            <a href="${obj.manifestationURL}" target="_blank">${obj.institution_title}</a>
        </div>
        <div class="card-footer">
            <a class="tag is-small" style="color:darkgrey" href="/collection/record/${(obj.id)?.split('/').pop()}">full view</a>
        </div>
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
                "body.isEmbodimentOf": UTILS.httpsIdArray(this.Entity?.id)
            }, {
                "body.isEmbodimentOf.value": UTILS.httpsIdArray(this.Entity?.id)
            }],
            "__rerum.history.next": historyWildcard
        }
        fetch(DEER.URLS.QUERY, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(manQuery)
        })
            .then(response => response.json())
            .then(annos => annos.map(anno => UTILS.getValue(anno.target)))
            .then(ids => ids.map(id => id.selector ? `${id?.source}#${id.selector.value}` : id).pop())
            .then(manifestationId => {
                const manifestationURL = UTILS.URLasHTTPS(manifestationId)
                this.Entity._data.manifestationURL = manifestationURL
                if (manifestationURL.includes("ecommons")) {
                    getCachedPoemByUrl(UTILS.URLasHTTPS(manifestationURL)).then(poem => {
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
                        this.Entity._data.institution_title = poem.institution_title
                        const types = {}
                        types[`🎼 Musical Setting, ${poem?.author_display}`] = "musical_setting"
                        types["🖋 Collected Poems"] = "collected_poetry"
                        for (const prop in types) {
                            if (poem?.document_type.includes(types[prop])) {
                                this.Entity._data.collection_label = prop
                                break
                            }
                        }
                        this.#updateEntity({detail:{action:'update',payload:this.Entity.assertions}})
                    })
                }
                if (manifestationURL.includes("xml")) {
                    this.Entity._data.collection_label = '📚 DLA Books'
                    this.Entity._data.institution_title = 'The Complete Works'
                    const parentPoemTextSlot = document?.querySelector(".textSample")
                    if (!parentPoemTextSlot) return
                    try {
                        SaxonJS.getResource({
                            location: manifestationURL,
                            type: 'xml'
                        })
                            .then(sampleSource => {
                                const poemText = SaxonJS.XPath.evaluate("/" + manifestationURL.split("#")[1], sampleSource, { xpathDefaultNamespace: 'http://www.tei-c.org/ns/1.0' })
                                parentPoemTextSlot.innerHTML = `${true ? markText(poemText.innerHTML) : poemText.innerHTML} <small><a target="_blank" class="button" href="${manifestationURL}">TEI-XML 🡕</a></small>`
                                this.#updateEntity({detail:{action:'update',payload:this.Entity.assertions}})
                            })
                    } catch (err) {
                        parentPoemTextSlot.innerHTML = `Select a version below to view the poem text.`
                    }
                }
            })
    }

    #updateEntity(e) {
        const msg = e.detail
        switch (msg.action) {
            case "reload":
            case "update":
                this.Entity = msg.payload
                this.innerHTML = this.template(msg.payload?.assertions) ?? this.innerHTML
                break
            case "error":
                // this.#handleErrors(msg.payload)
                break
            case "complete":
                this.$final = true
                NoticeBoard.unsubscribe(UTILS.normalizeEventType(this.getAttribute(DEER.ID)), this.#updateEntity.bind(this))
            default:
        }
    }
}

customElements.define("dla-simple-expression", DlaSimpleExpression)

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
        el?.classList.remove('found-term', '.marked')
    })
}

// Glossary Handling
const markupLink = (poem) => {
    if (poem.classList.contains("marked")) { return }
    const LINES = poem.querySelectorAll('l')
    GLOSSARY.forEach(entry => {
        if (!poemContainsTerm(poem, entry.title)) { return }
        LINES.forEach(line => {
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
    GLOSSARY.forEach(entry => {
        if (!(new RegExp(String.raw`${entry.title.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')}`, 'i')).test(html)) { return }
        LINES.forEach(line => {
            if (line.innerHTML.includes("data-definition")) { return }
            line.innerHTML = line.innerHTML.replace(new RegExp(String.raw`([\s\b]|^)${entry.title.replace(/[\u2018\u2019]/g, "'")
                .replace(/[\u201C\u201D]/g, '"')}([\s\b]|$)`, 'gi'), match => ` <a href="${entry.url}" data-ipa="${entry.configured_field_t_ipa[0]}" data-definition="${entry.configured_field_t_definition}" data-sound="${entry.download_link}">${match.trim()}</a>${glossaryTip(entry)} `)
        })
    })
    return shadow.innerHTML
}


let glossaryTip = ({ title, url, download_link, configured_field_t_definition, configured_field_t_ipa }) => `
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

const poemContainsTerm = (poem, term) => (new RegExp(String.raw`\b${term}\b`, 'i')).test(poem.textContent)
