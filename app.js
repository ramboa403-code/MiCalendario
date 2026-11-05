
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
getFirestore,
collection,
addDoc,
query,
where,
onSnapshot,
updateDoc,
deleteDoc,
doc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
apiKey: "AIzaSyCQ2Fp0UStM1_RtjMQ2-TLm3Mv06Eztw04",
authDomain: "micalendario-9630e.firebaseapp.com",
projectId: "micalendario-9630e",
storageBucket: "micalendario-9630e.firebasestorage.app",
messagingSenderId: "396152301778",
appId: "1:396152301778:web:7b359f9fc4ad67b4f3650b"
};

// INICIALIZAR FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ELEMENTOS DE LA PÁGINA
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const authMessage = document.getElementById("auth-message");
let reminders = [];
let currentDate = new Date();
let unsubscribeReminders = null;

// CAMBIAR ENTRE REGISTRO E INICIO DE SESIÓN
document.getElementById("show-register").addEventListener("click", () => {
document.getElementById("login-form").classList.add("hidden");
document.getElementById("show-register").classList.add("hidden");
document.getElementById("register-form").classList.remove("hidden");
});
document.getElementById("show-login").addEventListener("click", () => {
document.getElementById("login-form").classList.remove("hidden");
document.getElementById("show-register").classList.remove("hidden");
document.getElementById("register-form").classList.add("hidden");
});

// REGISTRAR USUARIO
document.getElementById("register-form").addEventListener("submit", async (e) => {
e.preventDefault();
const email = document.getElementById("register-email").value;
const password = document.getElementById("register-password").value;

try {
await createUserWithEmailAndPassword(auth, email, password);
authMessage.textContent = "¡Cuenta creada correctamente!";
} catch (error) {
authMessage.textContent = "Error: " + error.message;
}
});

// INICIAR SESIÓN
document.getElementById("login-form").addEventListener("submit", async (e) => {
e.preventDefault();

const email = document.getElementById("login-email").value;
const password = document.getElementById("login-password").value;

try {
await signInWithEmailAndPassword(auth, email, password);
authMessage.textContent = "";
} catch (error) {
authMessage.textContent = "No se pudo iniciar sesión: " + error.message;
}
});

// CERRAR SESIÓN
document.getElementById("logout-button").addEventListener("click", async () => {
await signOut(auth);
});

// OBSERVAR EL ESTADO DEL USUARIO
onAuthStateChanged(auth, (user) => {
if (unsubscribeReminders) {
unsubscribeReminders();
unsubscribeReminders = null;
}
if (user) {
authSection.classList.add("hidden");
appSection.classList.remove("hidden");

document.getElementById("user-email").textContent = user.email;

loadReminders(user.uid);
renderCalendar();
} else {
authSection.classList.remove("hidden");
appSection.classList.add("hidden");
reminders = [];
renderCalendar();
}
});

// CARGAR RECORDATORIOS DE FIRESTORE
function loadReminders(uid) {
const remindersQuery = query(
collection(db, "reminders"),
where("userId", "==", uid)
);

unsubscribeReminders = onSnapshot(remindersQuery, (snapshot) => {
reminders = snapshot.docs.map(item => ({
id: item.id,
...item.data()
}));

reminders.sort((a, b) =>
(a.date + a.time).localeCompare(b.date + b.time)
);
renderCalendar();
renderReminders();
}, (error) => {
console.error("Error al cargar recordatorios:", error);
});
}

// GUARDAR UN NUEVO RECORDATORIO
document.getElementById("reminder-form").addEventListener("submit", async (e) => {
e.preventDefault();
const user = auth.currentUser;
if (!user) return;
const title = document.getElementById("reminder-title").value.trim();
const description = document.getElementById("reminder-description").value;
const date = document.getElementById("reminder-date").value;
const time = document.getElementById("reminder-time").value;
try {
await addDoc(collection(db, "reminders"), {
title,
description,
date,
time,
userId: user.uid,
createdAt: new Date().toISOString()
});

e.target.reset();
alert("¡Recordatorio guardado correctamente!");
} catch (error) {
alert("No se pudo guardar: " + error.message);
}
});

// MOSTRAR LOS RECORDATORIOS
function renderReminders() {
const list = document.getElementById("reminder-list");
list.replaceChildren();

if (reminders.length === 0) {
const message = document.createElement("p");
message.textContent = "Todavía no tienes recordatorios. ¡Crea el primero!";
list.appendChild(message);
return;
}

reminders.forEach(reminder => {
const card = document.createElement("div");

const title = document.createElement("h3");
title.textContent = reminder.title;

const description = document.createElement("p");
description.textContent = reminder.description || "";

const date = document.createElement("p");
date.textContent = `${reminder.date} · ${reminder.time}`;

const editButton = document.createElement("button");
editButton.textContent = "Editar";
editButton.className = "secondary";

editButton.addEventListener("click", () => editReminder(reminder));

const deleteButton = document.createElement("button");
deleteButton.textContent = "Eliminar";
deleteButton.style.marginLeft = "8px";

deleteButton.addEventListener("click", () => deleteReminder(reminder.id));

card.append(title, description, date, editButton, deleteButton);
list.appendChild(card);
});
}

// EDITAR RECORDATORIO
async function editReminder(reminder) {
const title = prompt("Nuevo nombre del evento:", reminder.title);
if (title === null || !title.trim()) return;

const description = prompt("Nueva descripción:", reminder.description || "");
if (description === null) return;

try {
await updateDoc(doc(db, "reminders", reminder.id), {
title: title.trim(),
description
});

alert("Recordatorio actualizado.");
} catch (error) {
alert("Error al editar: " + error.message);
}
}

// ELIMINAR RECORDATORIO
async function deleteReminder(id) {
if (!confirm("¿Seguro que deseas eliminar este recordatorio?")) return;

try {
await deleteDoc(doc(db, "reminders", id));
alert("Recordatorio eliminado.");
} catch (error) {
alert("Error al eliminar: " + error.message);
}
}

// CALENDARIO MENSUAL
const monthNames = [
"Enero", "Febrero", "Marzo", "Abril",
"Mayo", "Junio", "Julio", "Agosto",
"Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function renderCalendar() {
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("month-year");

if (!calendar || !monthYear) return;

calendar.replaceChildren();

const year = currentDate.getFullYear();
const month = currentDate.getMonth();

monthYear.textContent = `${monthNames[month]} ${year}`;

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

weekdays.forEach(day => {
const cell = document.createElement("div");
cell.textContent = day;
cell.style.fontWeight = "bold";
cell.style.background = "#F9E9EC";
calendar.appendChild(cell);
});

const firstDay = new Date(year, month, 1).getDay();
const offset = (firstDay + 6) % 7;
const daysInMonth = new Date(year, month + 1, 0).getDate();

for (let i = 0; i < offset; i++) {
const blank = document.createElement("div");
calendar.appendChild(blank);
}

for (let day = 1; day <= daysInMonth; day++) {
const cell = document.createElement("div");
const dateString =
`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

cell.textContent = day;

if (reminders.some(item => item.date === dateString)) {
cell.style.borderBottom = "4px solid #8D123D";
}
const today = new Date();
if (
day === today.getDate() &&
month === today.getMonth() &&
year === today.getFullYear()
) {
cell.classList.add("selected");
}
calendar.appendChild(cell);
}
}
// CAMBIAR DE MES
document.getElementById("prev-month").addEventListener("click", () => {
currentDate.setMonth(currentDate.getMonth() - 1);
renderCalendar();
});

document.getElementById("next-month").addEventListener("click", () => {
currentDate.setMonth(currentDate.getMonth() + 1);
renderCalendar();
});
