var app = app || {}

app.socket = io();

app.socket.on('updatedDoc', function(  ) {
    console.log('updated doc')
})


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

  self.updateDoc = function( doc ) {
    app.db.get(doc._id).then(function(origDoc) {
      doc._rev = origDoc._rev;
      self.records.remove( doc )
      self.records.push( doc );
      console.log(doc)
      return app.db.put(doc);
    }).catch(function(err) {
      if (err.status === 409) {
        return retryUntilWritten(doc);
      } else { // new doc
        self.records.push( doc );
        return app.db.put(doc);
      }
    });

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

  self.mockChange = function() {
    app.socket.emit( 'makeChange' );
  }

};


ko.applyBindings( new app.ViewModel() )
