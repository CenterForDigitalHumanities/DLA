/**
 * A disconnected target for pubsub events used to update the DOM.
 * Replaces `document` in most cases.
 */

const NoticeBoard = new EventTarget()
const {default:{EVENTS:{NEW_VIEW:VIEW}}} = await import('./deer-config.js')

Object.assign(NoticeBoard, {
    subscribe: (...args) => NoticeBoard.addEventListener(...args),
    publish: (eventType,eventPayload) => {
        const msg = new CustomEvent(eventType, { detail: eventPayload }) //TODO: ? for HTTPS insensitivity?
        NoticeBoard.dispatchEvent(msg)
    },
    request: (id) => NoticeBoard.publish(VIEW,{id}),
    unsubscribe: (...args) => NoticeBoard.removeEventListener(...args),
})

export default NoticeBoard
