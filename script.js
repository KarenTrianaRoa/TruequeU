// =====================================================
// TruequeU - lógica de la página (todo se guarda en el navegador)
// =====================================================

const PAGE_SIZE = 6;

// ---------- Datos de ejemplo ----------
const SEED_ITEMS = [
    {
        id: 'seed-1', title: 'Cálculo de Larson 9na Edición', category: 'libros', type: 'intercambio',
        condition: 'bueno', materia: 'Cálculo', sede: 'Sede Apartadó',
        description: 'En buen estado, busco calculadora científica a cambio.',
        userName: 'Carlos M.', contact: 'carlos@estudiante.edu.co', ownerId: 'seed',
        status: 'disponible', createdAt: Date.parse('2026-11-10')
    },
    {
        id: 'seed-2', title: 'Calculadora Casio FX-82MS', category: 'tecnologia', type: 'donacion',
        condition: 'bueno', materia: 'Matemáticas', sede: 'Sede Apartadó',
        description: 'Funciona perfectamente, la dono porque compré una graficadora.',
        userName: 'Ana R.', contact: '3001234567', ownerId: 'seed',
        status: 'disponible', createdAt: Date.parse('2026-11-12')
    },
    {
        id: 'seed-3', title: 'Física Universitaria de Sears-Zemansky', category: 'libros', type: 'venta',
        price: 45000, condition: 'usado', materia: 'Física', sede: 'Sede Medellín',
        description: 'Tomo 1, pocas anotaciones a lápiz. Precio negociable.',
        userName: 'Marta L.', contact: '3109876543', ownerId: 'seed',
        status: 'disponible', createdAt: Date.parse('2026-11-15')
    },
    {
        id: 'seed-4', title: 'Compás y juego de escuadras', category: 'geometria', type: 'venta',
        price: 12000, condition: 'nuevo', materia: 'Dibujo técnico', sede: 'Sede Medellín',
        description: 'Sin estrenar, me regalaron dos juegos.',
        userName: 'Marta L.', contact: '3109876543', ownerId: 'seed',
        status: 'disponible', createdAt: Date.parse('2026-11-16')
    },
    {
        id: 'seed-5', title: 'Cuaderno cuadriculado 100 hojas', category: 'cuadernos', type: 'donacion',
        condition: 'nuevo', materia: '', sede: 'Sede Apartadó',
        description: 'Tengo 3 cuadernos sin usar para quien los necesite.',
        userName: 'Ana R.', contact: '3001234567', ownerId: 'seed',
        status: 'cerrado', createdAt: Date.parse('2026-10-28')
    },
    {
        id: 'seed-6', title: 'Busco Química General de Chang', category: 'libros', type: 'busco',
        condition: '', materia: 'Química', sede: 'Sede Apartadó',
        description: 'Cualquier edición reciente. Puedo pagar o intercambiar por un libro de Física.',
        userName: 'Pedro S.', contact: 'pedro@estudiante.edu.co', ownerId: 'seed',
        status: 'disponible', createdAt: Date.parse('2026-11-18')
    }
];

const SEED_REVIEWS = {
    'seed-2': [
        { name: 'Julián P.', rating: 5, comment: 'Excelente, la calculadora funciona perfecto. Ana fue muy amable.', date: '2026-10-12' }
    ],
    'seed-5': [
        { name: 'Laura G.', rating: 4, comment: 'Los cuadernos estaban nuevos, entrega rápida en la biblioteca.', date: '2026-11-02' }
    ]
};

const CATEGORY_NAMES = {
    libros: 'Libros y Textos',
    tecnologia: 'Calculadoras y Tecnología',
    cuadernos: 'Cuadernos y Carpetas',
    geometria: 'Reglas y Geometría',
    varios: 'Otros Útiles'
};

const TYPE_INFO = {
    intercambio: { text: 'Intercambio', css: 'badge-trade', action: 'Proponer trueque' },
    donacion: { text: 'Donación', css: 'badge-donation', action: 'Pedir donación' },
    venta: { text: 'Venta', css: 'badge-sale', action: 'Comprar' },
    busco: { text: 'Se busca', css: 'badge-seek', action: 'Tengo este material' }
};

const CONDITION_NAMES = { nuevo: 'Nuevo', bueno: 'Buen estado', usado: 'Usado' };

// ---------- Utilidades ----------
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = String(str == null ? '' : str);
    return div.innerHTML;
}

function formatPrice(value) {
    return '$' + Number(value).toLocaleString('es-CO') + ' COP';
}

function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        return false;
    }
}

let toastTimer = null;
function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
}

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// ---------- Estado ----------
const state = {
    visible: PAGE_SIZE,
    editingId: null,
    photoData: null,
    reviewItemId: null,
    rating: 0,
    contactItem: null,
    reportItemId: null
};

// ---------- Perfil local ----------
function getProfile() {
    const profile = readStorage('truequeu_profile', null) || {};
    if (!profile.ownerId) {
        profile.ownerId = 'o-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
        writeStorage('truequeu_profile', profile);
    }
    return profile;
}

function saveProfile(patch) {
    const profile = { ...getProfile(), ...patch };
    writeStorage('truequeu_profile', profile);
    return profile;
}

function refreshProfileUI() {
    const profile = getProfile();
    document.getElementById('profileBtn').textContent = profile.name ? `Hola, ${profile.name}` : 'Mi perfil';
    const nameInput = document.getElementById('userName');
    const contactInput = document.getElementById('userContact');
    if (!state.editingId) {
        if (profile.name && !nameInput.value) nameInput.value = profile.name;
        if (profile.contact && !contactInput.value) contactInput.value = profile.contact;
    }
}

// ---------- Datos de publicaciones ----------
function getUserItems() {
    return readStorage('truequeu_items', []);
}

function allItems() {
    return [...getUserItems(), ...SEED_ITEMS];
}

function findItem(id) {
    return allItems().find(i => i.id === id);
}

function getFavs() {
    return readStorage('truequeu_favs', []);
}

function getReports() {
    return readStorage('truequeu_reports', []);
}

function getInterest(id) {
    return readStorage('truequeu_interest', {})[id] || 0;
}

function addInterest(id) {
    const map = readStorage('truequeu_interest', {});
    map[id] = (map[id] || 0) + 1;
    writeStorage('truequeu_interest', map);
}

// ---------- Reseñas y reputación ----------
function getReviews(itemId) {
    const stored = readStorage('truequeu_reviews', {});
    return [...(stored[itemId] || []), ...(SEED_REVIEWS[itemId] || [])];
}

function addReview(itemId, review) {
    const stored = readStorage('truequeu_reviews', {});
    stored[itemId] = stored[itemId] || [];
    stored[itemId].unshift(review);
    return writeStorage('truequeu_reviews', stored);
}

function averageRating(reviews) {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

function starsHTML(avg) {
    const rounded = Math.round(avg);
    let out = '';
    for (let i = 1; i <= 5; i++) {
        out += `<span class="${i <= rounded ? 'star filled' : 'star'}">★</span>`;
    }
    return out;
}

function ratingLineHTML(itemId) {
    const reviews = getReviews(itemId);
    if (!reviews.length) return `<span class="rating-empty">Sin reseñas aún</span>`;
    const avg = averageRating(reviews);
    return `${starsHTML(avg)} <span class="rating-number">${avg.toFixed(1)} (${reviews.length})</span>`;
}

function sellerStats(userName) {
    const items = allItems().filter(i => i.userName === userName);
    let sum = 0;
    let count = 0;
    items.forEach(i => getReviews(i.id).forEach(r => { sum += r.rating; count++; }));
    return {
        avg: count ? sum / count : 0,
        reviews: count,
        done: items.filter(i => i.status === 'cerrado').length,
        total: items.length
    };
}

function reputationText(userName) {
    const s = sellerStats(userName);
    const parts = [];
    if (s.reviews) parts.push(`★ ${s.avg.toFixed(1)} (${s.reviews})`);
    if (s.done) parts.push(`${s.done} entrega${s.done === 1 ? '' : 's'}`);
    return parts.length ? parts.join(' · ') : 'Usuario nuevo';
}

// ---------- Filtros, orden y paginación ----------
function readFilters() {
    return {
        search: document.getElementById('searchInput').value.toLowerCase().trim(),
        category: document.getElementById('categoryFilter').value,
        type: document.getElementById('typeFilter').value,
        condition: document.getElementById('conditionFilter').value,
        materia: document.getElementById('materiaFilter').value.toLowerCase().trim(),
        sede: document.getElementById('sedeFilter').value.toLowerCase().trim(),
        sort: document.getElementById('sortSelect').value,
        onlyAvailable: document.getElementById('onlyAvailable').checked,
        onlyFavs: document.getElementById('onlyFavs').checked
    };
}

function getFilteredItems() {
    const f = readFilters();
    const reported = new Set(getReports().map(r => r.id));
    const favs = new Set(getFavs());

    const list = allItems().filter(item => {
        if (reported.has(item.id)) return false;
        if (f.onlyAvailable && item.status === 'cerrado') return false;
        if (f.onlyFavs && !favs.has(item.id)) return false;
        if (f.category !== 'todos' && item.category !== f.category) return false;
        if (f.type !== 'todos' && item.type !== f.type) return false;
        if (f.condition !== 'todos' && item.condition !== f.condition) return false;
        if (f.materia && !(item.materia || '').toLowerCase().includes(f.materia)) return false;
        if (f.sede && !(item.sede || '').toLowerCase().includes(f.sede)) return false;
        if (f.search) {
            const haystack = [item.title, item.description, item.materia, item.sede].join(' ').toLowerCase();
            if (!haystack.includes(f.search)) return false;
        }
        return true;
    });

    const byRecent = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);
    const priceOf = (item, fallback) => (item.type === 'venta' && item.price != null ? item.price : fallback);

    if (f.sort === 'precio-asc') {
        list.sort((a, b) => priceOf(a, Infinity) - priceOf(b, Infinity) || byRecent(a, b));
    } else if (f.sort === 'precio-desc') {
        list.sort((a, b) => priceOf(b, -1) - priceOf(a, -1) || byRecent(a, b));
    } else if (f.sort === 'calificacion') {
        list.sort((a, b) => averageRating(getReviews(b.id)) - averageRating(getReviews(a.id)) || byRecent(a, b));
    } else {
        list.sort(byRecent);
    }
    return list;
}

// ---------- Tarjetas ----------
function cardHTML(item, favs, profile) {
    const info = TYPE_INFO[item.type] || TYPE_INFO.intercambio;
    const categoryName = CATEGORY_NAMES[item.category] || item.category;
    const isClosed = item.status === 'cerrado';
    const isOwner = item.ownerId === profile.ownerId;
    const isFav = favs.has(item.id);
    const interested = getInterest(item.id);

    const photo = item.photo && String(item.photo).startsWith('data:image/')
        ? `<img class="card-photo" src="${escapeHTML(item.photo)}" alt="Foto de ${escapeHTML(item.title)}">`
        : '';

    const priceHTML = item.type === 'venta' && item.price != null
        ? `<p class="price">${escapeHTML(formatPrice(item.price))}</p>` : '';

    const conditionBadge = item.condition
        ? `<span class="badge badge-condition">${escapeHTML(CONDITION_NAMES[item.condition] || item.condition)}</span>` : '';

    const closedBadge = isClosed
        ? `<span class="badge badge-closed">${item.type === 'venta' ? 'Vendido' : item.type === 'busco' ? 'Conseguido' : 'Entregado'}</span>` : '';

    const tags = [item.materia, item.sede].filter(Boolean)
        .map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');

    const closeLabel = isClosed ? 'Reabrir'
        : item.type === 'venta' ? 'Marcar vendido'
        : item.type === 'busco' ? 'Ya lo conseguí'
        : 'Marcar entregado';

    const ownerActions = isOwner ? `
        <div class="owner-actions">
            <button type="button" class="btn-link" data-action="edit">Editar</button>
            <button type="button" class="btn-link" data-action="close">${closeLabel}</button>
            <button type="button" class="btn-link danger" data-action="delete">Eliminar</button>
        </div>` : '';

    const contactBtn = isClosed
        ? `<button class="btn-contact" type="button" disabled>No disponible</button>`
        : `<button class="btn-contact" type="button" data-action="contact">${escapeHTML(info.action)}</button>`;

    return `
        <article class="card${isClosed ? ' closed' : ''}" data-id="${escapeHTML(item.id)}">
            <div class="card-top">
                <div class="badges">
                    <span class="badge ${info.css}">${info.text}</span>
                    ${conditionBadge}
                    ${closedBadge}
                </div>
                <div class="card-icons">
                    <button type="button" class="icon-btn fav${isFav ? ' active' : ''}" data-action="fav"
                        aria-label="${isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}" aria-pressed="${isFav}">♥</button>
                    ${isOwner ? '' : '<button type="button" class="icon-btn" data-action="report" aria-label="Reportar publicación" title="Reportar">⚑</button>'}
                </div>
            </div>
            ${photo}
            <div class="card-body">
                <h3>${escapeHTML(item.title)}</h3>
                <p class="category">Categoría: ${escapeHTML(categoryName)}</p>
                ${priceHTML}
                ${tags ? `<div class="tags">${tags}</div>` : ''}
                <p class="description">${escapeHTML(item.description)}</p>
                <div class="rating-row">
                    <span class="rating-line">${ratingLineHTML(item.id)}</span>
                    <button class="btn-reviews" type="button" data-action="reviews">Ver / escribir reseñas</button>
                </div>
                ${interested ? `<p class="interest">${interested} interesado${interested === 1 ? '' : 's'}</p>` : ''}
                ${ownerActions}
                <div class="card-footer">
                    <span class="user-info">
                        Publicado por: ${escapeHTML(item.userName)}
                        <small class="reputation">${escapeHTML(reputationText(item.userName))}</small>
                    </span>
                    ${contactBtn}
                </div>
            </div>
        </article>`;
}

function render() {
    const grid = document.getElementById('materialsGrid');
    const list = getFilteredItems();
    const shown = list.slice(0, state.visible);
    const favs = new Set(getFavs());
    const profile = getProfile();

    grid.innerHTML = shown.map(item => cardHTML(item, favs, profile)).join('');

    document.getElementById('emptyMessage').hidden = list.length > 0;
    document.getElementById('loadMoreBtn').hidden = list.length <= state.visible;
    document.getElementById('resultsCount').textContent =
        list.length ? `Mostrando ${shown.length} de ${list.length}` : '';

    renderStats();
}

function renderStats() {
    const items = allItems();
    document.getElementById('statTotal').textContent = items.length;
    document.getElementById('statDonations').textContent = items.filter(i => i.type === 'donacion').length;
    document.getElementById('statTrades').textContent = items.filter(i => i.type === 'intercambio').length;
    document.getElementById('statSales').textContent = items.filter(i => i.type === 'venta').length;
    document.getElementById('statDone').textContent = items.filter(i => i.status === 'cerrado').length;
}

function resetPagingAndRender() {
    state.visible = PAGE_SIZE;
    render();
}

// ---------- Fotos ----------
function resizeImage(file, maxSize = 600) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

function showPhotoPreview() {
    const wrap = document.getElementById('photoPreview');
    if (state.photoData) {
        document.getElementById('photoPreviewImg').src = state.photoData;
        wrap.hidden = false;
    } else {
        document.getElementById('photoPreviewImg').removeAttribute('src');
        wrap.hidden = true;
    }
}

// ---------- Formulario ----------
function toggleFormFields() {
    const type = document.getElementById('itemType').value;
    const isSale = type === 'venta';
    const isSeek = type === 'busco';

    document.getElementById('priceGroup').hidden = !isSale;
    document.getElementById('itemPrice').required = isSale;
    if (!isSale) document.getElementById('itemPrice').value = '';

    document.getElementById('conditionGroup').hidden = isSeek;
    document.getElementById('photoGroup').hidden = isSeek;

    const label = document.getElementById('descriptionLabel');
    const textarea = document.getElementById('itemDescription');
    if (isSeek) {
        label.textContent = 'Describe lo que necesitas y qué ofreces a cambio:';
        textarea.placeholder = 'Ej. Busco la edición más reciente; puedo pagar o intercambiar.';
    } else if (isSale) {
        label.textContent = 'Descripción del material:';
        textarea.placeholder = 'Detalla el estado, la edición y si el precio es negociable.';
    } else if (type === 'donacion') {
        label.textContent = 'Descripción del material:';
        textarea.placeholder = 'Detalla el estado del útil y por qué lo donas.';
    } else {
        label.textContent = 'Descripción / Lo que pides a cambio:';
        textarea.placeholder = 'Detalla el estado del útil y qué buscas a cambio.';
    }
}

function resetForm() {
    const form = document.getElementById('publishForm');
    form.reset();
    state.editingId = null;
    state.photoData = null;
    showPhotoPreview();
    document.getElementById('formTitle').textContent = 'Publicar un Material';
    document.getElementById('submitBtn').textContent = 'Publicar Útil';
    document.getElementById('cancelEditBtn').hidden = true;
    toggleFormFields();
    refreshProfileUI();
}

function startEdit(itemId) {
    const profile = getProfile();
    const item = getUserItems().find(i => i.id === itemId && i.ownerId === profile.ownerId);
    if (!item) return;

    state.editingId = item.id;
    state.photoData = item.photo || null;

    document.getElementById('itemType').value = item.type;
    toggleFormFields();
    document.getElementById('itemTitle').value = item.title;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemCondition').value = item.condition || 'bueno';
    document.getElementById('itemPrice').value = item.price != null ? item.price : '';
    document.getElementById('itemMateria').value = item.materia || '';
    document.getElementById('itemSede').value = item.sede || '';
    document.getElementById('itemDescription').value = item.description;
    document.getElementById('userName').value = item.userName;
    document.getElementById('userContact').value = item.contact || '';
    showPhotoPreview();

    document.getElementById('formTitle').textContent = 'Editar publicación';
    document.getElementById('submitBtn').textContent = 'Guardar cambios';
    document.getElementById('cancelEditBtn').hidden = false;
    document.getElementById('publicar').scrollIntoView({ behavior: 'smooth' });
}

function handlePublish(e) {
    e.preventDefault();
    const profile = getProfile();
    const type = document.getElementById('itemType').value;

    const data = {
        title: document.getElementById('itemTitle').value.trim(),
        category: document.getElementById('itemCategory').value,
        type,
        description: document.getElementById('itemDescription').value.trim(),
        userName: document.getElementById('userName').value.trim(),
        contact: document.getElementById('userContact').value.trim(),
        materia: document.getElementById('itemMateria').value.trim(),
        sede: document.getElementById('itemSede').value.trim(),
        condition: type === 'busco' ? '' : document.getElementById('itemCondition').value
    };
    if (type === 'venta') data.price = Number(document.getElementById('itemPrice').value);
    if (type !== 'busco' && state.photoData) data.photo = state.photoData;

    const items = getUserItems();
    const wasEditing = Boolean(state.editingId);

    if (wasEditing) {
        const idx = items.findIndex(i => i.id === state.editingId && i.ownerId === profile.ownerId);
        if (idx === -1) {
            toast('No se encontró la publicación que intentabas editar.');
            resetForm();
            return;
        }
        const updated = { ...items[idx], ...data };
        if (!data.photo) delete updated.photo;
        if (type !== 'venta') delete updated.price;
        items[idx] = updated;
    } else {
        items.unshift({
            id: 'u-' + Date.now(),
            createdAt: Date.now(),
            status: 'disponible',
            ownerId: profile.ownerId,
            ...data
        });
    }

    if (!writeStorage('truequeu_items', items)) {
        toast('No se pudo guardar: el almacenamiento del navegador está lleno. Prueba con una foto más pequeña o sin foto.');
        return;
    }

    // Recordar nombre y contacto la primera vez
    const patch = {};
    if (!profile.name) patch.name = data.userName;
    if (!profile.contact) patch.contact = data.contact;
    if (Object.keys(patch).length) saveProfile(patch);

    resetForm();
    resetPagingAndRender();
    toast(wasEditing ? 'Cambios guardados.' : '¡Tu material ha sido publicado con éxito!');
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
}

// ---------- Acciones de las tarjetas ----------
function toggleFav(itemId) {
    const favs = getFavs();
    const idx = favs.indexOf(itemId);
    if (idx === -1) favs.push(itemId); else favs.splice(idx, 1);
    writeStorage('truequeu_favs', favs);
    render();
}

function toggleClosed(itemId) {
    const profile = getProfile();
    const items = getUserItems();
    const item = items.find(i => i.id === itemId && i.ownerId === profile.ownerId);
    if (!item) return;
    item.status = item.status === 'cerrado' ? 'disponible' : 'cerrado';
    writeStorage('truequeu_items', items);
    render();
}

function deleteItem(itemId) {
    const profile = getProfile();
    if (!window.confirm('¿Seguro que quieres eliminar esta publicación? No se puede deshacer.')) return;
    const items = getUserItems().filter(i => !(i.id === itemId && i.ownerId === profile.ownerId));
    writeStorage('truequeu_items', items);
    if (state.editingId === itemId) resetForm();
    render();
    toast('Publicación eliminada.');
}

// ---------- Contacto ----------
function parseContact(contact) {
    const text = String(contact || '');
    const emailMatch = text.match(/[^\s\/,;]+@[^\s\/,;]+\.[^\s\/,;]+/);
    const email = emailMatch ? emailMatch[0] : '';
    const rest = email ? text.replace(email, ' ') : text;
    const digits = (rest.match(/\d[\d\s\-().+]{5,}\d/) || [''])[0].replace(/\D/g, '');
    let phone = '';
    if (digits.length === 10) phone = '57' + digits;           // celular colombiano sin indicativo
    else if (digits.length >= 11 && digits.length <= 15) phone = digits;
    return { email, phone };
}

function openContact(itemId) {
    const item = findItem(itemId);
    if (!item) return;
    state.contactItem = item;

    document.getElementById('modalTitle').textContent = `Contactar a ${item.userName}`;
    document.getElementById('modalDetail').textContent = `Estás interesado en: "${item.title}"`;
    document.getElementById('messageText').value = '';

    const { email, phone } = parseContact(item.contact);
    const actions = document.getElementById('contactActions');
    const note = document.getElementById('contactNote');
    actions.innerHTML = '';
    note.hidden = true;

    if (phone) {
        actions.insertAdjacentHTML('beforeend', '<button type="button" class="btn-primary" data-contact-via="wa">Enviar por WhatsApp</button>');
    }
    if (email) {
        actions.insertAdjacentHTML('beforeend', '<button type="button" class="btn-primary alt" data-contact-via="mail">Enviar por correo</button>');
    }
    if (!phone && !email) {
        note.textContent = 'Esta publicación no tiene un medio de contacto válido.';
        note.hidden = false;
    }
    openModal('contactModal');
}

function contactVia(channel) {
    const item = state.contactItem;
    if (!item) return;
    const { email, phone } = parseContact(item.contact);
    const userMsg = document.getElementById('messageText').value.trim();
    const point = document.getElementById('meetingPoint').value;

    if (!userMsg) {
        toast('Por favor escribe un mensaje antes de enviar.');
        return;
    }

    const body = `Hola ${item.userName}, vi tu publicación "${item.title}" en TruequeU. ${userMsg}\nPunto de encuentro sugerido: ${point}.`;

    addInterest(item.id);

    if (channel === 'wa' && phone) {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
    } else if (channel === 'mail' && email) {
        const subject = `Sobre tu publicación en TruequeU: ${item.title}`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    closeModal('contactModal');
    render();
    toast('Abrimos tu mensaje listo para enviar.');
}

// ---------- Reseñas (modal) ----------
function openReviews(itemId) {
    const item = findItem(itemId);
    if (!item) return;
    state.reviewItemId = itemId;
    state.rating = 0;
    paintStarInput();
    document.getElementById('reviewForm').reset();
    const profile = getProfile();
    if (profile.name) document.getElementById('reviewName').value = profile.name;
    document.getElementById('reviewModalTitle').textContent = `Reseñas: ${item.title}`;
    renderReviewList(itemId);
    openModal('reviewModal');
}

function renderReviewList(itemId) {
    const reviews = getReviews(itemId);
    const list = document.getElementById('reviewList');
    const summary = document.getElementById('reviewSummary');

    if (!reviews.length) {
        summary.textContent = 'Todavía no hay reseñas. ¡Sé el primero en opinar!';
        list.innerHTML = '';
        return;
    }

    const avg = averageRating(reviews);
    summary.innerHTML = `${starsHTML(avg)} <strong>${avg.toFixed(1)}</strong> de 5 · ${reviews.length} reseña${reviews.length === 1 ? '' : 's'}`;

    list.innerHTML = reviews.map(r => `
        <div class="review-item">
            <div class="review-head">
                <strong>${escapeHTML(r.name)}</strong>
                <span>${starsHTML(r.rating)}</span>
                <small>${escapeHTML(r.date)}</small>
            </div>
            <p>${escapeHTML(r.comment)}</p>
        </div>
    `).join('');
}

function paintStarInput() {
    document.querySelectorAll('#starInput button').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.value) <= state.rating);
    });
}

function handleReviewSubmit(e) {
    e.preventDefault();
    if (!state.rating) {
        toast('Por favor selecciona una calificación de 1 a 5 estrellas.');
        return;
    }
    const review = {
        name: document.getElementById('reviewName').value.trim(),
        rating: state.rating,
        comment: document.getElementById('reviewComment').value.trim(),
        date: new Date().toISOString().slice(0, 10)
    };
    if (!addReview(state.reviewItemId, review)) {
        toast('No se pudo guardar la reseña.');
        return;
    }
    e.target.reset();
    state.rating = 0;
    paintStarInput();
    renderReviewList(state.reviewItemId);
    render();
}

// ---------- Reportes ----------
function openReport(itemId) {
    const item = findItem(itemId);
    if (!item) return;
    state.reportItemId = itemId;
    document.getElementById('reportDetail').textContent = `Publicación: "${item.title}"`;
    document.getElementById('reportForm').reset();
    openModal('reportModal');
}

function handleReportSubmit(e) {
    e.preventDefault();
    const reports = getReports();
    reports.push({
        id: state.reportItemId,
        reason: document.getElementById('reportReason').value,
        date: new Date().toISOString()
    });
    writeStorage('truequeu_reports', reports);
    closeModal('reportModal');
    render();
    toast('Gracias por avisar. Ocultamos esta publicación de tu catálogo.');
}

// ---------- Perfil (modal) ----------
function openProfile() {
    const profile = getProfile();
    document.getElementById('profileName').value = profile.name || '';
    document.getElementById('profileContact').value = profile.contact || '';

    const mine = getUserItems().filter(i => i.ownerId === profile.ownerId);
    const done = mine.filter(i => i.status === 'cerrado').length;
    let sum = 0;
    let n = 0;
    mine.forEach(i => getReviews(i.id).forEach(r => { sum += r.rating; n++; }));
    document.getElementById('profileStats').innerHTML = `
        <p><strong>${mine.length}</strong> publicación${mine.length === 1 ? '' : 'es'} ·
        <strong>${done}</strong> entrega${done === 1 ? '' : 's'} ·
        ${n ? `${starsHTML(sum / n)} <strong>${(sum / n).toFixed(1)}</strong> (${n})` : 'sin reseñas aún'}</p>`;
    openModal('profileModal');
}

function handleProfileSubmit(e) {
    e.preventDefault();
    saveProfile({
        name: document.getElementById('profileName').value.trim(),
        contact: document.getElementById('profileContact').value.trim()
    });
    // Que el formulario de publicación use los nuevos datos
    if (!state.editingId) {
        document.getElementById('userName').value = '';
        document.getElementById('userContact').value = '';
    }
    refreshProfileUI();
    closeModal('profileModal');
    toast('Perfil guardado.');
}

// ---------- Tema ----------
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').textContent = theme === 'dark' ? 'Modo claro' : 'Modo oscuro';
}

function initTheme() {
    let theme = null;
    try { theme = localStorage.getItem('truequeu_theme'); } catch (e) { /* sin almacenamiento */ }
    if (!theme) {
        theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(theme);
}

function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('truequeu_theme', next); } catch (e) { /* sin almacenamiento */ }
}

// ---------- Inicialización ----------
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    toggleFormFields();
    refreshProfileUI();
    render();

    // Filtros
    ['searchInput', 'materiaFilter', 'sedeFilter'].forEach(id =>
        document.getElementById(id).addEventListener('input', resetPagingAndRender));
    ['categoryFilter', 'typeFilter', 'conditionFilter', 'sortSelect', 'onlyAvailable', 'onlyFavs'].forEach(id =>
        document.getElementById(id).addEventListener('change', resetPagingAndRender));

    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        state.visible += PAGE_SIZE;
        render();
    });

    // Formulario
    document.getElementById('itemType').addEventListener('change', toggleFormFields);
    document.getElementById('publishForm').addEventListener('submit', handlePublish);
    document.getElementById('cancelEditBtn').addEventListener('click', resetForm);

    document.getElementById('itemPhoto').addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast('Selecciona un archivo de imagen.');
            e.target.value = '';
            return;
        }
        try {
            state.photoData = await resizeImage(file);
            showPhotoPreview();
        } catch (err) {
            toast('No se pudo leer la imagen.');
        }
    });

    document.getElementById('removePhotoBtn').addEventListener('click', () => {
        state.photoData = null;
        document.getElementById('itemPhoto').value = '';
        showPhotoPreview();
    });

    // Tarjetas (delegación de eventos)
    document.getElementById('materialsGrid').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const card = btn.closest('.card');
        if (!card) return;
        const id = card.getAttribute('data-id');

        switch (btn.dataset.action) {
            case 'contact': openContact(id); break;
            case 'reviews': openReviews(id); break;
            case 'fav': toggleFav(id); break;
            case 'report': openReport(id); break;
            case 'edit': startEdit(id); break;
            case 'close': toggleClosed(id); break;
            case 'delete': deleteItem(id); break;
        }
    });

    // Contacto
    document.getElementById('contactActions').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-contact-via]');
        if (btn) contactVia(btn.dataset.contactVia);
    });

    // Reseñas
    document.getElementById('starInput').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-value]');
        if (!btn) return;
        state.rating = Number(btn.dataset.value);
        paintStarInput();
    });
    document.getElementById('reviewForm').addEventListener('submit', handleReviewSubmit);

    // Reporte y perfil
    document.getElementById('reportForm').addEventListener('submit', handleReportSubmit);
    document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
    document.getElementById('profileBtn').addEventListener('click', openProfile);

    // Tema y menú móvil
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');
    menuToggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) {
            nav.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Cerrar modales: botón X, clic en el fondo o tecla Escape
    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('[data-close]');
        if (closeBtn) closeModal(closeBtn.dataset.close);
        if (e.target.classList && e.target.classList.contains('modal')) closeModal(e.target.id);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(m => { m.style.display = 'none'; });
        }
    });
});
