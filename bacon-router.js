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
      matchRouteStream,
      hashchange,
      patternParts,
      dissectPattern,
      escapeRegExp,
      parseQueryString,
      // ... State
      subscribers,
      // ... Utility
      isPlainObject,
      matchAll,
      map;

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
      var stream = Bacon.never();

      // Concatenate all of the routes
      map(routes, function(pair) {
        if (typeof pair.v === 'string') {
          console.log('matched!!: ', matchRouteStream(pair.v, url));

          stream = stream.merge(
            matchRouteStream(pair.v, url)
            .map(function(ev) {
              console.log('what am I?',  ev);
              ev.route = pair.k;
              return ev;
            })
          );
        }
      });

      return stream;
    });
  };

  // Pure utility function, matches a regex repeatedly
  // until it finishes parsing a string.
  // Note - Regex's are stateful, always pass a fresh
  // regex into this function
  // Note - This function can get stuck in an infinite
  // loop if the required regex can match on 0 characters
  // :: string -> RexExp -> [[string]]
  matchAll = function(matcher, pattern) {
    var match   = matcher.exec(pattern),
        parts   = [];

    while (match != null) {
      parts.push(match.slice(1));
      match = matcher.exec(pattern);
    }

    return parts;
  };

  // :: a -> Bool
  isPlainObject = function(maybeObj) {
    return Object.prototype.toString.call(maybeObj) === '[object Object]';
  };

  // :: Functor f => f a -> (a -> b) -> f b
  map = function(v, f) {
    var result, prop;

    // Test null/undefined
    if (v == null) {
      return v;
    }

    // Functors provide their own map
    if (typeof v.map === 'function') {
      return v.map(f);
    }

    // Handle objects for free
    if (isPlainObject(v)) {
      result = {};

      for (prop in v) {
        if (v.hasOwnProperty(prop)) {
          result[prop] = f({ v: v[prop], k: prop });
        }
      }

      return result;
    }
    else {
      return v;
    }
  };


  // Returns each of the bits in-between the forward slashes
  // of a URL string
  // :: string -> [string]
  patternParts = function(pattern) {
    return matchAll(/\/?([^\/]+)/g, pattern)
    .map(function(v) {
      return v[0];
    });
  };

  // Evaluates a url pattern and computes a regex that can
  // parse it as well as an array of the names of the matched
  // patterns in the regex.
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

  // Parses the query string component of a url and
  // returns a nested object of parts
  // :: string -> object
  parseQueryString = function(query) {
    var queryObj;

    // Ignore preceeding '?'
    if (query[0] === '?') {
      query = query.slice(1);
    }

    // Work through each key-value pair
    return matchAll(/([^=]*)\=([^&]*)\&?/g, query)
    .reduce(function(memo, pair) {
      var cur = memo,
          lastRef;

      // Dig into the key to find out if it is nested
      matchAll(/(?:([^\[]+)|(\[([^\]]+)\]))/g, pair[0])
      .forEach(function(match) {
        var key = match[0] || match[2];

        if (lastRef) {
          cur = cur[lastRef]
        }

        if (cur[key] == null) {
          cur[key] = {};
        }

        lastRef = key;
      });

      cur[lastRef] = pair[1];

      return memo;
    }, {});
  };

  // Accepts a pattern and a url path and either returns
  // null if the pattern doesn't match the path or an object
  // with the dynamic segments and query object if it does 
  // match
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

      query = parseQueryString(result[sig.params.length + 1] || '');

      return {
        match: hashPart,
        params: params,
        query: query
      };
    }
  };

  // Same as match route but returns a stream, either `never`
  // for no match or `once` for a match.
  // :: string -> string -> EventStream
  matchRouteStream = function(pattern, hashPart) {
    var result = matchRoute(pattern, hashPart);

    if (result === null) {
      return Bacon.never();
    }
    else {
      return Bacon.once(result);
    }
  };

  // Generic regex string escaper
  // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
  escapeRegExp = function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  };

  return {
    asEventStream    : getHashEventStream,
    setup            : setupRouter,
    matchRoute       : matchRoute,
    patternParts     : patternParts,
    dissectPattern   : dissectPattern,
    parseQueryString : parseQueryString
  };
});
