import { UTILS, DEER } from '../../deer-utils.js'
import NoticeBoard from '../../NoticeBoard.js'
import DeerView from './view.js'

const template = (obj, options = {}) => {
    return `<p>Review the connected published versions of this poem, listed below.  The same poem can appear in many forms of publication.</p>`
}

const OGtemplate = (obj, options = {}) => {
    const html = `
    <p>Review the connected published versions of this poem, listed below.  The same poem can appear in many forms of publication.</p>`

    const then = async (elem, obj, options) => {
        const workId = obj['@id']
        const historyWildcard = { "$exists": true, "$size": 0 }
        const exprQuery = {
            $or: [{
                "body.isRealizationOf": workId
            }, {
                "body.isRealizationOf.value": workId
            }],
            "__rerum.history.next": historyWildcard
        }
        const expressionConnections = await fetch(config.URLS.QUERY, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(exprQuery)
        })
            .then(response => response.json())
            .then(annos => {
                return annos.map(anno => {
                    return { "annoId": UTILS.getValue(anno["@id"]), "expId": UTILS.getValue(anno.target) }
                })
            })
        const expressionCard = c => `<deer-view class="card col" deer-template="simpleExpression" deer-link="poem-expression.html#" anno-id="${c.annoId}" deer-id="${c.expId}">${c.expId}</deer-view>`
        const cards = document.createElement('div')
        cards.classList.add("row")
        cards.innerHTML = expressionConnections.map(conn => expressionCard(conn)).join('')
        elem.append(cards)
        NoticeBoard.publish(undefined, config.EVENTS.NEW_VIEW, elem, { set: cards.children })
    }
    return { html, then }
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
        const expressionCard = c => `<dla-simple-expression class="card col" deer-template="entity" deer-link="poem-expression.html#" deer-id="${c}">${c}</dla-simple-expression>`
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
//     <div id="textSample" class="card">
//         [ Text Sample ]
//         <stanza>
//             <line></line>
//             <line></line>
//             <line></line>
//             <line></line>
//         </stanza>
//         <stanza>
//             <line></line>
//             <line></line>
//             <line></line>
//             <line></line>
//         </stanza>
//     </div>
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

const simpleExpressionTemplate = (obj) => `
<style>
dla-simple-expression {
    display: inline-block;
    box-sizing: border-box;
    box-shadow: #000 1px 1px 5px;
    margin: 0.32em;
    padding: 0.68em;
}
</style>
    <header><h4>${UTILS.getLabel(obj)}</h4></header>
    <h6>View links below for connected content</h6>
    <div class="row manifestation-url"></div>
    <h6> Control this Expression </h6>
    <div class="row">
        <a class="tag is-small" style="color:darkgrey" href="poem-expression.html#${UTILS.getValue(obj["@id"])}">full view</a>
        <a class="tag is-small" href="expression.html#${UTILS.getValue(obj["@id"])}">edit details</a>
    </div>
    `
    // ^^ If we want to offer a delete button, here's an OK one
    //<a class="tag is-small" style="color:red" onclick="removeExpressionFromWork('${UTILS.getLabel(obj)}', '${UTILS.getValue(obj["@id"])}', this)">disconnect from poem</a>
class simpleExpression extends DeerView {
    constructor() {
        super()
        this.template = simpleExpressionTemplate
    }
    
    connectedCallback() {
        const mURL = manId => `<a href="${manId}" target="_blank">${manId}</a>`
        const historyWildcard = { "$exists": true, "$size": 0 }
        const manQuery = {
            $or: [{
                "body.isEmbodimentOf": this.id
            }, {
                "body.isEmbodimentOf.value": this.id
            }],
            "__rerum.history.next": historyWildcard
        }
        const manifestationIds = fetch(config.URLS.QUERY, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(manQuery)
        })
        .then(response => response.json())
        .then(annos => annos.map(anno => UTILS.getValue(anno.target)))
        .then(ids => ids.map(id => id.selector ? `${id?.source}#${id.selector.value}` : id))
        .then(manifestationIds => document.querySelector(".manifestation-url").innerHTML = manifestationIds.map(manId => mURL(manId)).join(''))
    }
}

customElements.define("dla-simple-expression", simpleExpression)