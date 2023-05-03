import * as THREE from 'three';

export const createGroup = (
    center,
    numChildren,
    {
        radius = 10,
        omega = 1,
        mode = "sphere",
        geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5),
        material = new THREE.MeshNormalMaterial()
    } = {}
) => {
    let group = new THREE.Group();

    // Create each child
    for (let i = 0; i < numChildren; i++) {
        const agentGroup = new THREE.Group();
        // Generate THREE Object
        let agent = new THREE.Mesh(geometry, material);

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

        const agentData = agent.userData;
        agentData.rotation = rotation;
        agentData.radius = radius;
        agentData.omega = omega;

        agentGroup.add(agent);
        const buyLine = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 6 })
        );
        const sellLine = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0x428af5, linewidth: 6 })
        );
        agentGroup.add(buyLine);
        agentGroup.add(sellLine);

        group.add(agentGroup);
    }

    group.add(center);
    group.position.copy(center.position);
    center.position.set(0, 0, 0);

    return group;
}

export const updateGroup = (group, time) => {

    // the last children are the center and the label
    const numChildren = group.children.length - 2;

    for (let i = 0; i < numChildren; i++) {
        const agent = group.children[i].children[0];
        const agentData = agent.userData;

        // Direction without rotation offset
        const pos = new THREE.Vector3(
            Math.cos(agentData.omega * time),
            Math.sin(agentData.omega * time),
            0,
        ).multiplyScalar(agentData.radius).applyMatrix4(agentData.rotation);

        agent.position.set(pos.x, pos.y, pos.z);
    }

}