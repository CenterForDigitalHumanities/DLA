/**
 * A disconnected target for pubsub events used to update the DOM.
 * Replaces `document` in most cases.
 */

const NoticeBoard = new EventTarget()

Object.assign(NoticeBoard, {
    subscribe: (...args) => NoticeBoard.addEventListener(...args),
    publish: (eventType,eventPayload) => {
        const msg = new CustomEvent(eventType, { detail: eventPayload }) //TODO: ? for HTTPS insensitivity?
        NoticeBoard.dispatchEvent(msg)
    },
})


export default NoticeBoard