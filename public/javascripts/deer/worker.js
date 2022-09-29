/**
 * NOT A Web worker for retreiving and caching data from entities. 
 * 
 * @author cubap@slu
 */

import { DEER } from './deer-utils.js'
import { Entity, EntityMap, objectMatch } from './entities.js'
import NoticeBoard from './NoticeBoard.js'

const IDBSTORE = "deer"
const db = new Promise((resolve, reject) => {
    var DBOpenRequest = self.indexedDB.open(IDBSTORE, 1) // upgrade version 1 to version 2 if schema changes
    DBOpenRequest.onsuccess = event => {
        console.log("Successfully opened db")
        resolve(DBOpenRequest.result)
        return
    }

    DBOpenRequest.onerror = event => reject(event)

    DBOpenRequest.onupgradeneeded = event => {
        const db = event.target.result
        // Create an objectStore for this database
        var objectStore = db.createObjectStore(IDBSTORE, { autoIncrement: false, keyPath: 'id' }) // @id is an illegal keyPath
        objectStore.onsuccess = event => {
            console.log("Successfully upgraded db")
            resolve(db)
            return
        }
    }
})

NoticeBoard.subscribe(DEER.EVENTS.NEW_VIEW, message => {
    /**
     * Check for expanded object in the caches. If it exists, return it and check
     * for an update (will postMessage() twice). Otherwise, get and cache it.
     */
    const msg = message.detail
    if (!EntityMap.has(msg.id)) {
        NoticeBoard.publish(msg.id, {
            action: "reload",
            payload: new Entity(msg.id, msg.isLazy)
        })
    } else {
        const ent = EntityMap.get(msg.id)
        NoticeBoard.publish(msg.id, {
            action: "update",
            payload: ent.assertions
        })
    }
})

function getItem(id, args = {}) {
    db.then(db => {
        let lookup = db.transaction(IDBSTORE, "readonly").objectStore(IDBSTORE).get(id).onsuccess = (event) => {
            let item = event.target.result
            if (item) {
                NoticeBoard.publish(item.id, {
                    item,
                    action: "expanded",
                })
            }
            item = new Entity(item ?? { id })
            const oldRecord = JSON.parse(JSON.stringify(item.data))
            item.data.id = item.data.id ?? item.data['@id']
            item.expand(args.matchOn).then(obj => {
                if (objectMatch(oldRecord, obj.data)) { return }
                const enterRecord = db.transaction(IDBSTORE, "readwrite").objectStore(IDBSTORE)
                const insertionRequest = enterRecord.put(obj.data)
                insertionRequest.onsuccess = function (event) {
                    NoticeBoard.publish(obj.data.id, {
                        item: obj.data,
                        action: "expanded",
                    })
                }
                insertionRequest.onerror = function (event) {
                    console.log("Error: ", event)
                    NoticeBoard.publish(obj.data.id, {
                        error: event,
                        action: "error",
                        id: obj.data.id
                    })
                }
            })
        }
    })
}

export default {
    getItem
}

