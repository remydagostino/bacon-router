(function(w, router) {
  // Does nothing
  var myRouter = router.setup(
    window,
    {
      users: {
        _      : '/users',
        create : '/create'
      },
      about: {
        _      : '/about',
        some: {
          _    : '/some',
          thing: '/thing'
        }
      },
      user     : '/user/:id',
      login    : '/login'
    }
  ).log();

  // Should log all hash changes
  router.asEventStream(w).log();

})(window, baconRouter);
