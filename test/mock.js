var test = require('tape'),
    baconRouter = require('../bacon-router'),
    MockWindow;

// Stupid mock window implementation
var MockWindow = function() {
  this.observers = [];
};

MockWindow.prototype.addEventListener = function(name, fn) {
  this.observers.push(fn);
};

MockWindow.prototype.removeEventListener = function(name, fn) {
  var index = this.observers.indexOf(fn);

  if (index > -1) {
    this.observers.splice(index, 1);
  }
};

MockWindow.prototype.pushUrl = function(url) {
  this.observers.forEach(function(obs) {
    obs({
      newUrl: 'http://blahblah.com/#/' + url
    });
  });

  return this;
};


test('Basic Router Setup', function(t) {
  var mockWindow = new MockWindow(),
      valueList  = [],
      errorList  = [],
      routeStream;

  routeStream = baconRouter.setup(mockWindow,
    {
      users: {
        _      : '/users',
        create : '/create'
      },
      user     : '/user/:id',
      login    : '/login'
    }
  );

  // Collect all the values into an event list
  routeStream.onValue(valueList.push.bind(valueList));
  routeStream.onError(errorList.push.bind(errorList));

  mockWindow
    .pushUrl('login')
    .pushUrl('users')
    .pushUrl('users/create')
    .pushUrl('users/create?name=ben_smith')
    .pushUrl('users/create?name[first]=ben&name[last]=smith')
    .pushUrl('user/42')
    .pushUrl('user/1')
    .pushUrl('user')
    .pushUrl('whoops')
    .pushUrl('login');

  t.deepEquals(
    valueList,
    [
      {
        match: '/login',
        route: 'login',
        params: {},
        query: {}
      },
      {
        match: '/users',
        route: 'users',
        params: {},
        query: {}
      },
      {
        match: '/users/create',
        route: 'users.create',
        params: {},
        query: {}
      },
      {
        match: '/users/create?name=ben_smith',
        route: 'users.create',
        params: {},
        query: { name: 'ben_smith' }
      },
      {
        match: '/users/create?name[first]=ben&name[last]=smith',
        route: 'users.create',
        params: {},
        query: { name: { first: 'ben', last: 'smith' } }
      },
      {
        match: '/user/42',
        route: 'user',
        params: { id: '42' },
        query: {}
      },
      {
        match: '/user/1',
        route: 'user',
        params: { id: '1' },
        query: {}
      },
      {
        match: '/login',
        route: 'login',
        params: {},
        query: {}
      }
    ],
    'Caught all successful routes'
  );

  t.deepEquals(
    errorList,
    [
      { path: '/user' },
      { path: '/whoops' }
    ],
    'Caught all failed routes'
  );

  t.end();
});
