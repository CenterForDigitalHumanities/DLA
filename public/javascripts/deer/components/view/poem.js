import { UTILS, DEER } from '../../deer-utils.js'
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
    static get observedAttributes() { return [DEER.ID,DEER.LAZY] }

    constructor() {
        super()
        this.template = template
    }

    connectedCallback() {
        super.connectedCallback()
        const historyWildcard = { "$exists": true, "$size": 0 }
        const exprQuery = {
            $or: [{
                "body.isRealizationOf": this.Entity?.id
            }, {
                "body.isRealizationOf.value": this.Entity?.id
            }],
            "__rerum.history.next": historyWildcard
        }
        const expressionCard = c => `<dla-simple-expression class="hidden" deer-link="poem-expression.html#" deer-id="${c}">${c}</dla-simple-expression>`
        const cards = document.createElement('div')
        cards.classList.add("row")
        this.after(cards)
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
        .then(expr=>cards.innerHTML = Array.from(expr.values()).map(conn => expressionCard(conn)).join(''))
    }
}

customElements.define(`dla-poem-detail`, DlaPoemDetail)

export function isPoem(elem){
    if(!elem.Entity) { return false }
    const obj = elem.Entity.data
    return obj.type?.includes("Work") && obj.additionalType?.includes("dcmitype/Text")
}

class simpleExpression extends DeerView {
    #simpleExpressionTemplate = (obj) => `
        <header><h4>${UTILS.getLabel(obj)}</h4></header>
        <h6>View links below for connected content</h6>
        <div class="row manifestation-url">
        ${this?.manifestations?.length ? this.manifestations.map(manId => `<a href="${manId}" target="_blank">${manId}</a>`).join('') : ``}
        </div>
        <div class="row">
            <a class="tag is-small" style="color:darkgrey" href="poem-expression.html#${UTILS.getValue(obj["@id"])}">full view</a>
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
                "body.isEmbodimentOf": this.Entity.id
            }, {
                "body.isEmbodimentOf.value": this.Entity.id
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
                getCachedPoemByUrl(manifestationIds[0]).then(poem=>{
                    if(!poem) return
                    document.querySelector('.publication-info').innerHTML += `${poem.author_display} (${(new Date(poem.publication_date)).getFullYear()})`
                    if(poem.download_link) {
                        document.querySelector('.audioSample').innerHTML += `
                        <audio controls><source src="${poem.download_link}" type="audio/mpeg"></audio>
                        <a target="_blank" title="View on eCommons 🡕" href="${poem.url}">${poem.configured_field_t_publication_information}</a>`
                    }
                    if(poem.music){
                        let musicHTML = `<h3>Musical Setting${poem.music.length===1?``:`s`}</h3>`

                        musicHTML += poem.music.reduce((a,b)=>a+=`
                        <p>
                        <a target="_blank" title="View on eCommons 🡕" href="${b.url}"><cite>${b.author_display} (${(new Date(b.publication_date)).getFullYear()})</cite></a>
                        <small><a href="${b.fulltext_url}" target="_blank">
                            <object data="${b.fulltext_url}" type="application/pdf" width="100%" height="500px">PDF 🡕</object>
                        </a></small>
                        </p>`,``)
                        document.querySelector(".poemMusic").innerHTML = musicHTML
                    }
                })
            }
            if (manifestationIds?.[0].includes("xml")) {
                const parentPoemTextSlot = document?.querySelector(".textSample")
                if(!parentPoemTextSlot) return
                try {
                    SaxonJS.getResource({
                        location: manifestationIds[0],
                        type: 'xml'
                    })
                    .then(sampleSource => {
                    const poemText = SaxonJS.XPath.evaluate("/" + manifestationIds[0].split("#")[1], sampleSource, { xpathDefaultNamespace: 'http://www.tei-c.org/ns/1.0' })
                    parentPoemTextSlot.innerHTML = `${poemText.innerHTML} <small><a target="_blank" class="button" href="${manifestationIds[0]}">TEI-XML 🡕</a></small>`
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
    .then(res=>{
        const poems = res.results
        const thisPoem = poems.find(poem => poem.url === poemUrl)
        if(!thisPoem.document_type.includes("collected_poetry")) { return }
        return Object.assign(thisPoem,{music:poems.filter(record=>isUrlVariant(record.configured_field_t_response_to_url?.[0],poemUrl))})
    })
}

/**
 * Find both URLs with and without a terminal slash.
 * @param {URL} url value to test
 * @param {URL} control value to test against
 * @returns {Boolean} true if the two URLs are the same
 */
const isUrlVariant = (url="", control) => {
    return url.replaceAll("/","").toLowerCase() === control.replaceAll("/","").toLowerCase()
}
