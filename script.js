const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

const img = document.querySelector('.map-container img');
canvas.width = img.clientWidth;
canvas.height = img.clientHeight;

const mapElement = document.getElementById('vietnam-map');

let areas = [];
let locationsData = [];

fetch('provinces.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        locationsData = data;
        areas = locationsData.map(location => {
            if (!location.coords) {
                console.error('Missing coords for location:', location);
                return { coords: [], shape: 'poly' };
            }
            const coords = location.coords.split(',').map(Number);
            const shape = 'poly';
            return { coords, shape };
        });
        createMapAreas();
    })
    .catch(error => {
        console.error('Error loading the JSON file:', error);
    });

function createMapAreas() {
    // Xoá nội dung cũ
    mapElement.innerHTML = '';
    areas.forEach((area) => {
        const scaleX = img.clientWidth / img.naturalWidth;
        const scaleY = img.clientHeight / img.naturalHeight;
        const scaledCoords = area.coords.map((val, index) => {
            return index % 2 === 0 ? Math.round(val * scaleX) : Math.round(val * scaleY);
        });
        const areaElement = document.createElement('area');
        areaElement.setAttribute('shape', area.shape);
        areaElement.setAttribute('coords', scaledCoords.join(','));
        areaElement.setAttribute('href', 'javascript:void(0)');
        mapElement.appendChild(areaElement);
    });
    setupEventListeners();
}

// Cập nhật kích thước canvas và các vùng map khi cửa sổ thay đổi
window.addEventListener('resize', () => {
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    createMapAreas();
});

const drawOutline = (coords) => {
ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    const scaleX = canvas.width / img.naturalWidth;
    const scaleY = canvas.height / img.naturalHeight;
    ctx.moveTo(coords[0] * scaleX, coords[1] * scaleY);
    for (let i = 2; i < coords.length; i += 2) {
    ctx.lineTo(coords[i] * scaleX, coords[i + 1] * scaleY);
}
    
    ctx.closePath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
};

const clearOutline = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

// Tooltip functionality
const tooltip = document.querySelector('.tooltip-box');

const showTooltip = (data, event) => {
    tooltip.style.display = 'block';

    let nameText = '';
    let areaText = '';
    let areaTotal = 0;
    let popText = '';
    let popTotal = 0;

    if (typeof data.name === 'object' && Object.keys(data.name).length > 1) {
        // Gộp tên
        nameText = Object.values(data.name).join(' + ');

        // Diện tích
        for (const key in data.naturalArea) {
            const value = parseFloat(data.naturalArea[key].replace('.', '').replace(',', '.'));
            areaText += `<p>${data.name[key]}: ${data.naturalArea[key]}</p>`;
            areaTotal += value;
        }

        // Dân số
        for (const key in data.population) {
            const value = parseFloat(data.population[key].replace('.', '').replace(',', '.'));
            popText += `<p>${data.name[key]}: ${data.population[key]}</p>`;
            popTotal += value;
        }

        tooltip.innerHTML = `
            <h2>${nameText}</h2>
            <hr>
            <h3>DIỆN TÍCH TỰ NHIÊN (KM²)</h3>
            ${areaText}
            <p><strong>Tổng diện tích:</strong> ${areaTotal.toLocaleString('vi-VN')}</p>
            <hr>
            <h3>QUY MÔ DÂN SỐ (NGHÌN NGƯỜI)</h3>
            ${popText}
            <p><strong>Tổng dân số:</strong> ${popTotal.toLocaleString('vi-VN')}</p>
            <hr>
            <p>Tên tỉnh, thành sau sáp nhập: <span class="highlight">${data.mergedName}</span></p>
            <p>Trung tâm chính trị - hành chính: <span class="highlight">${data.center}</span></p>
        `;
    } else {
        // Trường hợp chỉ có 1 tỉnh
        tooltip.innerHTML = `
            <h2>${data.name}</h2>
            <hr>
            <h3>DIỆN TÍCH TỰ NHIÊN (KM²)</h3>
            <p>${data.name}: ${data.naturalArea}</p>
            <p><strong>Tổng diện tích:</strong> ${data.naturalArea}</p>
            <hr>
            <h3>QUY MÔ DÂN SỐ (NGHÌN NGƯỜI)</h3>
            <p>${data.name}: ${data.population}</p>
            <p><strong>Tổng dân số:</strong> ${data.population}</p>
            <hr>
        <!-- <p>Tên tỉnh, thành sau sáp nhập: <span class="highlight">${data.mergedName}</span></p>
            <p>Trung tâm chính trị - hành chính: <span class="highlight">${data.center}</span></p>
        -->
        `;
    }

    tooltip.classList.add('active');
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
};

const hideTooltip = () => {
    tooltip.classList.remove('active');
};

function setupEventListeners() {
    document.querySelectorAll('area').forEach((area, index) => {
        area.addEventListener('mouseenter', () => {
            drawOutline(areas[index].coords);
        });
        area.addEventListener('mouseleave', clearOutline);

        area.addEventListener('mouseenter', (event) => {
            showTooltip(locationsData[index], event);
        });
        area.addEventListener('mousemove', (event) => {
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY + 10}px`;
        });
        area.addEventListener('mouseleave', hideTooltip);
    });

    document.addEventListener('mousemove', (event) => {
        if (!event.target.closest('area') && !tooltip.contains(event.target)) {
            tooltip.style.display = 'none';
            tooltip.innerHTML = '';
        }
    });
}