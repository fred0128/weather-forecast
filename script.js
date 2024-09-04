function formatDate(date) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'long'
    };
    return new Intl.DateTimeFormat('en-EN', options).format(date);
}

function formatTime(date) {
    return date.toLocaleTimeString('en-EN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('date').innerText = formatDate(now);
    document.getElementById('clock').innerText = formatTime(now);
}

setInterval(updateDateTime, 1000);

async function getWeather(latitude, longitude) {
    const apiKey = "059598a7391e3713682102e8fcb873f3";
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=az&appid=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.cod === '404') {
            showErrorMessage('No weather data found. Please try again.');
        } else {
            const weatherIcon = getWeatherIcon(data.weather[0].main);
            document.getElementById('weather-location').innerText = `${data.name}`;
            document.getElementById('weather-description').innerText = data.weather[0].description;
            document.getElementById('weather-temperature').innerText = `${Math.round(data.main.temp)}°`;
            document.getElementById('weather-humidity').innerText = `Humidity: ${data.main.humidity}%`;
            document.getElementById('weather-wind-speed').innerText = `Wind speed: ${data.wind.speed} m/s`;
            document.getElementById('weather-cloudiness').innerText = `Cloudiness: ${data.clouds.all}%`;
            document.getElementById('weather-rain').innerText = data.rain ? `Rain: ${data.rain['1h']} mm/s` : 'Rain: 0%';
            document.getElementById('weather-icon').src = weatherIcon;
            changeBackground(data.weather[0].main);
            updateRecentSearches(data.name);
        }
    } catch (error) {
        showErrorMessage('An error occurred while retrieving weather data.');
    }
}

function getWeatherIcon(weatherCondition) {
    let iconUrl;

    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            iconUrl = 'http://openweathermap.org/img/wn/01d@2x.png';
            break;
        case 'clouds':
            iconUrl = 'http://openweathermap.org/img/wn/03d@2x.png';
            break;
        case 'rain':
            iconUrl = 'http://openweathermap.org/img/wn/10d@2x.png';
            break;
        case 'snow':
            iconUrl = 'http://openweathermap.org/img/wn/13d@2x.png';
            break;
        case 'thunderstorm':
            iconUrl = 'http://openweathermap.org/img/wn/11d@2x.png';
            break;
        default:
            iconUrl = 'default-weather-icon.png';
            break;
    }

    return iconUrl;
}

async function getWeatherByCity(city) {
    const apiKey = "059598a7391e3713682102e8fcb873f3";
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=az&appid=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.cod === '404') {
            showErrorMessage('Şəhər tapılmadı. Zəhmət olmasa, yenidən cəhd edin.');
        } else {
            const weatherIcon = getWeatherIcon(data.weather[0].main);
            document.getElementById('weather-location').innerText = `${data.name}, ${data.sys.country}`;
            document.getElementById('weather-description').innerText = data.weather[0].description;
            document.getElementById('weather-temperature').innerText = `${Math.round(data.main.temp)}°`;
            document.getElementById('weather-humidity').innerText = `Humidity: ${data.main.humidity}%`;
            document.getElementById('weather-wind-speed').innerText = `Wind speed: ${data.wind.speed} m/s`;
            document.getElementById('weather-cloudiness').innerText = `Cloudiness: ${data.clouds.all}%`;
            document.getElementById('weather-rain').innerText = data.rain ? `Rain: ${data.rain['1h']} mm/s` : 'Rain: 0%';
            document.getElementById('weather-icon').src = weatherIcon;

            updateRecentSearches(data.name);
        }
    } catch (error) {
        showErrorMessage('Hava məlumatları alınarkən bir xəta baş verdi.');
        console.error(error);
    }
}

function updateRecentSearches(city = null) {
    const searchList = document.getElementById('search-list');
    let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];

    if (city && !searches.includes(city)) {
        searches.push(city);
        if (searches.length > 5) {
            searches.shift();
        }
        localStorage.setItem('recentSearches', JSON.stringify(searches));
    }

    searchList.innerHTML = '';
    searches.forEach(search => {
        const listItem = document.createElement('li');
        listItem.innerText = search;

        listItem.addEventListener('click', () => {
            getWeatherByCity(search);
        });

        searchList.appendChild(listItem);
    });
}

console.log('Recent Searches:', JSON.parse(localStorage.getItem('recentSearches')));

function searchCity() {
    const city = document.getElementById('city-input').value;
    if (city) {
        getWeatherByCity(city);
    }
}

function showErrorMessage(message) {
    const infoDiv = document.getElementById('info-div');
    if (infoDiv) {
        infoDiv.innerText = message;
        infoDiv.style.display = 'block';
        setTimeout(() => {
            infoDiv.style.display = 'none';
        }, 3000);
    } else {
        console.error('info-div element not found');
    }
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            showErrorMessage("User has not granted location permission. Getting IP based location...");
            getIPLocation();
            break;
        case error.POSITION_UNAVAILABLE:
            showErrorMessage("Unable to obtain location information. Obtaining IP based location...");
            getIPLocation();
            break;
        case error.TIMEOUT:
            showErrorMessage("Location acquisition timeout. Retrieving IP based location...");
            getIPLocation();
            break;
        case error.UNKNOWN_ERROR:
            showErrorMessage("An unknown error occurred. Retrieving IP based location...");
            getIPLocation();
            break;
    }
}

async function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                getWeather(latitude, longitude);
            },
            showError,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        showErrorMessage("Your browser does not support location feature. Getting IP based location...");
        getIPLocation();
    }
}

async function getIPLocation() {
    const apiKey = "ed2bc296552a49df8a19a2af84b7de9a";
    const apiUrl = `https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const latitude = data.latitude;
        const longitude = data.longitude;
        getWeather(latitude, longitude);
    } catch (error) {
        showErrorMessage('An error occurred while retrieving IP based location.');
    }
}

window.onload = function () {
    getLocation();
    updateDateTime();
    updateRecentSearches();
}

document.getElementById('city-input').addEventListener('focus', function () {
    document.querySelector('.sb-bpttom').classList.add('focused');
});

document.getElementById('city-input').addEventListener('blur', function () {
    document.querySelector('.sb-bpttom').classList.remove('focused');
});
