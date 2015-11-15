var app = app || {}

app.ViewModel = function() {
  var self = this;

  self.indexMin = 0;
  self.indexMax = 0;
  self.records = ko.observableArray();

  self.getDoc = function() {
      app.db.get('5643b80b02725e716f3b5561').then(function(response){
          self.records([response]);
      }).catch(function(err){
          console.log(err);
      });
  };

  self.syncDoc = function( doc ) {
    self.removeDoc( doc._id );
        app.db.get(doc._id).then(function(origDoc) {
          doc._rev = origDoc._rev;
          self.records.push( doc );
          return app.db.put(doc);
        }).catch(function(err) {
          if (err.status === 409) {
            return self.syncDoc(doc);
          } else { // new doc
            self.records.push( doc );
            return app.db.put(doc);
          }
        });
  }

  self.updateDoc = function( doc ) {
    app.socket.emit( 'docUpdate', doc );
  };

  self.removeDoc = function( docId ) {
    for ( var i=0, len = self.records().length - 1; i < len; i++ ) {
      if ( self.records()[i]._id === docId ) {
        self.records.remove( self.records()[i] );
        break;
      }
    }
  };

  self.find = function() {
    app.db.find({
      selector: {
        index: { $gt: 1, $lt: 20 }
      }
    }).then(function (result) {
      var docs = result.docs;

      self.indexMin = docs[0].index;
      self.indexMax = docs[docs.length - 1].index;
      self.records(docs);
    }).catch(function (err) {
      console.log(err)
    });
  };

  self.previousRecs = function() {
    app.db.find({
      selector: {
        index: { $gt: self.indexMin - 20, $lt: self.indexMin }
      }
    }).then(function (result) {
      var docs = result.docs;
      self.indexMin = docs[0].index;
      self.indexMax = docs[docs.length - 1].index;
      self.records(docs);
    }).catch(function (err) {
      console.log(err)
    });
  };

  self.nextRecs = function() {
    app.db.find({
      selector: {
        index: { $gt: self.indexMax, $lt: self.indexMax + 20 }
      }
    }).then(function (result) {
      var docs = result.docs;
      self.indexMin = docs[0].index;
      self.indexMax = docs[docs.length - 1].index;
      self.records(docs);
    }).catch(function (err) {
      console.log(err)
    });
  };

};

app.viewModel = new app.ViewModel();

app.socket = io();
app.socket.on('updatedDoc', function( doc ) {
    app.viewModel.syncDoc( doc );
})

ko.applyBindings( app.viewModel );
