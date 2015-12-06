var app = app || {}

app.ViewModel = function() {
  var self = this;

  self.status = ko.observable(null);
  self.status.subscribe(function( val ) {
    if( val ) {
      $('#msgModal').modal('show');
    } else {
      $('#msgModal').modal('hide');
    }

  })

  self.bulkUploadTime = ko.observable(0);
  self.bulkUploadCount  = ko.observable(0);
  self.indexTime = ko.observable(0);
  self.queryTime = ko.observable(0);
  self.queryCount  = ko.observable(0);

  self.getOptions = { include_docs: true, limit: 5, descending : false };
  self.records = ko.observableArray([]);

  self.nameSearch = ko.observable();
  self.nameSearch.subscribe(function( term ) {
    self.search( term, { name: { $eq: term } } );
  });

  self.search = function( term, searchSelector ) {

    if ( term.length > 2 ) {
      app.db.find({
        selector: searchSelector
      }).then(function( result ) {
        if ( result.docs.length ) {
          self.records( result.docs );
        }
      }).catch(function(err) {
        console.log(err)
      });
    } else if ( !term ) {
      self.getDocs();
    }

  };

  self.getDocs = function( descending ) {
    var descending = descending === true ? true : false;
    var startTime = +new Date();

    self.getOptions.descending = descending;

    app.db.allDocs(self.getOptions, function (err, response) {

        if (response && response.rows.length > 0) {
          self.getOptions.skip = 1;

          if ( !descending ) {
              self.getOptions.startkey = response.rows[response.rows.length - 1].id;
              self.end = response.rows[0].id
              self.getOptions.descending = false;
          } else {
            self.end = response.rows[response.rows.length - 1].id;
            self.getOptions.startkey = self.end;
            self.getOptions.descending = true;
          }

          var endTime = +new Date();
          self.queryTime( (endTime - startTime) / 1000 );
          self.queryCount( response.rows.length );

          var docs = [];
          for ( var i = 0, len = response.rows.length; i < len; i++ ) {
            docs.push( response.rows[i].doc )
          }

          if ( descending ) {
            docs.reverse();
          }
          self.records(docs);
          self.status(null);

        }

        if ( err  ) {
          self.status('Problem Getting Records...')
          setTimeout(function() {
            self.status(null)
          }, 3000)
          console.log(err)
        }

      });

  }

  self.syncDoc = function( doc ) {
    var oldDoc = doc;
        app.db.get(doc._id).then(function(origDoc) {
          doc._rev = origDoc._rev;
          self.replaceDoc( oldDoc._id, doc );
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

  self.replaceDoc = function( oldDocId, newDoc ) {
    for ( var i=0, len = self.records().length - 1; i < len; i++ ) {
      if ( self.records()[i]._id === oldDocId ) {
        self.records.replace( self.records()[i], newDoc );
        break;
      }
    }
  };

  self.initDocs = function() {
    self.status('Getting Records...');
    self.getDocs();
  };

  self.previousRecs = function() {
    self.getDocs( true );
  };

  self.nextRecs = function() {
    self.getDocs( false );
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
        self.status('Getting JSON...')
        $.when( data1, data2 ).then( function( resp1, resp2 ) {

            var allDocs = resp1[0].concat(resp2[0]),
                startTime = +new Date();

            self.status('Adding Records...')
            app.db.bulkDocs( allDocs ).then(function( response ) {
              var endTime = +new Date();
              self.bulkUploadTime( (endTime - startTime) / 1000 );
              self.bulkUploadCount( response.length )

              var indexStartTime = +new Date();
              self.status('Creating Secondary Index...')
              app.db.createIndex({
                index: {
                  fields: ['index', 'name']
                }
              }).then(function (result) {
                var endTime = +new Date();
                self.indexTime( (endTime - indexStartTime) / 1000 );
                self.status(null);
                self.initDocs();
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
    self.status('Deleting Database...')
    app.db.destroy().then(function() {
      self.status(null);
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

app.viewModel.initDocs();
