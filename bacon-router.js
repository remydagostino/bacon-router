(function (root, factory) {
  var Bacon;

  if (module && module.exports) {
    bacon = require('baconjs');
    module = factory(Bacon); 
  }
  else {
    Bacon = root.Bacon;
    root.baconRouter = factory(Bacon); 
  } 
})(this, function(Bacon) {

  return {

  };
});
