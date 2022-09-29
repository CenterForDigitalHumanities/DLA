/**
 * A disconnected target for pubsub events used to update the DOM.
 * Replaces `document` in most cases and creates a sandbox for DEER events.
 */

const NoticeBoard = new EventTarget()
const {default:{EVENTS:{NEW_VIEW:VIEW}}} = await import('./deer-config.js')

Object.assign(NoticeBoard, {
    /**
     * Request DEER begin loading a new entity, typically from a "deer-id" attribute.
     * @param {URL} id HTTP(S) URL of the resource to be loaded for rendering
     * @returns undefined
     */
    request: (id) => NoticeBoard.publish(VIEW,{id}),
    /**
     * Send a general notice to all subscribers. Used for actions like "update" and "complete".
     * @param {String} eventType URI of the entity to be broadcast or status of the transaction
     * @param {String, Object} eventPayload Relevant data based on the {action} of the notice
     */
    publish: (eventType,eventPayload) => {
        const msg = new CustomEvent(eventType, { detail: eventPayload }) //TODO: ? for HTTPS insensitivity?
        NoticeBoard.dispatchEvent(msg)
    },
    /**
     * Register a callback function to be called when a specific event is published. Elements 
     * should use this to register themselves for updates. Remember to .bind(this) when 
     * using the element's own methods as callbacks. `type` is often the "deer-id" attribute.
     * @param  {...any} args Passthrough for EventTarget.addEventListener
     * @returns undefined
     */
    subscribe: (...args) => NoticeBoard.addEventListener(...args),
    /**
     * Unload listener from memory. Prevents additional calls to the callback.
     * @param  {...any} args Passthrough for EventTarget.removeEventListener
     * @returns undefined
     */
    unsubscribe: (...args) => NoticeBoard.removeEventListener(...args),
})

export default NoticeBoard
