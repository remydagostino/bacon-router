(function (root, factory) {
  var Bacon;

  if (typeof module !== 'undefined' && module.exports) {
    Bacon = require('baconjs').Bacon;
    module.exports = factory(Bacon);
  }
  else {
    Bacon = root.Bacon;
    root.baconRouter = factory(Bacon);
  }
})(this, function(Bacon) {
  "use strict";

  var getHashEventStream,
      addSubscriber,
      removeSubscriber,
      setupRouter,
      matchRoute,
      hashchange,
      subscribers;

  // Persistant State
  subscribers = [];

  // This is the global hashchange handler that is used
  hashchange = function(ev) {
    var newHash, match;

    match = /#(.*)$/.exec(ev.newUrl);

    if (match) {
      newHash = match[1];

      subscribers.forEach(function(subscriber) {
        subscriber(new Bacon.Next(newHash));
      });
    }
  };

  // Add a new subscriber to the list of observers
  addSubscriber = function(win, subscriber) {
    // If this is the first subscriber then we have to listen to
    // start listening to the hashchange event
    if (subscribers.length === 0) {
      if (win.addEventListener) {
        win.addEventListener('hashchange', hashchange, false);
      }
      else {
        win.attachEvent('onhashchange', hashchange);
      }
    }

    // Add a new observer to the list
    subscribers.push(subscriber);
  };

  // Remove a subscriber from the list of observers
  removeSubscriber = function(win, subscriber) {
    subscribers = subscribers.filter(function(v) {
      return v !== subscriber;
    });

    // If there are no subscribers left then stop listening to the
    // hash change event
    if (subscribers.length === 0) {
      if (win.removeEventListener) {
        win.removeEventListener('hashchange', hashChanged);
      }
      else {
        win.detachEvent('onhashchange', hashChanged);
      }
    }
  };

  // Returns changes in the url hash as a stream of events
  getHashEventStream = function(win) {
    return Bacon.fromBinder(function(sink) {
      addSubscriber(win, sink);

      return function() {
        removeSubscriber(sink);
      };
    });
  };

  // Creates an event stream that handes a tree of routes
  // Emits events whenever a nested route is entered or left
  // :: Window -> object -> Stream
  setupRouter = function(win, routes) {
    return getHashEventStream(win)
    .flatMap(function(url) {
      return Bacon.never();
    });
  };

  // :: string -> string -> object
  matchRoute = function(pattern, hashPart) {
    return Bacon.never();
  };

  return {
    asEventStream : getHashEventStream,
    setup         : setupRouter,
    matchRoute    : matchRoute
  };
});
