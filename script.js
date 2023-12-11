let db;

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open("myDB", 1);

    request.onerror = function(event) {
      reject(new Error("Ошибка при открытии базы данных"));
    };

    request.onsuccess = function(event) {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      const objectStore = db.createObjectStore("tableName", { keyPath: "id", autoIncrement: true });
      objectStore.createIndex("column1", "column1", { unique: false });
      objectStore.createIndex("column2", "column2", { unique: false });
    };
  });
}

async function updateTable() {
  const transaction = db.transaction(["tableName"], "readonly");
  const objectStore = transaction.objectStore("tableName");
  const table = document.getElementById("myTable");
  table.innerHTML = '';

  const cursor = await objectStore.openCursor();

  cursor.onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      const row = table.insertRow();
      row.insertCell(0).textContent = cursor.value.column1;
      row.insertCell(1).textContent = cursor.value.column2;
      const key = cursor.primaryKey;

      const input = document.createElement("input");
      input.type = "text";
      input.value = key;
      row.insertCell(2).appendChild(input);

      const editButtonCell = row.insertCell();
      addEditButton(editButtonCell, key);

      const deleteButtonCell = row.insertCell();
      addDeleteButton(deleteButtonCell, key);

      cursor.continue();
    }
  };
}

async function saveItem() {
  const column1Val = document.getElementById("inputColumn1").value;
  const column2Val = document.getElementById("inputColumn2").value;

  const transaction = db.transaction(["tableName"], "readwrite");
  const objectStore = transaction.objectStore("tableName");
  const newItem = { column1: column1Val, column2: column2Val };

  try {
    const request = await objectStore.add(newItem);
    alert("Запись успешно добавлена");
    updateTable();
  } catch (error) {
    alert("Ошибка при добавлении записи");
  }
}

async function updateItem(key) {
  const column1Val = prompt("Введите новое значение для колонки 1:");
  const column2Val = prompt("Введите новое значение для колонки 2:");

  const transaction = db.transaction(["tableName"], "readwrite");
  const objectStore = transaction.objectStore("tableName");

  const request = objectStore.get(key);

  request.onsuccess = function(event) {
    const data = event.target.result;
    if (data) {
      data.column1 = column1Val || data.column1;
      data.column2 = column2Val || data.column2;

      const updateRequest = objectStore.put(data);

      updateRequest.onsuccess = function(event) {
        alert("Запись успешно обновлена");
        updateTable();
      };
    }
  };
}

async function deleteItem(key) {
  const transaction = db.transaction(["tableName"], "readwrite");
  const objectStore = transaction.objectStore("tableName");

  const request = objectStore.delete(key);

  request.onsuccess = function(event) {
    alert("Запись успешно удалена");
    updateTable();
  };

  request.onerror = function(event) {
    alert("Ошибка при удалении записи");
  };
}

const addEditButton = (row, key) => {
  const button = document.createElement("button");
  button.innerText = "Изменить";
  button.onclick = function() {
    updateItem(key);
  };
  row.appendChild(button);
};

const addDeleteButton = (row, key) => {
  const button = document.createElement("button");
  button.innerText = "Удалить";
  button.onclick = function() {
    deleteItem(key);
  };
  row.appendChild(button);
};

openDatabase().then(() => {
  updateTable();
});
