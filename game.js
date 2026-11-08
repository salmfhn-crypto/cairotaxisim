let stats = { money: 150, speed: 0, hunger: 100, thirst: 100, energy: 100 };
let scene, camera, renderer, car, road;
let keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

let carPhysics = {
    velocity: 0,
    maxSpeed: 3.0, // سرعة واقعية للإلنترا تناسب الـ 3D
    acceleration: 0.04,
    deceleration: 0.015,
    braking: 0.09,
    angle: 0,
    turnSpeed: 0.03
};

function startGame() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    
    startVitalsSimulation();
    init3DOnlineEngine();
    setupControls();
    animateGame();
    
    showZoneChange("📍 بداية الجولة الأونلاين: شوارع مدينة جمصة الساحلية");
}

function init3DOnlineEngine() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a252f); // جو الغروب الهادئ
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    // إضاءة واقعية
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(10, 20, 15).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x555555));

    // رسم أسفلت طريق جمصة الدولي السريع الممتد
    const roadGeometry = new THREE.PlaneGeometry(30, 5000); 
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.7 });
    road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    // تجميع مجسم الهيونداي إلنترا
    car = new THREE.Group();

    // جسم السيارة الأساسي
    const bodyGeom = new THREE.BoxGeometry(1.8, 0.6, 4.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f2027, metalness: 0.8, roughness: 0.2 });
    const carBody = new THREE.Mesh(bodyGeom, bodyMat);
    carBody.position.y = 0.4;
    car.add(carBody);

    // الصالون والزجاج
    const cabinGeom = new THREE.BoxGeometry(1.5, 0.55, 2.4);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111, transparent: true, opacity: 0.8 });
    const carCabin = new THREE.Mesh(cabinGeom, cabinMat);
    carCabin.position.set(0, 0.9, -0.2);
    car.add(carCabin);

    // جنوط وعجلات إلنترا واقعية
    const wheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.45, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    
    const wheelPositions = [
        [-0.95, 0.38, 1.3],  
        [0.95, 0.38, 1.3],   
        [-0.95, 0.38, -1.3], 
        [0.95, 0.38, -1.3]   
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        car.add(wheel);
    });

    scene.add(car);
    updateCamera();
}

function setupControls() {
    window.addEventListener('keydown', (e) => { if(e.key in keys) keys[e.key] = true; });
    window.addEventListener('keyup', (e) => { if(e.key in keys) keys[e.key] = false; });
}

function animateGame() {
    requestAnimationFrame(animateGame);

    if (keys.ArrowUp) {
        carPhysics.velocity += carPhysics.acceleration;
        if (carPhysics.velocity > carPhysics.maxSpeed) carPhysics.velocity = carPhysics.maxSpeed;
    } else if (keys.ArrowDown) {
        carPhysics.velocity -= carPhysics.braking;
        if (carPhysics.velocity < -0.6) carPhysics.velocity = -0.6;
    } else {
        if (carPhysics.velocity > 0) carPhysics.velocity -= carPhysics.deceleration;
        if (carPhysics.velocity < 0) carPhysics.velocity += carPhysics.deceleration;
        if (Math.abs(carPhysics.velocity) < 0.01) carPhysics.velocity = 0;
    }

    if (Math.abs(carPhysics.velocity) > 0.1) {
        const turnModifier = carPhysics.velocity > 0 ? 1 : -1;
        if (keys.ArrowLeft) carPhysics.angle += carPhysics.turnSpeed * turnModifier;
        if (keys.ArrowRight) carPhysics.angle -= carPhysics.turnSpeed * turnModifier;
    }

    car.position.z += Math.cos(carPhysics.angle) * carPhysics.velocity;
    car.position.x += Math.sin(carPhysics.angle) * carPhysics.velocity;
    car.rotation.y = carPhysics.angle;

    stats.speed = Math.abs(carPhysics.velocity) * 45;

    // تشغيل يافطات المسافة الحقيقية بناءً على إحداثيات الـ 3D الأونلاين
    checkRoadZonesOnline(car.position.z);

    updateCamera();
    updateHUDValues();
    renderer.render(scene, camera);
}

function checkRoadZonesOnline(zPos) {
    // حساب المسافة المقطوعة الفريال
    if (zPos > 150 && zPos < 160) showZoneChange("🛣️ دخلت الآن: طريق جمصة - المنصورة الدولي السريع");
    if (zPos > 500 && zPos < 510) {
        showZoneChange("📸 فلاش! رادار سرعة التقطك على السريع (-50 جنيه)");
        stats.money = 100;
    }
}

function updateCamera() {
    if (!car) return;
    const offset = new THREE.Vector3(-Math.sin(carPhysics.angle) * 7, 3.0, -Math.cos(carPhysics.angle) * 7);
    camera.position.copy(car.position).add(offset);
    camera.lookAt(car.position);
}

function startVitalsSimulation() {
    setInterval(() => {
        if(stats.hunger > 0) stats.hunger -= 0.1;
        if(stats.thirst > 0) stats.thirst -= 0.15;
    }, 1000);
}

function updateHUDValues() {
    document.getElementById('hunger-bar').style.width = stats.hunger + '%';
    document.getElementById('thirst-bar').style.width = stats.thirst + '%';
    document.getElementById('current-speed').innerText = Math.round(stats.speed);
    document.getElementById('wallet-display').innerText = `💰 الفلوس: ${stats.money} جنيه`;
}

function showZoneChange(text) {
    const notificationBox = document.getElementById('zone-notification');
    const notificationText = document.getElementById('zone-text');
    notificationText.innerText = text;
    notificationBox.classList.remove('hidden');
    setTimeout(() => { notificationBox.classList.add('hidden'); }, 4000);
}

