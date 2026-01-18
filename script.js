
    /* =========================================
       1. CONFIGURATION & VARIABLES
       ========================================= */
    const MOCK_API_SUJETS = "https://696d436ff4a79b315180df20.mockapi.io/V1/Sujet"; 
    const MOCK_API_ANNONCES = "https://696d45f4f4a79b315180e444.mockapi.io/V1/Anoncesconcours";
    // AJOUT : API PUBLICITÉS
    const MOCK_API_PUBS = "https://696d436ff4a79b315180df20.mockapi.io/V1/Pub"; 
    
    const ADMIN_PHONE = "261341108401"; 

    /* DONNÉES DE SECOURS (OFFLINE) */

    // AJOUT : SECOURS PUBLICITÉS
    

    let globalData = [];
    let currentItem = null;
    
    // VARIABLES SLIDER
    let currentSlide = 0;
    let slidesData = [];
    let slideInterval;

    /* =========================================
       2. INITIALISATION (MODIFIÉE)
       ========================================= */
    async function init() {
        // Gestion du thème
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        // --- ICI : ON CHARGE LES PUBS EN PREMIER ---
        await loadPubs();     // <--- NOUVELLE LIGNE AJOUTÉE
        await loadAnnonces(); // Code existant
        await loadSujets();   // Code existant
    }

    /* =========================================
       3. LOGIQUE PUBLICITÉS (SLIDER)
       ========================================= */
    async function loadPubs() {
        try {
            const res = await fetch(MOCK_API_PUBS);
            if (!res.ok) throw new Error();
            const data = await res.json();
            slidesData = data.length > 0 ? data : FALLBACK_PUBS;
        } catch (e) {
            console.warn("Erreur API Pubs, utilisation secours");
            slidesData = FALLBACK_PUBS;
        }
        renderPubs();
    }

    function renderPubs() {
        const container = document.getElementById('heroSection');
        if(!container) return; // Sécurité

        // Réinitialisation structure HTML du slider
        container.innerHTML = `
            <div class="hero-controls">
                <button class="hero-btn prev" onclick="moveSlide(-1)">&#10094;</button>
                <div class="hero-dots" id="heroDots"></div>
                <button class="hero-btn next" onclick="moveSlide(1)">&#10095;</button>
            </div>
        `;
        
        const dotsContainer = document.getElementById('heroDots');

        // Création des slides
        slidesData.forEach((slide, index) => {
            // Slide
            const div = document.createElement('div');
            div.className = `hero-slide ${index === 0 ? 'active' : ''}`;
            div.style.backgroundImage = `url('${slide.image}')`;
            div.innerHTML = `
                <div class="hero-overlay"></div>
                <div class="hero-content">
                    <h2>${slide.title}</h2>
                    <p>${slide.description}</p>
                    <a href="${slide.link}" class="hero-cta">${slide.buttonText || 'Découvrir'}</a>
                </div>
            `;
            container.prepend(div); // Ajout avant les contrôles

            // Dot (Point de navigation)
            const dot = document.createElement('div');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(index);
            dotsContainer.appendChild(dot);
        });

        startSlider();
    }

    function startSlider() {
        if(slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(() => moveSlide(1), 5000); // 5 secondes
    }

    function moveSlide(step) {
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.dot');
        if(slides.length === 0) return;

        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');

        currentSlide = (currentSlide + step + slides.length) % slides.length;

        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
        startSlider();
    }

    function goToSlide(index) {
        currentSlide = index;
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.dot');
        
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
        startSlider();
    }

    /* =========================================
       4. LOGIQUE ANNONCES & SUJETS (EXISTANT)
       ========================================= */
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
    }

    async function loadAnnonces() {
        const ticker = document.getElementById('ticker');
        try {
            const res = await fetch(MOCK_API_ANNONCES);
            if(!res.ok) throw new Error();
            const data = await res.json();
            renderAnnonces(data.length > 0 ? data : FALLBACK_ANNONCES);
        } catch(e) {
            renderAnnonces(FALLBACK_ANNONCES);
        }
    }

    function renderAnnonces(list) {
        const ticker = document.getElementById('ticker');
        ticker.innerHTML = '';
        list.forEach(ann => {
            const a = document.createElement('a');
            a.href = ann.link || "#";
            a.className = "ticker-item";
            a.innerHTML = `<i class="fas fa-star" style="color:yellow; margin-right:5px;"></i> ${ann.text}`;
            ticker.appendChild(a);
        });
    }

    async function loadSujets() {
        const loader = document.getElementById('loading');
        const grid = document.getElementById('grid');
        
        loader.style.display = 'block';
        grid.innerHTML = '';

        try {
            const res = await fetch(MOCK_API_SUJETS);
            if(!res.ok) throw new Error();
            const fetchedData = await res.json();
            globalData = fetchedData.length > 0 ? fetchedData : FALLBACK_DATA;
        } catch(e) {
            globalData = FALLBACK_DATA;
        }

        loader.style.display = 'none';
        renderGrid(globalData);
    }

    function renderGrid(list) {
        const grid = document.getElementById('grid');
        grid.innerHTML = '';

        if(list.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center;">Aucun résultat.</div>'; return;
        }

        list.forEach(item => {
            const isCorrige = item.type && item.type.toLowerCase() === 'corrige';
            const typeLabel = isCorrige ? 'CORRIGÉ' : 'SUJET';
            const typeClass = isCorrige ? 'type-corrige' : 'type-sujet';
            const icon = item.icon || "fa-file-alt";

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-header">
                    <span class="card-badge badge-mention">${item.mention}</span>
                    <span class="card-badge badge-type ${typeClass}">${typeLabel}</span>
                    <i class="fas ${icon} card-icon"></i>
                </div>
                <div class="card-body">
                    <div>
                        <div class="card-title">${item.title}</div>
                        <div class="card-meta"><i class="far fa-calendar-alt"></i> ${item.year}</div>
                    </div>
                    <div>
                        <span class="card-price">${item.price}</span>
                        <button class="btn-card unlock" onclick="openModal(${item.id})">
                            <i class="fas fa-lock"></i> DÉBLOQUER
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    /* FILTRES & RECHERCHE */
    function filterBy(filter, btn) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if(filter === 'all') renderGrid(globalData);
        else renderGrid(globalData.filter(item => item.mention === filter));
    }

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        renderGrid(globalData.filter(item => 
            item.title.toLowerCase().includes(term) || item.mention.toLowerCase().includes(term)
        ));
    });

    /* =========================================
       5. MODAL & UTILITAIRES
       ========================================= */
    function openModal(id) {
        currentItem = globalData.find(i => i.id == id);
        if(!currentItem) return;
        document.getElementById('mTitle').innerText = currentItem.title;
        document.getElementById('mMention').innerText = `${currentItem.mention} - ${currentItem.year}`;
        document.getElementById('mPrice').innerText = currentItem.price;
        document.getElementById('proofFile').value = '';
        document.getElementById('fileName').innerText = '';
        document.getElementById('waBtn').classList.remove('ready');
        document.getElementById('codeInput').value = '';
        document.getElementById('modal').classList.add('active');
    }

    function closeModal() { document.getElementById('modal').classList.remove('active'); }

    function handleFile() {
        const file = document.getElementById('proofFile').files[0];
        if(file) {
            document.getElementById('fileName').innerText = "Fichier : " + file.name;
            document.getElementById('waBtn').classList.add('ready');
        }
    }

    function sendWhatsApp() {
        if(!currentItem) return;
        const msg = `Bonjour, je veux : ${currentItem.title} (${currentItem.mention})`;
        window.open(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    function checkCode() {
        const code = document.getElementById('codeInput').value.trim();
        if(currentItem && code === currentItem.password) {
            window.open(currentItem.link, '_blank');
            closeModal();
        } else alert("Code incorrect");
    }

    function toggleTheme() {
        const html = document.documentElement;
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    }
    function updateThemeIcon(t) { 
        document.getElementById('themeIcon').className = t === 'dark' ? 'fas fa-moon' : 'fas fa-sun'; 
    }

    /* PWA */
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
    function installPWA() {
        if (deferredPrompt) deferredPrompt.prompt();
        else alert("Utilisez le menu du navigateur pour installer.");
    }

    window.onclick = function(event) { if (event.target == document.getElementById('modal')) closeModal(); }

    // DÉMARRAGE DE L'APPLICATION
    init();
