import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-scene-three',
  standalone: true,
  templateUrl: './scene-three.component.html',
  styleUrl: './scene-three.component.scss',
})
export class SceneThreeComponent implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);

  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private mesh?: THREE.Mesh;
  private frameId?: number;

  private readonly onResize = (): void => {
    const hostEl = this.host.nativeElement;
    const cw = Math.max(hostEl.clientWidth, 320);
    const ch = Math.max(hostEl.clientHeight, 320);
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = cw / ch;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(cw, ch);
  };

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const hostEl = this.host.nativeElement;
    const w = Math.max(hostEl.clientWidth, 320);
    const h = Math.max(hostEl.clientHeight, 320);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0a08);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    this.camera.position.z = 3.2;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);

    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xc4a574,
      metalness: 0.2,
      roughness: 0.65,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);

    const key = new THREE.DirectionalLight(0xfff4e0, 1.1);
    key.position.set(2, 3, 4);
    this.scene.add(key);
    this.scene.add(new THREE.AmbientLight(0x6b5b45, 0.35));

    window.addEventListener('resize', this.onResize);

    this.animate();
  }

  private readonly animate = (): void => {
    this.frameId = requestAnimationFrame(this.animate);
    if (this.mesh) {
      this.mesh.rotation.x += 0.006;
      this.mesh.rotation.y += 0.01;
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.mesh?.geometry.dispose();
    const m = this.mesh?.material;
    if (m && !Array.isArray(m)) m.dispose();
    this.renderer?.dispose();
  }
}
