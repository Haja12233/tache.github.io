// script.js
document.addEventListener('DOMContentLoaded', function() {
    
    // Configuration et variables globales
    const initialUsers = ['Anniva', 'Tina'];
    let initialLocales = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'];
    let defaultUser = null, defaultUserExpiry = null;
    const requiredCells = ['a1', 'a2', 'a3', 'c2', 'c3', 'd1'];
    let activeMenu = null;
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7NrE1iwl4vthz2Sxx3DIOoRXrSkq8nolvjefXo-w-KdBaP948MGa19hRanVgR5EQK/exec';

    // Variables pour le suivi des tâches
    let taskHistory = [];
    let currentTaskIndex = 0;
    let selectedLocale = null;
    let startTime = null;

    // Fonctions de gestion des données
    function saveResults() {
        const results = {};
        const cellsToSave = ['a1', 'a2', 'a3', 'a4', 'b4', 'c2', 'c3', 'c4', 'd1', 'd4'];
        
        cellsToSave.forEach(id => {
            const cell = document.getElementById(id);
            if (!cell) return;
            
            const contentSpan = cell.querySelector('.cell-content');
            const contentButton = cell.querySelector('button:not(.choice-button)');
            let currentValue = '', color = '';

            if (id === 'c2') {
                const locationList = cell.querySelector('.location-list');
                const contentSpanC2 = cell.querySelector('.cell-content');
                
                if (locationList) {
                    const locationsWithColor = Array.from(locationList.querySelectorAll('.location-item')).map(item => {
                        let c = 'none';
                        if(item.classList.contains('text-green')) c = 'green';
                        if(item.classList.contains('text-red')) c = 'red';
                        return { text: item.textContent.trim(), color: c };
                    });
                    currentValue = JSON.stringify(locationsWithColor);
                } else if (contentSpanC2) {
                    currentValue = contentSpanC2.textContent.trim();
                } else {
                    currentValue = '';
                }
            } else if (contentSpan) {
                currentValue = contentSpan.textContent.trim();
                if (cell.classList.contains('text-green')) color = 'green';
                else if (cell.classList.contains('text-red')) color = 'red';
            } else if (contentButton) {
                currentValue = contentButton.textContent.trim();
            }

            const initialText = cell.getAttribute('data-initial-text');
            if (currentValue && currentValue !== initialText) {
                results[id] = { value: currentValue, color: color };
            }
        });
        
        localStorage.setItem('taskResults', JSON.stringify(results));
    }

    function loadResults() {
        const savedResults = localStorage.getItem('taskResults');
        if (savedResults) {
            const results = JSON.parse(savedResults);
            
            for (const id in results) {
                const cell = document.getElementById(id);
                if (!cell) continue;
                
                if (id === 'c2') {
                    const value = results[id].value;
                    try {
                        const locationsWithColor = JSON.parse(value);
                        if (Array.isArray(locationsWithColor)) {
                            showC2LocationList();
                            const container = cell.querySelector('.location-list');
                            container.innerHTML = '';
                            
                            locationsWithColor.forEach(loc => {
                                const locationItem = document.createElement('div');
                                locationItem.className = 'location-item';
                                locationItem.textContent = loc.text;
                                
                                if (loc.color === 'green') {
                                    locationItem.classList.add('text-green');
                                    locationItem.dataset.colorState = '1';
                                } else if (loc.color === 'red') {
                                    locationItem.classList.add('text-red');
                                    locationItem.dataset.colorState = '2';
                                } else {
                                    locationItem.dataset.colorState = '0';
                                }
                                
                                container.appendChild(locationItem);
                            });
                            
                            updateC2BackgroundColor();
                        } else {
                            const contentSpan = document.createElement('span');
                            contentSpan.className = 'cell-content';
                            contentSpan.textContent = value;
                            cell.innerHTML = '';
                            cell.appendChild(contentSpan);
                            cell.classList.remove('text-green', 'text-red');
                            
                            if (results[id].color === 'green') cell.classList.add('text-green');
                            else if (results[id].color === 'red') cell.classList.add('text-red');
                        }
                    } catch (e) {
                        const contentSpan = document.createElement('span');
                        contentSpan.className = 'cell-content';
                        contentSpan.textContent = value;
                        cell.innerHTML = '';
                        cell.appendChild(contentSpan);
                    }
                } else {
                    const contentSpan = cell.querySelector('.cell-content');
                    const contentButton = cell.querySelector('button');
                    
                    if (contentSpan) {
                        contentSpan.textContent = results[id].value;
                        contentSpan.classList.remove('placeholder');
                        
                        if (results[id].color === 'green') cell.classList.add('text-green');
                        else if (results[id].color === 'red') cell.classList.add('text-red');
                    } else if (contentButton) {
                        contentButton.textContent = results[id].value;
                    }
                }
            }
        }
    }

    // Fonctions utilitaires
    function createDropdownItem(text) {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        
        const span = document.createElement('span');
        span.className = 'dropdown-item-content';
        span.textContent = text;
        
        item.appendChild(span);
        return item;
    }

    function showNotification(message, isCompletion = false) {
        const notification = document.getElementById('notification-banner');
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            if (isCompletion) resetAll();
        }, 2000);
    }

    function updateResults() {
        saveResults();
    }

    // Fonctions de gestion de l'historique
    function saveTaskHistory() {
        localStorage.setItem('taskHistory', JSON.stringify(taskHistory));
        localStorage.setItem('currentTaskIndex', currentTaskIndex.toString());
    }

    function loadTaskHistory() {
        const savedHistory = localStorage.getItem('taskHistory');
        const savedIndex = localStorage.getItem('currentTaskIndex');
        
        if (savedHistory) {
            taskHistory = JSON.parse(savedHistory);
        }
        
        if (savedIndex) {
            currentTaskIndex = parseInt(savedIndex);
        }
    }

    function addToTaskHistory(taskData) {
        taskHistory.push(taskData);
        currentTaskIndex++;
        saveTaskHistory();
        
        // Afficher dans un tableau (à créer)
        displayTaskHistory();
    }

    function displayTaskHistory() {
        // Créer un conteneur pour l'historique si nécessaire
        let historyContainer = document.getElementById('task-history');
        if (!historyContainer) {
            historyContainer = document.createElement('div');
            historyContainer.id = 'task-history';
            historyContainer.style.cssText = 'margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;';
            document.querySelector('.container').appendChild(historyContainer);
        }
        
        let historyHTML = '<h3>Historique des Tâches</h3><table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
        historyHTML += '<tr style="background-color: #e9ecef;"><th>Pavillon</th><th>Début</th><th>Fin</th><th>Utilisateur</th></tr>';
        
        taskHistory.forEach((task, index) => {
            historyHTML += `<tr style="border-bottom: 1px solid #ddd;">
                <td>${task.locale || ''}</td>
                <td>${task.startTime || ''}</td>
                <td>${task.endTime || ''}</td>
                <td>${task.user || ''}</td>
            </tr>`;
        });
        
        historyHTML += '</table>';
        historyContainer.innerHTML = historyHTML;
    }

    // Fonction pour afficher les résultats actuels dans un tableau - NOUVEAU
    function displayCurrentResults() {
        // Créer un conteneur pour les résultats actuels si nécessaire
        let resultsContainer = document.getElementById('current-results');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'current-results';
            resultsContainer.style.cssText = 'margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffeaa7;';
            // Insérer avant l'historique
            const container = document.querySelector('.container');
            const historyContainer = document.getElementById('task-history');
            if (historyContainer) {
                container.insertBefore(resultsContainer, historyContainer);
            } else {
                container.appendChild(resultsContainer);
            }
        }
        
        // Récupérer les valeurs actuelles de toutes les cellules
        const cellValues = {};
        const cellIds = ['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4', 'c1', 'c2', 'c3', 'c4', 'd1', 'd2', 'd3', 'd4'];
        
        cellIds.forEach(id => {
            const cell = document.getElementById(id);
            if (!cell) return;
            
            let value = '';
            let color = '';
            
            if (id === 'c2') {
                const locationList = cell.querySelector('.location-list');
                const contentSpan = cell.querySelector('.cell-content');
                
                if (locationList) {
                    const locations = Array.from(locationList.querySelectorAll('.location-item')).map(item => {
                        let colorText = '';
                        if (item.classList.contains('text-green')) colorText = ' (Vert)';
                        else if (item.classList.contains('text-red')) colorText = ' (Rouge)';
                        return item.textContent.trim() + colorText;
                    });
                    value = locations.join(', ');
                } else if (contentSpan) {
                    value = contentSpan.textContent.trim();
                }
            } else {
                const contentSpan = cell.querySelector('.cell-content');
                const contentButton = cell.querySelector('button');
                
                if (contentSpan) {
                    value = contentSpan.textContent.trim();
                } else if (contentButton) {
                    value = contentButton.textContent.trim();
                }
                
                if (cell.classList.contains('text-green')) color = ' (Vert)';
                else if (cell.classList.contains('text-red')) color = ' (Rouge)';
            }
            
            // Ne pas afficher les valeurs par défaut
            const initialText = cell.getAttribute('data-initial-text') || '';
            if (value && value !== initialText && value !== 'Sélectionnez une locale') {
                cellValues[id.toUpperCase()] = value + color;
            }
        });
        
        // Créer le tableau HTML
        let resultsHTML = '<h3>Résultats Actuels</h3>';
        
        if (Object.keys(cellValues).length > 0) {
            resultsHTML += '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
            resultsHTML += '<tr style="background-color: #ffeaa7;"><th>Cellule</th><th>Valeur</th></tr>';
            
            Object.keys(cellValues).forEach(cellId => {
                resultsHTML += `<tr style="border-bottom: 1px solid #ddd;">
                    <td><strong>${cellId}</strong></td>
                    <td>${cellValues[cellId] || ''}</td>
                </tr>`;
            });
            
            resultsHTML += '</table>';
        } else {
            resultsHTML += '<p style="color: #856404;">Aucune donnée à afficher pour le moment.</p>';
        }
        
        resultsContainer.innerHTML = resultsHTML;
    }

    // Fonctions de gestion des cellules - CORRIGÉE
    function resetAllExceptA1D1A3() {
        const cellsToReset = ['a2', 'a4', 'b1', 'b2', 'b3', 'b4', 'c1', 'c2', 'c3', 'c4', 'd2', 'd3', 'd4'];
        
        cellsToReset.forEach(id => {
            const cell = document.getElementById(id);
            if (!cell) return;
            
            if (id === 'c2') {
                showC2Buttons();
                cell.dataset.locked = "false";
            } else if (id === 'a2') {
                cell.innerHTML = `<button>Début</button>`;
            } else if (id === 'a4' || id === 'b4' || id === 'c4' || id === 'd4') {
                // Cases facultatives - garder la coloration verte
                const initialText = cell.getAttribute('data-initial-text');
                const contentSpan = cell.querySelector('.cell-content');
                
                if (contentSpan) {
                    contentSpan.textContent = initialText;
                    contentSpan.classList.add('placeholder');
                    contentSpan.classList.remove('default-user');
                }
                cell.classList.remove('text-green', 'text-red');
                cell.classList.add('optional-cell');
            } else {
                const initialText = cell.getAttribute('data-initial-text');
                const contentSpan = cell.querySelector('.cell-content');
                
                if (contentSpan) {
                    contentSpan.textContent = initialText;
                    contentSpan.classList.add('placeholder');
                    contentSpan.classList.remove('default-user');
                }
            }
            
            cell.classList.remove('text-green', 'text-red', 'default-user-active');
        });
        
        // Ne pas réinitialiser A1, D1 et A3
        localStorage.removeItem('taskResults');
        updateResults();
        displayCurrentResults(); // Afficher les résultats après réinitialisation
    }

    function manualRefresh() {
        const cellsToReset = ['a1', 'a2', 'a4', 'b4', 'c2', 'c3', 'c4', 'd4'];
        
        cellsToReset.forEach(id => {
            const cell = document.getElementById(id);
            if (!cell) return;
            
            if (id === 'c2') {
                showC2Buttons();
                cell.dataset.locked = "false";
            } else if (id === 'a2') {
                cell.innerHTML = `<button>Début</button>`;
            } else if (id === 'a4' || id === 'b4' || id === 'c4' || id === 'd4') {
                // Cases facultatives - garder la coloration verte
                const initialText = cell.getAttribute('data-initial-text');
                const contentSpan = cell.querySelector('.cell-content');
                
                if (contentSpan) {
                    contentSpan.textContent = initialText;
                    contentSpan.classList.add('placeholder');
                    contentSpan.classList.remove('default-user');
                }
                cell.classList.remove('text-green', 'text-red');
                cell.classList.add('optional-cell');
            } else {
                const initialText = cell.getAttribute('data-initial-text');
                const contentSpan = cell.querySelector('.cell-content');
                
                if (contentSpan) {
                    contentSpan.textContent = initialText;
                    contentSpan.classList.add('placeholder');
                    contentSpan.classList.remove('default-user');
                }
            }
            
            cell.classList.remove('text-green', 'text-red', 'default-user-active');
        });
        
        localStorage.removeItem('taskResults');
        defaultUser = null;
        defaultUserExpiry = null;
        localStorage.removeItem('defaultUserD1');
        
        updateA1Menu();
        updateD1MenuWithDefault();
        
        displayCurrentResults(); // Afficher les résultats après réinitialisation
        showNotification('Toutes les cases ont été réinitialisées ! 🔄');
    }

    function checkCompletion() {
        for (const id of requiredCells) {
            const cell = document.getElementById(id);
            if (!cell) return false;
            
            if (id === 'c2') {
                const contentSpan = cell.querySelector('.cell-content');
                const locationList = cell.querySelector('.location-list');
                
                if (!contentSpan && !locationList) return false;
                
                if (contentSpan && (contentSpan.textContent.trim().includes('R'))) {
                    return true;
                }
                
                if (locationList) {
                    const locations = Array.from(locationList.querySelectorAll('.location-item')).map(item => item.textContent.trim());
                    if (locations.length > 0) return true;
                }
            } else {
                const initialText = cell.getAttribute('data-initial-text');
                const contentSpan = cell.querySelector('.cell-content');
                const contentButton = cell.querySelector('button');
                
                let currentValue = contentSpan ? contentSpan.textContent.trim() : (contentButton ? contentButton.textContent.trim() : '');
                if (!currentValue || currentValue === initialText) return false;
            }
        }
        
        showNotification('Tâche complète ! 🎉', true);
        return true;
    }

    // Fonctions pour la cellule D1 (Utilisateur)
    function saveDefaultUser() {
        if (defaultUser) {
            localStorage.setItem('defaultUserD1', JSON.stringify({ 
                user: defaultUser, 
                expiry: defaultUserExpiry 
            }));
        }
    }

    function loadDefaultUser() {
        const defaultUserData = localStorage.getItem('defaultUserD1');
        
        if (defaultUserData) {
            const userData = JSON.parse(defaultUserData);
            
            if (userData.expiry > Date.now()) {
                defaultUser = userData.user;
                defaultUserExpiry = userData.expiry;
                
                const cell = document.getElementById('d1');
                cell.querySelector('.cell-content').textContent = defaultUser;
                cell.querySelector('.cell-content').classList.remove('placeholder');
                cell.querySelector('.cell-content').classList.add('default-user');
                cell.classList.add('default-user-active');
                
                updateD1MenuWithDefault();
            } else {
                localStorage.removeItem('defaultUserD1');
            }
        }
    }

    function setDefaultUser(name) {
        defaultUser = name;
        defaultUserExpiry = Date.now() + 28800000; // 8 heures
        
        const cell = document.getElementById('d1');
        cell.querySelector('.cell-content').textContent = defaultUser;
        cell.querySelector('.cell-content').classList.remove('placeholder');
        cell.querySelector('.cell-content').classList.add('default-user');
        cell.classList.add('default-user-active');
        
        saveDefaultUser();
        updateD1MenuWithDefault();
        showNotification(`Utilisateur "${defaultUser}" défini par défaut pour 8h !`);
        displayCurrentResults(); // Afficher les résultats
    }

    function updateD1MenuWithDefault() {
        const menu = document.querySelector('#d1 .dropdown-menu');
        menu.innerHTML = '';
        
        if (defaultUser) {
            const defaultItem = createDropdownItem(`★ ${defaultUser} (par défaut)`);
            defaultItem.classList.add('default-user-item');
            menu.appendChild(defaultItem);
        }
        
        initialUsers.forEach(user => {
            if (user !== defaultUser) {
                menu.appendChild(createDropdownItem(user));
            }
        });
        
        const addItem = createDropdownItem('+');
        addItem.classList.add('add-item');
        menu.appendChild(addItem);
    }

    // Fonctions pour la cellule A1 (Locale)
    function updateA1Menu() {
        const menu = document.querySelector('#a1 .dropdown-menu');
        menu.innerHTML = '';
        
        initialLocales.forEach(locale => {
            menu.appendChild(createDropdownItem(locale));
        });
    }

    // Fonctions pour la cellule C2
    function showC2Buttons() {
        const cell = document.getElementById('c2');
        cell.innerHTML = `<span class="cell-content placeholder-text">Sélectionnez Locale</span>`;
    }

    function showC2LocationList() {
        const c2Cell = document.getElementById('c2');
        c2Cell.innerHTML = `
            <div class="location-container">
                <div class="location-list"></div>
                <div class="list-add-button" id="add-locale-c2">+</div>
            </div>`;
        
        // Ajouter le gestionnaire d'événements pour le bouton +
        const addButton = c2Cell.querySelector('#add-locale-c2');
        if (addButton) {
            addButton.addEventListener('click', function(e) {
                e.stopPropagation();
                handleListAdd(c2Cell);
            });
        }
    }

    function checkLocaleControlAndDisplay(locale) {
        const c2Cell = document.getElementById('c2');
        c2Cell.innerHTML = `<span class="cell-content">Analyse en cours...</span>`;
        
        const url = `${SCRIPT_URL}?locale=${encodeURIComponent(locale)}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log('Réponse de l\'API:', data);
                
                if (data.success && data.data && data.data.length > 0) {
                    showC2LocationList();
                    const container = c2Cell.querySelector('.location-list');
                    container.innerHTML = '';
                    
                    data.data.forEach(location => {
                        const locationItem = document.createElement('div');
                        locationItem.className = 'location-item';
                        locationItem.textContent = location;
                        locationItem.dataset.colorState = '0';
                        container.appendChild(locationItem);
                    });
                } else {
                    c2Cell.innerHTML = `<span class="cell-content">R</span>`;
                    c2Cell.dataset.hasControl = "false";
                }
                
                c2Cell.dataset.locked = "false";
                updateResults();
                displayCurrentResults(); // Afficher les résultats
                checkCompletion();
            })
            .catch(error => {
                console.error('Erreur de connexion à l\'API:', error);
                c2Cell.innerHTML = `<span class="cell-content">R</span>`;
                c2Cell.dataset.hasControl = "false";
                c2Cell.dataset.locked = "false";
                updateResults();
                displayCurrentResults(); // Afficher les résultats
            });
    }

    function loadControlLocations() {
        const c2Cell = document.getElementById('c2');
        const locale = document.querySelector('#a1 .cell-content').textContent.trim();
        
        if (!locale || locale === 'Locale') {
            showC2Buttons();
            return;
        }
        
        c2Cell.innerHTML = `<span class="cell-content">Chargement...</span>`;
        
        const url = `${SCRIPT_URL}?locale=${encodeURIComponent(locale)}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data && data.data.length > 0) {
                    showC2LocationList();
                    const container = c2Cell.querySelector('.location-list');
                    container.innerHTML = '';
                    
                    data.data.forEach(location => {
                        const locationItem = document.createElement('div');
                        locationItem.className = 'location-item';
                        locationItem.textContent = location;
                        locationItem.dataset.colorState = '0';
                        container.appendChild(locationItem);
                    });
                } else {
                    c2Cell.innerHTML = `<span class="cell-content">R</span>`;
                    c2Cell.dataset.hasControl = "false";
                }
                
                c2Cell.dataset.locked = "false";
                updateResults();
                displayCurrentResults(); // Afficher les résultats
            })
            .catch(error => {
                console.error('Erreur de connexion à l\'API:', error);
                c2Cell.innerHTML = `<span class="cell-content">R</span>`;
                c2Cell.dataset.hasControl = "false";
                c2Cell.dataset.locked = "false";
                updateResults();
                displayCurrentResults(); // Afficher les résultats
            });
    }

    function condenseC2List() {
        const c2Cell = document.getElementById('c2');
        const locationItems = Array.from(c2Cell.querySelectorAll('.location-item'));

        const redCount = locationItems.filter(item => 
            item.classList.contains('text-red')
        ).length;

        const greenCount = locationItems.filter(item => 
            item.classList.contains('text-green')
        ).length;
        
        // Réinitialise les classes de couleur de la cellule
        c2Cell.classList.remove('text-green', 'text-red');

        // Détermine le contenu et la couleur de la cellule condensée
        if (redCount > 0) {
            c2Cell.innerHTML = `<span class="cell-content">${redCount}R</span>`;
            c2Cell.classList.add('text-red');
        } else if (greenCount > 0) {
            c2Cell.innerHTML = `<span class="cell-content">xR</span>`;
            c2Cell.classList.add('text-green');
        } else {
            c2Cell.innerHTML = `<span class="cell-content">R</span>`;
        }

        c2Cell.dataset.locked = "true";
        updateResults();
        displayCurrentResults(); // Afficher les résultats
        checkCompletion();
    }

    function handleListAdd(cell) {
        const newLocation = prompt("Veuillez entrer le nom du nouvel endroit :");
        
        if (newLocation && newLocation.trim()) {
            let container = cell.querySelector('.location-list');
            
            if (!container) {
                showC2LocationList();
                container = cell.querySelector('.location-list');
            }
            
            const newLocationItem = document.createElement('div');
            newLocationItem.className = 'location-item';
            newLocationItem.textContent = newLocation.trim();
            newLocationItem.dataset.colorState = '0';
            
            container.appendChild(newLocationItem);
            updateResults();
            displayCurrentResults(); // Afficher les résultats
        }
    }

    function handleLocationItemClick(locationItem) {
        let state = parseInt(locationItem.dataset.colorState || '0');
        state = (state + 1) % 3;
        locationItem.dataset.colorState = state;
        
        locationItem.classList.remove('text-green', 'text-red');
        
        if (state === 1) {
            locationItem.classList.add('text-green');
        } else if (state === 2) {
            locationItem.classList.add('text-red');
        }
    
        updateC2BackgroundColor();
        updateResults();
        displayCurrentResults(); // Afficher les résultats
        checkCompletion();
    }
    
    function updateC2BackgroundColor() {
        const c2Cell = document.getElementById('c2');
        const locationItems = Array.from(c2Cell.querySelectorAll('.location-item'));
        
        c2Cell.classList.remove('text-green', 'text-red');
        
        if (locationItems.length > 0) {
            const hasRed = locationItems.some(item => item.classList.contains('text-red'));
            const hasGreen = locationItems.some(item => item.classList.contains('text-green'));
            
            if (hasRed) {
                c2Cell.classList.add('text-red');
            } else if (hasGreen) {
                c2Cell.classList.add('text-green');
            }
        }
        displayCurrentResults(); // Afficher les résultats
    }

    // Initialisation
    function initializeApp() {
        updateA1Menu();
        updateD1MenuWithDefault();
        
        // Configuration du menu C3
        const c3Menu = document.querySelector('#c3 .dropdown-menu');
        const xylophageItem = createDropdownItem('Xylophage');
        xylophageItem.dataset.colorState = '0';
        c3Menu.appendChild(xylophageItem);
        
        // Configuration des menus de notes (A4, B4, C4, D4)
        ['#a4', '#b4', '#c4', '#d4'].forEach(cellId => {
            const menu = document.querySelector(`${cellId} .dropdown-menu`);
            ['Vide', '1', '2', '3'].forEach(opt => {
                menu.appendChild(createDropdownItem(opt));
            });
        });
        
        showC2Buttons();
        loadResults();
        loadDefaultUser();
        loadTaskHistory(); // Charger l'historique
        displayTaskHistory(); // Afficher l'historique existant
        displayCurrentResults(); // Afficher les résultats initiaux
    }

    // Gestionnaires d'événements
    function setupEventListeners() {
        const grid = document.querySelector('.grid');
        
        // Gestionnaire pour les clics en dehors des éléments
        document.addEventListener('click', function(event) {
            const c2Cell = document.getElementById('c2');
            const isClickInsideC2 = c2Cell.contains(event.target);
            const locationListExists = c2Cell.querySelector('.location-list');
            
            if (!isClickInsideC2 && locationListExists && c2Cell.dataset.locked === "false") {
                condenseC2List();
            }
            
            if (!event.target.closest('.cell') && activeMenu) {
                activeMenu.classList.remove('show');
                activeMenu = null;
            }
        });
        
        // Gestionnaire pour les clics sur la grille
        grid.addEventListener('click', function(event) {
            const cell = event.target.closest('.cell');
            if (!cell || cell.classList.contains('empty-cell')) return;
            if (cell.id === 'd1' && cell.classList.contains('default-user-active')) return;

            // Gestion spécifique de la cellule C2
            if (cell.id === 'c2') {
                const listAddButton = event.target.closest('.list-add-button');
                const locationItem = event.target.closest('.location-item');
                const contentSpan = cell.querySelector('.cell-content');

                if (listAddButton) {
                    handleListAdd(cell);
                } else if (locationItem) {
                    handleLocationItemClick(locationItem);
                } else if (contentSpan && (contentSpan.textContent.includes('R'))) {
                    loadControlLocations();
                } else if (cell.querySelector('.cell-content')) {
                    cell.dataset.locked = "false";
                    showC2Buttons();
                    updateResults();
                    displayCurrentResults(); // Afficher les résultats
                }
                return;
            }

            // Gestion des boutons A2 et A3
            if (event.target.tagName === 'BUTTON') {
                const timeString = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                
                if (cell.id === 'a2') {
                    // Bouton Début
                    cell.innerHTML = `<span class="cell-content">${timeString}</span>`;
                    startTime = timeString;
                    displayCurrentResults(); // Afficher les résultats
                } else if (cell.id === 'a3') {
                    // Bouton Fin - vérifier si c'est la 3ème tâche
                    if (currentTaskIndex >= 2) {
                        // 3ème tâche atteinte - garder le bouton rouge
                        cell.innerHTML = `<button style="background-color: #dc3545;">FIN</button>`;
                        // Enregistrer la tâche finale
                        if (selectedLocale && startTime) {
                            const taskData = {
                                locale: selectedLocale,
                                startTime: startTime,
                                endTime: timeString,
                                user: defaultUser || document.querySelector('#d1 .cell-content')?.textContent || ''
                            };
                            addToTaskHistory(taskData);
                        }
                    } else {
                        // Tâche normale
                        cell.innerHTML = `<span class="cell-content">${timeString}</span>`;
                        // Enregistrer la tâche
                        if (selectedLocale && startTime) {
                            const taskData = {
                                locale: selectedLocale,
                                startTime: startTime,
                                endTime: timeString,
                                user: defaultUser || document.querySelector('#d1 .cell-content')?.textContent || ''
                            };
                            addToTaskHistory(taskData);
                        }
                    }
                    displayCurrentResults(); // Afficher les résultats
                }
                updateResults();
                checkCompletion();
                return;
            }

            // Gestion des éléments de menu déroulant
            const dropdownItem = event.target.closest('.dropdown-item');
            if (dropdownItem) {
                const cellId = cell.id;
                const contentSpan = cell.querySelector('.cell-content');
                
                if (dropdownItem.classList.contains('add-item')) {
                    let newItem;
                    
                    if (cellId === 'd1') {
                        newItem = prompt("Veuillez entrer un nouveau prénom :");
                        if (newItem && newItem.trim()) {
                            initialUsers.push(newItem.trim());
                            updateD1MenuWithDefault();
                            setDefaultUser(newItem.trim());
                        }
                    } else if (cellId === 'a1') {
                        newItem = prompt("Veuillez entrer une nouvelle locale :");
                        if (newItem && newItem.trim()) {
                            initialLocales.push(newItem.trim());
                            updateA1Menu();
                            contentSpan.textContent = newItem.trim();
                            contentSpan.classList.remove('placeholder');
                            updateResults();
                            displayCurrentResults(); // Afficher les résultats
                            checkCompletion();
                        }
                    }
                    return;
                }

                if (cellId === 'd1') {
                    setDefaultUser(dropdownItem.textContent.replace(/^★ /, '').replace(/ \(par défaut\)$/, ''));
                    if (activeMenu) {
                        activeMenu.classList.remove('show');
                        activeMenu = null;
                    }
                    return;
                }

                if (cellId === 'c3') {
                    let state = (parseInt(dropdownItem.dataset.colorState || '0') + 1) % 3;
                    dropdownItem.dataset.colorState = state;
                    cell.classList.remove('text-green', 'text-red');
                    
                    if (state === 1) cell.classList.add('text-green');
                    else if (state === 2) cell.classList.add('text-red');
                    
                    contentSpan.textContent = 'X';
                    contentSpan.classList.remove('placeholder');
                    displayCurrentResults(); // Afficher les résultats
                } else if (cellId === 'a1') {
                    const selectedLocaleNew = dropdownItem.textContent;
                    contentSpan.textContent = selectedLocaleNew;
                    contentSpan.classList.remove('placeholder');
                    
                    // Si c'est une nouvelle tâche (pas la première) et qu'une tâche est en cours
                    if (selectedLocale && startTime && currentTaskIndex < 3) {
                        // Afficher l'heure de fin dans A3
                        const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        const a3Cell = document.getElementById('a3');
                        a3Cell.innerHTML = `<span class="cell-content">${currentTime}</span>`;
                        
                        // Enregistrer la tâche précédente
                        const taskData = {
                            locale: selectedLocale,
                            startTime: startTime,
                            endTime: currentTime,
                            user: defaultUser || document.querySelector('#d1 .cell-content')?.textContent || ''
                        };
                        addToTaskHistory(taskData);
                        
                        // Réinitialiser toutes les cases sauf A1, D1, A3
                        resetAllExceptA1D1A3();
                        
                        // Afficher automatiquement l'heure de début dans A2
                        const a2Cell = document.getElementById('a2');
                        const newStartTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        a2Cell.innerHTML = `<span class="cell-content">${newStartTime}</span>`;
                        startTime = newStartTime; // Mettre à jour startTime pour la nouvelle tâche
                    } else if (!selectedLocale) {
                        // Première sélection - réinitialiser les autres cases et afficher l'heure de début
                        resetAllExceptA1D1A3();
                        
                        // Afficher automatiquement l'heure de début dans A2
                        const a2Cell = document.getElementById('a2');
                        const newStartTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        a2Cell.innerHTML = `<span class="cell-content">${newStartTime}</span>`;
                        startTime = newStartTime;
                    } else {
                        // Pour les sélections suivantes sans tâche en cours, juste réinitialiser
                        resetAllExceptA1D1A3();
                        
                        // Afficher automatiquement l'heure de début dans A2
                        const a2Cell = document.getElementById('a2');
                        const newStartTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        a2Cell.innerHTML = `<span class="cell-content">${newStartTime}</span>`;
                        startTime = newStartTime;
                    }
                    
                    selectedLocale = selectedLocaleNew;
                    checkLocaleControlAndDisplay(selectedLocaleNew);
                    displayCurrentResults(); // Afficher les résultats
                } else {
                    contentSpan.textContent = dropdownItem.textContent;
                    contentSpan.classList.remove('placeholder');
                    displayCurrentResults(); // Afficher les résultats
                }
                
                if (activeMenu) {
                    activeMenu.classList.remove('show');
                    activeMenu = null;
                }
                
                updateResults();
                checkCompletion();
                return;
            }
            
            // Gestion de l'affichage des menus déroulants
            const menu = cell.querySelector('.dropdown-menu');
            if (menu) {
                if (activeMenu && activeMenu !== menu) activeMenu.classList.remove('show');
                menu.classList.toggle('show');
                activeMenu = menu.classList.contains('show') ? menu : null;
            }
        });

        // Gestionnaire pour le bouton d'actualisation
        document.getElementById('refresh-button').addEventListener('click', manualRefresh);
    }

    // Initialisation de l'application
    initializeApp();
    setupEventListeners();
});
