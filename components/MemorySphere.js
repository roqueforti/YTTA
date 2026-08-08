"use client";

import { useEffect, useRef, useState } from "react";
import { photos } from "@/data/photos";

export default function MemorySphere() {
  const mountRef = useRef(null);
  const runtimeRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(false);
  const [gyro, setGyro] = useState(false);
  const [quote, setQuote] = useState(null);
  const [loadingStage, setLoadingStage] = useState("MEMUAT FOTO");

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    const ambientAudio = new Audio("/audio/ambient.mp3");
    ambientAudio.loop = true;
    ambientAudio.preload = "auto";
    ambientAudio.volume = 0.45;
    const audioReady = new Promise((resolve) => {
      const finish = () => resolve();
      ambientAudio.addEventListener("canplaythrough", finish, { once: true });
      ambientAudio.addEventListener("error", finish, { once: true });
    });
    ambientAudio.load();

    async function createScene() {
      const THREE = await import("three");
      const { gsap } = await import("gsap");
      if (disposed || !mountRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 160);
      camera.rotation.order = "YXZ";
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      renderer.setSize(innerWidth, innerHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.setAttribute("aria-label", "Galeri foto 3D interaktif");
      mountRef.current.appendChild(renderer.domElement);

      const world = new THREE.Group();
      scene.add(world);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(72, 48, 32),
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          depthWrite: false,
          uniforms: { top: { value: new THREE.Color("#11162c") }, bottom: { value: new THREE.Color("#020309") } },
          vertexShader: "varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
          fragmentShader: "varying vec3 p;uniform vec3 top;uniform vec3 bottom;void main(){float h=smoothstep(-40.,55.,p.y);gl_FragColor=vec4(mix(bottom,top,h),1.);}",
        }),
      );
      scene.add(dome);

      const starGeometry = new THREE.BufferGeometry();
      const starPositions = [];
      for (let index = 0; index < 1300; index += 1) {
        const y = Math.random() * 2 - 1;
        const theta = Math.random() * Math.PI * 2;
        const side = Math.sqrt(1 - y * y);
        starPositions.push(65 * side * Math.cos(theta), 65 * y, 65 * side * Math.sin(theta));
      }
      starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
      scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xbfc9e5, size: 0.09, transparent: true, opacity: 0.72, depthWrite: false })));

      const textureLoader = new THREE.TextureLoader();
      const meshes = [];
      const textures = [];
      let loadedCount = 0;
      let sceneReady = false;
      const finishPreload = async () => {
        if (sceneReady || loadedCount !== photos.length) return;
        sceneReady = true;
        setLoadingStage("MENYIAPKAN GPU");
        setProgress(92);
        textures.forEach((texture) => renderer.initTexture?.(texture));
        await renderer.compileAsync?.(scene, camera);
        setProgress(97);
        setLoadingStage("MENYIAPKAN AUDIO");
        await Promise.race([audioReady, new Promise((resolve) => window.setTimeout(resolve, 5000))]);
        if (disposed) return;
        setProgress(100);
        setLoadingStage("SIAP");
        window.setTimeout(() => setLoaded(true), 350);
      };
      const reportLoaded = () => {
        loadedCount += 1;
        const value = Math.round((loadedCount / photos.length) * 90);
        setProgress(value);
        finishPreload();
      };

      photos.forEach((item, index) => {
        textureLoader.load(item.image, (texture) => {
          if (disposed) return;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          textures.push(texture);
          const ratio = texture.image.width / texture.image.height;
          const width = ratio >= 1 ? 5.8 : 4.2;
          const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.84, side: THREE.DoubleSide });
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / ratio), material);
          const y = 1 - (index / (photos.length - 1)) * 2;
          const radial = Math.sqrt(1 - y * y);
          const theta = Math.PI * (3 - Math.sqrt(5)) * index;
          const home = new THREE.Vector3(Math.cos(theta) * radial, y, Math.sin(theta) * radial).multiplyScalar(30);
          mesh.position.copy(home);
          mesh.lookAt(0, 0, 0);
          mesh.rotateY(Math.PI);
          mesh.userData = { item, index, home };
          world.add(mesh);
          meshes.push(mesh);
          reportLoaded();
        }, undefined, reportLoaded);
      });

      let yaw = 0;
      let pitch = 0;
      let dragging = false;
      let pointerX = 0;
      let pointerY = 0;
      let moved = false;
      let active = null;
      let cycleTimer;
      let enteredRuntime = false;
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

      const clearSpotlight = () => {
        if (!active) return;
        const old = active;
        active = null;
        // Rejoin the rotating sphere while preserving the photo's current
        // world transform, then blend it back into its Fibonacci position.
        world.attach(old);
        gsap.to(old.position, { x: old.userData.home.x, y: old.userData.home.y, z: old.userData.home.z, duration: 1.5, ease: "power2.inOut" });
        gsap.to(old.scale, { x: 1, y: 1, z: 1, duration: 1.5, ease: "power2.inOut" });
        meshes.forEach((mesh) => gsap.to(mesh.material, { opacity: 0.84, duration: 1 }));
        setQuote(null);
      };

      const pointCamera = (direction) => {
        const nextYaw = Math.atan2(-direction.x, -direction.z);
        const nextPitch = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1));
        const rotation = { yaw, pitch };
        gsap.to(rotation, { yaw: nextYaw, pitch: nextPitch, duration: 1.4, ease: "power2.inOut", onUpdate: () => { yaw = rotation.yaw; pitch = rotation.pitch; } });
      };

      const spotlight = (mesh) => {
        if (!enteredRuntime || active === mesh) return;
        clearTimeout(cycleTimer);
        clearSpotlight();
        active = mesh;
        // Read the actual direction after sphere rotation, then detach the
        // selected photo so the background can keep moving independently.
        world.updateMatrixWorld(true);
        const worldDirection = mesh.getWorldPosition(new THREE.Vector3()).normalize();
        scene.attach(mesh);
        const spotlightTarget = worldDirection.clone().multiplyScalar(7);
        pointCamera(worldDirection);
        meshes.forEach((photoMesh) => gsap.to(photoMesh.material, { opacity: photoMesh === mesh ? 1 : 0.22, duration: 1 }));
        gsap.to(mesh.position, { x: spotlightTarget.x, y: spotlightTarget.y, z: spotlightTarget.z, duration: 1.7, ease: "power3.inOut" });
        gsap.to(mesh.scale, { x: 1.65, y: 1.65, z: 1.65, duration: 1.7, ease: "power3.inOut" });
        setQuote({ ...mesh.userData.item, index: mesh.userData.index });
        cycleTimer = window.setTimeout(() => { clearSpotlight(); cycleTimer = window.setTimeout(nextSpotlight, 2200); }, 6500);
      };

      function nextSpotlight() {
        if (!enteredRuntime || dragging || !meshes.length) {
          cycleTimer = window.setTimeout(nextSpotlight, 2000);
          return;
        }
        const index = active ? (active.userData.index + 1) % meshes.length : Math.floor(Math.random() * meshes.length);
        spotlight(meshes[index]);
      }

      const onPointerDown = (event) => { dragging = true; moved = false; pointerX = event.clientX; pointerY = event.clientY; renderer.domElement.setPointerCapture(event.pointerId); };
      const onPointerMove = (event) => {
        if (!dragging) return;
        const deltaX = event.clientX - pointerX;
        const deltaY = event.clientY - pointerY;
        moved ||= Math.abs(deltaX) + Math.abs(deltaY) > 5;
        yaw -= deltaX * 0.0033;
        pitch = THREE.MathUtils.clamp(pitch - deltaY * 0.0033, -1.35, 1.35);
        pointerX = event.clientX;
        pointerY = event.clientY;
      };
      const onPointerUp = (event) => {
        dragging = false;
        if (moved) return;
        pointer.set((event.clientX / innerWidth) * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(meshes)[0];
        if (hit) spotlight(hit.object);
      };
      const onResize = () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); };
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerup", onPointerUp);
      addEventListener("resize", onResize);

      let animationFrame;
      const animate = () => {
        animationFrame = requestAnimationFrame(animate);
        if (enteredRuntime && !dragging && !reducedMotion) {
          // Keep the background alive during spotlight, but slow it slightly
          // so the foreground remains calm and readable.
          world.rotation.y += active ? 0.0001 : 0.00018;
        }
        camera.rotation.y = yaw;
        camera.rotation.x = pitch;
        renderer.render(scene, camera);
      };
      animate();

      runtimeRef.current = {
        enter: () => { enteredRuntime = true; cycleTimer = window.setTimeout(nextSpotlight, 3500); },
        setOrientation: (alpha, beta) => { yaw = THREE.MathUtils.degToRad(-alpha); pitch = THREE.MathUtils.clamp(THREE.MathUtils.degToRad(beta - 90), -1.35, 1.35); },
        audio: ambientAudio,
      };

      cleanup = () => {
        clearTimeout(cycleTimer);
        cancelAnimationFrame(animationFrame);
        gsap.globalTimeline.clear();
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("pointerup", onPointerUp);
        removeEventListener("resize", onResize);
        scene.traverse((object) => { object.geometry?.dispose(); if (object.material) { object.material.map?.dispose(); object.material.dispose(); } });
        renderer.dispose();
        renderer.domElement.remove();
        ambientAudio.pause();
        ambientAudio.removeAttribute("src");
        ambientAudio.load();
      };
    }
    createScene();
    return () => { disposed = true; cleanup(); };
  }, []);

  const enterExperience = () => {
    setEntered(true);
    runtimeRef.current?.enter();
    runtimeRef.current?.audio?.play().catch(() => {});
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (runtimeRef.current?.audio) runtimeRef.current.audio.muted = next;
  };

  const enableGyro = async () => {
    const Orientation = window.DeviceOrientationEvent;
    if (!Orientation) return;
    if (typeof Orientation.requestPermission === "function" && (await Orientation.requestPermission()) !== "granted") return;
    const handler = (event) => event.alpha != null && runtimeRef.current?.setOrientation(event.alpha, event.beta);
    addEventListener("deviceorientation", handler);
    setGyro(true);
  };

  return (
    <main className="sphere-page">
      <div ref={mountRef} className="experience" />
      <section className={`screen ${loaded ? "is-hidden" : ""}`} aria-live="polite">
        <div className="loader-copy"><span className="eyebrow">YTTA ARCHIVE</span><h1>Gathering<br /><em>the memories</em></h1><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="progress-meta"><span>{loadingStage}</span><span>{progress}%</span></div></div>
      </section>
      <section className={`screen entry ${!loaded || entered ? "is-hidden" : ""}`}><div className="entry-stars" /><div className="entry-copy"><span className="eyebrow">A COLLECTION OF US</span><h1>Every memory<br /><em>has a gravity.</em></h1><p>Masuk ke ruang kecil berisi cerita yang pernah kita bagi.</p><button className="enter-btn" onClick={enterExperience}><span>Masuk ke sphere</span><i>↗</i></button></div><p className="entry-hint">Gunakan headphone untuk pengalaman terbaik</p></section>
      <header className={`hud ${!entered ? "is-hidden" : ""}`}><span className="brand"><strong>YTTA</strong><small>MEMORY SPHERE</small></span><div className="hud-actions"><button className="icon-btn gyro" onClick={enableGyro}>{gyro ? "GYRO ON" : "GYRO"}</button><button className="icon-btn" onClick={toggleMute} aria-label={muted ? "Nyalakan musik" : "Matikan musik"}>{muted ? "◖×" : "◖))"}</button></div></header>
      <aside className={`quote-card ${quote ? "visible" : ""}`}><span>{quote && `${String(quote.index + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`}</span><blockquote>{quote && `“${quote.quote}”`}</blockquote><p>{quote?.title}</p></aside>
      <div className={`instructions ${!entered ? "is-hidden" : ""}`}>↔ &nbsp; Drag untuk melihat · Klik foto untuk mendekat</div>
      <div className="vignette" />
    </main>
  );
}
