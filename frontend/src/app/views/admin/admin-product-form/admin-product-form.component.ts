import { Component, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { CatalogProduct } from '../../../core/catalog/catalog-product.model';
import { ProductCatalogService } from '../../../core/catalog/product-catalog.service';
import { resolveMediaUrl } from '../../../core/media/resolve-media-url';
import { PRODUCT_CATEGORIES, type ProductCategory, sizesForCategory } from '../admin-product-taxonomy';
import { EMPTY, catchError, distinctUntilChanged, finalize, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.scss',
})
export class AdminProductFormComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly catalog = inject(ProductCatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly categories = [...PRODUCT_CATEGORIES];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    category: [this.categories[0], [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    description: ['', [Validators.maxLength(2000)]],
    variants: this.fb.array<FormGroup>([]),
  });

  /** Edit mode: gallery from server until replaced by a new upload (relative paths OK for save). */
  initialGalleryUrls: string[] = [];
  editProductId: number | null = null;
  loadError = false;
  loadingProduct = false;

  submitted = false;
  saving = false;
  saveError = '';
  imageError = '';
  pendingFiles: File[] = [];
  previewUrls: string[] = [];
  private fileDragDepth = 0;
  fileDropActive = false;

  constructor() {
    this.addVariantRow();
    this.form.controls.category.valueChanges.subscribe(() => this.normalizeVariantSizes());

    this.route.paramMap
      .pipe(
        map((pm) => {
          const raw = pm.get('id');
          const n = raw ? Number(raw) : NaN;
          return Number.isFinite(n) && n >= 1 ? n : null;
        }),
        distinctUntilChanged(),
        switchMap((id) => {
          if (id == null) {
            this.editProductId = null;
            this.loadError = false;
            this.resetFormForCreate();
            this.loadingProduct = false;
            return EMPTY;
          }
          this.editProductId = id;
          this.loadingProduct = true;
          this.loadError = false;
          this.initialGalleryUrls = [];
          return this.catalog.getById(id).pipe(
            catchError((err) => {
              console.error('Load product failed', err);
              this.loadError = true;
              return EMPTY;
            }),
            finalize(() => {
              this.loadingProduct = false;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((p) => {
        try {
          this.bindProductToForm(p);
        } catch (e) {
          console.error('Bind product form failed', e);
          this.loadError = true;
        }
      });
  }

  ngOnDestroy(): void {
    this.revokePreviews();
  }

  get isEdit(): boolean {
    return this.editProductId != null;
  }

  get variants(): FormArray<FormGroup> {
    return this.form.controls.variants;
  }

  previewDisplayUrls(): string[] {
    if (this.previewUrls.length) {
      return this.previewUrls;
    }
    return this.initialGalleryUrls.map((u) => resolveMediaUrl(u));
  }

  sizeOptionsForRow(): string[] {
    return sizesForCategory(this.form.controls.category.getRawValue());
  }

  addVariantRow(): void {
    const sizes = sizesForCategory(this.form.controls.category.getRawValue());
    const fallbackSize = sizes[0] ?? '';
    let size = fallbackSize;
    let color = '';
    let stock = 0;

    if (this.variants.length > 0) {
      const last = this.variants.at(this.variants.length - 1).getRawValue() as {
        size: string;
        color: string;
        stock: number;
      };
      size = sizes.includes(last.size) ? last.size : fallbackSize;
      color = last.color ?? '';
      const n = Number(last.stock);
      stock = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }

    this.variants.push(
      this.fb.nonNullable.group({
        size: [size, Validators.required],
        color: [color, [Validators.required, Validators.maxLength(64)]],
        stock: [stock, [Validators.required, Validators.min(0)]],
      }),
    );
  }

  removeVariant(index: number): void {
    if (this.variants.length <= 1) return;
    this.variants.removeAt(index);
  }

  private normalizeVariantSizes(): void {
    const allowed = sizesForCategory(this.form.controls.category.getRawValue());
    const first = allowed[0] ?? '';
    for (const ctrl of this.variants.controls) {
      const sizeCtrl = ctrl.get('size');
      const cur = sizeCtrl?.value as string;
      if (!cur || !allowed.includes(cur)) {
        sizeCtrl?.setValue(first);
      }
    }
  }

  private resetFormForCreate(): void {
    this.revokePreviews();
    this.pendingFiles = [];
    this.previewUrls = [];
    this.initialGalleryUrls = [];
    this.submitted = false;
    this.saveError = '';
    this.imageError = '';
    const cat = this.categories[0];
    this.form.reset({
      name: '',
      category: cat,
      price: 0,
      description: '',
    });
    while (this.variants.length) {
      this.variants.removeAt(0);
    }
    this.addVariantRow();
  }

  private bindProductToForm(p: CatalogProduct): void {
    const urls =
      p.imageUrls && p.imageUrls.length > 0
        ? [...p.imageUrls]
        : p.imageUrl
          ? [p.imageUrl]
          : [];
    this.initialGalleryUrls = urls;
    const cat: ProductCategory = (this.categories as readonly string[]).includes(p.category)
      ? (p.category as ProductCategory)
      : this.categories[0];
    this.form.patchValue({
      name: p.name,
      category: cat,
      price: p.price,
      description: p.description ?? '',
    });
    while (this.variants.length) {
      this.variants.removeAt(0);
    }
    const vars = p.variants?.length ? p.variants : [{ size: '', color: '', stock: 0 }];
    for (const v of vars) {
      const sizes = sizesForCategory(cat);
      const sz = sizes.includes(v.size) ? v.size : sizes[0] ?? '';
      const stock = Math.max(0, Math.floor(Number(v.stock ?? 0)));
      this.variants.push(
        this.fb.nonNullable.group({
          size: [sz, Validators.required],
          color: [String(v.color ?? ''), [Validators.required, Validators.maxLength(64)]],
          stock: [stock, [Validators.required, Validators.min(0)]],
        }),
      );
    }
    this.normalizeVariantSizes();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.ingestFiles(input.files);
    input.value = '';
  }

  onFileDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.fileDragDepth++;
    if (event.dataTransfer?.types?.includes('Files')) {
      this.fileDropActive = true;
    }
  }

  onFileDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.fileDragDepth = Math.max(0, this.fileDragDepth - 1);
    if (this.fileDragDepth === 0) {
      this.fileDropActive = false;
    }
  }

  onFileDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.fileDragDepth = 0;
    this.fileDropActive = false;
    this.ingestFiles(event.dataTransfer?.files ?? null);
  }

  private ingestFiles(list: FileList | null): void {
    this.imageError = '';
    if (!list?.length) return;
    const next: File[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list.item(i);
      if (f && f.type.startsWith('image/')) next.push(f);
    }
    if (next.length > 12) {
      this.imageError = 'You can upload at most 12 images.';
      return;
    }
    if (next.length === 0 && list.length > 0) {
      this.imageError = 'Only image files are accepted.';
      return;
    }
    this.pendingFiles = next;
    this.revokePreviews();
    this.previewUrls = this.pendingFiles.map((f) => URL.createObjectURL(f));
  }

  clearImages(): void {
    this.pendingFiles = [];
    this.revokePreviews();
    this.imageError = '';
  }

  private revokePreviews(): void {
    for (const u of this.previewUrls) {
      try {
        URL.revokeObjectURL(u);
      } catch {
        /* ignore */
      }
    }
    this.previewUrls = [];
  }

  private imageUrlsForSave(): string[] | null {
    if (this.pendingFiles.length > 0) {
      return null;
    }
    if (this.initialGalleryUrls.length > 0) {
      return [...this.initialGalleryUrls];
    }
    return [];
  }

  submit(): void {
    this.submitted = true;
    this.saveError = '';
    this.imageError = '';
    const needsNewUpload = this.pendingFiles.length > 0;
    const hasExistingGallery = this.initialGalleryUrls.length > 0;
    if (!needsNewUpload && !hasExistingGallery) {
      this.imageError = 'Add at least one product photo.';
    }
    if (this.form.invalid || (!needsNewUpload && !hasExistingGallery)) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const variantRows = v.variants.map((row) => ({
      size: String(row['size']).trim(),
      color: String(row['color']).trim(),
      stock: Math.floor(Number(row['stock'])),
    }));
    if (variantRows.some((r) => !r.size || !r.color || r.stock < 0)) {
      this.form.markAllAsTouched();
      return;
    }

    const runSave = (urls: string[]) => {
      const payload = {
        name: v.name.trim(),
        category: v.category.trim(),
        price: Number(v.price),
        description: v.description.trim(),
        imageUrls: urls,
        variants: variantRows,
      };
      const done = {
        next: () => {
          this.saving = false;
          void this.router.navigateByUrl('/admin/dashboard');
        },
        error: () => {
          this.saving = false;
          this.saveError = 'Could not save the product. Is the API running?';
        },
      };
      if (this.editProductId != null) {
        this.catalog.updateProduct(this.editProductId, payload).subscribe(done);
      } else {
        this.catalog.createProduct(payload).subscribe(done);
      }
    };

    this.saving = true;
    const existing = this.imageUrlsForSave();
    if (existing != null) {
      runSave(existing);
      return;
    }
    this.catalog.uploadProductImages(this.pendingFiles).subscribe({
      next: (urls) => {
        if (!urls.length) {
          this.saving = false;
          this.saveError = 'Upload returned no URLs.';
          return;
        }
        runSave(urls);
      },
      error: () => {
        this.saving = false;
        this.saveError = 'Image upload failed. Is the API running?';
      },
    });
  }
}
