/**
 * Web worker for retreiving and caching data from entities. 
 * 
 * @author cubap@slu
 */

import {Entity, EntityMap, objectMatch} from 'https://deer.rerum.io/releases/rc-1.0/js/entities.js'

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

self.onmessage = message => {
    switch (message.data.action) {
        case "view":
            /**
             * Check for expanded object in the caches. If it exists, return it and check
             * for an update (will postMessage() twice). Otherwise, get and cache it.
             */
            if (!message.data?.id) break // Nothing to see here
            if (!EntityMap.has(message.data.id)) {
                postMessage({
                    id: message.data.id,
                    action: "reload",
                    payload: new Entity(message.data.id, message.data.isLazy)
                })
            } else {
                postMessage({
                    id: message.data.id,
                    action: "update",
                    payload: EntityMap.get(message.data.id)
                })
            }
            break
        case "record":
            break
        default:
    }
}

async function getItem(id, args = {}) {
    try {
        const dbInstance = await db
        const transaction = dbInstance.transaction(IDBSTORE, "readonly")
        const objectStore = transaction.objectStore(IDBSTORE)
        const request = objectStore.get(id)
        
        request.onsuccess = async (event) => {
            let item = event.target.result
            if (item) {
                postMessage({
                    item,
                    action: "expanded",
                    id: item.id
                })
            }
            item = new Entity(item ?? { id })
            const oldRecord = JSON.parse(JSON.stringify(item.data))
            item.data.id = item.data.id ?? item.data['@id']
            const obj = await item.expand(args.matchOn)
            if (objectMatch(oldRecord, obj.data)) { return }
            
            const enterRecord = dbInstance.transaction(IDBSTORE, "readwrite").objectStore(IDBSTORE)
            const insertionRequest = enterRecord.put(obj.data)
            
            insertionRequest.onsuccess = function (event) {
                postMessage({
                    item: obj.data,
                    action: "expanded",
                    id: obj.data.id
                })
            }
            
            insertionRequest.onerror = function (event) {
                console.log("Error: ", event)
                postMessage({
                    error: event,
                    action: "error",
                    id: obj.data.id
                })
            }
        }
        
        // Error handling for request
        request.onerror = function (event) {
            console.log("Error: ", event)
            postMessage({
                error: event,
                action: "error",
                id: id
            })
        }
    } catch (error) {
        console.log("Error: ", error)
        postMessage({
            error: error,
            action: "error",
            id: id
        })
    }
}

/**
 * Careful with this. It's a global event listener simulation. The `document` object 
 * is not a real DOM element, so it doesn't have a `dispatchEvent` method. If more 
 * than one action type is needed, this should be refactored.
 */
var document = {}
document.dispatchEvent = msg => {
    const id = msg.detail.id
    const action = msg.detail.action
    const payload = msg.detail.payload

    postMessage({ id, action, payload })
}
