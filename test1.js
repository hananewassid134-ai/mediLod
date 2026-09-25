
        // --- UI Logic & Mode Senior ---
        const btnSenior = document.getElementById('seniorModeToggle');
        const dot = btnSenior.querySelector('.toggle-dot');
        let isSeniorMode = localStorage.getItem('seniorMode') === 'true';

        function applySeniorMode() {
            if(isSeniorMode) {
                document.body.classList.add('senior-mode');
                btnSenior.classList.replace('bg-slate-200', 'bg-med-600');
                dot.classList.add('translate-x-6');
            } else {
                document.body.classList.remove('senior-mode');
                btnSenior.classList.replace('bg-med-600', 'bg-slate-200');
                dot.classList.remove('translate-x-6');
            }
        }

        btnSenior.addEventListener('click', () => {
            isSeniorMode = !isSeniorMode;
            localStorage.setItem('seniorMode', isSeniorMode);
            applySeniorMode();
        });

        // Initialize Date & Header
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDateDisplay').textContent = new Date().toLocaleDateString('fr-FR', dateOptions).replace(/^\w/, c => c.toUpperCase());

        if (window.currentUser) {
            const userName = window.currentUser.name || window.currentUser.username || window.currentUser.email || 'Patient';
            document.getElementById('userNameHero').textContent = userName.split(' ')[0];
            document.getElementById('userNameNav').textContent = userName;
            document.getElementById('userAvatarInitial').textContent = userName.charAt(0).toUpperCase();
        }

        document.getElementById('logoutBtnTop').addEventListener('click', () => {
            localStorage.removeItem('mediLogUser');
            window.location.href = 'index.html';
        });

        // --- Core Application Logic ---
        let referenceData = null;

        async function loadDashboard() {
            const content = document.getElementById('dynamic-content-area');
            try {
                const requests = await getReservations(window.currentUser.role, window.currentUser.id);
                
                // Séparer la demande active (En cours/Attente) des autres (Historique/Résultat)
                const activeRequests = requests.filter(r => r.status === 'attente' || r.status === 'cours' || r.status === 'livre');
                const pastRequests = requests.filter(r => r.status === 'resultat');
                
                // Prendre la demande la plus pertinente pour le tracking live
                const currentActive = activeRequests.length > 0 ? activeRequests[0] : null;

                let html = '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">';
                
                // LEFT COLUMN (2/3 width) - Live Tracking & Timeline
                html += '<div class="lg:col-span-2 flex flex-col gap-6">';
                
                if (currentActive) {
                    html += renderLiveTrackingCard(currentActive);
                } else {
                    html += `
                        <div class="glass-card rounded-2xl p-8 text-center border-dashed border-2 border-slate-300">
                            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <i class="fa-solid fa-mug-hot text-2xl"></i>
                            </div>
                            <h2 class="text-xl font-bold text-slate-700 mb-2">Aucune mission en cours</h2>
                            <p class="text-slate-500 mb-6">Vous n'avez pas de transport ou d'accompagnement programmé actuellement.</p>
                            <button onclick="document.getElementById('btnNewRequest').click()" class="btn bg-white border border-slate-200 hover:border-med-500 text-slate-700 px-6 py-2 rounded-xl font-medium shadow-sm smooth-transition">
                                Programmer un service
                            </button>
                        </div>
                    `;
                }

                html += '</div>'; // End Left Column

                // RIGHT COLUMN (1/3 width) - Documents & Notifications
                html += '<div class="flex flex-col gap-6">';
                
                // Documents Card
                html += `
                    <div class="glass-card rounded-2xl overflow-hidden flex flex-col h-full">
                        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <i class="fa-solid fa-folder-open text-accent-500"></i> Mes Documents
                            </h2>
                            <span class="text-xs font-semibold bg-accent-100 text-accent-600 px-2 py-1 rounded-md border border-accent-200">Sécurisé HDS</span>
                        </div>
                        <div class="p-5 flex-1 overflow-y-auto">
                            \${pastRequests.length > 0 ? 
                                pastRequests.map(r => renderDocumentItem(r)).join('') : 
                                '<p class="text-sm text-slate-500 text-center mt-4">Aucun résultat médical récent.</p>'
                            }
                        </div>
                        <div class="p-4 border-t border-slate-100 bg-slate-50 text-center">
                            <button class="text-sm font-medium text-med-600 hover:text-med-700">Voir tous les documents <i class="fa-solid fa-arrow-right text-xs ml-1"></i></button>
                        </div>
                    </div>
                `;

                // Quick Notifications
                html += `
                    <div class="glass-card rounded-2xl overflow-hidden">
                        <div class="p-5 border-b border-slate-100 bg-white">
                            <h2 class="text-lg font-bold text-slate-800">Dernières Activités</h2>
                        </div>
                        <div class="p-0">
                            <div class="p-4 border-b border-slate-50 flex gap-4 hover:bg-slate-50 smooth-transition cursor-pointer">
                                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5"><i class="fa-solid fa-bell text-xs"></i></div>
                                <div>
                                    <p class="text-sm font-medium text-slate-800">Rappel de rendez-vous</p>
                                    <p class="text-xs text-slate-500 mt-1">Prise de sang prévue demain à 08h00.</p>
                                </div>
                            </div>
                            <div class="p-4 border-b border-slate-50 flex gap-4 hover:bg-slate-50 smooth-transition cursor-pointer opacity-70">
                                <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5"><i class="fa-solid fa-check text-xs"></i></div>
                                <div>
                                    <p class="text-sm font-medium text-slate-800">Résultat disponible</p>
                                    <p class="text-xs text-slate-500 mt-1">Laboratoire Al-Boraq a uploadé un PDF.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                html += '</div>'; // End Right Column
                html += '</div>'; // End Grid

                content.innerHTML = html;
                
                document.getElementById('btnNewRequest').addEventListener('click', showNewRequestForm);
            } catch (e) {
                console.error(e);
                content.innerHTML = `
                    <div class="bg-red-50 text-red-500 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                        <i class="fa-solid fa-triangle-exclamation text-xl"></i>
                        <div>
                            <p class="font-bold">Erreur de connexion</p>
                            <p class="text-sm">Impossible de charger les données depuis le serveur.</p>
                        </div>
                    </div>
                `;
            }
        }

        // --- Render Helpers ---

        function renderLiveTrackingCard(req) {
            const isLive = req.status === 'cours';
            const statusConfig = {
                'attente': { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'En attente d\\'assignation', icon: 'fa-clock' },
                'cours': { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'En cours de livraison', icon: 'fa-motorcycle' },
                'livre': { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'Livré au médecin', icon: 'fa-check-circle' }
            };
            const c = statusConfig[req.status] || statusConfig['attente'];

            // Fake ETA logic
            let etaHtml = '';
            if(isLive) {
                etaHtml = `
                    <div class="absolute top-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-bounce" style="animation-duration: 2s;">
                        <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span class="font-bold">ETA: 8 min</span>
                    </div>
                `;
            }

            return `
                <div class="glass-card rounded-2xl overflow-hidden shadow-sm">
                    <!-- Header -->
                    <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">#\${req.id}</span>
                                <h2 class="text-lg font-bold text-slate-800">\${req.serviceName}</h2>
                            </div>
                            <p class="text-sm text-slate-500"><i class="fa-solid fa-user-doctor mr-1"></i> Destinataire: \${req.medecinName}</p>
                        </div>
                        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full \${c.bg} \${c.color} border \${c.border}">
                            <i class="fa-solid \${c.icon} \${isLive ? 'animate-pulse' : ''}"></i>
                            <span class="text-sm font-bold">\${c.text}</span>
                        </div>
                    </div>

                    <!-- Map Area (Mock) -->
                    <div class="relative w-full h-64 bg-slate-200 border-b border-slate-200 overflow-hidden">
                        <!-- Pseudo-Map SVG background -->
                        <svg class="absolute inset-0 w-full h-full opacity-30 text-med-600" style="object-fit: cover;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400">
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="0.5"/>
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                            <path d="M100,300 C200,300 250,150 400,150 C550,150 600,50 700,50" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-dasharray="10 15"/>
                        </svg>

                        <!-- Icons on map -->
                        <div class="absolute left-[10%] bottom-[20%] flex flex-col items-center transform -translate-x-1/2 translate-y-1/2">
                            <div class="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-800 border-2 border-slate-200 z-10"><i class="fa-solid fa-house"></i></div>
                            <span class="bg-white px-2 py-0.5 text-[10px] font-bold rounded shadow mt-1">Domicile</span>
                        </div>

                        <div class="absolute right-[10%] top-[10%] flex flex-col items-center transform translate-x-1/2 -translate-y-1/2">
                            <div class="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-accent-500 border-2 border-accent-200 z-10"><i class="fa-solid fa-hospital"></i></div>
                            <span class="bg-white px-2 py-0.5 text-[10px] font-bold rounded shadow mt-1 text-accent-600">Médecin</span>
                        </div>

                        \${isLive ? `
                        <!-- Moving Courier Icon -->
                        <div class="absolute left-[50%] top-[35%] transform -translate-x-1/2 -translate-y-1/2 z-20">
                            <div class="relative">
                                <div class="w-12 h-12 bg-blue-600 rounded-full shadow-xl flex items-center justify-center text-white text-xl border-4 border-white animate-pulse-slow">
                                    <i class="fa-solid fa-motorcycle"></i>
                                </div>
                                <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                        </div>
                        ` : ''}

                        \${etaHtml}
                    </div>

                    <!-- Timeline Advanced -->
                    <div class="p-6 bg-white overflow-hidden">
                        <h3 class="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Suivi d'avancement</h3>
                        \${renderAdvancedTimeline(req.status)}
                    </div>
                </div>
            `;
        }

        function renderAdvancedTimeline(currentStatus) {
            const steps = [
                { id: 'attente', label: 'Demande reçue', icon: 'fa-clipboard-list' },
                { id: 'cours', label: 'Coursier en route', icon: 'fa-truck-fast' },
                { id: 'livre', label: 'Livré au médecin', icon: 'fa-box-open' },
                { id: 'resultat', label: 'Analyse en cours', icon: 'fa-microscope' }
            ];

            const currentIndex = steps.findIndex(s => s.id === currentStatus) === -1 ? 0 : steps.findIndex(s => s.id === currentStatus);

            let html = '<div class="relative flex justify-between items-start">';
            
            // Progress Line background
            html += '<div class="absolute top-5 left-6 right-6 h-1 bg-slate-100 rounded-full -z-10"></div>';
            // Progress Line active
            const progressWidth = currentIndex === 0 ? 0 : (currentIndex / (steps.length - 1)) * 100;
            html += `<div class="absolute top-5 left-6 h-1 bg-med-500 rounded-full -z-10 smooth-transition" style="width: calc(\${progressWidth}% - 12px);"></div>`;

            steps.forEach((step, index) => {
                const isCompleted = index < currentIndex;
                const isActive = index === currentIndex;
                const isPending = index > currentIndex;

                let iconColor = isPending ? 'text-slate-300' : (isCompleted ? 'text-white' : 'text-med-600');
                let iconBg = isPending ? 'bg-slate-50 border-slate-200' : (isCompleted ? 'bg-med-500 border-med-500' : 'bg-white border-med-500');
                let shadow = isActive ? 'shadow-[0_0_0_4px_rgba(59,130,246,0.2)]' : '';
                let labelColor = isActive ? 'text-med-700 font-bold' : (isCompleted ? 'text-slate-700 font-medium' : 'text-slate-400');

                // If currently active and it's not the first step, maybe add a pulse
                let pulse = isActive && index > 0 ? 'animate-pulse' : '';

                html += `
                    <div class="flex flex-col items-center relative flex-1">
                        <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center \${iconBg} \${iconColor} \${shadow} \${pulse} smooth-transition z-10 bg-white">
                            <i class="fa-solid \${isCompleted ? 'fa-check' : step.icon} text-sm"></i>
                        </div>
                        <span class="text-xs text-center mt-3 \${labelColor} max-w-[80px] leading-tight">\${step.label}</span>
                    </div>
                `;
            });

            html += '</div>';
            return html;
        }

        function renderDocumentItem(req) {
            return `
                <div class="flex items-start gap-4 p-4 mb-3 border border-slate-100 rounded-xl hover:border-accent-300 hover:shadow-md hover:bg-accent-50 smooth-transition group">
                    <div class="w-10 h-10 rounded-lg bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500 group-hover:text-white smooth-transition">
                        <i class="fa-solid fa-file-pdf text-lg"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-slate-800 truncate">Résultat_Analyse_#\${req.id}.pdf</p>
                        <p class="text-xs text-slate-500 mt-0.5 truncate">Dr. \${req.medecinName}</p>
                    </div>
                    \${req.fileUrl ? `
                    <a href="http://localhost:3000\${req.fileUrl}" target="_blank" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-med-600 hover:text-white smooth-transition cursor-pointer" title="Télécharger">
                        <i class="fa-solid fa-download text-sm"></i>
                    </a>
                    ` : ''}
                </div>
            `;
        }

        // --- New Request Form Logic ---

        async function showNewRequestForm() {
            if (!referenceData) {
                try {
                    referenceData = await getReferenceData();
                } catch(e) {
                    alert('Erreur serveur pour charger les références');
                    return;
                }
            }
            
            const servicesOptions = referenceData.services.map(s => `<option value="\${s.id}">\${s.name}</option>`).join('');
            const doctorsOptions = referenceData.doctors.map(d => `<option value="\${d.id}">\${d.name}</option>`).join('');

            const content = document.getElementById('dynamic-content-area');
            content.innerHTML = `
                <div class="max-w-3xl mx-auto">
                    <button id="btnBack" class="text-slate-500 hover:text-med-600 mb-6 flex items-center gap-2 font-medium smooth-transition">
                        <i class="fa-solid fa-arrow-left"></i> Retour au tableau de bord
                    </button>
                    
                    <div class="glass-card rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 bg-med-100 text-med-600 rounded-xl flex items-center justify-center text-xl">
                                <i class="fa-solid fa-calendar-plus"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold text-slate-800">Planifier un service</h2>
                                <p class="text-slate-500 text-sm">Remplissez les informations ci-dessous pour réserver un transport.</p>
                            </div>
                        </div>

                        <form id="newRequestForm" class="space-y-6">
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Type de service</label>
                                    <div class="relative">
                                        <select id="serviceType" required class="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-med-500 focus:ring-2 focus:ring-med-200 smooth-transition">
                                            <option value="">Sélectionnez un service...</option>
                                            \${servicesOptions}
                                        </select>
                                        <i class="fa-solid fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Médecin / Laboratoire</label>
                                    <div class="relative">
                                        <select id="doctorSelect" required class="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-med-500 focus:ring-2 focus:ring-med-200 smooth-transition">
                                            <option value="">Sélectionnez un praticien...</option>
                                            \${doctorsOptions}
                                        </select>
                                        <i class="fa-solid fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Date d'intervention</label>
                                    <input type="date" id="reqDate" required class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-med-500 focus:ring-2 focus:ring-med-200 smooth-transition">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-slate-700 mb-2">Heure préférée</label>
                                    <input type="time" id="reqTime" required class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-med-500 focus:ring-2 focus:ring-med-200 smooth-transition">
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">Adresse de domicile / Prise en charge</label>
                                <textarea id="reqAddress" rows="3" required placeholder="Entrez l'adresse exacte, bâtiment, étage..." class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-med-500 focus:ring-2 focus:ring-med-200 smooth-transition resize-none"></textarea>
                            </div>

                            <div class="pt-4 border-t border-slate-100 flex justify-end gap-4">
                                <button type="button" onclick="loadDashboard()" class="btn bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-3 rounded-xl font-medium smooth-transition">Annuler</button>
                                <button type="submit" class="btn bg-med-600 hover:bg-med-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-med-200 hover:shadow-med-300 smooth-transition flex items-center gap-2">
                                    Confirmer la réservation <i class="fa-solid fa-arrow-right"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            document.getElementById('btnBack').addEventListener('click', loadDashboard);
            document.getElementById('newRequestForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const sSelect = document.getElementById('serviceType');
                const dSelect = document.getElementById('doctorSelect');

                const data = {
                    patientId: window.currentUser.id,
                    medecinId: parseInt(dSelect.value),
                    medecinName: dSelect.options[dSelect.selectedIndex].text,
                    service: sSelect.value,
                    serviceName: sSelect.options[sSelect.selectedIndex].text,
                    date: document.getElementById('reqDate').value,
                    time: document.getElementById('reqTime').value,
                    address: document.getElementById('reqAddress').value
                };

                const btnSubmit = e.target.querySelector('button[type="submit"]');
                const originalText = btnSubmit.innerHTML;
                btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Traitement...';
                btnSubmit.disabled = true;

                try {
                    await createReservation(data);
                    // Show a nice success toast
                    setTimeout(() => {
                        alert('Demande enregistrée avec succès ! Notre coursier sera notifié.');
                        loadDashboard();
                    }, 800);
                } catch(err) {
                    alert('Erreur lors de la réservation');
                    btnSubmit.innerHTML = originalText;
                    btnSubmit.disabled = false;
                }
            });
        }

        // --- Run on Load ---
        applySeniorMode();
        if (window.currentUser) {
            loadDashboard();
        }
    