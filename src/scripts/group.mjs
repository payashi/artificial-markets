import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

class AgentGroup extends THREE.Group {
    constructor(
        id,
        center,
        numChildren,
        {
            radius = 10,
            omega = 1,
            mode = "sphere",
            geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5),
            material = new THREE.MeshNormalMaterial()
        } = {}
    ) {
        super();
        this.center = center;
        this.numChildren = numChildren;

        // Create each child
        for (let i = 0; i < this.numChildren; i++) {
            // Generate THREE Object
            const agent = new THREE.Mesh(geometry, material);

            const thetaX = Math.random() * Math.PI * 2;
            const thetaY = Math.random() * Math.PI * 2;
            const thetaZ = Math.random() * Math.PI * 2;

            const rotation = new THREE.Matrix4();

            if (mode == 'sphere') {
                rotation.multiplyMatrices(
                    new THREE.Matrix4().makeRotationX(thetaX),
                    new THREE.Matrix4().makeRotationZ(thetaZ),
                );
            } else if (mode == 'ring') {
                rotation.multiplyMatrices(
                    new THREE.Matrix4().makeRotationY(Math.PI * 0.5 + thetaY * 0.05),
                    new THREE.Matrix4().makeRotationZ(thetaZ),
                );
            }

            const data = agent.userData;
            data.rotation = rotation;
            data.radius = radius;
            data.omega = omega;

            this.add(agent);
        }


        this.position.copy(this.center.position);
    }

    update(time) {

        // the last children are the center and the label
        for (let i = 0; i < this.numChildren; i++) {
            const agent = this.children[i];
            const data = agent.userData;

            // Direction without rotation offset
            const pos = new THREE.Vector3(
                Math.cos(data.omega * time),
                Math.sin(data.omega * time),
                0,
            ).multiplyScalar(data.radius).applyMatrix4(data.rotation);

            agent.position.set(pos.x, pos.y, pos.z);
        }

    }

    // Add labels to the markets
    addLabel(label, id) {
        // Add DOM element
        const div = document.createElement('div');
        div.className = 'label';
        div.id = id;
        div.textContent = label;

        const labelCSS = new CSS2DObject(div);
        labelCSS.position.set(0, 10, 0);
        this.add(labelCSS);
    }
}

export { AgentGroup };