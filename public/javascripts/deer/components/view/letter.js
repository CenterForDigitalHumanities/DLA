import { UTILS, DEER } from '../../deer-utils.js'
import NoticeBoard from '../../NoticeBoard.js'
import DeerView from './view.js'

const textTemplate = (obj, options = {}) => `
    <div class="row">
        <div class="col">
        <h3>${UTILS.getLabel(obj)}</h3>
        <p>
            Sent from ${UTILS.getValue(obj.fromLocation) ?? "(unknown)"} 
            to ${UTILS.getValue(obj.toLocation) ?? "(unknown)"} 
            on ${formatDate(UTILS.getValue(obj.date))}.
        </p>
        </div>
        <div class="col">
            ${folioTemplate(obj.manifest)}
        </div>
    </div>
    `
function formatDate(dateString) {
    let dateML 
    // May fail `undefined` on first pass, malformed string, unexpected locale
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }
    try {
        dateML = new Date(dateString).toLocaleDateString(undefined,options)
        if(dateML === NaN) throw new Error('Not a number')
    } catch(err) {
        // default to Now, which is not right but is not broken
        // dateML = new Date(Date.now()).toLocaleDateString(undefined,options)
        dateML = `(date not recorded)`
    }
    return dateML
}
    
export class DlaTextDetail extends DeerView {
    static get observedAttributes() { return [DEER.ID, DEER.LAZY] }

    #getManifest() {
        if(this.data?.manifest && this.$final) { return }
        const tpenProject = this.Entity.assertions.tpenProject
        if(!tpenProject || parseInt(tpenProject)===NaN ) { return }

        fetch(`//t-pen.org/TPEN/manifest/${UTILS.getValue(Array.isArray(tpenProject)?tpenProject[0]:tpenProject)}`)
        .then(response => response.json()).then(manifest=>{
            this.Entity.data = {manifest}
            // NoticeBoard.publish(UTILS.normalizeEventType(this.getAttribute('deer-id')),{action:'update',payload:this.Entity.assertions})
        })
        
    }

    constructor() {
        super()
        this.template = textTemplate
    }

    connectedCallback() {
        super.connectedCallback()
        this.classList.remove(this.dataset.spinner)
        NoticeBoard.subscribe(UTILS.normalizeEventType(this.getAttribute('deer-id')), this.#getManifest.bind(this))
    }
}

customElements.define(`dla-text-detail`, DlaTextDetail)

const folioTemplate = (manifest) => {
            if (!manifest) { return `[ no project linked yet ]` }

    const pages = manifest.sequences[0].canvases.slice(0, 10).reduce((a, b) => a += `
    <div class="page card mt-1">
        <div class="card-header">
            <p class="card-title text-center">${b.label}</p>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-6">
                    ${b.otherContent[0].resources.reduce((aa, bb) => aa +=
                bb.resource["cnt:chars"].length
                    ? bb.resource["cnt:chars"].slice(-1) == '-'
                        ? bb.resource["cnt:chars"].substring(0, bb.resource["cnt:chars"].length - 1)
                        : bb.resource["cnt:chars"] + ' '
                    : " <line class='rounded placeholder d-inline-block'></line> ", '')
                }
                </div>
                <img class="col-6" src="${UTILS.URLasHTTPS(b.images[0].resource['@id'])}">
            </div>
        </div>
    </div>
    `, ``)
return pages
    //                 elem.innerHTML = `
    //                 <style>
    //                     printed {
    //                         font-family:serif;
    //                     }
    //                     note {
    //                         font-family:monospace;
    //                     }
    //                     unclear {
    //                         opacity:.4;
    //                     }
    //                     line.empty {
    //                         line-height: 1.6;
    //                         background-color: #CCC;
    //                         height: 1em;
    //                         margin: .4em 0;
    //                         display:block;
    //                         border-radius: 4px;
    //                     }
    //                 </style>
    //                 <a href="//t-pen.org/TPEN/transcription.html?projectID=${parseInt(ms['@id'].split("manifest/")?.[1])}" target="_blank">transcribe on TPEN</a>
    //                 <h2>${ms.label}</h2>
    //                 <deer-view class="recordStatus tag button is-full-width text-center bg-error" id="transcribedStatus" deer-template="transcriptionStatus" deer-id="${obj["@id"]}"></deer-view>
    //                 ${pages}
    //                 `
    //                 setTimeout(() => UTILS.broadcast(undefined, DEER.EVENTS.NEW_VIEW, document, elem.querySelector(DEER.VIEW)), 0)
    //             })
    //             .catch(err => { })
    //     }
    // }

}

export function isLetter(elem) {
    return elem.Entity?.data['@type']?.includes("Text")
}
