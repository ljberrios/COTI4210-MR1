const list = document.querySelector("ul");
const titleInput = document.querySelector("#title");
const bodyInput = document.querySelector("#body");
const form = document.querySelector("form");
const submitBtn = document.querySelector("form button");

let db;

// Call database code after app has
// completely finished loading
window.onload = function () {
  // Open database version 1 called 'notes_db'
  // It gets created if it doesn't already exist
  // You would increase the version number if you were
  // to upgrade the database. This tutorial execise won't
  // cover upgrading databases.
  // On another note, this request is called asynchronously
  // by default.
  let request = window.indexedDB.open("notes_db", 1);

  // Called if database doesn't open successfully
  request.onerror = function () {
    console.log("Database failed to open");
  };

  // Called if database opens successfully
  request.onsuccess = function () {
    console.log("Database opened successfully");

    // Store opened database
    db = request.result;

    // Display notes already in the IDB
    displayData();
  };

  // Setup the database tables if this has not already
  // been done (define the schema of our database)
  request.onupgradeneeded = function (e) {
    // Grab a reference to the opened database
    // This needs to be done separately because
    // onupgradeneeded (if needed) will run before
    // onsucess, meaning that the 'db' value wouldn't be
    // available if we didn't do this
    let db = e.target.result;

    // Create an objectStore to store our notes in
    // (basically like a single table) including an
    // auto-incrementing key
    let objectStore = db.createObjectStore("notes_os", {
      keyPath: "id",
      autoIncrement: true,
    });

    // Define what data items the objectStore will contain
    objectStore.createIndex("title", "title", { unique: false });
    objectStore.createIndex("body", "body", { unique: false });

    console.log("Database setup complete");
  };

  form.onsubmit = addData;

  function addData(e) {
    // we don't want the form to submit in the conventional way
    e.preventDefault();

    // grab the values entered into the form fields and
    // store them in an object ready to be inserted into
    // the database
    let newItem = { title: titleInput.value, body: bodyInput.value };

    // open a read/write database transaction against the
    // notes_os object store, ready for adding the data
    // this allows us to access the object store
    let transaction = db.transaction(["notes_os"], "readwrite");

    // Call an object store that's already been added
    // to the database
    let objectStore = transaction.objectStore("notes_os");

    // Make a request to add our newItem object to the
    // object store
    var request = objectStore.add(newItem);
    request.onsucess = function () {
      // Clear the form, ready for adding the next entry
      titleInput.value = "";
      bodyInput.value = "";
    };

    // Report on the success of the transaction completing,
    // when everything is done
    transaction.oncomplete = function () {
      console.log("Transaction completed: database modification finished");

      // Update the display of data to show the newly added
      // item, by running displayData() again
      displayData();
    };

    transaction.onerror = function () {
      console.log("Transaction not opened due to error");
    };
  }

  function displayData() {
    // Here we empty the contents of the list element each
    // time the display is updated
    // If you don't do this, you'd get duplicates listed
    // each time a new note is added
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    // Open our object store and then get a cursor which
    // iterates through all the different data items in
    // the store
    // A cursor is a construct that can be used to
    // iterate over the records in an object store
    // (Note the chaining of functions here)
    let objectStore = db.transaction("notes_os").objectStore("notes_os");
    // Called when the cursor is successfully returned
    objectStore.openCursor().onsuccess = function (e) {
      // Get a reference to the cursor
      let cursor = e.target.result;

      // If there's still another data item to iterate
      // through, keep running this code
      // (check to see if the cursor contains a record
      // from the datastore)
      if (cursor) {
        const listItem = document.createElement("li");
        const h3 = document.createElement("h3");
        const para = document.createElement("p");

        listItem.appendChild(h3);
        listItem.appendChild(para);
        list.appendChild(listItem);

        // Put the data from the cursor inside the h3
        // and para
        h3.textContent = cursor.value.title;
        para.textContent = cursor.value.body;

        // Store the ID of the data items inside an attribute
        // on the listItem, so we know which item it
        // corresponds to. This will be useful later when
        // we want to delete items.
        listItem.setAttribute("data-note-id", cursor.value.id);

        // Create and a button and place it inside each
        // listItem
        const deleteBtn = document.createElement("button");
        listItem.appendChild(deleteBtn);
        deleteBtn.textContent = "Delete";

        // Set an event handler so that when the button is
        // clicked, the deleteItem function is run
        deleteBtn.onclick = deleteItem;

        // Iterate to the next item in the cursor
        cursor.continue();
      } else {
        if (!list.firstChild) {
          const listItem = document.createElement("li");
          listItem.textContent = "No notes stored.";
          list.appendChild(listItem);
        }
        // if there are no more cursor items to iterate
        // through, say so
        console.log("Notes all displayed");
      }
    };
  }

  function deleteItem(e) {
    // Retrieve the name of the task we want to delete. We
    // need to convert it to a number before trying to use it
    // with IDB; IDB key values are type-sensitive.
    let noteId = Number(e.target.parentNode.getAttribute("data-note-id"));

    let transaction = db.transaction(["notes_os"], "readwrite");
    let objectStore = transaction.objectStore("notes_os");
    let request = objectStore.delete(noteId);

    // Report that the data item has been deleted
    transaction.oncomplete = function () {
      // Delete the parent of the button
      // which is the list item, so it is no longer displayed
      e.target.parentNode.parentNode.removeChild(e.target.parentNode);
      console.log("Note " + noteId + " deleted.");

      // Again, if list item is empty, display a
      // 'No notes stored' message
      if (!list.firstChild) {
        let listItem = document.createElement("li");
        listItem.textContent = "No notes stored.";
        list.appendChild(listItem);
      }
    };
  }
};
