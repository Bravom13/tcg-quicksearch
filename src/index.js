import './style.css';

// --- Configuration ---
const POKEMON_TCG_API_KEY = 'be46a73c-f689-4beb-bac7-36e2c6c9deac'; // Replace with your key
const CARDS_PER_PAGE = 5;

// --- Application State ---
const state = {
    currentPage: 1,
    totalPages: 1,
    currentSearchTerm: '',
    cache: new Map(),
};

// --- HTML Structure ---
document.getElementById('app').innerHTML = `
    <div class="container">
        <h1>Pokémon TCG Quick Search</h1>
        <div class="search-container">
            <input type="text" id="card-name-input" placeholder="Enter card name (e.g., Pikachu)">
            <button id="search-button">Search</button>
        </div>
        <div class="options-container">
            <input type="checkbox" id="sort-by-newest-checkbox">
            <label for="sort-by-newest-checkbox">Sort by newest (slower)</label>
        </div>
        <div id="results-container"></div>
        <div id="pagination-container"></div>
        <div id="diagnostics-container"></div>
    </div>
`;

// --- DOM Elements ---
const searchButton = document.getElementById('search-button');
const cardNameInput = document.getElementById('card-name-input');
const sortCheckbox = document.getElementById('sort-by-newest-checkbox');
const resultsContainer = document.getElementById('results-container');
const paginationContainer = document.getElementById('pagination-container');
const diagnosticsContainer = document.getElementById('diagnostics-container');

// --- Functions ---

const getCardData = async (cardName, page) => {
    state.currentSearchTerm = cardName;
    state.currentPage = page;
    await fetchAndProcessCardData(cardName, page);
};

const fetchAndProcessCardData = async (cardName, page) => {
    showSpinner();
    disableControls();
    diagnosticsContainer.innerHTML = ''; // Clear diagnostics

    if (POKEMON_TCG_API_KEY === 'YOUR_API_KEY') {
        displayError('Please replace `YOUR_API_KEY` with your actual API key.');
        enableControls();
        return;
    }

    const sortByNewest = sortCheckbox.checked;
    const startTime = performance.now();

    try {
        // Step 1: Fetch only the card IDs for the page
        const idUrl = new URL('https://api.pokemontcg.io/v2/cards');
        const idParams = {
            q: `name:${cardName}*`,
            page: page,
            pageSize: CARDS_PER_PAGE,
            select: 'id'
        };
        if (sortByNewest) {
            idParams.orderBy = '-set.releaseDate';
        }
        idUrl.search = new URLSearchParams(idParams).toString();

        const idResponse = await fetch(idUrl, {
            headers: { 'X-Api-Key': POKEMON_TCG_API_KEY }
        });

        if (!idResponse.ok) throw new Error(`HTTP error! status: ${idResponse.status}`);

        const idResult = await idResponse.json();

        if (idResult.data.length === 0) {
            displayError('Card not found. Please try another search.');
            return;
        }

        // Update pagination and clear results area
        state.totalPages = Math.ceil(idResult.totalCount / CARDS_PER_PAGE);
        renderPaginationControls();
        resultsContainer.innerHTML = '';

        const endTime = performance.now();
        diagnosticsContainer.innerHTML = `ID Fetch Time: ${(endTime - startTime).toFixed(2)} ms. Now fetching details...`;

        // Step 2: Fetch details for each card individually
        idResult.data.map(cardInfo => fetchSingleCard(cardInfo.id));

    } catch (error) {
        console.error('Fetch error:', error);
        displayError('An error occurred while fetching card data.');
    } finally {
        enableControls();
    }
};

const fetchSingleCard = async (cardId) => {
    const cacheKey = `card_${cardId}`;
    if (state.cache.has(cacheKey)) {
        displaySingleCard(state.cache.get(cacheKey));
        return;
    }

    const url = new URL(`https://api.pokemontcg.io/v2/cards/${cardId}`);
    const params = {
        select: 'name,images,types,abilities,tcgplayer'
    };
    url.search = new URLSearchParams(params).toString();

    try {
        const response = await fetch(url, {
            headers: { 'X-Api-Key': POKEMON_TCG_API_KEY }
        });
        if (!response.ok) throw new Error(`Failed to fetch card ${cardId}`);
        
        const result = await response.json();
        const cardData = result.data;

        state.cache.set(cacheKey, cardData);
        displaySingleCard(cardData);
    } catch (error) {
        console.error(error);
        // Optionally display a placeholder for the failed card
    }
};

const displaySingleCard = (card) => {
    const cardResult = document.createElement('div');
    cardResult.className = 'card-result';
    const imageUrl = card.images?.small || '';
    cardResult.innerHTML = `
        <div class="card-image">
            <img src="${imageUrl}" alt="${card.name}" loading="lazy">
        </div>
        <div class="card-details">
            <h2>${card.name}</h2>
            <p><strong>Type:</strong> ${card.types ? card.types.join(', ') : 'N/A'}</p>
            ${renderAbilities(card.abilities)}
            ${renderPrices(card.tcgplayer?.prices)}
        </div>
    `;
    resultsContainer.appendChild(cardResult);
};

const renderAbilities = (abilities) => {
    if (!abilities) return '';
    return `
        <h3>Abilities</h3>
        <ul class="abilities-list">
            ${abilities.map(ability => `<li><strong>${ability.name}:</strong> ${ability.text}</li>`).join('')}
        </ul>
    `;
};

const renderPrices = (prices) => {
    if (!prices) return '';
    const priceList = Object.entries(prices).map(([key, value]) => {
        if (value && value.market) {
            return `<li><strong>${key}:</strong> ${value.market.toFixed(2)}</li>`;
        }
        return '';
    }).join('');

    return `
        <h3>Market Prices (from TCGplayer)</h3>
        <ul class="prices-list">${priceList}</ul>
    `;
};

const renderPaginationControls = () => {
    paginationContainer.innerHTML = '';
    if (state.totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = state.currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (state.currentPage > 1) getCardData(state.currentSearchTerm, state.currentPage - 1);
    });

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = state.currentPage === state.totalPages;
    nextButton.addEventListener('click', () => {
        if (state.currentPage < state.totalPages) getCardData(state.currentSearchTerm, state.currentPage + 1);
    });

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${state.currentPage} of ${state.totalPages}`;
    pageInfo.style.margin = '0 10px';

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);
};

const disableControls = () => {
    searchButton.disabled = true;
    cardNameInput.disabled = true;
    sortCheckbox.disabled = true;
    Array.from(paginationContainer.children).forEach(child => child.disabled = true);
};

const enableControls = () => {
    searchButton.disabled = false;
    cardNameInput.disabled = false;
    sortCheckbox.disabled = false;
};

const displayError = (message) => {
    resultsContainer.innerHTML = `<p class="error-message">${message}</p>`;
    paginationContainer.innerHTML = '';
    diagnosticsContainer.innerHTML = '';
};

const showSpinner = () => {
    resultsContainer.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    paginationContainer.innerHTML = '';
    diagnosticsContainer.innerHTML = '';
};

const displayRequestTime = (duration, fromCache = false) => {
    if (fromCache) {
        diagnosticsContainer.innerHTML = 'Request Time: <span style="color: green;">Served from cache</span>';
    } else {
        diagnosticsContainer.innerHTML = `Request Time: ${duration.toFixed(2)} ms`;
    }
};

// --- Event Listeners ---
searchButton.addEventListener('click', () => {
    const cardName = cardNameInput.value.trim();
    if (cardName) getCardData(cardName, 1);
});

cardNameInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') searchButton.click();
});
