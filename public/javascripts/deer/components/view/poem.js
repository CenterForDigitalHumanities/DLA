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

export default class ViewPoem extends DeerView {
    static get observedAttributes() { return [DEER.ID,DEER.LAZY] }

    constructor() {
        super()
        this.template = template
    }

    connectedCallback() {
        const historyWildcard = { "$exists": true, "$size": 0 }
        const exprQuery = {
            $or: [{
                "body.isRealizationOf": this.id
            }, {
                "body.isRealizationOf.value": this.id
            }],
            "__rerum.history.next": historyWildcard
        }
        const expressionConnections = fetch("http://tinydev.rerum.io/app/query", {
        // const expressionConnections = fetch("http://tinypaul.rerum.io/dla/query", {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(exprQuery)
        })
            .then(response => response.json())
            .then(annos => {
                return annos.map(anno => {
                    return { "annoId": UTILS.getValue(anno["@id"] ?? anno.id), "expId": UTILS.getValue(anno.target) }
                })
            })
        const expressionCard = c => `<deer-view class="card col" deer-template="simpleExpression" deer-link="poem-expression.html#" anno-id="${c.annoId}" deer-id="${c.expId}">${c.expId}</deer-view>`
        const cards = document.createElement('div')
        cards.classList.add("row")
        expressionConnections.then(expr=>cards.innerHTML = expr.map(conn => expressionCard(conn)).join(''))
        this.after(cards)
    }
}

customElements.define(`dla-poem`, ViewPoem)
