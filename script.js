const form = document.querySelector('form');
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const typeInput = document.getElementById('type');
const frequencyInput = document.getElementById('frequency');
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

// Générer les occurrences d'une tâche récurrente pour 1 an
function generateRecurringTasks(task){
    const occurrences = [];
    const startDate = new Date(task.date + 'T' + task.time);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // Ajouter 1 an
    
    let currentDate = new Date(startDate);
    
    // Si pas de fréquence, c'est une tâche unique
    if (!task.frequency || task.frequency === '0'){
        occurrences.push({
            date: task.date,
            time: task.time,
            type: task.type,
            description: task.description,
            parentId: task.id,
            isRecurring: false
        });
        return occurrences;
    }
    
    const frequencyDays = parseInt(task.frequency);
    const excludedDates = task.excludedDates || [];
    
    // Générer les occurrences
    while (currentDate <= endDate){
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Vérifier si cette date n'est pas exclue
        if (!excludedDates.includes(dateString)){
            occurrences.push({
                date: dateString,
                time: task.time,
                type: task.type,
                description: task.description,
                parentId: task.id,
                isRecurring: true,
                frequency: task.frequency
            });
        }
        
        // Ajouter la fréquence en jours
        currentDate.setDate(currentDate.getDate() + frequencyDays);
    }
    
    return occurrences;
}

function displayTasks(){
    taskContainer.innerHTML = '<h2>Liste des tâches</h2>';
    
    if (tasks.length === 0){
        taskContainer.innerHTML += '<p class="no-tasks">Aucune tâche ajoutée pour le moment.</p>';
        return;
    }
    
    // Générer toutes les occurrences
    const allOccurrences = [];
    tasks.forEach(task =>{
        const occurrences = generateRecurringTasks(task);
        allOccurrences.push(...occurrences);
    });
    
    // Trier par date et heure
    const sortedTasks = allOccurrences.sort((a, b) =>{
        const dateTimeA = new Date(a.date + 'T' + a.time);
        const dateTimeB = new Date(b.date + 'T' + b.time);
        return dateTimeA - dateTimeB;
    });
    
    // Filtrer les tâches futures uniquement
    const now = new Date();
    const futureTasks = sortedTasks.filter(task =>{
        const taskDateTime = new Date(task.date + 'T' + task.time);
        return taskDateTime >= now;
    });
    
    if (futureTasks.length === 0){
        taskContainer.innerHTML += '<p class="no-tasks">Aucune tâche future.</p>';
        return;
    }
    
    futureTasks.forEach((task) =>{
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        
        const frequencyLabel = task.isRecurring ? 
            `<span class="frequency-badge">🔄 ${getFrequencyLabel(task.frequency)}</span>` : '';
        
        // Encoder la date pour l'utiliser dans l'attribut onclick
        const taskDateEncoded = task.date;
        
        const deleteButtons = task.isRecurring ? `
            <div style="display: flex; gap: 8px;">
                <button class="delete-btn delete-one" onclick="deleteOccurrence(${task.parentId}, '${taskDateEncoded}')">🗑️ Cette occurrence</button>
                <button class="delete-btn delete-all" onclick="deleteAllOccurrences(${task.parentId})">🗑️ Toute la série</button>
            </div>
        ` : `
            <button class="delete-btn" onclick="deleteTask(${task.parentId})">🗑️ Supprimer</button>
        `;
        
        taskElement.innerHTML = `
            <div class="task-header">
                <span class="task-date">📅 ${formatDate(task.date)} à ${task.time}</span>
                <span class="task-type ${task.type.toLowerCase()}">${task.type}</span>
            </div>
            <div class="task-description">
                ${task.description}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                ${frequencyLabel}
                ${deleteButtons}
            </div>
        `;
        taskContainer.appendChild(taskElement);
    });
}

function getFrequencyLabel(frequency){
    switch(frequency){
        case '1': return 'Quotidien';
        case '7': return 'Hebdomadaire';
        case '28': return 'Mensuel';
        default: return '';
    }
}

function formatDate(dateString){
    const date = new Date(dateString + 'T00:00:00');
    const options ={ year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function deleteTask(taskId){
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks(); 
    displayTasks();
}

// Supprimer une seule occurrence d'une tâche récurrente
function deleteOccurrence(taskId, occurrenceDate){
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    // Initialiser le tableau des dates exclues si nécessaire
    if (!tasks[taskIndex].excludedDates){
        tasks[taskIndex].excludedDates = [];
    }
    
    // Ajouter cette date à la liste des exclusions
    if (!tasks[taskIndex].excludedDates.includes(occurrenceDate)){
        tasks[taskIndex].excludedDates.push(occurrenceDate);
    }
    
    saveTasks();
    displayTasks();
}

// Supprimer toute la série de tâches récurrentes
function deleteAllOccurrences(taskId){
    if (confirm('Voulez-vous vraiment supprimer toute la série de cette tâche récurrente ?')){
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks(); 
        displayTasks();
    }
}

// Rendre les fonctions globales
window.deleteTask = deleteTask;
window.deleteOccurrence = deleteOccurrence;
window.deleteAllOccurrences = deleteAllOccurrences;

form.addEventListener('submit', function(e){
    e.preventDefault();
    
    const date = dateInput.value;
    const time = timeInput.value;
    const type = typeInput.value;
    const frequency = frequencyInput.value || '0';
    const description = messageInput.value;
    
    if (!date || !time || !type || !description){
        alert('Veuillez remplir tous les champs obligatoires !');
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
        frequency: frequency,
        description: description,
        id: Date.now()
    };
    
    tasks.push(newTask);
    saveTasks(); 
    
    displayTasks();
    
    form.reset();
    
});

displayTasks();