import { UTILS, DEER } from '../../deer-utils.js'
import NoticeBoard from '../../NoticeBoard.js'
import DeerView from './view.js'

const template = (obj, options = {}) => {
    return `
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

      </style>
    <p>Review the connected published versions of this poem, listed below.  The same poem can appear in many forms of publication.</p>
    <div class="textSample card">
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
    `
}

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
        const expressionCard = c => `<dla-simple-expression class="card col" deer-link="poem-expression.html#" deer-id="${c}">${c}</dla-simple-expression>`
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

// poemDetail: (obj, options = {}) => {
//     const html = `<h2>${UTILS.getLabel(obj)}</h2> 
    
//     <h4>Around the Globe</h4>
//     <p>These are various published versions of this poem.</p>`
//     const then = async (elem, obj, options) => {
//         const workId = obj['@id']
//         const historyWildcard = { "$exists": true, "$size": 0 }
//         const exprQuery = {
//             $or: [{
//                 "body.isRealizationOf": workId
//             }, {
//                 "body.isRealizationOf.value": workId
//             }],
//             "__rerum.history.next": historyWildcard
//         }
//         const expressionIds = await fetch(config.URLS.QUERY, {
//             method: "POST",
//             mode: "cors",
//             body: JSON.stringify(exprQuery)
//         })
//             .then(response => response.json())
//             .then(annos => annos.map(anno => UTILS.getValue(anno.target)))
//         const expressionCard = expId => `<deer-view class="card col" deer-template="expression" deer-link="poem-expression.html#" deer-id="${expId}">${expId}</deer-view>`
//         const cards = document.createElement('div')
//         cards.classList.add("row")
//         cards.innerHTML = expressionIds.map(expId => expressionCard(expId)).join('')
//         elem.append(cards)
//         UTILS.broadcast(undefined, config.EVENTS.NEW_VIEW, elem, { set: cards.children })
//     }
//     return { html, then }
// },
// expressionDetail: (obj, options = {}) => {
//     const html = `<header><h4>${UTILS.getLabel(obj)}</h4></header>
//     <p>Originally published: ${UTILS.getValue(obj.publicationDate) ?? "[ unknown ]"}</p>
//     <a href="poem.html#${UTILS.getValue(obj.isRealizationOf)}">All versions of this poem</a>
//     <div>${obj.text ?? "[ no text attached ]"}</div>
//     <div>${obj.recording ?? "[ recording unavailable ]"}</div>
//     <p>View resource: <span class="manifestation-url"></span></p>
//     `
//     const then = async (elem, obj, options) => {
//         const expId = obj['@id']
//         const historyWildcard = { "$exists": true, "$size": 0 }
//         const manQuery = {
//             $or: [{
//                 "body.isEmbodimentOf": expId
//             }, {
//                 "body.isEmbodimentOf.value": expId
//             }],
//             "__rerum.history.next": historyWildcard
//         }
//         const manifestationIds = await fetch(config.URLS.QUERY, {
//             method: "POST",
//             mode: "cors",
//             body: JSON.stringify(manQuery)
//         })
//             .then(response => response.json())
//             .then(annos => annos.map(anno => UTILS.getValue(anno.target)))
//             .then(async targets => {
//                 // hacky punch in some text for now
//                 for (const t of targets) {
//                     if (typeof t === "object") {
//                         try {
//                             const sampleSource = await SaxonJS.getResource({
//                                 location: t.source,
//                                 type: 'xml'
//                             })
//                             const poemText = SaxonJS.XPath.evaluate("/" + t.selector?.value, sampleSource, { xpathDefaultNamespace: 'http://www.tei-c.org/ns/1.0' })
//                             textSample.innerHTML = poemText.innerHTML
//                             break
//                         } catch (err) {
//                             textSample.innerHTML = `Select a version below to view the poem text.`
//                         }
//                     }
//                 }
//                 return targets
//             })
//             .then(ids => ids.map(id => id.selector ? `${id?.source}#${id.selector.value}` : id))
//         const mURL = manId => `<a href="${manId}" target="_blank">${manId}</a>`
//         elem.querySelector(".manifestation-url").innerHTML = manifestationIds.map(manId => mURL(manId)).join('')
//     }
//     return { html, then }
// },
// expression: (obj, options = {}) => {
//     const html = `<header><h4>${UTILS.getLabel(obj)}</h4></header>
//     <p>Originally published: ${UTILS.getValue(obj.publicationDate) ?? "unknown"}</p>
//     <div class="manifestation-url"></div>
//     <small>${options.link ? "<a href='" + options.link + obj['@id'] + "'" + "</a>(view details)" : ""}</small>`
//     const then = async (elem, obj, options) => {
//         const expId = obj['@id']
//         const historyWildcard = { "$exists": true, "$size": 0 }
//         const manQuery = {
//             $or: [{
//                 "body.isEmbodimentOf": expId
//             }, {
//                 "body.isEmbodimentOf.value": expId
//             }],
//             "__rerum.history.next": historyWildcard
//         }
//         const manifestationIds = await fetch(config.URLS.QUERY, {
//             method: "POST",
//             mode: "cors",
//             body: JSON.stringify(manQuery)
//         })
//             .then(response => response.json())
//             .then(annos => annos.map(anno => UTILS.getValue(anno.target)))
//             .then(async targets => {
//                 // hacky punch in some text for now
//                 for (const t of targets) {
//                     if (typeof t === "object") {
//                         try {
//                             const sampleSource = await SaxonJS.getResource({
//                                 location: t.source,
//                                 type: 'xml'
//                             })
//                             const poemText = SaxonJS.XPath.evaluate("/" + t.selector?.value, sampleSource, { xpathDefaultNamespace: 'http://www.tei-c.org/ns/1.0' })
//                             textSample.innerHTML = poemText.innerHTML
//                             break
//                         } catch (err) {
//                             textSample.innerHTML = `Select a version below to view the poem text.`
//                         }
//                     }
//                 }
//                 return targets
//             })
//             .then(ids => ids.map(id => id.selector ? `${id?.source}#${id.selector.value}` : id))
//         const mURL = manId => `<a href="${manId}" target="_blank">${manId}</a>`
//         elem.querySelector(".manifestation-url").innerHTML = manifestationIds.map(manId => mURL(manId)).join('')
//     }
//     return { html, then }
// }

// ^^ If we want to offer a delete button, here's an OK one
//<a class="tag is-small" style="color:red" onclick="removeExpressionFromWork('${UTILS.getLabel(obj)}', '${UTILS.getValue(obj["@id"])}', this)">disconnect from poem</a>
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
                    parentPoemTextSlot.innerHTML = poemText.innerHTML
                    })
                } catch (err) {
                    parentPoemTextSlot.innerHTML = `Select a version below to view the poem text.`
                }
            }
        })
    }
}

customElements.define("dla-simple-expression", simpleExpression)