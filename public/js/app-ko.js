var app = app || {}

app.ViewModel = function() {
  var self = this;

  self.bulkUploadTime = ko.observable(0);
  self.bulkUploadCount  = ko.observable(0);
  self.indexTime = ko.observable(0);
  self.queryTime = ko.observable(0);
  self.queryCount  = ko.observable(0)

  self.maxTblRows = 30;
  self.indexMin = 0;
  self.indexMax = 0;
  self.records = ko.observableArray();

  self.getDocs = function( min, max ) {
    min = min || 0;
    max = max || self.maxTblRows;

    var startTime = +new Date();

    app.db.find({
      selector: {
        index: { $gt: min, $lt: max }
      }
    }).then(function (result) {
      var endTime = +new Date(),
          docs = result.docs,
          docsLen = docs.length;

      self.queryTime( (endTime - startTime) / 1000 );
      self.queryCount( docsLen );

      self.indexMin = docs[0].index;
      self.indexMax = docs[docsLen - 1].index;
      self.records(docs);
    }).catch(function (err) {
      console.log(err)
    });
  }

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

  self.initDocs = function() {
    self.getDocs();
  };

  self.previousRecs = function() {
    self.getDocs( self.indexMin - self.maxTblRows, self.indexMin );
  };

  self.nextRecs = function() {
    self.getDocs( self.indexMax, self.indexMax + self.maxTblRows );
  };

  self.countDocs = function() {
    app.db.allDocs().then(function(response){
      console.log(response.rows.length)
    }).catch(function(err){
      console.log(err)
    })
  };

  self.addAllDocs = function() {
    app.db.allDocs().then(function(response){
      if ( response.rows.length < 10000 ) {
        var data1 = $.ajax( "olddata/data1.json" ),
            data2 = $.ajax( "olddata/data2.json" );

        $.when( data1, data2 ).then( function( resp1, resp2 ) {
            var allDocs = resp1[0].concat(resp2[0]),
                startTime = +new Date();

            app.db.bulkDocs( allDocs ).then(function( response ) {
              var endTime = +new Date();
              self.bulkUploadTime( (endTime - startTime) / 1000 );
              self.bulkUploadCount( response.length )
              console.log('all docs inserted');

              var indexStartTime = +new Date();
              app.db.createIndex({
                index: {
                  fields: ['index']
                }
              }).then(function (result) {
                var endTime = +new Date();
                self.indexTime( (endTime - indexStartTime) / 1000 );
                console.log('index created')

              }).catch(function (err) {
                console.log(err)
                // ouch, an error
              });

            }).catch(function(err){
              console.log(err)
            });
        }).fail( function( xhr, err, status ) {
          console.log(err + ': ' + status)
        });
      } else {
        console.log('already over 100000 docs')
      }
    }).catch(function(err){
      console.log(err)
    })
  };

  self.deleteDb = function() {
    app.db.destroy().then(function() {
      console.log("db deleted")
    }).catch(function(err) {
      console.log(err)
    })
  }

};

app.db = new PouchDB('my-db');

app.viewModel = new app.ViewModel();

app.socket = io();
app.socket.on('updatedDoc', function( doc ) {
    app.viewModel.syncDoc( doc );
})

ko.applyBindings( app.viewModel );
