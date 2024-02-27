let currentPokemonId = null;
let isShinyEnabled = false;

document.addEventListener('DOMContentLoaded', () => {
  const MAX_POKEMONS = 386;

  const pokemonID = new URLSearchParams(window.location.search).get('id');
  const id = parseInt(pokemonID, 10);

  if (id < 1 || id > MAX_POKEMONS) {
    return (window.location.href = './index.html');
  }

  currentPokemonId = id;
  loadPokemon(id);

  const toggleShinyButton = document.getElementById('toggleShinyButton');
  toggleShinyButton.addEventListener('click', toggleShinyForm);

});

async function loadPokemon(id, preserveShinyStatus = false) {
  try {

    // Preserve shiny status if indicated
    if (!preserveShinyStatus) {
      isShinyEnabled = false;
    }

    const [pokemon, pokemonSpecies] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) =>
        res.json()
      ),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then((res) =>
        res.json()
      ),
    ]);

    const abilitiesWrapper = document.querySelector(
      '.pokemon-detail-wrap .pokemon-detail.move'
    );
    abilitiesWrapper.innerHTML = '';

    if (currentPokemonId === id) {
      displayPokemonDetails(pokemon);
      const flavorText = getEnglishFlavorText(pokemonSpecies);
      document.querySelector('.body3-fonts.pokemon-description').textContent =
        flavorText;

      const [leftArrow, rightArrow] = ['#leftArrow', '#rightArrow'].map((sel) =>
        document.querySelector(sel)
      );
      leftArrow.removeEventListener('click', navigatePokemon);
      rightArrow.removeEventListener('click', navigatePokemon);

      if (id !== 1) {
        leftArrow.addEventListener('click', () => {
          navigatePokemon(id - 1);
        });
      }
      if (id !== 386) {
        rightArrow.addEventListener('click', () => {
          navigatePokemon(id + 1);
        });
      }

      window.history.pushState({}, '', `./detail.html?id=${id}`);
    }

    return true;
  } catch (error) {
    console.error('An error occured while fetching Pokemon data:', error);
    return false;
  }
}

async function navigatePokemon(id) {
  currentPokemonId = id;
  await loadPokemon(id);
}


function setElementStyles(elements, cssProperty, value) {
  elements.forEach((element) => {
    element.style[cssProperty] = value;
  });
}

function rgbaFromHex(hexColor) {
  return [
    parseInt(hexColor.slice(1, 3), 16),
    parseInt(hexColor.slice(3, 5), 16),
    parseInt(hexColor.slice(5, 7), 16),
  ].join(', ');
}


function setTypeBackgroundColor(pokemon) {
  const typeColors = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
  };

  const types = pokemon.types;

  if (types.length === 1) {
    const mainType = types[0].type.name;
    const color = typeColors[mainType];
    applyBackgroundColor(color);
  } else if (types.length === 2) {
    const mainType = types[0].type.name;
    const subType = types[1].type.name;

    const mainColor = typeColors[mainType];
    const subColor = typeColors[subType];

    applyBackgroundColor(mainColor, subColor);
  } else {
    console.warn('Unexpected number of types for the Pokémon:', types.length);
  }
}

function applyBackgroundColor(mainColor, subColor = null) {
  const detailMainElement = document.querySelector('.detail-main');
  setElementStyles([detailMainElement], 'backgroundColor', mainColor);
  setElementStyles([detailMainElement], 'borderColor', mainColor);

  setElementStyles(
    document.querySelectorAll('.power-wrapper > p'),
    'backgroundColor',
    mainColor
  );

  setElementStyles(
    document.querySelectorAll('.stats-wrap p.stats'),
    'color',
    mainColor
  );

  setElementStyles(
    document.querySelectorAll('.stats-wrap .progress-bar'),
    'color',
    mainColor
  );

  if (subColor) {
    const subTypeElement = document.querySelector('.power-wrapper > p:nth-child(2)');
    setElementStyles([subTypeElement], 'backgroundColor', subColor);
  }

  const rgbaMainColor = rgbaFromHex(mainColor);
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .stats-wrap .progress-bar::-webkit-progress-bar {
        background-color: rgba(${rgbaMainColor}, 0.5);
    }
    .stats-wrap .progress-bar::-webkit-progress-value {
        background-color: ${mainColor};
    }
  `;

  document.head.appendChild(styleTag);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function createAndAppendElement(parent, tag, options = {}) {
  const element = document.createElement(tag);
  Object.keys(options).forEach((key) => {
    element[key] = options[key];
  });
  parent.appendChild(element);
  return element;
}

function displayPokemonDetails(pokemon) {
  const { name, id, types, weight, height, abilities, stats } = pokemon;
  const capitalizePokemonName = capitalizeFirstLetter(name);

  document.querySelector('title').textContent = capitalizePokemonName;

  const detailMainElement = document.querySelector('.detail-main');
  detailMainElement.classList.add(name.toLowerCase());

  document.querySelector('.name-wrap .name').textContent =
    capitalizePokemonName;

  document.querySelector(
    '.pokemon-id-wrap .body2-fonts'
  ).textContent = `#${String(id).padStart(3, '0')}`;


  const shiny = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;
  const notShiny = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

  const imageElement = document.querySelector('.detail-img-wrapper img');
  imageElement.src = isShinyEnabled ? shiny : notShiny;
  imageElement.alt = name;

  const typeWrapper = document.querySelector('.power-wrapper');
  typeWrapper.innerHTML = '';
  types.forEach(({ type }) => {
    createAndAppendElement(typeWrapper, 'p', {
      className: `body3-fonts type ${type.name}`,
      textContent: type.name,
    });
  });

  document.querySelector(
    '.pokemon-detail-wrap .pokemon-detail p.body3-fonts.weight'
  ).textContent = `${weight / 10}kg`;
  document.querySelector(
    '.pokemon-detail-wrap .pokemon-detail p.body3-fonts.height'
  ).textContent = `${height / 10}m`;

  const abilitiesWrapper = document.querySelector(
    '.pokemon-detail-wrap .pokemon-detail.move'
  );
  abilitiesWrapper.innerHTML = '';
  
  const firstAbility = abilities[0];
  if (firstAbility) {
    createAndAppendElement(abilitiesWrapper, 'p', {
      className: 'body3-fonts',
      textContent: firstAbility.ability.name,
    });
  }

  const statsWrapper = document.querySelector('.stats-wrapper');
  statsWrapper.innerHTML = '';

  const statNameMapping = {
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    'special-attack': 'SATK',
    'special-defense': 'SDEF',
    speed: 'SPD',
  };

  stats.forEach(({ stat, base_stat }) => {
    const statDiv = document.createElement('div');
    statDiv.className = 'stats-wrap';
    statsWrapper.appendChild(statDiv);

    createAndAppendElement(statDiv, 'p', {
      className: 'body3-fonts stats',
      textContent: statNameMapping[stat.name],
    });

    createAndAppendElement(statDiv, 'p', {
      className: 'body3-fonts',
      textContent: String(base_stat).padStart(3, '0'),
    });

    createAndAppendElement(statDiv, 'progress', {
      className: 'progress-bar',
      value: base_stat,
      max: 200,
    });
  });

  setTypeBackgroundColor(pokemon);
}


function getEnglishFlavorText(pokemonSpecies) {
  const entry = pokemonSpecies.flavor_text_entries.find(entry => entry.language.name === 'en' && entry.version.name === 'firered');
  return entry ? entry.flavor_text.trim() : '';
}

async function toggleShinyForm() {
  isShinyEnabled = !isShinyEnabled; // Toggle the shiny status
  
  // Reload the Pokémon details with the new shiny status
  loadPokemon(currentPokemonId, true);
}