import { Pipe, PipeTransform } from '@angular/core';
import { resolveMediaUrl } from './resolve-media-url';

@Pipe({
  name: 'uploadSrc',
  standalone: true,
})
export class UploadSrcPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return resolveMediaUrl(value);
  }
}
