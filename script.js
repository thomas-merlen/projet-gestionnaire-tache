const form = document.querySelector('form');
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const typeInput = document.getElementById('type');
const messageInput = document.getElementById('message');

let taskContainer = document.querySelector('.task-container');
if (!taskContainer){
    taskContainer = document.createElement('div');
    taskContainer.className = 'task-container';
    document.querySelector('.login').after(taskContainer);
}

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTasks(){
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function displayTasks(){
    taskContainer.innerHTML = '<h2>Liste des tâches</h2>';
    
    if (tasks.length === 0){
        taskContainer.innerHTML += '<p class="no-tasks">Aucune tâche ajoutée pour le moment.</p>';
        return;
    }
    
    const sortedTasks = [...tasks].sort((a, b) =>{
        const dateTimeA = new Date(a.date + 'T' + a.time);
        const dateTimeB = new Date(b.date + 'T' + b.time);
        return dateTimeA - dateTimeB;
    });
    
    sortedTasks.forEach((task, index) =>{
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <div class="task-header">
                <span class="task-date">📅 ${formatDate(task.date)} à ${task.time}</span>
                <span class="task-type ${task.type.toLowerCase()}">${task.type}</span>
            </div>
            <div class="task-description">
                ${task.description}
            </div>
            <button class="delete-btn" onclick="deleteTask(${tasks.indexOf(task)})">🗑️ Supprimer</button>
        `;
        taskContainer.appendChild(taskElement);
    });
}

function formatDate(dateString){
    const date = new Date(dateString + 'T00:00:00');
    const options ={ year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function deleteTask(index){
    tasks.splice(index, 1);
    saveTasks(); 
    displayTasks();
}

form.addEventListener('submit', function(e){
    e.preventDefault();
    
    const date = dateInput.value;
    const time = timeInput.value;
    const type = typeInput.value;
    const description = messageInput.value;
    
    if (!date || !time || !type || !description){
        alert('Veuillez remplir tous les champs !');
        return;
    }
    
    const selectedDateTime = new Date(date + 'T' + time);
    const now = new Date();
    
    if (selectedDateTime < now){
        alert('⌚ Vous ne pouvez pas ajouter une tâche dans le passé !');
        return;
    }
    
    const newTask ={
        date: date,
        time: time,
        type: type,
        description: description,
        id: Date.now()
    };
    
    tasks.push(newTask);
    saveTasks(); 
    
    displayTasks();
    
    form.reset();
    
});

displayTasks();