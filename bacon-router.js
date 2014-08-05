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
      patternParts,
      dissectPattern,
      escapeRegExp,
      parseQueryString,
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
  // :: Window -> EventStream
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
  // :: Window -> object -> EventStream
  setupRouter = function(win, routes) {
    return getHashEventStream(win)
    .flatMap(function(url) {
      return Bacon.never();
    });
  };


  // :: string -> [string]
  patternParts = function(pattern) {
    var matcher = /\/?([^\/]+)/g,
        match   = matcher.exec(pattern),
        parts   = [];

    while (match != null) {
      parts.push(match[1]);
      match = matcher.exec(pattern);
    }

    return parts;
  };

  // :: string -> object
  dissectPattern = function(pattern) {
    var parts   = patternParts(pattern),
        params  = [],
        matcher;

    // Build up the regular expression out of the parts
    matcher = parts.reduce(function(memo, part) {
      memo += '\\/';

      if (part[0] === ':') {
        memo += '([^\\/]*?)';
        params.push(part.slice(1));
      }
      else if (part.indexOf('*') > -1) {
        memo += escapeRegExp(part).replace(/\\\*/g, '.*');
      }
      else {
        memo += escapeRegExp(part);
      }

      return memo;
    }, '');

    // Append the query matcher to the end
    matcher += '(\\?.*)?$'

    return {
      params: params,
      matcher: RegExp(matcher, 'i')
    };
  };

  // :: string -> string -> object
  matchRoute = function(pattern, hashPart) {
    var sig = dissectPattern(pattern),
        result, query, params;

    result = sig.matcher.exec(hashPart);

    if (!result) {
      return null;
    }
    else {
      params = sig.params.reduce(function(memo, param, index) {
        memo[param] = result[index + 1];
        return memo;
      }, {});

      return {
        match: hashPart,
        params: params,
        query: {}
      };
    }
  };

  // :: string -> string -> EventStream

  // Generic regex string escaper
  // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
  escapeRegExp = function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  };

  return {
    asEventStream  : getHashEventStream,
    setup          : setupRouter,
    matchRoute     : matchRoute,
    patternParts   : patternParts,
    dissectPattern : dissectPattern
  };
});
