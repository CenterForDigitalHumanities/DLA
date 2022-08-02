importScripts('entities.js')
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
        objectStore = db.createObjectStore(IDBSTORE, { autoIncrement: false, keyPath: 'id' }) // @id is an illegal keyPath
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
                    payload: new Entity(message.data.id)
                })
            } else {
                postMessage({
                    id: message.data.id,
                    action: "update",
                    payload: EntityMap.get(message.data.id)?.assertions
                })
            }
            break
        case "record":
            break
        default:
    }
}

function getItem(id, args = {}) {
    db.then(db => {
        let lookup = db.transaction(IDBSTORE, "readonly").objectStore(IDBSTORE).get(id).onsuccess = (event) => {
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
            item.expand(args.matchOn).then(obj => {
                if (objectMatch(oldRecord, obj.data)) { return }
                const enterRecord = db.transaction(IDBSTORE, "readwrite").objectStore(IDBSTORE)
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
            })
        }
    })
}

function objectMatch(o1 = {}, o2 = {}) {
    const keys1 = Object.keys(o1)
    const keys2 = Object.keys(o2)
    if (keys1.length !== keys2.length) { return false }
    for (const k of keys1) {
        const val1 = o1[k]
        const val2 = o2[k]
        const recurseNeeded = isObject(val1) && isObject(val2);
        if ((recurseNeeded && !this.objectMatch(val1, val2))
            || (!recurseNeeded && val1 !== val2)) {
            return false
        }
    }
    return true
    function isObject(object) {
        return object != null && typeof object === 'object'
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

    postMessage({ id, action, payload})
}

