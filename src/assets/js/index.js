let cameraFar = 200;

let yOffset = -45;

let firstTexture;
let INITIAL_MAP = [];
let stella;
let tombstones;
let pedestals;
let parterres;
let parterresModelLeft;
let theModel;
let loader = new THREE.OBJLoader();
const scene = new THREE.Scene();
let geometry = new THREE.BufferGeometry();
const PLAY_SCENE = document.getElementById("playpause");
let isDesktop = window.innerWidth > 1024;

let firstSize3DModel = {};

window.addEventListener("resize", () => {
    isDesktop = window.innerWidth > 1024;
});

const BACKGROUND_COLOR = 0xe1e1e1;

// Загрузка первай текстуры
firstTexture = loadTexture("src/assets/models/texture.jpg");
firstTexture.shininess = 10;
INITIAL_MAP = [
    {childID: "stella", mtl: firstTexture},
    {childID: "tombstones", mtl: firstTexture},
    {childID: "pedestals", mtl: firstTexture},
    {childID: "parterres", mtl: firstTexture},
];
// загрузка моделей для одиночного памятника и дефолтного состояния двойного памятника
stella = loadModel("./src/assets/models/stella.obj", "stella");
tombstones = loadModel("./src/assets/models/tombstones.obj", "tombstones");
pedestals = loadModel("./src/assets/models/pedestals.obj", "pedestals");
parterres = loadModel("./src/assets/models/parterrest.obj", "parterres");

theModel = stella;

// Инициируем сцену
const canvas = document.querySelector("#canvas");

// Инициируем рендерер
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});

renderer.shadowMap.enabled = true;

renderer.shadowMapSoft = false;

renderer.setPixelRatio(window.devicePixelRatio);

// Устанавливаем цвет фона и с помощью тумана сглаживаем уровень пола
scene.background = new THREE.Color(BACKGROUND_COLOR);

// Добавляем камеру
let camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 50, cameraFar);

function loadTexture(texture) {
    let txt = new THREE.TextureLoader().load(texture);

    txt.wrapS = THREE.RepeatWrapping;
    txt.wrapT = THREE.RepeatWrapping;

    set_mtl = new THREE.MeshPhongMaterial({
        map: txt,
        shininess: 10
        // wireframe: true,
    });

    return set_mtl
}

function loadModel(path, nameModel) {
    let objModel;

    loader.load(
        path,
        (obj) => {
            objModel = obj;

            objModel.name = nameModel;
            objModel.children[0].name = nameModel;
            objModel.position.y = yOffset;

            // Добавление теней
            objModel.traverse((o) => {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                }
            });

            for (let object of INITIAL_MAP) {
                initColor(objModel, object.childID, object.mtl);
            }

            firstSize3DModel[nameModel] = getBoundaryGeometry(objModel, nameModel);
            scene.add(objModel)
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );
}

function getBoundaryGeometry(obj, name) {
    let modelBoundingBox;

    modelBoundingBox = new THREE.Box3().setFromObject(obj);
    modelBoundingBox.size = {};
    modelBoundingBox.size.x = modelBoundingBox.max.x - modelBoundingBox.min.x;
    modelBoundingBox.size.y = modelBoundingBox.max.y - modelBoundingBox.min.y;
    modelBoundingBox.size.z = modelBoundingBox.max.z - modelBoundingBox.min.z;

    return modelBoundingBox;
}

// Функция - добавление текстур к моделям.
function initColor(parent, type, mtl) {
    parent.traverse((o) => {
        if (o.isMesh) {
            if (o.name.includes(type)) {
                o.material = mtl;
                o.nameID = type; // Установить новое свойство для идентификации этого объекта
            }
        }
    });
}

// Добавляем свет
const directionalLightScale = 30;
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.castShadow = true;
directionalLight.name = "directionalLight";
directionalLight.position.set(-100, 150, 50);
directionalLight.target.position.set(25, 10, 0);

directionalLight.shadow.camera.scale.x = directionalLightScale;
directionalLight.shadow.camera.scale.y = directionalLightScale;
directionalLight.shadow.camera.scale.z = directionalLightScale;

scene.add(directionalLight);

directionalLight.shadow.mapSize.width = 1024; // default
directionalLight.shadow.mapSize.height = 1024; // default
directionalLight.shadow.camera.near = 0.5; // default
directionalLight.shadow.camera.far = 500; // default

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight2.castShadow = false;
directionalLight2.name = "directionalLight2";
directionalLight2.position.set(0, 30, 10);
directionalLight2.target.position.set(0, 30, -9999);

directionalLight2.shadow.camera.scale.x = directionalLightScale;
directionalLight2.shadow.camera.scale.y = directionalLightScale;
directionalLight2.shadow.camera.scale.z = directionalLightScale;

scene.add(directionalLight2);
scene.add(directionalLight2.target);

directionalLight2.shadow.mapSize.width = 1024; // default
directionalLight2.shadow.mapSize.height = 1024; // default
directionalLight2.shadow.camera.near = 0.5; // default
directionalLight2.shadow.camera.far = 500; // default

// Свет полушария
let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
hemiLight.position.set(0, 500, 0);
hemiLight.name = "hemiLight";
// Добовляем свет полушария к сцене
scene.add(hemiLight);

// Добовляем пол
let floorGeometry = new THREE.PlaneGeometry(512, 512, 1, 1);
let floorMaterial = new THREE.MeshPhongMaterial({
    color: 0x7a7a7a,
    shininess: 0,
    opacity: 0.4,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
});

let floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -0.5 * Math.PI;
floor.receiveShadow = true;
floor.position.y = yOffset - 1;
floor.name = "floor";
scene.add(floor);

// Добовляем элементы управления
let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.minPolarAngle = Math.PI / 3;
controls.enableDamping = true;
controls.enablePan = false; // изменение камеры на правую кнопук мыщши
controls.dampingFactor = 0.1;
controls.autoRotate = false; // Включите, если хотите, чтоб объект автоматически поворачивался
controls.autoRotateSpeed = 0.5; // (дефолт 1)
controls.rotateSpeed = 0.2; // скорость вращения модели мышью (дефолт 1)
controls.minDistance = 30;
controls.maxDistance = 400;

function animate() {
    controls.update();
    if (isDesktop) {
        requestAnimationFrame(animate);
    } else {
        setTimeout(function () {
            requestAnimationFrame(animate);
        }, 1000 / 30);
    }
    renderer.render(scene, camera);

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

//   if (theModel != null) {
//     initialRotation();
//     // DRAG_NOTICE.classList.add("start");
//   }
}

animate();

// автоизменение размера окна
function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let canvasPixelWidth = canvas.width / window.devicePixelRatio;
    let canvasPixelHeight = canvas.height / window.devicePixelRatio;

    const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

// Выбор опции для изменения цвета
function selectOption(monumentElement) {
    for (let child of scene.children) {
        if (child.children[0] == undefined) {

        } else if (monumentElement == child.children[0].name) {
            theModel = child.children[0];
        }
    }
}

function setMaterial(parent, type, mtl) {
    parent.traverse((o) => {
        if (o.isMesh && o.nameID != null) {
            if (o.name == type) {
                o.material = mtl;
            }
        }
    });
}

// Фукция прокручивания при открытии
let initRotate = 0;

function initialRotation() {
    initRotate++;
    if (initRotate <= 130) {
        scene.rotation.y += Math.PI / 60;
    }
}

// старт / стоп поворот сцены
if (PLAY_SCENE) {
    PLAY_SCENE.addEventListener("change", (e) => {
        e.preventDefault();

        controls.autoRotate = !controls.autoRotate;
    });
}
