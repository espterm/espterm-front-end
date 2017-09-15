if (!('EventEmitter' in window)) {
  window.EventEmitter = class EventEmitter {
    constructor () {
      this._listeners = {}
    }

    /**
     * Bind an event listener to an event
     * @param {string} event - the event name
     * @param {Function} listener - the event listener
     */
    on (event, listener) {
      if (!this._listeners[event]) this._listeners[event] = []
      this._listeners[event].push({ listener })
    }

    /**
     * Bind an event listener to be run only once the next time the event fires
     * @param {string} event - the event name
     * @param {Function} listener - the event listener
     */
    once (event, listener) {
      if (!this._listeners[event]) this._listeners[event] = []
      this._listeners[event].push({ listener, once: true })
    }

    /**
     * Remove an event listener
     * @param {string} event - the event name
     * @param {Function} listener - the event listener
     */
    off (event, listener) {
      let listeners = this._listeners[event]
      if (listeners) {
        for (let i in listeners) {
          if (listeners[i].listener === listener) {
            listeners.splice(i, 1)
            break
          }
        }
      }
    }

    /**
     * Emits an event
     * @param {string} event - the event name
     * @param {...any} args - arguments passed to all listeners
     */
    emit (event, ...args) {
      let listeners = this._listeners[event]
      if (listeners) {
        let remove = []
        for (let listener of listeners) {
          try {
            listener.listener(...args)
            if (listener.once) remove.push(listener)
          } catch (err) {
            console.error(err)
          }
        }

        // this needs to be done in this roundabout way because for loops
        // do not like arrays with changing lengths
        for (let listener of remove) {
          listeners.splice(listeners.indexOf(listener), 1)
        }
      }
    }
  }
}
