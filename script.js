var canvas, engine;

var scene = null;
var player, clickX = 0, clickZ = 0, impact;
var bombs = [];

window.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true);

    var createScene = function () {
        // Create the scene space
        scene = new BABYLON.Scene(engine);
        scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), new BABYLON.AmmoJSPlugin());

        var health = document.getElementById('health');

        createLights();
        createFloorAndCamera();
        player = createPlayer();
        bombs = createBombs();
        managerEvents(scene, player);
        animation();
        createMaker();
        createGUI();

        scene.registerBeforeRender(function () {
            castRay(player);
        });

        return scene;

    }

    function generateExplosion(where, size) {
        BABYLON.ParticleHelper.CreateAsync("explosion", scene).then((set) => {
            set.systems.forEach(s => {
                s.disposeOnStop = true;
                s.emitter = where;
                s.manualEmitCount = size;
            });
            set.start();
        });
    }

    function createLights(){
        var light1 = new BABYLON.PointLight("light", new BABYLON.Vector3(15, 10, 0), scene);
        var light2 = new BABYLON.PointLight("light", new BABYLON.Vector3(-15, 10, 0), scene);
    }

    function createFloorAndCamera(){
        var planoMaterial = new BABYLON.StandardMaterial("floor", scene);
        planoMaterial.diffuseTexture = new BABYLON.Texture("textures/floor.jpg", scene);
        planoMaterial.diffuseTexture.uScale = 4;
        planoMaterial.diffuseTexture.vScale = 4;

        var myGround = BABYLON.MeshBuilder.CreateGround("myGround", {width: 8, height: 8, subdivisions: 1}, scene);
        myGround.material = planoMaterial;
        myGround.physicsImpostor = new BABYLON.PhysicsImpostor(myGround, BABYLON.PhysicsImpostor.BoxImpostor, {
            mass: 0,
            friction: 0.5,
            restituition: 0
        });

        //Add Camera
        var camera = new BABYLON.FreeCamera("FreeCam", new BABYLON.Vector3(0, 5, 8), scene);
        camera.attachControl(canvas, true);
        camera.lockedTarget = myGround;
    }

    function createPlayer(){
        var playMaterial = new BABYLON.StandardMaterial("playMaterial", scene);
        playMaterial.ambientTexture = new BABYLON.Texture("textures/player.jpg", scene);

        var player = BABYLON.Mesh.CreateBox("myBox", 0.5, scene);
        player.checkCollisions = true;
        player.material = playMaterial;
        player.position.y = 0.25;
        player.isPickable = false;
        // player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.BoxImpostor, {
        //     mass: 1,
        //     friction: 1,
        //     restituition: 1
        // });
        return player;
    }

    function createBombs() {
        var bomb;
        var bombs = [];
        for(var i = 0; i < 3; i++) {
            bomb = BABYLON.Mesh.CreateBox(i, 0.5, scene);
            bomb.position.y = 0.25; 
            bomb.position.x = (Math.random() * (3 + 3) - 3);
            bomb.position.z = (Math.random() * (3 + 3) - 3);
            // bomb.physicsImpostor = new BABYLON.PhysicsImpostor(bomb, BABYLON.PhysicsImpostor.BoxImpostor, {
            //     mass: 1,
            //     friction: 1,
            //     restituition: 1
            // });

            var bombMaterial = new BABYLON.StandardMaterial("bombMaterial", scene);
            bombMaterial.ambientTexture = new BABYLON.Texture("textures/bomb.png", scene);
            bomb.material = bombMaterial;
            bombs.push(bomb);
        }
        return bombs;
    }

    function animation(){
        var incX = 0, incZ = 0;

        var renderLoop = function () {
            scene.render();

            if(player.position.x > clickX) {
                incX = -0.01;
            } else {
                incX = 0.01;
            }

            if(player.position.z > clickZ) {
                incZ = -0.01;
            } else {
                incZ = 0.01;
            }
            
            player.position.x += incX;
            player.position.z += incZ;
        };
        engine.runRenderLoop(renderLoop);
    }

    function createMaker(){
        impact = BABYLON.Mesh.CreateBox("impact", 0.5, scene);
        impact.material = new BABYLON.StandardMaterial("impactMat", scene);
        impact.material.diffuseTexture = new BABYLON.Texture("textures/impact.png", scene);
        impact.material.diffuseTexture.hasAlpha = true;
        impact.scaling.y = 0.1;
    }

    function mousemovef(scene, player){
        var pickResult = scene.pick(scene.pointerX, scene.pointerY);
            if(pickResult.hit){
                var diffX = pickResult.pickedPoint.x - player.position.x;
                var diffZ = pickResult.pickedPoint.z - player.position.z;
                player.rotation.y = Math.atan2(diffX, diffZ);
            }
    }

    function vecToLocal(vector, mesh){
        var m = mesh.getWorldMatrix();
        var v = BABYLON.Vector3.TransformCoordinates(vector, m);
        return v;		 
    }

    function castRay(player){       
        var origin = player.position;
        var forward = new BABYLON.Vector3(0,0,1);

        forward = vecToLocal(forward, player);

        var direction = forward.subtract(origin);
        direction = BABYLON.Vector3.Normalize(direction);

        var length = 100;

        var ray = new BABYLON.Ray(origin, direction, length);	

        var hit = scene.pickWithRay(ray);

        if (hit.pickedMesh){
            hit.pickedMesh.rotation.y += 0.01;
        }
    }

    function createGUI() {
        //Create Buttons
        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('myUI');

        var helpDiv = document.createElement("div"); 
        var helpContent = document.createTextNode("Pressione N para nomes."); 
        helpDiv.appendChild(helpContent);
        helpDiv.style.position= 'absolute';
        helpDiv.style.left= '10px';
        helpDiv.style.top= '7%';
        helpDiv.style.color = 'white';
        helpDiv.style.fontSize= '14px';
        document.body.appendChild(helpDiv); 
    }

    function managerEvents(scene, player){
        scene.onPointerDown = function (evt, pickResult){
            if(pickResult.hit && pickResult.pickedMesh.name == 'myGround'){
                if(pickResult.pickedPoint.x > -3.75 && pickResult.pickedPoint.x < 3.75 && 
                pickResult.pickedPoint.z > -3.75 && pickResult.pickedPoint.z < 3.75){
                    clickX = pickResult.pickedPoint.x;
                    clickZ = pickResult.pickedPoint.z;
                    impact.position.x = pickResult.pickedPoint.x;
                    impact.position.z = pickResult.pickedPoint.z;
                }
            }
        };

        scene.onPointerUp = function() {
            scene.registerBeforeRender(function checkHealth() {
                if(health.value == 0) {
                    health.value = 100;
                    createScene();
                }
            });

            scene.registerBeforeRender(function checkCollision() {
                if(bombs.length > 1) {
                    for(var i = 0; i < bombs.length; i++) {
                        if (player.intersectsMesh(bombs[i], false)) {
                            scene.unregisterBeforeRender(checkCollision);
                            generateExplosion(bombs[i].getAbsolutePosition(), 6);
                            health.value -= 40;
                            bombs[i].dispose();
                            bombs.splice(i, 1);
                        }
                    }
                } else {
                    if(player.intersectsMesh(bombs[0], false)) {
                        scene.unregisterBeforeRender(checkCollision);
                        generateExplosion(bombs[0].getAbsolutePosition(), 6);
                        health.value -= 40;
                        bombs[0].dispose();
                        player.dispose();
                    }
                }
            });
        };

        scene.onPointerMove = function () {
            mousemovef(scene, player);
        };

        scene.actionManager = new BABYLON.ActionManager(scene);

        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnKeyDownTrigger, function(evt){
            var key = evt.sourceEvent.key;
            key = key.toUpperCase();

            switch(key){
              case 'N': alert("Nomes:\nAlexandre Trindade Lopes Junior 171175\nAndré Chierighini 171340\nAugusto Hideki Shimizu 171026\nVinicius Henrique Cavalcanti 171911"); break;
            }
          }
        ));
    }

    scene = createScene();

    engine.runRenderLoop(function() {
        if (scene){
            scene.render();
        }
    });

    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });
});