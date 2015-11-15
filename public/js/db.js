
var app = app || {}

app.db = new PouchDB('my-db');

/*
app.db.createIndex({
  index: {
    fields: ['index']
  }
}).then(function (result) {
  // yo, a result
  console.log(result)
}).catch(function (err) {
  console.log(err)
  // ouch, an error
});
*/


$('#delete-db').on('click', function() {
  app.db.destroy().then(function() {
    console.log("db deleted")
  }).catch(function(err) {
    console.log(err)
  })
})

//

$('#count').on('click', function() {
  app.db.allDocs().then(function(response){
      console.log(response.rows.length)
  }).catch(function(err){
      console.log(err)
  })
})

/*
db.destroy().then(function(resp) {
    console.log(resp)
}).catch(function(err){
    console.log(err)
})
*/
/*
$('#get-doc').on('click', function() {
  db.get('5643b80b02725e716f3b5561').then(function(response){
      console.log(response)
  }).catch(function(err){
      console.log(err)
  })
});
*/
/*
db.put({
    _id: 'mydoc',
    title: 'this is my doc'
}).then(function(response) {
    console.log(response)
}).catch(function(err){
    console.log(err)
})
*/
/*
db.get('myDoc').then(function(doc) {
    return db.put({
        _id: 'myDoc',
        _rev: doc._rev,
        title: 'check it out'
    })
}).then(function(response) {
    console.log(response)
}).catch(function(err) {
    console.log(err)
})


db.get('mydoc').then(function(doc) {
    console.log(doc);
}).catch(function(err){
    console.log(err)
})
*/
$('#bulk-add').on('click', function() {
  $.ajax({
    url: 'olddata/data2.json',
    success: function(response) {
          app.db.bulkDocs(response).then(function(response) {
            console.log("done");

          }).catch(function(err){
              console.log(err)
          })
    },
    error: function(err) {
      console.log(err)
    }
  })
})



/*
db.remove('mydoc').then(function(response){
    console.log(response)
}).catch(function(err) {
    console.log(err)
})
*/
