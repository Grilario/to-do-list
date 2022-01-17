const btnAddToDo = document.getElementById("add-to-do");
const toDoContainer = document.getElementById("to-do-list");

toDoContainer.addEventListener("click", (e) => {
  const nodeName = e.target.nodeName;
  const toDo = e.target.parentElement;

  if (nodeName === "BUTTON") {
    deleteToDo(toDo);
    return;
  }

  const isCheckBox =
    nodeName === "DIV" && e.target.classList.contains("checkbox");
  if (isCheckBox) {
    const toDo = e.target.parentNode;
    toDo.classList.contains("check")
      ? toDo.classList.remove("check")
      : toDo.classList.add("check");

    saveToDo(toDo);
  }
});

toDoContainer.addEventListener("input", (e) => {
  const toDo = e.target.parentNode;
  saveToDo(toDo);
});

btnAddToDo.addEventListener("click", () => {
  createNewToDo();
});

function connectionToDatabase() {
  //Event handling .connected - @param IDBObjectStore
  const events = {
    connected() {},
  };

  const dbConnection = indexedDB.open("toDoList");
  dbConnection.onupgradeneeded = (e) => {
    const db = e.target.result;

    const objectStore = db.createObjectStore("toDoList", { keyPath: "uuid" });

    objectStore.createIndex("date", "date", { unique: false });
  };

  dbConnection.onsuccess = (e) => {
    const db = e.target.result;
    const toDoList = db
      .transaction("toDoList", "readwrite")
      .objectStore("toDoList");

    events.connected(toDoList);
  };

  return events;
}

function saveToDo(toDo) {
  connectionToDatabase().connected = (toDoList) => {
    const uuid = toDo.getAttribute("uuid");
    const isCheck = toDo.classList.contains("check");
    const text = toDo.childNodes[1].textContent;

    toDoList.get(uuid).onsuccess = (e) => {
      const date = e.target.result.date;
      toDoList.put({ uuid, isCheck, text, date });
    };
  };
}

function createNewToDo() {
  connectionToDatabase().connected = (toDoList) => {
    const request = toDoList.add({
      uuid: generateUUID(),
      isCheck: false,
      text: "",
      date: Date.now(),
    });
    request.onsuccess = () => {
      const uuid = request.result;
      renderToDo({ uuid });
    };
  };
}

function deleteToDo(toDo) {
  connectionToDatabase().connected = (toDoList) => {
    const uuid = toDo.getAttribute("uuid");
    const request = toDoList.delete(uuid);
    request.onsuccess = () => {
      toDo.remove();
    };
  };
}

function renderToDo({ uuid, isCheck, text }) {
  const toDo = document.createElement("div");
  toDo.classList.add("to-do");
  toDo.setAttribute("uuid", uuid);
  isCheck && toDo.classList.add("check");

  const checkBox = document.createElement("div");
  checkBox.innerHTML = '<svg><use xlink:href="#icon-check" /></svg>';
  checkBox.classList.add("checkbox");

  const content = document.createElement("p");
  content.setAttribute("contenteditable", true);
  content.textContent = text;

  const btnDelete = document.createElement("button");
  btnDelete.classList.add("btn-delete-to-do");
  btnDelete.innerHTML = '<svg><use xlink:href="#icon-delete" /></svg>';

  toDo.append(checkBox, content, btnDelete);
  toDoContainer.insertBefore(toDo, toDoContainer.firstElementChild);

  !text && content.focus();
}

document.addEventListener("DOMContentLoaded", () => {
  connectionToDatabase().connected = (toDoList) => {
    const dateIndex = toDoList.index("date");
    const request = dateIndex.getAll();
    request.onsuccess = () => {
      const toDos = request.result;
      toDos.forEach((toDo) => {
        renderToDo(toDo);
      });
    };
  };
});

function generateUUID() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}
