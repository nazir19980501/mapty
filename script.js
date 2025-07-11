'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const toggleBtn = document.querySelector('.toggle-btn')

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.duration = duration;
    this.coords = coords; //[lat,lng]
    this.distance = distance;
  }

  _setDiscription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDiscription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDiscription();
  }

  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {

    // get postion from user
    this._getPosition();

    // get the data from loscal starage
    this._getLocalStorage()

    //atach event listiners
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not get your location');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const cords = [latitude, longitude];

    this.#map = L.map('map').setView(cords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

     this.#workouts.forEach(work => {
        
        this._renderingWorkoutMarker(work)
      })
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
    showSideBar()
  }

  _hideForm() {
    form.classList.add('hidden');
    showSideBar()
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // helper functions
    const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const isPositive = (...inputs) => inputs.every(inp => inp > 0);

    // get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if workount running crate running object

    if (type === 'running') {
      const cadence = +inputCadence.value;
      // chek if data is valid
      if (
        !validInput(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      ) {
        return alert('inputs have to be positive numbers');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout cycling create cycling object

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      // chek if data is valid
      if (
        !validInput(distance, duration, elevation) ||
        !isPositive(distance, duration)
      ) {
        return alert('inputs have to be positive numbers');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // add new object to workout array
    this.#workouts.push(workout);
    

    // rendreing workout on map as marker
    this._renderingWorkoutMarker(workout);

    // render workout on list
    this._renderWorkout(workout);

    //hide the form + clear inputs
    this._hideForm();

    //set local storge
    this._setLocalStorage()
  }

  _renderingWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .openPopup()
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.discription}`
      );

    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.discription}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
         `;
    if (workout.type === 'running')
      html += ` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;

    if (workout.type === 'cycling')
      html += ` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>`;

    form.insertAdjacentHTML('afterend', html);
  }
  //move the map to the marker
  _moveToPopup(e) {
  if(!this.#map) return;
    const workoutEL = e.target.closest('.workout')
    
     if(!workoutEL) return;

    const workout = this.#workouts.find(work => work.id === workoutEL.dataset.id)
  
    this.#map.setView(workout.coords, 13, {animate: true, pan:{duration:1},
    });
  }

    _setLocalStorage() {
      localStorage.setItem('workouts', JSON.stringify(this.#workouts))
      
    }
    _getLocalStorage() {
      const data = JSON.parse(localStorage.getItem('workouts'))

      if(!data) return
        
      this.#workouts = data
      

      this.#workouts.forEach(work => {
        this._renderWorkout(work)
    
      })
    }
}

const app = new App();


let side = 'forward'
let open = '0'
const sideBar = document.querySelector('.sidebar')
const icon = document.querySelector('.icon')



const showSideBar = function(){

  if (document.body.clientWidth > 580) return;

  if (side === 'forward') {
    side = 'back'
    open = '0'
  } else if(side === 'back') {
      side = 'forward'
      open = '-100%'
  }
  sideBar.style.transform = `translateX(${open})`
  

  icon.setAttribute('name', `chevron-${side}-outline`)

}

toggleBtn.addEventListener('click', showSideBar)
