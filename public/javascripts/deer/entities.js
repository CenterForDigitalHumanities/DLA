/**
 * Web Worker helper for handling Entity expansion and annotation discovery.
 * 
 * @author  Patrick Cuba <cubap@slu.edu>
 * @org     SLU, Research Computing Group
 */

import { UTILS, DEER } from './deer-utils.js'
import NoticeBoard from './NoticeBoard.js'

const EntityMap = new Map()

/**
 * Create a new Entity object, find its annotations, and cache it.
 * @class
 * @classdesc Entity is an object described by the documents related to the URI recorded in the 
 * `deer-id` attribute.
 * @param {Object} entity Object to be described. Usually from a JSON-LD document.
 * @param {Boolean} isLazy true if a compound query should not be made.
 */
class Entity extends Object {
    #isLazy

    constructor(entity = {}, isLazy = false) {
        super()
        // accomodate Entity(String) and Entity(Object) or Entity(JSONString)
        if (typeof entity === "string") {
            try {
                entity = JSON.parse(entity)
            } catch (e) {
                entity = { id: entity }
            }
        }
        const id = UTILS.URLasHTTPS(entity.id ?? entity["@id"] ?? entity) // id is primary key
        if (!id || id === "https://undefined") { throw new Error("Entity must have an id") }
        if (EntityMap.has(id)) { throw new Error("Entity already exists") }
        this.Annotations = new Map()
        this.#isLazy = Boolean(isLazy)
        this._data = {}
        this.data = entity
    }

    get assertions() {
        let clone = JSON.parse(JSON.stringify(this.data))
        this.Annotations.forEach(annotation => applyAssertions(clone, annotation.normalized))
        this._assertions = clone
        return this._assertions
    }

    get data() {
        return this._data
    }

    get id() {
        return this.data.id
    }

    set data(entity) {
        entity.id = UTILS.URLasHTTPS(entity.id ?? entity["@id"] ?? this.id) // id is primary key
        if (!entity.id) { 
            console.warn("Entity must have an id", entity)
            return
        }
        const oldRecord = this._data ? JSON.parse(JSON.stringify(this._data)) : {}
        Object.assign(this._data, entity)
        if (objectMatch(this._data, oldRecord)) {
            console.warn("Entity data unchanged")
            return
        }
        EntityMap.set(UTILS.URLasHTTPS(this.id), this)
        this.#announceUpdate()
        if (oldRecord.id != this.id) { this.#resolveURI(!this.#isLazy).then(this.#announceNewEntity) }
    }

    attachAnnotation(annotation) {
        this.Annotations.set(annotation.id, annotation)
    }

    #findAssertions = (assertions) => {
        const annos = Array.isArray(assertions) ? Promise.resolve(assertions) : findByTargetId(this.id, [], DEER.URLS.QUERY)
        return annos
            .then(annotations => annotations.filter(a => (a.type ?? a['@type'])?.includes("Annotation")).map(anno => new Annotation(anno)))
            .then(newAssertions => {
                if (newAssertions?.length) { this.#announceUpdate() }
                this.#announceComplete()
            })
            .catch(err => console.log(err))
    }

    #resolveURI = (withAssertions) => {
        const targetStyle = ["target", "target.@id", "target.id"]
        let historyWildcard = { "$exists": true, "$size": 0 }
        let obj = { "$or": [{ '@id': UTILS.httpsIdArray(this.id) }], "__rerum.history.next": historyWildcard }
        for (let target of targetStyle) {
            let o = {}
            o[target] = UTILS.httpsIdArray(this.id)
            obj["$or"].push(o)
        }
        const results = withAssertions ? fetch(DEER.URLS.QUERY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(obj)
        }) : fetch(UTILS.URLasHTTPS(this.id))
        return results
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(finds => {
                if (finds.length === 0) { return Promise.reject({ status: 404 }) }
                const originalObject = finds.find?.(e => e['@id'] === this.id) ?? finds
                if (!Array.isArray(originalObject) && typeof originalObject === "object") {
                    this.data = originalObject
                }
                withAssertions ? this.#findAssertions(finds) : this.#findAssertions()
            })
            .catch(err => {
                switch (err.status) {
                    case 404: console.log(`${this.id} not found`)
                    case 500: console.log(`${this.id} encountered a server error`)
                        this.#announceError(err)
                        break

                    default: console.log(err)
                }
            })
    }

    #announceUpdate = () => {
        NoticeBoard.publish(UTILS.normalizeEventType(this.id), {
            action: "update",
            payload: this
        })
    }
    #announceNewEntity = () => {
        NoticeBoard.publish(UTILS.normalizeEventType(this.id), {
            action: "reload",
            payload: this
        })
    }
    #announceComplete = () => {
        NoticeBoard.publish(UTILS.normalizeEventType(this.id), {
            action: "complete",
        })
    }
    #announceError = (err) => {
        NoticeBoard.publish(UTILS.normalizeEventType(this.id), {
            action: "error",
            payload: err
        })
    }

    getObject = () => {
        return this.assertions
    }
}

/**
 * Create a new Annotation object, attach it to its targets, and cache it.
 * @class
 * @classdesc Annotation is an object describing the documents related to the URI recorded in the 
 * `deer-id` attribute.
 * @param {Object} annotation document asserting a value or relationship. Usually from a JSON-LD document.
 */
class Annotation extends Object {
    constructor(annotation) {
        super()
        this.data = annotation
        this.#registerTargets()
    }

    get normalized() {
        let processedData = []
        const sourceData = (!Array.isArray(this.data.body)) ? [this.data.body] : this.data.body
        sourceData.flat(2).forEach(body => {
            Object.entries(body).forEach(([key, value]) => processedData.push({ [key]: buildValueObject(value, this) }))
        })
        return processedData
    }

    get id() {
        return this.data.id ?? this.data['@id'] // id is primary key
    }

    #registerTargets = () => {
        let targets = this.data.target
        if (!Array.isArray(targets)) { targets = [targets] }

        targets.forEach(target => {
            target = UTILS.URLasHTTPS(target.id ?? target['@id'] ?? target.toString())
            if (!target) { return }
            const targetEntity = EntityMap.has(target) ? EntityMap.get(target) : new Entity({ id: target })
            targetEntity.attachAnnotation(this)
        })
    }
}

/**
     * Take a known object with an id and query for annotations targeting it.
     * Discovered annotations are asserted on the original object and returned.
     * @param {Object} entity Target object to search for description
     */
async function expand(entity = new Entity({}), matchOn) {
    let findId = entity.data["@id"] ?? entity.data.id ?? entity.data
    if (typeof findId !== "string") { return Promise.resolve(entity.data) }
    let obj = fetch(findId).then(res => res.json()).then(res => Object.assign(entity.data, res))
    let annos = findByTargetId(findId, [], DEER.URLS.QUERY).then(res => res.map(anno => new Annotation(anno)))
    await Promise.all([obj, annos]).then(res => {
        annos = res[1]
        obj = res[0]
    })
    annos.forEach(a => a.assertOn(entity.data, matchOn))
    return entity.data
}

/**
 * Extracts the value of an assertion.
 * @param Object assertOn target of the assertion(s).
 * @param Object annotation assertion Web Annotation.
 * @param string matchOn key to match on.
 * @returns Object with assertions value of the assertion.
 */
function applyAssertions(assertOn, annotationBody, matchOn) {
    if (Array.isArray(annotationBody)) { return annotationBody.forEach(a => applyAssertions(assertOn, a, matchOn)) }

    if (checkMatch(assertOn, annotationBody, matchOn)) { return }

    const assertions = {}
    Object.entries(annotationBody).forEach(([k, v]) => {
        if (v === undefined) { return }
        if (assertOn.hasOwnProperty(k) && assertOn[k] !== undefined && assertOn[k] !== null && assertOn[k] !== "" && assertOn[k] !== []) {
            Array.isArray(assertions[k]) ? assertions[k].push(v) : assertions[k] = [v]
        } else {
            assertions[k] = v
        }
    })

    // Simplify any arrays of length 1, which may not be a good idea.
    Object.entries(assertions).forEach(([k, v]) => { if (Array.isArray(v) && v.length === 1) { v = v[0] } })

    return Object.assign(assertOn, assertions)
}

/**
 * Match on criteria(if exists) and return true if it appears to match on the values specified.
 * A true result means that the incoming assertion is likely to be relevant and authorized to 
 * augment the original object.
 * TODO: consider moving this up in scope, if useful
 * @param Object o existing Object with values to check.
 * @param Object a asserting Annotation to compare.
 * @param Array<String> matchOn dot-separated property paths on the two Objects to compare.
 * @returns Boolean if annotation should be considered a replacement for the current value.
 **/
function checkMatch(expanding, asserting, matchOn = ["__rerum.generatedBy", "creator"]) {
    for (const m of matchOn) {
        let obj_match = m.split('.').reduce((o, i) => o?.[i], expanding)
        let anno_match = m.split('.').reduce((o, i) => o?.[i], asserting)
        if (obj_match === undefined || anno_match === undefined) {
            // Matching is not violated if one of the checked values is missing from a comparator,
            // but it is not a match without any positive matches.
            continue
        }
        // check for match within Arrays as well
        if (!Array.isArray(obj_match)) { obj_match = [obj_match] }
        if (!Array.isArray(anno_match)) { anno_match = [anno_match] }
        if (!anno_match.every(item => obj_match.includes(item))) {
            // Any mismatch (generous typecasting) will return a false result.
            if (anno_match.some(item => obj_match.includes(item))) {
                // NOTE: this mismatches if some of the Anno assertion is missing, which
                // may lead to duplicates downstream.
                // TODO: ticket this as an issue...
                console.warn("Incomplete match may require additional handling. ", obj_match, anno_match)
            }
            break
        } else {
            // High confidence this match is affirmative, continue checking others.
            return true
        }
    }
    return false
}

function objectMatch(o1 = {}, o2 = {}) {
    const keys1 = Object.keys(o1)
    const keys2 = Object.keys(o2)
    if (keys1.length !== keys2.length) { return false }
    for (const k of keys1) {
        const val1 = o1[k]
        const val2 = o2[k]
        const recurseNeeded = isObject(val1) && isObject(val2);
        if ((recurseNeeded && !objectMatch(val1, val2))
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
     * Execute query for any annotations in RERUM which target the
     * id passed in. Promise resolves to an array of annotations.
     * @param {String} id URI for the targeted entity
     * @param [String] targetStyle other formats of resource targeting.  May be null
     */
async function findByTargetId(id, targetStyle = [], queryUrl = DEER.URLS.QUERY) {
    if (!Array.isArray(targetStyle)) {
        targetStyle = [targetStyle]
    }
    targetStyle = targetStyle.concat(["target", "target.@id", "target.id"]) //target.source?
    let historyWildcard = { "$exists": true, "$size": 0 }
    let obj = { "$or": [], "__rerum.history.next": historyWildcard }
    for (let target of targetStyle) {
        //Entries that are not strings are not supported.  Ignore those entries.  
        //TODO: should we we let the user know we had to ignore something here?
        if (typeof target === "string") {
            let o = {}
            o[target] = UTILS.httpsIdArray(id)
            obj["$or"].push(o)
        }
    }
    let matches = await fetch(queryUrl, {
        method: "POST",
        body: JSON.stringify(obj),
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .catch((err) => console.error(err))
    return matches
}

/**
 * Regularizes assertions on expanded objects to enforce the existence of a `source` key.
 * The return is only the value of the assertion, so the desired key must be applied upstream
 * from the scope of this function.
 * @param any val asserted value of the incoming annotation.
 * @param Object fromAnno parent annotation of the asserted value, as a handy metadata container.
 * @returns Object with `value` and `source` keys.
 */
function buildValueObject(val, fromAnno) {
    let valueObject = {}
    valueObject.source = val.source || {
        citationSource: fromAnno["@id"] || fromAnno.id,
        citationNote: fromAnno.label || fromAnno.name || "Composed object from DEER",
        comment: "Learn about the assembler for this object at https://github.com/CenterForDigitalHumanities/deer"
    }
    valueObject.value = val.value || UTILS.getValue(val)
    valueObject.evidence = val.evidence || fromAnno.evidence || ""
    return valueObject
}

export { EntityMap, Entity, Annotation, objectMatch }

