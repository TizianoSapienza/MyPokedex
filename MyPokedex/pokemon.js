class Pokemon {
  constructor(id, name, url) {
    this.id = id;
    this.name = name;
    this.url = url;
  }

  get imageUrl() {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${this.id}.png`;
  }
}

class Pokedex {
  constructor() {
    this.MAX_POKEMON = 386;
    this.listWrapper = document.querySelector('.list-wrapper');
    this.searchInput = document.querySelector('#search-input');
    this.numberFilter = document.querySelector('#number');
    this.nameFilter = document.querySelector('#name');
    this.caughtFilter = document.querySelector('#caught');
    this.uncaughtFilter = document.querySelector('#uncaught');
    this.notFoundMessage = document.querySelector('#not-found-message');
    this.allPokemons = [];

    this.init();
  }

  async init() {
    await this.fetchPokemons();
    this.displayPokemons(this.allPokemons);
    this.addEventListeners();
  }

  async fetchPokemons() {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon?limit=${this.MAX_POKEMON}`
    );
    const data = await response.json();
    this.allPokemons = data.results.map(
      (pokemon, index) => new Pokemon(index + 1, pokemon.name, pokemon.url)
    );
  }

  async fetchPokemonDataBeforeRedirect(id) {
    try {
      await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) =>
          res.json()
        ),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then((res) =>
          res.json()
        ),
      ]);
      return true;
    } catch (error) {
      console.error('Failed to fetch Pokemon data before redirect');
    }
  }

  createPokemonListItem(pokemon) {
    const listItem = document.createElement('div');
    listItem.className = 'list-item';
    const checkboxId = `checkbox-${pokemon.id}`;
    listItem.innerHTML = `
      <div class="number-wrap">
        <input type="checkbox" class="pokemon-checkbox" id="${checkboxId}">
        <p class="caption-fonts">#${pokemon.id}</p>
      </div>
      <div class="img-wrap">
        <img src="${pokemon.imageUrl}" alt="${pokemon.name}" />
      </div>
      <div class="name-wrap">
        <p class="body3-fonts">${pokemon.name}</p>
      </div>
    `;

    const checkbox = listItem.querySelector('.pokemon-checkbox');
    const isChecked = localStorage.getItem(checkboxId) === 'true';
    checkbox.checked = isChecked;

    checkbox.addEventListener('change', () => {
      localStorage.setItem(checkboxId, checkbox.checked);
    });

    listItem.addEventListener('click', async (event) => {
      if (!event.target.closest('.pokemon-checkbox')) {
        const success = await this.fetchPokemonDataBeforeRedirect(pokemon.id);
        if (success) {
          window.location.href = `./detail.html?id=${pokemon.id}`;
        }
      }
    });

    return listItem;
  }

  displayPokemons(pokemonList) {
    const fragment = document.createDocumentFragment();

    pokemonList.forEach((pokemon) => {
      const listItem = this.createPokemonListItem(pokemon);
      fragment.appendChild(listItem);
    });

    this.listWrapper.innerHTML = '';
    this.listWrapper.appendChild(fragment);
  }

  addEventListeners() {
    this.searchInput.addEventListener('keyup', () => this.handleSearch());
    
    const closeButton = document.querySelector('.search-close-icon');
    closeButton.addEventListener('click', () => this.clearSearch());

    const nameFilter = document.querySelector('#name');
    nameFilter.addEventListener('click', () => this.clearSearch());

    const numberFilter = document.querySelector('#number');
    numberFilter.addEventListener('click', () => this.clearSearch());

    const caughtFilter = document.querySelector('#caught');
    caughtFilter.addEventListener('change', () => this.handleCaughtFilter());

    const uncaughtFilter = document.querySelector('#uncaught');
    uncaughtFilter.addEventListener('change', () => this.handleUncaughtFilter());

    const resetButton = document.querySelector('#reset-button');
    resetButton.addEventListener('click', () => this.handleReset());
  }

  handleCaughtFilter() {
    this.clearSearch();
    const caughtPokemons = this.allPokemons.filter((pokemon) => {
      const checkboxId = `checkbox-${pokemon.id}`;
      const checkbox = document.getElementById(checkboxId);
      return checkbox.checked;
    });

    this.displayPokemons(caughtPokemons);
    return(caughtPokemons);
  }

  handleUncaughtFilter() {
    this.clearSearch();
    const uncaughtPokemons = this.allPokemons.filter((pokemon) => {
      const checkboxId = `checkbox-${pokemon.id}`;
      const checkbox = document.getElementById(checkboxId);
      return !checkbox || !checkbox.checked;
    });

    this.displayPokemons(uncaughtPokemons);
    return uncaughtPokemons;
  }

  handleSearch() {
    const searchTerm = this.searchInput.value.toLowerCase();
    let filteredPokemons;

    if (this.numberFilter.checked) {
      filteredPokemons = this.allPokemons.filter((pokemon) =>
        pokemon.id.toString().startsWith(searchTerm)
      );
    } else if (this.nameFilter.checked) {
      filteredPokemons = this.allPokemons.filter((pokemon) =>
        pokemon.name.toLowerCase().startsWith(searchTerm)
      );
    } else if (this.caughtFilter.checked) {
      filteredPokemons = this.allPokemons;
    }

    this.displayPokemons(filteredPokemons);

    this.notFoundMessage.style.display =
      filteredPokemons.length === 0 ? 'block' : 'none';
  }

  clearSearch() {
    this.searchInput.value = '';
    this.displayPokemons(this.allPokemons);
    this.notFoundMessage.style.display = 'none';
  }

  handleReset() {
    this.searchInput.value = '';
    const filters = document.querySelectorAll('input[name="filters"]');
    filters.forEach((filter) => {
      filter.checked = false; // Set default filter to "Name"
    });
    this.displayPokemons(this.allPokemons);
  }
}

const pokedex = new Pokedex();
