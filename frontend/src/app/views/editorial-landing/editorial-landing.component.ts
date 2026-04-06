import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EditorialCategoriesComponent } from './editorial-categories/editorial-categories.component';
import { EditorialFooterComponent } from './editorial-footer/editorial-footer.component';
import { EditorialHeroComponent } from './editorial-hero/editorial-hero.component';
import { EditorialNavbarComponent } from './editorial-navbar/editorial-navbar.component';
import { HeritageMarqueeComponent } from './heritage-marquee/heritage-marquee.component';
import { StoreMapComponent } from './store-map/store-map.component';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-editorial-landing',
  standalone: true,
  imports: [
    EditorialNavbarComponent,
    EditorialHeroComponent,
    EditorialCategoriesComponent,
    HeritageMarqueeComponent,
    StoreMapComponent,
    EditorialFooterComponent,
  ],
  templateUrl: './editorial-landing.component.html',
  styleUrl: './editorial-landing.component.scss',
})
export class EditorialLandingComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef);
  private ctx?: gsap.Context;

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.initGsap());
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
  }

  private initGsap(): void {
    const root = this.host.nativeElement as HTMLElement;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.ctx = gsap.context(() => {
      const hero = root.querySelector('.heritage-hero') as HTMLElement | null;
      const heroPhoto = root.querySelector('.heritage-hero__photo') as HTMLElement | null;

      if (hero && heroPhoto) {
        gsap.to(heroPhoto, {
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
          y: '12%',
          ease: 'none',
        });
      }

      root.querySelectorAll('.reveal-block').forEach((blockEl, i: number) => {
        const el = blockEl as HTMLElement;
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
          x: i % 2 === 0 ? -40 : 36,
          y: 32,
          opacity: 0,
          duration: 0.95,
          ease: 'power3.out',
        });
      });

      root.querySelectorAll('.parallax-wrap').forEach((wrapEl) => {
        const wrap = wrapEl as HTMLElement;
        const img = wrap.querySelector('.img-parallax') as HTMLElement | null;
        if (!img) return;
        gsap.fromTo(
          img,
          { y: '-5%' },
          {
            y: '7%',
            ease: 'none',
            scrollTrigger: {
              trigger: wrap,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          },
        );
      });

      gsap.from('.heritage-hero__cta', {
        scrollTrigger: {
          trigger: '.heritage-hero__cta',
          start: 'top 96%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 20,
        duration: 0.85,
        ease: 'power2.out',
      });
    }, root);

    ScrollTrigger.refresh();
  }
}
